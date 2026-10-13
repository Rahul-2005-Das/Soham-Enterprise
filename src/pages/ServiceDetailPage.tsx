import React from 'react';
import { Calendar, Clock, PhoneCall, ShieldCheck, Wrench } from 'lucide-react';
import { PageRoute } from '../types';
import { COMPANY_INFO } from '../data/mockData';
import { useCatalog } from '../context/CatalogContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface ServiceDetailPageProps {
  serviceId?: string;
  onNavigate: (page: PageRoute, params?: { serviceId?: string; productId?: string }) => void;
  onOpenBooking: (serviceId?: string) => void;
}

export const ServiceDetailPage: React.FC<ServiceDetailPageProps> = ({
  serviceId,
  onNavigate,
  onOpenBooking,
}) => {
  const { services, servicesLoading, servicesError } = useCatalog();
  const service = services.find((item) => item.id === serviceId || item.slug === serviceId);

  if (servicesLoading && !service) {
    return <main className="mx-auto max-w-5xl px-4 py-20 text-center text-sm text-slate-500">Loading service details…</main>;
  }

  if (!service) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Service unavailable</h1>
        <p role={servicesError ? 'alert' : undefined} className="mt-2 text-sm text-slate-600">
          {servicesError || 'This service is no longer published.'}
        </p>
        <Button variant="primary" className="mt-6" onClick={() => onNavigate('services')}>Browse published services</Button>
      </main>
    );
  }

  const displayName = service.shortDescription || service.name;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <button onClick={() => onNavigate('home')} className="hover:text-blue-600">Home</button>
          <span>/</span>
          <button onClick={() => onNavigate('services')} className="hover:text-blue-600">Services</button>
          <span>/</span>
          <span className="font-semibold text-slate-900">{displayName}</span>
        </div>
      </div>

      <header className="bg-slate-900 px-4 py-12 text-white sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-12 lg:items-center">
          <div className="space-y-4 lg:col-span-8">
            <Badge variant="sky" size="md">{service.category.name}</Badge>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{service.name}</h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-300">{service.description}</p>
            <div className="flex flex-wrap gap-5 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-sky-400" />{service.estimatedDuration}</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-400" />{service.warrantyDays}-day warranty</span>
              {service.brandApplicability && <span>{service.brandApplicability}</span>}
            </div>
          </div>

          <Card className="space-y-4 border-slate-100 p-6 text-slate-900 lg:col-span-4">
            <div className="border-b border-slate-100 pb-4">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Inspection fee</span>
              <span className="mt-1 text-3xl font-black text-blue-600">₹{Number(service.inspectionFee)}</span>
            </div>
            <Button variant="primary" size="lg" className="w-full" icon={<Calendar className="h-5 w-5" />} onClick={() => onOpenBooking(service.id)}>
              Book technician visit
            </Button>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
              <PhoneCall className="h-4 w-4 text-blue-600" />
              <span>{COMPANY_INFO.phone}</span>
            </div>
          </Card>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-12">
        <Card className="p-6 sm:p-8 lg:col-span-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Wrench className="h-5 w-5" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{service.category.name}</p>
              <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
            </div>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{service.description}</p>
          {service.category.image && (
            <img src={service.category.image} alt={service.category.name} className="mt-6 max-h-80 w-full rounded-2xl object-cover" />
          )}
        </Card>

        <Card className="p-6 lg:col-span-4">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900">Other published services</h2>
          <div className="space-y-1.5">
            {services.filter((item) => item.id !== service.id).map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate('service-detail', { serviceId: item.id })}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
              >
                <span>{item.shortDescription || item.name}</span>
                <span className="shrink-0 pl-2 text-slate-400">₹{Number(item.inspectionFee)}+</span>
              </button>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
};
