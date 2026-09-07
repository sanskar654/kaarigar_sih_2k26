/* Kaarigar — Language Switcher UI Controller
   Manages the dropdown open/close, button interactions, and updates
   the visible flag + label when the user switches language. */
(function () {
  "use strict";

  var LABELS = { en: "EN", hi: "HI", mr: "MR" };
  var FLAGS  = { en: "🇬🇧", hi: "🇮🇳", mr: "🇮🇳" };

  function init() {
    var toggle  = document.getElementById("langToggle");
    var menu    = document.getElementById("langMenu");
    var flagEl  = document.getElementById("langFlag");
    var labelEl = document.getElementById("langLabel");

    if (!toggle || !menu) return;

    // Set initial display to match persisted language
    var cur = K.getLang ? K.getLang() : "en";
    updateDisplay(cur, flagEl, labelEl);

    // Toggle dropdown
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // Close on outside click
    document.addEventListener("click", function () {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });

    // Language option clicks
    menu.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-lang-btn]");
      if (!btn) return;
      var lang = btn.getAttribute("data-lang-btn");
      K.setLang(lang);
      updateDisplay(lang, flagEl, labelEl);
      // Close dropdown
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });

    // Listen for language changes from other sources
    document.addEventListener("kaarigar:langchange", function (e) {
      updateDisplay(e.detail.lang, flagEl, labelEl);
    });
  }

  function updateDisplay(lang, flagEl, labelEl) {
    if (flagEl)  flagEl.textContent  = FLAGS[lang]  || FLAGS.en;
    if (labelEl) labelEl.textContent = LABELS[lang] || LABELS.en;
    // Update active state on buttons
    document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-lang-btn") === lang);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
