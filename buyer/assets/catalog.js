/* Catalog page — category chips, debounced search, product grid.
   All user-visible strings use K.t() for multilingual support. */
(function () {
  "use strict";
  var grid = document.getElementById("grid");
  var chipsEl = document.getElementById("chips");
  var statusEl = document.getElementById("status");
  var searchEl = document.getElementById("search");
  var state = { category: "All", q: "" };

  function note(msg, cls) {
    statusEl.className = "note " + (cls || "");
    statusEl.textContent = msg;
    statusEl.classList.toggle("hide", !msg);
  }

  function skeletons(n) {
    grid.innerHTML = Array.from({ length: n }, function () {
      return '<article class="card loading"><div class="thumb"></div>' +
             '<div class="body"><div class="skeleton" style="height:14px"></div>' +
             '<div class="skeleton" style="height:12px;width:60%"></div></div></article>';
    }).join("");
  }

  function cardHtml(l) {
    var href = "product.html?id=" + encodeURIComponent(l.id);
    return '<article class="card">' +
      '<a href="' + href + '"><div class="thumb-wrapper"><img class="thumb" alt="' + K.esc(l.title) + '" loading="lazy" src="' +
        K.esc(l.image_url || "") + '"></div></a>' +
      '<div class="body">' +
        '<h3><a href="' + href + '">' + K.esc(l.title) + '</a></h3>' +
        '<div class="by">' + K.esc(l.artisan_name || "Artisan") +
          (l.artisan_village ? " · " + K.esc(l.artisan_village) : "") + '</div>' +
        '<div class="meta-row" style="margin:2px 0 0">' +
          (l.artisan_verified ? '<span class="badge">' + K.t("card_verified") + '</span>' : "") +
          '<span class="badge gold">' + Number(l.authenticity_score) + K.t("card_handmade") + '</span>' +
        '</div>' +
        '<div class="row">' +
          '<span class="price">' + K.rupee(l.price) + '</span>' +
          '<button class="btn sm" data-add="' + K.esc(l.id) + '">' + K.t("card_add") + '</button>' +
        '</div>' +
      '</div></article>';
  }

  var cache = [];

  async function load() {
    skeletons(6);
    note("");
    try {
      var res = await K.api.listings(state.category, state.q);
      cache = res.listings || [];
      if (!cache.length) {
        grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><h3>' + K.t("card_nothing") + '</h3>' +
          '<p>' + K.t("card_nothing_sub") + ' ' +
          '<span class="mono">python seed.py</span> ' + K.t("card_nothing_sub2") + '</p></div>';
        return;
      }
      grid.innerHTML = cache.map(cardHtml).join("");
    } catch (err) {
      grid.innerHTML = "";
      note(K.t("err_api") + " " + (K.api.base || location.origin) +
           " — " + err.message + ". " + K.t("err_api2"), "err");
    }
  }

  grid.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-add]");
    if (!btn) return;
    var listing = cache.filter(function (l) { return l.id === btn.dataset.add; })[0];
    if (!listing) return;
    K.cart.add(listing, 1);
    btn.classList.add("added");
    btn.textContent = K.t("card_added");
    setTimeout(function () {
      btn.classList.remove("added");
      btn.textContent = K.t("card_add");
    }, 1200);
  });

  chipsEl.addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    state.category = chip.dataset.cat;
    chipsEl.querySelectorAll(".chip").forEach(function (c) {
      c.classList.toggle("on", c === chip);
    });
    load();
  });

  var timer;
  searchEl.addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(function () { state.q = searchEl.value.trim(); load(); }, 280);
  });

  // Re-render on language change
  document.addEventListener("kaarigar:langchange", function () {
    // Update search placeholder
    searchEl.placeholder = K.t("search_placeholder");
    // Re-render grid cards so new language labels apply
    if (cache.length) grid.innerHTML = cache.map(cardHtml).join("");
  });

  (async function init() {
    var cats = ["All", "Pottery", "Textiles", "Metalwork"];
    try {
      var res = await K.api.categories();
      if (res && res.categories) cats = res.categories;
    } catch (e) { /* fall back to the defaults above */ }
    chipsEl.innerHTML = cats.map(function (c) {
      return '<button class="chip' + (c === "All" ? " on" : "") + '" data-cat="' +
             K.esc(c) + '">' + K.esc(c) + '</button>';
    }).join("");
    load();
  })();
})();
