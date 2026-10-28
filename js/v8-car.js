/* GLOBAL v8: car page (car.html#ID, same URL as the live site). */
(function () {
  "use strict";
  var G = window.GM, V = window.V8, esc = G.esc, I = V.I;
  V.initChrome();
  function $(id) { return document.getElementById(id); }
  var FEAT = [["abs", "ABS"], ["esc", "სტაბილიზაციის სისტემა"], ["traction_control", "მოცურების საწინააღმდეგო სისტემა"], ["tpms", "საბურავის წნევის სენსორი"], ["rear_camera", "უკანა ხედვის კამერა"], ["park_assist", "პარკინგკონტროლი"], ["adaptive_cruise", "ადაპტური კრუიზ-კონტროლი"], ["blind_spot", "უსინათლო ზონის კონტროლი"], ["forward_collision", "შეჯახების გაფრთხილება"], ["lane_departure", "ზოლიდან გადახვევის გაფრთხილება"], ["keyless_ignition", "უგასაღებო დაქოქვა"], ["drl", "დღის სავალი განათება"], ["lane_keep", "ზოლის შენარჩუნება"], ["lane_centering", "ზოლში ცენტრირება"], ["rear_cross_traffic", "უკან გადაკვეთის გაფრთხილება"], ["cib", "შეჯახების ავტომუხრუჭი"], ["pedestrian_aeb", "ფეხით მოსიარულის ავტომუხრუჭი"], ["rear_aeb", "უკანა ავტომუხრუჭი"], ["blind_spot_intervention", "უსინათლო ზონის კორექცია"], ["dynamic_brake", "დინამიური მუხრუჭის დახმარება"], ["adaptive_beam", "ადაპტური შორი განათება"], ["auto_beam_switch", "შორი განათების ავტოგადამრთველი"], ["auto_reverse", "შუშის ავტორევერსი"], ["pedestrian_sound", "ფეხით მოსიარულის ხმოვანი გაფრთხილება"], ["edr", "ავარიის მონაცემთა ჩამწერი"]];
  var id = decodeURIComponent((location.hash || "").slice(1)) || new URLSearchParams(location.search).get("id");

  function wa(text) { return "https://wa.me/995551119942?text=" + encodeURIComponent(text); }
  function name(c) { var t = c.vin_spec && c.vin_spec.trim; if (t && String(c.model).toLowerCase().indexOf(String(t).toLowerCase()) !== -1) t = ""; return [c.year, c.brand, c.model, t].filter(Boolean).join(" "); }
  function status(c) {
    if (G.isSold(c)) return "გაყიდულია";
    if (G.isReserved(c)) return c.reserved_until ? "დაჯავშნილია " + G.dateLong(c.reserved_until) + "-მდე" : "დაჯავშნილია";
    if (G.isTransit(c)) return c.arrival_date ? "გზაშია · ჩამოსვლა " + G.dateLong(c.arrival_date) : "გზაშია · თარიღი ზუსტდება";
    if (c.availability === "სერვისშია") return "სერვისშია";
    return G.isRestore(c) ? "აღსადგენი · " + (G.tv(c.location) || "საქართველო") : "გაყიდვაშია · " + (c.location === "საქართველო" || !c.location ? "საქართველოში" : G.tv(c.location));
  }
  function notFound() {
    $("title").textContent = "ავტომობილი ვერ მოიძებნა";
    $("meta").textContent = "შესაძლოა განცხადება გაიყიდა ან წაიშალა.";
    $("stripRow").innerHTML = "";
    $("left").innerHTML = '<a class="btn btn--ink" href="cars.html">ყველა ავტომობილი</a>';
    $("tabs").hidden = true;
  }

  function strip(shots, title) {
    var row = $("stripRow");
    if (!shots.length) { row.innerHTML = '<button type="button" style="width:100%;display:grid;place-items:center;color:var(--mute)" tabindex="-1">ფოტო არ არის</button>'; $("sAll").hidden = true; return; }
    row.innerHTML = shots.map(function (s, i) { return '<button type="button" data-i="' + i + '" aria-label="ფოტო ' + (i + 1) + " / " + shots.length + '"><img src="' + esc(G.thumb(s, i < 3 ? 1400 : 1000)) + '" alt="' + (i === 0 ? esc(title) : "") + '"' + (i < 3 ? (i === 0 ? ' fetchpriority="high"' : "") : ' loading="lazy"') + ' decoding="async"></button>'; }).join("");
    $("sAll").innerHTML = I.grid + "ყველა ფოტო · " + shots.length;
    $("sPrev").innerHTML = I.left; $("sNext").innerHTML = I.right;
    row.addEventListener("click", function (e) { var b = e.target.closest("[data-i]"); if (b) V.lightbox(shots, +b.dataset.i, title); });
    $("sAll").onclick = function () { V.lightbox(shots, 0, title); };
    function step(d) { row.scrollBy({ left: d * row.clientWidth * .7, behavior: V.reduce ? "auto" : "smooth" }); }
    $("sPrev").onclick = function () { step(-1); }; $("sNext").onclick = function () { step(1); };
    function sync() { var max = row.scrollWidth - row.clientWidth - 2; $("sPrev").disabled = row.scrollLeft <= 2; $("sNext").disabled = row.scrollLeft >= max; }
    row.addEventListener("scroll", sync, { passive: true }); addEventListener("resize", sync); row.querySelectorAll("img").forEach(function (im) { im.addEventListener("load", sync); }); sync();
  }

  function render(c, all) {
    var title = name(c), url = "https://globalmarket.ge/car.html#" + c.id, hello = "მოგესალმებით. მაინტერესებს " + title + " (ID " + c.id + "). " + url;
    document.title = title + " · Global Market";
    $("crumb").textContent = title;
    $("title").textContent = title;
    $("meta").innerHTML = "<span>" + esc(status(c)) + '</span><span aria-hidden="true">·</span><span>ID ' + esc(c.id) + "</span>" + (c.vin ? '<span aria-hidden="true">·</span><span>VIN …' + esc(String(c.vin).slice(-6)) + "</span>" : "");
    $("acts").innerHTML = '<button class="btn btn--line" type="button" data-fav-btn data-id="' + esc(c.id) + '" aria-pressed="' + G.isFav(c.id) + '">' + I.heart + '<span>შენახვა</span></button><button class="btn btn--line" type="button" data-cmp="' + esc(c.id) + '" aria-pressed="' + (G.cmpIds().indexOf(String(c.id)) !== -1) + '">' + I.scale + '<span>შედარება</span></button><button class="round" type="button" id="share" aria-label="გაზიარება">' + I.share + "</button>";
    strip(G.photos(c), title);

    var price = G.priceUsd(c) || G.priceGel(c) || "ფასი შეთანხმებით";
    $("tPrice").textContent = price;
    var hp = c.engine_hp ? c.engine_hp + " ც.ძ." : "";
    var figs = [[V.km(c) || "—", "გარბენი"], [c.year || "—", "წელი"], [[V.eng(c), hp].filter(Boolean).join(" · ") || G.tv(c.transmission) || "—", hp ? "ძრავი და სიმძლავრე" : "ძრავი"], [[G.tv(c.fuel), G.tv(c.drive)].filter(Boolean).join(" · ") || "—", "საწვავი და ამძრავი"]];
    $("overview").innerHTML = figs.map(function (f) { return '<div class="rv"><b class="num">' + esc(f[0]) + "</b><span>" + f[1] + "</span></div>"; }).join("");

    var vs = c.vin_spec || {};
    var rows = [["წელი", c.year], ["გარბენი", G.num(c.mileage) != null ? G.n(c.mileage) + " კმ" + (G.num(c.mileage_mi) != null ? " · " + G.n(c.mileage_mi) + " მილი" : "") : ""], ["ძრავი", V.eng(c)], ["სიმძლავრე", hp],
      ["საწვავი", G.tv(c.fuel)], ["გადაცემათა კოლოფი", G.tv(c.transmission)], ["ამძრავი", G.tv(c.drive)], ["ძარა", G.tv(c.body_type)], ["ფერი", G.tv(c.color)], ["კომპლექტაცია", vs.trim],
      ["კარები", c.doors], ["ადგილები", c.seats], ["ცილინდრები", c.cylinders], ["განბაჟება", G.tv(c.customs)], ["მდებარეობა", G.tv(c.location)], ["ფარები", vs.headlights], ["ძრავის მოდელი", vs.engine_model],
      ["წონა", vs.curb_weight_kg ? G.n(vs.curb_weight_kg) + " კგ" : ""], ["ქარხანა", [vs.plant_city, vs.plant_country].filter(Boolean).join(", ").toLowerCase().replace(/(^|[\s,(])([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); }).replace(/\(Usa\)/, "(USA)")],
      ["VIN", c.vin ? esc(c.vin) + '<button class="copy" type="button" id="vinCopy" aria-label="VIN-ის კოპირება">' + I.copy + "</button>" : ""], ["ID", c.id]]
      .filter(function (r) { return r[1] != null && String(r[1]).trim() !== ""; });
    var feats = c.vin_features ? FEAT.filter(function (f) { return c.vin_features[f[0]] === "standard"; }) : [];
    var hyb = c.fuel === "ჰიბრიდი" || c.fuel === "ელექტრო";
    var lot = !G.isSold(c) ? G.lotFor(c) : null;
    var left = "";
    if (lot) left += '<section class="dsec"><h2>ეს ავტომობილი აუქციონზეა</h2><p class="lead">' + esc(V.when(lot.starts_at)) + " · საწყისი ფასი " + esc(V.usdC(lot.starting_cents)) + (lot.buy_now_cents ? ", ახლავე ყიდვა " + esc(V.usdC(lot.buy_now_cents)) : "") + '.</p><p style="margin-top:18px"><a class="btn btn--ink" href="' + V.lotHref(lot) + '">ლოტის ნახვა' + I.go + "</a></p></section>";
    if (G.isTransit(c) && !G.isSold(c)) left += '<section class="dsec"><h2>გზაში საქართველოსკენ</h2><p class="lead">' + esc(c.arrival_date ? "სავარაუდო ჩამოსვლა: " + G.dateLong(c.arrival_date) + (V.daysTo(c.arrival_date) ? ", " + V.daysTo(c.arrival_date) + " დღეში" : "") + "." : "ჩამოსვლის თარიღი ზუსტდება.") + (c.arrival_port ? " პორტი: " + esc(c.arrival_port) + "." : "") + " ავტომობილის დაჯავშნა ჩამოსვლამდეა შესაძლებელი.</p></section>";
    left += '<section class="dsec" id="specs"><h2>მახასიათებლები</h2><dl class="specs">' + rows.map(function (r) { return "<div><dt>" + r[0] + "</dt><dd" + (r[0] === "VIN" || r[0] === "ID" ? ' class="num"' : "") + ">" + (r[0] === "VIN" ? r[1] : esc(r[1])) + "</dd></div>"; }).join("") + "</dl></section>";
    if (feats.length) left += '<section class="dsec" id="equip"><h2>ქარხნული აღჭურვილობა</h2><ul class="equip">' + feats.map(function (f) { return "<li>" + f[1] + "</li>"; }).join("") + '</ul><p class="label" style="margin-top:14px">VIN კოდის მიხედვით, ქარხნული კომპლექტაცია.</p></section>';
    if (c.description) left += '<section class="dsec"><h2>აღწერა</h2><p style="white-space:pre-line;max-width:70ch">' + esc(c.description) + "</p></section>";
    if (!G.isRestore(c) && !G.isTransit(c) && !G.isSold(c) && c.has_six_month_warranty !== false) {
      left += '<section class="dsec"><h2>გარანტია</h2>' +
        (c.has_six_month_warranty !== false ? "<p><b>6-თვიანი გარანტია</b> " + (hyb ? "ვრცელდება ჰიბრიდულ და ელექტრო ელემენტებზე." : "ვრცელდება ძრავსა და გადაცემათა კოლოფზე.") + "</p>" : "") + "</section>";
    }
    $("left").innerHTML = left;
    if (feats.length) document.querySelector('#tabsNav [href="#equip"]').hidden = false;

    var ls = !G.isSold(c) ? G.lease(c) : null;
    var side = '<div class="box"><span class="label">' + esc(status(c)) + '</span><div class="box__big num" style="margin-top:10px">' + esc(price) + "</div>" +
      (G.priceUsd(c) && G.priceGel(c) ? '<p class="num" style="margin-top:8px;font-size:15px">' + esc(G.priceGel(c)) + "</p>" : "") +
      (G.isSold(c) ? '<a class="btn btn--ink btn--block btn--lg" style="margin-top:20px" href="cars.html">მსგავსი ავტომობილები</a>' :
        '<a class="btn btn--ink btn--block btn--lg" style="margin-top:20px" href="tel:+995551119942">' + I.phone + "დარეკვა · 551 11 99 42</a>" +
        '<a class="btn btn--line btn--block btn--lg" href="' + wa(hello) + '" target="_blank" rel="noopener">' + I.wa + "WhatsApp</a>") + "</div>";
    if (ls) {
      side += '<div class="box" id="lease"><h3>ლიზინგი BB-დან</h3><div class="box__big num">' + G.n(ls.daily) + '<small>₾ დღეში</small></div><div class="kv num"><div><span>შენატანი, 20%</span><b>' + G.n(ls.down) + " ₾</b></div><div><span>თვეში, 60 თვე</span><b>" + G.n(ls.monthly) + " ₾</b></div></div>" +
        "<p>წინასწარი გაანგარიშება. საბოლოო პირობებს ბანკი ადგენს.</p>" +
        '<a class="btn btn--line btn--block" style="margin-top:16px" href="' + wa("მოგესალმებით. მაინტერესებს ლიზინგი: " + title + " (ID " + c.id + "). " + url) + '" target="_blank" rel="noopener">ლიზინგის მოთხოვნა</a></div>';
      document.querySelector('#tabsNav [href="#lease"]').hidden = false;
    }
    if (!G.isSold(c)) {
      side += '<div class="box"><h3>შესთავაზეთ ფასი</h3><p>მოთხოვნა WhatsApp-ით გაიგზავნება.</p><form class="form" data-form="offer" novalidate><div class="field"><label for="oP">თქვენი ფასი, $</label><input class="input" id="oP" name="p" inputmode="numeric" autocomplete="off"></div><div class="field"><label for="oT">ტელეფონი</label><input class="input" id="oT" name="t" type="tel" autocomplete="tel"></div><p class="err" role="alert" hidden></p><button class="btn btn--ink btn--block" type="submit">გაგზავნა</button></form></div>';
    }
    side += '<div class="box" id="contact"><h3>Global Market</h3><div class="kv" style="margin-bottom:0"><div><span>ტელეფონი</span><a href="tel:+995551119942">551 11 99 42</a></div><div><span>სამუშაო საათები</span><b>ორშ–შაბ, 10:00–19:00</b></div><div><span>მისამართი</span><a class="link" href="https://www.google.com/maps/search/?api=1&query=41.7946276%2C44.7692874" target="_blank" rel="noopener">რუკაზე</a></div></div></div>';
    $("side").innerHTML = side;

    if (!G.isSold(c)) {
      $("mbar").innerHTML = '<b class="num">' + esc(price) + (ls ? "<small>ლიზინგით " + G.n(ls.daily) + " ₾ დღეში</small>" : "") + '</b><a class="round" href="' + wa(hello) + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + I.wa + '</a><a class="btn btn--ink" href="tel:+995551119942">' + I.phone + "დარეკვა</a>";
      $("mbar").hidden = false; document.body.classList.add("has-mbar");
    } else $("tCall").hidden = true;

    document.querySelectorAll("[data-form] [inputmode=numeric]").forEach(function (el) { el.addEventListener("input", function () { var d = el.value.replace(/\D/g, ""); el.value = d ? G.n(d) : ""; }); });
    document.querySelectorAll("form[data-form]").forEach(function (f) {
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var err = f.querySelector(".err"), p = (f.p.value || "").replace(/\D/g, ""), t = (f.t.value || "").replace(/[^\d+]/g, "");
        var msg = !p ? "მიუთითეთ თანხა." : t.replace(/\D/g, "").length < 9 ? "მიუთითეთ ტელეფონის ნომერი." : "";
        if (msg) { err.textContent = msg; err.hidden = false; return; }
        err.hidden = true;
        var text = "მოგესალმებით. " + title + " (ID " + c.id + "), გთავაზობთ " + G.n(p) + " $. ტელეფონი: " + t + ". " + url;
        window.open(wa(text), "_blank", "noopener");
      });
    });
    var vc = $("vinCopy"); if (vc) vc.onclick = function () { navigator.clipboard && navigator.clipboard.writeText(c.vin).then(function () { G.toast("VIN დაკოპირდა"); }); };
    $("share").onclick = function () { if (navigator.share) navigator.share({ title: title, url: url }).catch(function () {}); else navigator.clipboard.writeText(url).then(function () { G.toast("ბმული დაკოპირდა"); }); };
    document.querySelector("[data-fav-btn]").onclick = function () { G.toggleFav(c.id); };

    // tab highlight follows the section in view
    var links = Array.prototype.slice.call(document.querySelectorAll("#tabsNav a")).filter(function (a) { return !a.hidden; });
    if ("IntersectionObserver" in window) {
      var obs = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle("is-on", a.getAttribute("href") === "#" + e.target.id); }); }); }, { rootMargin: "-40% 0px -55% 0px" });
      links.forEach(function (a) { var s = document.querySelector(a.getAttribute("href")); if (s && !s.closest(".side")) obs.observe(s); });
    }
    links.forEach(function (a) { a.addEventListener("click", function (e) { var s = document.querySelector(a.getAttribute("href")); if (!s) return; e.preventDefault(); window.scrollTo({ top: s.getBoundingClientRect().top + scrollY - 150, behavior: V.reduce ? "auto" : "smooth" }); }); });

    var live = all.filter(function (x) { return !G.isSold(x) && String(x.id) !== String(c.id); }), usd = G.num(c.price_usd);
    var sim = live.filter(function (x) { return x.brand === c.brand && x.model === c.model; });
    if (usd) sim = sim.concat(live.filter(function (x) { var u = G.num(x.price_usd); return u && Math.abs(u - usd) / usd < .15 && sim.indexOf(x) === -1; }).sort(function (a, b) { return Math.abs(a.price_usd - usd) - Math.abs(b.price_usd - usd); }));
    sim = sim.filter(function (x) { return G.photos(x).length; }).slice(0, 10);
    if (sim.length) { $("sim").innerHTML = sim.map(function (x) { return V.carCard(x); }).join(""); $("simPrev").innerHTML = I.left; $("simNext").innerHTML = I.right; $("simSec").hidden = false; V.wireRow($("sim"), $("simPrev"), $("simNext")); }
    V.reveal();
  }

  if (!id) { notFound(); return; }
  Promise.all([G.loadCar(id), G.loadCars().catch(function () { return []; }), G.loadLots()]).then(function (r) {
    if (!r[0]) return notFound();
    G.indexLots(V.liveLots(r[2]));
    render(r[0], r[1] || []);
  }).catch(notFound);
  window.addEventListener("hashchange", function () { location.reload(); });
})();
