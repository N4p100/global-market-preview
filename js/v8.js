/* GLOBAL v8: shared UI on top of core.js data (GM). Georgian UI, formal register. */
(function () {
  "use strict";
  var G = window.GM, esc = G.esc;
  var BASE = window.V8_BASE || "";
  var LIVE = "https://globalmarket.ge/";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ic(d, cls) { return '<svg viewBox="0 0 24 24" class="ic' + (cls ? " " + cls : "") + '" aria-hidden="true">' + d + "</svg>"; }
  var I = {
    search: ic('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/>'),
    heart: ic('<path d="M12 20s-7.5-4.6-9.2-9.4C1.6 7.2 3.9 4 7.3 4c2 0 3.6 1.1 4.7 2.7C13.1 5.1 14.7 4 16.7 4c3.4 0 5.7 3.2 4.5 6.6C19.5 15.4 12 20 12 20z"/>'),
    left: ic('<path d="M15 5l-7 7 7 7"/>'),
    right: ic('<path d="M9 5l7 7-7 7"/>'),
    go: ic('<path d="M5 12h14M13 6l6 6-6 6"/>', "ic--go"),
    x: ic('<path d="M6 6l12 12M18 6 6 18"/>'),
    filter: ic('<path d="M4 7h16M7 12h10M10 17h4"/>'),
    share: ic('<path d="M12 4v11M8 8l4-4 4 4M5 13v6h14v-6"/>'),
    phone: ic('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
    wa: ic('<path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.4-4.3a8.5 8.5 0 1 1 15.6-4.5z"/>'),
    copy: ic('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5h10"/>'),
    grid: ic('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'),
    car: ic('<path d="M4 15l1.6-4.6A2 2 0 0 1 7.5 9h9a2 2 0 0 1 1.9 1.4L20 15v3h-2.5M6.5 18H4v-3h16M7 15h.01M17 15h.01"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="16.5" cy="18" r="1.5"/>'),
    scale: ic('<path d="M12 4v16M5 8h14M7 8l-3 6h6zM17 8l-3 6h6zM8 20h8"/>'),
    ship: ic('<path d="M3 17l2 3h14l2-3M5 17v-6h14v6M8 11V6h8v5"/>')
  };

  /* ---------- formatting ---------- */
  function usdC(c) { return c ? G.n(Math.round(c / 100)) + " $" : ""; }
  function km(c) { return G.num(c.mileage) != null ? G.n(c.mileage) + " კმ" : ""; }
  function eng(c) { return c.engine ? String(c.engine).replace(/\.0$/, "") + " ლ" : ""; }
  function pad(x) { return (x < 10 ? "0" : "") + x; }
  function wd(iso) { return ["კვირა", "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი"][new Date(new Date(iso).toLocaleString("en-US", { timeZone: "Asia/Tbilisi" })).getDay()]; }
  function when(iso) { return wd(iso) + ", " + G.tbilisiDate(iso) + ", " + G.tbilisiTime(iso); }
  function carHref(c) { return BASE + "car.html#" + encodeURIComponent(c.id); }
  function lotHref(l) { return BASE + "auction/lot.html#" + encodeURIComponent(l.id); }
  function loc(c) {
    if (G.isSold(c)) return "გაყიდულია";
    if (G.isReserved(c)) return "დაჯავშნილია";
    if (G.isTransit(c)) return c.arrival_date ? "გზაშია · ჩამოსვლა " + G.dateLong(c.arrival_date) : "გზაშია საქართველოსკენ";
    if (G.isRestore(c)) return "აღსადგენი · " + (G.tv(c.location) || "საქართველო");
    return c.location === "საქართველო" || !c.location ? "საქართველოში" : G.tv(c.location);
  }
  function daysTo(iso) { var d = Math.ceil((new Date(iso) - Date.now()) / 864e5); return d > 0 ? d : 0; }

  /* ---------- cards ---------- */
  function carCard(c, o) {
    o = o || {};
    G.carIndex[String(c.id)] = c;
    var p = G.photos(c), tags = [];
    if (!G.isSold(c) && G.isVip(c)) tags.push('<span class="tag">VIP</span>');
    var lot = !G.isSold(c) ? G.lotFor(c) : null;
    if (lot) tags.push('<span class="tag tag--ink">აუქციონი · ' + esc(G.dateShort(lot.starts_at)) + "</span>");
    if (!G.isSold(c) && G.hasWarranty(c) && !o.noWarranty) tags.push('<span class="tag">გარანტია</span>');
    var price = G.priceUsd(c) || G.priceGel(c) || "ფასი შეთანხმებით";
    var daily = !G.isSold(c) ? G.leaseDaily(c) : null;
    var sub = [G.priceUsd(c) && G.priceGel(c) ? G.priceGel(c) : "", daily ? "ლიზინგით " + G.n(daily) + " ₾ დღეში" : ""].filter(Boolean).join("<br>");
    return '<article class="card' + (G.isSold(c) ? " is-sold" : "") + (o.cls ? " " + o.cls : "") + '">' +
      '<div class="card__img">' +
        (p[0] ? '<img src="' + esc(G.thumb(p[0], 800)) + '" alt="' + esc(G.title(c)) + '" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'' + esc(p[0]) + '\'">' : '<span class="noimg">ფოტო არ არის</span>') +
        (p[1] ? '<img class="alt" src="' + esc(G.thumb(p[1], 800)) + '" alt="" loading="lazy" decoding="async">' : "") +
        (tags.length ? '<div class="card__tag">' + tags.join("") + "</div>" : "") +
      "</div>" +
      '<button class="fav" type="button" data-id="' + esc(c.id) + '" aria-pressed="' + G.isFav(c.id) + '" aria-label="რჩეულებში: ' + esc(G.title(c)) + '">' + I.heart + "</button>" +
      '<div class="card__b"><span class="card__loc">' + esc(o.eta && c.arrival_date ? "ჩამოსვლა " + G.dateLong(c.arrival_date) : loc(c)) + "</span>" +
        '<h3 class="card__t"><a href="' + carHref(c) + '">' + esc(G.title(c)) + "</a></h3>" +
        '<p class="card__s">' + esc([km(c), G.tv(c.fuel), eng(c), G.tv(c.drive)].filter(Boolean).join(" · ")) + "</p>" +
        '<div class="card__p num"><b>' + esc(price) + "</b>" + (sub ? "<span>" + sub + "</span>" : "") + "</div>" +
        (o.compare ? '<button class="cmp" type="button" data-cmp="' + esc(c.id) + '" aria-pressed="' + (G.cmpIds().indexOf(String(c.id)) !== -1) + '"><i></i>შედარება</button>' : "") +
      "</div></article>";
  }
  function lotPhotos(l, car) { return car && G.photos(car).length ? G.photos(car) : (l.photos || [l.photo_url]).filter(Boolean); }
  function lotCard(l, car) {
    var p = lotPhotos(l, car), title = [l.year, l.brand, l.model].filter(Boolean).join(" ");
    var mk = G.num(l.mileage_km) != null ? G.n(l.mileage_km) + " კმ" : (car ? km(car) : "");
    return '<article class="card">' +
      '<div class="card__img">' + (p[0] ? '<img src="' + esc(G.thumb(p[0], 800)) + '" alt="' + esc(title) + '" loading="lazy" decoding="async">' : '<span class="noimg">ფოტო არ არის</span>') +
      (p[1] ? '<img class="alt" src="' + esc(G.thumb(p[1], 800)) + '" alt="" loading="lazy" decoding="async">' : "") +
      '<div class="card__tag"><span class="tag tag--ink">ლოტი ' + esc(l.id) + '</span><span class="tag">' + esc(G.tbilisiTime(l.turn_at || l.starts_at)) + "</span></div></div>" +
      '<div class="card__b"><span class="card__loc">' + esc(wd(l.session_at || l.starts_at) + ", " + G.tbilisiDate(l.session_at || l.starts_at)) + "</span>" +
      '<h3 class="card__t"><a href="' + lotHref(l) + '">' + esc(title) + "</a></h3>" +
      '<p class="card__s">' + esc([mk, car ? G.tv(car.fuel) : "", car ? eng(car) : "", l.vin_tail ? "VIN …" + l.vin_tail : ""].filter(Boolean).join(" · ")) + "</p>" +
      '<div class="card__p num"><b>' + usdC(l.current_cents || l.starting_cents) + "</b><span>" + (l.current_cents ? "მიმდინარე ფასი" : "საწყისი ფასი") + (l.buy_now_cents ? "<br>ახლავე ყიდვა " + usdC(l.buy_now_cents) : "") + "</span></div></div></article>";
  }
  function skel(n) { var s = ""; for (var i = 0; i < n; i++) s += '<div class="card card--skel" aria-hidden="true"><div class="card__img"></div><div class="line skel" style="width:40%"></div><div class="line skel" style="width:75%"></div><div class="line skel" style="width:55%"></div></div>'; return s; }

  /* ---------- rails ---------- */
  function wireRow(row, prev, next) {
    if (!row || !prev || !next) return;
    function sync() { var max = row.scrollWidth - row.clientWidth - 2; prev.disabled = row.scrollLeft <= 2; next.disabled = row.scrollLeft >= max; prev.parentElement.hidden = max <= 0; }
    prev.onclick = function () { row.scrollBy({ left: -row.clientWidth * .85, behavior: reduce ? "auto" : "smooth" }); };
    next.onclick = function () { row.scrollBy({ left: row.clientWidth * .85, behavior: reduce ? "auto" : "smooth" }); };
    row.addEventListener("scroll", sync, { passive: true }); window.addEventListener("resize", sync); sync();
  }

  /* ---------- countdown ---------- */
  function countdown(el, target, done) {
    function paint() {
      var s = Math.max(0, Math.floor((target - Date.now()) / 1000));
      if (s <= 0 && done) { el.innerHTML = '<div><b style="font-size:inherit">' + esc(done) + "</b></div>"; return; }
      var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
      el.innerHTML = [[d, "დღე"], [h, "საათი"], [m, "წუთი"], [sec, "წამი"]].map(function (x) { return "<div><b>" + pad(x[0]) + "</b><span>" + x[1] + "</span></div>"; }).join("");
    }
    paint(); return setInterval(paint, 1000);
  }

  /* ---------- lightbox ---------- */
  function lightbox(shots, start, title) {
    var cur = start || 0, opener = document.activeElement;
    var lb = document.createElement("div");
    lb.className = "lb"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", title);
    lb.innerHTML = '<div class="lb__top"><span id="lbN" class="num"></span><button class="round" type="button" data-x aria-label="დახურვა">' + I.x + "</button></div>" +
      '<div class="lb__stage"><img id="lbImg" alt="' + esc(title) + '"><button class="round lb__nav lb__nav--p" type="button" data-d="-1" aria-label="წინა">' + I.left + '</button><button class="round lb__nav lb__nav--n" type="button" data-d="1" aria-label="შემდეგი">' + I.right + "</button></div>" +
      '<div class="lb__thumbs">' + shots.map(function (s, i) { return '<button type="button" data-i="' + i + '" aria-label="ფოტო ' + (i + 1) + '"><img src="' + esc(G.thumb(s, 200)) + '" alt="" loading="lazy"></button>'; }).join("") + "</div>";
    document.body.appendChild(lb); document.body.style.overflow = "hidden";
    function show(k) {
      cur = (k + shots.length) % shots.length;
      lb.querySelector("#lbImg").src = G.thumb(shots[cur], 2000);
      lb.querySelector("#lbN").textContent = (cur + 1) + " / " + shots.length;
      lb.querySelectorAll("[data-i]").forEach(function (b, i) { if (i === cur) { b.setAttribute("aria-current", "true"); b.scrollIntoView({ block: "nearest", inline: "center" }); } else b.removeAttribute("aria-current"); });
    }
    function close() { lb.remove(); document.body.style.overflow = ""; document.removeEventListener("keydown", key); if (opener) opener.focus(); }
    function key(e) { if (e.key === "Escape") close(); else if (e.key === "ArrowRight") show(cur + 1); else if (e.key === "ArrowLeft") show(cur - 1); }
    lb.addEventListener("click", function (e) {
      var d = e.target.closest("[data-d]"); if (d) return show(cur + Number(d.dataset.d));
      var t = e.target.closest("[data-i]"); if (t) return show(+t.dataset.i);
      if (e.target.closest("[data-x]") || e.target.classList.contains("lb__stage")) close();
    });
    var sx = null;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1)); sx = null; });
    document.addEventListener("keydown", key);
    show(cur); lb.querySelector("[data-x]").focus();
  }

  /* ---------- reveal on scroll ---------- */
  var io = "IntersectionObserver" in window && !reduce ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -10% 0px" }) : null;
  function reveal(root) { (root || document).querySelectorAll(".rv:not(.in)").forEach(function (el) { if (io) io.observe(el); else el.classList.add("in"); }); }

  /* ---------- header ---------- */
  function header() {
    var h = document.getElementById("head"), hero = document.querySelector("[data-hero]"), last = window.scrollY, ticking = false;
    if (!h) return;
    if (!hero) h.classList.add("is-solid");
    function on() {
      ticking = false;
      var y = window.scrollY, limit = hero ? hero.offsetHeight - h.offsetHeight - 10 : 0;
      if (hero) h.classList.toggle("is-solid", y > limit);
      var hide = y > Math.max(limit, 120) + 160 && y > last + 2 && !document.body.classList.contains("is-locked");
      if (hide) h.classList.add("is-hidden"); else if (y < last - 2 || y < 120) h.classList.remove("is-hidden");
      document.body.classList.toggle("head-hidden", h.classList.contains("is-hidden"));
      last = y;
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(on); } }, { passive: true });
    on();
  }

  /* ---------- overlays ---------- */
  function overlay(el, openSel, closeSel, onOpen) {
    if (!el) return;
    var opener = null;
    function open() { opener = document.activeElement; el.classList.add("is-open"); el.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; document.body.classList.add("is-locked"); if (onOpen) onOpen(); }
    function close() { if (!el.classList.contains("is-open")) return; el.classList.remove("is-open"); el.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; document.body.classList.remove("is-locked"); if (opener) opener.focus(); }
    document.querySelectorAll(openSel).forEach(function (b) { b.addEventListener("click", open); });
    el.querySelectorAll(closeSel).forEach(function (b) { b.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    el.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var f = el.querySelectorAll("a[href], button:not([disabled]), input"), first = f[0], lastF = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastF.focus(); }
      else if (!e.shiftKey && document.activeElement === lastF) { e.preventDefault(); first.focus(); }
    });
    return { open: open, close: close };
  }

  function initChrome() {
    header();
    var menu = overlay(document.getElementById("menu"), "[data-menu]", "[data-menu-x]", function () { setTimeout(function () { var a = document.querySelector(".menu__nav a"); if (a) a.focus(); }, 80); });
    var find = overlay(document.getElementById("find"), "[data-find]", "[data-find-x]", function () { setTimeout(function () { document.querySelector("#find input").focus(); }, 120); });
    var y = document.querySelector("[data-year]"); if (y) y.textContent = new Date().getFullYear();
    G.syncFavUI();
    document.addEventListener("click", function (e) {
      var c = e.target.closest("[data-cmp]"); if (!c) return;
      e.preventDefault();
      G.toggleCmp(c.dataset.cmp);
      document.querySelectorAll('[data-cmp="' + c.dataset.cmp + '"]').forEach(function (b) { b.setAttribute("aria-pressed", G.cmpIds().indexOf(String(c.dataset.cmp)) !== -1 ? "true" : "false"); });
    });
    document.addEventListener("gm:fav", function () { var el = document.querySelector('[data-mcount="fav"]'); if (el) el.textContent = G.favIds().length || ""; });
    G.renderCmpBar();
    reveal();
    // live counts in the menu and quick searches in the search panel
    G.loadCars().then(function (cars) {
      var live = cars.filter(function (c) { return !G.isSold(c); });
      cars.forEach(function (c) { G.carIndex[String(c.id)] = c; });
      G.renderCmpBar();
      var set = function (k, v) { var el = document.querySelector('[data-mcount="' + k + '"]'); if (el) el.textContent = v || ""; };
      set("cars", live.length); set("transit", live.filter(G.isTransit).length); set("restore", live.filter(G.isRestore).length); set("fav", G.favIds().length);
      var n = document.querySelector("[data-find-n]"); if (n) n.textContent = "· " + live.length + " ავტომობილი";
      var brands = {}; live.forEach(function (c) { if (c.brand) brands[c.brand] = (brands[c.brand] || 0) + 1; });
      var top = Object.keys(brands).sort(function (a, b) { return brands[b] - brands[a]; }).slice(0, 10);
      var s = document.getElementById("findSugg");
      if (s) s.innerHTML = top.map(function (b) { return '<a class="chip" href="' + BASE + "cars.html?brand=" + encodeURIComponent(b) + '">' + esc(b) + " <small>" + brands[b] + "</small></a>"; }).join("");
    }).catch(function () {});
    G.loadLots().then(function (lots) {
      var up = (lots || []).filter(function (l) { return new Date(l.ends_at || l.starts_at).getTime() > Date.now(); });
      var el = document.querySelector('[data-mcount="lots"]'); if (el) el.textContent = up.length ? up.length + " ლოტი" : "";
    });
    themeToggle();
    return { menu: menu, find: find };
  }

  /* light / dark (Global red and black); each site keeps its own choice */
  function themeToggle() {
    var key = window.V8_THEME_KEY || "gm8-theme", root = document.documentElement;
    function meta() { var m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = root.getAttribute("data-theme") === "dark" ? "#0b0b0c" : "#ffffff"; }
    meta();
    document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
      b.setAttribute("aria-pressed", root.getAttribute("data-theme") === "dark" ? "true" : "false");
      b.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try { localStorage.setItem(key, next); } catch (e) {}
        document.querySelectorAll("[data-theme-toggle]").forEach(function (x) { x.setAttribute("aria-pressed", next === "dark" ? "true" : "false"); });
        meta();
      });
    });
  }

  window.V8 = { I: I, BASE: BASE, LIVE: LIVE, reduce: reduce, usdC: usdC, km: km, eng: eng, pad: pad, wd: wd, when: when, loc: loc, daysTo: daysTo, carHref: carHref, lotHref: lotHref, carCard: carCard, lotCard: lotCard, lotPhotos: lotPhotos, skel: skel, wireRow: wireRow, countdown: countdown, lightbox: lightbox, reveal: reveal, initChrome: initChrome };
})();
