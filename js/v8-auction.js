/* GLOBAL v8: auction home. Next session clock, session days, lot grid, rules. */
(function () {
  "use strict";
  var G = window.GM, V = window.V8, esc = G.esc;
  V.initChrome();
  function $(id) { return document.getElementById(id); }
  var LOTS = [], CARS = {}, S = { day: new URLSearchParams(location.search).get("day") || "", brand: "", buy: "", sort: "turn", q: "" };
  function cat(iso) { var c = V.aucCat(iso); return c ? c.name : "ავტომობილები"; }
  function dayKey(iso) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tbilisi" }).format(new Date(iso)); }
  function at(l) { return l.session_at || l.starts_at; }

  function render() {
    var list = LOTS.filter(function (l) {
      return (!S.day || dayKey(at(l)) === S.day) && (!S.brand || l.brand === S.brand) && (!S.buy || l.buy_now_cents) &&
        (!S.q || [l.brand, l.model, l.year, l.id].join(" ").toLowerCase().indexOf(S.q.toLowerCase()) !== -1);
    });
    var by = { turn: function (a, b) { return new Date(a.turn_at || a.starts_at) - new Date(b.turn_at || b.starts_at); }, start_asc: function (a, b) { return (a.starting_cents || 1e12) - (b.starting_cents || 1e12); }, buy_asc: function (a, b) { return (a.buy_now_cents || 1e12) - (b.buy_now_cents || 1e12); }, year_desc: function (a, b) { return (b.year || 0) - (a.year || 0); } }[S.sort];
    list.sort(by);
    $("lCount").textContent = list.length + " ლოტი";
    $("lotGrid").innerHTML = list.length ? list.map(function (l) { return V.lotCard(l, CARS[l.car_id]); }).join("") : '<div class="empty"><h3>ამ ფილტრით ლოტი არ არის</h3><p>შეცვალეთ სესია ან მარკა.</p></div>';
    document.querySelectorAll("#days [data-day]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.day === S.day ? "true" : "false"); });
    var p = new URLSearchParams(); if (S.day) p.set("day", S.day);
    history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : "") + location.hash);
  }
  document.addEventListener("change", function (e) { var k = { lBrand: "brand", lBuy: "buy", lSort: "sort" }[e.target.id]; if (k) { S[k] = e.target.value; render(); } });
  var qt; $("lQ").addEventListener("input", function (e) { clearTimeout(qt); qt = setTimeout(function () { S.q = e.target.value.trim(); render(); }, 250); });
  var fs = document.querySelector("#find form");
  if (fs) fs.addEventListener("submit", function (e) { e.preventDefault(); S.q = fs.q.value.trim(); $("lQ").value = S.q; render(); document.querySelector("[data-find-x]").click(); $("lots").scrollIntoView({ behavior: V.reduce ? "auto" : "smooth" }); });

  // three auction categories: the active one shows its session, the rest wait for a date
  function cats(groups, keys) {
    var next = {}; keys.forEach(function (k) { var c = V.aucCat(at(groups[k][0])); if (c && !next[c.day]) next[c.day] = groups[k]; });
    $("aCats").innerHTML = V.AUC.map(function (c, i) {
      var g = next[c.day];
      var when = g ? V.wd(at(g[0])) + ", " + G.tbilisiDate(at(g[0])) + ", " + G.tbilisiTime(at(g[0])) : "სესიის თარიღი დაზუსტდება";
      return '<a class="acat' + (g ? " is-on" : "") + '" href="' + (g ? "#lots" : "rules.html") + '"><span class="acat__n num">0' + (i + 1) + '</span><h3>' + esc(c.name) + "</h3><p>" + esc(c.note) + '</p><span class="acat__s"><i></i>' + esc(when) + (g ? ' · <b class="num">' + g.length + " ლოტი</b>" : "") + "</span></a>";
    }).join("");
  }

  $("lotGrid").innerHTML = V.skel(8);
  Promise.all([G.loadLots(), G.loadCars().catch(function () { return []; })]).then(function (r) {
    var now = Date.now();
    LOTS = V.liveLots(r[0]);
    (r[1] || []).forEach(function (c) { CARS[c.id] = c; });
    if (!LOTS.length) {
      $("aKicker").textContent = "Global Auction";
      $("aSub").textContent = "ახალი სესიის განრიგი მალე გამოქვეყნდება.";
      $("days").hidden = true;
      $("lotGrid").innerHTML = '<div class="empty"><h3>მიმდინარე ლოტები არ არის</h3><p>ახალი სესიის განრიგი მალე გამოქვეყნდება.</p><a class="btn btn--ink" href="rules.html">აუქციონის წესები</a></div>';
      return;
    }
    var groups = {};
    LOTS.forEach(function (l) { var k = dayKey(at(l)); (groups[k] = groups[k] || []).push(l); });
    var keys = Object.keys(groups).sort();
    if (S.day && !groups[S.day]) S.day = "";
    var first = groups[keys[0]].sort(function (a, b) { return new Date(a.turn_at || a.starts_at) - new Date(b.turn_at || b.starts_at); })[0];
    $("aTitle").textContent = G.tbilisiDate(at(first)) + ", " + G.tbilisiTime(at(first));
    $("aKicker").textContent = "შემდეგი სესია · " + V.wd(at(first)) + " · " + cat(at(first));
    $("aSub").textContent = groups[keys[0]].length + " ლოტი. ყოველი ლოტი 1 წუთი გრძელდება. მონაწილეობისთვის საჭიროა რეგისტრაცია და 500 ₾ დეპოზიტი.";
    cats(groups, keys);
    V.countdown($("aClock"), new Date(at(first)).getTime(), "მიმდინარეობს");
    $("lLead").textContent = keys.length > 1 ? LOTS.length + " ლოტი " + keys.length + " სესიაში." : LOTS.length + " ლოტი · " + cat(at(first));
    $("days").innerHTML = '<button type="button" data-day="" aria-pressed="false"><b>ყველა სესია</b><small class="num">' + LOTS.length + " ლოტი</small></button>" + keys.map(function (k) {
      var g = groups[k], wdn = V.wd(at(g[0]));
      var min = Math.min.apply(null, g.map(function (l) { return l.starting_cents || 1e12; }));
      return '<button type="button" data-day="' + k + '" aria-pressed="false"><b>' + esc(wdn + ", " + G.tbilisiDate(at(g[0]))) + '</b><small class="num">' + esc(cat(at(g[0]))) + " · " + g.length + " ლოტი · " + V.usdC(min) + "-დან</small></button>";
    }).join("");
    $("days").hidden = keys.length < 2;
    $("days").addEventListener("click", function (e) { var b = e.target.closest("[data-day]"); if (!b) return; S.day = b.dataset.day; render(); });
    var brands = {}; LOTS.forEach(function (l) { brands[l.brand] = (brands[l.brand] || 0) + 1; });
    $("lBrand").innerHTML = '<option value="">ყველა მარკა</option>' + Object.keys(brands).sort().map(function (b) { return '<option value="' + esc(b) + '">' + esc(b) + " (" + brands[b] + ")</option>"; }).join("");
    render();
  }).catch(function () { $("lotGrid").innerHTML = '<div class="empty"><h3>მონაცემები ვერ ჩაიტვირთა</h3><button class="btn btn--ink" type="button" onclick="location.reload()">ხელახლა ცდა</button></div>'; });
})();
