/* Product detail page — photo, bilingual copy, authenticity, artisan story.
   All user-visible strings use K.t() for multilingual support. */
(function () {
  "use strict";
  var root = document.getElementById("root");
  var id = new URLSearchParams(location.search).get("id");
  var listing = null;
  var qty = 1;

  function render() {
    var l = listing;
    root.innerHTML =
      '<div class="detail animate-success">' +
        '<div class="gallery">' +
          '<img alt="' + K.esc(l.title) + '" src="' + K.esc(l.image_url || "") + '">' +
        '</div>' +
        '<div>' +
          '<div class="meta-row" style="margin:0">' +
            (l.artisan_verified
              ? '<span class="badge">' + K.t("detail_verified") + '</span>'
              : '<span class="badge grey">' + K.t("detail_pending") + '</span>') +
            '<span class="badge gold">' + Number(l.authenticity_score) + K.t("card_handmade") + '</span>' +
            '<span class="badge indigo">' + K.esc(l.category || "Handicraft") + '</span>' +
          '</div>' +
          '<h1>' + K.esc(l.title) + '</h1>' +
          '<p class="muted" style="margin:0">' + K.esc(l.description || "") + '</p>' +
          (l.description_local ? '<p class="local">' + K.esc(l.description_local) + '</p>' : "") +
          '<div class="price-lg">' + K.rupee(l.price) + '</div>' +
          '<div class="muted" style="font-size:14px">' + Number(l.quantity || 1) + ' ' + K.t("detail_available") + '</div>' +
          '<div class="qty">' +
            '<button type="button" data-step="-1" aria-label="Decrease quantity">−</button>' +
            '<span id="qty">1</span>' +
            '<button type="button" data-step="1" aria-label="Increase quantity">+</button>' +
          '</div>' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
            '<button class="btn" id="add">' + K.t("detail_add") + '</button>' +
            '<button class="btn dark" id="buy">' + K.t("detail_buy") + '</button>' +
          '</div>' +
          '<div class="note" style="margin-top:16px">' + K.t("detail_escrow") + ' ' +
            K.esc((l.artisan_name || "the artisan").split(" ")[0]) + ' ' + K.t("detail_escrow2") + '</div>' +
          (l.artisan_story ? storyHtml(l) : "") +
        '</div>' +
      '</div>';

    document.getElementById("qty").textContent = qty;
    root.querySelectorAll("[data-step]").forEach(function (b) {
      b.addEventListener("click", function () {
        var max = Math.max(1, Number(l.quantity || 1));
        qty = Math.min(max, Math.max(1, qty + Number(b.dataset.step)));
        document.getElementById("qty").textContent = qty;
      });
    });
    document.getElementById("add").addEventListener("click", function () {
      K.cart.add(l, qty);
      this.textContent = K.t("card_added");
      var btn = this;
      this.classList.add("added");
      setTimeout(function () {
        btn.textContent = K.t("detail_add");
        btn.classList.remove("added");
      }, 1200);
    });
    document.getElementById("buy").addEventListener("click", function () {
      K.cart.add(l, qty);
      location.href = "cart.html";
    });
  }

  function storyHtml(l) {
    return '<div class="panel story">' +
      '<div class="who">' +
        '<div class="avatar">' + K.esc(K.initials(l.artisan_name)) + '</div>' +
        '<div><b>' + K.esc(l.artisan_name || "Artisan") + '</b><br>' +
          '<span class="muted" style="font-size:13.5px">' +
            K.esc(l.artisan_craft || "") + (l.artisan_village ? " · " + K.esc(l.artisan_village) : "") +
          '</span></div>' +
      '</div>' +
      '<p>' + K.esc(l.artisan_story) + '</p></div>';
  }

  // Re-render on language change if listing is loaded
  document.addEventListener("kaarigar:langchange", function () {
    if (listing) render();
  });

  (async function init() {
    if (!id) {
      root.innerHTML = '<div class="empty"><h3>' + K.t("detail_no_product") + '</h3>' +
        '<p><a href="index.html">' + K.t("detail_browse_catalog") + '</a></p></div>';
      return;
    }
    root.innerHTML = '<div class="detail"><div class="skeleton" style="aspect-ratio:1"></div>' +
      '<div><div class="skeleton" style="height:28px;width:70%"></div></div></div>';
    try {
      listing = await K.api.listing(id);
      document.title = listing.title + " — Kaarigar";
      render();
    } catch (err) {
      root.innerHTML = '<div class="empty"><h3>' + K.t("detail_could_not_load") + '</h3>' +
        '<p class="muted">' + K.esc(err.message) + '</p>' +
        '<p><a href="index.html">' + K.t("detail_back") + '</a></p></div>';
    }
  })();
})();
