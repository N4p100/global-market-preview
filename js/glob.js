/* Global Auto Import pages (glob/): shared chrome, the agent buttons, and the working tools —
   transport + auction-fee calculator (Global Auto's own dealer tariff, assets/glob/calc.json),
   customs calculator (the exact formula glob.ge runs today), container tracking (opens the carrier's
   own tracking page), and request forms that open a ready email to info@glob.ge. */
(function () {
  "use strict";
  if (window.V8) V8.initChrome();
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fmt = function (n) { return Math.round(n).toLocaleString("en-US"); };

  /* ---------- the agent ---------- */
  $$("[data-agent]").forEach(function (b) {
    b.addEventListener("click", function () { if (window.GMA) window.GMA.open(); else location.href = "https://finder-production-48b14990.up.railway.app/assistant"; });
  });

  /* ---------- request forms: validate, then a ready email to the company ---------- */
  $$("form[data-mail]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = null;
      $$("[required]", f).forEach(function (el) {
        var ok = el.type === "checkbox" ? el.checked : el.type === "radio" ? !!f.querySelector('[name="' + el.name + '"]:checked') : el.value.trim().length > 1;
        if (el.type === "tel" && ok) ok = el.value.replace(/\D/g, "").length >= 9;
        (el.closest(".field") || el.parentNode).classList.toggle("is-bad", !ok);
        if (!ok && !bad) bad = el;
      });
      if (bad) { bad.focus(); return; }
      var lines = [];
      $$("[data-label]", f).forEach(function (el) {
        if ((el.type === "radio" || el.type === "checkbox") && !el.checked) return;
        if (el.value.trim()) lines.push(el.dataset.label + ": " + el.value.trim());
      });
      location.href = "mailto:" + (f.dataset.to || "info@glob.ge") + "?subject=" + encodeURIComponent(f.dataset.mail) + "&body=" + encodeURIComponent(lines.join("\n"));
      var done = $(".form-done", f.parentNode); if (done) { done.hidden = false; }
    });
  });

  /* ---------- transport + auction fee ---------- */
  var tc = $("#tCalc");
  if (tc) {
    var TYPES = { 1: "სედანი, ჰეჩბეკი", 2: "ჯიპი, კროსოვერი", 3: "დიდი ჯიპი, პიკაპი, მინივენი", 4: "ზომაგადაჭარბებული ×2", 7: "ზომაგადაჭარბებული ×3", 5: "მოტოციკლი", 6: "ჯეტსკი" };
    var DEST = { 2: "ფოთი", 1: "ბათუმი", 3: "ჩორნომორსკი (უკრაინა)" };
    var D = null;
    var aSel = $("#tAuction"), ySel = $("#tYard"), tSel = $("#tType"), dSel = $("#tDest"), out = $("#tOut"), port = $("#tPort");
    var fA = $("#fAuction"), fP = $("#fPrice"), fOut = $("#fOut"), fTot = $("#fTotal"), sum = $("#tSum");
    fetch("../assets/glob/calc.json").then(function (r) { return r.json(); }).then(function (d) {
      D = d;
      aSel.innerHTML = ["2", "3", "4", "1", "5", "6", "7"].map(function (k) { return '<option value="' + k + '">' + d.auctions[k].name + "</option>"; }).join("");
      tSel.innerHTML = [1, 2, 3, 4, 7, 5, 6].map(function (k) { return '<option value="' + k + '">' + TYPES[k] + "</option>"; }).join("");
      dSel.innerHTML = [2, 1, 3].map(function (k) { return '<option value="' + k + '">' + DEST[k] + "</option>"; }).join("");
      $("#tDate").textContent = new Date(d.fetched_at).toLocaleDateString("ka-GE", { day: "numeric", month: "long", year: "numeric" });
      yards(); calc();
    });
    function yards() {
      var locs = D.auctions[aSel.value].locations.slice().sort(function (a, b) { return a[1].localeCompare(b[1]); });
      ySel.innerHTML = locs.map(function (l) { return '<option value="' + l[0] + '">' + l[1] + "</option>"; }).join("");
    }
    function transport() {
      var loc = D.auctions[aSel.value].locations.filter(function (l) { return String(l[0]) === ySel.value; })[0];
      if (!loc) return null;
      var type = +tSel.value, dest = +dSel.value, slots = type === 4 ? 2 : type === 7 ? 3 : 1, p = D.ports[loc[2]];
      var price = (loc[3] - 400) * slots + 400;
      if (type === 5 || type === 6) { if (!p) return null; price -= type === 5 ? p.motorcycle_off_usd : p.jet_ski_off_usd; }
      if (dest === 1) price += 250 * slots;
      return { price: price, port: p ? p.name : "" };
    }
    function fee(auction, lot) {
      var s = D.fees[auction]; if (!s || !(lot >= 0)) return null;
      for (var i = 0; i < s.rows.length; i++) if (lot >= s.rows[i][0] && lot <= s.rows[i][1]) return s.rows[i][2];
      var t = s.per_100; if (lot < t.from || lot > t.to) return null;
      var from = Math.floor(lot / 100) * 100;
      return t.overrides[from] != null ? t.overrides[from] : Math.round(from * t.percent / 100 + t.fixed);
    }
    function calc() {
      if (!D) return;
      var t = transport();
      out.textContent = t ? fmt(t.price) + " $" : "—";
      port.textContent = t && t.port ? "პორტი: " + t.port.replace("-", " · ") + " → " + DEST[dSel.value] : "";
      var lot = +String(fP.value).replace(/[^\d.]/g, "");
      var f = lot ? fee(fA.value, lot) : null;
      fOut.textContent = f != null ? fmt(f) + " $" : "—";
      fTot.textContent = f != null ? fmt(lot + f) + " $" : "—";
      sum.textContent = f != null && t ? fmt(lot + f + t.price) + " $" : "—";
    }
    aSel.addEventListener("change", function () { yards(); calc(); });
    [ySel, tSel, dSel, fA].forEach(function (el) { el.addEventListener("change", calc); });
    fP.addEventListener("input", function () { var v = fP.value.replace(/[^\d]/g, ""); fP.value = v ? (+v).toLocaleString("en-US") : ""; calc(); });
  }

  /* ---------- customs: glob.ge's own formula, unchanged (GEL) ---------- */
  var cc = $("#cCalc");
  if (cc) {
    var y = $("#cYear"), e = $("#cEngine"), now = new Date().getFullYear();
    for (var yr = now; yr >= 1995; yr--) y.insertAdjacentHTML("beforeend", "<option>" + yr + "</option>");
    for (var v = 100; v <= 6300; v += 100) e.insertAdjacentHTML("beforeend", '<option value="' + v + '"' + (v === 2000 ? " selected" : "") + ">" + (v / 1000).toFixed(1) + " ლ</option>");
    y.value = String(now - 5);
    var hy = $("#cHybrid"), el = $("#cElectric"), rw = $("#cRight");
    hy.addEventListener("change", function () { if (hy.checked) el.checked = false; run(); });
    el.addEventListener("change", function () { if (el.checked) hy.checked = false; run(); });
    $$("select, input", cc).forEach(function (x) { x.addEventListener("change", run); });
    function run() {
      var year = +y.value, n = +e.value, l = +$("#cType").value, d = +$("#cDays").value, right = rw.checked, hybrid = hy.checked, electric = el.checked;
      var m = now - year, u = 0;
      if (m < 3) u = 1.5; if (m === 3) u = 1.4; if (m === 4) u = 1.2; if (m === 5) u = 1; if (m > 5 && m < 9) u = .8; if (m === 9) u = .9;
      if (m === 10) u = 1.1; if (m === 11) u = 1.3; if (m === 12) u = 1.5; if (m === 13) u = 1.8; if (m === 14) u = 2.1; if (m > 14) u = 2.4;
      if (electric && right) { n = 2000; e.value = "2000"; e.disabled = true; } else e.disabled = false;
      var excise = Math.round(u * n);
      if (right && !electric) excise *= 3;
      if (hybrid && year > now - 7 && !right) excise = 40 * excise / 100;
      var engineRow = $("#cEngineRow");
      if (electric && !right) { excise = 0; engineRow.hidden = true; } else engineRow.hidden = false;
      if (electric && !right) n = 0;
      var imp = Math.round(.05 * n * (1 + .05 * m));
      var total = excise + imp + 150 + 200 + 7 + 20 + 30 + l + d;
      $("#cExcise").textContent = fmt(excise) + " ₾";
      $("#cImport").textContent = fmt(imp) + " ₾";
      $("#cForm").textContent = fmt(200 + l) + " ₾";
      $("#cDaysOut").textContent = fmt(d) + " ₾";
      $("#cTotal").textContent = fmt(total) + " ₾";
    }
    run();
  }

  /* ---------- container tracking: the number picks the carrier ---------- */
  var tr = $("#trForm");
  if (tr) {
    var CAR = {
      MR: { n: "Maersk", p: ["MSKU", "MAEU", "MRKU", "MSFU", "MRSU", "SUDU", "MCAU", "MCRU", "MNBU", "MWCU"], u: "https://www.maersk.com/tracking/{n}" },
      HAPAG: { n: "Hapag-Lloyd", p: ["HLXU", "HLBU", "HAMU", "HLCU", "UACU", "UASU"], u: "https://www.hapag-lloyd.com/en/online-business/track/track-by-container-solution.html?container={n}" },
      ZIM: { n: "ZIM", p: ["ZIMU", "ZCSU", "ZILU"], u: "https://www.zim.com/tools/track-a-shipment?consnumber={n}" },
      EVERGREEN: { n: "Evergreen", p: ["EGHU", "EMCU", "EISU", "EGSU", "EITU", "UGMU"], post: "evForm" },
      TURKON: { n: "Turkon", p: ["TRKU", "TKRU"], u: "https://www.turkon.com/en/container-tracking" },
      COSCO: { n: "COSCO", p: ["CBHU", "CSNU", "CCLU", "CSLU", "OOLU", "OOCU"], u: "https://elines.coscoshipping.com/ebusiness/cargotracking?trackingType=CONTAINER&number={n}" },
      ONE: { n: "ONE", p: ["ONEU", "NYKU", "MOLU", "KKFU", "KKLU"], u: "https://ecomm.one-line.com/one-ecom/manage-shipment/cargo-tracking?ctrack-field={n}&trakNoParam={n}" },
      CMA: { n: "CMA CGM", p: ["CMAU", "CGMU", "APHU", "APZU", "ECMU", "CNIU"], post: "cmaForm" }
    };
    var inp = $("#trNo"), hint = $("#trHint");
    function guess() {
      var no = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); inp.value = no;
      var hit = null;
      Object.keys(CAR).forEach(function (k) { if (CAR[k].p.indexOf(no.slice(0, 4)) !== -1) hit = k; });
      if (hit) { var r = tr.querySelector('input[name="carrier"][value="' + hit + '"]'); if (r) r.checked = true; }
      var ok = /^[A-Z]{4}\d{7}$/.test(no);
      hint.textContent = no.length < 4 ? "" : hit ? CAR[hit].n + " — ნომრის მიხედვით" + (ok ? "" : ". ნომერი: 4 ასო და 7 ციფრი") : "აირჩიეთ გადამზიდი" + (ok ? "" : ". ნომერი: 4 ასო და 7 ციფრი");
    }
    inp.addEventListener("input", guess);
    tr.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var no = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, ""), c = tr.querySelector('input[name="carrier"]:checked');
      if (no.length < 8) { inp.focus(); hint.textContent = "შეიყვანეთ კონტეინერის ნომერი"; return; }
      if (!c) { hint.textContent = "აირჩიეთ გადამზიდი"; return; }
      var k = CAR[c.value];
      if (k.post) { var pf = document.getElementById(k.post); pf.querySelectorAll("[data-no]").forEach(function (x) { x.value = no; }); pf.submit(); return; }
      window.open(k.u.replace(/\{n\}/g, encodeURIComponent(no)), "_blank", "noopener");
    });
  }
})();
