/* ============================================================================
   Kimosabe Tools — i18n.js
   Drop-in client-side translation layer. Include on every page with:
     <script src="/assets/js/i18n.js" defer></script>
   (adjust the path to wherever you keep it; from /tools/ pages use ../assets/js/i18n.js
    or, simplest, an absolute path "/assets/js/i18n.js" which works from every folder.)

   HTML usage:
     <span data-i18n="nav.home">Home</span>                 → sets textContent
     <input data-i18n-attr="placeholder:ui_common.upload">  → sets an attribute
     <meta data-i18n-attr="content:meta.description">       → works on meta tags too
   Multiple attrs: data-i18n-attr="title:foo.bar;aria-label:foo.baz"
   ========================================================================== */
(function () {
  'use strict';

  // 1. Which languages you ship. code = filename (lang/<code>.json). rtl flags Arabic/Hebrew/etc.
  //    ADD YOUR OTHER LANGUAGES HERE as you add their JSON files.
  var LANGUAGES = [
    { code: 'en', label: 'English',  rtl: false },
    { code: 'ar', label: 'العربية',  rtl: true  },
    { code: 'de', label: 'Deutsch',  rtl: false },
    { code: 'es', label: 'Español',  rtl: false },
    { code: 'fr', label: 'Français', rtl: false },
    { code: 'zh', label: '中文',      rtl: false }
  ];

  // 2. Where the JSON files live. The loader AUTO-DISCOVERS the folder by
  //    trying these candidates in order (first one that serves en.json wins),
  //    so it works whether your folder is named lang/, languages/, etc.
  //    If yours isn't listed, add it first.
  var LANG_PATH_CANDIDATES = ['/lang/', '/languages/', '/language/', '/assets/lang/', '/locales/'];
  var LANG_PATH = null;               // resolved at init
  var DEFAULT_LANG = 'en';
  var STORAGE_KEY = 'kimosabe_lang';

  var dict = {};        // active language dictionary
  var enDict = {};      // English fallback dictionary (always loaded)

  // ---- helpers ----------------------------------------------------------
  function byPath(obj, path) {
    // "tools.edit_pdf.title" -> obj.tools.edit_pdf.title (or undefined)
    return path.split('.').reduce(function (o, k) {
      return (o && typeof o === 'object') ? o[k] : undefined;
    }, obj);
  }

  function t(key) {
    var v = byPath(dict, key);
    if (v === undefined) v = byPath(enDict, key);   // fall back to English
    return (v === undefined) ? null : v;            // null → leave existing text as-is
  }

  function supported(code) {
    for (var i = 0; i < LANGUAGES.length; i++) if (LANGUAGES[i].code === code) return LANGUAGES[i];
    return null;
  }

  function fetchLang(code) {
    return fetch(LANG_PATH + code + '.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + LANG_PATH + code + '.json'); return r.json(); });
  }

  // Try each candidate folder until en.json loads. Resolves with the English
  // dictionary; rejects (with a LOUD console error) if no folder works.
  function discoverLangPath() {
    var i = 0;
    function tryNext() {
      if (i >= LANG_PATH_CANDIDATES.length) {
        console.error(
          '[i18n] Could not find the language files. Tried: ' + LANG_PATH_CANDIDATES.join(', ') + '\n' +
          '[i18n] Make sure en.json (and the other languages) are deployed in one of those folders, ' +
          'or add your folder name to LANG_PATH_CANDIDATES at the top of i18n.js.'
        );
        return Promise.reject(new Error('no language folder found'));
      }
      var base = LANG_PATH_CANDIDATES[i++];
      return fetch(base + 'en.json', { cache: 'no-cache' })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          LANG_PATH = base;
          console.log('[i18n] language files found at', base);
          return r.json();
        })
        .catch(function () { return tryNext(); });
    }
    return tryNext();
  }

  // ---- DOM application --------------------------------------------------
  function applyToDom(root) {
    root = root || document;

    // text content
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      var val = t(el.getAttribute('data-i18n'));
      if (val !== null) el.textContent = val;
    });

    // attributes:  data-i18n-attr="placeholder:key;title:key2"
    root.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var bits = pair.split(':');
        if (bits.length !== 2) return;
        var attr = bits[0].trim(), val = t(bits[1].trim());
        if (val !== null) el.setAttribute(attr, val);
      });
    });

    // <title> is special (not selectable the same way if it has no data-i18n)
    var titleKey = document.documentElement.getAttribute('data-i18n-title');
    if (titleKey) { var tv = t(titleKey); if (tv !== null) document.title = tv; }
  }

  function applyDirection(langObj) {
    var html = document.documentElement;
    html.setAttribute('lang', langObj.code);
    html.setAttribute('dir', langObj.rtl ? 'rtl' : 'ltr');
    // convenience hook for CSS: html[dir="rtl"] .something { ... }
  }

  // ---- public: switch language -----------------------------------------
  function setLanguage(code) {
    var langObj = supported(code) || supported(DEFAULT_LANG);
    if (!LANG_PATH) {
      console.error('[i18n] setLanguage("' + code + '") called but no language folder was found — see the error above.');
      return Promise.resolve();
    }
    var loadActive = (langObj.code === 'en')
      ? Promise.resolve(enDict)   // english already loaded at init; avoid double fetch
      : fetchLang(langObj.code);

    return loadActive
      .then(function (data) {
        dict = data;
        try { localStorage.setItem(STORAGE_KEY, langObj.code); } catch (e) {}
        applyDirection(langObj);
        applyToDom(document);
        updateSwitcherLabel(langObj);
        document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { code: langObj.code } }));
      })
      .catch(function (err) {
        console.error('[i18n] Failed to load "' + code + '": ' + err.message + '\n' +
          '[i18n] Check that ' + LANG_PATH + langObj.code + '.json is deployed and is valid JSON.');
        // stay on whatever is currently shown (English fallback already in DOM)
      });
  }

  // ---- language switcher UI --------------------------------------------
  // Renders into any element with id="lang-switcher". If none exists, does nothing
  // (you can still call i18n.setLanguage(code) yourself from a custom menu).
  function buildSwitcher() {
    var mount = document.getElementById('lang-switcher');
    if (!mount) return;
    var sel = document.createElement('select');
    sel.setAttribute('aria-label', 'Select language');
    sel.className = 'lang-select';
    LANGUAGES.forEach(function (l) {
      var opt = document.createElement('option');
      opt.value = l.code; opt.textContent = l.label;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', function () { setLanguage(this.value); });
    mount.appendChild(sel);
  }
  function updateSwitcherLabel(langObj) {
    var sel = document.querySelector('#lang-switcher select');
    if (sel) sel.value = langObj.code;
  }

  // ---- boot -------------------------------------------------------------
  function detectInitial() {
    var saved;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (saved && supported(saved)) return saved;
    // fall back to the browser's preferred language (just the primary subtag)
    var nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return supported(nav) ? nav : DEFAULT_LANG;
  }

  function init() {
    buildSwitcher();
    // Discover the folder + load English (the fallback dictionary), then the
    // saved / browser-preferred language.
    discoverLangPath()
      .then(function (data) { enDict = data; dict = data; return setLanguage(detectInitial()); })
      .catch(function () { enDict = {}; dict = {}; });   // page keeps its hardcoded English text
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // expose a tiny API
  window.i18n = {
    setLanguage: setLanguage,
    t: t,
    languages: LANGUAGES.slice()
  };
})();
