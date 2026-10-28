/* GLOBAL v8: saved cars (localStorage key shared with the live site). */
(function () {
  "use strict";
  var G = window.GM, V = window.V8;
  V.initChrome();
  var grid = document.getElementById("favGrid"), ALL = [];
  grid.innerHTML = V.skel(4);
  function paint() {
    var ids = G.favIds(), list = ALL.filter(function (c) { return ids.indexOf(String(c.id)) !== -1; });
    grid.innerHTML = list.length ? list.map(function (c) { return V.carCard(c, { compare: true }); }).join("") : '<div class="empty"><h3>რჩეულები ცარიელია</h3><p>ავტომობილის შესანახად დააჭირეთ გულს ფოტოზე.</p><a class="btn btn--ink" href="cars.html">ავტომობილების ნახვა</a></div>';
  }
  Promise.all([G.loadCars(), G.loadLots()]).then(function (r) { ALL = r[0]; G.indexLots(V.liveLots(r[1])); paint(); }).catch(function () { grid.innerHTML = '<div class="empty"><h3>მონაცემები ვერ ჩაიტვირთა</h3><button class="btn btn--ink" type="button" onclick="location.reload()">ხელახლა ცდა</button></div>'; });
  document.addEventListener("gm:fav", paint);
})();
