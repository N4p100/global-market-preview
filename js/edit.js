/* Edit mode (CMS). Click a text and type, click a photo to replace it, move or copy list items, then Publish.
   What is editable comes from the data-c* markers that tools/cms.py also reads. Publishing writes
   content/*.json (and uploaded photos) to GitHub in one commit; .github/workflows/cms.yml then writes the
   values into the pages. On localhost, tools/cms_serve.py saves to disk instead. */
(function () {
  "use strict";
  var ROOT = window.GM_EDIT_ROOT;
  if (!ROOT || window.GMEdit) return;

  // ---------- where am I ----------
  var REL = (function () {
    var u = location.href.split(/[?#]/)[0], r = u.indexOf(ROOT) === 0 ? decodeURIComponent(u.slice(ROOT.length)) : "";
    if (!r || r.slice(-1) === "/") r += "index.html";
    return r;
  })();
  var PDIR = REL.indexOf("/") >= 0 ? REL.slice(0, REL.lastIndexOf("/")) : "";
  var ABS = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\?)/i;
  var M = null, PID = null, TOKEN_KEY = "gm-edit-token";
  var IC = {
    pen: '<path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>', down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/>',
    del: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    img: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 8"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>', check: '<path d="m5 12 5 5L20 7"/>',
    pages: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/>'
  };
  function ic(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + IC[n] + "</svg>"; }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  // ---------- links: stored from the site root, written relative to the page ----------
  function norm(p) {
    var out = [];
    p.split("/").forEach(function (s) {
      if (!s || s === ".") return;
      if (s === ".." && out.length && out[out.length - 1] !== "..") out.pop(); else out.push(s);
    });
    return out.join("/");
  }
  function splitUrl(v) { var m = /^([^?#]*)(.*)$/.exec(v); return [m[1], m[2]]; }
  function urlOut(v, image) {
    v = (v || "").trim();
    if (!v || ABS.test(v) || v.charAt(0) === "/") return v;
    var p = splitUrl(v), full = p[0] ? norm((PDIR ? PDIR + "/" : "") + p[0]) : PDIR;
    if (full.indexOf("..") === 0) return v;
    return (image ? "/" : "") + full + p[1];
  }
  function urlIn(v) {
    v = String(v || "").trim();
    if (!v || (ABS.test(v) && v.charAt(0) !== "/") || v.indexOf("//") === 0) return v;
    var p = splitUrl(v.replace(/^\/+/, "")), from = PDIR ? PDIR.split("/") : [], to = p[0].split("/"), i = 0;
    while (i < from.length && i < to.length - 1 && from[i] === to[i]) i++;
    var rel = new Array(from.length - i + 1).join("../") + to.slice(i).join("/");
    return (rel || ".") + p[1];
  }
  function assetUrl(stored) { return stored && stored.charAt(0) === "/" ? ROOT + stored.slice(1) : stored; }

  // ---------- markers -> bindings (mirrors tools/cms.py) ----------
  function parseFields(spec) {
    return (spec || "").split(";").filter(function (x) { return x.trim(); }).map(function (x) {
      var b = x.trim().split(":"); return { sel: b[0], key: b[1], how: b[2] || "c" };
    });
  }
  function matches(el, sel) {
    var i = sel.indexOf("."), tag = i < 0 ? sel : sel.slice(0, i), cls = i < 0 ? "" : sel.slice(i + 1);
    if (tag && el.tagName.toLowerCase() !== tag) return false;
    return !cls || el.classList.contains(cls);
  }
  function effective(el, auto, used) {
    var m = { c: el.getAttribute("data-c"), text: el.getAttribute("data-c-text"), img: el.getAttribute("data-c-img"),
      list: el.getAttribute("data-c-list"), attrs: [] };
    (el.getAttribute("data-c-attr") || "").split(";").forEach(function (x) { if (x.indexOf(":") > 0) m.attrs.push(x.split(":")); });
    (auto || []).forEach(function (f, i) {
      if (used[i] || !matches(el, f.sel)) return;
      used[i] = true;
      if (f.how === "c") m.c = f.key; else if (f.how === "text") m.text = f.key; else if (f.how === "img") m.img = f.key;
      else m.attrs.push([f.how, f.key]);
    });
    return m;
  }
  function kids(el) { return Array.prototype.slice.call(el.children); }
  function listItems(c) { return kids(c).slice(+(c.getAttribute("data-c-skip") || 0)); }

  // Every binding: {el, kind: c|text|img|attr|list, key, name?, scope: {list, item}|null}
  var ALL = [];
  function bind(b) {
    (b.el.__gm = b.el.__gm || []).push(b); ALL.push(b);
    if ((b.kind === "c" || b.kind === "text" || b.kind === "img") && !document.head.contains(b.el)) b.el.classList.add(b.kind === "img" ? "gme-fi" : "gme-f");
    return b;
  }
  function scan(el, auto, used, scope, out) {
    var m = effective(el, auto, used);
    if (m.img) out(bind({ el: el, kind: "img", key: m.img, scope: scope }));
    m.attrs.forEach(function (a) { out(bind({ el: el, kind: "attr", name: a[0], key: a[1], scope: scope })); });
    if (m.c) { out(bind({ el: el, kind: "c", key: m.c, scope: scope })); return; }
    if (m.text) { out(bind({ el: el, kind: "text", key: m.text, scope: scope })); return; }
    if (m.list) {
      var skip = +(el.getAttribute("data-c-skip") || 0);
      el.__gmList = { key: m.list, fields: parseFields(el.getAttribute("data-c-fields")), scope: scope };
      el.__gmSeq = numEls(el).every(function (n, i) { return n && /^\d+$/.test(n.textContent.trim()) && +n.textContent.trim() === i + 1; }) && listItems(el).length > 1;
      out(bind({ el: el, kind: "list", key: m.list, scope: scope }));
      kids(el).slice(0, skip).forEach(function (k) { scan(k, auto, used, scope, out); });
      listItems(el).forEach(function (it) { scanItem(it, el, out); });
      return;
    }
    kids(el).forEach(function (k) { scan(k, auto, used, scope, out); });
  }
  function scanItem(it, container, out) {
    it.__gmItem = container; it.classList.add("gme-it");
    scan(it, container.__gmList.fields, {}, { list: container, item: it }, out || function () {});
  }

  // ---------- reading values back from the page ----------
  function domText(node) {
    var out = "";
    Array.prototype.forEach.call(node.childNodes, function (n) {
      if (n.nodeType === 3) { out += n.nodeValue; return; }
      if (n.nodeType !== 1 || n.classList.contains("gme-ui")) return;
      var t = n.tagName;
      if (t === "BR") out += "\n";
      else if (t === "B" || t === "STRONG") out += "**" + domText(n) + "**";
      else if (t === "SPAN" && n.classList.contains("red-w")) out += "*" + domText(n) + "*";
      else if (t === "A") out += "[" + domText(n) + "](" + urlOut(n.getAttribute("href") || "") + ")";
      else if (t === "DIV" || t === "P") out += (out && out.slice(-1) !== "\n" ? "\n" : "") + domText(n);
      else out += domText(n);
    });
    return out;
  }
  function clean(s) { return s.replace(/ /g, " ").replace(/\*\*\*\*/g, "").replace(/\n+$/, ""); }
  function ownText(el) {
    var span = el.querySelector(":scope > [data-gm-t]");
    if (span) return span.textContent;
    for (var i = 0; i < el.childNodes.length; i++) { var n = el.childNodes[i]; if (n.nodeType === 3 && n.nodeValue.trim()) return n.nodeValue.trim(); }
    return "";
  }
  function imgValue(el) {
    if (el.__gmImg) return el.__gmImg;
    var pic = el.parentElement && el.parentElement.tagName === "PICTURE" ? el.parentElement : null;
    var src = el.getAttribute("src") || "", v = { src: urlOut(src, true) }, so = pic && pic.querySelector("source");
    if (so) v.phone = urlOut(so.getAttribute("srcset") || "", true);
    else if (el.getAttribute("srcset")) {
      var small = el.getAttribute("srcset").split(",").map(function (p) { return p.trim().split(/\s+/)[0]; }).filter(function (p) { return p && p !== src; });
      if (small.length) v.phone = urlOut(small[0], true);
    }
    if (el.getAttribute("alt")) v.alt = el.getAttribute("alt");
    return v;
  }
  function readOne(b) {
    if (b.kind === "c") return clean(b.el.tagName === "TITLE" ? b.el.textContent : domText(b.el));
    if (b.kind === "text") return clean(ownText(b.el));
    if (b.kind === "img") return imgValue(b.el);
    if (b.kind === "attr") { var raw = b.el.getAttribute(b.name) || ""; return b.name === "href" || b.name === "src" ? urlOut(raw, b.name === "src") : raw; }
    if (b.kind === "list") return readList(b.el);
  }
  function setPath(obj, key, val) {
    var parts = key.split("."), d = obj;
    for (var i = 0; i < parts.length - 1; i++) { if (typeof d[parts[i]] !== "object" || !d[parts[i]]) d[parts[i]] = {}; d = d[parts[i]]; }
    d[parts[parts.length - 1]] = val;
  }
  function readList(container) {
    return listItems(container).map(function (it) {
      var obj = {}, found = [];
      scan(it, container.__gmList.fields, {}, { list: container, item: it }, function (b) { found.push(b); });
      found.forEach(function (b) { if (b.scope && b.scope.item === it) setPath(obj, b.key, readOne(b)); });
      return obj;
    });
  }

  // ---------- what changed ----------
  var dirty = new Map(); // id -> {el, kind, key, name}
  function topBinding(b) {
    var cur = b;
    while (cur.scope) { var c = cur.scope.list; cur = { el: c, kind: "list", key: c.__gmList.key, scope: c.__gmList.scope }; }
    return cur;
  }
  var uid = 0;
  function idOf(el) { return el.__gmId || (el.__gmId = ++uid); }
  function markDirty(b) {
    var t = topBinding(b);
    dirty.set(t.kind + "|" + t.key + "|" + (t.name || "") + "|" + (t.scope ? idOf(t.el) : ""), t);
    updateBar();
  }

  // ---------- UI: bar ----------
  var bar, tool, toast, selEl = null, selBinding = null;
  function buildBar() {
    bar = h("div", "gme-ui gme-bar");
    bar.innerHTML =
      '<button type="button" class="gme-pages" data-a="pages">' + ic("pen") + '<span class="gme-t">რედაქტირება</span><span class="gme-pg"></span></button>' +
      '<button type="button" class="gme-ib" data-a="settings" title="Google და გაზიარება">' + ic("gear") + '<span class="gme-l">პარამეტრები</span></button>' +
      '<button type="button" class="gme-ib" data-a="discard" title="ცვლილებების გაუქმება" disabled>' + ic("undo") + '<span class="gme-l">გაუქმება</span></button>' +
      '<button type="button" class="gme-pub" data-a="publish" disabled>გამოქვეყნება<b class="gme-n"></b></button>' +
      '<a class="gme-ib gme-exit" href="?edit=0" title="რედაქტირებიდან გასვლა">' + ic("x") + "</a>";
    document.body.appendChild(bar);
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("[data-a]"); if (!b) return;
      var a = b.getAttribute("data-a");
      if (a === "pages") pagesPanel(); else if (a === "settings") settingsPanel();
      else if (a === "discard") ask("ყველა შეუნახავი ცვლილება გაუქმდება.", "გაუქმება").then(function (y) { if (y) { dirty.clear(); location.reload(); } });
      else if (a === "publish") publish();
    });
    bar.querySelector(".gme-exit").addEventListener("click", function (e) {
      if (!dirty.size) return;
      e.preventDefault();
      var href = this.href;
      ask("შეუნახავი ცვლილებები დაიკარგება. გავიდე რედაქტირებიდან?", "გასვლა").then(function (y) { if (y) { dirty.clear(); location.href = href; } });
    });
    toast = h("div", "gme-ui gme-toast"); document.body.appendChild(toast);
  }
  function updateBar() {
    if (!bar) return;
    var n = dirty.size;
    bar.querySelector(".gme-n").textContent = n ? " · " + n : "";
    bar.querySelector('[data-a="publish"]').disabled = !n;
    bar.querySelector('[data-a="discard"]').disabled = !n;
  }
  var toastT;
  function say(msg, ms, kind) {
    toast.innerHTML = msg; toast.className = "gme-ui gme-toast is-on" + (kind ? " is-" + kind : "");
    clearTimeout(toastT); if (ms) toastT = setTimeout(function () { toast.classList.remove("is-on"); }, ms);
  }

  // ---------- UI: sheets ----------
  function sheet(title, body, actions) {
    var wrap = h("div", "gme-ui gme-sheet"), box = h("div", "gme-box");
    box.innerHTML = '<div class="gme-head"><b>' + title + '</b><button type="button" class="gme-ib" data-x aria-label="დახურვა">' + ic("x") + "</button></div>";
    var b = h("div", "gme-body"); if (typeof body === "string") b.innerHTML = body; else b.appendChild(body);
    box.appendChild(b);
    if (actions) { var f = h("div", "gme-foot"); actions.forEach(function (a) { f.appendChild(a); }); box.appendChild(f); }
    wrap.appendChild(box); document.body.appendChild(wrap);
    function close() { wrap.remove(); }
    wrap.addEventListener("click", function (e) { if (e.target === wrap || e.target.closest("[data-x]")) close(); });
    return { el: wrap, body: b, close: close };
  }
  function ask(question, yes) {
    return new Promise(function (ok) {
      var s = sheet("დარწმუნებული ხარ?", "<p>" + question + "</p>", [
        btn("არა", "", function () { s.close(); ok(false); }),
        btn(yes || "კი", "gme-btn--ink", function () { s.close(); ok(true); })]);
    });
  }
  function btn(label, cls, fn) { var x = h("button", "gme-btn " + (cls || ""), label); x.type = "button"; x.addEventListener("click", fn); return x; }
  function label(key) { var k = key.split(".").pop(), L = (M && M.labels) || {}; return L[k] || L[k.replace(/\d+$/, "")] || k.replace(/_/g, " "); }

  function pagesPanel() {
    var names = M.names || {}, rows = [];
    Object.keys(M.pages).forEach(function (rel) {
      var pid = M.pages[rel]; if (rel.indexOf("pages/") === 0) return;
      rows.push('<a class="gme-row' + (rel === REL ? " is-on" : "") + '" href="' + esc(urlIn(rel)) + '">' + ic("pages") + "<span>" + esc(names[pid] || rel) + "</span><small>" + esc(rel) + "</small></a>");
    });
    var s = sheet("გვერდები", '<div class="gme-rows">' + rows.join("") + "</div>");
    s.body.addEventListener("click", function (e) {
      var a = e.target.closest("a"); if (!a || !dirty.size) return;
      e.preventDefault();
      ask("ამ გვერდზე შეუნახავი ცვლილებებია. ჯერ დააჭირე „გამოქვეყნებას“, თორემ დაიკარგება. გადავიდე მაინც?", "გადასვლა").then(function (y) { if (y) { dirty.clear(); location.href = a.href; } });
    });
  }

  function settingsPanel() {
    var head = ALL.filter(function (b) { return document.head.contains(b.el) && (b.kind === "c" || b.kind === "attr"); });
    var seen = {}, form = h("div", "gme-form");
    head.forEach(function (b) {
      if (seen[b.key]) return; seen[b.key] = true;
      var long = b.key.indexOf("description") >= 0, f = h("label", "gme-field");
      f.innerHTML = "<span>" + esc(label(b.key)) + "</span>" + (long ? "<textarea rows=4></textarea>" : "<input>");
      var inp = f.querySelector("input,textarea"); inp.value = readOne(b);
      inp.addEventListener("input", function () {
        ALL.forEach(function (o) {
          if (o.key !== b.key || !document.head.contains(o.el)) return;
          if (o.kind === "c") o.el.textContent = inp.value; else o.el.setAttribute(o.name, inp.value);
          markDirty(o);
        });
      });
      form.appendChild(f);
    });
    if (!head.length) form.innerHTML = "<p>ამ გვერდს Google-ის ველები არ აქვს.</p>";
    form.insertAdjacentHTML("afterbegin", '<p class="gme-hint">ასე ჩანს გვერდი Google-ში და გაზიარებისას (Facebook, Messenger).</p>');
    sheet("Google და გაზიარება", form, [btn("მზადაა", "gme-btn--ink", function () { this.closest(".gme-sheet").remove(); })]);
  }

  // ---------- editing text ----------
  var SINGLE = /^(H[1-6]|A|BUTTON|B|DT|DD|SMALL|LABEL|TITLE|SUMMARY)$/;
  function bindingOf(el, kinds) { return (el.__gm || []).filter(function (b) { return kinds.indexOf(b.kind) >= 0; })[0]; }
  function editableFrom(t) {
    for (var el = t; el && el !== document.body; el = el.parentElement) {
      if (el.classList && el.classList.contains("gme-ui")) return null;
      if (bindingOf(el, ["c", "text", "img"])) return el;
      if (el.__gmItem || bindingOf(el, ["attr"])) return el;
    }
    return null;
  }
  // hero photos sit under the text layer: a tap on an empty part of the hero reaches the photo below
  function photoUnder(x, y) {
    if (!document.elementsFromPoint) return null;
    var hit = document.elementsFromPoint(x, y).filter(function (n) { return n.classList && n.classList.contains("gme-fi"); })[0];
    return hit || null;
  }
  function caretAt(x, y) {
    var r = document.caretRangeFromPoint ? document.caretRangeFromPoint(x, y) : null;
    if (!r && document.caretPositionFromPoint) { var p = document.caretPositionFromPoint(x, y); if (p) { r = document.createRange(); r.setStart(p.offsetNode, p.offset); } }
    if (r) { var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  }
  function startText(el, b, x, y) {
    var target = el;
    if (b.kind === "text") {
      var span = el.querySelector(":scope > [data-gm-t]");
      if (!span) {
        var node = null;
        for (var i = 0; i < el.childNodes.length; i++) { var n = el.childNodes[i]; if (n.nodeType === 3 && n.nodeValue.trim()) { node = n; break; } }
        if (!node) return;
        span = document.createElement("span"); span.setAttribute("data-gm-t", "");
        var raw = node.nodeValue, lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0];
        span.textContent = raw.trim();
        var frag = document.createDocumentFragment();
        if (lead) frag.appendChild(document.createTextNode(lead));
        frag.appendChild(span);
        if (trail) frag.appendChild(document.createTextNode(trail));
        el.replaceChild(frag, node);
      }
      target = span;
    }
    target.contentEditable = "true";
    target.spellcheck = false;
    target.__gmB = b;
    target.focus({ preventScroll: true });
    if (x != null) caretAt(x, y);
    if (!target.__gmWired) {
      target.__gmWired = true;
      target.addEventListener("input", function () { markDirty(target.__gmB); mirror(target.__gmB); });
      target.addEventListener("paste", function (e) {
        e.preventDefault();
        var t = (e.clipboardData || window.clipboardData).getData("text/plain");
        document.execCommand("insertText", false, t);
      });
      target.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          if (!SINGLE.test(el.tagName) && b.kind === "c") document.execCommand("insertLineBreak");
        }
        if (e.key === "Escape") { e.preventDefault(); deselect(); }
      });
    }
    return target;
  }
  // the same key shown twice on a page (phone in header and footer): keep them equal while typing
  function mirror(b) {
    if (b.scope || b.kind === "img") return;
    var src = b.kind === "c" ? b.el.innerHTML : ownText(b.el);
    ALL.forEach(function (o) {
      if (o === b || o.key !== b.key || o.kind !== b.kind || o.scope || !document.body.contains(o.el)) return;
      if (o.kind === "c") o.el.innerHTML = src; else {
        for (var i = 0; i < o.el.childNodes.length; i++) { var n = o.el.childNodes[i]; if (n.nodeType === 3 && n.nodeValue.trim()) { n.nodeValue = n.nodeValue.replace(n.nodeValue.trim(), src); break; } if (n.nodeType === 1 && n.hasAttribute("data-gm-t")) { n.textContent = src; break; } }
      }
    });
  }

  // ---------- selection + toolbar ----------
  function deselect() {
    if (!selEl) return;
    selEl.classList.remove("gme-sel");
    selEl.querySelectorAll('[contenteditable="true"]').forEach(function (n) { n.contentEditable = "false"; });
    if (selEl.isContentEditable || selEl.contentEditable === "true") selEl.contentEditable = "false";
    selEl = null; selBinding = null;
    if (tool) tool.classList.remove("is-on");
  }
  function select(el, x, y) {
    if (selEl === el) return;
    deselect();
    selEl = el; el.classList.add("gme-sel");
    var tb = bindingOf(el, ["c", "text"]), ib = bindingOf(el, ["img"]);
    selBinding = tb || ib || null;
    if (tb) startText(el, tb, x, y);
    showTool(el, tb);
    if (ib && !tb) imagePanel(ib);
  }
  function linkOwners(el) {
    var out = [];
    for (var n = el, i = 0; n && n !== document.body && i < 4; n = n.parentElement, i++) {
      (n.__gm || []).forEach(function (b) { if (b.kind === "attr" && b.name === "href") out.push(b); });
      if (n.__gmItem) break;
    }
    return out;
  }
  function itemOf(el) { for (var n = el; n && n !== document.body; n = n.parentElement) if (n.__gmItem) return n; return null; }
  function showTool(el, tb) {
    if (!tool) { tool = h("div", "gme-ui gme-tool"); document.body.appendChild(tool); }
    var parts = [];
    if (tb && tb.kind === "c" && el.tagName !== "TITLE") {
      parts.push('<button type="button" data-t="bold" title="მუქი"><b>B</b></button>');
      parts.push('<button type="button" data-t="red" title="წითელი სიტყვა"><span class="gme-red">A</span></button>');
      parts.push('<button type="button" data-t="link" title="ბმული">' + ic("link") + "</button>");
    }
    var links = linkOwners(el);
    links.forEach(function (b, i) {
      parts.push('<label class="gme-url" title="' + esc(label(b.key)) + '">' + ic("link") + '<input data-li="' + i + '" value="' + esc(readOne(b)) + '" spellcheck="false"></label>');
    });
    var ib = bindingOf(el, ["img"]);
    if (ib && tb) parts.push('<button type="button" data-t="img" title="ფოტო">' + ic("img") + "</button>");
    var it = itemOf(el);
    if (it) {
      parts.push('<span class="gme-sep"></span>');
      parts.push('<button type="button" data-t="up" title="ზემოთ">' + ic("up") + "</button>");
      parts.push('<button type="button" data-t="down" title="ქვემოთ">' + ic("down") + "</button>");
      parts.push('<button type="button" data-t="dup" title="დამატება (ასლი)">' + ic("copy") + "</button>");
      parts.push('<button type="button" data-t="del" title="წაშლა">' + ic("del") + "</button>");
    }
    if (!parts.length) { tool.classList.remove("is-on"); return; }
    tool.innerHTML = parts.join("");
    tool.classList.add("is-on");
    tool.querySelectorAll("input[data-li]").forEach(function (inp) {
      var b = links[+inp.getAttribute("data-li")];
      inp.addEventListener("input", function () { b.el.setAttribute("href", urlIn(inp.value)); markDirty(b); });
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); inp.blur(); } });
    });
    tool.onmousedown = function (e) { if (!e.target.closest("input")) e.preventDefault(); };
    tool.onclick = function (e) {
      var b = e.target.closest("[data-t]"); if (!b) return;
      var t = b.getAttribute("data-t");
      if (t === "bold") { document.execCommand("styleWithCSS", false, false); document.execCommand("bold"); dirtyText(); }
      else if (t === "red") { wrapRed(); dirtyText(); }
      else if (t === "link") { addLink(); }
      else if (t === "img") imagePanel(ib);
      else itemAction(t, it);
    };
    placeTool();
  }
  function dirtyText() { var ed = document.activeElement; if (ed && ed.__gmB) { markDirty(ed.__gmB); mirror(ed.__gmB); } }
  function placeTool() {
    if (!tool || !selEl || !tool.classList.contains("is-on")) return;
    if (innerWidth < 700) { tool.style.left = tool.style.top = ""; tool.classList.add("is-dock"); return; }
    tool.classList.remove("is-dock");
    var r = selEl.getBoundingClientRect(), tw = tool.offsetWidth, th = tool.offsetHeight;
    var top = r.top - th - 10; if (top < 8) top = r.bottom + 10;
    var left = Math.min(Math.max(8, r.left), innerWidth - tw - 8);
    tool.style.top = top + "px"; tool.style.left = left + "px";
  }
  addEventListener("scroll", placeTool, { passive: true });
  addEventListener("resize", placeTool);
  if (window.visualViewport) visualViewport.addEventListener("resize", function () {
    if (tool) tool.style.setProperty("--vv", visualViewport.offsetTop + "px");
  });

  function wrapRed() {
    var s = getSelection(); if (!s.rangeCount) return;
    var r = s.getRangeAt(0), anc = r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentElement;
    var red = anc.closest(".red-w");
    if (red && selEl.contains(red)) { red.replaceWith.apply(red, Array.prototype.slice.call(red.childNodes)); return; }
    if (r.collapsed) return say("ჯერ მონიშნე სიტყვა, მერე დააჭირე წითელს.", 2500);
    var span = document.createElement("span"); span.className = "red-w";
    span.appendChild(r.extractContents()); r.insertNode(span);
  }
  function addLink() {
    var s = getSelection(); if (!s.rangeCount || s.getRangeAt(0).collapsed) return say("ჯერ მონიშნე ტექსტი, რომელიც ბმული გახდება.", 2500);
    var r = s.getRangeAt(0).cloneRange(), ed = document.activeElement;
    var f = h("div", "gme-form");
    f.innerHTML = '<label class="gme-field"><span>ბმული</span><input placeholder="cars.html ან https://..." spellcheck="false"></label><p class="gme-hint">საიტის გვერდი: მაგ. cars.html, glob/contact.html. სხვა საიტი: სრული https:// მისამართი.</p>';
    var sh = sheet("ბმულის დამატება", f, [btn("დამატება", "gme-btn--ink", function () {
      var v = f.querySelector("input").value.trim(); if (!v) return;
      var a = document.createElement("a"); a.className = "link"; a.setAttribute("href", urlIn(v));
      a.appendChild(r.extractContents()); r.insertNode(a); sh.close();
      if (ed && ed.__gmB) { markDirty(ed.__gmB); mirror(ed.__gmB); }
    })]);
    setTimeout(function () { f.querySelector("input").focus(); }, 30);
  }

  // ---------- lists ----------
  function numEls(c) {
    var f = c.__gmList && c.__gmList.fields.filter(function (x) { return x.key === "num"; })[0];
    return listItems(c).map(function (it) {
      if (f) { if (matches(it, f.sel)) return it; var all = it.getElementsByTagName("*"); for (var i = 0; i < all.length; i++) if (matches(all[i], f.sel)) return all[i]; return null; }
      return it.querySelector('[data-c="num"]');
    });
  }
  function renumber(c) {
    if (!c.__gmSeq) return;
    var w = c.__gmPad || (c.__gmPad = (numEls(c)[0] || { textContent: "1" }).textContent.trim().length);
    numEls(c).forEach(function (n, i) { if (n) n.textContent = String(i + 1).padStart(w, "0"); });
  }
  function itemAction(t, it) {
    var c = it.__gmItem, items = listItems(c), i = items.indexOf(it);
    var lb = { el: c, kind: "list", key: c.__gmList.key, scope: c.__gmList.scope };
    if (t === "up" && i > 0) c.insertBefore(it, items[i - 1]);
    else if (t === "down" && i < items.length - 1) c.insertBefore(items[i + 1], it);
    else if (t === "dup") {
      var cl = it.cloneNode(true);
      cl.querySelectorAll("[id]").forEach(function (n) { n.removeAttribute("id"); }); if (cl.id) cl.removeAttribute("id");
      cl.querySelectorAll("[data-mcount]").forEach(function (n) { n.setAttribute("data-mcount", ""); n.textContent = ""; });
      cl.classList.remove("gme-sel");
      cl.querySelectorAll(".gme-sel,[contenteditable]").forEach(function (n) { n.classList.remove("gme-sel"); n.removeAttribute("contenteditable"); });
      it.after(cl); scanItem(cl, c, function () {}); renumber(c);
      deselect(); markDirty(lb); select(cl); cl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      return say("ასლი დაემატა. შეცვალე ტექსტი.", 2200);
    } else if (t === "del") {
      if (items.length < 2) return say("ბოლო ელემენტს ვერ წაშლი. შეცვალე მისი ტექსტი.", 2800);
      deselect(); it.remove(); renumber(c); markDirty(lb); return say("წაიშალა. „გაუქმება“ აბრუნებს.", 2200);
    } else return;
    renumber(c); markDirty(lb); placeTool();
  }

  // ---------- photos ----------
  var uploads = {}; // stored path -> Blob
  function slug(name) { return (name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "photo").slice(0, 40); }
  function shrink(file, maxW, q) {
    return new Promise(function (ok, bad) {
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () {
        var w = Math.min(maxW, img.naturalWidth), hgt = Math.round(img.naturalHeight * w / img.naturalWidth);
        var cv = document.createElement("canvas"); cv.width = w; cv.height = hgt;
        cv.getContext("2d").drawImage(img, 0, 0, w, hgt);
        cv.toBlob(function (b) { URL.revokeObjectURL(u); b ? ok(b) : bad(new Error("ფოტო ვერ დამუშავდა")); }, "image/jpeg", q);
      };
      img.onerror = function () { bad(new Error("ფაილი ფოტო არ არის")); };
      img.src = u;
    });
  }
  function imagePanel(b) {
    var el = b.el, v = imgValue(el), pic = el.parentElement && el.parentElement.tagName === "PICTURE";
    var hasPhone = pic || !!el.getAttribute("srcset");
    var f = h("div", "gme-form gme-imgf");
    f.innerHTML =
      '<div class="gme-prev"><img alt=""></div>' +
      '<label class="gme-btn gme-btn--ink gme-file">' + ic("img") + 'ახალი ფოტო<input type="file" accept="image/*" data-f="main"></label>' +
      (hasPhone ? '<label class="gme-btn gme-file">ტელეფონის ფოტო (თუ გინდა)<input type="file" accept="image/*" data-f="phone"></label>' : "") +
      '<label class="gme-field"><span>ფოტოს აღწერა (უსინათლოებისთვის და Google-ისთვის)</span><input data-alt></label>' +
      '<p class="gme-hint">ფოტო ავტომატურად მცირდება სწრაფი ჩატვირთვისთვის. ' + (pic ? "ტელეფონზე სხვა კადრი ჩანს: თუ ცალკე არ ატვირთავ, იგივე ფოტო გამოჩნდება." : "") + "</p>";
    f.querySelector(".gme-prev img").src = el.currentSrc || el.src;
    f.querySelector("[data-alt]").value = v.alt || "";
    var sh = sheet("ფოტო", f, [btn("მზადაა", "gme-btn--ink", function () { sh.close(); deselect(); })]);
    f.querySelector("[data-alt]").addEventListener("input", function (e) {
      var nv = Object.assign({}, imgValue(el)); nv.alt = e.target.value; el.__gmImg = nv; el.setAttribute("alt", e.target.value); markDirty(b);
    });
    f.querySelectorAll("input[type=file]").forEach(function (inp) {
      inp.addEventListener("change", function () {
        var file = inp.files && inp.files[0]; if (!file) return;
        var which = inp.getAttribute("data-f"), base = "/assets/uploads/" + slug(file.name) + "-" + Date.now().toString(36);
        say("ფოტო მუშავდება…");
        var jobs = which === "main" ? [shrink(file, 2400, 0.84), hasPhone && !pic ? shrink(file, 1200, 0.82) : null] : [null, shrink(file, 1400, 0.84)];
        Promise.all(jobs).then(function (res) {
          var nv = Object.assign({}, imgValue(el)), big = res[0], small = res[1];
          if (big) { nv.src = base + ".jpg"; uploads[nv.src] = big; el.src = URL.createObjectURL(big); if (!small && !pic) delete nv.phone; }
          if (small) { nv.phone = base + (which === "main" ? "-m.jpg" : "-phone.jpg"); uploads[nv.phone] = small; }
          if (big && !small && pic) nv.phone = nv.src; // one photo for both until a phone one is chosen
          el.__gmImg = nv;
          var phoneUrl = nv.phone ? (uploads[nv.phone] ? URL.createObjectURL(uploads[nv.phone]) : assetUrl(nv.phone)) : null;
          if (el.getAttribute("srcset")) el.setAttribute("srcset", phoneUrl ? phoneUrl + " 1200w, " + el.src + " 2400w" : el.src);
          if (pic) el.parentElement.querySelectorAll("source").forEach(function (so) { so.setAttribute("srcset", phoneUrl || el.src); });
          f.querySelector(".gme-prev img").src = el.src;
          markDirty(b); say("ფოტო შეიცვალა. დააჭირე „გამოქვეყნებას“.", 2600, "ok");
        }).catch(function (e) { say(e.message, 4000, "err"); });
      });
    });
  }

  // ---------- publishing ----------
  function utf8ToB64(s) { var bytes = new TextEncoder().encode(s), bin = ""; for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(bin); }
  function b64ToUtf8(b) { var bin = atob(b.replace(/\s/g, "")), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new TextDecoder().decode(u); }
  function blobB64(blob) { return new Promise(function (ok) { var r = new FileReader(); r.onload = function () { ok(String(r.result).split(",")[1]); }; r.readAsDataURL(blob); }); }

  function collect() {
    var page = [], site = [], used = {};
    dirty.forEach(function (b) {
      var v = readOne(b);
      if (b.kind === "img" && v && v.src) Object.keys(v).forEach(function (k) { if (!v[k]) delete v[k]; });
      (b.key.indexOf("site.") === 0 ? site : page).push([b.key.indexOf("site.") === 0 ? b.key.slice(5) : b.key, v]);
      if (b.kind === "img") ["src", "phone"].forEach(function (k) { if (v[k] && uploads[v[k]]) used[v[k]] = uploads[v[k]]; });
    });
    // photos inside changed lists
    Object.keys(uploads).forEach(function (p) { if (!used[p] && document.querySelector('img[src^="blob:"]')) used[p] = uploads[p]; });
    return { page: page, site: site, photos: used };
  }
  function probeOf(changes) {
    for (var i = 0; i < changes.page.length; i++) {
      var v = changes.page[i][1];
      if (typeof v === "string" && v.replace(/[*\[\]()]/g, "").trim().length > 3) return esc(v.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*]/g, "").split("\n")[0].trim().slice(0, 40)).replace(/&quot;/g, '"');
    }
    return null;
  }
  function merge(json, pairs) { pairs.forEach(function (p) { setPath(json, p[0], p[1]); }); return JSON.stringify(json, null, 2) + "\n"; }

  // local: tools/cms_serve.py
  var local = null;
  function isLocal() {
    if (local !== null) return Promise.resolve(local);
    if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return Promise.resolve(local = false);
    return fetch(ROOT + "__cms/ping", { cache: "no-store" }).then(function (r) { return (local = r.ok); }, function () { return (local = false); });
  }
  function readLocal(path) { return fetch(ROOT + path + "?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : {}; }); }

  // GitHub
  function token() { try { return localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; } }
  function gh(path, opt) {
    opt = opt || {};
    opt.headers = Object.assign({ Authorization: "Bearer " + token(), Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" }, opt.headers || {});
    if (opt.json) { opt.body = JSON.stringify(opt.json); opt.headers["Content-Type"] = "application/json"; delete opt.json; }
    return fetch("https://api.github.com/repos/" + M.repo + path, opt).then(function (r) {
      if (r.status === 404 && opt.allow404) return null;
      if (!r.ok) return r.text().then(function (t) { var e = new Error(r.status + " " + t.slice(0, 160)); e.status = r.status; throw e; });
      return r.status === 204 ? null : r.json();
    });
  }
  function ghRead(path, sha) {
    return gh("/contents/" + path.split("/").map(encodeURIComponent).join("/") + "?ref=" + sha, { allow404: true })
      .then(function (r) { return r ? JSON.parse(b64ToUtf8(r.content)) : {}; });
  }
  function ghCommit(changes, msg, attempt) {
    var base, tree;
    return gh("/git/ref/heads/" + M.branch).then(function (ref) {
      base = ref.object.sha;
      return gh("/git/commits/" + base);
    }).then(function (c) {
      tree = c.tree.sha;
      return Promise.all([changes.page.length ? ghRead("content/pages/" + PID + ".json", base) : null, changes.site.length ? ghRead("content/site.json", base) : null]);
    }).then(function (cur) {
      var files = [];
      if (changes.page.length) files.push({ path: "content/pages/" + PID + ".json", text: merge(cur[0] || {}, changes.page) });
      if (changes.site.length) files.push({ path: "content/site.json", text: merge(cur[1] || {}, changes.site) });
      return Promise.all(Object.keys(changes.photos).map(function (p) {
        return blobB64(changes.photos[p]).then(function (b) { return { path: p.slice(1), b64: b }; });
      })).then(function (ph) { return files.concat(ph); });
    }).then(function (files) {
      return Promise.all(files.map(function (f) {
        return gh("/git/blobs", { method: "POST", json: f.b64 ? { content: f.b64, encoding: "base64" } : { content: f.text, encoding: "utf-8" } })
          .then(function (b) { return { path: f.path, mode: "100644", type: "blob", sha: b.sha }; });
      }));
    }).then(function (entries) {
      return gh("/git/trees", { method: "POST", json: { base_tree: tree, tree: entries } });
    }).then(function (t) {
      return gh("/git/commits", { method: "POST", json: { message: msg, tree: t.sha, parents: [base] } });
    }).then(function (c) {
      return gh("/git/refs/heads/" + M.branch, { method: "PATCH", json: { sha: c.sha } }).then(function () { return c.sha; });
    }).catch(function (e) {
      if ((e.status === 422 || e.status === 409) && (attempt || 0) < 2) return ghCommit(changes, msg, (attempt || 0) + 1);
      throw e;
    });
  }
  function askToken() {
    return new Promise(function (ok) {
      var f = h("div", "gme-form");
      f.innerHTML =
        '<p>გამოქვეყნებისთვის ერთხელ საჭიროა GitHub-ის გასაღები ამ საიტისთვის. ის ინახება მხოლოდ ამ ბრაუზერში.</p>' +
        '<ol class="gme-steps"><li><a href="' + esc(M.token_url) + '" target="_blank" rel="noopener">გახსენი ეს გვერდი GitHub-ზე</a> (შესული უნდა იყო N4p100 ანგარიშით).</li>' +
        "<li>Repository access: <b>Only select repositories</b> → <b>" + esc(M.repo.split("/")[1]) + "</b>.</li>" +
        "<li>Permissions → Repository → <b>Contents: Read and write</b>.</li>" +
        "<li><b>Generate token</b>, დააკოპირე და ჩასვი ქვემოთ.</li></ol>" +
        '<label class="gme-field"><span>გასაღები</span><input type="password" autocomplete="off" spellcheck="false" placeholder="github_pat_..."></label>';
      var sh = sheet("შესვლა", f, [btn("შესვლა", "gme-btn--ink", function () {
        var v = f.querySelector("input").value.trim(); if (!v) return;
        try { localStorage.setItem(TOKEN_KEY, v); } catch (e) {}
        gh("").then(function (r) {
          if (!r.permissions || !r.permissions.push) throw new Error("ამ გასაღებს ჩაწერის უფლება არ აქვს");
          sh.close(); ok(true);
        }).catch(function (e) {
          try { localStorage.removeItem(TOKEN_KEY); } catch (x) {}
          say("გასაღები არ მუშაობს: " + esc(e.message.slice(0, 80)), 5000, "err");
        });
      })]);
      sh.el.addEventListener("click", function (e) { if (e.target === sh.el || e.target.closest("[data-x]")) ok(false); });
      setTimeout(function () { f.querySelector("input").focus(); }, 30);
    });
  }
  function waitLive(probe, started) {
    if (!probe) { say("გამოქვეყნდა. საიტი 1–2 წუთში განახლდება.", 6000, "ok"); return; }
    var url = location.href.split("#")[0].replace(/([?&])edit(=1)?(&|$)/, "$1") ;
    (function tick() {
      var secs = Math.round((Date.now() - started) / 1000);
      if (secs > 240) { say("შენახულია. გვერდი მალე განახლდება (GitHub ჯერ აქვეყნებს).", 8000, "ok"); return; }
      say("ქვეყნდება… " + secs + " წმ", 0);
      fetch(url + (url.indexOf("?") < 0 ? "?" : "&") + "gm=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.text(); }).then(function (t) {
        if (t.indexOf(probe) >= 0) say('გამოქვეყნდა ✓ <button type="button" class="gme-link" onclick="location.reload()">გვერდის განახლება</button>', 0, "ok");
        else setTimeout(tick, 6000);
      }, function () { setTimeout(tick, 8000); });
    })();
  }
  var busy = false;
  function publish() {
    if (busy || !dirty.size) return;
    deselect();
    var changes = collect(), probe = probeOf(changes), msg = "CMS: " + ((M.names || {})[PID] || PID) + " (" + REL + ")";
    busy = true; say("ინახება…");
    isLocal().then(function (loc) {
      if (loc) {
        return Promise.all([readLocal("content/pages/" + PID + ".json"), readLocal("content/site.json")]).then(function (cur) {
          var files = [];
          if (changes.page.length) files.push({ path: "content/pages/" + PID + ".json", text: merge(cur[0], changes.page) });
          if (changes.site.length) files.push({ path: "content/site.json", text: merge(cur[1], changes.site) });
          return Promise.all(Object.keys(changes.photos).map(function (p) { return blobB64(changes.photos[p]).then(function (b) { return { path: p.slice(1), b64: b }; }); }))
            .then(function (ph) {
              return fetch(ROOT + "__cms/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ files: files.concat(ph), message: msg }) });
            }).then(function (r) { if (!r.ok) return r.text().then(function (t) { throw new Error(t); }); });
        }).then(function () {
          dirty.clear(); updateBar(); busy = false;
          say('შენახულია ✓ <button type="button" class="gme-link" onclick="location.reload()">გვერდის განახლება</button>', 0, "ok");
        });
      }
      var go = token() ? Promise.resolve(true) : askToken();
      return go.then(function (signed) {
        if (!signed) { busy = false; toast.classList.remove("is-on"); return; }
        return ghCommit(changes, msg).then(function () {
          dirty.clear(); updateBar(); busy = false; waitLive(probe, Date.now());
        });
      });
    }).catch(function (e) {
      busy = false;
      if (e.status === 401) { try { localStorage.removeItem(TOKEN_KEY); } catch (x) {} }
      say("ვერ შეინახა: " + esc(String(e.message || e).slice(0, 140)), 8000, "err");
    });
  }

  // ---------- start ----------
  function start() {
    fetch(ROOT + "content/manifest.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (m) {
      M = m; PID = M.pages[REL] || null;
      buildBar();
      bar.querySelector(".gme-pg").textContent = PID ? (M.names[PID] || REL) : "ამ გვერდზე სარედაქტირებელი არაფერია";
      if (!PID) { bar.querySelector('[data-a="settings"]').disabled = true; return; }
      scan(document.head, null, {}, null, function () {});
      scan(document.body, null, {}, null, function () {});
      document.addEventListener("click", function (e) {
        if (e.target.closest(".gme-ui")) return;
        var el = editableFrom(e.target) || photoUnder(e.clientX, e.clientY);
        if (!el) { if (selEl && !e.target.closest(".gme-sel")) deselect(); return; }
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        select(el, e.clientX, e.clientY);
      }, true);
      ["mousedown", "pointerdown", "touchstart"].forEach(function (t) {
        document.addEventListener(t, function (e) {
          var p = e.touches ? e.touches[0] : e;
          if (!e.target.closest(".gme-ui") && (editableFrom(e.target) || (p && photoUnder(p.clientX, p.clientY)))) e.stopPropagation();
        }, true);
      });
      addEventListener("beforeunload", function (e) { if (dirty.size) { e.preventDefault(); e.returnValue = ""; } });
      var n = ALL.filter(function (b) { return !document.head.contains(b.el); }).length;
      say("დააჭირე ნებისმიერ წითლად მონიშნულ ტექსტს ან ფოტოს და შეცვალე. " + n + " სარედაქტირებელი ადგილი.", 4500);
    }).catch(function (e) { console.error(e); alert("რედაქტორი ვერ ჩაიტვირთა: " + e.message); });
  }
  window.GMEdit = { dirty: dirty, collect: function () { return collect(); }, bindings: ALL };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
