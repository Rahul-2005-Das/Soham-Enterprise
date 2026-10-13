import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api, ApiError } from '../lib/api';

interface PromoBanner {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  buttonText?: string | null;
}

export const PromoBannerCarousel: React.FC = () => {
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadBanners = async () => {
      try {
        const data = await api.get<{ success: boolean; banners: PromoBanner[] }>('/api/banners', { cache: 'no-store' });
        if (active) {
          setBanners(data.banners);
          setLoadError(null);
        }
      } catch (error) {
        console.error('[PromoBannerCarousel] Could not load banners:', error);
        if (active) setLoadError(error instanceof ApiError ? error.message : 'Promotions could not be loaded.');
      }
    };
    void loadBanners();
    const timer = window.setInterval(() => void loadBanners(), 15_000);
    window.addEventListener('focus', loadBanners);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', loadBanners);
    };
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % banners.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) {
    return loadError ? <p role="alert" className="mx-auto max-w-7xl px-4 py-3 text-xs text-rose-700 sm:px-6 lg:px-8">{loadError}</p> : null;
  }
  const banner = banners[activeIndex % banners.length];

  return (
    <section aria-label="Store promotions" className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="relative isolate flex min-h-48 overflow-hidden rounded-lg bg-slate-900 sm:min-h-56">
        <img src={banner.imageUrl} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/80 via-slate-950/45 to-transparent" />
        <div className="flex max-w-2xl flex-col justify-center px-6 py-7 text-white sm:px-10">
          <h2 className="text-xl font-bold sm:text-2xl">{banner.title}</h2>
          {banner.subtitle && <p className="mt-2 max-w-lg text-sm text-white/90">{banner.subtitle}</p>}
          {banner.linkUrl && banner.buttonText && <a href={banner.linkUrl} className="mt-4 inline-flex w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">{banner.buttonText}</a>}
        </div>
        {banners.length > 1 && <>
          <button type="button" aria-label="Previous promotion" onClick={() => setActiveIndex((index) => (index + banners.length - 1) % banners.length)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 hover:bg-white"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" aria-label="Next promotion" onClick={() => setActiveIndex((index) => (index + 1) % banners.length)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-900 hover:bg-white"><ChevronRight className="h-4 w-4" /></button>
          <div className="absolute bottom-3 right-4 flex gap-1.5">{banners.map((item, index) => <button key={item.id} type="button" aria-label={`Show promotion ${index + 1}`} onClick={() => setActiveIndex(index)} className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`} />)}</div>
        </>}
        <span className="absolute bottom-2 left-4 text-[9px] text-white/75">Image © respective owners</span>
      </div>
    </section>
  );
};