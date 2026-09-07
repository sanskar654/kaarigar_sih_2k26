/* Cart + checkout. Razorpay Test Mode when keys are configured, otherwise the
   backend's mock payment path — the flow on screen is identical either way.
   All user-visible strings use K.t() for multilingual support. */
(function () {
  "use strict";
  var root = document.getElementById("root");

  function renderCart() {
    var items = K.cart.all();
    if (!items.length) {
      root.innerHTML = '<div class="empty animate-success"><h3>' + K.t("cart_empty_title") + '</h3>' +
        '<p>' + K.t("cart_empty_sub") + '</p>' +
        '<p><a class="btn" href="index.html">' + K.t("cart_browse") + '</a></p></div>';
      return;
    }
    root.innerHTML =
      '<div class="cart-layout">' +
        '<div class="panel"><h2>' + K.t("cart_title") + ' (' + K.cart.count() + ')</h2><div id="lines">' +
          items.map(lineHtml).join("") +
        '</div></div>' +
        '<div class="panel">' +
          '<h3>' + K.t("cart_delivery") + '</h3>' +
          '<div class="field"><label for="bname">' + K.t("cart_name") + '</label>' +
            '<input id="bname" value="' + (localStorage.getItem('buyerName') || 'Priya Deshmukh') + '" autocomplete="name"></div>' +
          '<div class="field"><label for="bphone">' + K.t("cart_phone") + '</label>' +
            '<input id="bphone" value="' + (localStorage.getItem('buyerPhone') || '+91 98200 11223') + '" autocomplete="tel"></div>' +
          '<div class="field"><label for="bcity">' + K.t("cart_city") + '</label>' +
            '<input id="bcity" value="' + (localStorage.getItem('buyerCity') || 'Pune') + '" autocomplete="address-level2"></div>' +
          '<div class="totals"><span>' + K.t("cart_subtotal") + '</span><span>' + K.rupee(K.cart.total()) + '</span></div>' +
          '<div class="totals"><span>' + K.t("cart_delivery_cost") + '</span><span>' + K.t("cart_delivery_free") + '</span></div>' +
          '<div class="totals grand"><span>' + K.t("cart_total") + '</span><span>' + K.rupee(K.cart.total()) + '</span></div>' +
          '<button class="btn block" id="pay" style="margin-top:14px">' + K.t("cart_pay") + ' ' + K.rupee(K.cart.total()) + '</button>' +
          '<div id="paystatus" class="hide" style="margin-top:12px"></div>' +
          '<p class="muted" style="font-size:12.5px;margin:12px 0 0">' + K.t("cart_escrow_note") + '</p>' +
        '</div>' +
      '</div>';

    document.getElementById("lines").addEventListener("click", onLineClick);
    document.getElementById("pay").addEventListener("click", checkout);
  }

  function lineHtml(i) {
    return '<div class="line">' +
      '<img alt="" src="' + K.esc(i.image_url || "") + '">' +
      '<div class="info"><h4>' + K.esc(i.title) + '</h4>' +
        '<div class="by">' + K.esc(i.artisan_name || "Artisan") + '</div>' +
        '<div class="qty" style="margin:8px 0 0">' +
          '<button type="button" data-q="-1" data-id="' + K.esc(i.listing_id) + '" aria-label="Decrease">−</button>' +
          '<span>' + i.qty + '</span>' +
          '<button type="button" data-q="1" data-id="' + K.esc(i.listing_id) + '" aria-label="Increase">+</button>' +
        '</div></div>' +
      '<div style="text-align:right"><div class="price">' + K.rupee(i.price * i.qty) + '</div>' +
        '<button class="btn ghost sm" data-rm="' + K.esc(i.listing_id) + '" style="margin-top:8px">' + K.t("cart_remove") + '</button>' +
      '</div></div>';
  }

  function onLineClick(e) {
    var step = e.target.closest("[data-q]");
    var rm = e.target.closest("[data-rm]");
    if (step) {
      var current = K.cart.all().filter(function (i) { return i.listing_id === step.dataset.id; })[0];
      if (current) K.cart.setQty(step.dataset.id, current.qty + Number(step.dataset.q));
      renderCart();
    } else if (rm) {
      K.cart.remove(rm.dataset.rm);
      renderCart();
    }
  }

  function status(msg, cls) {
    var el = document.getElementById("paystatus");
    el.className = "note " + (cls || "");
    el.innerHTML = msg;
    el.classList.remove("hide");
  }

  async function checkout() {
    var btn = document.getElementById("pay");
    btn.disabled = true;
    status(K.t("cart_placing"));
    var payload = {
      buyer_name: document.getElementById("bname").value.trim() || "Guest Buyer",
      buyer_phone: document.getElementById("bphone").value.trim(),
      buyer_city: document.getElementById("bcity").value.trim(),
      items: K.cart.all().map(function (i) { return { listing_id: i.listing_id, qty: i.qty }; }),
    };
    try {
      var res = await K.api.createOrder(payload);
      if (res.payment.mock || !window.Razorpay) {
        status(K.t("cart_simulating"), "warn");
        await settle(res.order.id, {});
      } else {
        openRazorpay(res, payload);
      }
    } catch (err) {
      status("Could not create the order: " + K.esc(err.message), "err");
      btn.disabled = false;
    }
  }

  function openRazorpay(res, payload) {
    var rz = new window.Razorpay({
      key: res.payment.key_id,
      order_id: res.payment.razorpay_order_id,
      amount: res.payment.amount,
      currency: "INR",
      name: "Kaarigar",
      description: "Handmade from verified artisans",
      prefill: { name: payload.buyer_name, contact: payload.buyer_phone },
      theme: { color: "#b4472e" },
      handler: function (r) {
        settle(res.order.id, {
          razorpay_order_id: r.razorpay_order_id,
          razorpay_payment_id: r.razorpay_payment_id,
          razorpay_signature: r.razorpay_signature,
        });
      },
      modal: {
        ondismiss: function () {
          status("Payment cancelled — your cart is still here.", "warn");
          document.getElementById("pay").disabled = false;
        },
      },
    });
    rz.on("payment.failed", function () {
      status("Payment failed. Please try again.", "err");
      document.getElementById("pay").disabled = false;
    });
    rz.open();
    status("Complete the payment in the Razorpay window…");
  }

  async function settle(orderId, fields) {
    try {
      var out = await K.api.verifyPayment(orderId, fields);
      if (!out.ok) throw new Error(out.message || "Verification failed");
      K.cart.clear();
      renderSuccess(out.order);
    } catch (err) {
      status("Payment could not be confirmed: " + K.esc(err.message), "err");
      document.getElementById("pay").disabled = false;
    }
  }

  function renderSuccess(order) {
    var st = K.STATUS[order.status] || { label: order.status, cls: "grey" };
    root.innerHTML =
      '<div class="panel animate-success" style="max-width:660px;margin:34px auto 60px">' +
        '<div class="note ok" style="margin-bottom:18px"><b>' + K.t("order_placed_note") + '</b> ' +
          K.t("order_placed_sub") + '</div>' +
        '<h2>Order ' + K.esc(order.id) + '</h2>' +
        '<div class="meta-row"><span class="badge ' + st.cls + '" id="ost">' + K.esc(st.label) + '</span></div>' +
        '<table><thead><tr><th>' + K.t("col_item") + '</th><th>' + K.t("col_artisan") + '</th><th class="num">' + K.t("col_qty") + '</th>' +
          '<th class="num">' + K.t("col_amount") + '</th></tr></thead><tbody>' +
          order.items.map(function (i) {
            return '<tr><td>' + K.esc(i.title) + '</td><td>' + K.esc(i.artisan_name || "—") +
              '</td><td class="num">' + i.qty + '</td><td class="num">' + K.rupee(i.line_total) + '</td></tr>';
          }).join("") +
        '</tbody></table>' +
        '<div class="totals grand"><span>' + K.t("order_paid") + '</span><span>' + K.rupee(order.amount) + '</span></div>' +
        '<h3 style="margin-top:24px">' + K.t("order_simulate_delivery") + '</h3>' +
        '<p class="muted" style="font-size:14px;margin:0 0 12px">' + K.t("order_simulate_sub") + '</p>' +
        '<button class="btn dark" id="deliver">' + K.t("order_mark_delivered") + '</button>' +
        '<div id="dstatus" class="hide" style="margin-top:14px"></div>' +
        '<p style="margin:22px 0 0"><a href="index.html">' + K.t("order_keep_browsing") + '</a> · ' +
          '<a href="dashboard.html">' + K.t("order_see_dashboard") + '</a></p>' +
      '</div>';

    document.getElementById("deliver").addEventListener("click", async function () {
      var btn = this;
      var out = document.getElementById("dstatus");
      btn.disabled = true;
      try {
        var res = await K.api.deliver(order.id);
        var s = K.STATUS[res.order.status] || { label: res.order.status, cls: "grey" };
        var badge = document.getElementById("ost");
        badge.className = "badge " + s.cls;
        badge.textContent = s.label;
        out.className = "note ok";
        out.innerHTML = K.t("order_payment_released") +
          (res.whatsapp ? '<br><br><b>WhatsApp sent to the artisan:</b><br>' + K.esc(res.whatsapp) : "");
        out.classList.remove("hide");
      } catch (err) {
        out.className = "note err";
        out.textContent = err.message;
        out.classList.remove("hide");
        btn.disabled = false;
      }
    });
  }

  // Re-render on language change
  document.addEventListener("kaarigar:langchange", renderCart);

  renderCart();
})();
