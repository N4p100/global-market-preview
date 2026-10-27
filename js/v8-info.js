/* GLOBAL v8: info pages (about, contact, sell, leasing, sold, rules, 404). Forms open WhatsApp; nothing is written to the company database. */
(function () {
  "use strict";
  var G = window.GM, V = window.V8, esc = G.esc;
  V.initChrome();
  function $(id) { return document.getElementById(id); }
  var WA = "https://wa.me/995551119942?text=";

  // live numbers
  var needCars = document.querySelector('[data-live="cars"]') || $("brandList") || $("soldGrid") || $("lRow");
  if (needCars) G.loadCars().then(function (all) {
    var live = all.filter(function (c) { return !G.isSold(c); });
    document.querySelectorAll('[data-live="cars"]').forEach(function (el) { el.textContent = live.length; });
    if ($("brandList")) { var b = {}; all.forEach(function (c) { if (c.brand) b[c.brand] = 1; }); $("brandList").innerHTML = Object.keys(b).sort().map(function (x) { return '<option value="' + esc(x) + '">'; }).join(""); }
    if ($("soldGrid")) sold(all);
    if ($("lRow")) leaseRow(live);
  });
  if (document.querySelector('[data-live="sold"]')) G.rpc("public_sold_count").then(function (n) { document.querySelectorAll('[data-live="sold"]').forEach(function (el) { el.textContent = G.n(+n || 0); }); }).catch(function () {});

  // number fields with thousands separators
  document.querySelectorAll("[data-num]").forEach(function (el) { el.addEventListener("input", function () { var d = el.value.replace(/\D/g, ""); el.value = d ? G.n(d) : ""; }); });

  // WhatsApp forms
  document.querySelectorAll("form[data-wa]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = f.querySelector(".err"), v = function (n) { return f.elements[n] ? String(f.elements[n].value || "").trim() : ""; };
      var phone = v("phone").replace(/[^\d+]/g, ""), msg = "";
      if (f.dataset.wa === "sell") {
        if (!v("brand")) msg = "მიუთითეთ მარკა.";
        else if (phone.replace(/\D/g, "").length < 9) msg = "მიუთითეთ ტელეფონის ნომერი.";
      } else {
        if (phone.replace(/\D/g, "").length < 9) msg = "მიუთითეთ ტელეფონის ნომერი.";
        else if (!v("msg")) msg = "დაწერეთ შეტყობინება.";
      }
      if (msg) { err.textContent = msg; err.hidden = false; return; }
      err.hidden = true;
      var text = f.dataset.wa === "sell"
        ? "მოგესალმებით. მსურს ავტომობილის გაყიდვა Global Market-ზე.\n" + ["მარკა: " + v("brand"), v("model") && "მოდელი: " + v("model"), v("year") && "წელი: " + v("year"), v("km") && "გარბენი: " + v("km") + " კმ", v("price") && "სასურველი ფასი: " + v("price") + " $", v("name") && "სახელი: " + v("name"), "ტელეფონი: " + phone].filter(Boolean).join("\n") + "\nფოტოებს ამ ჩატში გამოგიგზავნით."
        : "მოგესალმებით." + (v("name") ? " " + v("name") + "." : "") + "\n" + v("msg") + "\nტელეფონი: " + phone;
      window.open(WA + encodeURIComponent(text), "_blank", "noopener");
    });
  });

  // leasing calculator (formula used on the live site: 20% down, 60 months)
  if ($("lP")) {
    var calc = function () {
      var u = +String($("lP").value).replace(/\D/g, "") || 0;
      var down = Math.round(u * 0.52), month = Math.round(u * 0.0586), day = Math.round(month / 30);
      $("lDown").textContent = u ? G.n(down) + " ₾" : "—";
      $("lMonth").textContent = u ? G.n(month) + " ₾" : "—";
      $("lDay").textContent = u ? G.n(day) + " ₾" : "—";
      $("lCars").href = V.BASE + "cars.html" + (u ? "?pmax=" + u + "&sort=price_desc" : "");
      $("lWa").href = WA + encodeURIComponent("მოგესალმებით. მაინტერესებს ლიზინგი ავტომობილზე, დაახლოებით " + G.n(u) + " $.");
    };
    $("lP").addEventListener("input", calc); calc();
  }
  function leaseRow(live) {
    var list = live.filter(function (c) { return !G.isRestore(c) && !G.isTransit(c) && G.leaseDaily(c) && G.photos(c).length; }).sort(function (a, b) { return G.leaseDaily(a) - G.leaseDaily(b); }).slice(0, 10);
    $("lRow").innerHTML = list.map(function (c) { return V.carCard(c, { noWarranty: true }); }).join("");
    $("lPrev").innerHTML = V.I.left; $("lNext").innerHTML = V.I.right; V.wireRow($("lRow"), $("lPrev"), $("lNext"));
  }

  // sold cars
  var SOLD = [], shown = 16;
  function sold(all) {
    SOLD = all.filter(G.isSold).sort(function (a, b) { return new Date(b.sold_at || 0) - new Date(a.sold_at || 0); });
    paintSold();
    $("soldBtn").onclick = function () { shown += 16; paintSold(); };
  }
  function paintSold() {
    $("soldGrid").innerHTML = SOLD.length ? SOLD.slice(0, shown).map(function (c) { return V.carCard(c, { noWarranty: true }); }).join("") : '<div class="empty"><h3>მონაცემები ჯერ არ არის</h3></div>';
    $("soldMore").hidden = shown >= SOLD.length;
  }
  if ($("soldGrid")) $("soldGrid").innerHTML = V.skel(8);
})();
