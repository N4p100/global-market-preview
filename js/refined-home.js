/* GLOBAL refined: home in the company head's own structure. Live data, every working filter, numbered pages. */
(function () {
  "use strict";
  var G = window.GM, V = window.V8, esc = G.esc, I = V.I;
  V.initChrome();
  function $(id) { return document.getElementById(id); }

  var ALL = [], LOTS = [], TOP = null, PER = 20;
  var PRICE = [["0-7000", "$7K-მდე"], ["7000-10000", "$7K–10K"], ["10000-15000", "$10K–15K"], ["15000-20000", "$15K–20K"], ["20000-30000", "$20K–30K"], ["30000-", "$30K+"]];
  var NEED = [["", "ყველა"], ["suv", "SUV"], ["hybrid", "ჰიბრიდი"], ["electric", "ელექტრო"]];
  var QUICK = [["warranty", "გარანტია"], ["top", "ამ კვირის TOP"], ["fresh", "ახლად დამატებული"], ["onsite", "ადგილზე"], ["views", "ყველაზე ნახვადი"], ["fav", "ჩემი რჩეულები"], ["cleared", "განბაჟებული"]];
  var DEF = { q: "", brand: "", model: "", year: "", pmin: "", pmax: "", cur: "gel", loc: "", pr: "", need: "", warranty: false, top: false, fresh: false, onsite: false, views: false, fav: false, cleared: false, show: "", sort: "new", page: 1 };
  var S = read();

  function read() {
    var p = new URLSearchParams(location.search), s = JSON.parse(JSON.stringify(DEF));
    Object.keys(DEF).forEach(function (k) { var v = p.get(k); if (v == null) return; s[k] = typeof DEF[k] === "boolean" ? v === "1" : typeof DEF[k] === "number" ? (+v || 1) : v; });
    return s;
  }
  function write() {
    var p = new URLSearchParams();
    Object.keys(DEF).forEach(function (k) { var v = S[k]; if (typeof v === "boolean") { if (v) p.set(k, "1"); } else if (v !== DEF[k] && v !== "") p.set(k, v); });
    history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : "") + location.hash);
  }
  function active() { return Object.keys(DEF).some(function (k) { return k !== "sort" && k !== "page" && k !== "cur" && S[k] !== DEF[k]; }); }
  function priceOf(c, cur) { var v = G.num(cur === "gel" ? c.price_gel : c.price_usd); return v && v > 0 ? v : null; }
  function locOf(c) { var l = String(c.location || "").trim(); return l || (G.isTransit(c) ? "გზაში" : "საქართველო"); }

  function match(c, skip) {
    skip = skip || {};
    if (G.isSold(c)) return false;
    if (S.q) { var hay = [c.brand, c.model, c.year, c.vin, c.vin_spec && c.vin_spec.trim].join(" ").toLowerCase(); if (!S.q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; })) return false; }
    if (!skip.brand && S.brand && c.brand !== S.brand) return false;
    if (!skip.model && S.model && c.model !== S.model) return false;
    if (S.year && (!c.year || c.year < +S.year)) return false;
    var a = +String(S.pmin).replace(/\D/g, "") || 0, b = +String(S.pmax).replace(/\D/g, "") || 0;
    if (a || b) { var p = priceOf(c, S.cur); if (p == null || (a && p < a) || (b && p > b)) return false; }
    if (S.pr) { var r = S.pr.split("-"), u = priceOf(c, "usd"); if (u == null || (r[0] && u < +r[0]) || (r[1] && u > +r[1])) return false; }
    if (S.loc && locOf(c) !== S.loc) return false;
    if (S.need === "suv" && c.body_type !== "ჯიპი") return false;
    if (S.need === "hybrid" && c.fuel !== "ჰიბრიდი") return false;
    if (S.need === "electric" && c.fuel !== "ელექტრო") return false;
    if (S.warranty && !c.has_six_month_warranty) return false;
    if (S.onsite && locOf(c) !== "საქართველო") return false;
    if (S.fresh && (Date.now() - new Date(c.created_at)) > 14 * 864e5) return false;
    if (S.fav && G.favIds().indexOf(String(c.id)) === -1) return false;
    if (S.cleared && c.customs !== "განბაჟებული") return false;
    if (S.top && (TOP || []).indexOf(String(c.id)) === -1) return false;
    if (S.views && !(Number(c.views) >= 1)) return false;
    if (S.show === "vip" && !G.isVip(c)) return false;
    if (S.show === "transit" && !G.isTransit(c)) return false;
    if (S.show === "restore" && !G.isRestore(c)) return false;
    return true;
  }
  function sorted(list) {
    if (S.top) { var o = TOP || []; return list.sort(function (a, b) { return o.indexOf(String(a.id)) - o.indexOf(String(b.id)); }); }
    if (S.views) return list.sort(function (a, b) { return (Number(b.views) || 0) - (Number(a.views) || 0); }).slice(0, 30);
    var by = {
      new: function (a, b) { return (b.is_pinned === true) - (a.is_pinned === true) || new Date(b.created_at) - new Date(a.created_at); },
      price_asc: function (a, b) { return (priceOf(a, "usd") || 1e12) - (priceOf(b, "usd") || 1e12); },
      price_desc: function (a, b) { return (priceOf(b, "usd") || 0) - (priceOf(a, "usd") || 0); },
      year_desc: function (a, b) { return (b.year || 0) - (a.year || 0); },
      km_asc: function (a, b) { return (G.num(a.mileage) == null ? 1e12 : a.mileage) - (G.num(b.mileage) == null ? 1e12 : b.mileage); }
    }[S.sort] || function () { return 0; };
    return list.sort(function (a, b) { return (G.photos(b).length > 0) - (G.photos(a).length > 0) || by(a, b); });
  }

  /* ---------- controls ---------- */
  function counts(list, key) { var m = {}; list.forEach(function (c) { var v = c[key]; if (v != null && String(v).trim() !== "") m[v] = (m[v] || 0) + 1; }); return m; }
  function chips(el, list, key, multi) {
    el.innerHTML = list.map(function (x) { var on = multi ? !!S[x[0]] : S[key] === x[0]; return '<button type="button" class="chip" data-k="' + (multi ? x[0] : key) + '" data-v="' + x[0] + '" aria-pressed="' + on + '">' + x[1] + "</button>"; }).join("");
  }
  function controls() {
    var live = ALL.filter(function (c) { return !G.isSold(c); });
    var bm = counts(live.filter(function (c) { return match(c, { brand: 1, model: 1 }); }), "brand");
    $("fBrand").innerHTML = '<option value="">ყველა მარკა</option>' + Object.keys(bm).sort().map(function (k) { return '<option value="' + esc(k) + '"' + (k === S.brand ? " selected" : "") + ">" + esc(k) + " (" + bm[k] + ")</option>"; }).join("");
    if (S.brand) { var mm = counts(live.filter(function (c) { return c.brand === S.brand && match(c, { model: 1 }); }), "model"); $("fModel").innerHTML = '<option value="">ყველა მოდელი</option>' + Object.keys(mm).sort().map(function (k) { return '<option value="' + esc(k) + '"' + (k === S.model ? " selected" : "") + ">" + esc(k) + " (" + mm[k] + ")</option>"; }).join(""); $("fModel").disabled = false; }
    else { $("fModel").innerHTML = '<option value="">ყველა მოდელი</option>'; $("fModel").disabled = true; }
    var ys = Object.keys(counts(live, "year")).map(Number).sort(function (a, b) { return b - a; });
    $("fYear").innerHTML = '<option value="">ყველა წელი</option>' + ys.map(function (y) { return '<option value="' + y + '"' + (String(y) === S.year ? " selected" : "") + ">" + y + "</option>"; }).join("");
    $("fLoc").value = S.loc; $("fCur").value = S.cur; $("fSort").value = S.sort;
    if (document.activeElement !== $("fQ")) $("fQ").value = S.q;
    if (document.activeElement !== $("fPmin")) $("fPmin").value = S.pmin ? G.n(S.pmin) : "";
    if (document.activeElement !== $("fPmax")) $("fPmax").value = S.pmax ? G.n(S.pmax) : "";
    chips($("cPrice"), PRICE, "pr"); chips($("cNeed"), NEED, "need"); chips($("cQuick"), QUICK, null, true);
  }
  function applied() {
    var L = { vip: "Super VIP", transit: "გზაში", restore: "აღსადგენი" }, out = [];
    if (S.q) out.push(["q", "„" + S.q + "“"]);
    if (S.brand) out.push(["brand", S.brand]); if (S.model) out.push(["model", S.model]);
    if (S.year) out.push(["year", S.year + "-დან"]);
    if (S.pmin || S.pmax) out.push(["pm", (S.pmin ? G.n(S.pmin) : "0") + " – " + (S.pmax ? G.n(S.pmax) : "∞") + (S.cur === "gel" ? " ₾" : " $")]);
    if (S.pr) out.push(["pr", PRICE.filter(function (x) { return x[0] === S.pr; })[0][1]]);
    if (S.loc) out.push(["loc", S.loc]);
    if (S.need) out.push(["need", NEED.filter(function (x) { return x[0] === S.need; })[0][1]]);
    QUICK.forEach(function (x) { if (S[x[0]]) out.push([x[0], x[1]]); });
    if (S.show) out.push(["show", L[S.show] || "ახალი დამატებული"]);
    return out;
  }
  function render() {
    var list = sorted(ALL.filter(function (c) { return match(c); }));
    var on = active(), pages = Math.max(1, Math.ceil(list.length / PER));
    if (S.page > pages) S.page = pages;
    $("allT").textContent = on ? "ძებნის შედეგები" : "ყველა ავტომობილი";
    $("allSub").textContent = list.length + " ავტომობილი" + (pages > 1 ? " · გვერდი " + S.page + " / " + pages : "");
    $("fGo").textContent = "შედეგების ნახვა · " + list.length;
    var ap = applied();
    $("applied").innerHTML = ap.length ? ap.map(function (x) { return '<button type="button" data-rm="' + x[0] + '">' + esc(x[1]) + I.x.replace('class="ic"', 'class="ic ic--sm"') + "</button>"; }).join("") + '<button type="button" data-reset>ყველას მოხსნა</button>' : "";
    $("allGrid").innerHTML = list.length ? list.slice((S.page - 1) * PER, S.page * PER).map(function (c) { return V.carCard(c, { eta: G.isTransit(c), noWarranty: true }); }).join("")
      : '<div class="empty"><h3>ამ ფილტრებით ავტომობილი ვერ მოიძებნა</h3><p>შეცვალეთ ფილტრები ან მოგვწერეთ და მოვძებნით.</p><button class="btn btn--ink" type="button" data-reset>ფილტრების მოხსნა</button><a class="btn btn--line" href="https://wa.me/995551119942" target="_blank" rel="noopener">WhatsApp</a></div>';
    var nums = [];
    for (var i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - S.page) <= 2) nums.push(i); else if (nums[nums.length - 1] !== "…") nums.push("…");
    $("pager").innerHTML = pages > 1 ? '<button type="button" data-page="' + (S.page - 1) + '" aria-label="წინა"' + (S.page === 1 ? " disabled" : "") + ">" + I.left + "</button>" + nums.map(function (n) { return n === "…" ? '<button type="button" disabled>…</button>' : '<button type="button" data-page="' + n + '"' + (n === S.page ? ' aria-current="page"' : "") + ">" + n + "</button>"; }).join("") + '<button type="button" data-page="' + (S.page + 1) + '" aria-label="შემდეგი"' + (S.page === pages ? " disabled" : "") + ">" + I.right + "</button>" : "";
  }
  function update(keepPage) { if (!keepPage) S.page = 1; write(); controls(); render(); }
  function toAll() { $("all").scrollIntoView({ behavior: V.reduce ? "auto" : "smooth" }); }
  function needTop() { if (TOP) return Promise.resolve(); return G.rpc("gm_top_viewed", { p_days: 6, p_limit: 15 }).then(function (r) { TOP = (r || []).map(function (x) { return String(x.car_id); }); }).catch(function () { TOP = []; }); }

  document.addEventListener("change", function (e) {
    var k = { fBrand: "brand", fModel: "model", fYear: "year", fLoc: "loc", fCur: "cur", fSort: "sort" }[e.target.id];
    if (!k) return; S[k] = e.target.value; if (k === "brand") S.model = ""; if (k === "cur") { S.pmin = ""; S.pmax = ""; } update();
  });
  var pt, qt;
  ["fPmin", "fPmax"].forEach(function (id) { $(id).addEventListener("input", function (e) { var d = e.target.value.replace(/\D/g, ""); e.target.value = d ? G.n(d) : ""; clearTimeout(pt); pt = setTimeout(function () { S[id === "fPmin" ? "pmin" : "pmax"] = d; update(); }, 350); }); });
  $("fQ").addEventListener("input", function (e) { clearTimeout(qt); qt = setTimeout(function () { S.q = e.target.value.trim(); update(); }, 300); });
  $("qForm").addEventListener("submit", function (e) { e.preventDefault(); S.q = $("fQ").value.trim(); update(); toAll(); });
  $("fReset").addEventListener("click", function () { var s = S.sort, c = S.cur; S = JSON.parse(JSON.stringify(DEF)); S.sort = s; S.cur = c; update(); });
  document.addEventListener("click", function (e) {
    var t;
    if ((t = e.target.closest(".chip[data-k]"))) {
      var k = t.dataset.k, v = t.dataset.v;
      if (typeof DEF[k] === "boolean") { S[k] = !S[k]; if (k === "top" && S.top) { needTop().then(function () { update(); }); return; } }
      else S[k] = S[k] === v ? "" : v;
      update(); return;
    }
    if ((t = e.target.closest("[data-rm]"))) { var r = t.dataset.rm; if (r === "pm") { S.pmin = ""; S.pmax = ""; } else if (r === "brand") { S.brand = ""; S.model = ""; } else S[r] = DEF[r]; update(); return; }
    if (e.target.closest("[data-reset]")) { $("fReset").click(); return; }
    if ((t = e.target.closest("[data-page]"))) { S.page = +t.dataset.page; write(); render(); toAll(); return; }
    if ((t = e.target.closest("[data-show]"))) { var w = t.dataset.show; S = JSON.parse(JSON.stringify(DEF)); if (w === "new") S.fresh = true; else S.show = w; update(); toAll(); }
  });
  var fs = document.querySelector("#find form");
  if (fs) fs.addEventListener("submit", function (e) { e.preventDefault(); S.q = fs.q.value.trim(); update(); document.querySelector("[data-find-x]").click(); toAll(); });

  /* ---------- sections ---------- */
  function stats(live, lots) {
    $("stLive").textContent = live.length;
    $("stRes").textContent = live.filter(G.isReserved).length;
    $("stTr").textContent = live.filter(G.isTransit).length;
    $("stLots").textContent = lots.length;
    $("liveN").textContent = live.length + " ავტომობილი გაყიდვაში";
    $("banLead").textContent = live.length + " ავტომობილი საქართველოში და გზაში, რეალური ფოტოებით, VIN კოდით და ფასით.";
    G.rpc("public_sold_count").then(function (n) { $("stSold").textContent = G.n(+n || 0); }).catch(function () { $("stSold").textContent = "—"; });
  }
  function auction(lots) {
    if (!lots.length) return;
    var THEME = { "ოთხშაბათი": "გზაში საქართველოსკენ", "ხუთშაბათი": "აღდგენილი ავტომობილები", "პარასკევი": "დაზიანებული ავტომობილები" };
    function at(l) { return l.session_at || l.starts_at; }
    function key(iso) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tbilisi" }).format(new Date(iso)); }
    var g = {}; lots.forEach(function (l) { var k = key(at(l)); (g[k] = g[k] || []).push(l); });
    var keys = Object.keys(g).sort(), first = g[keys[0]][0];
    $("aucWhen").textContent = V.wd(at(first)) + ", " + G.tbilisiTime(at(first));
    $("aucSub").textContent = G.tbilisiDate(at(first)) + " · " + (THEME[V.wd(at(first))] || "ავტომობილები") + " · " + g[keys[0]].length + " ლოტი";
    V.countdown($("aucClock"), new Date(at(first)).getTime(), "მიმდინარეობს");
    $("aucMain").href = V.BASE + "auction/index.html?day=" + keys[0] + "#lots";
    $("aucSide").innerHTML = keys.slice(1, 3).map(function (k) {
      var l = g[k][0], car = ALL.filter(function (c) { return c.id === l.car_id; })[0], p = V.lotPhotos(l, car)[0];
      return '<a class="rauc__s" href="' + V.BASE + "auction/index.html?day=" + k + '#lots">' + (p ? '<img src="' + esc(G.thumb(p, 400)) + '" alt="" loading="lazy">' : "<span></span>") + "<span><small>" + esc(THEME[V.wd(at(l))] || "ავტომობილები") + "</small><b>" + esc(V.wd(at(l)) + ", " + G.tbilisiDate(at(l)) + " · " + G.tbilisiTime(at(l))) + "</b><small>" + g[k].length + ' ლოტი</small><span class="link">აუქციონის ნახვა' + I.go.replace("ic ic--go", "ic ic--sm") + "</span></span></a>";
    }).join("");
    $("auction").hidden = false;
  }
  function vip(live) {
    var v = live.filter(G.isVip).sort(function (a, b) { return (G.num(b.price_usd) || 0) - (G.num(a.price_usd) || 0); });
    if (!v.length) return;
    var f = v[0], p = G.photos(f)[0];
    $("vipF").innerHTML = '<div class="t"><span class="tag">Super VIP</span><h3><a href="' + V.carHref(f) + '">' + esc(G.title(f)) + '</a></h3><div class="pr num">' + esc(G.priceGel(f) || G.priceUsd(f)) + (G.priceUsd(f) && G.priceGel(f) ? "<small>" + esc(G.priceUsd(f)) + "</small>" : "") + "</div>" +
      '<div class="sp num"><span>' + esc([G.tv(f.fuel), G.tv(f.drive)].filter(Boolean).join(" · ")) + "</span><span>" + esc([V.km(f), f.year].filter(Boolean).join(" · ")) + '</span></div><a class="btn btn--ink" href="' + V.carHref(f) + '">დეტალურად' + I.go + "</a></div>" +
      '<a class="im" href="' + V.carHref(f) + '" tabindex="-1">' + (p ? '<img src="' + esc(G.thumb(p, 1200)) + '" alt="' + esc(G.title(f)) + '" loading="lazy">' : "") + "</a>";
    $("vipG").innerHTML = v.slice(1, 4).map(function (c) { return V.carCard(c); }).join("");
    $("vip").hidden = false;
  }
  function liveBlock(list, id, word) {
    if (!list.length) return;
    $(id + "H").innerHTML = "<b>" + list.length + "</b> " + word;
    $(id + "Btn").innerHTML = list.length + "-ვე ავტომობილის ნახვა" + I.go;
    $(id + "List").innerHTML = list.slice(0, 4).map(function (c) { return '<a href="' + V.carHref(c) + '"><span>' + esc(G.title(c)) + '</span><b class="num">' + esc(G.priceUsd(c) || G.priceGel(c) || "") + "</b><small>" + esc(id === "tr" ? (c.arrival_date ? "ჩამოსვლა " + G.dateShort(c.arrival_date) : "ზუსტდება") : (G.tv(c.location) || "საქართველო")) + "</small></a>"; }).join("");
    $(id === "tr" ? "transit" : "restore").hidden = false;
  }

  $("allGrid").innerHTML = V.skel(8); $("newGrid").innerHTML = V.skel(5);
  Promise.all([G.loadCars(), G.loadLots()]).then(function (r) {
    ALL = r[0] || [];
    G.indexLots(r[1]);
    var now = Date.now();
    LOTS = (r[1] || []).filter(function (l) { return new Date(l.ends_at || l.starts_at).getTime() > now; });
    var live = ALL.filter(function (c) { return !G.isSold(c); });
    stats(live, LOTS); auction(LOTS); vip(live);
    liveBlock(live.filter(G.isTransit).sort(function (a, b) { return new Date(a.arrival_date || "2100-01-01") - new Date(b.arrival_date || "2100-01-01"); }), "tr", "ავტომობილი იყიდება გზაში");
    liveBlock(live.filter(G.isRestore), "rs", "აღსადგენი ავტომობილი ადგილზე");
    $("newGrid").innerHTML = live.filter(function (c) { return G.photos(c).length >= 3; }).sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); }).slice(0, 5).map(function (c) { return V.carCard(c, { noWarranty: true }); }).join("");
    var ad = live.filter(function (c) { return !G.isRestore(c) && G.photos(c).length > 3; })[3]; if (ad) $("addImg").src = G.thumb(G.photos(ad)[0], 640);
    (S.top ? needTop() : Promise.resolve()).then(function () { update(true); });
  }).catch(function () { $("allGrid").innerHTML = '<div class="empty"><h3>მონაცემები ვერ ჩაიტვირთა</h3><p>შეამოწმეთ ინტერნეტი და სცადეთ ხელახლა.</p><button class="btn btn--ink" type="button" onclick="location.reload()">ხელახლა ცდა</button></div>'; });
})();
