/* GLOBAL v8: lot page (auction/lot.html#LOT_ID). Bidding itself happens on the live platform. */
(function () {
  "use strict";
  var G = window.GM, V = window.V8, esc = G.esc, I = V.I;
  V.initChrome();
  function $(id) { return document.getElementById(id); }
  var id = decodeURIComponent((location.hash || "").slice(1)) || new URLSearchParams(location.search).get("lot");
  var C = 2 * Math.PI * 96, timer = null, poll = null;

  function notFound() {
    $("crumb").textContent = "ლოტი ვერ მოიძებნა";
    $("gal").innerHTML = "";
    $("bid").innerHTML = '<h1>ლოტი ვერ მოიძებნა</h1><p class="muted" style="margin-top:10px">შესაძლოა აუქციონი დასრულდა.</p><a class="btn btn--ink btn--block" href="index.html#lots">ყველა ლოტი</a>';
  }
  function title(l) { return [l.year, l.brand, l.model].filter(Boolean).join(" "); }
  function phase(l) {
    var now = Date.now(), turn = new Date(l.turn_at || l.starts_at).getTime(), end = new Date(l.ends_at || l.turn_at || l.starts_at).getTime();
    if (now >= end && l.ends_at) return "done";
    if (now >= turn) return "live";
    return "wait";
  }
  function gallery(shots, t) {
    if (!shots.length) { $("gal").innerHTML = '<div class="lgal__main" style="display:grid;place-items:center;color:var(--mute)">ფოტო არ არის</div>'; return; }
    var th = shots.slice(1, 7);
    $("gal").innerHTML = '<button class="lgal__main" type="button" data-i="0" aria-label="ფოტოების ნახვა"><img src="' + esc(G.thumb(shots[0], 1600)) + '" alt="' + esc(t) + '" fetchpriority="high"></button>' +
      '<div class="lgal__thumbs">' + th.map(function (s, i) { var last = i === th.length - 1 && shots.length > 7; return '<button type="button" data-i="' + (i + 1) + '" aria-label="ფოტო ' + (i + 2) + '"><img src="' + esc(G.thumb(s, 400)) + '" alt="" loading="lazy">' + (last ? '<span class="more">ყველა · ' + shots.length + "</span>" : "") + "</button>"; }).join("") + "</div>";
    $("gal").onclick = function (e) { var b = e.target.closest("[data-i]"); if (b) V.lightbox(shots, +b.dataset.i, t); };
  }
  function ring(frac, big, small, wait) {
    return '<div class="ring' + (wait ? " ring--wait" : "") + '"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="bg" cx="100" cy="100" r="96"/><circle class="fg" id="ringFg" cx="100" cy="100" r="96" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - frac)).toFixed(1) + '"/></svg><div class="ring__t"><b id="ringB" class="num">' + big + '</b><span id="ringS">' + small + "</span></div></div>";
  }
  function bidPanel(l) {
    var live = V.LIVE + "auctions.html?lot=" + encodeURIComponent(l.id), ph = phase(l), price = l.current_cents || l.starting_cents;
    var buyOpen = l.buy_now_cents && (!l.buy_now_until || new Date(l.buy_now_until) > new Date()) && ph === "wait";
    var turn = l.turn_at || l.starts_at;
    var head = '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><span class="label num">ლოტი ' + esc(l.id) + (l.vin_tail ? " · VIN …" + esc(l.vin_tail) : "") + "</span>" + (ph === "live" ? '<span class="live"><i></i>მიმდინარეობს</span>' : "") + "</div>" +
      "<h1>" + esc(title(l)) + "</h1>";
    var clock = ph === "live" ? ring(1, "1:00", "წამი", false) + '<p class="bid__note">ბოლო წუთში ყოველი ბიდი დროს ისევ 1:00-ზე აბრუნებს.</p>'
      : ph === "done" ? ring(0, "0:00", "დასრულდა", true) + '<p class="bid__note">ლოტი დასრულდა. შედეგი ლაივ საიტზე ჩანს.</p>'
      : ring(1, "", "დაწყებამდე", true) + '<p class="bid__note">' + esc(V.when(turn)) + "</p>";
    $("bid").innerHTML = head + clock +
      '<div class="bid__price"><span class="label">' + (l.current_cents ? "მიმდინარე ფასი" : "საწყისი ფასი") + '</span><b class="num" id="bidPrice">' + V.usdC(price) + '</b><p class="num" id="bidMeta">' + (l.bid_count || 0) + " ბიდი · ბიჯი " + V.usdC(l.step_cents) + " · დეპოზიტი 500 ₾</p></div>" +
      (ph === "done" ? '<a class="btn btn--line btn--block btn--lg" href="index.html#lots">შემდეგი ლოტები</a>' :
        '<a class="btn btn--ink btn--block btn--lg" href="' + live + '" id="bidBtn">ბიდი · ' + V.usdC(l.next_cents || price) + "</a>" +
        (buyOpen ? '<a class="btn btn--line btn--block btn--lg" href="' + live + '">ახლავე ყიდვა · ' + V.usdC(l.buy_now_cents) + "</a>" : "") +
        '<p class="label" style="margin-top:14px;text-align:center">ბიდი იდება Global Market-ის ანგარიშიდან. <a class="link" href="https://globalmarket.ge/auction.html#register">რეგისტრაცია</a></p>');
    clearInterval(timer);
    if (ph === "wait") {
      var t0 = new Date(turn).getTime();
      var tick = function () {
        var s = Math.max(0, Math.floor((t0 - Date.now()) / 1000)), d = Math.floor(s / 86400);
        $("ringB").textContent = (d ? d + " დღე" : V.pad(Math.floor(s % 86400 / 3600)) + ":" + V.pad(Math.floor(s % 3600 / 60)));
        $("ringS").textContent = d ? V.pad(Math.floor(s % 86400 / 3600)) + ":" + V.pad(Math.floor(s % 3600 / 60)) + ":" + V.pad(s % 60) + " · დაწყებამდე" : V.pad(s % 60) + " წამი · დაწყებამდე";
        if (s <= 0) refresh();
      };
      tick(); timer = setInterval(tick, 1000);
    } else if (ph === "live") {
      var tickLive = function () {
        var end = new Date(l.ends_at).getTime(), s = Math.max(0, (end - Date.now()) / 1000);
        $("ringB").textContent = Math.floor(s / 60) + ":" + V.pad(Math.floor(s % 60));
        var fg = $("ringFg"); if (fg) fg.setAttribute("stroke-dashoffset", (C * (1 - Math.min(1, s / 60))).toFixed(1));
        if (s <= 0) refresh();
      };
      tickLive(); timer = setInterval(tickLive, 250);
    }
  }
  function facts(l, car) {
    var c = car || {}, vs = c.vin_spec || {};
    var rows = [["წელი", l.year], ["გარბენი", G.num(l.mileage_km) != null ? G.n(l.mileage_km) + " კმ" : V.km(c)], ["ძრავი", V.eng(c)], ["სიმძლავრე", c.engine_hp ? c.engine_hp + " ც.ძ." : ""], ["საწვავი", G.tv(c.fuel)], ["გადაცემათა კოლოფი", G.tv(c.transmission)],
      ["ამძრავი", G.tv(c.drive)], ["ძარა", G.tv(c.body_type)], ["ფერი", G.tv(c.color)], ["კომპლექტაცია", vs.trim], ["განბაჟება", G.tv(c.customs)], ["მდებარეობა", G.tv(c.location)], ["VIN", c.vin || (l.vin_tail ? "…" + l.vin_tail : "")]]
      .filter(function (r) { return r[1] != null && String(r[1]).trim() !== ""; });
    var bids = (l.bids || []).slice().sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
    var prices = '<dl class="specs" style="grid-template-columns:1fr"><div><dt>საწყისი ფასი</dt><dd class="num">' + V.usdC(l.starting_cents) + "</dd></div>" + (l.current_cents ? '<div><dt>მიმდინარე ფასი</dt><dd class="num">' + V.usdC(l.current_cents) + "</dd></div>" : "") + '<div><dt>შემდეგი ბიდი</dt><dd class="num">' + V.usdC(l.next_cents) + '</dd></div><div><dt>ბიჯი</dt><dd class="num">' + V.usdC(l.step_cents) + "</dd></div><div><dt>დეპოზიტი</dt><dd>500 ₾</dd></div>" + (l.buy_now_cents ? '<div><dt>ახლავე ყიდვა</dt><dd class="num">' + V.usdC(l.buy_now_cents) + (l.buy_now_until ? " · " + esc(V.when(l.buy_now_until)) + "-მდე" : "") + "</dd></div>" : "") + "</dl>";
    $("left").innerHTML = '<section class="dsec"><h2>მახასიათებლები</h2><dl class="specs">' + rows.map(function (r) { return "<div><dt>" + r[0] + "</dt><dd" + (r[0] === "VIN" ? ' class="num"' : "") + ">" + esc(r[1]) + "</dd></div>"; }).join("") + "</dl></section>" +
      '<section class="dsec"><h2>ფასები</h2>' + prices + "</section>" +
      '<section class="dsec"><h2>ბიდები' + (bids.length ? " · " + bids.length : "") + "</h2>" + (bids.length ? '<ul class="bids num">' + bids.slice(0, 12).map(function (b) { return "<li><span>" + esc(b.alias || "მონაწილე") + "</span><b>" + V.usdC(b.amount_cents) + "</b><span>" + esc(G.tbilisiDate(b.at) + ", " + G.tbilisiTime(b.at)) + "</span></li>"; }).join("") + "</ul>" : '<p class="muted">ბიდი ჯერ არ არის. ბიდის დადება აუქციონის დაწყებამდეც შეიძლება.</p>') + "</section>" +
      '<section class="dsec"><h2>როგორ მიმდინარეობს ლოტი</h2><p style="max-width:66ch">ლოტი 1 წუთი გრძელდება. ბოლო წუთში ყოველი ახალი ბიდი დროს ისევ 1 წუთზე აბრუნებს, სანამ ბიდები არ შეწყდება. ბიჯი ამ ლოტზე: ' + V.usdC(l.step_cents) + ". გამარჯვებული იხდის 3 სამუშაო დღეში, 500 ₾ დეპოზიტი ფასში ითვლება.</p>" +
      (car ? '<p style="margin-top:20px"><a class="link" href="../car.html#' + encodeURIComponent(car.id) + '">ავტომობილის ბარათი მარკეტზე' + I.go + "</a></p>" : "") + "</section>";
  }

  var CUR = null, CAR = null;
  function refresh() {
    G.rpc("auction_public_lots").then(function (lots) {
      var l = (lots || []).filter(function (x) { return String(x.id) === String(id); })[0];
      if (!l) return;
      var changed = !CUR || l.current_cents !== CUR.current_cents || l.ends_at !== CUR.ends_at || l.bid_count !== CUR.bid_count || phase(l) !== phase(CUR);
      CUR = l;
      if (changed) { bidPanel(l); facts(l, CAR); }
      schedulePoll();
    }).catch(schedulePoll);
  }
  function schedulePoll() {
    clearTimeout(poll);
    if (!CUR) return;
    var ph = phase(CUR), toTurn = new Date(CUR.turn_at || CUR.starts_at).getTime() - Date.now();
    if (ph === "live") poll = setTimeout(refresh, 5000);
    else if (ph === "wait" && toTurn < 10 * 60 * 1000) poll = setTimeout(refresh, 15000);
  }

  if (!id) return notFound();
  Promise.all([G.loadLots(), G.loadCars().catch(function () { return []; })]).then(function (r) {
    var lots = r[0] || [], l = lots.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!l) return notFound();
    var cars = {}; (r[1] || []).forEach(function (c) { cars[c.id] = c; });
    CUR = l; CAR = cars[l.car_id] || null;
    var t = title(l);
    document.title = t + " · ლოტი " + l.id + " · Global Auction";
    $("crumb").textContent = "ლოტი " + l.id;
    gallery(V.lotPhotos(l, CAR), t);
    bidPanel(l); facts(l, CAR); schedulePoll();
    var now = Date.now(), turn = new Date(l.turn_at || l.starts_at);
    var nxt = lots.filter(function (x) { return x !== l && new Date(x.ends_at || x.starts_at).getTime() > now && new Date(x.turn_at || x.starts_at) >= turn; }).sort(function (a, b) { return new Date(a.turn_at || a.starts_at) - new Date(b.turn_at || b.starts_at); }).slice(0, 10);
    if (nxt.length) { $("next").innerHTML = nxt.map(function (x) { return V.lotCard(x, cars[x.car_id]); }).join(""); $("nPrev").innerHTML = I.left; $("nNext").innerHTML = I.right; $("nextSec").hidden = false; V.wireRow($("next"), $("nPrev"), $("nNext")); }
  }).catch(notFound);
  window.addEventListener("hashchange", function () { location.reload(); });
})();
