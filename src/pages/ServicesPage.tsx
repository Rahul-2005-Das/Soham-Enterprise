import React, { useState } from 'react';
import {
  Wrench,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Droplets,
  Wind,
  Refrigerator as FridgeIcon,
  Shirt,
  Flame,
  Tv,
  Zap,
  Check
} from 'lucide-react';
import { PageRoute } from '../types';
import { SERVICES_LIST } from '../data/mockData';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Section } from '../components/ui/Section';

interface ServicesPageProps {
  onNavigate: (page: PageRoute, params?: { serviceId?: string; productId?: string }) => void;
  onOpenBooking: (serviceId?: string) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({
  onNavigate,
  onOpenBooking
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');

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

  const filteredServices =
    filterCategory === 'all'
      ? SERVICES_LIST
      : SERVICES_LIST.filter((s) => s.id === filterCategory);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Services Header */}
      <div className="bg-slate-900 text-white py-14 sm:py-20 px-4 border-b border-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 border border-blue-800/60 px-3 py-1 rounded-full">
            All Appliance Services
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
            Doorstep Appliance Repair & Maintenance
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Select your appliance to view issues covered, service methodology, and transparent inspection fees.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                filterCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Appliances (8)
            </button>
            {SERVICES_LIST.map((srv) => (
              <button
                key={srv.id}
                onClick={() => setFilterCategory(srv.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  filterCategory === srv.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {renderApplianceIcon(srv.iconName, 'w-3.5 h-3.5')}
                <span>{srv.shortName}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services List Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {filteredServices.map((service) => (
            <Card
              key={service.id}
              className="p-6 sm:p-8 border-slate-200 bg-white hover:border-blue-300 transition-all duration-200"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Image & Quick Price Info */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="relative h-56 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm p-2 rounded-xl shadow-md text-blue-600">
                      {renderApplianceIcon(service.iconName, 'w-6 h-6')}
                    </div>
                    {service.popular && (
                      <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                        Most Booked
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Inspection Fee:</span>
                      <span className="text-base font-extrabold text-blue-600">₹{service.startingPrice}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Avg Duration:</span>
                      <span className="font-semibold text-slate-800">{service.durationMinutes} Minutes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Warranty:</span>
                      <span className="text-emerald-700 font-bold">{service.warrantyDays}-Day Workmanship</span>
                    </div>
                  </div>
                </div>

                {/* Details & Problems Covered */}
                <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="blue" size="sm">
                        Certified Technicians
                      </Badge>
                      <Badge variant="emerald" size="sm">
                        Genuine Spare Parts Stocked
                      </Badge>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                      {service.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Common Problems Checklist */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                      Common Symptoms & Issues Repaired:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {service.commonProblems.map((problem) => (
                        <div
                          key={problem}
                          className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60"
                        >
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <span>{problem}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full sm:w-auto shadow-blue-500/20"
                      icon={<Wrench className="w-4 h-4" />}
                      onClick={() => onOpenBooking(service.id)}
                    >
                      Book Doorstep Visit (₹{service.startingPrice})
                    </Button>

                    <Button
                      variant="outline"
                      size="md"
                      className="w-full sm:w-auto"
                      icon={<ArrowRight className="w-4 h-4" />}
                      iconPosition="right"
                      onClick={() => onNavigate('service-detail', { serviceId: service.id })}
                    >
                      Read Full Service Details
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
