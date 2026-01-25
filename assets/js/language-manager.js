class LanguageManager {
  constructor() {
    this.currentLang = localStorage.getItem('preferred-language') || 'en';
    this.translations = {};
    this.elements = {};
  }

  async init() {
    await this.loadTranslations();
    this.detectBrowserLanguage();
    this.setupLanguageSwitcher();
    this.applyTranslations();
    this.updateDirection();
  }

  async loadTranslations() {
    try {
      const response = await fetch(`../assets/lang/${this.currentLang}.json`);
      this.translations = await response.json();
    } catch (error) {
      console.error('Error loading translations:', error);
      // Fallback to English
      this.currentLang = 'en';
      const response = await fetch('../assets/lang/en.json');
      this.translations = await response.json();
    }
  }

  detectBrowserLanguage() {
    if (!localStorage.getItem('preferred-language')) {
      const browserLang = navigator.language || navigator.userLanguage;
      const shortLang = browserLang.split('-')[0];
      
      // Check if we have this language
      const supportedLangs = ['en', 'es', 'fr', 'sw', 'ar', 'zh'];
      if (supportedLangs.includes(shortLang)) {
        this.currentLang = shortLang;
      }
    }
  }

  setupLanguageSwitcher() {
    const toggleBtn = document.getElementById('language-toggle');
    const dropdown = document.getElementById('language-dropdown');
    const currentLangSpan = document.getElementById('current-language');

    if (toggleBtn && dropdown) {
      // Set current language indicator
      currentLangSpan.textContent = this.currentLang.toUpperCase();

      toggleBtn.addEventListener('click', () => {
        dropdown.classList.toggle('show');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!toggleBtn.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.classList.remove('show');
        }
      });

      // Handle language selection
      dropdown.querySelectorAll('.language-option').forEach(option => {
        option.addEventListener('click', async (e) => {
          const lang = e.target.dataset.lang;
          await this.setLanguage(lang);
          dropdown.classList.remove('show');
        });
      });
    }
  }

  async setLanguage(langCode) {
    if (this.currentLang === langCode) return;

    this.currentLang = langCode;
    localStorage.setItem('preferred-language', langCode);
    
    await this.loadTranslations();
    this.applyTranslations();
    this.updateDirection();
    
    // Update UI
    const currentLangSpan = document.getElementById('current-language');
    if (currentLangSpan) {
      currentLangSpan.textContent = langCode.toUpperCase();
    }

    // Track language change
    if (typeof gtag !== 'undefined') {
      gtag('event', 'language_changed', {
        'event_category': 'language',
        'event_label': langCode,
        'transport_type': 'beacon'
      });
    }
  }

  applyTranslations() {
    // Find all translatable elements
    this.findTranslatableElements();
    
    // Apply translations
    for (const [key, element] of Object.entries(this.elements)) {
      if (element) {
        const translation = this.getTranslation(key);
        if (translation) {
          if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            element.placeholder = translation;
          } else if (element.tagName === 'IMG') {
            element.alt = translation;
          } else {
            element.textContent = translation;
          }
        }
      }
    }

    // Update HTML lang attribute
    document.documentElement.lang = this.currentLang;
    
    // Update meta tags
    this.updateMetaTags();
  }

  findTranslatableElements() {
    // Find elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      this.elements[key] = element;
    });

    // Find elements with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      this.elements[`${key}_placeholder`] = element;
    });

    // Find elements with data-i18n-alt
    document.querySelectorAll('[data-i18n-alt]').forEach(element => {
      const key = element.getAttribute('data-i18n-alt');
      this.elements[`${key}_alt`] = element;
    });

    // Find elements with data-i18n-title
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      this.elements[`${key}_title`] = element;
    });
  }

  getTranslation(key) {
    const keys = key.split('.');
    let value = this.translations;
    
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        console.warn(`Translation not found: ${key}`);
        return null;
      }
    }
    
    return value;
  }

  updateDirection() {
    // RTL languages
    const rtlLangs = ['ar', 'he', 'fa', 'ur'];
    
    if (rtlLangs.includes(this.currentLang)) {
      document.documentElement.dir = 'rtl';
      document.body.classList.add('rtl');
    } else {
      document.documentElement.dir = 'ltr';
      document.body.classList.remove('rtl');
    }
  }

  updateMetaTags() {
    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    
    if (ogTitle && this.translations.site?.name) {
      ogTitle.content = this.translations.site.name;
    }
    
    if (ogDesc && this.translations.site?.description) {
      ogDesc.content = this.translations.site.description;
    }
  }

  t(key, defaultValue = '') {
    const translation = this.getTranslation(key);
    return translation || defaultValue;
  }
}

// Initialize language manager
const languageManager = new LanguageManager();

// Make it globally available
window.languageManager = languageManager;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  languageManager.init();
});
