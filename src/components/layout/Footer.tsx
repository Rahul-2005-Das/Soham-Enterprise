import React from 'react';
import { Wrench, Phone, Mail, MapPin, ShieldCheck, Clock, Award, CheckCircle2 } from 'lucide-react';
import { PageRoute } from '../../types';
import { COMPANY_INFO } from '../../data/mockData';
import { useCatalog } from '../../context/CatalogContext';
import { normalizePhoneForTel, normalizeWhatsappNumber, useSite } from '../../context/SiteContext';

interface FooterProps {
  onNavigate: (page: PageRoute, params?: { serviceId?: string; productId?: string }) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { services } = useCatalog();
  const { settings } = useSite();
  const whatsapp = normalizeWhatsappNumber(settings.whatsappNumber);
  const handleNav = (page: PageRoute, params?: { serviceId?: string; productId?: string }) => {
    onNavigate(page, params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      {/* Top Value Indicators */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-slate-800/80">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-sm font-bold">30-Day Service Warranty</h4>
              <p className="text-xs text-slate-400 mt-0.5">{settings.serviceTerms}</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-sky-600/20 text-sky-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-sm font-bold">100% Genuine Spare Parts</h4>
              <p className="text-xs text-slate-400 mt-0.5">Direct OEM certified replacement stock.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-sm font-bold">Verified Technicians</h4>
              <p className="text-xs text-slate-400 mt-0.5">Background-checked field repair pros.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-sm font-bold">Doorstep Same-Day Visit</h4>
              <p className="text-xs text-slate-400 mt-0.5">Prompt appointment slots in your pincode.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNav('home')}>
              {settings.logoUrl
                ? <img src={settings.logoUrl} alt="Soham Enterprises" className="h-10 w-10 rounded-xl object-contain" />
                : <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md"><Wrench className="w-5 h-5" /></div>}
              <span className="text-2xl font-black text-white tracking-tight">
                {settings.storeName}
              </span>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              {settings.aboutUs || `${COMPANY_INFO.tagline}. Leading service, maintenance, and genuine spare parts platform for all major home appliance brands.`}
            </p>

            <div className="pt-2 text-xs text-slate-400 space-y-2">
              {settings.phone && <a href={`tel:${normalizePhoneForTel(settings.phone)}`} className="flex items-center gap-2 hover:text-white">
                <Phone className="w-4 h-4 text-blue-400" />
                <span>{settings.phone}</span>
              </a>}
              {whatsapp && <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hello Soham Enterprises')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>{settings.whatsappNumber}</span>
              </a>}
              {settings.supportEmail && <a href={`mailto:${settings.supportEmail}`} className="flex items-center gap-2 hover:text-white">
                <Mail className="w-4 h-4 text-sky-400" />
                <span>{settings.supportEmail}</span>
              </a>}
              {settings.shopAddress && <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{settings.shopAddress}</span>
              </div>}
              {(settings.facebookUrl || settings.instagramUrl || settings.youtubeUrl) && (
                <div className="flex flex-wrap gap-3 pt-1">
                  {settings.facebookUrl && <a href={settings.facebookUrl} target="_blank" rel="noreferrer" className="font-semibold hover:text-white">Facebook</a>}
                  {settings.instagramUrl && <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="font-semibold hover:text-white">Instagram</a>}
                  {settings.youtubeUrl && <a href={settings.youtubeUrl} target="_blank" rel="noreferrer" className="font-semibold hover:text-white">YouTube</a>}
                </div>
              )}
            </div>
          </div>

          {/* Services Column */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              Our Services
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              {services.slice(0, 6).map((srv) => (
                <li key={srv.id}>
                  <button
                    onClick={() => handleNav('service-detail', { serviceId: srv.id })}
                    className="hover:text-white transition text-left"
                  >
                    {srv.shortDescription || srv.name}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => handleNav('services')}
                  className="text-blue-400 font-semibold hover:underline"
                >
                  View All Services →
                </button>
              </li>
            </ul>
          </div>

          {/* Spare Parts Shop */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              Spare Parts
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button onClick={() => handleNav('spare-parts')} className="hover:text-white transition">
                  Water Purifier RO Filters
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('spare-parts')} className="hover:text-white transition">
                  AC Capacitors & Remotes
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('spare-parts')} className="hover:text-white transition">
                  Refrigerator PTC Relays
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('spare-parts')} className="hover:text-white transition">
                  Washing Machine Drain Pumps
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('spare-parts')} className="hover:text-white transition">
                  Microwave Magnetrons
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('spare-parts')} className="hover:text-white transition">
                  Geyser Heavy Elements
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links & Legal */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <button onClick={() => handleNav('about')} className="hover:text-white transition">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('faq')} className="hover:text-white transition">
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('contact')} className="hover:text-white transition">
                  Contact & Support
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('login')} className="hover:text-white transition">
                  Customer Login
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('register')} className="hover:text-white transition">
                  Create New Account
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('admin-login')} className="text-slate-500 hover:text-blue-300 transition">
                  Admin Portal
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} {settings.storeName}. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <span className="hover:text-slate-400 transition cursor-pointer">Privacy Policy</span>
          <span>•</span>
          <span className="hover:text-slate-400 transition cursor-pointer">Terms & Conditions</span>
          <span>•</span>
          <span className="hover:text-slate-400 transition cursor-pointer">Warranty Policy</span>
        </div>
      </div>
    </footer>
  );
};
