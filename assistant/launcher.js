/* Global Market × AI agent: the corner launcher (25 Nov 2026).
   One script on every page: <script src="assistant/launcher.js" data-origin="https://…" defer></script>
   The button carries the Global car mark (a headlight sweep crosses it now and then), opens the agent
   with a circular reveal from the button (full sheet on a phone, side panel on a desktop), and on a car
   page offers "find similar", starting the hunt already filled with that car. */
(function () {
  "use strict";
  var me = document.currentScript;
  var ORIGIN = (me && me.dataset.origin) || "http://localhost:3200";
  var MARK = "M 1140.8125 535.421875 C 1127.289062 537.550781 1115.449219 539.242188 1105.28125 540.5 C 1128.140625 522.742188 1186.152344 483.246094 1213.246094 514.363281 C 1217.851562 519.65625 1223.363281 529.941406 1225.871094 536.375 C 1229.578125 545.882812 1232.246094 557.609375 1233.941406 571.542969 C 1236.46875 592.308594 1235.484375 612.515625 1235.222656 633.386719 C 1230.824219 634.0625 1228.625 634.402344 1228.625 634.402344 C 1230.390625 591.15625 1227.839844 560.042969 1220.976562 541.066406 C 1217.941406 532.671875 1212.84375 525.339844 1206.511719 519.085938 C 1202.148438 514.777344 1198.761719 513.914062 1196.355469 516.488281 C 1194.59375 518.375 1191.359375 528.230469 1189.539062 531.871094 C 1178.378906 525.457031 1162.136719 526.640625 1140.8125 535.421875 M 1183.078125 587.609375 L 806.464844 585.933594 C 958.570312 590.707031 1144.285156 593.101562 1191.464844 592.65625 C 1195.101562 592.621094 1196.132812 592.246094 1198.582031 595.570312 C 1204.777344 603.976562 1196.039062 618.875 1189.515625 622 C 1182.027344 625.585938 1165.160156 628.15625 1138.921875 629.703125 C 1138.921875 629.703125 1155.671875 629.027344 1189.171875 627.675781 C 1205.101562 629.328125 1217.703125 602.921875 1206.914062 590.894531 C 1202.125 585.554688 1197.207031 587.394531 1190.4375 587.496094 Z M 1004.160156 544.898438 C 1047.285156 544.554688 1100.101562 549.148438 1153.597656 539.410156 C 1160.40625 538.167969 1166.957031 536.703125 1173.367188 535.652344 C 1183.597656 533.976562 1185.9375 532.796875 1194.265625 540.625 C 1207.054688 552.644531 1216.910156 579.605469 1189.929688 577.167969 C 1161.976562 576.949219 1143.113281 576.800781 1133.34375 576.726562 C 1125.335938 576.664062 1126.292969 577.808594 1120.15625 572.785156 C 1114.753906 568.359375 1111.277344 563.730469 1109.730469 558.898438 C 1113.382812 563.085938 1116.410156 566.214844 1118.8125 568.289062 C 1123.761719 572.554688 1126.882812 571.171875 1133.101562 571.339844 C 1153.367188 571.886719 1172.308594 571.628906 1189.929688 570.570312 C 1190.609375 562.882812 1189.59375 557.300781 1186.882812 553.820312 C 1181.832031 544.601562 1171.847656 541.554688 1156.9375 544.683594 C 1111.109375 553.980469 1043.5 545.433594 1004.160156 544.898438 M 938.535156 448.4375 C 1011.125 443.894531 1068.796875 444.804688 1111.550781 451.171875 C 1124.371094 453.082031 1126.183594 452.878906 1136.242188 461.664062 C 1143.015625 467.582031 1148.851562 474.507812 1153.746094 482.445312 C 1148.5 483.796875 1153.746094 482.445312 1169.480469 478.382812 C 1184.074219 475.476562 1197.101562 475.648438 1208.5625 478.890625 C 1215.199219 480.59375 1218.179688 483.21875 1217.5 486.765625 C 1216.667969 491.144531 1212.621094 490.039062 1208.5 490.515625 C 1199.238281 491.589844 1189.359375 493.464844 1178.871094 496.148438 C 1187.820312 488.671875 1192.304688 490.542969 1201.683594 487.917969 C 1224.59375 481.5 1194.65625 479.582031 1188.261719 479.609375 C 1175.167969 479.667969 1166.621094 483.234375 1162.628906 490.3125 C 1165.394531 493.007812 1166.324219 495.039062 1165.421875 496.402344 C 1160.761719 496.972656 1156.277344 498.917969 1151.96875 502.238281 C 1106.171875 498.003906 1030.628906 496.398438 925.335938 497.417969 C 980.121094 490.269531 1054.394531 490.605469 1148.164062 498.433594 C 1140.292969 485.289062 1133.605469 475.636719 1128.105469 469.480469 C 1118.863281 459.132812 1103.75 456.84375 1090.585938 454.597656 C 1045.691406 446.945312 970.113281 448.273438 938.535156 448.4375";
  var ka = (document.documentElement.lang || "ka").indexOf("ka") === 0;
  var T = ka
    ? { open: "Global ასისტენტი", hint: "აგენტი მოგიძებნის მანქანას", similar: "მსგავსის მოძებნა", close: "დახურვა", title: "Global ასისტენტი", loading: "აგენტი ემზადება", signTitle: "სატესტო სერვერი", signBody: "აგენტი ჯერ პაროლით იხსნება. გახსენით, შედით და დაბრუნდით.", signGo: "აგენტის გახსნა" }
    : { open: "Global assistant", hint: "Let the agent find your car", similar: "Find similar", close: "Close", title: "Global assistant", loading: "Getting ready", signTitle: "Test server", signBody: "The agent still needs the test password. Open it, sign in and come back.", signGo: "Open the agent" };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var markSvg = function (cls) { return '<svg class="' + cls + '" viewBox="806.4 445.5 429.3 189" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="' + MARK + '"/></svg>'; };
  var xSvg = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  // ── The car this page is about, if any: "find similar" starts from it.
  function carContext() {
    var t = document.getElementById("title"), p = document.getElementById("tPrice");
    if (!t || !/car\.html/.test(location.pathname)) return null;
    var name = (t.textContent || "").trim(); var m = name.match(/^(\d{4})\s+(.+)$/);
    if (!m) return null;
    var usd = p && /\$/.test(p.textContent) ? Number((p.textContent || "").replace(/[^\d]/g, "")) : 0;
    var year = +m[1]; var bucket = year >= 2022 ? "2022" : year >= 2019 ? "2019" : year >= 2016 ? "2016" : "any";
    var words = m[2].split(/\s+/).slice(0, 2).join(" ");
    return { q: words, year: bucket, budget: usd ? Math.min(60000, Math.max(3000, Math.round(usd * 1.1 / 500) * 500)) : 0 };
  }

  // ── Markup
  var root = document.createElement("div"); root.className = "gma"; root.setAttribute("data-state", "closed");
  root.innerHTML =
    '<span class="gma-hint" aria-hidden="true"><span class="gma-hint-text"></span></span>' +
    '<button type="button" class="gma-btn" aria-expanded="false" aria-controls="gma-panel" aria-label="' + T.open + '">' +
      '<span class="gma-face">' + markSvg("gma-mark") + '<span class="gma-sweep"></span></span>' +
      '<span class="gma-x">' + xSvg + '</span>' +
    '</button>';
  var scrim = document.createElement("div"); scrim.className = "gma-scrim";
  var panel = document.createElement("section"); panel.className = "gma-panel"; panel.id = "gma-panel";
  panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true"); panel.setAttribute("aria-label", T.title); panel.hidden = true;
  panel.innerHTML =
    '<header class="gma-head"><span class="gma-grab" aria-hidden="true"></span>' +
      '<span class="gma-brand">' + markSvg("gma-brand-mark") + '<b>' + T.title + '</b></span>' +
      '<button type="button" class="gma-close" aria-label="' + T.close + '">' + xSvg + '</button></header>' +
    '<div class="gma-body"><div class="gma-wait" aria-hidden="true">' + markSvg("gma-wait-mark") + '<span>' + T.loading + '</span></div>' +
      '<div class="gma-signin"><b>' + T.signTitle + '</b><span>' + T.signBody + '</span><a class="gma-signin-btn" href="' + ORIGIN.replace(/\/$/, "") + '/assistant">' + T.signGo + '</a></div>' +
      '<iframe class="gma-frame" title="' + T.title + '" allow="clipboard-write" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>';
  document.body.appendChild(scrim); document.body.appendChild(panel); document.body.appendChild(root);
  var btn = root.querySelector(".gma-btn"), hint = root.querySelector(".gma-hint"), hintText = root.querySelector(".gma-hint-text");
  var frame = panel.querySelector(".gma-frame"), head = panel.querySelector(".gma-head");

  function src(ctx) {
    var q = new URLSearchParams({ lang: ka ? "ka" : "en", theme: document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light" });
    if (ctx) { if (ctx.budget) q.set("budget", ctx.budget); if (ctx.year) q.set("year", ctx.year); if (ctx.q) q.set("q", ctx.q); q.set("go", "1"); }
    return ORIGIN.replace(/\/$/, "") + "/assistant?" + q.toString();
  }
  var loadedFor = "";
  function warm(ctx) { var s = src(ctx); if (loadedFor === s) return; loadedFor = s; panel.classList.remove("is-ready"); frame.src = s; }
  // The agent says when it is up. If it does not, the test server is asking for its password, and an iPhone
  // never sends that password into a frame on another site. Then the agent opens as a whole page instead
  // (Safari asks for the password there once), with a close button that comes back to this page.
  var agentUp = false, frameDead = false;
  function fullPage(ctx) { location.href = src(ctx) + "&back=" + encodeURIComponent(location.href.split("#")[0]); }
  addEventListener("message", function (e) { if (e.data && e.data.type === "gma-ready" && ORIGIN.indexOf(e.origin) === 0) { agentUp = true; frameDead = false; panel.classList.add("is-ready"); panel.classList.remove("needs-signin"); } });
  frame.addEventListener("load", function () { setTimeout(function () { if (agentUp) return; frameDead = true; panel.classList.add("needs-signin"); if (root.getAttribute("data-state") === "open") fullPage(carContext()); }, 2500); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden && panel.classList.contains("needs-signin")) { loadedFor = ""; warm(carContext()); } });

  // ── Sit above the car page's price bar and the compare bar, whatever their height.
  function place() {
    var lift = 0;
    document.querySelectorAll(".mbar, .cmpbar").forEach(function (el) { var r = el.getBoundingClientRect(); if (r.height && getComputedStyle(el).display !== "none" && r.top < innerHeight) lift = Math.max(lift, innerHeight - r.top); });
    root.style.setProperty("--gma-lift", lift + "px");
  }
  place(); addEventListener("resize", place); setInterval(place, 1500);

  // ── The hint: once a session, a few seconds after the page settles; gone on the first scroll.
  var ctxNow = null;
  function showHint() {
    ctxNow = carContext();
    hintText.textContent = ctxNow ? T.similar : T.hint;
    root.classList.add("has-hint");
    setTimeout(function () { root.classList.remove("has-hint"); }, 6500);
    try { sessionStorage.setItem("gma-hint", "1"); } catch (e) {}
  }
  var seen = false; try { seen = sessionStorage.getItem("gma-hint") === "1"; } catch (e) {}
  if (!seen) setTimeout(showHint, 2600);
  // The hint leaves when the reader really scrolls (not on the page's own small adjustments at load).
  var y0 = scrollY;
  addEventListener("scroll", function () { if (Math.abs(scrollY - y0) > 60) root.classList.remove("has-hint"); root.classList.toggle("is-tucked", scrollY > 480); }, { passive: true });
  // A car page offers "find similar" as soon as its car (loaded after the page) has a title and a price.
  var tries = 0, watch = setInterval(function () {
    tries += 1;
    var ctx = carContext();
    if (ctx && ctx.budget) {
      ctxNow = ctx; hintText.textContent = T.similar; root.classList.add("is-similar", "on-car"); clearInterval(watch);
      // On a phone the floating pill would cover the page: an inline "find similar" under the title instead.
      var t = document.getElementById("title");
      if (t && !document.querySelector(".gma-inline")) {
        var b = document.createElement("button"); b.type = "button"; b.className = "gma-inline";
        b.innerHTML = '<span class="gma-inline-disc">' + markSvg("") + "</span>" + T.similar;
        b.addEventListener("click", open); t.insertAdjacentElement("afterend", b);
      }
    }
    else if (tries > 20) clearInterval(watch);
  }, 500);

  // Warm the agent while the reader is still deciding.
  (window.requestIdleCallback || function (f) { setTimeout(f, 2500); })(function () { warm(carContext()); });
  btn.addEventListener("pointerenter", function () { warm(carContext()); }, { once: true });

  // ── Open / close: a circle grows from the button into the panel, and folds back into it.
  var opener = null;
  function origin() { var r = btn.getBoundingClientRect(), p = panel.getBoundingClientRect(); return (r.left + r.width / 2 - p.left) + "px " + (r.top + r.height / 2 - p.top) + "px"; }
  function open() {
    var ctx = carContext();
    if (frameDead) { fullPage(ctx); return; }
    warm(ctx);
    opener = document.activeElement; panel.hidden = false; root.classList.remove("has-hint");
    root.setAttribute("data-state", "open"); btn.setAttribute("aria-expanded", "true"); btn.setAttribute("aria-label", T.close);
    document.documentElement.classList.add("gma-lock");
    panel.style.setProperty("--gma-from", origin());
    requestAnimationFrame(function () { requestAnimationFrame(function () { panel.classList.add("is-open"); scrim.classList.add("is-open"); }); });
    setTimeout(function () { panel.querySelector(".gma-close").focus({ preventScroll: true }); }, reduce ? 0 : 420);
  }
  function close() {
    panel.style.setProperty("--gma-from", origin());
    panel.classList.remove("is-open"); scrim.classList.remove("is-open");
    root.setAttribute("data-state", "closed"); btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-label", T.open);
    document.documentElement.classList.remove("gma-lock");
    panel.style.transform = "";
    setTimeout(function () { if (!panel.classList.contains("is-open")) panel.hidden = true; }, reduce ? 0 : 520);
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }
  window.GMA = { open: open, close: close };
  btn.addEventListener("click", function () { root.getAttribute("data-state") === "open" ? close() : open(); });
  hint.addEventListener("click", open);
  panel.querySelector(".gma-close").addEventListener("click", close);
  panel.querySelector(".gma-signin-btn").addEventListener("click", function (e) { e.preventDefault(); fullPage(carContext()); });
  scrim.addEventListener("click", close);
  addEventListener("keydown", function (e) { if (e.key === "Escape" && root.getAttribute("data-state") === "open") close(); });

  // ── Phone: pull the sheet down by its header to close it.
  var startY = null;
  head.addEventListener("pointerdown", function (e) { if (e.target.closest(".gma-close")) return; startY = e.clientY; head.setPointerCapture(e.pointerId); panel.classList.add("is-dragging"); });
  head.addEventListener("pointermove", function (e) { if (startY === null) return; var dy = Math.max(0, e.clientY - startY); panel.style.transform = "translateY(" + dy + "px)"; });
  head.addEventListener("pointerup", function (e) { if (startY === null) return; var dy = e.clientY - startY; startY = null; panel.classList.remove("is-dragging"); if (dy > 110) close(); else panel.style.transform = ""; });
})();
