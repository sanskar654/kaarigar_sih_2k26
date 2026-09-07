/* Kaarigar buyer app — shared helpers (API base, cart, formatting).
   Loaded by every page before its own page script. */
(function () {
  "use strict";

  // ── API base resolution ───────────────────────────────────────
  // 1. ?api=https://host  (remembered afterwards — needed when the frontend is
  //    on Vercel and the API is on Render)
  // 2. window.KAARIGAR_API set inline by a page
  // 3. file:// → assume a local backend on :8000
  // 4. otherwise same origin (FastAPI serves this folder at /)
  var qs = new URLSearchParams(location.search);
  if (qs.get("api")) localStorage.setItem("kaarigar_api", qs.get("api").replace(/\/$/, ""));
  var API =
    window.KAARIGAR_API ||
    localStorage.getItem("kaarigar_api") ||
    (location.protocol === "file:" ? "http://localhost:8000" : "");

  async function req(path, options) {
    var res = await fetch(API + path, Object.assign({ headers: { "Content-Type": "application/json" } }, options));
    var body = null;
    try { body = await res.json(); } catch (e) { /* empty or non-JSON body */ }
    if (!res.ok) {
      var msg = (body && (body.detail || body.message)) || res.status + " " + res.statusText;
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
    return body;
  }

  var api = {
    base: API,
    health: function () { return req("/api/health"); },
    categories: function () { return req("/api/categories"); },
    listings: function (category, q) {
      var p = new URLSearchParams();
      if (category) p.set("category", category);
      if (q) p.set("q", q);
      return req("/api/listings?" + p.toString());
    },
    listing: function (id) { return req("/api/listings/" + encodeURIComponent(id)); },
    createOrder: function (payload) {
      return req("/api/orders", { method: "POST", body: JSON.stringify(payload) });
    },
    verifyPayment: function (orderId, payload) {
      return req("/api/orders/" + encodeURIComponent(orderId) + "/verify", {
        method: "POST", body: JSON.stringify(payload || {}),
      });
    },
    deliver: function (orderId) {
      return req("/api/orders/" + encodeURIComponent(orderId) + "/deliver", { method: "POST" });
    },
    orders: function () { return req("/api/orders"); },
    artisans: function () { return req("/api/artisans"); },
    dashboard: function (id) { return req("/api/artisans/" + encodeURIComponent(id) + "/dashboard"); },
  };

  // ── cart (localStorage) ───────────────────────────────────────
  var KEY = "kaarigar_cart";

  var cart = {
    all: function () {
      try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
    },
    save: function (items) {
      localStorage.setItem(KEY, JSON.stringify(items));
      cart.paint();
    },
    count: function () {
      return cart.all().reduce(function (n, i) { return n + i.qty; }, 0);
    },
    add: function (listing, qty) {
      var items = cart.all();
      var found = items.filter(function (i) { return i.listing_id === listing.id; })[0];
      if (found) {
        found.qty += qty || 1;
      } else {
        items.push({
          listing_id: listing.id, title: listing.title, price: Number(listing.price),
          image_url: listing.image_url, artisan_name: listing.artisan_name, qty: qty || 1,
        });
      }
      cart.save(items);
    },
    setQty: function (id, qty) {
      var items = cart.all()
        .map(function (i) { return i.listing_id === id ? Object.assign(i, { qty: qty }) : i; })
        .filter(function (i) { return i.qty > 0; });
      cart.save(items);
    },
    remove: function (id) {
      cart.save(cart.all().filter(function (i) { return i.listing_id !== id; }));
    },
    clear: function () { localStorage.removeItem(KEY); cart.paint(); },
    total: function () {
      return cart.all().reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    },
    paint: function () {
      var n = cart.count();
      document.querySelectorAll("[data-cart-count]").forEach(function (el) {
        el.textContent = n;
      });
    },
  };

  // ── formatting / dom helpers ──────────────────────────────────
  function rupee(n) {
    return "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function initials(name) {
    return String(name || "?").trim().split(/\s+/).slice(0, 2)
      .map(function (w) { return w[0]; }).join("").toUpperCase();
  }

  // STATUS is a getter so labels are always translated for the current language
  var STATUS = {
    get created() { return { label: (window.K && window.K.t) ? window.K.t("status_created") : "Awaiting payment", cls: "grey" }; },
    get paid_held() { return { label: (window.K && window.K.t) ? window.K.t("status_paid_held") : "Payment held in escrow", cls: "gold" }; },
    get released() { return { label: (window.K && window.K.t) ? window.K.t("status_released") : "Paid out to artisan", cls: "" }; },
    get failed() { return { label: (window.K && window.K.t) ? window.K.t("status_failed") : "Payment failed", cls: "grey" }; },
  };

  // t() stub — replaced by locales.js after it loads
  function tStub(key) {
    if (window.__kLocales) return window.__kLocales.t(key);
    return key;
  }

  window.K = {
    api: api, cart: cart, rupee: rupee, esc: esc, initials: initials, STATUS: STATUS,
    t: tStub,
    setLang: function(l) { if (window.__kLocales) window.__kLocales.setLang(l); },
    applyLang: function() { if (window.__kLocales) window.__kLocales.applyLang(); },
    getLang: function() { return window.__kLocales ? window.__kLocales.getLang() : "en"; },
    getLangs: function() { return window.__kLocales ? window.__kLocales.getLangs() : {}; },
  };

  document.addEventListener("DOMContentLoaded", function () {
    cart.paint();
    // Merge locales engine if locales.js was already parsed
    if (window.__kLocales) {
      window.K.t = window.__kLocales.t;
      window.K.setLang = window.__kLocales.setLang;
      window.K.applyLang = window.__kLocales.applyLang;
      window.K.getLang = window.__kLocales.getLang;
      window.K.getLangs = window.__kLocales.getLangs;
    }
  });
})();
