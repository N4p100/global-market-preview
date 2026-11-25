/* Global Market — phone tab bar (25 Nov 2026). Market · Auction · Agent · Saved · Menu.
   Not on pages with their own bottom action bar (a car, a lot). */
(function () {
  "use strict";
  if (document.querySelector(".mbar, .lotbar")) return;
  var base = window.GM_BASE || window.V8_BASE || "";
  var path = location.pathname;
  var MARK = (document.querySelector(".logo svg path:last-child") || {}).getAttribute ? document.querySelector(".logo svg path:last-child").getAttribute("d") : "";
  var ic = function (d) { return '<svg viewBox="0 0 24 24" class="ic" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">' + d + "</svg>"; };
  var tabs = [
    { href: base + "index.html", label: "მარკეტი", on: /\/(index\.html)?$|\/cars\.html|\/car\.html/.test(path) && !/auction/.test(path), icon: ic('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/>') },
    { href: base + "auction/index.html", label: "აუქციონი", on: /auction/.test(path), icon: ic('<path d="m14 4 6 6"/><path d="m11.5 6.5 6 6"/><path d="M12.8 5.2 7.2 10.8M16.8 9.2l-5.6 5.6"/><path d="m9 13-6 6"/><path d="M13 21h8"/>') },
    { agent: true, label: "აგენტი" },
    { href: base + "favorites.html", label: "რჩეულები", on: /favorites/.test(path), icon: ic('<path d="M12 20s-7.5-4.6-9.2-9.4C1.6 7.2 3.9 4 7.3 4c2 0 3.6 1.1 4.7 2.7C13.1 5.1 14.7 4 16.7 4c3.4 0 5.7 3.2 4.5 6.6C19.5 15.4 12 20 12 20Z"/>') },
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
  bar.querySelector(".tab-menu").addEventListener("click", function () { var m = document.querySelector("[data-menu]"); if (m) m.click(); });
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
/* Phone hero: a blurred copy of each slide's photo fills the screen behind the sharp one. */
(function () {
  if (!matchMedia("(max-width: 760px)").matches) return;
  var hero = document.querySelector("[data-hero]"); if (!hero) return;
  var add = function () {
    hero.querySelectorAll(".hero__slide").forEach(function (s) {
      if (s.querySelector(".m-amb")) return;
      var img = s.querySelector("picture img"); if (!img) return;
      var a = document.createElement("img"); a.className = "m-amb"; a.alt = ""; a.setAttribute("aria-hidden", "true");
      a.src = (img.currentSrc || img.src).replace(/hero-([a-z0-9]+)\.jpg/, "hero-$1-m.jpg");
      s.insertBefore(a, s.firstChild);
    });
  };
  add(); new MutationObserver(add).observe(hero, { childList: true });
  document.querySelectorAll("img").forEach(function (i) { i.addEventListener("load", add, { once: true }); });
})();
/* Phone hero: the photo gets exactly the space the words leave. */
(function () {
  if (!matchMedia("(max-width: 760px)").matches) return;
  var hero = document.querySelector("[data-hero]"), body = hero && hero.querySelector(".hero__body"); if (!body) return;
  var set = function () { hero.style.setProperty("--m-body", (body.offsetHeight + 6) + "px"); };
  set(); new ResizeObserver(set).observe(body); addEventListener("resize", set);
})();
