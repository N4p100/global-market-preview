/* GLOBAL v8: compare up to 3 cars. Uses ?ids= or the saved compare list. */
(function () {
  "use strict";
  var G = window.GM, V = window.V8, esc = G.esc;
  document.body.classList.add("page-compare");
  V.initChrome();
  var box = document.getElementById("cmp");
  var q = new URLSearchParams(location.search).get("ids");
  var ids = (q ? q.split(",") : G.cmpIds()).map(String).filter(Boolean).slice(0, 3);
  var ROWS = [
    ["ფასი", function (c) { return G.priceUsd(c) || G.priceGel(c) || "შეთანხმებით"; }],
    ["ფასი ლარში", function (c) { return G.priceGel(c); }],
    ["ლიზინგით, დღეში", function (c) { var d = G.leaseDaily(c); return d ? G.n(d) + " ₾" : ""; }],
    ["წელი", function (c) { return c.year; }],
    ["გარბენი", function (c) { return V.km(c); }],
    ["ძრავი", function (c) { return V.eng(c); }],
    ["სიმძლავრე", function (c) { return c.engine_hp ? c.engine_hp + " ც.ძ." : ""; }],
    ["საწვავი", function (c) { return G.tv(c.fuel); }],
    ["გადაცემათა კოლოფი", function (c) { return G.tv(c.transmission); }],
    ["ამძრავი", function (c) { return G.tv(c.drive); }],
    ["ძარა", function (c) { return G.tv(c.body_type); }],
    ["ფერი", function (c) { return G.tv(c.color); }],
    ["განბაჟება", function (c) { return G.tv(c.customs); }],
    ["მდებარეობა", function (c) { return V.loc(c); }],
    ["გარანტია", function (c) { return G.hasWarranty(c) ? "6 თვე" : "არა"; }],
    ["გაცვლა", function (c) { return c.exchange_available ? "შესაძლებელია" : "არა"; }]
  ];
  function paint(cars) {
    var list = ids.map(function (id) { return cars.filter(function (c) { return String(c.id) === id; })[0]; }).filter(Boolean);
    if (!list.length) { box.innerHTML = '<div class="empty"><h3>შესადარებელი ავტომობილი არ არის არჩეული</h3><p>ავტომობილის ბარათზე მონიშნეთ „შედარება“.</p><a class="btn btn--ink" href="cars.html">ავტომობილების ნახვა</a></div>'; return; }
    var head = "<tr><th></th>" + list.map(function (c) { var p = G.photos(c)[0]; return '<td class="ccar"><a href="' + V.carHref(c) + '">' + (p ? '<img src="' + esc(G.thumb(p, 640)) + '" alt="' + esc(G.title(c)) + '">' : "") + "<h3>" + esc(G.title(c)) + '</h3></a><button class="x" type="button" data-rm="' + esc(c.id) + '">ამოღება</button></td>'; }).join("") + "</tr>";
    var body = ROWS.map(function (r) {
      var vals = list.map(function (c) { var v = r[1](c); return v == null || v === "" ? "—" : String(v); });
      var diff = vals.some(function (v) { return v !== vals[0]; });
      return "<tr><th>" + r[0] + "</th>" + vals.map(function (v) { return '<td class="num' + (diff ? " diff" : "") + '">' + esc(v) + "</td>"; }).join("") + "</tr>";
    }).join("");
    box.innerHTML = '<table class="ctable">' + head + body + "</table>";
  }
  var cars = [];
  box.addEventListener("click", function (e) {
    var b = e.target.closest("[data-rm]"); if (!b) return;
    ids = ids.filter(function (x) { return x !== b.dataset.rm; });
    if (G.cmpIds().indexOf(b.dataset.rm) !== -1) G.toggleCmp(b.dataset.rm);
    history.replaceState(null, "", location.pathname + (ids.length ? "?ids=" + ids.join(",") : ""));
    paint(cars);
  });
  box.innerHTML = '<div class="grid">' + V.skel(3) + "</div>";
  G.loadCars().then(function (r) { cars = r; paint(r); }).catch(function () { box.innerHTML = '<div class="empty"><h3>მონაცემები ვერ ჩაიტვირთა</h3><button class="btn btn--ink" type="button" onclick="location.reload()">ხელახლა ცდა</button></div>'; });
})();
