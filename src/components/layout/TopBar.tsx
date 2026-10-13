import React from 'react';
import { Phone, Clock, AlertCircle, Mail, MapPin, MessageCircle } from 'lucide-react';
import { normalizePhoneForTel, normalizeWhatsappNumber, useSite } from '../../context/SiteContext';

export const TopBar: React.FC = () => {
  const { settings } = useSite();
  const phone = settings.phone.trim();
  const emergencyPhone = settings.emergencyPhone.trim() || phone;
  const whatsapp = normalizeWhatsappNumber(settings.whatsappNumber);
  const hours = settings.businessHours.trim();
  const emergencyBannerText = settings.emergencyBannerText.trim();
  return (
    <>
      {settings.announcementText.trim() && <div className="bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white">{settings.announcementText}</div>}
      <div className="border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
            {phone && <a href={`tel:${normalizePhoneForTel(phone)}`} className="flex items-center gap-1.5 text-slate-200 hover:text-white">
              <Phone className="h-3.5 w-3.5 text-blue-400" />
              <span>Support:</span>
              <strong className="font-semibold text-white">{phone}</strong>
            </a>}
            {hours && <span className="hidden items-center gap-1.5 text-slate-400 md:flex">
              <Clock className="h-3.5 w-3.5 text-sky-400" />
              <span>{hours}</span>
            </span>}
            {whatsapp && <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hello Soham Enterprises')}`} target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 text-slate-300 hover:text-white md:flex">
              <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>{settings.whatsappNumber}</span>
            </a>}
            {settings.supportEmail.trim() && <a href={`mailto:${settings.supportEmail.trim()}`} className="hidden items-center gap-1.5 text-slate-300 hover:text-white lg:flex">
              <Mail className="h-3.5 w-3.5 text-sky-400" />
              <span>{settings.supportEmail}</span>
            </a>}
            {settings.shopAddress.trim() && <span title={settings.shopAddress} className="hidden max-w-64 items-center gap-1.5 truncate text-slate-400 xl:flex">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span className="truncate">{settings.shopAddress}</span>
            </span>}
          </div>
          {emergencyBannerText && <div className="flex flex-wrap items-center justify-center gap-2 text-sky-300">
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-800/50 bg-sky-950/80 px-2 py-0.5">
              <AlertCircle className="h-3 w-3 text-sky-400" />
              <span>{emergencyBannerText}</span>
            </span>
            {emergencyPhone && <a href={`tel:${normalizePhoneForTel(emergencyPhone)}`} className="font-bold text-white underline underline-offset-2">Emergency: {emergencyPhone}</a>}
          </div>}
        </div>
      </div>
    </>
  );
};
