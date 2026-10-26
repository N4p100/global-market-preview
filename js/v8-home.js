/* GLOBAL v8: market home. Hero slides of real cars, categories, recent, services, transit, auction teaser. */
(function () {
  "use strict";
  var G = window.GM, V = window.V8, esc = G.esc, I = V.I, B = V.BASE;
  V.initChrome();
  function $(id) { return document.getElementById(id); }

  /* Hero: scenes are generated around these real cars; captions come from the live record. */
  var SLIDES = [
    { id: 203, img: "hero-taycan", pos: "62% 50%" },
    { id: 95, img: "hero-etron", pos: "64% 50%" },
    { id: 221, img: "hero-x5", pos: "70% 50%" },
    { id: 145, img: "hero-crown", pos: "58% 50%" }
  ];
  var DUR = 7000;

  function hero(byId) {
    var list = SLIDES.filter(function (s) { var c = byId[s.id]; return c && !G.isSold(c); });
    if (!list.length) list = [SLIDES[0]];
    var root = $("hero"), body = root.querySelector(".hero__body"), cur = 0, timer = null, paused = false;
    var first = root.querySelector('[data-slide="0"]');
    list.forEach(function (s, i) {
      if (i === 0) { first.querySelector("img").style.objectPosition = s.pos; return; }
      var d = document.createElement("div");
      d.className = "hero__slide"; d.dataset.slide = i;
      d.innerHTML = '<picture><source media="(max-width: 860px)" srcset="' + B + "assets/v8/" + s.img + '-m.jpg"><img src="' + B + "assets/v8/" + s.img + '.jpg" alt="" loading="lazy" style="object-position:' + s.pos + '"></picture>';
      root.insertBefore(d, body);
    });
    var bars = $("heroBars");
    bars.style.setProperty("--n", list.length);
    bars.style.setProperty("--dur", DUR + "ms");
    bars.innerHTML = list.map(function (s, i) { var c = byId[s.id]; return '<button type="button" role="tab" data-go="' + i + '" aria-current="' + (i === 0) + '" aria-label="' + esc(c ? G.title(c) : "") + '">' + esc(c ? [c.brand, c.model].join(" ") : "") + "</button>"; }).join("");
    function cap(i) {
      var c = byId[list[i].id];
      if (!c) { $("heroCap").innerHTML = ""; return; }
      $("heroCap").innerHTML = '<a class="t" href="' + V.carHref(c) + '">' + esc(G.title(c)) + "<small class=\"num\">" + esc([G.priceUsd(c), G.isTransit(c) ? "გზაშია" : ""].filter(Boolean).join(" · ")) + '</small></a><a class="round round--photo" href="' + V.carHref(c) + '" aria-label="' + esc(G.title(c)) + '">' + I.go + "</a>";
    }
    function go(i) {
      var slides = root.querySelectorAll(".hero__slide");
      cur = (i + list.length) % list.length;
      slides.forEach(function (s, k) { s.classList.toggle("is-on", k === cur); if (k === cur) { var im = s.querySelector("img"); im.loading = "eager"; } });
      bars.querySelectorAll("button").forEach(function (b, k) { b.setAttribute("aria-current", k === cur ? "true" : "false"); });
      var on = bars.querySelector('[aria-current="true"]');
      if (on) { on.style.animation = "none"; void on.offsetWidth; on.style.animation = ""; }
      cap(cur);
      schedule();
    }
    function schedule() { clearTimeout(timer); if (!paused && !V.reduce && list.length > 1) timer = setTimeout(function () { go(cur + 1); }, DUR); }
    bars.addEventListener("click", function (e) { var b = e.target.closest("[data-go]"); if (b) go(+b.dataset.go); });
    function pause(p) { paused = p; root.classList.toggle("is-paused", p); if (p) clearTimeout(timer); else schedule(); }
    root.addEventListener("mouseenter", function () { pause(true); });
    root.addEventListener("mouseleave", function () { pause(false); });
    root.addEventListener("focusin", function () { pause(true); });
    root.addEventListener("focusout", function () { pause(false); });
    document.addEventListener("visibilitychange", function () { pause(document.hidden); });
    var sx = null;
    root.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    root.addEventListener("touchend", function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1)); sx = null; });
    go(0);
  }

  /* Categories: each tile shows a real inventory photo from that category. */
  function tiles(live) {
    var used = {};
    var cats = [
      { n: "ჯიპი", href: "cars.html?body=" + encodeURIComponent("ჯიპი"), f: function (c) { return c.body_type === "ჯიპი"; } },
      { n: "სედანი", href: "cars.html?body=" + encodeURIComponent("სედანი"), f: function (c) { return c.body_type === "სედანი"; } },
      { n: "ჰიბრიდი", href: "cars.html?fuel=" + encodeURIComponent("ჰიბრიდი"), f: function (c) { return c.fuel === "ჰიბრიდი"; } },
      { n: "ელექტრო", href: "cars.html?fuel=" + encodeURIComponent("ელექტრო"), f: function (c) { return c.fuel === "ელექტრო"; } },
      { n: "გზაში", href: "cars.html?loc=transit", f: G.isTransit }
    ];
    $("tiles").innerHTML = cats.map(function (k, i) {
      var list = live.filter(k.f);
      if (!list.length) return "";
      var pick = list.filter(function (c) { return G.photos(c).length >= 3 && !used[c.id]; }).sort(function (a, b) { return (G.num(b.price_usd) || 0) - (G.num(a.price_usd) || 0); })[0] || list[0];
      used[pick.id] = 1;
      var p = G.photos(pick)[0];
      return '<a class="tile rv rv-d' + (i % 3) + '" href="' + B + k.href + '">' + (p ? '<img src="' + esc(G.thumb(p, i < 2 ? 1400 : 900)) + '" alt="" loading="lazy" decoding="async">' : "") +
        '<span class="tile__n">' + esc(k.n) + '</span><span class="tile__c num">' + list.length + ' ავტომობილი</span><span class="round round--photo" aria-hidden="true">' + I.go + "</span></a>";
    }).join("");
    $("catLead").textContent = live.length + " ავტომობილი თბილისში და გზაში.";
    V.reveal($("tiles"));
  }

  function services(live) {
    var ready = live.filter(function (c) { return !G.isRestore(c) && !G.isTransit(c); });
    var daily = ready.map(G.leaseDaily).filter(Boolean).sort(function (a, b) { return a - b; })[0];
    if (daily) $("svLease").innerHTML = G.n(daily) + " ₾<small>დღეში, ყველაზე დაბალი გადასახადი ახლა</small>";
    var ex = live.filter(function (c) { return c.exchange_available; }), war = live.filter(G.hasWarranty);
    $("svEx").innerHTML = ex.length + "<small>ავტომობილი გაცვლით</small>";
    $("svWar").innerHTML = war.length + "<small>ავტომობილი გარანტიით</small>";
    function photoOf(list, skip) { var c = list.filter(function (x) { return G.photos(x).length >= 4 && skip.indexOf(x.id) === -1; }).sort(function (a, b) { return (G.num(b.price_usd) || 0) - (G.num(a.price_usd) || 0); })[0]; return c; }
    var a = photoOf(ready.filter(function (c) { var u = G.num(c.price_usd); return u && u < 25000; }), []), b = photoOf(ex.filter(function (c) { return !G.isRestore(c); }), [a && a.id]), w = photoOf(war, [a && a.id, b && b.id]);
    [a, b, w].forEach(function (c, i) { var img = $("svImg" + i); if (!c) { img.parentElement.style.background = "var(--sf)"; return; } img.src = G.thumb(G.photos(c)[0], 1200); img.alt = G.title(c); });
  }

  function transit(live) {
    var tr = live.filter(G.isTransit).sort(function (a, b) { return new Date(a.arrival_date || "2100-01-01") - new Date(b.arrival_date || "2100-01-01"); });
    if (!tr.length) return;
    $("trN").innerHTML = tr.length + "<small>ავტომობილი გზაში</small>";
    $("trRow").innerHTML = tr.map(function (c) { return V.carCard(c, { eta: true }); }).join("");
    $("trPrev").innerHTML = I.left; $("trNext").innerHTML = I.right;
    $("transit").hidden = false;
    V.wireRow($("trRow"), $("trPrev"), $("trNext"));
    V.reveal($("transit"));
  }

  function auction(lots) {
    var now = Date.now(), THEME = { "ოთხშაბათი": "გზაში საქართველოსკენ", "ხუთშაბათი": "აღდგენილი ავტომობილები", "პარასკევი": "დაზიანებული ავტომობილები" };
    var up = lots.filter(function (l) { return new Date(l.ends_at || l.starts_at).getTime() > now; });
    if (!up.length) return;
    function at(l) { return l.session_at || l.starts_at; }
    function key(iso) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tbilisi" }).format(new Date(iso)); }
    var groups = {}; up.forEach(function (l) { var k = key(at(l)); (groups[k] = groups[k] || []).push(l); });
    var keys = Object.keys(groups).sort(), first = groups[keys[0]][0];
    $("auT").textContent = V.wd(at(first)) + ", " + G.tbilisiTime(at(first)) + ".";
    $("auLead").textContent = up.length + " ლოტი " + keys.length + " სესიაში. ყოველი ლოტი 1 წუთი გრძელდება.";
    $("fSess").textContent = keys.length;
    V.countdown($("auClock"), new Date(at(first)).getTime(), "მიმდინარეობს");
    $("auSess").innerHTML = keys.map(function (k) { var g = groups[k], wdn = V.wd(at(g[0])); return '<a href="' + B + "auction/index.html?day=" + k + '#lots"><span>' + esc(wdn + ", " + G.tbilisiDate(at(g[0]))) + "<br><small>" + esc(THEME[wdn] || "ავტომობილები") + '</small></span><small class="num">' + g.length + " ლოტი</small></a>"; }).join("");
    $("auction").hidden = false;
    V.reveal($("auction"));
  }

  /* gentle parallax on the chapter photo, one rAF per scroll */
  (function () {
    var img = document.querySelector("[data-parallax]"); if (!img || V.reduce) return;
    var t = false;
    function on() { t = false; var r = img.parentElement.getBoundingClientRect(), vh = innerHeight; if (r.bottom < 0 || r.top > vh) return; var p = (r.top + r.height / 2 - vh / 2) / vh; img.style.transform = "translate3d(0," + (p * -6).toFixed(2) + "%,0)"; }
    addEventListener("scroll", function () { if (!t) { t = true; requestAnimationFrame(on); } }, { passive: true }); on();
  })();

  $("newRow").innerHTML = V.skel(4);
  $("newPrev").innerHTML = I.left; $("newNext").innerHTML = I.right;
  Promise.all([G.loadCars(), G.loadLots()]).then(function (r) {
    var all = r[0] || [], byId = {};
    G.indexLots(r[1]);
    all.forEach(function (c) { byId[c.id] = c; });
    var live = all.filter(function (c) { return !G.isSold(c); });
    hero(byId);
    $("heroLead").textContent = live.length + " ავტომობილი თბილისში და გზაში, რეალური ფოტოებით, VIN კოდით და ფასით.";
    $("heroAll").firstChild.textContent = live.length + " ავტომობილის ნახვა";
    $("fCars").textContent = live.length;
    tiles(live);
    var recent = live.filter(function (c) { return G.photos(c).length >= 5 && !G.isTransit(c); }).sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); }).slice(0, 10);
    $("newRow").innerHTML = recent.map(function (c) { return V.carCard(c); }).join("");
    V.wireRow($("newRow"), $("newPrev"), $("newNext"));
    services(live);
    transit(live);
    auction(r[1] || []);
  }).catch(function () {
    hero({});
    $("newRow").innerHTML = '<div class="empty"><h3>მონაცემები ვერ ჩაიტვირთა</h3><p>შეამოწმეთ ინტერნეტი და სცადეთ ხელახლა.</p><button class="btn btn--ink" type="button" onclick="location.reload()">ხელახლა ცდა</button></div>';
  });
})();
