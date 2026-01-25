/**
 * Kimosabe Tools Language Manager
 * Handles multilingual support for the entire site
 */

class LanguageManager {
    constructor() {
        // List of supported languages with their codes and names
        this.supportedLanguages = {
            'en': 'English',
            'es': 'Español',
            'fr': 'Français',
            'de': 'Deutsch',
            'zh': '中文',
            'ar': 'العربية',
            'hi': 'हिन्दी',
            'pt': 'Português',
            'ru': 'Русский',
            'ja': '日本語',
            'ko': '한국어',
            'sw': 'Kiswahili',
            'it': 'Italiano',
            'nl': 'Nederlands',
            'pl': 'Polski',
            'tr': 'Türkçe',
            'vi': 'Tiếng Việt'
        };
        
        // Default language
        this.defaultLang = 'en';
        
        // Current language
        this.currentLang = this.defaultLang;
        
        // Translations object
        this.translations = {};
        
        // Initialize
        this.init();
    }
    
    async init() {
        // Get saved language or detect browser language
        await this.loadLanguage();
        
        // Load translations
        await this.loadTranslations();
        
        // Apply translations to current page
        this.applyTranslations();
        
        // Setup language switcher
        this.setupLanguageSwitcher();
        
        // Update direction for RTL languages
        this.updateTextDirection();
    }
    
    async loadLanguage() {
        // Check localStorage for saved preference
        const savedLang = localStorage.getItem('kimosabe_lang');
        
        if (savedLang && this.supportedLanguages[savedLang]) {
            this.currentLang = savedLang;
        } else {
            // Detect browser language
            const browserLang = navigator.language || navigator.userLanguage;
            const shortLang = browserLang.split('-')[0];
            
            if (this.supportedLanguages[shortLang]) {
                this.currentLang = shortLang;
            } else {
                this.currentLang = this.defaultLang;
            }
        }
        
        // Save to localStorage
        localStorage.setItem('kimosabe_lang', this.currentLang);
    }
    
    async loadTranslations() {
        try {
            const response = await fetch(`../assets/lang/${this.currentLang}.json`);
            
            if (!response.ok) {
                throw new Error(`Language file not found: ${this.currentLang}.json`);
            }
            
            this.translations = await response.json();
            
        } catch (error) {
            console.warn(`Failed to load ${this.currentLang} translations, falling back to English:`, error);
            
            // Fallback to English
            this.currentLang = 'en';
            const fallbackResponse = await fetch('../assets/lang/en.json');
            this.translations = await fallbackResponse.json();
            
            // Save fallback language
            localStorage.setItem('kimosabe_lang', 'en');
        }
    }
    
    async setLanguage(langCode) {
        if (!this.supportedLanguages[langCode]) {
            console.warn(`Language ${langCode} is not supported`);
            return;
        }
        
        if (this.currentLang === langCode) return;
        
        this.currentLang = langCode;
        localStorage.setItem('kimosabe_lang', langCode);
        
        // Reload translations
        await this.loadTranslations();
        
        // Apply new translations
        this.applyTranslations();
        
        // Update language switcher
        this.updateLanguageSwitcher();
        
        // Update text direction
        this.updateTextDirection();
        
        // Track language change
        this.trackLanguageChange(langCode);
    }
    
    applyTranslations() {
        // 1. Update page title and meta tags
        this.updateMetaTags();
        
        // 2. Find all elements with data-i18n attribute
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
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
        });
        
        // 3. Update elements with data-i18n-placeholder
        const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
        placeholderElements.forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.getTranslation(key);
            
            if (translation) {
                element.placeholder = translation;
            }
        });
        
        // 4. Update elements with data-i18n-title
        const titleElements = document.querySelectorAll('[data-i18n-title]');
        titleElements.forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            const translation = this.getTranslation(key);
            
            if (translation) {
                element.title = translation;
            }
        });
        
        // 5. Update elements with data-i18n-alt
        const altElements = document.querySelectorAll('[data-i18n-alt]');
        altElements.forEach(element => {
            const key = element.getAttribute('data-i18n-alt');
            const translation = this.getTranslation(key);
            
            if (translation) {
                element.alt = translation;
            }
        });
        
        // 6. Update HTML lang attribute
        document.documentElement.lang = this.currentLang;
    }
    
    getTranslation(key) {
        // Split key by dots to navigate nested objects
        const keys = key.split('.');
        let value = this.translations;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                console.warn(`Translation key not found: ${key}`);
                return null;
            }
        }
        
        return value;
    }
    
    updateMetaTags() {
        // Update page title
        const pageTitle = this.getTranslation('meta.title');
        if (pageTitle) {
            document.title = pageTitle;
        }
        
        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            const description = this.getTranslation('meta.description');
            if (description) {
                metaDescription.content = description;
            }
        }
        
        // Update Open Graph tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && pageTitle) {
            ogTitle.content = pageTitle;
        }
        
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc && metaDescription) {
            ogDesc.content = metaDescription.content;
        }
    }
    
    setupLanguageSwitcher() {
        // Create language switcher if it doesn't exist
        if (!document.getElementById('language-switcher')) {
            const navLinks = document.querySelector('.nav-links');
            if (navLinks) {
                const languageSwitcher = document.createElement('div');
                languageSwitcher.id = 'language-switcher';
                languageSwitcher.className = 'language-switcher';
                
                languageSwitcher.innerHTML = `
                    <button class="language-toggle" id="language-toggle">
                        🌐 ${this.currentLang.toUpperCase()}
                    </button>
                    <div class="language-dropdown" id="language-dropdown">
                        ${Object.entries(this.supportedLanguages)
                            .map(([code, name]) => `
                                <button class="language-option ${code === this.currentLang ? 'active' : ''}" 
                                        data-lang="${code}">
                                    ${name}
                                </button>
                            `).join('')}
                    </div>
                `;
                
                // Insert before the support button
                const supportBtn = navLinks.querySelector('.support-btn');
                if (supportBtn) {
                    navLinks.insertBefore(languageSwitcher, supportBtn);
                } else {
                    navLinks.appendChild(languageSwitcher);
                }
                
                // Add event listeners
                this.setupLanguageSwitcherEvents();
            }
        } else {
            // Update existing switcher
            this.updateLanguageSwitcher();
        }
    }
    
    setupLanguageSwitcherEvents() {
        const toggleBtn = document.getElementById('language-toggle');
        const dropdown = document.getElementById('language-dropdown');
        
        if (toggleBtn && dropdown) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('show');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                dropdown.classList.remove('show');
            });
            
            // Handle language selection
            dropdown.addEventListener('click', (e) => {
                if (e.target.classList.contains('language-option')) {
                    const langCode = e.target.getAttribute('data-lang');
                    this.setLanguage(langCode);
                }
            });
        }
    }
    
    updateLanguageSwitcher() {
        const toggleBtn = document.getElementById('language-toggle');
        const dropdown = document.getElementById('language-dropdown');
        
        if (toggleBtn) {
            toggleBtn.textContent = `🌐 ${this.currentLang.toUpperCase()}`;
        }
        
        if (dropdown) {
            const options = dropdown.querySelectorAll('.language-option');
            options.forEach(option => {
                const langCode = option.getAttribute('data-lang');
                option.classList.toggle('active', langCode === this.currentLang);
            });
        }
    }
    
    updateTextDirection() {
        // RTL languages
        const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        
        if (rtlLanguages.includes(this.currentLang)) {
            document.documentElement.dir = 'rtl';
            document.body.classList.add('rtl');
        } else {
            document.documentElement.dir = 'ltr';
            document.body.classList.remove('rtl');
        }
    }
    
    trackLanguageChange(langCode) {
        // Track with Google Analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', 'language_changed', {
                'event_category': 'language',
                'event_label': langCode,
                'transport_type': 'beacon'
            });
        }
        
        // Dispatch custom event for other scripts
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: langCode }
        }));
    }
    
    // Helper function to translate text in JavaScript
    t(key, defaultValue = '') {
        const translation = this.getTranslation(key);
        return translation || defaultValue;
    }
}

// Create global instance
window.languageManager = new LanguageManager();

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LanguageManager;
}
