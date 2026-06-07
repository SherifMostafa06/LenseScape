/**
 * js/i18n.js — Arabic / English localization (Bonus feature)
 * Toggles language on any page that has data-i18n attributes.
 * Usage: <h1 data-i18n="hero.title">Book Your Studio</h1>
 */

const translations = {
  en: {
    nav: {
      browse: 'Browse Studios',
      about:  'About Us',
      signin: 'Sign In',
    },
    hero: {
      badge:    "Cairo's Studio Marketplace",
      title:    'Book Your Perfect Photoshoot Studio',
      subtitle: 'Browse professional studios across Cairo — natural light spaces, LED rigs, rooftops & more.',
      cta:      "Get Started — It's Free",
      story:    'Our Story',
    },
    studios: {
      title:       'Available Studios',
      subtitle:    'Browse freely — sign in when you\'re ready to book.',
      searchPlaceholder: 'Search by name or feature...',
      allZones:    'All Zones',
      bookNow:     'Book Now',
      perHour:     '/hr',
      capacity:    'Capacity',
      zone:        'Zone',
      noStudios:   'No Studios Found',
      noStudiosHint: 'Try a different zone or search term.',
    },
    map: {
      title:     'Studios on the Map',
      detecting: 'Detecting your location...',
      nearest:   'Nearest to You',
    },
    about_brief: {
      title: 'Why LensSpace?',
      body:  "A friend of ours owns a photography studio and has deep connections in Cairo's creative scene. We built LensSpace — one platform, all of Cairo's top studios, instantly bookable.",
      cta:   'Read Our Story',
    },
    reviews: {
      title:    'What Photographers Say',
      subtitle: 'Real experiences from the LensSpace community.',
    },
    stats: {
      title:    'LensSpace by the Numbers',
      studios:  'Studios Listed',
      zones:    'Cairo Zones',
      clients:  'Happy Clients',
      bookings: 'Bookings Made',
    },
    auth: {
      signin:       'Sign In',
      register:     'Create Account',
      email:        'Email Address',
      password:     'Password',
      confirmPass:  'Confirm Password',
      fullName:     'Full Name',
      accountType:  'Account Type',
      user:         'Photographer / Client',
      owner:        'Studio Owner',
    },
    footer: 'All rights reserved.',
  },

  ar: {
    nav: {
      browse: 'تصفح الاستوديوهات',
      about:  'من نحن',
      signin: 'تسجيل الدخول',
    },
    hero: {
      badge:    'سوق الاستوديوهات في القاهرة',
      title:    'احجز استوديو التصوير المثالي',
      subtitle: 'تصفح الاستوديوهات الاحترافية في جميع أنحاء القاهرة.',
      cta:      'ابدأ الآن — مجانًا',
      story:    'قصتنا',
    },
    studios: {
      title:       'الاستوديوهات المتاحة',
      subtitle:    'تصفح بحرية — سجّل دخولك عند الحجز.',
      searchPlaceholder: 'ابحث بالاسم أو الميزة...',
      allZones:    'كل المناطق',
      bookNow:     'احجز الآن',
      perHour:     '/ساعة',
      capacity:    'السعة',
      zone:        'المنطقة',
      noStudios:   'لا توجد استوديوهات',
      noStudiosHint: 'جرب منطقة أو مصطلح بحث مختلف.',
    },
    map: {
      title:     'الاستوديوهات على الخريطة',
      detecting: 'جارٍ تحديد موقعك...',
      nearest:   'الأقرب إليك',
    },
    about_brief: {
      title: 'لماذا LensSpace؟',
      body:  'صديق لنا يمتلك استوديو تصوير ولديه علاقات في الوسط الإبداعي بالقاهرة. بنينا LensSpace — منصة واحدة، كل استوديوهات القاهرة، حجز فوري.',
      cta:   'اقرأ قصتنا',
    },
    reviews: {
      title:    'ما يقوله المصورون',
      subtitle: 'تجارب حقيقية من مجتمع LensSpace.',
    },
    stats: {
      title:    'LensSpace بالأرقام',
      studios:  'استوديو مدرج',
      zones:    'مناطق بالقاهرة',
      clients:  'عميل سعيد',
      bookings: 'حجز تم',
    },
    auth: {
      signin:       'تسجيل الدخول',
      register:     'إنشاء حساب',
      email:        'البريد الإلكتروني',
      password:     'كلمة المرور',
      confirmPass:  'تأكيد كلمة المرور',
      fullName:     'الاسم الكامل',
      accountType:  'نوع الحساب',
      user:         'مصور / عميل',
      owner:        'صاحب استوديو',
    },
    footer: 'جميع الحقوق محفوظة.',
  },
};

let currentLang = localStorage.getItem('lensspace_lang') || 'en';

function applyTranslations(lang) {
  currentLang = lang;
  localStorage.setItem('lensspace_lang', lang);

  // Toggle RTL
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lang);

  // Apply translations to all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n; // e.g. "hero.title"
    const parts = key.split('.');
    let value = translations[lang];
    for (const part of parts) {
      if (!value) break;
      value = value[part];
    }
    if (value) {
      if (el.tagName === 'INPUT' && el.placeholder !== undefined) {
        el.placeholder = value;
      } else {
        el.textContent = value;
      }
    }
  });

  // Update toggle button text
  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.textContent = lang === 'ar' ? 'EN' : 'AR';
    btn.setAttribute('title', lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
  });
}

function toggleLanguage() {
  applyTranslations(currentLang === 'en' ? 'ar' : 'en');
}

// Auto-apply on page load
document.addEventListener('DOMContentLoaded', () => {
  applyTranslations(currentLang);
  document.querySelectorAll('.lang-toggle').forEach(btn =>
    btn.addEventListener('click', toggleLanguage)
  );
});
