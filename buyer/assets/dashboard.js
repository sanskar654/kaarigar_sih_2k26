/* Artisan dashboard — verified badge, earnings, orders, listings.
   Includes the admin "release payment" action so the escrow flow is demoable
   from the artisan's own screen.
   All user-visible strings use K.t() for multilingual support. */
(function () {
  "use strict";
  var root = document.getElementById("root");
  var whoEl = document.getElementById("who");
  var lastData = null;

  function render(d) {
    lastData = d;
    var a = d.artisan, e = d.earnings;
    root.innerHTML =
      '<div class="panel" style="margin-bottom:22px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">' +
        '<div class="avatar" style="width:52px;height:52px;font-size:19px">' + K.esc(K.initials(a.name)) + '</div>' +
        '<div style="margin-right:auto"><b style="font-size:18px">' + K.esc(a.name) + '</b><br>' +
          '<span class="muted" style="font-size:13.5px">' + K.esc(a.craft_type || "") +
          (a.village ? " · " + K.esc(a.village) : "") + '</span></div>' +
        (a.verified
          ? '<span class="badge">' + K.t("dash_verified") + '</span>'
          : '<span class="badge grey">' + K.t("dash_pending") + '</span>') +
      '</div>' +
      '<div class="stats">' +
        stat(K.t("stat_total"), K.rupee(e.total), "") +
        stat(K.t("stat_released"), K.rupee(e.released), "green") +
        stat(K.t("stat_held"), K.rupee(e.held), "gold") +
        stat(K.t("stat_orders"), e.order_count, "") +
        stat(K.t("stat_listings"), e.listing_count, "") +
      '</div>' +
      '<div class="panel" style="margin-bottom:22px"><h3>' + K.t("dash_orders_title") + '</h3>' + ordersHtml(d.orders) + '</div>' +
      '<div class="panel" style="margin-bottom:60px"><h3>' + K.t("dash_listings_title") + '</h3>' + listingsHtml(d.listings) + '</div>';

    root.querySelectorAll("[data-release]").forEach(function (b) {
      b.addEventListener("click", async function () {
        b.disabled = true;
        b.textContent = K.t("dash_releasing");
        try {
          await K.api.deliver(b.dataset.release);
          load(a.id);
        } catch (err) {
          b.textContent = err.message;
        }
      });
    });
  }

  function stat(k, v, cls) {
    return '<div class="stat"><div class="k">' + K.esc(k) + '</div>' +
      '<div class="v ' + cls + '">' + K.esc(String(v)) + '</div></div>';
  }

  function ordersHtml(orders) {
    if (!orders.length) {
      return '<p class="muted" style="margin:0">' + K.t("dash_no_orders") + ' <a href="index.html">' +
        K.t("dash_no_orders2") + '</a> ' + K.t("dash_no_orders3") + '</p>';
    }
    return '<table><thead><tr><th>' + K.t("col_order") + '</th><th>' + K.t("col_buyer") + '</th><th>' + K.t("col_items") + '</th>' +
      '<th>' + K.t("col_status") + '</th><th class="num">' + K.t("col_your_amount") + '</th><th></th></tr></thead><tbody>' +
      orders.map(function (o) {
        var s = K.STATUS[o.status] || { label: o.status, cls: "grey" };
        var titles = o.items.map(function (i) { return K.esc(i.title) + " ×" + i.qty; }).join("<br>");
        return '<tr><td class="mono">' + K.esc(o.order_id) + '</td>' +
          '<td>' + K.esc(o.buyer_name || "—") +
            (o.buyer_city ? '<br><span class="muted" style="font-size:12.5px">' + K.esc(o.buyer_city) + '</span>' : "") + '</td>' +
          '<td style="font-size:13.5px">' + titles + '</td>' +
          '<td><span class="badge ' + s.cls + '">' + K.esc(s.label) + '</span></td>' +
          '<td class="num"><b>' + K.rupee(o.my_amount) + '</b></td>' +
          '<td class="num">' + (o.status === "paid_held"
            ? '<button class="btn ghost sm" data-release="' + K.esc(o.order_id) + '">' + K.t("dash_confirm_delivery") + '</button>'
            : "") + '</td></tr>';
      }).join("") + '</tbody></table>';
  }

  function listingsHtml(listings) {
    if (!listings.length) {
      return '<p class="muted" style="margin:0">' + K.t("dash_no_listings") + '</p>';
    }
    return '<table><thead><tr><th>' + K.t("col_product") + '</th><th>' + K.t("col_category") + '</th><th class="num">' + K.t("col_price") + '</th>' +
      '<th class="num">' + K.t("col_qty") + '</th><th class="num">' + K.t("col_handmade_score") + '</th></tr></thead><tbody>' +
      listings.map(function (l) {
        return '<tr><td><a href="product.html?id=' + encodeURIComponent(l.id) + '">' +
            K.esc(l.title) + '</a></td>' +
          '<td>' + K.esc(l.category || "—") + '</td>' +
          '<td class="num">' + K.rupee(l.price) + '</td>' +
          '<td class="num">' + Number(l.quantity || 0) + '</td>' +
          '<td class="num">' + Number(l.authenticity_score) + '%</td></tr>';
      }).join("") + '</tbody></table>';
  }

  async function load(id) {
    root.innerHTML = '<div class="skeleton" style="height:150px"></div>';
    try {
      render(await K.api.dashboard(id));
      localStorage.setItem("kaarigar_artisan", id);
    } catch (err) {
      root.innerHTML = '<div class="note err">' + K.esc(err.message) + '</div>';
    }
  }

  whoEl.addEventListener("change", function () { load(whoEl.value); });

  // Re-render on language change if data is available
  document.addEventListener("kaarigar:langchange", function () {
    if (lastData) render(lastData);
    // Also update the static data-i18n attributes (for h2 / p)
    K.applyLang();
  });

  (async function init() {
    try {
      var res = await K.api.artisans();
      var list = res.artisans || [];
      if (!list.length) {
        root.innerHTML = '<div class="empty"><h3>' + K.t("dash_no_artisans") + '</h3><p>' +
          K.t("dash_no_artisans_sub") + ' <span class="mono">python seed.py</span> ' +
          K.t("dash_no_artisans_sub2") + '</p></div>';
        return;
      }
      whoEl.innerHTML = list.map(function (a) {
        return '<option value="' + K.esc(a.id) + '">' + K.esc(a.name) +
          (a.village ? " — " + K.esc(a.village) : "") + '</option>';
      }).join("");
      var saved = new URLSearchParams(location.search).get("artisan") ||
        localStorage.getItem("kaarigar_artisan");
      var pick = list.some(function (a) { return a.id === saved; }) ? saved : list[0].id;
      whoEl.value = pick;
      load(pick);
    } catch (err) {
      root.innerHTML = '<div class="note err">' + K.t("err_api") + ' — ' + K.esc(err.message) +
        '. ' + K.t("err_api2") + '</div>';
    }
  })();
})();
