import React from 'react';
import { Wrench, ShieldCheck, Award, Users, CheckCircle2, Phone, Target, HeartHandshake } from 'lucide-react';
import { PageRoute } from '../types';
import { COMPANY_INFO } from '../data/mockData';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Section } from '../components/ui/Section';
import { useSite } from '../context/SiteContext';

interface AboutPageProps {
  onNavigate: (page: PageRoute) => void;
  onOpenBooking: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate, onOpenBooking }) => {
  const { settings } = useSite();
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white py-16 sm:py-20 px-4 border-b border-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 border border-blue-800/60 px-3 py-1 rounded-full">
            Our Journey & Commitment
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
            About {settings.storeName}
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {COMPANY_INFO.tagline}. Dedicated to restoring comfort and safety to homes through expert appliance care and certified spare parts.
          </p>
        </div>
      </div>

      {/* Story & Mission Section */}
      <Section background="white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Who We Are
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              Reliable Appliance Care Built on Integrity & Expertise
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {settings.aboutUs || `Founded with the singular purpose of eliminating the frustration of unreliable appliance repairs, ${settings.storeName} has grown into a trusted partner for residential homeowners and commercial establishments.`}
            </p>
            {!settings.aboutUs && <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              From sophisticated reverse osmosis water purifiers and inverter split air conditioners to complex micro-controller washing machines, we combine cutting-edge testing instruments with authentic OEM replacement parts to ensure lasting repairs.
            </p>}

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-2xl font-black text-blue-600">{COMPANY_INFO.stats.appliancesRepaired}</div>
                <div className="text-xs text-slate-500 font-medium mt-1">Appliances Restored</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-2xl font-black text-slate-900">{COMPANY_INFO.stats.verifiedTechnicians}</div>
                <div className="text-xs text-slate-500 font-medium mt-1">Certified Technicians</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
              <img
                src="https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1000&q=80"
                alt="Soham Enterprises Certified Technician Diagnostics"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-6">
                <div className="text-white space-y-1">
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Field Standards</p>
                  <h4 className="text-lg font-bold">100% Background-Verified & Insured Field Specialists</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Core Values */}
      <Section
        background="light"
        badge="Our Core Principles"
        title="What Sets Soham Enterprises Apart"
        subtitle="Our operational values guide every doorstep repair, diagnostic scan, and spare part delivery."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <Target className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">100% Transparent Diagnostic Pricing</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              We never perform surprise repair work. Our technicians provide a transparent breakdown of labor, replacement parts, and tax before turning a single screw.
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Guaranteed OEM Spare Parts</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Substandard counterfeit parts cause repeated failures and safety hazards. We source and stock genuine OEM components with manufacturer warranty seals.
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">30-Day Post-Service Guarantee</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              We stand firmly behind our workmanship. If the same issue recurs within 30 days of completion, our team returns to resolve it at zero service fee.
            </p>
          </Card>
        </div>
      </Section>

      {/* Quality & Safety Protocols */}
      <Section background="white">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Field Safety Guidelines
            </span>
            <h3 className="text-2xl font-black text-slate-900">Safety & Quality Protocols</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-bold text-slate-900">Electrical Grounding & Earthing Verification</h5>
                <p className="text-xs text-slate-600 mt-1">Every appliance service includes checking earthing continuity to prevent electrical shocks.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-bold text-slate-900">Digital TDS Calibration for Water Purifiers</h5>
                <p className="text-xs text-slate-600 mt-1">We measure pre-service and post-service TDS in front of the customer to verify drinking water purity.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-bold text-slate-900">No-Spill Foam Jet AC Wash Bags</h5>
                <p className="text-xs text-slate-600 mt-1">Indoor AC deep cleaning utilizes specialized catchment kits to safeguard walls, furniture, and flooring.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-bold text-slate-900">Digital Invoicing & Online Tracking</h5>
                <p className="text-xs text-slate-600 mt-1">Automated receipts with warranty details sent directly to your phone and email.</p>
              </div>
            </div>
          </div>

          <div className="text-center pt-6">
            <Button
              variant="primary"
              size="lg"
              onClick={onOpenBooking}
              icon={<Wrench className="w-5 h-5" />}
            >
              Book an Inspection with Our Certified Team
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
};
