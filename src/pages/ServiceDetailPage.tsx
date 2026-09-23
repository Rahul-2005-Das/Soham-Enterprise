import React, { useState } from 'react';
import {
  Wrench,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  PhoneCall,
  HelpCircle,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Droplets,
  Wind,
  Refrigerator as FridgeIcon,
  Shirt,
  Flame,
  Tv,
  Zap
} from 'lucide-react';
import { PageRoute } from '../types';
import { SERVICES_LIST, COMPANY_INFO } from '../data/mockData';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Section } from '../components/ui/Section';

interface ServiceDetailPageProps {
  serviceId?: string;
  onNavigate: (page: PageRoute, params?: { serviceId?: string; productId?: string }) => void;
  onOpenBooking: (serviceId?: string) => void;
}

export const ServiceDetailPage: React.FC<ServiceDetailPageProps> = ({
  serviceId,
  onNavigate,
  onOpenBooking
}) => {
  const service =
    SERVICES_LIST.find((s) => s.id === serviceId) || SERVICES_LIST[0];

  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const renderApplianceIcon = (name: string, className = 'w-6 h-6') => {
    switch (name) {
      case 'Droplets':
        return <Droplets className={className} />;
      case 'Wind':
        return <Wind className={className} />;
      case 'Refrigerator':
        return <FridgeIcon className={className} />;
      case 'Shirt':
        return <Shirt className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'Tv':
        return <Tv className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      default:
        return <Wrench className={className} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <button onClick={() => onNavigate('home')} className="hover:text-blue-600">
            Home
          </button>
          <span>/</span>
          <button onClick={() => onNavigate('services')} className="hover:text-blue-600">
            Services
          </button>
          <span>/</span>
          <span className="text-slate-900 font-semibold">{service.shortName}</span>
        </div>
      </div>

      {/* Main Service Hero Card */}
      <div className="bg-slate-900 text-white py-12 sm:py-16 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="sky" size="md">
                  Certified Appliance Repair
                </Badge>
                <Badge variant="emerald" size="md">
                  30-Day Service Guarantee
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white">
                {service.name}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                {service.tagline}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <span>Duration: ~{service.durationMinutes} mins</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{service.warrantyDays}-Day Workmanship Warranty</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Doorstep Same-Day Visit</span>
                </div>
              </div>
            </div>

            {/* Price & Book Card */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-3xl p-6 shadow-2xl text-slate-900 border border-slate-100 space-y-4">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Starting Diagnostic Rate
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-blue-600">₹{service.startingPrice}</span>
                    <span className="text-xs text-slate-500 font-medium">/ inspection visit</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    *Inspection fee adjusted into final bill if repair is carried out.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full justify-center shadow-blue-500/25"
                  icon={<Calendar className="w-5 h-5" />}
                  onClick={() => onOpenBooking(service.id)}
                >
                  Book Technician Slot
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                  <PhoneCall className="w-4 h-4 text-blue-600" />
                  <span>Emergency Helpline: <strong>{COMPANY_INFO.phone}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-10">
            {/* 1. Appliance Overview & Image */}
            <Card className="p-6 sm:p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Service Overview</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {service.description}
              </p>
              <div className="rounded-2xl overflow-hidden h-72 w-full bg-slate-100">
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </Card>

            {/* 2. Problems Covered */}
            <Card className="p-6 sm:p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Common Problems We Fix</h3>
              <p className="text-xs text-slate-500 mb-6">
                Our technicians are equipped with testing gear to troubleshoot and resolve these issues on the spot:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {service.commonProblems.map((prob, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-800 font-medium"
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 text-[10px] font-bold">
                      {idx + 1}
                    </div>
                    <span>{prob}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* 3. Step-by-Step Service Process */}
            <Card className="p-6 sm:p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Our Repair Methodology</h3>
              <p className="text-xs text-slate-500 mb-6">
                Transparent 4-step engineering protocol followed on every customer appointment:
              </p>

              <div className="space-y-4">
                {service.serviceProcess.map((proc) => (
                  <div
                    key={proc.step}
                    className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-white"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                      {proc.step}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{proc.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{proc.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 4. Benefits & Assurance */}
            <Card className="p-6 sm:p-8 bg-blue-50/50 border-blue-100">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Why Book With Us</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {service.benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* 5. Service FAQs */}
            <Card className="p-6 sm:p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h3>
              <div className="space-y-3">
                {service.faqList.map((faq, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 p-4 transition cursor-pointer"
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  >
                    <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          expandedFaq === i ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                    {expandedFaq === i && (
                      <p className="mt-2.5 text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-6">
            {/* Other Services Switcher */}
            <Card className="p-6">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                Other Appliance Services
              </h4>
              <div className="space-y-1.5">
                {SERVICES_LIST.map((srv) => (
                  <button
                    key={srv.id}
                    onClick={() => onNavigate('service-detail', { serviceId: srv.id })}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                      srv.id === service.id
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{srv.shortName}</span>
                    <span className={srv.id === service.id ? 'text-white' : 'text-slate-400'}>
                      ₹{srv.startingPrice}+
                    </span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Sticky Help Card */}
            <Card className="p-6 bg-slate-900 text-white border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold">Need Fast Doorstep Help?</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Call our service dispatch desk to schedule a technician immediately.
                </p>
              </div>
              <p className="text-sm font-bold text-sky-400">{COMPANY_INFO.phone}</p>
              <Button
                variant="primary"
                size="sm"
                className="w-full justify-center"
                onClick={() => onOpenBooking(service.id)}
              >
                Book Online Now
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
