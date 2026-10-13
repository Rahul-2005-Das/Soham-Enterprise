import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useSite, Language, normalizePhoneForTel, normalizeWhatsappNumber } from '../../context/SiteContext';

export const SiteControls: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language, setLanguage, theme, toggleTheme, t } = useSite();
  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor={compact ? 'language-selector-compact' : 'language-selector'}>{t('language')}</label>
      <select
        id={compact ? 'language-selector-compact' : 'language-selector'}
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
        className="min-h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-800"
      >
        <option value="en">English</option>
        <option value="bn">বাংলা</option>
        <option value="hi">हिंदी</option>
      </select>
      <button
        type="button"
        onClick={toggleTheme}
        className="inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-2 text-slate-800"
        aria-label={theme === 'dark' ? t('lightMode') : t('darkMode')}
        title={theme === 'dark' ? t('lightMode') : t('darkMode')}
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        {compact && <span className="hidden xl:inline">{theme === 'dark' ? t('lightMode') : t('darkMode')}</span>}
      </button>
    </div>
  );
};

export const SupportActions: React.FC = () => {
  const { settings, t } = useSite();
  const phone = normalizePhoneForTel(settings.phone);
  const whatsapp = normalizeWhatsappNumber(settings.whatsappNumber);
  const whatsappMessage = encodeURIComponent('Hello Soham Enterprises');
  return (
    <nav aria-label="Customer support" className="fixed inset-x-3 bottom-3 z-40 flex gap-2 sm:inset-x-auto sm:right-4 sm:flex-col">
      {phone
        ? <a href={`tel:${phone}`} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-blue-700 px-3 text-sm font-extrabold text-white shadow-xl ring-2 ring-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:min-h-14 sm:flex-none sm:px-5 sm:text-base"><span aria-hidden="true">☎</span><span>{t('callSupport')}</span></a>
        : <button disabled title="Phone support is currently unavailable." className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-slate-500 px-3 text-sm font-extrabold text-white shadow-xl ring-2 ring-white disabled:cursor-not-allowed sm:min-h-14 sm:flex-none sm:px-5 sm:text-base"><span aria-hidden="true">☎</span><span>{t('callSupport')}</span></button>}
      {whatsapp
        ? <a href={`https://wa.me/${whatsapp}?text=${whatsappMessage}`} target="_blank" rel="noreferrer" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-emerald-700 px-3 text-sm font-extrabold text-white shadow-xl ring-2 ring-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:min-h-14 sm:flex-none sm:px-5 sm:text-base"><span aria-hidden="true">✆</span><span>{t('whatsappHelp')}</span></a>
        : <button disabled title="WhatsApp support is currently unavailable." className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-slate-500 px-3 text-sm font-extrabold text-white shadow-xl ring-2 ring-white disabled:cursor-not-allowed sm:min-h-14 sm:flex-none sm:px-5 sm:text-base"><span aria-hidden="true">✆</span><span>{t('whatsappHelp')}</span></button>}
    </nav>
  );
};
