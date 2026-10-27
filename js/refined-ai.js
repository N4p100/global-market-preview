/* GLOBAL AI (refined): answers from the live inventory in the browser; anything else goes to a manager on WhatsApp.
   Nothing is written to the company database. */
(function () {
  "use strict";
  var G = window.GM, V = window.V8, esc = G.esc;
  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4z"/></svg>';
  var fab = document.createElement("button");
  fab.type = "button"; fab.className = "aifab"; fab.setAttribute("data-ai", ""); fab.setAttribute("aria-controls", "aip");
  fab.innerHTML = "<i>" + STAR + "</i><span>GLOBAL AI</span>";
  var box = document.createElement("section");
  box.className = "aip"; box.id = "aip"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "GLOBAL AI");
  box.innerHTML = '<div class="aip__h"><div><b>GLOBAL AI</b><small>ეძებს მარკეტის ავტომობილებში. სხვა კითხვებზე მენეჯერი WhatsApp-ით გიპასუხებთ.</small></div><button class="round" type="button" data-aix aria-label="დახურვა">' + V.I.x + "</button></div>" +
    '<div class="aip__m" id="aiM" aria-live="polite"><div class="msg msg--bot">გამარჯობა. რით შემიძლია დაგეხმაროთ? დაწერეთ მარკა, ძარა ან ბიუჯეტი.</div></div>' +
    '<div class="aip__chips"><button class="chip" type="button" data-say="მინდა BMW">მინდა BMW</button><button class="chip" type="button" data-say="ჯიპი 20,000 $-მდე">ჯიპი 20,000 $-მდე</button><button class="chip" type="button" data-say="ელექტრო ავტომობილი">ელექტრო ავტომობილი</button><button class="chip" type="button" data-say="მინდა ამერიკიდან ჩამოყვანა">ამერიკიდან ჩამოყვანა</button></div>' +
    '<form id="aiF"><label class="sr" for="aiQ">შეტყობინება</label><input class="input" id="aiQ" autocomplete="off" placeholder="მაგ. Toyota Camry 15,000 $-მდე"><button class="btn btn--ink" type="submit" aria-label="გაგზავნა">' + V.I.go + "</button></form>";
  document.body.appendChild(fab); document.body.appendChild(box);
  var ban = document.querySelector(".rban");
  if (ban && "IntersectionObserver" in window) new IntersectionObserver(function (es) { fab.classList.toggle("is-off", es[0].isIntersecting && !box.classList.contains("is-open")); }).observe(ban);
  var M = box.querySelector("#aiM"), cars = null;
  G.loadCars().then(function (c) { cars = c.filter(function (x) { return !G.isSold(x); }); }).catch(function () { cars = []; });

  function open() { box.classList.add("is-open"); setTimeout(function () { box.querySelector("#aiQ").focus(); }, 60); }
  function close() { box.classList.remove("is-open"); fab.focus(); }
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-ai]")) { box.classList.contains("is-open") ? close() : open(); return; }
    if (e.target.closest("[data-aix]")) { close(); return; }
    var s = e.target.closest("[data-say]"); if (s) ask(s.dataset.say);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && box.classList.contains("is-open")) close(); });
  box.querySelector("#aiF").addEventListener("submit", function (e) { e.preventDefault(); var q = box.querySelector("#aiQ").value.trim(); if (q) ask(q); box.querySelector("#aiQ").value = ""; });

  function say(html, me) { var d = document.createElement("div"); d.className = "msg " + (me ? "msg--me" : "msg--bot"); d.innerHTML = html; M.appendChild(d); M.scrollTop = M.scrollHeight; }
  function wa(q) { return "https://wa.me/995551119942?text=" + encodeURIComponent("მოგესალმებით. " + q); }
  function ask(q) {
    say(esc(q), true);
    if (!cars) { setTimeout(function () { ask2(q); }, 600); return; }
    setTimeout(function () { ask2(q); }, 250);
  }
  function ask2(q) {
    var t = q.toLowerCase();
    if (/ამერიკ|აშშ|ჩამოყვან|იმპორტ|auction|copart|iaai/.test(t) && !/ჯიპ|სედან/.test(t)) {
      say("აშშ-დან ავტომობილის ჩამოყვანაზე დეტალურად მენეჯერი გიპასუხებთ. ამ დროისთვის გზაში " + (cars || []).filter(G.isTransit).length + ' ავტომობილია, რომელთა დაჯავშნაც ჩამოსვლამდე შეიძლება.<br><a class="link" href="' + wa(q) + '" target="_blank" rel="noopener">WhatsApp-ით კითხვა</a>');
      return;
    }
    var list = (cars || []).slice();
    var brands = {}; list.forEach(function (c) { if (c.brand) brands[c.brand.toLowerCase()] = c.brand; });
    var brand = Object.keys(brands).filter(function (b) { return t.indexOf(b) !== -1; })[0];
    if (brand) list = list.filter(function (c) { return String(c.brand).toLowerCase() === brand; });
    var words = t.split(/[\s,.]+/).filter(function (w) { return w.length > 2 && !/^\d/.test(w); });
    var model = words.filter(function (w) { return list.some(function (c) { return String(c.model).toLowerCase().indexOf(w) !== -1; }) && !brands[w]; })[0];
    if (model) list = list.filter(function (c) { return String(c.model).toLowerCase().indexOf(model) !== -1; });
    if (/ჯიპ|suv|კროსოვ/.test(t)) list = list.filter(function (c) { return c.body_type === "ჯიპი"; });
    if (/სედან/.test(t)) list = list.filter(function (c) { return c.body_type === "სედანი"; });
    if (/ელექტრ/.test(t)) list = list.filter(function (c) { return c.fuel === "ელექტრო"; });
    if (/ჰიბრიდ/.test(t)) list = list.filter(function (c) { return c.fuel === "ჰიბრიდი"; });
    var m = t.replace(/(\d),(\d{3})/g, "$1$2").match(/(\d{4,6})/);
    if (m) { var max = +m[1], gel = /₾|ლარ|gel/.test(t); list = list.filter(function (c) { var p = G.num(gel ? c.price_gel : c.price_usd); return p && p <= max; }); }
    if (/სპორტ/.test(t)) list = list.filter(function (c) { return (G.num(c.engine_hp) || 0) >= 300 || /porsche|bmw m|amg|i8|e-tron gt|mustang/i.test(c.brand + " " + c.model); });
    var anyFilter = brand || model || m || /ჯიპ|suv|სედან|ელექტრ|ჰიბრიდ|სპორტ|კროსოვ/.test(t);
    if (!anyFilter) { say('ამ კითხვაზე მენეჯერი გიპასუხებთ.<br><a class="link" href="' + wa(q) + '" target="_blank" rel="noopener">WhatsApp-ით კითხვა</a>'); return; }
    list.sort(function (a, b) { return (G.photos(b).length > 0) - (G.photos(a).length > 0) || new Date(b.created_at) - new Date(a.created_at); });
    if (!list.length) { say('ასეთი ავტომობილი ამჟამად არ გვაქვს. მენეჯერს შეუძლია მოძებნოს.<br><a class="link" href="' + wa(q) + '" target="_blank" rel="noopener">WhatsApp-ით მოთხოვნა</a>'); return; }
    var home = (V.BASE || "") + "index.html?q=" + encodeURIComponent(brand ? brands[brand] + (model ? " " + model : "") : "") + "#all";
    say("ვიპოვე " + list.length + " ავტომობილი." + list.slice(0, 3).map(function (c) { var p = G.photos(c)[0]; return '<a class="mini" href="' + V.carHref(c) + '">' + (p ? '<img src="' + esc(G.thumb(p, 200)) + '" alt="">' : "<span></span>") + "<span><b>" + esc(G.title(c)) + '</b><small class="num">' + esc([G.priceUsd(c) || G.priceGel(c), V.km(c)].filter(Boolean).join(" · ")) + "</small></span></a>"; }).join("") +
      (list.length > 3 && (brand || model) ? '<br><a class="link" href="' + home + '">ყველა შედეგის ნახვა</a>' : ""));
  }
})();
