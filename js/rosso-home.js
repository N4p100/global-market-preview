/* GLOBAL rosso: home. B&W hero with featured car, statement, brand list, red auction block, stock wall, services, transit. */
(function () {
  "use strict";
  var G = window.GM, V = window.V8, esc = G.esc, I = V.I, B = V.BASE;
  V.initChrome();
  function $(id) { return document.getElementById(id); }
  var LIVE = [];

  function featured(live) {
    var f = live.filter(function (c) { return G.isVip(c) && G.photos(c).length >= 3; }).sort(function (a, b) { return (G.num(b.price_usd) || 0) - (G.num(a.price_usd) || 0); })[0] || live[0];
    if (!f) return;
    $("hCard").href = V.carHref(f); $("hCardImg").src = G.thumb(G.photos(f)[0], 900); $("hCardImg").alt = G.title(f);
    $("hCardT").textContent = G.title(f) + " · " + (G.priceUsd(f) || G.priceGel(f));
    if (!G.isVip(f)) $("hCard").querySelector(".tag").remove();
  }

  function brands(live) {
    var m = {}; live.forEach(function (c) { if (c.brand) (m[c.brand] = m[c.brand] || []).push(c); });
    var list = Object.keys(m).sort(function (a, b) { return m[b].length - m[a].length; }).slice(0, 8);
    $("brands").innerHTML = list.map(function (b, i) { return '<a href="' + B + "cars.html?brand=" + encodeURIComponent(b) + '" data-b="' + esc(b) + '"' + (i === 0 ? ' class="is-on"' : "") + ">" + esc(b) + '<small class="num">' + m[b].length + "</small></a>"; }).join("");
    var box = $("brImg"), cur = "", timer = null, idx = 0;
    function show(b) {
      if (b === cur) return; cur = b;
      $("brands").querySelectorAll("a").forEach(function (a) { a.classList.toggle("is-on", a.dataset.b === b); });
      var car = m[b].filter(function (c) { return G.photos(c).length; }).sort(function (x, y) { return (G.num(y.price_usd) || 0) - (G.num(x.price_usd) || 0); })[0];
      box.href = B + "cars.html?brand=" + encodeURIComponent(b);
      if (car) {
        var old = box.querySelector("img"), n = new Image(); n.alt = G.title(car); n.src = G.thumb(G.photos(car)[0], 1200); n.className = "out"; box.appendChild(n);
        n.onload = function () { if (cur !== b) { n.remove(); return; } n.classList.remove("out"); $("brCap").innerHTML = "<b>" + esc(G.title(car)) + '</b><span class="num">' + esc(G.priceUsd(car) || G.priceGel(car)) + "</span>"; box.querySelectorAll("img").forEach(function (o) { if (o !== n) { o.classList.add("out"); setTimeout(function () { o.remove(); }, 450); } }); };
      }
    }
    $("brands").addEventListener("mouseover", function (e) { var a = e.target.closest("[data-b]"); if (a) { clearInterval(timer); show(a.dataset.b); } });
    $("brands").addEventListener("focusin", function (e) { var a = e.target.closest("[data-b]"); if (a) { clearInterval(timer); show(a.dataset.b); } });
    show(list[0]);
    if (!V.reduce) timer = setInterval(function () { idx = (idx + 1) % list.length; show(list[idx]); }, 2600);
  }

  var WF = [["", "ყველა"], ["ge", "საქართველოში"], ["transit", "გზაში"], ["ჯიპი", "ჯიპი"], ["სედანი", "სედანი"], ["eco", "ჰიბრიდი და ელექტრო"]], wf = "";
  function wall() {
    var list = LIVE.filter(function (c) {
      if (!G.photos(c).length) return false;
      if (wf === "ge") return !G.isTransit(c); if (wf === "transit") return G.isTransit(c);
      if (wf === "eco") return c.fuel === "ჰიბრიდი" || c.fuel === "ელექტრო"; if (wf) return c.body_type === wf; return true;
    }).sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
    $("wN").textContent = list.length;
    $("wall").innerHTML = list.slice(0, 36).map(function (c) { return '<a href="' + V.carHref(c) + '">' + '<img src="' + esc(G.thumb(G.photos(c)[0], 480)) + '" alt="' + esc(G.title(c)) + '" loading="lazy" decoding="async">' + (G.isVip(c) ? "<i></i>" : "") + "<span><b>" + esc(G.title(c)) + '</b><em class="num" style="font-style:normal">' + esc(G.priceUsd(c) || G.priceGel(c) || "") + "</em></span></a>"; }).join("");
    $("wF").querySelectorAll(".chip").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.v === wf ? "true" : "false"); });
    var q = wf === "ge" || wf === "transit" ? "?loc=" + wf : wf === "eco" ? "?fuel=" + encodeURIComponent("ჰიბრიდი") : wf ? "?body=" + encodeURIComponent(wf) : "";
    $("wAll").href = B + "cars.html" + q;
  }

  function auction(lots) {
    if (!lots.length) return;
    var THEME = { "ოთხშაბათი": "გზაში საქართველოსკენ", "ხუთშაბათი": "აღდგენილი ავტომობილები", "პარასკევი": "დაზიანებული ავტომობილები" };
    function at(l) { return l.session_at || l.starts_at; }
    function key(iso) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tbilisi" }).format(new Date(iso)); }
    var g = {}; lots.forEach(function (l) { var k = key(at(l)); (g[k] = g[k] || []).push(l); });
    var keys = Object.keys(g).sort(), first = g[keys[0]][0];
    $("auWhen").textContent = "შემდეგი სესია: " + V.wd(at(first)) + ", " + G.tbilisiTime(at(first)) + ". " + lots.length + " ლოტი, ყოველი 1 წუთი.";
    V.countdown($("auClock"), new Date(at(first)).getTime(), "მიმდინარეობს");
    $("auSess").innerHTML = keys.map(function (k) { var l = g[k][0], w = V.wd(at(l)); return '<a href="' + B + "auction/index.html?day=" + k + '#lots"><span><b>' + esc(w + ", " + G.tbilisiDate(at(l))) + "</b><small>" + esc(THEME[w] || "ავტომობილები") + '</small></span><span class="n num">' + g[k].length + "</span></a>"; }).join("");
    $("auction").hidden = false;
  }

  $("wF").innerHTML = WF.map(function (x) { return '<button type="button" class="chip" data-v="' + x[0] + '" aria-pressed="false">' + x[1] + "</button>"; }).join("");
  $("wF").addEventListener("click", function (e) { var b = e.target.closest("[data-v]"); if (b) { wf = b.dataset.v; wall(); } });
  $("trPrev").innerHTML = I.left; $("trNext").innerHTML = I.right;
  Promise.all([G.loadCars(), G.loadLots()]).then(function (r) {
    var all = r[0] || [], now = Date.now();
    G.indexLots(r[1]);
    LIVE = all.filter(function (c) { return !G.isSold(c); });
    $("hN").textContent = LIVE.length;
    featured(LIVE); brands(LIVE); wall();
    auction((r[1] || []).filter(function (l) { return new Date(l.ends_at || l.starts_at).getTime() > now; }));
    var tr = LIVE.filter(G.isTransit).sort(function (a, b) { return (G.photos(b).length > 0) - (G.photos(a).length > 0) || new Date(a.arrival_date || "2100-01-01") - new Date(b.arrival_date || "2100-01-01"); });
    if (tr.length) { $("trRow").innerHTML = tr.map(function (c) { return V.carCard(c, { eta: true, noWarranty: true }); }).join(""); $("transit").hidden = false; V.wireRow($("trRow"), $("trPrev"), $("trNext")); }
    V.reveal();
  }).catch(function () { $("wall").innerHTML = '<div class="empty"><h3>მონაცემები ვერ ჩაიტვირთა</h3><button class="btn btn--red" type="button" onclick="location.reload()">ხელახლა ცდა</button></div>'; });
})();
