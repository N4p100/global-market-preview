/* Global Auto family — phone tab bar: Main · Market · Agent · Auction · Menu (26 Nov 2026).
   Not on pages with their own bottom action bar (a car, a lot). */
(function () {
  "use strict";
  if (document.querySelector(".mbar, .lotbar")) return;
  var base = window.GM_BASE || window.V8_BASE || "";
  var path = location.pathname;
  var MARK = (document.querySelector(".logo svg path:last-child") || {}).getAttribute ? document.querySelector(".logo svg path:last-child").getAttribute("d") : "";
  var ic = function (d) { return '<svg viewBox="0 0 24 24" class="ic" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">' + d + "</svg>"; };
  /* One family, one tab bar (26 Nov): Main (import) · Market · Agent · Auction · Menu, the same on every page. */
  var SEC = /\/glob\//.test(path) ? "import" : /\/auction\//.test(path) ? "auction" : "market";
  var tabs = [
    { href: base + "glob/index.html", label: "მთავარი", on: SEC === "import", icon: ic('<path d="M3 17.5c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0"/><path d="M5 14.5 4 9.5h16l-1 5"/><path d="M8 9.5V6h8v3.5"/>') },
    { href: base + "index.html", label: "მარკეტი", on: SEC === "market", icon: ic('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/>') },
    { agent: true, label: "აგენტი" },
    { href: base + "auction/index.html", label: "აუქციონი", on: SEC === "auction", icon: ic('<path d="m14 4 6 6"/><path d="m11.5 6.5 6 6"/><path d="M12.8 5.2 7.2 10.8M16.8 9.2l-5.6 5.6"/><path d="m9 13-6 6"/><path d="M13 21h8"/>') },
    { menu: true, label: "მენიუ", icon: ic('<path d="M4 7h16M4 12h16M4 17h16"/>') },
  ];
  var bar = document.createElement("nav"); bar.className = "tabbar"; bar.setAttribute("aria-label", "მთავარი ნავიგაცია");
  bar.innerHTML = tabs.map(function (t) {
    if (t.agent) return '<button type="button" class="tab-agent" aria-label="Global ასისტენტი"><span class="tab-disc"><svg class="mk" viewBox="806.4 445.5 429.3 189" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="' + MARK + '"/></svg></span>' + t.label + "</button>";
    if (t.menu) return '<button type="button" class="tab-menu" aria-controls="menu">' + t.icon + t.label + "</button>";
    return '<a href="' + t.href + '"' + (t.on ? ' aria-current="page"' : "") + ">" + t.icon + t.label + "</a>";
  }).join("");
  document.body.appendChild(bar);
  document.documentElement.classList.add("has-tabbar");
  bar.querySelector(".tab-agent").addEventListener("click", function () { if (window.GMA) window.GMA.open(); });
  bar.querySelector(".tab-menu").addEventListener("click", function () { openSheet(); });

  /* The phone menu: a short list in a sheet (premium pattern), Market and Auction open in place. */
  var here = location.pathname;
  var chev = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
  var on = function (h) { return here.slice(-h.length) === h ? ' class="on"' : ""; };
  var url = function (h) { return /^(https?:|tel:|mailto:|#)/.test(h) ? h : base + h; };
  var groups = [
    { label: "იმპორტი ამერიკიდან", links: [["glob/index.html", "მთავარი"], ["glob/transport.html", "ტრანსპორტირების კალკულატორი"], ["glob/customs.html", "განბაჟების კალკულატორი"], ["glob/tracking.html", "კონტეინერის ძიება"], ["glob/documents.html", "საბუთის შემოწმება"], ["https://aiexpert.glob.ge/", "AI ექსპერტი"]] },
    { label: "მარკეტი", links: [["index.html", "მარკეტის მთავარი"], ["cars.html", "ყველა ავტომობილი"], ["cars.html?loc=transit", "გზაში საქართველოსკენ"], ["cars.html?loc=restore", "აღსადგენი"], ["sold.html", "გაყიდული"], ["leasing.html", "ლიზინგი"], ["sell.html", "ავტომობილის გაყიდვა"], ["favorites.html", "რჩეულები"]] },
    { label: "აუქციონი", links: [["auction/index.html", "მიმდინარე ლოტები"], ["auction/rules.html", "წესები"]] },
    { href: "glob/partner.html", label: "პარტნიორობა დილერებისთვის" },
    { href: "glob/about.html", label: "ჩვენ შესახებ" },
    { href: "glob/career.html", label: "კარიერა" },
    { href: "glob/contact.html", label: "კონტაქტი და ოფისები" }
  ];
  var CONTACT = ["tel:+995322424288", "032 2 42 42 88", "tel:+995551119942", "მარკეტი 551 11 99 42", "იმპორტი ორშ–პარ 10:00–02:00 · მარკეტი ორშ–შაბ 10:00–19:00"];
  var bg = document.createElement("div"); bg.className = "msh-bg";
  var sh = document.createElement("div"); sh.className = "msh"; sh.setAttribute("role", "dialog"); sh.setAttribute("aria-modal", "true"); sh.setAttribute("aria-label", "მენიუ");
  sh.innerHTML = '<div class="msh-grab"></div><div class="msh-top"><b>მენიუ</b><button class="msh-x" type="button" aria-label="დახურვა"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><ul class="msh-list">' +
    groups.map(function (g, i) {
      if (g.href) return '<li><a class="msh-row" href="' + url(g.href) + '">' + g.label + chev + "</a></li>";
      return '<li><button class="msh-row" type="button" aria-expanded="false" aria-controls="msh-' + i + '">' + g.label + chev + '</button><div class="msh-sub" id="msh-' + i + '"><div>' + g.links.map(function (l) { return '<a href="' + url(l[0]) + '"' + on(l[0].split("?")[0]) + ">" + l[1] + "</a>"; }).join("") + "</div></div></li>";
    }).join("") + '</ul><div class="msh-contact"><a href="' + CONTACT[0] + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>' + CONTACT[1] + '</a><a href="' + CONTACT[2] + '">' + CONTACT[3] + '</a></div><div class="msh-hours">' + CONTACT[4] + '</div>';
  document.body.appendChild(bg); document.body.appendChild(sh);
  var root = document.documentElement, opener = null;
  function openSheet() { opener = document.activeElement; root.classList.add("msh-open"); document.body.style.overflow = "hidden"; setTimeout(function () { sh.querySelector(".msh-x").focus({ preventScroll: true }); }, 300); }
  function closeSheet() { root.classList.remove("msh-open"); document.body.style.overflow = ""; if (opener && opener.focus) opener.focus({ preventScroll: true }); }
  bg.addEventListener("click", closeSheet); sh.querySelector(".msh-x").addEventListener("click", closeSheet);
  addEventListener("keydown", function (e) { if (e.key === "Escape" && root.classList.contains("msh-open")) closeSheet(); });
  sh.querySelectorAll("button.msh-row").forEach(function (b) { b.addEventListener("click", function () { var open = b.getAttribute("aria-expanded") === "true"; b.setAttribute("aria-expanded", String(!open)); }); });
  var y0 = null; sh.addEventListener("touchstart", function (e) { if (sh.scrollTop <= 0) y0 = e.touches[0].clientY; }, { passive: true });
  sh.addEventListener("touchend", function (e) { if (y0 !== null && e.changedTouches[0].clientY - y0 > 90) closeSheet(); y0 = null; }, { passive: true });
})();
/* Phone: once the page moves, the header turns solid so its icons never sit on top of the hero text. */
(function () {
  if (!matchMedia("(max-width: 760px)").matches) return;
  var h = document.querySelector(".head"); if (!h) return;
  var on = function () { document.documentElement.classList.toggle("m-scrolled", window.scrollY > 24); };
  window.addEventListener("scroll", on, { passive: true }); on();
})();
/* Phone car page: dots under the photo that follow the swipe. */
(function () {
  if (!matchMedia("(max-width: 760px)").matches) return;
  var tries = 0, t = setInterval(function () {
    var row = document.getElementById("stripRow"); tries++;
    if (!row || tries > 40) return clearInterval(t);
    var n = row.querySelectorAll("button:not(.skel)").length; if (n < 2) return;
    clearInterval(t);
    var dots = document.createElement("div"); dots.className = "m-dots"; dots.setAttribute("aria-hidden", "true");
    dots.innerHTML = new Array(Math.min(n, 12) + 1).join("<i></i>");
    row.parentNode.appendChild(dots);
    var paint = function () { var i = Math.round(row.scrollLeft / row.clientWidth); dots.querySelectorAll("i").forEach(function (d, k) { d.classList.toggle("on", k === Math.min(i, 11)); }); };
    row.addEventListener("scroll", paint, { passive: true }); paint();
  }, 250);
})();
/* Phone hero (26 Nov): each tall photo is placed so its WHOLE car sits between the header and the headline, on
   any phone. CAR = where the car is in each photo (fractions of width/height, measured on the 1520×2688 files).
   For the current screen it tries the largest zoom (up to 1.8× "cover") at which the car, centred, still fits
   that space with a margin, while the photo still covers the whole hero; smaller screens get less zoom. */
(function () {
  var mq = matchMedia("(max-width: 860px)");
  var hero = document.querySelector("[data-hero]"); if (!hero) return;
  var CAR = { taycan: [.367, .529, .878, .683], etron: [.397, .521, .934, .669], x5: [.278, .404, .932, .600], port: [.66, .478, .90, .578] };
  var head = document.querySelector(".head"), body = hero.querySelector(".hero__body");
  function fitOne(img) {
    var m = (img.currentSrc || img.src).match(/hero-([a-z0-9]+)(?:-m)?\.jpg/), box = m && CAR[m[1]];
    if (!mq.matches || !box) { img.style.cssText = img.style.cssText.replace(/(left|top|width|height|max-width|transform-origin):[^;]*;?/g, ""); return; }
    var hr = hero.getBoundingClientRect(), W = hr.width, H = hr.height; if (!W || !H) return;
    var iw = img.naturalWidth || 1520, ih = img.naturalHeight || 2688;
    var title = body && (body.querySelector("h1, .display") || body);
    var top = Math.max(0, (head ? head.getBoundingClientRect().height : 56)) + 14;
    var bottom = (title ? title.getBoundingClientRect().top - hr.top : H * .6) - 16;
    if (bottom - top < 120) bottom = top + 120;
    var L = 14, R = W - 14, cover = Math.max(W / iw, H / ih), best = null;
    for (var z = 1.8; z >= 0.999; z -= 0.02) {
      var dw = iw * cover * z, dh = ih * cover * z;
      var cw = (box[2] - box[0]) * dw, ch = (box[3] - box[1]) * dh;
      var x = (L + R) / 2 - (box[0] + box[2]) / 2 * dw, y = (top + bottom) / 2 - (box[1] + box[3]) / 2 * dh;
      x = Math.min(0, Math.max(W - dw, x)); y = Math.min(0, Math.max(H - dh, y));
      var cx0 = x + box[0] * dw, cx1 = x + box[2] * dw, cy0 = y + box[1] * dh, cy1 = y + box[3] * dh;
      best = { x: x, y: y, w: dw, h: dh, ox: (cx0 + cx1) / 2 - x, oy: (cy0 + cy1) / 2 - y };
      if (cw <= (R - L) * .96 && cx0 >= L && cx1 <= R && cy0 >= top && cy1 <= bottom) break;
    }
    var st = img.style;
    st.left = best.x + "px"; st.top = best.y + "px"; st.width = best.w + "px"; st.height = best.h + "px"; st.maxWidth = "none";
    st.transformOrigin = best.ox + "px " + best.oy + "px";
  }
  function fit() { hero.querySelectorAll(".hero__slide picture img").forEach(fitOne); }
  fit();
  new MutationObserver(function () { fit(); hero.querySelectorAll(".hero__slide picture img").forEach(function (i) { if (!i.complete) i.addEventListener("load", fit, { once: true }); }); }).observe(hero, { childList: true, subtree: true });
  hero.querySelectorAll("img").forEach(function (i) { if (!i.complete) i.addEventListener("load", fit, { once: true }); });
  if (window.ResizeObserver) { new ResizeObserver(fit).observe(hero); if (body) new ResizeObserver(fit).observe(body); }
  addEventListener("resize", fit); if (document.fonts) document.fonts.ready.then(fit);
  if (mq.addEventListener) mq.addEventListener("change", fit);
})();
/* Phone hero: the photo gets exactly the space the words leave. */
(function () {
  if (!matchMedia("(max-width: 760px)").matches) return;
  var hero = document.querySelector("[data-hero]"), body = hero && hero.querySelector(".hero__body"); if (!body) return;
  var set = function () { hero.style.setProperty("--m-body", (body.offsetHeight + 6) + "px"); };
  set(); new ResizeObserver(set).observe(body); addEventListener("resize", set);
})();
