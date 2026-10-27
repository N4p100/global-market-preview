/* GLOBAL noir: home. Hero slides, statement + live numbers, one-car showroom, tiles, service tiles, auction, rails. */
(function () {
  "use strict";
  var G = window.GM, V = window.V8, esc = G.esc, I = V.I, B = V.BASE, A = window.V8_ASSET || B;
  V.initChrome();
  function $(id) { return document.getElementById(id); }
  var SLIDES = [{ id: 203, img: "hero-taycan", pos: "62% 50%" }, { id: 95, img: "hero-etron", pos: "64% 50%" }, { id: 221, img: "hero-x5", pos: "70% 50%" }, { id: 145, img: "hero-crown", pos: "58% 50%" }];
  var DUR = 7000;
  function nm(c) { return [c.brand, c.model].filter(Boolean).join(" "); }

  /* 1 — hero */
  function hero(byId) {
    var list = SLIDES.filter(function (s) { var c = byId[s.id]; return c && !G.isSold(c); }); if (!list.length) return;
    var root = $("hero"), body = root.querySelector(".lhero__b"), cur = 0, timer = null, paused = false;
    root.querySelector('[data-s="0"] img').style.objectPosition = list[0].pos;
    list.slice(1).forEach(function (s, i) { var d = document.createElement("div"); d.className = "lhero__s"; d.dataset.s = i + 1; d.innerHTML = '<picture><source media="(max-width: 860px)" srcset="' + A + "assets/v8/" + s.img + '-m.jpg"><img src="' + A + "assets/v8/" + s.img + '.jpg" alt="" loading="lazy" style="object-position:' + s.pos + '"></picture>'; root.insertBefore(d, body); });
    var bars = $("hBars"); bars.style.setProperty("--dur", DUR + "ms");
    bars.innerHTML = list.map(function (s, i) { return '<button type="button" role="tab" data-go="' + i + '" aria-current="' + (i === 0) + '" aria-label="' + esc(nm(byId[s.id])) + '"></button>'; }).join("");
    function show(i) {
      cur = (i + list.length) % list.length; var c = byId[list[cur].id];
      root.querySelectorAll(".lhero__s").forEach(function (s, k) { s.classList.toggle("is-on", k === cur); if (k === cur) s.querySelector("img").loading = "eager"; });
      bars.querySelectorAll("button").forEach(function (b, k) { b.setAttribute("aria-current", k === cur ? "true" : "false"); });
      var on = bars.querySelector('[aria-current="true"]'); on.style.animation = "none"; void on.offsetWidth; on.style.animation = "";
      $("hK").textContent = [c.year, G.isVip(c) ? "Super VIP" : "", G.isTransit(c) ? "გზაში" : ""].filter(Boolean).join(" · ");
      $("hName").textContent = nm(c);
      $("hSub").textContent = [G.priceUsd(c), V.km(c), G.tv(c.fuel)].filter(Boolean).join(" · ");
      $("hGo").href = V.carHref(c);
      clearTimeout(timer); if (!paused && !V.reduce) timer = setTimeout(function () { show(cur + 1); }, DUR);
    }
    bars.addEventListener("click", function (e) { var b = e.target.closest("[data-go]"); if (b) show(+b.dataset.go); });
    function pause(p) { paused = p; root.classList.toggle("is-paused", p); $("hPause").setAttribute("aria-label", p ? "გაგრძელება" : "პაუზა"); $("hPause").innerHTML = p ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5l12 7-12 7z"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>'; if (p) clearTimeout(timer); else show(cur); }
    $("hPause").addEventListener("click", function () { pause(!paused); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) clearTimeout(timer); else if (!paused) show(cur); });
    var sx = null; root.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    root.addEventListener("touchend", function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); sx = null; });
    show(0);
  }

  /* 2 — showroom */
  function showroom(live) {
    var pool = live.filter(function (c) { return G.photos(c).length >= 5 && !G.isRestore(c); }).sort(function (a, b) { return (G.isVip(b) - G.isVip(a)) || (G.num(b.price_usd) || 0) - (G.num(a.price_usd) || 0); }).slice(0, 6);
    if (!pool.length) return; var cur = 0, img = $("shImg");
    $("shPrev").innerHTML = I.left; $("shNext").innerHTML = I.right;
    $("shTabs").innerHTML = pool.map(function (c, i) { return '<button type="button" role="tab" data-i="' + i + '">' + esc(nm(c)) + "</button>"; }).join("");
    function set(i) {
      cur = (i + pool.length) % pool.length; var c = pool[cur], ls = G.lease(c);
      $("shK").textContent = [c.year, G.isVip(c) ? "Super VIP" : V.loc(c)].filter(Boolean).join(" · ");
      $("shName").textContent = nm(c);
      var old = img.querySelector("img"), n = new Image(); n.alt = G.title(c); n.src = G.thumb(G.photos(c)[0], 1600);
      n.className = "out"; img.appendChild(n); n.onload = function () { n.classList.remove("out"); if (old) { old.classList.add("out"); setTimeout(function () { old.remove(); }, 500); } };
      img.href = V.carHref(c);
      $("shMeta").innerHTML = "<span>" + esc([V.km(c), G.tv(c.fuel), G.tv(c.drive)].filter(Boolean).join(" · ")) + "</span><b>" + esc(G.priceUsd(c) || G.priceGel(c)) + "</b>" + (ls ? "<span>ლიზინგით " + G.n(ls.daily) + " ₾ დღეში</span>" : "") + '<a class="btn btn--red" href="' + V.carHref(c) + '">დეტალურად' + I.go + "</a>";
      $("shTabs").querySelectorAll("button").forEach(function (b, k) { b.setAttribute("aria-current", k === cur ? "true" : "false"); });
    }
    $("shPrev").onclick = function () { set(cur - 1); }; $("shNext").onclick = function () { set(cur + 1); };
    $("shTabs").addEventListener("click", function (e) { var b = e.target.closest("[data-i]"); if (b) set(+b.dataset.i); });
    set(0);
  }

  /* 3 — tiles */
  function tiles(live) {
    var used = {}, list = [
      ["ჯიპი", "body=" + encodeURIComponent("ჯიპი"), function (c) { return c.body_type === "ჯიპი"; }],
      ["სედანი", "body=" + encodeURIComponent("სედანი"), function (c) { return c.body_type === "სედანი"; }],
      ["ჰიბრიდი და ელექტრო", "", function (c) { return c.fuel === "ჰიბრიდი" || c.fuel === "ელექტრო"; }],
      ["გზაში", "loc=transit", G.isTransit]
    ];
    $("tiles").innerHTML = list.map(function (k, i) {
      var l = live.filter(k[2]); if (!l.length) return "";
      var pick = l.filter(function (c) { return G.photos(c).length >= 3 && !used[c.id]; }).sort(function (a, b) { return (G.num(b.price_usd) || 0) - (G.num(a.price_usd) || 0); })[0] || l[0];
      used[pick.id] = 1; var p = G.photos(pick)[0];
      var href = k[1] ? B + "cars.html?" + k[1] : B + "cars.html?fuel=" + encodeURIComponent("ჰიბრიდი");
      return '<a class="ftile rv" href="' + href + '">' + (p ? '<img src="' + esc(G.thumb(p, 1400)) + '" alt="" loading="lazy">' : "") + '<div><small class="num">' + l.length + " ავტომობილი</small><b>" + k[0] + "</b><span>ნახვა<i>" + I.right + "</i></span></div></a>";
    }).join("");
    V.reveal($("tiles"));
  }

  function auction(lots) {
    if (!lots.length) return;
    var THEME = { "ოთხშაბათი": "გზაში საქართველოსკენ", "ხუთშაბათი": "აღდგენილი ავტომობილები", "პარასკევი": "დაზიანებული ავტომობილები" };
    function at(l) { return l.session_at || l.starts_at; }
    function key(iso) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tbilisi" }).format(new Date(iso)); }
    var g = {}; lots.forEach(function (l) { var k = key(at(l)); (g[k] = g[k] || []).push(l); });
    var keys = Object.keys(g).sort(), first = g[keys[0]][0];
    $("auWhen").textContent = "შემდეგი სესია: " + V.wd(at(first)) + ", " + G.tbilisiTime(at(first));
    $("auSub").textContent = lots.length + " ლოტი " + keys.length + " სესიაში. ყოველი ლოტი 1 წუთი გრძელდება. მონაწილეობისთვის საჭიროა რეგისტრაცია და 500 ₾ დეპოზიტი.";
    $("svAuc").textContent = lots.length + " ლოტი ამ კვირაში. ყოველი ლოტი 1 წუთი გრძელდება.";
    V.countdown($("auClock"), new Date(at(first)).getTime(), "მიმდინარეობს");
    $("auSess").innerHTML = keys.map(function (k) { var l = g[k][0], w = V.wd(at(l)); return '<a href="' + B + "auction/index.html?day=" + k + '#lots"><span><b>' + esc(w + ", " + G.tbilisiDate(at(l))) + "</b><small>" + esc(THEME[w] || "ავტომობილები") + '</small></span><small class="num">' + g[k].length + " ლოტი</small></a>"; }).join("");
    $("auction").hidden = false; V.reveal($("auction"));
  }

  var line = $("msLine");
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { line.classList.add("in"); o.disconnect(); } }).observe(line); else line.classList.add("in");

  $("neRow").innerHTML = V.skel(4);
  $("nePrev").innerHTML = I.left; $("neNext").innerHTML = I.right; $("trPrev").innerHTML = I.left; $("trNext").innerHTML = I.right;
  Promise.all([G.loadCars(), G.loadLots()]).then(function (r) {
    var all = r[0] || [], byId = {}, now = Date.now();
    G.indexLots(r[1]); all.forEach(function (c) { byId[c.id] = c; });
    var live = all.filter(function (c) { return !G.isSold(c); });
    var lots = (r[1] || []).filter(function (l) { return new Date(l.ends_at || l.starts_at).getTime() > now; });
    hero(byId);
    $("hAll").textContent = live.length + " ავტომობილი";
    $("nAll").textContent = live.length; $("nGe").textContent = live.filter(function (c) { return !G.isTransit(c); }).length; $("nTr").textContent = live.filter(G.isTransit).length;
    G.rpc("public_sold_count").then(function (n) { $("nSold").textContent = G.n(+n || 0); }).catch(function () { $("nSold").textContent = all.filter(G.isSold).length; });
    $("svCars").textContent = live.length + " ავტომობილი. ფილტრები მარკის, ფასის და ძარის მიხედვით.";
    showroom(live); tiles(live); auction(lots);
    $("neRow").innerHTML = live.filter(function (c) { return G.photos(c).length >= 5 && !G.isTransit(c); }).sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); }).slice(0, 10).map(function (c) { return V.carCard(c, { noWarranty: true }); }).join("");
    V.wireRow($("neRow"), $("nePrev"), $("neNext"));
    var tr = live.filter(G.isTransit).sort(function (a, b) { return (G.photos(b).length > 0) - (G.photos(a).length > 0) || new Date(a.arrival_date || "2100-01-01") - new Date(b.arrival_date || "2100-01-01"); });
    if (tr.length) { $("trRow").innerHTML = tr.map(function (c) { return V.carCard(c, { eta: true, noWarranty: true }); }).join(""); $("transit").hidden = false; V.wireRow($("trRow"), $("trPrev"), $("trNext")); }
    V.reveal();
  }).catch(function () { $("neRow").innerHTML = '<div class="empty"><h3>მონაცემები ვერ ჩაიტვირთა</h3><button class="btn btn--red" type="button" onclick="location.reload()">ხელახლა ცდა</button></div>'; });
})();
