/* GLOBAL v8: finder. Every filter of the live site, state kept in the URL. */
(function () {
  "use strict";
  var G = window.GM, V = window.V8, esc = G.esc;
  V.initChrome();
  function $(id) { return document.getElementById(id); }

  var ALL = [], PAGE = 24, shown = PAGE;
  var DEF = { q: "", loc: "", brand: "", model: "", body: "", fuel: "", cur: "usd", pmin: "", pmax: "", ymin: "", ymax: "", km: "", drive: "", cleared: false, warranty: false, sold: false, sort: "new" };
  var S = readUrl();
  var LOC = [["", "ყველა"], ["ge", "საქართველოში"], ["transit", "გზაში"], ["restore", "აღსადგენი"]];

  function readUrl() {
    var p = new URLSearchParams(location.search), s = JSON.parse(JSON.stringify(DEF));
    Object.keys(DEF).forEach(function (k) { var v = p.get(k); if (v == null) return; s[k] = typeof DEF[k] === "boolean" ? v === "1" : v; });
    if (p.get("price")) { var a = p.get("price").split("-"); s.pmin = a[0] || ""; s.pmax = a[1] || ""; }
    return s;
  }
  function writeUrl() {
    var p = new URLSearchParams();
    Object.keys(DEF).forEach(function (k) { var v = S[k]; if (typeof v === "boolean") { if (v) p.set(k, "1"); } else if (v !== DEF[k] && v !== "") p.set(k, v); });
    var qs = p.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
  }

  function locOk(c, loc) { if (!loc) return true; if (loc === "transit") return G.isTransit(c); if (loc === "restore") return G.isRestore(c); return !G.isTransit(c) && !G.isRestore(c); }
  function priceOf(c, cur) { var v = G.num(cur === "gel" ? c.price_gel : c.price_usd); return v && v > 0 ? v : null; }
  function match(c, s, skip) {
    skip = skip || {};
    if (!s.sold && G.isSold(c)) return false;
    if (!skip.loc && !locOk(c, s.loc)) return false;
    if (!skip.brand && s.brand && c.brand !== s.brand) return false;
    if (!skip.model && s.model && c.model !== s.model) return false;
    if (!skip.body && s.body && c.body_type !== s.body) return false;
    if (!skip.fuel && s.fuel && c.fuel !== s.fuel) return false;
    if (!skip.drive && s.drive && c.drive !== s.drive) return false;
    var pmin = +String(s.pmin).replace(/\D/g, "") || 0, pmax = +String(s.pmax).replace(/\D/g, "") || 0;
    if (pmin || pmax) { var p2 = priceOf(c, s.cur); if (p2 == null || (pmin && p2 < pmin) || (pmax && p2 > pmax)) return false; }
    if (s.ymin && (!c.year || c.year < +s.ymin)) return false;
    if (s.ymax && (!c.year || c.year > +s.ymax)) return false;
    if (s.km && (G.num(c.mileage) == null || c.mileage > +s.km)) return false;
    if (!skip.cleared && s.cleared && c.customs !== "განბაჟებული") return false;
    if (!skip.warranty && s.warranty && !G.hasWarranty(c)) return false;
    if (s.q) {
      var hay = [c.brand, c.model, c.year, c.vin, c.vin_spec && c.vin_spec.trim].join(" ").toLowerCase();
      if (!s.q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; })) return false;
    }
    return true;
  }
  function sorted(list) {
    var by = {
      new: function (a, b) { return (b.is_pinned === true) - (a.is_pinned === true) || new Date(b.created_at) - new Date(a.created_at); },
      price_asc: function (a, b) { return (priceOf(a, "usd") || 1e12) - (priceOf(b, "usd") || 1e12); },
      price_desc: function (a, b) { return (priceOf(b, "usd") || 0) - (priceOf(a, "usd") || 0); },
      year_desc: function (a, b) { return (b.year || 0) - (a.year || 0); },
      km_asc: function (a, b) { return (G.num(a.mileage) == null ? 1e12 : a.mileage) - (G.num(b.mileage) == null ? 1e12 : b.mileage); }
    }[S.sort] || function () { return 0; };
    var out = list.slice().sort(function (a, b) { return (G.photos(b).length > 0) - (G.photos(a).length > 0) || by(a, b); });
    return S.sold ? out.filter(function (c) { return !G.isSold(c); }).concat(out.filter(G.isSold)) : out;
  }
  function counts(list, key) { var m = {}; list.forEach(function (c) { var v = c[key]; if (v != null && String(v).trim() !== "") m[v] = (m[v] || 0) + 1; }); return m; }
  function base() { return ALL.filter(function (c) { return S.sold || !G.isSold(c); }); }
  function chipRow(el, m, key, all) {
    var keys = Object.keys(m).sort(function (a, b) { return m[b] - m[a]; });
    el.innerHTML = (all ? '<button type="button" class="chip" data-f="' + key + '" data-v="" aria-pressed="' + !S[key] + '">ყველა</button>' : "") +
      keys.map(function (k) { return '<button type="button" class="chip" data-f="' + key + '" data-v="' + esc(k) + '" aria-pressed="' + (S[key] === k) + '">' + esc(G.tv(k)) + " <small>" + m[k] + "</small></button>"; }).join("");
  }
  function facets() {
    var b = base();
    var lc = {}; LOC.forEach(function (l) { lc[l[0]] = b.filter(function (c) { return locOk(c, l[0]) && match(c, S, { loc: 1 }); }).length; });
    $("fLoc").innerHTML = LOC.map(function (l) { return '<button type="button" class="chip" data-f="loc" data-v="' + l[0] + '" aria-pressed="' + (S.loc === l[0]) + '">' + l[1] + " <small>" + lc[l[0]] + "</small></button>"; }).join("");
    var bm = counts(b.filter(function (c) { return match(c, S, { brand: 1, model: 1 }); }), "brand");
    $("fBrand").innerHTML = '<option value="">ყველა მარკა</option>' + Object.keys(bm).sort().map(function (k) { return '<option value="' + esc(k) + '"' + (k === S.brand ? " selected" : "") + ">" + esc(k) + " (" + bm[k] + ")</option>"; }).join("");
    if (S.brand) {
      var mm = counts(b.filter(function (c) { return c.brand === S.brand && match(c, S, { model: 1 }); }), "model");
      $("fModel").innerHTML = '<option value="">ყველა მოდელი</option>' + Object.keys(mm).sort().map(function (k) { return '<option value="' + esc(k) + '"' + (k === S.model ? " selected" : "") + ">" + esc(k) + " (" + mm[k] + ")</option>"; }).join("");
      $("fModel").disabled = false;
    } else { $("fModel").innerHTML = '<option value="">ყველა მოდელი</option>'; $("fModel").disabled = true; }
    chipRow($("fBody"), counts(b.filter(function (c) { return match(c, S, { body: 1 }); }), "body_type"), "body", true);
    chipRow($("fFuel"), counts(b.filter(function (c) { return match(c, S, { fuel: 1 }); }), "fuel"), "fuel", true);
    chipRow($("fDrive"), counts(b.filter(function (c) { return match(c, S, { drive: 1 }); }), "drive"), "drive", true);
    var years = Object.keys(counts(b, "year")).map(Number).sort(function (x, y) { return y - x; });
    ["fYmin", "fYmax"].forEach(function (id) { var cur = id === "fYmin" ? S.ymin : S.ymax; $(id).innerHTML = '<option value="">ნებისმიერი</option>' + years.map(function (y) { return '<option value="' + y + '"' + (String(y) === cur ? " selected" : "") + ">" + y + "</option>"; }).join(""); });
    var p2 = b.filter(function (c) { return match(c, S, { cleared: 1, warranty: 1 }); });
    $("nCleared").textContent = p2.filter(function (c) { return c.customs === "განბაჟებული"; }).length;
    $("nWarranty").textContent = p2.filter(G.hasWarranty).length;
    $("nSold").textContent = ALL.filter(G.isSold).length;
    $("fCleared").checked = S.cleared; $("fWarranty").checked = S.warranty; $("fSold").checked = S.sold;
    $("fKm").value = S.km; $("fSort").value = S.sort;
    if (document.activeElement !== $("fPmin")) $("fPmin").value = S.pmin ? G.n(S.pmin) : "";
    if (document.activeElement !== $("fPmax")) $("fPmax").value = S.pmax ? G.n(S.pmax) : "";
    if (document.activeElement !== $("fQ")) $("fQ").value = S.q;
    document.querySelectorAll("#fCur [data-cur]").forEach(function (x) { x.setAttribute("aria-pressed", x.dataset.cur === S.cur ? "true" : "false"); });
  }
  function chips() {
    var L = { ge: "საქართველოში", transit: "გზაში", restore: "აღსადგენი" }, out = [];
    if (S.q) out.push(["q", "„" + S.q + "“"]);
    if (S.loc) out.push(["loc", L[S.loc]]);
    if (S.brand) out.push(["brand", S.brand]);
    if (S.model) out.push(["model", S.model]);
    if (S.body) out.push(["body", G.tv(S.body)]);
    if (S.fuel) out.push(["fuel", G.tv(S.fuel)]);
    if (S.pmin || S.pmax) out.push(["pr", (S.pmin ? G.n(S.pmin) : "0") + " – " + (S.pmax ? G.n(S.pmax) : "∞") + (S.cur === "gel" ? " ₾" : " $")]);
    if (S.ymin || S.ymax) out.push(["yr", (S.ymin || "…") + " – " + (S.ymax || "…")]);
    if (S.km) out.push(["km", G.n(S.km) + " კმ-მდე"]);
    if (S.drive) out.push(["drive", G.tv(S.drive)]);
    if (S.cleared) out.push(["cleared", "განბაჟებული"]);
    if (S.warranty) out.push(["warranty", "გარანტიით"]);
    if (S.sold) out.push(["sold", "გაყიდულებიც"]);
    return out;
  }
  function title() {
    if (S.loc === "transit") return "გზაში საქართველოსკენ";
    if (S.loc === "restore") return "აღსადგენი ავტომობილები";
    if (S.brand) return S.brand + (S.model ? " " + S.model : "");
    if (S.body) return G.tv(S.body);
    if (S.fuel) return G.tv(S.fuel);
    return "ყველა ავტომობილი";
  }
  function render(keep) {
    if (!keep) shown = PAGE;
    var list = sorted(ALL.filter(function (c) { return match(c, S); }));
    $("title").textContent = title();
    document.title = title() + " · Global Market";
    $("count").textContent = G.n(list.length) + " ავტომობილი";
    $("fGo").textContent = "ნახვა · " + G.n(list.length);
    var ch = chips();
    $("applied").innerHTML = ch.length ? ch.map(function (c) { return '<button type="button" data-chip="' + c[0] + '" aria-label="მოხსნა: ' + esc(c[1]) + '">' + esc(c[1]) + V.I.x.replace('class="ic"', 'class="ic ic--sm"') + "</button>"; }).join("") + '<button type="button" data-reset>ყველას მოხსნა</button>' : "";
    $("fOpen").querySelector("span").textContent = "ფილტრები" + (ch.length ? " · " + ch.length : "");
    if (!list.length) {
      $("grid").innerHTML = '<div class="empty"><h3>ასეთი ავტომობილი ამჟამად არ გვაქვს</h3><p>შეცვალეთ ფილტრები ან მოგვწერეთ და მოვძებნით.</p><button class="btn btn--ink" type="button" data-reset>ფილტრების მოხსნა</button><a class="btn btn--line" href="https://wa.me/995551119942" target="_blank" rel="noopener">WhatsApp</a></div>';
      $("more").hidden = true; return;
    }
    $("grid").innerHTML = list.slice(0, shown).map(function (c) { return V.carCard(c, { compare: true, eta: G.isTransit(c) }); }).join("");
    var rest = list.length - shown;
    $("more").hidden = rest <= 0;
    if (rest > 0) { $("moreBtn").textContent = "კიდევ " + Math.min(PAGE, rest) + " ავტომობილი"; $("moreNote").textContent = "ნაჩვენებია " + shown + " / " + list.length; }
  }
  function update(keep) { writeUrl(); facets(); render(keep); }
  function reset() { var s = S.sort; S = JSON.parse(JSON.stringify(DEF)); S.sort = s; update(); }

  var sel = { fSort: "sort", fBrand: "brand", fModel: "model", fYmin: "ymin", fYmax: "ymax", fKm: "km" };
  document.addEventListener("change", function (e) {
    var k = sel[e.target.id];
    if (k) { S[k] = e.target.value; if (k === "brand") S.model = ""; update(); return; }
    var t = { fCleared: "cleared", fWarranty: "warranty", fSold: "sold" }[e.target.id];
    if (t) { S[t] = e.target.checked; update(); }
  });
  var pt, qt;
  ["fPmin", "fPmax"].forEach(function (id) {
    $(id).addEventListener("input", function (e) {
      var d = e.target.value.replace(/\D/g, ""); e.target.value = d ? G.n(d) : "";
      clearTimeout(pt); pt = setTimeout(function () { S[id === "fPmin" ? "pmin" : "pmax"] = d; update(); }, 350);
    });
  });
  $("fQ").addEventListener("input", function (e) { clearTimeout(qt); qt = setTimeout(function () { S.q = e.target.value.trim(); update(); }, 300); });
  $("fForm").addEventListener("submit", function (e) { e.preventDefault(); S.q = $("fQ").value.trim(); update(); });
  document.addEventListener("click", function (e) {
    var t;
    if ((t = e.target.closest("[data-f]"))) { var k = t.dataset.f, v = t.dataset.v; S[k] = S[k] === v && v !== "" ? "" : v; if (k === "loc" && v === "") S.loc = ""; update(); return; }
    if ((t = e.target.closest("[data-chip]"))) {
      var c = t.dataset.chip;
      if (c === "pr") { S.pmin = ""; S.pmax = ""; } else if (c === "yr") { S.ymin = ""; S.ymax = ""; } else if (c === "brand") { S.brand = ""; S.model = ""; } else S[c] = DEF[c];
      update(); return;
    }
    if (e.target.closest("[data-reset]")) { reset(); return; }
    if ((t = e.target.closest("#fCur [data-cur]"))) { if (S.cur !== t.dataset.cur) { S.cur = t.dataset.cur; S.pmin = ""; S.pmax = ""; update(); } return; }
  });
  // phone: filters as a bottom sheet
  var scrim = null;
  function openF() { $("filters").classList.add("is-open"); scrim = document.createElement("div"); scrim.className = "scrim"; scrim.onclick = closeF; document.body.appendChild(scrim); document.body.style.overflow = "hidden"; }
  function closeF() { $("filters").classList.remove("is-open"); if (scrim) { scrim.remove(); scrim = null; } document.body.style.overflow = ""; }
  $("fOpen").addEventListener("click", openF);
  document.querySelectorAll("[data-fx]").forEach(function (b) { b.addEventListener("click", function () { closeF(); if (b.id === "fGo") window.scrollTo({ top: 0, behavior: V.reduce ? "auto" : "smooth" }); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeF(); });
  $("moreBtn").addEventListener("click", function () { shown += PAGE; render(true); });
  // the header search panel stays on this page and filters in place
  var fs = document.querySelector("#find form");
  if (fs) fs.addEventListener("submit", function (e) { e.preventDefault(); S.q = fs.q.value.trim(); update(); document.querySelector("[data-find-x]").click(); });

  $("grid").innerHTML = V.skel(9);
  Promise.all([G.loadCars(), G.loadLots()]).then(function (r) {
    ALL = r[0] || [];
    G.indexLots(r[1]);
    update();
  }).catch(function () {
    $("grid").innerHTML = '<div class="empty"><h3>მონაცემები ვერ ჩაიტვირთა</h3><p>შეამოწმეთ ინტერნეტი და სცადეთ ხელახლა.</p><button class="btn btn--ink" type="button" onclick="location.reload()">ხელახლა ცდა</button></div>';
  });
})();
