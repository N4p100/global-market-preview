/* Edit mode switch (CMS). Loads js/edit.js + css/edit.css only when a page is opened with ?edit,
   and keeps edit mode on while moving between pages in the same tab. ?edit=0 turns it off.
   Everyone else downloads only this file (under 1 KB). */
(function () {
  var me = document.currentScript, root = new URL("../", me.src).href, q = location.search, on = false;
  try {
    if (/[?&]edit=0(&|$)/.test(q)) { sessionStorage.removeItem("gm-edit"); return; }
    if (/[?&]edit(=1)?(&|$)/.test(q)) sessionStorage.setItem("gm-edit", "1");
    on = sessionStorage.getItem("gm-edit") === "1";
  } catch (e) { on = /[?&]edit(=1)?(&|$)/.test(q); }
  if (!on) return;
  window.GM_EDIT_ROOT = root;
  document.documentElement.classList.add("gm-editing");
  var v = Date.now().toString(36);
  var l = document.createElement("link"); l.rel = "stylesheet"; l.href = root + "css/edit.css?v=" + v; document.head.appendChild(l);
  var s = document.createElement("script"); s.src = root + "js/edit.js?v=" + v; s.defer = true; document.head.appendChild(s);
})();
