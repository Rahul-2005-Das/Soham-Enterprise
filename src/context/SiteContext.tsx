import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'en' | 'bn' | 'hi';
export type Theme = 'light' | 'dark';
export type SiteSettings = {
  phone: string;
  emergencyPhone: string;
  whatsappNumber: string;
  supportEmail: string;
  shopAddress: string;
  businessHours: string;
  heroTitle: string;
  heroSubtitle: string;
  announcementText: string;
  offerBannerText: string;
  emergencyBannerText: string;
  aboutUs: string;
  serviceTerms: string;
  logoUrl: string;
  homeBannerUrl: string;
  brandColor: string;
  shippingFee: string;
  freeShippingThreshold: string;
  upiVpa: string;
  upiPayeeName: string;
  upiQrImageUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  faqContent: string;
  storeName: string;
};

const defaults: SiteSettings = {
  phone: '',
  emergencyPhone: '',
  whatsappNumber: '',
  supportEmail: '',
  shopAddress: '',
  businessHours: 'Monday – Sunday: 8:00 AM – 9:00 PM',
  heroTitle: 'Fast, Reliable Appliance Repairs & Genuine Spare Parts',
  heroSubtitle: 'Book a trusted doorstep visit with clear pricing and friendly support.',
  announcementText: '',
  offerBannerText: '',
  emergencyBannerText: 'Emergency appliance support is available. Contact our team for assistance.',
  aboutUs: '',
  serviceTerms: 'Repairs include a 30-day service warranty. Warranty coverage is subject to the service terms confirmed at booking.',
  logoUrl: '',
  homeBannerUrl: '',
  brandColor: 'blue',
  shippingFee: '79',
  freeShippingThreshold: '999',
  upiVpa: '',
  upiPayeeName: '',
  upiQrImageUrl: '/images/business-upi-qr.png',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  faqContent: '',
  storeName: 'Soham Enterprises',
};

const translations: Record<Language, Record<string, string>> = {
  en: {
    home: 'Home', about: 'About', services: 'Services', spareParts: 'Spare parts',
    login: 'Login', register: 'Register', account: 'My Account', bookService: 'Book service',
    callSupport: 'Call support', whatsappHelp: 'WhatsApp help', language: 'Language',
    lightMode: 'Light mode', darkMode: 'Dark mode', profile: 'My profile',
    orders: 'Orders', bookings: 'Service bookings', addresses: 'Addresses',
    step: 'Step', next: 'Next', back: 'Back', submitBooking: 'Confirm booking',
    chooseAppliance: 'Choose your appliance', chooseService: 'Choose a service',
    reviewModeration: 'Reviews', siteSettings: 'Website settings',
    overview: 'Overview', products: 'Products', categories: 'Categories', brands: 'Brands',
    coupons: 'Offers & coupons', banners: 'Banners', customers: 'Customers',
    bookTechnician: 'Book a technician visit', shopParts: 'Shop spare parts',
    yourDetails: 'Your details',
    bookingTitle: 'Book a technician visit', bookingIntro: 'Choose your appliance, visit time, and address.',
    issue: 'What seems to be the issue?', preferredDate: 'Preferred date', preferredSlot: 'Preferred time',
    yourName: 'Your name', contactPhone: 'Contact phone', serviceAddress: 'Service address',
    pincode: 'Postal code', city: 'City', state: 'State', inspectionFee: 'Inspection fee',
    cancel: 'Cancel',
    profileDetails: 'Profile details', savedAddresses: 'Saved addresses',
    myOrders: 'My orders', security: 'Password & security', signOut: 'Sign out',
    customerFeedback: 'Customer reviews and feedback', onlyApprovedPublic: 'Only approved reviews are shown publicly. Feature approved reviews to display them first.',
    loadingFeedback: 'Loading customer feedback…', noFeedback: 'No customer feedback has been submitted yet.',
    approved: 'Approved', hidden: 'Hidden', featured: 'Featured', notFeatured: 'Not featured',
    businessProfile: 'Business profile', websiteContent: 'Website content', bannersBranding: 'Banners & branding',
    saveAndPublish: 'Save and publish',
    heroTitle: 'Fast, Reliable Appliance Repairs & Genuine Spare Parts',
    heroSubtitle: 'Book a trusted doorstep visit with clear pricing and friendly support.',
  },
  bn: {
    home: 'হোম', about: 'আমাদের সম্পর্কে', services: 'পরিষেবা', spareParts: 'যন্ত্রাংশ',
    login: 'লগইন', register: 'নিবন্ধন', account: 'আমার অ্যাকাউন্ট', bookService: 'পরিষেবা বুক করুন',
    callSupport: 'সহায়তায় কল করুন', whatsappHelp: 'হোয়াটসঅ্যাপে সাহায্য', language: 'ভাষা',
    lightMode: 'লাইট মোড', darkMode: 'ডার্ক মোড', profile: 'আমার প্রোফাইল',
    orders: 'অর্ডার', bookings: 'পরিষেবা বুকিং', addresses: 'ঠিকানা',
    step: 'ধাপ', next: 'পরবর্তী', back: 'পিছনে', submitBooking: 'বুকিং নিশ্চিত করুন',
    chooseAppliance: 'যন্ত্র বেছে নিন', chooseService: 'পরিষেবা বেছে নিন',
    reviewModeration: 'রিভিউ', siteSettings: 'ওয়েবসাইট সেটিংস',
    overview: 'সংক্ষিপ্ত বিবরণ', products: 'পণ্য', categories: 'বিভাগ', brands: 'ব্র্যান্ড',
    coupons: 'অফার ও কুপন', banners: 'ব্যানার', customers: 'গ্রাহক',
    bookTechnician: 'টেকনিশিয়ান বুক করুন', shopParts: 'যন্ত্রাংশ কিনুন',
    yourDetails: 'আপনার তথ্য',
    bookingTitle: 'টেকনিশিয়ান বুক করুন', bookingIntro: 'যন্ত্র, সময় এবং ঠিকানা বেছে নিন।',
    issue: 'সমস্যাটি কী?', preferredDate: 'পছন্দের তারিখ', preferredSlot: 'পছন্দের সময়',
    yourName: 'আপনার নাম', contactPhone: 'ফোন নম্বর', serviceAddress: 'পরিষেবার ঠিকানা',
    pincode: 'পিনকোড', city: 'শহর', state: 'রাজ্য', inspectionFee: 'পরিদর্শন ফি',
    cancel: 'বাতিল',
    profileDetails: 'প্রোফাইলের তথ্য', savedAddresses: 'সংরক্ষিত ঠিকানা',
    myOrders: 'আমার অর্ডার', security: 'পাসওয়ার্ড ও নিরাপত্তা', signOut: 'সাইন আউট',
    customerFeedback: 'গ্রাহক রিভিউ ও মতামত', onlyApprovedPublic: 'শুধুমাত্র অনুমোদিত রিভিউ ওয়েবসাইটে দেখা যায়। অনুমোদিত রিভিউ আগে দেখাতে ফিচার করুন।',
    loadingFeedback: 'গ্রাহকের মতামত লোড হচ্ছে…', noFeedback: 'এখনও কোনো গ্রাহক মতামত জমা পড়েনি।',
    approved: 'অনুমোদিত', hidden: 'লুকানো', featured: 'ফিচার করা', notFeatured: 'ফিচার করা হয়নি',
    businessProfile: 'ব্যবসার প্রোফাইল', websiteContent: 'ওয়েবসাইটের লেখা', bannersBranding: 'ব্যানার ও ব্র্যান্ডিং',
    saveAndPublish: 'সংরক্ষণ ও প্রকাশ',
    heroTitle: 'দ্রুত ও নির্ভরযোগ্য যন্ত্র মেরামত এবং আসল যন্ত্রাংশ',
    heroSubtitle: 'স্বচ্ছ মূল্যে বিশ্বস্ত হোম সার্ভিস বুক করুন।',
  },
  hi: {
    home: 'होम', about: 'हमारे बारे में', services: 'सेवाएँ', spareParts: 'स्पेयर पार्ट्स',
    login: 'लॉग इन', register: 'रजिस्टर करें', account: 'मेरा खाता', bookService: 'सेवा बुक करें',
    callSupport: 'सहायता के लिए कॉल', whatsappHelp: 'व्हाट्सऐप सहायता', language: 'भाषा',
    lightMode: 'लाइट मोड', darkMode: 'डार्क मोड', profile: 'मेरी प्रोफ़ाइल',
    orders: 'ऑर्डर', bookings: 'सेवा बुकिंग', addresses: 'पते',
    step: 'चरण', next: 'आगे', back: 'वापस', submitBooking: 'बुकिंग की पुष्टि करें',
    chooseAppliance: 'अपना उपकरण चुनें', chooseService: 'सेवा चुनें',
    reviewModeration: 'समीक्षाएँ', siteSettings: 'वेबसाइट सेटिंग्स',
    overview: 'अवलोकन', products: 'उत्पाद', categories: 'श्रेणियाँ', brands: 'ब्रांड',
    coupons: 'ऑफ़र और कूपन', banners: 'बैनर', customers: 'ग्राहक',
    bookTechnician: 'टेक्नीशियन बुक करें', shopParts: 'स्पेयर पार्ट्स खरीदें',
    yourDetails: 'आपकी जानकारी',
    bookingTitle: 'टेक्नीशियन बुक करें', bookingIntro: 'उपकरण, समय और पता चुनें।',
    issue: 'समस्या क्या है?', preferredDate: 'पसंदीदा तारीख', preferredSlot: 'पसंदीदा समय',
    yourName: 'आपका नाम', contactPhone: 'फ़ोन नंबर', serviceAddress: 'सेवा का पता',
    pincode: 'पिन कोड', city: 'शहर', state: 'राज्य', inspectionFee: 'जाँच शुल्क',
    cancel: 'रद्द करें',
    profileDetails: 'प्रोफ़ाइल विवरण', savedAddresses: 'सहेजे गए पते',
    myOrders: 'मेरे ऑर्डर', security: 'पासवर्ड और सुरक्षा', signOut: 'लॉग आउट',
    customerFeedback: 'ग्राहक समीक्षाएँ और प्रतिक्रिया', onlyApprovedPublic: 'केवल स्वीकृत समीक्षाएँ सार्वजनिक दिखती हैं। स्वीकृत समीक्षा को पहले दिखाने के लिए फ़ीचर करें।',
    loadingFeedback: 'ग्राहक प्रतिक्रिया लोड हो रही है…', noFeedback: 'अभी तक कोई ग्राहक प्रतिक्रिया नहीं आई है।',
    approved: 'स्वीकृत', hidden: 'छिपी हुई', featured: 'फ़ीचर्ड', notFeatured: 'फ़ीचर्ड नहीं',
    businessProfile: 'व्यवसाय प्रोफ़ाइल', websiteContent: 'वेबसाइट सामग्री', bannersBranding: 'बैनर और ब्रांडिंग',
    saveAndPublish: 'सेव करें और प्रकाशित करें',
    heroTitle: 'तेज़ और भरोसेमंद उपकरण मरम्मत और असली स्पेयर पार्ट्स',
    heroSubtitle: 'स्पष्ट कीमतों के साथ भरोसेमंद होम सर्विस बुक करें।',
  },
};

interface SiteContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  theme: Theme;
  toggleTheme: () => void;
  settings: SiteSettings;
  refreshSettings: () => Promise<void>;
  updateSettings: (settings: Partial<SiteSettings>, confirmPaymentDetails?: boolean) => Promise<void>;
}

const SiteContext = createContext<SiteContextValue | null>(null);

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('site-language');
    return saved === 'bn' || saved === 'hi' ? saved : 'en';
  });
  const [theme, setTheme] = useState<Theme>(() => localStorage.getItem('site-theme') === 'dark' ? 'dark' : 'light');
  const [settings, setSettings] = useState<SiteSettings>(defaults);

  const setLanguage = (next: Language) => {
    localStorage.setItem('site-language', next);
    setLanguageState(next);
  };
  const toggleTheme = () => setTheme((current) => {
    const next = current === 'light' ? 'dark' : 'light';
    localStorage.setItem('site-theme', next);
    return next;
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
  useEffect(() => {
    document.documentElement.lang = language === 'bn' ? 'bn' : language === 'hi' ? 'hi' : 'en';
  }, [language]);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('brand-preset-blue', 'brand-preset-teal', 'brand-preset-indigo', 'brand-preset-orange');
    root.classList.add(`brand-preset-${settings.brandColor}`);
  }, [settings.brandColor]);

  const refreshSettings = useCallback(async () => {
    const response = await fetch('/api/settings', { credentials: 'include', cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error || 'Could not load website settings.');
    setSettings({ ...defaults, ...payload.settings });
  }, []);

  const updateSettings = useCallback(async (updates: Partial<SiteSettings>, confirmPaymentDetails = false) => {
    const response = await fetch('/api/admin/settings', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, ...(confirmPaymentDetails ? { confirmPaymentDetails: true } : {}) }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error || 'Could not save website settings.');
    setSettings({ ...defaults, ...payload.settings });
  }, []);

  useEffect(() => {
    void refreshSettings().catch((error: unknown) => {
      console.warn('[SiteContext] Website settings are temporarily unavailable:', error);
    });
  }, [refreshSettings]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (key: string) => translations[language][key] || translations.en[key] || key,
    theme,
    toggleTheme,
    settings,
    refreshSettings,
    updateSettings,
  }), [language, theme, settings, refreshSettings, updateSettings]);

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
};

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) throw new Error('useSite must be used within SiteProvider.');
  return context;
}

export function normalizePhoneForTel(phone: string) {
  return phone.replace(/[^\d+]/g, '');
}

export function normalizeWhatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
}
