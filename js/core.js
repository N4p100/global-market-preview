/* GLOBAL MARKET — shared runtime: data, i18n, formatting, favorites, compare, card, header. */
(function () {
  "use strict";

  var SB_URL = "https://hbqnggxsdqbzkmspboul.supabase.co";
  var SB_KEY = "sb_publishable_fy4zIQsovQNwXaDAx5Ihig_S7bzCbci";
  var PROD = "https://globalmarket.ge/";
  var PHONE = "+995551119942";
  var PHONE_LABEL = "551 11 99 42";
  var WA = "995551119942";
  var MAP = "https://www.google.com/maps/search/?api=1&query=41.7946276%2C44.7692874&query_place_id=ChIJv65QzXduREARDsMVteO4KNs";
  var FAV_KEY = "gm-fav-cars";
  var CMP_KEY = "gm-compare-cars";
  var LANG_KEY = "gm-lang";

  var LIST_COLS = [
    "id", "created_at", "brand", "model", "year", "price_gel", "price_usd", "fuel", "body_type", "image_url", "photos",
    "section", "mileage", "engine", "transmission", "drive", "customs", "status", "sold_at", "reserved_until", "location",
    "views", "is_pinned", "pinned_at", "vip_until", "arrival_port", "arrival_date", "restore_eta", "availability",
    "has_six_month_warranty", "exchange_available", "engine_hp", "color", "vin_spec"
  ].join(",");

  /* ---------- i18n ---------- */
  var DICT = {
    ka: {
      nav_cars: "მანქანები", nav_transit: "გზაში", nav_auction: "აუქციონი", nav_sell: "გაყიდვა", nav_about: "ჩვენს შესახებ",
      login: "შესვლა", favorites: "რჩეულები", menu: "მენიუ", close: "დახურვა", skip: "მთავარ შინაარსზე გადასვლა",
      help: "დახმარება", call: "დარეკვა", call_sub: "ორშ–შაბ 10:00–19:00", wa_sub: "მოგვწერეთ ნებისმიერ დროს", map: "რუკაზე ნახვა", map_sub: "მარკეტის მისამართი",
      gel: "₾", usd: "$", km: "კმ", l: "ლ", hp: "ც.ძ.",
      per_day: "დღეში", lease_from: "ლიზინგით", price_request: "ფასი შეთანხმებით",
      flag_vip: "VIP", flag_transit: "გზაშია", flag_sold: "გაყიდულია", flag_reserved: "დაჯავშნილია", flag_restore: "აღსადგენი", flag_service: "სერვისშია",
      perk_warranty: "გარანტია", perk_exchange: "გაცვლა",
      photos: "ფოტო", compare: "შედარება", compare_go: "შედარება", compare_full: "შესადარებლად მაქსიმუმ 3 ავტომობილის არჩევაა შესაძლებელი", compare_n: "{n} ავტომობილი არჩეულია",
      fav_added: "დაემატა რჩეულებში", fav_removed: "წაიშალა რჩეულებიდან",
      auction_short: "აუქციონი", auction_start: "საწყისი", buy_now: "ახლავე ყიდვა",
      arrival: "ჩამოსვლა", arrival_tbd: "ჩამოსვლის თარიღი ზუსტდება",
      months: ["იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი", "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"],
      months_s: ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"],
      foot_rights: "GLOBAL MARKET. ყველა უფლება დაცულია.", foot_contact: "კონტაქტი", foot_terms: "წესები და პირობები",
      load_error: "მონაცემები ვერ ჩაიტვირთა. შეამოწმეთ ინტერნეტი და სცადეთ ხელახლა.", retry: "ხელახლა ცდა"
    },
    en: {
      nav_cars: "Cars", nav_transit: "In transit", nav_auction: "Auction", nav_sell: "Sell", nav_about: "About us",
      login: "Sign in", favorites: "Saved", menu: "Menu", close: "Close", skip: "Skip to main content",
      help: "Help", call: "Call", call_sub: "Mon–Sat 10:00–19:00", wa_sub: "Message us any time", map: "Open map", map_sub: "Market location",
      gel: "₾", usd: "$", km: "km", l: "L", hp: "hp",
      per_day: "per day", lease_from: "Leasing from", price_request: "Price on request",
      flag_vip: "VIP", flag_transit: "In transit", flag_sold: "Sold", flag_reserved: "Reserved", flag_restore: "To restore", flag_service: "In service",
      perk_warranty: "Warranty", perk_exchange: "Exchange",
      photos: "photos", compare: "Compare", compare_go: "Compare", compare_full: "You can compare up to 3 cars", compare_n: "{n} cars selected",
      fav_added: "Saved", fav_removed: "Removed from saved",
      auction_short: "Auction", auction_start: "Start", buy_now: "Buy now",
      arrival: "Arrives", arrival_tbd: "Arrival date to be confirmed",
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      months_s: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      foot_rights: "GLOBAL MARKET. All rights reserved.", foot_contact: "Contact", foot_terms: "Terms",
      load_error: "We couldn't load the cars. Check your connection and try again.", retry: "Try again"
    }
  };

  var VALUE_EN = {
    "ბენზინი": "Petrol", "ჰიბრიდი": "Hybrid", "ელექტრო": "Electric", "დიზელი": "Diesel", "დატენვადი ჰიბრიდი": "Plug-in hybrid",
    "ჯიპი": "SUV", "სედანი": "Sedan", "ჰეჩბექი": "Hatchback", "კაბრიოლეტი": "Convertible", "მინივენი": "Minivan", "კუპე": "Coupe", "პიკაპი": "Pickup", "უნივერსალი": "Wagon",
    "ავტომატიკა": "Automatic", "ტიპტრონიკი": "Tiptronic", "მექანიკა": "Manual", "ვარიატორი": "CVT",
    "წინა": "FWD", "უკანა": "RWD", "4x4": "AWD",
    "განბაჟებული": "Customs cleared", "განუბაჟებელი": "Not cleared",
    "საქართველო": "Georgia", "გზაში": "In transit", "აშშ": "USA",
    "შავი": "Black", "თეთრი": "White", "რუხი": "Grey", "ვერცხლისფერი": "Silver", "ლურჯი": "Blue", "წითელი": "Red", "მწვანე": "Green", "ყავისფერი": "Brown", "ბეჟი": "Beige", "ნაცრისფერი": "Grey", "მუქი ლურჯი": "Dark blue"
  };

  var lang = "ka";
  try { var saved = localStorage.getItem(LANG_KEY); if (saved === "en") lang = "en"; } catch (e) {}

  function t(key, vars) {
    var s = (DICT[lang] && DICT[lang][key]) != null ? DICT[lang][key] : (DICT.ka[key] != null ? DICT.ka[key] : key);
    if (vars && typeof s === "string") Object.keys(vars).forEach(function (k) { s = s.replace("{" + k + "}", vars[k]); });
    return s;
  }
  function tv(value) {
    if (value == null) return "";
    var v = String(value).trim();
    return lang === "en" && VALUE_EN[v] ? VALUE_EN[v] : v;
  }
  function setLang(next) {
    lang = next === "en" ? "en" : "ka";
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    location.reload();
  }
  function applyStatic(root) {
    document.documentElement.lang = lang;
    (root || document).querySelectorAll("[data-t]").forEach(function (el) {
      var map = window.PAGE_TEXT && window.PAGE_TEXT[lang];
      var key = el.getAttribute("data-t");
      var val = (map && map[key]) != null ? map[key] : (DICT[lang][key] != null ? DICT[lang][key] : null);
      if (val == null) return;
      if (el.hasAttribute("data-t-attr")) el.setAttribute(el.getAttribute("data-t-attr"), val);
      else el.textContent = val;
    });
  }
  function pt(key, vars) {
    var map = window.PAGE_TEXT || {};
    var s = (map[lang] && map[lang][key]) != null ? map[lang][key] : (map.ka && map.ka[key]) != null ? map.ka[key] : t(key);
    if (vars) Object.keys(vars).forEach(function (k) { s = s.split("{" + k + "}").join(vars[k]); });
    return s;
  }

  /* ---------- formatting ---------- */
  function n(v) { return Number(v).toLocaleString("en-US"); }
  function num(v) { var x = Number(v); return v != null && v !== "" && isFinite(x) ? x : null; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function title(c) { return [c.year, c.brand, c.model].filter(Boolean).join(" "); }
  function priceGel(c) { var g = num(c.price_gel); return g && g > 0 ? n(g) + " ₾" : ""; }
  function priceUsd(c) { var u = num(c.price_usd); return u && u > 0 ? n(u) + " $" : ""; }
  function leaseDaily(c) { var u = num(c.price_usd); return u && u > 0 ? Math.round(Math.round(u * 0.0586) / 30) : null; }
  function lease(c) {
    var u = num(c.price_usd);
    if (!u || u <= 0) return null;
    var monthly = Math.round(u * 0.0586);
    return { down: Math.round(u * 0.52), monthly: monthly, daily: Math.round(monthly / 30) };
  }
  function photos(c) {
    var list = Array.isArray(c.photos) && c.photos.length ? c.photos : (c.image_url ? [c.image_url] : []);
    return list.filter(Boolean).map(function (u) { return String(u).trim(); });
  }
  function thumb(url, w) {
    if (!url) return "";
    var m = String(url).match(/^(https:\/\/[^/]+\.supabase\.co)\/storage\/v1\/object\/public\/(.+)$/);
    return m ? m[1] + "/storage/v1/render/image/public/" + m[2] + "?width=" + (w || 640) + "&quality=72&resize=contain" : url;
  }
  function dateLong(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return lang === "en" ? t("months")[d.getMonth()] + " " + d.getDate() : d.getDate() + " " + t("months")[d.getMonth()];
  }
  function dateShort(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return lang === "en" ? t("months_s")[d.getMonth()] + " " + d.getDate() : d.getDate() + " " + t("months_s")[d.getMonth()];
  }
  function tbilisiTime(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tbilisi" });
  }
  function tbilisiDate(iso) {
    var d = new Date(new Date(iso).toLocaleString("en-US", { timeZone: "Asia/Tbilisi" }));
    return isNaN(d) ? "" : (lang === "en" ? t("months")[d.getMonth()] + " " + d.getDate() : d.getDate() + " " + t("months")[d.getMonth()]);
  }

  /* ---------- status helpers ---------- */
  function isSold(c) { return c.status === "sold"; }
  function isReserved(c) { return c.status === "reserved"; }
  function isTransit(c) { return c.section === "transit" || c.location === "გზაში"; }
  function isRestore(c) { return c.section === "restore"; }
  function isVip(c) { return c.section === "vip" || (c.vip_until && new Date(c.vip_until) > new Date()); }
  function hasWarranty(c) { return c.has_six_month_warranty === true && !isRestore(c) && !isTransit(c); }

  /* ---------- data ---------- */
  function rest(path) {
    return fetch(SB_URL + "/rest/v1/" + path, { headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
  }
  function rpc(name, body) {
    return fetch(SB_URL + "/rest/v1/rpc/" + name, {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
  }
  var carsPromise = null;
  function loadCars() {
    if (carsPromise) return carsPromise;
    try {
      var cached = JSON.parse(sessionStorage.getItem("gm-cars-cache") || "null");
      if (cached && Date.now() - cached.at < 5 * 60 * 1000 && Array.isArray(cached.data)) {
        carsPromise = Promise.resolve(cached.data);
        return carsPromise;
      }
    } catch (e) {}
    carsPromise = rest("gm_public_cars?select=" + LIST_COLS +
      "&is_archived=eq.false&publish_market=eq.true&status=in.(active,reserved,sold)" +
      "&or=(status.eq.active,status.eq.reserved,and(status.eq.sold,sold_at.not.is.null))&order=created_at.desc")
      .then(function (data) {
        try { sessionStorage.setItem("gm-cars-cache", JSON.stringify({ at: Date.now(), data: data })); } catch (e) {}
        return data;
      })
      .catch(function (err) { carsPromise = null; throw err; });
    return carsPromise;
  }
  function loadCar(id) {
    return rest("gm_public_cars?select=*&id=eq." + encodeURIComponent(id) + "&is_archived=eq.false&publish_market=eq.true&limit=1")
      .then(function (rows) { return rows && rows[0] ? rows[0] : null; });
  }
  var lotsPromise = null;
  function loadLots() {
    if (!lotsPromise) lotsPromise = rpc("auction_public_lots").catch(function () { return []; });
    return lotsPromise;
  }

  /* ---------- favorites + compare ---------- */
  function readIds(key) {
    try { var v = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(v) ? v.map(String) : []; } catch (e) { return []; }
  }
  function writeIds(key, ids) { try { localStorage.setItem(key, JSON.stringify(ids)); } catch (e) {} }
  function isFav(id) { return readIds(FAV_KEY).indexOf(String(id)) !== -1; }
  function toggleFav(id) {
    var ids = readIds(FAV_KEY), s = String(id), i = ids.indexOf(s);
    if (i === -1) ids.push(s); else ids.splice(i, 1);
    writeIds(FAV_KEY, ids);
    syncFavUI();
    toast(i === -1 ? t("fav_added") : t("fav_removed"));
    document.dispatchEvent(new CustomEvent("gm:fav"));
    return i === -1;
  }
  function favIds() { return readIds(FAV_KEY); }
  function syncFavUI() {
    var count = readIds(FAV_KEY).length;
    document.querySelectorAll("[data-fav-count]").forEach(function (el) { el.textContent = count; el.hidden = !count; });
    document.querySelectorAll(".fav[data-id], [data-fav-btn]").forEach(function (b) {
      b.setAttribute("aria-pressed", isFav(b.getAttribute("data-id")) ? "true" : "false");
    });
  }
  function cmpIds() { return readIds(CMP_KEY); }
  function toggleCmp(id) {
    var ids = readIds(CMP_KEY), s = String(id), i = ids.indexOf(s);
    if (i === -1) {
      if (ids.length >= 3) { toast(t("compare_full")); return false; }
      ids.push(s);
    } else ids.splice(i, 1);
    writeIds(CMP_KEY, ids);
    renderCmpBar();
    return i === -1;
  }
  var carIndex = {};
  function renderCmpBar() {
    var ids = readIds(CMP_KEY);
    document.querySelectorAll(".car__cmp[data-id], .card__cmp[data-id]").forEach(function (b) {
      b.setAttribute("aria-pressed", ids.indexOf(b.getAttribute("data-id")) !== -1 ? "true" : "false");
    });
    var bar = document.getElementById("cmpbar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "cmpbar"; bar.className = "cmpbar"; bar.setAttribute("role", "region"); bar.setAttribute("aria-label", t("compare"));
      document.body.appendChild(bar);
    }
    if (!ids.length || document.body.classList.contains("page-compare")) { bar.hidden = true; return; }
    bar.hidden = false;
    bar.innerHTML =
      '<div class="cmpbar__thumbs">' + ids.map(function (id) {
        var c = carIndex[id]; var p = c ? thumb(photos(c)[0], 120) : "";
        return p ? '<img src="' + esc(p) + '" alt="">' : "";
      }).join("") + "</div>" +
      '<span class="cmpbar__t">' + esc(t("compare_n", { n: ids.length })) + "</span>" +
      '<a class="btn btn--red btn--sm" href="' + (window.GM_BASE || "") + 'compare.html?ids=' + ids.join(",") + '">' + esc(t("compare_go")) + "</a>" +
      '<button class="round" type="button" data-cmp-clear aria-label="' + esc(t("close")) + '">' + ICON.x + "</button>";
    bar.querySelector("[data-cmp-clear]").onclick = function () { writeIds(CMP_KEY, []); renderCmpBar(); };
  }

  /* ---------- toast ---------- */
  var toastTimer;
  function toast(msg) {
    var el = document.getElementById("toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 1800);
  }

  /* ---------- icons (one stroke family, 1.7) ---------- */
  function svg(d, extra) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || "") + ">" + d + "</svg>"; }
  var ICON = {
    heart: svg('<path d="M12 20s-7.5-4.6-9.2-9.4C1.6 7.2 3.9 4 7.3 4c2 0 3.6 1.1 4.7 2.7C13.1 5.1 14.7 4 16.7 4c3.4 0 5.7 3.2 4.5 6.6C19.5 15.4 12 20 12 20z"/>'),
    camera: svg('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
    shield: svg('<path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/><path d="m9 12 2 2 4-4"/>'),
    swap: svg('<path d="M7 7h12l-3-3M17 17H5l3 3"/>'),
    ship: svg('<path d="M3 17l2 3h14l2-3M5 17V11h14v6M8 11V6h8v5M12 3v3"/>'),
    gavel: svg('<path d="m14 4 6 6M11 7l6 6M8 20h8M12.5 9.5 5 17"/>'),
    phone: svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
    wa: svg('<path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.4-4.3a8.5 8.5 0 1 1 15.6-4.5z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .8a5 5 0 0 1-2.2-2.2l.8-1-1-2z"/>'),
    pin: svg('<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    chat: svg('<path d="M4 5h16v11H9l-5 4z"/>'),
    x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    left: svg('<path d="M15 5l-7 7 7 7"/>'),
    right: svg('<path d="M9 5l7 7-7 7"/>'),
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    down: svg('<path d="M6 9l6 6 6-6"/>'),
    user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
    menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    filter: svg('<path d="M4 6h16M7 12h10M10 18h4"/>'),
    share: svg('<path d="M12 4v11M8 8l4-4 4 4M5 13v6h14v-6"/>'),
    copy: svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5h10"/>'),
    road: svg('<path d="M12 21a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"/><path d="M12 13l3.5-4"/>'),
    cal: svg('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>'),
    fuel: svg('<path d="M5 20V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15M4 20h11M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3M7 8h5"/>'),
    gear: svg('<circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><path d="M6 8v8M12 8v8M18 8v4H6"/>'),
    engine: svg('<path d="M4 10h2V8h4V6h4v2h3l2 3h1v5h-1l-2 3H8l-2-3H4z"/>'),
    drive: svg('<circle cx="6" cy="12" r="3"/><circle cx="18" cy="12" r="3"/><path d="M9 12h6"/>')
  };

  /* ---------- auction map ---------- */
  var lotByCar = {};
  function indexLots(lots) {
    lotByCar = {};
    (lots || []).forEach(function (l) {
      if (!l || l.car_id == null) return;
      if (["scheduled", "live", "active", "running"].indexOf(String(l.status)) === -1) return;
      lotByCar[String(l.car_id)] = l;
    });
  }
  function lotFor(c) { return lotByCar[String(c.id)] || null; }

  /* ---------- card ---------- */
  function carHref(c) { return "car.html#" + encodeURIComponent(c.id); }
  function card(c, opts) {
    opts = opts || {};
    carIndex[String(c.id)] = c;
    var ph = photos(c), cut = cutout(c);
    var flags = [];
    if (isSold(c)) flags.push(t("flag_sold"));
    else if (isReserved(c)) flags.push(t("flag_reserved"));
    if (!isSold(c) && isTransit(c)) flags.push(t("flag_transit"));
    if (!isSold(c) && isRestore(c)) flags.push(t("flag_restore"));
    if (!isSold(c) && isVip(c) && !opts.noVip) flags.push(t("flag_vip"));
    var lot = !isSold(c) ? lotFor(c) : null;
    if (lot) flags.push(t("auction_short"));

    var specs = [
      num(c.mileage) != null ? n(c.mileage) + " " + t("km") : "",
      tv(c.fuel),
      c.engine ? String(c.engine).replace(/\.0$/, "") + " " + t("l") : "",
      tv(c.drive)
    ].filter(Boolean).join(" · ");
    var g = priceGel(c), u = priceUsd(c);
    var price = g ? "<b>" + g + "</b>" + (u ? "<span>" + u + "</span>" : "") : (u ? "<b>" + u + "</b>" : "<b>" + t("price_request") + "</b>");
    var daily = !isSold(c) ? leaseDaily(c) : null;
    var perks = [];
    if (!isSold(c) && hasWarranty(c)) perks.push("<span>" + ICON.shield + t("perk_warranty") + "</span>");
    if (!isSold(c) && c.exchange_available) perks.push("<span>" + ICON.swap + t("perk_exchange") + "</span>");
    var extra = "";
    if (opts.transit && !isSold(c)) {
      extra = '<div class="car__extra"><span>' + (c.arrival_date ? t("arrival") + ": <b>" + dateLong(c.arrival_date) + "</b>" : t("arrival_tbd")) + "</span>" + (c.arrival_port ? "<span>" + esc(c.arrival_port) + "</span>" : "") + "</div>";
    } else if (lot) {
      extra = '<div class="car__extra"><span>' + t("auction_short") + " <b>" + dateShort(lot.starts_at || lot.session_at) + "</b></span>" +
        (lot.starting_cents ? "<span>" + t("auction_start") + " <b>" + n(Math.round(lot.starting_cents / 100)) + " $</b></span>" : "") + "</div>";
    }
    var href = (opts.base || "") + carHref(c);
    var flagHtml = flags.map(function (f, i) { return '<span' + (i === 0 && (isSold(c) || isReserved(c)) ? ' class="is-dark"' : "") + ">" + esc(f) + "</span>"; }).join("");
    return '<article class="car' + (isSold(c) ? " is-sold" : "") + '">' +
      '<div class="car__img">' +
        (ph[0] ? '<img class="main" src="' + esc(thumb(ph[0], 800)) + '" alt="' + esc(title(c)) + '" loading="lazy" decoding="async">' : "") +
        (ph[1] ? '<img class="alt" src="' + esc(thumb(ph[1], 800)) + '" alt="" loading="lazy" decoding="async">' : "") +
        (flags.length ? '<div class="car__flags">' + flagHtml + "</div>" : "") +
        (ph.length > 1 ? '<span class="car__count num">' + ICON.camera + ph.length + "</span>" : "") +
      "</div>" +
      '<button class="fav" type="button" data-id="' + esc(c.id) + '" aria-pressed="' + (isFav(c.id) ? "true" : "false") + '" aria-label="' + esc(t("favorites")) + ": " + esc(title(c)) + '">' + ICON.heart + "</button>" +
      '<div class="car__b">' +
        '<h3 class="car__t"><a href="' + href + '">' + esc(title(c)) + "</a></h3>" +
        (specs ? '<p class="car__s num">' + esc(specs) + "</p>" : "") +
        '<p class="car__p num">' + price + "</p>" +
        (daily ? '<p class="car__l num">' + t("lease_from") + " " + n(daily) + " ₾ " + t("per_day") + "</p>" : "") +
        (perks.length && !opts.compact ? '<p class="car__perks">' + perks.join("") + "</p>" : "") +
        extra +
        (opts.compare ? '<button class="car__cmp" type="button" data-id="' + esc(c.id) + '" aria-pressed="' + (cmpIds().indexOf(String(c.id)) !== -1 ? "true" : "false") + '"><span class="box"></span>' + t("compare") + "</button>" : "") +
      "</div></article>";
  }
  function skeletons(count) {
    var s = "";
    for (var i = 0; i < count; i++) s += '<div class="car car--skel" aria-hidden="true"><div class="car__img skel"></div><div class="line skel" style="width:70%"></div><div class="line skel" style="width:45%"></div><div class="line skel" style="width:35%;height:22px"></div></div>';
    return s;
  }

  /* ---------- studio cutouts (real inventory photos, background removed) ---------- */
  var CUTS = {}, cutsPromise = null, CUT_BASE = "assets/cutouts/";
  function loadCutouts(base) {
    if (base != null) CUT_BASE = base + "assets/cutouts/";
    if (!cutsPromise) cutsPromise = fetch(CUT_BASE + "manifest.json").then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }).then(function (m) { CUTS = m || {}; return CUTS; });
    return cutsPromise;
  }
  /* Cutouts are switched off: Mate wants every car shown in its real, full photo (2026-10-26). */
  function cutout(c) { return null; }
  function cutScore(c) { var m = CUTS[String(c.id)]; return m ? m.score : -1; }

  /* delegated card actions */
  document.addEventListener("click", function (e) {
    var f = e.target.closest(".fav[data-id]");
    if (f) { e.preventDefault(); toggleFav(f.getAttribute("data-id")); return; }
    var c = e.target.closest(".car__cmp[data-id], .card__cmp[data-id]");
    if (c) { e.preventDefault(); toggleCmp(c.getAttribute("data-id")); }
  });

  /* ---------- header / drawer / help ---------- */
  function initChrome() {
    applyStatic();
    var lb = document.querySelector(".lang__btn"), lm = document.querySelector(".lang__menu");
    if (lb && lm) {
      lb.querySelector("[data-lang-label]").textContent = lang === "en" ? "EN" : "GE";
      lm.querySelectorAll("[data-lang]").forEach(function (b) {
        b.setAttribute("aria-checked", b.getAttribute("data-lang") === lang ? "true" : "false");
        b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); });
      });
      lb.addEventListener("click", function (e) { e.stopPropagation(); lm.hidden = !lm.hidden; lb.setAttribute("aria-expanded", String(!lm.hidden)); });
      document.addEventListener("click", function (e) { if (!lm.hidden && !lm.contains(e.target)) { lm.hidden = true; lb.setAttribute("aria-expanded", "false"); } });
    }
    var drawer = document.getElementById("drawer");
    document.querySelectorAll("[data-drawer-open]").forEach(function (b) { b.addEventListener("click", function () { drawer.classList.add("is-open"); document.body.style.overflow = "hidden"; }); });
    document.querySelectorAll("[data-drawer-close]").forEach(function (b) { b.addEventListener("click", closeDrawer); });
    if (drawer) drawer.querySelectorAll("nav a").forEach(function (a) { a.addEventListener("click", closeDrawer); });
    function closeDrawer() { if (drawer) drawer.classList.remove("is-open"); document.body.style.overflow = ""; }

    var help = document.getElementById("help");
    if (help) {
      var hb = help.querySelector(".help__btn"), hm = help.querySelector(".help__menu");
      hb.addEventListener("click", function (e) { e.stopPropagation(); hm.hidden = !hm.hidden; hb.setAttribute("aria-expanded", String(!hm.hidden)); });
      document.addEventListener("click", function (e) { if (!hm.hidden && !help.contains(e.target)) { hm.hidden = true; hb.setAttribute("aria-expanded", "false"); } });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (lm) lm.hidden = true;
      if (help) help.querySelector(".help__menu").hidden = true;
      closeDrawer();
    });
    var y = document.querySelector("[data-year]"); if (y) y.textContent = new Date().getFullYear();
    syncFavUI();
    renderCmpBar();
    watchHeader();
    var ck = document.getElementById("clock");
    if (ck && document.documentElement.getAttribute("data-theme") !== "night" && !ck.dataset.on) { ck.dataset.on = "1"; marketClock(ck); }
  }



  /* ---------- live Tbilisi clock (day = market hours, night = auction) ---------- */
  function tbilisiNow() {
    var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tbilisi", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
    return { day: o.weekday, h: +o.hour, m: +o.minute, hm: o.hour + ":" + o.minute };
  }
  var CLK = {
    ka: { open: "მარკეტი ღიაა · {t}", closed: "მარკეტი დაკეტილია · იხსნება 10:00-ზე", sunday: "კვირა · მარკეტი ორშაბათს იხსნება", until: "აუქციონამდე {t}", live: "აუქციონი მიმდინარეობს", none: "აუქციონის განრიგი მალე" },
    en: { open: "Market open · {t}", closed: "Market closed · opens at 10:00", sunday: "Sunday · market opens Monday", until: "Auction in {t}", live: "Auction is live", none: "Auction schedule soon" }
  };
  function marketClock(el) {
    if (!el) return;
    function paint() {
      var n2 = tbilisiNow(), L = CLK[lang] || CLK.ka, open = n2.day !== "Sun" && n2.h >= 10 && n2.h < 19;
      el.innerHTML = '<span class="dot ' + (open ? "dot--ok" : "dot--off") + '"></span><span class="lbl">' + esc(n2.day === "Sun" ? L.sunday : open ? L.open.replace("{t}", n2.hm) : L.closed) + "</span>";
    }
    paint(); setInterval(paint, 30000);
  }
  function auctionClock(el, lots) {
    if (!el) return;
    var L = CLK[lang] || CLK.ka;
    var up = (lots || []).filter(function (l) { return l && new Date(l.ends_at || l.starts_at).getTime() > Date.now(); }).sort(function (a, b) { return new Date(a.starts_at) - new Date(b.starts_at); });
    if (!up.length) { el.innerHTML = '<span class="dot dot--off"></span><span class="lbl">' + esc(L.none) + "</span>"; return; }
    var target = new Date(up[0].session_at || up[0].starts_at).getTime();
    function pad(x) { return (x < 10 ? "0" : "") + x; }
    function paint() {
      var s = Math.floor((target - Date.now()) / 1000);
      if (s <= 0) { el.innerHTML = '<span class="dot dot--signal"></span><span class="lbl">' + esc(L.live) + "</span>"; return; }
      var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
      var t2 = (d ? d + (lang === "en" ? "d " : " დღე ") : "") + pad(h) + ":" + pad(m) + ":" + pad(sec);
      el.innerHTML = '<span class="dot dot--signal"></span><span class="lbl num">' + esc(L.until.replace("{t}", t2)) + "</span>";
    }
    paint(); setInterval(paint, 1000);
  }

  /* ---------- motion helpers ---------- */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      if (e.target.hasAttribute("data-count")) countUp(e.target);
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -12% 0px" }) : null;
  function reveal(root) {
    (root || document).querySelectorAll(".reveal:not(.in), .stagger:not(.in), [data-count]:not(.in), .route:not(.in), .sell:not(.in)").forEach(function (el) {
      if (io) io.observe(el); else el.classList.add("in");
    });
  }
  function countUp(el) {
    var to = Number(el.getAttribute("data-count")), dur = 1400, t0 = null;
    if (!isFinite(to)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = n(to); return; }
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = n(Math.round(to * e));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function watchHeader() {
    var h = document.querySelector(".head");
    if (!h) return;
    var hero = document.querySelector(".hero__frame"), last = window.scrollY;
    if (!hero) h.classList.add("is-solid", "is-fixed-solid");
    var on = function () {
      var y = window.scrollY, limit = hero ? hero.offsetHeight - 90 : 8;
      if (hero) h.classList.toggle("is-solid", y > limit);
      h.classList.toggle("is-hidden", y > limit + 200 && y > last + 4);
      if (y < last - 4) h.classList.remove("is-hidden");
      last = y;
    };
    window.addEventListener("scroll", on, { passive: true }); on();
  }

  window.GM = {
    PROD: PROD, PHONE: PHONE, PHONE_LABEL: PHONE_LABEL, WA: WA, MAP: MAP,
    get lang() { return lang; },
    t: t, tv: tv, pt: pt, setLang: setLang, applyStatic: applyStatic,
    n: n, num: num, esc: esc, title: title, priceGel: priceGel, priceUsd: priceUsd, lease: lease, leaseDaily: leaseDaily,
    photos: photos, thumb: thumb, dateLong: dateLong, dateShort: dateShort, tbilisiTime: tbilisiTime, tbilisiDate: tbilisiDate,
    isSold: isSold, isReserved: isReserved, isTransit: isTransit, isRestore: isRestore, isVip: isVip, hasWarranty: hasWarranty,
    rest: rest, rpc: rpc, loadCars: loadCars, loadCar: loadCar, loadLots: loadLots, indexLots: indexLots, lotFor: lotFor,
    isFav: isFav, toggleFav: toggleFav, favIds: favIds, syncFavUI: syncFavUI, cmpIds: cmpIds, toggleCmp: toggleCmp, renderCmpBar: renderCmpBar,
    reveal: reveal, countUp: countUp, marketClock: marketClock, auctionClock: auctionClock, tbilisiNow: tbilisiNow, watchHeader: watchHeader, card: card, skeletons: skeletons, loadCutouts: loadCutouts, cutout: cutout, cutScore: cutScore, carHref: carHref, toast: toast, ICON: ICON, initChrome: initChrome, carIndex: carIndex
  };
})();
