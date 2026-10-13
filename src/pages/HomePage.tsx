import React, { useEffect, useState } from 'react';
import {
  Wrench,
  ShoppingBag,
  ShieldCheck,
  Clock,
  Award,
  CheckCircle2,
  ChevronRight,
  Star,
  ArrowRight,
  PhoneCall,
  Sparkles,
  Search,
} from 'lucide-react';
import { PageRoute } from '../types';
import { FAQS_LIST, COMPANY_INFO } from '../data/mockData';
import { useCatalog } from '../context/CatalogContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Section } from '../components/ui/Section';
import { PromoBannerCarousel } from '../components/PromoBannerCarousel';
import { ProductImage } from '../components/ProductImage';
import { useSite } from '../context/SiteContext';
import { ReviewSubmissionForm } from '../components/reviews/ReviewSubmissionForm';

interface HomePageProps {
  onNavigate: (page: PageRoute, params?: { serviceId?: string; productId?: string }) => void;
  onOpenBooking: (serviceId?: string) => void;
  onAddToCart: (productId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onOpenBooking,
  onAddToCart
}) => {
  const [selectedHeroAppliance, setSelectedHeroAppliance] = useState('');
  const [approvedReviews, setApprovedReviews] = useState<Array<{
    id: string; rating: number; title: string | null; comment: string; imageUrl: string | null;
    userName: string; serviceName: string | null; isFeatured: boolean;
    user: { name: string } | null; product: { name: string } | null; service: { name: string } | null;
  }>>([]);
  const [reviewAggregate, setReviewAggregate] = useState({ averageRating: 0, count: 0 });
  const { products: catalogProducts, loading: productsLoading, services, servicesLoading, servicesError } = useCatalog();
  const { settings, language, t } = useSite();

  useEffect(() => {
    let mounted = true;
    fetch('/api/reviews', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || 'Could not load approved reviews.');
        if (mounted) setReviewAggregate(payload.aggregate || { averageRating: 0, count: payload.reviews.length });
        return payload.reviews;
      })
      .then((reviews) => { if (mounted) setApprovedReviews(reviews); })
      .catch((error: unknown) => console.warn('[HomePage] Approved customer reviews are unavailable:', error));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!services.some((service) => service.id === selectedHeroAppliance)) {
      setSelectedHeroAppliance(services[0]?.id || '');
    }
  }, [services, selectedHeroAppliance]);

  // Helper icon mapper
  const renderApplianceIcon = (_name: string, className = "w-6 h-6") => <Wrench className={className} />;

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-b from-blue-50/70 via-white to-slate-50 pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden border-b border-slate-200/60">
        {settings.homeBannerUrl && <img src={settings.homeBannerUrl} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10" />}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-800 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Multi-Brand Certified Appliance Experts</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
                {settings.heroTitle || (language === 'en'
                  ? <>Fast, Reliable <span className="text-blue-600">Appliance Repairs</span> &amp; Genuine Spare Parts</>
                  : t('heroTitle'))}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {settings.heroSubtitle || (language === 'en'
                  ? `${COMPANY_INFO.tagline}. Browse our currently published services and book a doorstep visit with transparent pricing.`
                  : t('heroSubtitle'))}
              </p>

              {/* Dual Action CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto shadow-lg shadow-blue-600/25"
                  icon={<Wrench className="w-5 h-5" />}
                  onClick={() => onOpenBooking()}
                  id="hero-book-btn"
                >
                  {t('bookTechnician')}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                  icon={<ShoppingBag className="w-5 h-5 text-blue-600" />}
                  onClick={() => onNavigate('spare-parts')}
                  id="hero-shop-btn"
                >
                  {t('shopParts')}
                </Button>
              </div>

              {/* Quick Trust Highlights */}
              <div className="pt-6 border-t border-slate-200/80 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 text-left">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">{COMPANY_INFO.stats.appliancesRepaired}</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Repairs Done</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-blue-600">{COMPANY_INFO.stats.satisfactionRate}</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Satisfaction</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">{COMPANY_INFO.stats.genuinePartsStock}</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">OEM Parts</div>
                </div>
              </div>
            </div>

            {/* Right Hero Column: Interactive Fast-Booking Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-100 relative">
                <div className="absolute -top-3.5 right-6 bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
                  ⚡ 2-Hour Doorstep Slots
                </div>

                <div className="space-y-1 mb-5">
                  <h3 className="text-lg font-bold text-slate-900">Instant Service Selector</h3>
                  <p className="text-xs text-slate-500">Pick your appliance to check inspection rate & slot</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Select Appliance
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {servicesLoading ? (
                        <p className="col-span-2 py-4 text-center text-xs text-slate-500">Loading services…</p>
                      ) : servicesError ? (
                        <p role="alert" className="col-span-2 py-4 text-center text-xs text-rose-700">{servicesError}</p>
                      ) : services.map((srv) => (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() => setSelectedHeroAppliance(srv.id)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition flex items-center gap-2 ${
                            selectedHeroAppliance === srv.id
                              ? 'border-blue-600 bg-blue-50/80 text-blue-700 ring-2 ring-blue-600/20'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <span className="text-blue-600 shrink-0">
                            {renderApplianceIcon(srv.name, 'w-4 h-4')}
                          </span>
                          <span className="truncate">{srv.shortDescription || srv.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {(() => {
                    const currentSrv = services.find((service) => service.id === selectedHeroAppliance);
                    return (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        {currentSrv ? (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Inspection Fee:</span>
                              <span className="font-bold text-slate-900">₹{Number(currentSrv.inspectionFee)} only</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Estimated Duration:</span>
                              <span className="font-medium text-slate-800">{currentSrv.estimatedDuration}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Warranty:</span>
                              <span className="text-emerald-700 font-bold">{currentSrv.warrantyDays}-Day Workmanship</span>
                            </div>
                          </>
                        ) : (
                          <p className="text-center text-xs text-slate-500">
                            {servicesLoading ? 'Loading service details…' : 'No published services are available right now.'}
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  <Button
                    variant="primary"
                    className="w-full justify-center py-3 text-sm font-bold shadow-blue-500/20"
                    disabled={!selectedHeroAppliance || servicesLoading}
                    onClick={() => onOpenBooking(selectedHeroAppliance || undefined)}
                  >
                    Schedule Technician Visit Now →
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>No advance payment needed • Pay after inspection</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PromoBannerCarousel />
      {settings.offerBannerText && <section aria-label="Current offer" className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <p className="whitespace-pre-wrap rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-center text-base font-bold text-amber-950 shadow-sm">{settings.offerBannerText}</p>
      </section>}

      {/* 2. Published services */}
      <Section
        id="services-overview"
        badge="Doorstep Repairs"
        badgeVariant="blue"
        title="Appliance Services & Repair"
        subtitle="Certified multi-brand technicians equipped with original tools and OEM spare parts for fast doorstep resolution."
        background="white"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {servicesLoading ? (
            <p className="col-span-full py-8 text-center text-sm text-slate-500">Loading published services…</p>
          ) : servicesError ? (
            <p role="alert" className="col-span-full py-8 text-center text-sm text-rose-700">{servicesError}</p>
          ) : services.length === 0 ? (
            <p className="col-span-full py-8 text-center text-sm text-slate-500">No published services are available right now.</p>
          ) : services.map((service) => (
            <Card
              key={service.id}
              hoverEffect
              className="flex flex-col justify-between border-slate-200/80 group cursor-pointer"
              onClick={() => onNavigate('service-detail', { serviceId: service.id })}
            >
              <div>
                <div className="relative h-44 rounded-xl overflow-hidden mb-4 bg-slate-100">
                  {service.category.image ? (
                    <img src={service.category.image} alt={service.category.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-blue-600"><Wrench className="h-10 w-10" /></div>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                {service.shortDescription || service.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {service.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Inspection from</span>
                    <span className="text-base font-extrabold text-blue-600">₹{Number(service.inspectionFee)}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {service.estimatedDuration}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition"
                >
                  View Details & Book
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button
            variant="secondary"
            size="md"
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
            onClick={() => onNavigate('services')}
          >
            Explore Complete Service Directory
          </Button>
        </div>
      </Section>

      {/* 3. WHY CHOOSE US (TRUST BADGES) */}
      <Section
        badge="The Soham Advantage"
        badgeVariant="sky"
        title="Why Homeowners Trust Soham Enterprises"
        subtitle="We deliver quality workmanship with transparent pricing, genuine replacement components, and responsive support."
        background="light"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center p-6 border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-900">30-Day Service Warranty</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Every repair is backed by a 30-day workmanship guarantee. If the issue reoccurs, we fix it at zero extra charge.
            </p>
          </Card>

          <Card className="text-center p-6 border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-4">
              <Award className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-900">100% Genuine Spare Parts</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              We only install authentic OEM or certified grade components with up to 12 months manufacturer warranty.
            </p>
          </Card>

          <Card className="text-center p-6 border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Background-Verified Pros</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Our technicians undergo strict police verification, technical certification, and regular safety training.
            </p>
          </Card>

          <Card className="text-center p-6 border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Transparent Fixed Rates</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              No hidden charges. Complete diagnostic quotation provided before technician starts any repair work.
            </p>
          </Card>
        </div>
      </Section>

      {/* 4. HOW IT WORKS (4-STEP PROCESS) */}
      <Section
        badge="Simple & Stress-Free"
        badgeVariant="blue"
        title="How Doorstep Appliance Repair Works"
        subtitle="Get your malfunctioning appliance restored in 4 effortless steps."
        background="white"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center mb-4">
              01
            </div>
            <h4 className="text-base font-bold text-slate-900">Book Online or Call</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Select your appliance, tell us the symptoms, and choose your preferred morning, afternoon, or evening slot.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center mb-4">
              02
            </div>
            <h4 className="text-base font-bold text-slate-900">Doorstep Inspection</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              A certified technician arrives with testing gear, analyzes the issue, and provides a clear repair estimate.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center mb-4">
              03
            </div>
            <h4 className="text-base font-bold text-slate-900">Quality Repair</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Upon your approval, genuine OEM replacement parts are installed and a thorough operational test is conducted.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center mb-4">
              04
            </div>
            <h4 className="text-base font-bold text-slate-900">Pay & Warranty Handover</h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Pay seamlessly via UPI, Card, or Cash. Receive your official invoice and 30-day service warranty seal.
            </p>
          </div>
        </div>
      </Section>

      {/* 5. FEATURED SPARE PARTS */}
      <Section
        badge="E-Commerce Store"
        badgeVariant="emerald"
        title="Genuine Appliance Spare Parts"
        subtitle="Authentic replacement filters, relays, remotes, pumps, and heating coils delivered straight to your doorstep."
        background="light"
      >
        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-white border border-slate-200/80 animate-pulse" />
            ))}
          </div>
        ) : catalogProducts.length === 0 ? (
          <p className="text-center text-sm text-slate-500 py-8">
            The spare parts catalog is being stocked - check back soon.
          </p>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {catalogProducts.map((part) => (
            <Card
              key={part.id}
              hoverEffect
              className="flex flex-col justify-between border-slate-200/80 group"
            >
              <div>
                <div
                  className="relative h-44 rounded-xl overflow-hidden mb-3 bg-white p-2 cursor-pointer"
                  onClick={() => onNavigate('product-detail', { productId: part.id })}
                >
                  <ProductImage
                    src={part.imageUrl}
                    alt={part.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {part.category}
                  </span>
                  {part.stockStatus === 'IN_STOCK' ? (
                    <span className="absolute bottom-2 right-2 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                      In Stock
                    </span>
                  ) : (
                    <span className="absolute bottom-2 right-2 bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                      Low Stock
                    </span>
                  )}
                </div>

                {part.reviewCount > 0 ? (
                  <div className="flex items-center gap-1 text-amber-500 mb-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-xs font-bold text-slate-800">{part.rating}</span>
                    <span className="text-[10px] text-slate-400">({part.reviewCount})</span>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 mb-1">No reviews yet</p>
                )}

                <h4
                  className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-2 cursor-pointer"
                  onClick={() => onNavigate('product-detail', { productId: part.id })}
                >
                  {part.name}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">SKU: {part.sku}</p>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-lg font-black text-slate-900">₹{part.price}</span>
                  {part.originalPrice > part.price && (
                    <>
                      <span className="text-xs text-slate-400 line-through">₹{part.originalPrice}</span>
                      <span className="text-[10px] font-bold text-emerald-600">
                        {Math.round(((part.originalPrice - part.price) / part.originalPrice) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddToCart(part.id)}
                  className="text-xs"
                >
                  Add to Cart
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigate('product-detail', { productId: part.id })}
                  className="text-xs"
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
        )}

        <div className="text-center mt-10">
          <Button
            variant="primary"
            size="md"
            icon={<ShoppingBag className="w-4 h-4" />}
            onClick={() => onNavigate('spare-parts')}
          >
            Browse Full Spare Parts Catalog
          </Button>
        </div>
      </Section>

      <Section
        badge="Your Feedback Matters"
        badgeVariant="amber"
        title="Tell us how we did"
        subtitle="Share your experience with our team. Reviews are published after moderation."
        background="light"
      >
        <div className="mx-auto max-w-3xl">
          <ReviewSubmissionForm />
        </div>
      </Section>

      {/* 6. TESTIMONIALS & REVIEWS UI */}
      {approvedReviews.length > 0 && <Section
        badge="Customer Feedback"
        badgeVariant="amber"
        title="Customer Reviews & Testimonials"
        subtitle={`${reviewAggregate.averageRating.toFixed(1)} ★ average from ${reviewAggregate.count} approved ${reviewAggregate.count === 1 ? 'review' : 'reviews'}.`}
        background="white"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {approvedReviews.map((review) => (
            <Card key={review.id} className="p-5 border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-slate-300'}`} />
                  ))}
                  <span className="sr-only">{review.rating} out of 5 stars</span>
                </div>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  “{review.comment}”
                </p>
                {review.imageUrl && <img src={review.imageUrl} alt={`Photo shared by ${review.user?.name || review.userName}`} loading="lazy" className="mt-3 h-20 w-20 rounded-lg object-cover" />}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-900">{review.user?.name || review.userName || 'Customer'}</h5>
                  <p className="text-[10px] text-slate-400">{review.title || 'Customer review'}</p>
                </div>
                <Badge variant="blue" size="sm">
                  {review.product?.name || review.service?.name || review.serviceName || 'Customer'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </Section>}

      {/* 7. FAQ PREVIEW */}
      <Section
        badge="Got Questions?"
        badgeVariant="slate"
        title="Frequently Asked Questions"
        subtitle="Answers to common questions regarding booking, spare parts authenticity, and warranty."
        background="light"
      >
        <div className="max-w-3xl mx-auto space-y-3">
          {FAQS_LIST.slice(0, 4).map((faq) => (
            <div key={faq.id} className="p-4 rounded-xl bg-white border border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 mb-1.5">{faq.question}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('faq')}
          >
            View All Frequently Asked Questions →
          </Button>
        </div>
      </Section>

      {/* 8. EMERGENCY SERVICE CTA BANNER */}
      <section className="bg-slate-900 text-white py-16 px-4 border-t border-slate-800">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 bg-blue-600/30 text-blue-400 border border-blue-500/40 text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" /> Fast 2-Hour Emergency Support
          </span>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white max-w-2xl mx-auto">
            Appliance Broke Down Unexpectedly? We're Here to Help.
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Our certified field technicians are on standby across the city. Get doorstep inspection today with a 30-day post-service warranty.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto shadow-lg shadow-blue-500/30"
              icon={<Wrench className="w-5 h-5" />}
              onClick={() => onOpenBooking()}
            >
              Book Service Online Now
            </Button>

            {settings.phone ? <a
              href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-medium text-base transition"
            >
              <PhoneCall className="w-5 h-5 text-sky-400" />
              <span>Call Support</span>
            </a> : <Button variant="outline" size="lg" onClick={() => onNavigate('contact')}>Contact Support</Button>}
          </div>
        </div>
      </section>
    </div>
  );
};
