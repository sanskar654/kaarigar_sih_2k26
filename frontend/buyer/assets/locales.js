/* Kaarigar — Multilingual Localization Engine
   Supports: English (en), Hindi (hi), Marathi (mr)
   Usage: K.t("key") → translated string for current locale
          K.setLang("hi") → switch language
          K.applyLang() → apply data-i18n attrs to DOM */
(function () {
  "use strict";

  var LANGS = {
    en: {
      lang_name: "English",
      flag: "🇬🇧",

      /* ── Navigation ── */
      nav_browse: "Browse",
      nav_login: "Login",
      nav_cart: "Cart",

      /* ── Hero (index) ── */
      hero_tagline: "Verified artisans · Fair payouts",
      hero_title: "Handmade, straight from the hands that made it.",
      hero_desc: "Every product here was listed by a verified artisan over a phone call, a WhatsApp message, or our app — no middlemen, no marketplace commission games. Your payment is held safely and released to the maker once it reaches you.",

      /* ── Toolbar ── */
      search_placeholder: "Search diyas, dupatta, brass…",

      /* ── Cards ── */
      card_verified: "✓ Verified artisan",
      card_handmade: "% handmade",
      card_add: "Add to cart",
      card_added: "Added ✓",
      card_nothing: "Nothing here yet",
      card_nothing_sub: "No products match this filter. Try another category, or run",
      card_nothing_sub2: "to load the demo catalog.",

      /* ── Product detail ── */
      detail_verified: "✓ Pahchan-verified artisan",
      detail_pending: "Verification pending",
      detail_available: "available",
      detail_add: "Add to cart",
      detail_buy: "Buy now",
      detail_escrow: "Your payment is held safely and released to",
      detail_escrow2: "only after the parcel reaches you.",
      detail_back: "← Back to all products",
      detail_no_product: "No product selected",
      detail_browse_catalog: "Browse the catalog →",
      detail_could_not_load: "Could not load this product",

      /* ── Cart ── */
      cart_title: "Your cart",
      cart_empty_title: "Your cart is empty",
      cart_empty_sub: "Find something handmade you like.",
      cart_browse: "Browse products",
      cart_delivery: "Delivery details",
      cart_name: "Name",
      cart_phone: "Phone",
      cart_city: "City",
      cart_subtotal: "Subtotal",
      cart_delivery_cost: "Delivery",
      cart_delivery_free: "Free",
      cart_total: "Total",
      cart_pay: "Pay",
      cart_escrow_note: "Payment is held in escrow and released to the artisan after delivery is confirmed.",
      cart_remove: "Remove",
      cart_continue: "← Continue shopping",
      cart_placing: "Creating your order…",
      cart_simulating: "Simulating payment (Test Mode, no keys configured)…",

      /* ── Order success ── */
      order_placed_note: "Order placed.",
      order_placed_sub: "Your payment is held safely — it reaches the artisan once delivery is confirmed.",
      order_paid: "Paid",
      order_simulate_delivery: "Demo: simulate the courier",
      order_simulate_sub: "There is no real delivery in the prototype. This button stands in for the courier confirming drop-off, which releases the held payment to the artisan.",
      order_mark_delivered: "Mark delivery confirmed",
      order_keep_browsing: "← Keep browsing",
      order_see_dashboard: "See the artisan dashboard →",
      order_payment_released: "Payment released to the artisan.",
      col_item: "Item",
      col_artisan: "Artisan",
      col_qty: "Qty",
      col_amount: "Amount",

      /* ── Dashboard ── */
      dash_title: "Artisan Dashboard",
      dash_sub: "Orders, earnings and listings — what the artisan sees in the app.",
      dash_choose: "Choose artisan",
      dash_verified: "✓ Pahchan ID verified",
      dash_pending: "Verification pending",
      stat_total: "Total earned",
      stat_released: "Released to you",
      stat_held: "Held in escrow",
      stat_orders: "Orders",
      stat_listings: "Live listings",
      dash_orders_title: "Orders",
      dash_listings_title: "Your listings",
      dash_no_orders: "No orders yet. Place one from the",
      dash_no_orders2: "catalog",
      dash_no_orders3: "to see it appear here.",
      dash_no_listings: "No listings yet — they appear here once published from the sell flow (call, WhatsApp or app).",
      dash_confirm_delivery: "Confirm delivery",
      dash_releasing: "Releasing…",
      col_order: "Order",
      col_buyer: "Buyer",
      col_items: "Items",
      col_status: "Status",
      col_your_amount: "Your amount",
      col_product: "Product",
      col_category: "Category",
      col_price: "Price",
      col_handmade_score: "Handmade score",
      dash_no_artisans: "No artisans yet",
      dash_no_artisans_sub: "Run",
      dash_no_artisans_sub2: "in the backend folder to load demo data.",

      /* ── Footer ── */
      footer_test_mode: "Prototype — payments run in Razorpay Test Mode.",
      footer_test_card: "Test Mode only — use card 4111 1111 1111 1111, any future expiry, any CVV.",
      footer_escrow_note: "Held earnings are released once delivery is confirmed.",

      /* ── Status labels ── */
      status_created: "Awaiting payment",
      status_paid_held: "Payment held in escrow",
      status_released: "Paid out to artisan",
      status_failed: "Payment failed",

      /* ── Errors / misc ── */
      err_api: "Could not reach the API at",
      err_api2: "— Start the backend with: uvicorn main:app --reload",
    },

    hi: {
      lang_name: "हिन्दी",
      flag: "🇮🇳",

      /* ── Navigation ── */
      nav_browse: "उत्पाद देखें",
      nav_login: "लॉगिन",
      nav_cart: "कार्ट",

      /* ── Hero (index) ── */
      hero_tagline: "सत्यापित कारीगर · उचित भुगतान",
      hero_title: "हस्तनिर्मित, सीधे बनाने वाले के हाथों से।",
      hero_desc: "यहाँ हर उत्पाद एक सत्यापित कारीगर द्वारा फोन कॉल, WhatsApp संदेश या हमारे ऐप के माध्यम से सूचीबद्ध किया गया है — कोई बिचौलिया नहीं। आपका भुगतान सुरक्षित रखा जाता है और पार्सल पहुँचने पर कारीगर को जारी किया जाता है।",

      /* ── Toolbar ── */
      search_placeholder: "दीया, दुपट्टा, पीतल खोजें…",

      /* ── Cards ── */
      card_verified: "✓ सत्यापित कारीगर",
      card_handmade: "% हस्तनिर्मित",
      card_add: "कार्ट में डालें",
      card_added: "जोड़ा गया ✓",
      card_nothing: "अभी कुछ नहीं है",
      card_nothing_sub: "इस फ़िल्टर से कोई उत्पाद नहीं मिला। कोई अन्य श्रेणी आज़माएँ, या चलाएँ",
      card_nothing_sub2: "डेमो कैटलॉग लोड करने के लिए।",

      /* ── Product detail ── */
      detail_verified: "✓ पहचान-सत्यापित कारीगर",
      detail_pending: "सत्यापन लंबित",
      detail_available: "उपलब्ध",
      detail_add: "कार्ट में डालें",
      detail_buy: "अभी खरीदें",
      detail_escrow: "आपका भुगतान सुरक्षित रखा गया है और",
      detail_escrow2: "को तभी जारी होगा जब पार्सल आप तक पहुँच जाए।",
      detail_back: "← सभी उत्पादों पर वापस जाएँ",
      detail_no_product: "कोई उत्पाद नहीं चुना गया",
      detail_browse_catalog: "कैटलॉग देखें →",
      detail_could_not_load: "यह उत्पाद लोड नहीं हो सका",

      /* ── Cart ── */
      cart_title: "आपकी कार्ट",
      cart_empty_title: "आपकी कार्ट खाली है",
      cart_empty_sub: "कोई हस्तनिर्मित चीज़ ढूँढें जो आपको पसंद हो।",
      cart_browse: "उत्पाद देखें",
      cart_delivery: "डिलीवरी विवरण",
      cart_name: "नाम",
      cart_phone: "फोन",
      cart_city: "शहर",
      cart_subtotal: "उप-कुल",
      cart_delivery_cost: "डिलीवरी",
      cart_delivery_free: "निःशुल्क",
      cart_total: "कुल",
      cart_pay: "भुगतान करें",
      cart_escrow_note: "भुगतान एस्क्रो में रखा जाता है और डिलीवरी की पुष्टि के बाद कारीगर को जारी किया जाता है।",
      cart_remove: "हटाएँ",
      cart_continue: "← खरीदारी जारी रखें",
      cart_placing: "आपका ऑर्डर बन रहा है…",
      cart_simulating: "भुगतान का अनुकरण हो रहा है (टेस्ट मोड)…",

      /* ── Order success ── */
      order_placed_note: "ऑर्डर दिया गया।",
      order_placed_sub: "आपका भुगतान सुरक्षित है — डिलीवरी की पुष्टि होते ही कारीगर को मिलेगा।",
      order_paid: "भुगतान किया",
      order_simulate_delivery: "डेमो: कूरियर का अनुकरण",
      order_simulate_sub: "प्रोटोटाइप में कोई वास्तविक डिलीवरी नहीं है। यह बटन कूरियर की पुष्टि के बदले है, जो रखे गए भुगतान को कारीगर के पास भेजता है।",
      order_mark_delivered: "डिलीवरी की पुष्टि करें",
      order_keep_browsing: "← खरीदारी जारी रखें",
      order_see_dashboard: "कारीगर डैशबोर्ड देखें →",
      order_payment_released: "कारीगर को भुगतान जारी किया गया।",
      col_item: "वस्तु",
      col_artisan: "कारीगर",
      col_qty: "मात्रा",
      col_amount: "राशि",

      /* ── Dashboard ── */
      dash_title: "कारीगर डैशबोर्ड",
      dash_sub: "ऑर्डर, कमाई और लिस्टिंग — कारीगर को ऐप में जो दिखता है।",
      dash_choose: "कारीगर चुनें",
      dash_verified: "✓ पहचान ID सत्यापित",
      dash_pending: "सत्यापन लंबित",
      stat_total: "कुल कमाई",
      stat_released: "आपको जारी की गई",
      stat_held: "एस्क्रो में रखी",
      stat_orders: "ऑर्डर",
      stat_listings: "सक्रिय लिस्टिंग",
      dash_orders_title: "ऑर्डर",
      dash_listings_title: "आपकी लिस्टिंग",
      dash_no_orders: "अभी कोई ऑर्डर नहीं। एक ऑर्डर करें",
      dash_no_orders2: "कैटलॉग",
      dash_no_orders3: "से और यहाँ देखें।",
      dash_no_listings: "अभी कोई लिस्टिंग नहीं — बेचने की प्रक्रिया (कॉल, WhatsApp या ऐप) से प्रकाशित होने पर यहाँ दिखेंगी।",
      dash_confirm_delivery: "डिलीवरी की पुष्टि करें",
      dash_releasing: "जारी हो रहा है…",
      col_order: "ऑर्डर",
      col_buyer: "खरीदार",
      col_items: "वस्तुएँ",
      col_status: "स्थिति",
      col_your_amount: "आपकी राशि",
      col_product: "उत्पाद",
      col_category: "श्रेणी",
      col_price: "कीमत",
      col_handmade_score: "हस्तनिर्मित स्कोर",
      dash_no_artisans: "अभी कोई कारीगर नहीं",
      dash_no_artisans_sub: "चलाएँ",
      dash_no_artisans_sub2: "बैकएंड फ़ोल्डर में डेमो डेटा लोड करने के लिए।",

      /* ── Footer ── */
      footer_test_mode: "प्रोटोटाइप — भुगतान Razorpay टेस्ट मोड में चलते हैं।",
      footer_test_card: "केवल टेस्ट मोड — कार्ड 4111 1111 1111 1111, कोई भविष्य की समाप्ति तिथि, कोई CVV।",
      footer_escrow_note: "रखी हुई कमाई डिलीवरी की पुष्टि होने पर जारी की जाती है।",

      /* ── Status labels ── */
      status_created: "भुगतान का इंतजार",
      status_paid_held: "भुगतान एस्क्रो में",
      status_released: "कारीगर को भुगतान हुआ",
      status_failed: "भुगतान विफल",

      /* ── Errors / misc ── */
      err_api: "API तक नहीं पहुँच सका",
      err_api2: "— बैकएंड शुरू करें: uvicorn main:app --reload",
    },

    mr: {
      lang_name: "मराठी",
      flag: "🇮🇳",

      /* ── Navigation ── */
      nav_browse: "उत्पादे पहा",
      nav_login: "लॉगिन",
      nav_cart: "कार्ट",

      /* ── Hero (index) ── */
      hero_tagline: "सत्यापित कारागीर · न्याय्य मोबदला",
      hero_title: "हस्तनिर्मित, थेट ज्यांनी बनवले त्यांच्या हातांतून.",
      hero_desc: "येथे प्रत्येक उत्पाद एका सत्यापित कारागीराने फोन कॉल, WhatsApp संदेश किंवा आमच्या ॲपद्वारे नोंदवलेले आहे — कोणताही मध्यस्थ नाही. तुमचे पैसे सुरक्षित ठेवले जातात आणि पार्सल पोहोचल्यावर कारागीराला दिले जातात।",

      /* ── Toolbar ── */
      search_placeholder: "दिवे, दुपट्टा, पितळ शोधा…",

      /* ── Cards ── */
      card_verified: "✓ सत्यापित कारागीर",
      card_handmade: "% हस्तनिर्मित",
      card_add: "कार्टमध्ये टाका",
      card_added: "जोडले ✓",
      card_nothing: "अद्याप काही नाही",
      card_nothing_sub: "या फिल्टरशी जुळणारी उत्पादने नाहीत. दुसरी श्रेणी वापरा, किंवा चालवा",
      card_nothing_sub2: "डेमो कॅटलॉग लोड करण्यासाठी।",

      /* ── Product detail ── */
      detail_verified: "✓ पहचान-सत्यापित कारागीर",
      detail_pending: "सत्यापन प्रलंबित",
      detail_available: "उपलब्ध",
      detail_add: "कार्टमध्ये टाका",
      detail_buy: "आत्ता खरेदी करा",
      detail_escrow: "तुमचे पैसे सुरक्षित ठेवले आहेत आणि",
      detail_escrow2: "यांना तेव्हाच दिले जातील जेव्हा पार्सल तुमच्यापर्यंत पोहोचेल।",
      detail_back: "← सर्व उत्पादांकडे परत",
      detail_no_product: "कोणतेही उत्पाद निवडलेले नाही",
      detail_browse_catalog: "कॅटलॉग पहा →",
      detail_could_not_load: "हे उत्पाद लोड होऊ शकले नाही",

      /* ── Cart ── */
      cart_title: "तुमची कार्ट",
      cart_empty_title: "तुमची कार्ट रिकामी आहे",
      cart_empty_sub: "तुम्हाला आवडणारी हस्तनिर्मित वस्तू शोधा.",
      cart_browse: "उत्पादे पहा",
      cart_delivery: "डिलिव्हरी तपशील",
      cart_name: "नाव",
      cart_phone: "फोन",
      cart_city: "शहर",
      cart_subtotal: "उप-एकूण",
      cart_delivery_cost: "डिलिव्हरी",
      cart_delivery_free: "मोफत",
      cart_total: "एकूण",
      cart_pay: "पैसे द्या",
      cart_escrow_note: "पैसे एस्क्रोमध्ये ठेवले जातात आणि डिलिव्हरीची पुष्टी झाल्यावर कारागीराला दिले जातात।",
      cart_remove: "काढा",
      cart_continue: "← खरेदी सुरू ठेवा",
      cart_placing: "तुमची ऑर्डर तयार होत आहे…",
      cart_simulating: "पेमेंटचे अनुकरण (टेस्ट मोड)…",

      /* ── Order success ── */
      order_placed_note: "ऑर्डर दिली.",
      order_placed_sub: "तुमचे पैसे सुरक्षित आहेत — डिलिव्हरीची पुष्टी झाल्यावर कारागीराला मिळतील।",
      order_paid: "पैसे दिले",
      order_simulate_delivery: "डेमो: कुरिअरचे अनुकरण",
      order_simulate_sub: "प्रोटोटाइपमध्ये प्रत्यक्ष डिलिव्हरी नाही. हे बटण कुरिअर पुष्टीच्या ऐवजी आहे, जे ठेवलेले पेमेंट कारागीराकडे पाठवते.",
      order_mark_delivered: "डिलिव्हरी पुष्टी करा",
      order_keep_browsing: "← खरेदी सुरू ठेवा",
      order_see_dashboard: "कारागीर डॅशबोर्ड पहा →",
      order_payment_released: "कारागीराला पेमेंट जारी केले.",
      col_item: "वस्तू",
      col_artisan: "कारागीर",
      col_qty: "प्रमाण",
      col_amount: "रक्कम",

      /* ── Dashboard ── */
      dash_title: "कारागीर डॅशबोर्ड",
      dash_sub: "ऑर्डर, कमाई आणि लिस्टिंग — कारागीराला ॲपमध्ये जे दिसते.",
      dash_choose: "कारागीर निवडा",
      dash_verified: "✓ पहचान ID सत्यापित",
      dash_pending: "सत्यापन प्रलंबित",
      stat_total: "एकूण कमाई",
      stat_released: "तुम्हाला दिलेली",
      stat_held: "एस्क्रोमध्ये ठेवलेली",
      stat_orders: "ऑर्डर",
      stat_listings: "सक्रिय लिस्टिंग",
      dash_orders_title: "ऑर्डर",
      dash_listings_title: "तुमच्या लिस्टिंग",
      dash_no_orders: "अद्याप कोणतीही ऑर्डर नाही.",
      dash_no_orders2: "कॅटलॉग",
      dash_no_orders3: "मधून ऑर्डर द्या आणि येथे पहा.",
      dash_no_listings: "अद्याप लिस्टिंग नाही — विक्री प्रक्रियेतून (कॉल, WhatsApp किंवा ॲप) प्रकाशित झाल्यावर येथे दिसतील.",
      dash_confirm_delivery: "डिलिव्हरी पुष्टी करा",
      dash_releasing: "जारी होत आहे…",
      col_order: "ऑर्डर",
      col_buyer: "खरेदीदार",
      col_items: "वस्तू",
      col_status: "स्थिती",
      col_your_amount: "तुमची रक्कम",
      col_product: "उत्पाद",
      col_category: "श्रेणी",
      col_price: "किंमत",
      col_handmade_score: "हस्तनिर्मित स्कोर",
      dash_no_artisans: "अद्याप कारागीर नाही",
      dash_no_artisans_sub: "चालवा",
      dash_no_artisans_sub2: "बॅकएंड फोल्डरमध्ये डेमो डेटा लोड करण्यासाठी.",

      /* ── Footer ── */
      footer_test_mode: "प्रोटोटाइप — पेमेंट Razorpay टेस्ट मोडमध्ये चालतात.",
      footer_test_card: "केवळ टेस्ट मोड — कार्ड 4111 1111 1111 1111, कोणतीही भविष्यातील एक्सपायरी, कोणताही CVV.",
      footer_escrow_note: "ठेवलेली कमाई डिलिव्हरीची पुष्टी झाल्यावर जारी केली जाते.",

      /* ── Status labels ── */
      status_created: "पेमेंटची प्रतीक्षा",
      status_paid_held: "पेमेंट एस्क्रोमध्ये",
      status_released: "कारागीराला पेमेंट झाले",
      status_failed: "पेमेंट अयशस्वी",

      /* ── Errors / misc ── */
      err_api: "API पर्यंत पोहोचता आले नाही",
      err_api2: "— बॅकएंड सुरू करा: uvicorn main:app --reload",
    },
  };

  var STORAGE_KEY = "kaarigar_lang";
  var currentLang = localStorage.getItem(STORAGE_KEY) || "en";

  function t(key) {
    var dict = LANGS[currentLang] || LANGS["en"];
    return dict[key] !== undefined ? dict[key] : (LANGS["en"][key] || key);
  }

  function setLang(code) {
    if (!LANGS[code]) return;
    currentLang = code;
    localStorage.setItem(STORAGE_KEY, code);
    // Update the html lang attribute
    document.documentElement.lang = code === "en" ? "en" : code === "hi" ? "hi" : "mr";
    applyLang();
    // Fire a custom event so page scripts can re-render dynamic content
    document.dispatchEvent(new CustomEvent("kaarigar:langchange", { detail: { lang: code } }));
  }

  function applyLang() {
    // Apply data-i18n attributes
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      el.textContent = t(key);
    });
    // Apply data-i18n-placeholder attributes
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      el.placeholder = t(el.getAttribute("data-i18n-ph"));
    });
    // Update language switcher active state
    document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-lang-btn") === currentLang);
    });
  }

  function getLang() { return currentLang; }
  function getLangs() { return LANGS; }

  // Expose on global K namespace (K is created by api.js which loads first)
  // We store the functions and call K.extend after api.js runs
  window.__kLocales = { t: t, setLang: setLang, applyLang: applyLang, getLang: getLang, getLangs: getLangs };

  document.addEventListener("DOMContentLoaded", function () {
    // Merge into K object once DOM is ready (api.js should have created K by now)
    if (window.K) {
      window.K.t = t;
      window.K.setLang = setLang;
      window.K.applyLang = applyLang;
      window.K.getLang = getLang;
      window.K.getLangs = getLangs;
    }
    applyLang();
  });
})();
