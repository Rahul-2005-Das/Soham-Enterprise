import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import {
  Activity, BadgePercent, Boxes, Building2, CalendarDays, Check, ChevronDown, CircleDollarSign, Download,
  ImagePlus, LayoutDashboard, LogOut, Mail, MapPin, MessageCircle, Package, Plus, RefreshCw, Search, Shield,
  ShoppingCart, Tags, Trash2, Truck, Users, Wrench, X, Star, Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { PageRoute } from '../types';
import { ProductImage } from '../components/ProductImage';
import { SiteControls, SupportActions } from '../components/layout/SiteControls';
import { useSite } from '../context/SiteContext';
import { AdminContactInquiriesPage, AdminPaymentManagementPage, AdminReviewsPage, AdminSettingsPage } from './AdminManagementPages';

interface AdminDashboardPageProps {
  onNavigate: (page: PageRoute) => void;
}

type Section = 'overview' | 'services' | 'products' | 'categories' | 'brands' | 'coupons' | 'banners' | 'orders' | 'payments' | 'bookings' | 'inquiries' | 'customers' | 'reviews' | 'settings' | 'storage';
const sectionPaths: Record<Section, string> = {
  overview: '/admin',
  services: '/admin/services',
  products: '/admin/products',
  categories: '/admin/categories',
  brands: '/admin/brands',
  coupons: '/admin/offers',
  banners: '/admin/banners',
  orders: '/admin/orders',
  payments: '/admin/payments',
  bookings: '/admin/service-bookings',
  inquiries: '/admin/inquiries',
  customers: '/admin/customers',
  reviews: '/admin/reviews',
  settings: '/admin/settings',
  storage: '/admin/storage',
};
const sectionForPath = (path: string): Section =>
  (Object.entries(sectionPaths).find(([, sectionPath]) => sectionPath === path)?.[0] as Section | undefined) || 'overview';
type ProductForm = {
  name: string; sku: string; description: string; brand: string; categoryId: string;
  price: string; salePrice: string; shippingCharge: string; stockQuantity: string; lowStockThreshold: string;
  active: boolean; tags: string; specificationText: string; compatibility: string; imageUrls: string[]; imageUrl: string;
};
type ServiceForm = {
  name: string; categoryId: string; brandApplicability: string; description: string;
  shortDescription: string; inspectionFee: string; estimatedDuration: string;
  warrantyDays: string; active: boolean;
};
type CouponForm = {
  code: string; description: string; discountType: 'PERCENTAGE' | 'FLAT'; discountValue: string;
  minimumOrderAmount: string; maximumDiscount: string; usageLimit: string;
  startsAt: string; expiresAt: string; active: boolean;
};
type ServiceCategoryForm = {
  name: string;
  description: string;
  image: string;
  sortOrder: string;
  active: boolean;
};
type BannerForm = {
  title: string; subtitle: string; imageUrl: string; linkUrl: string;
  buttonText: string; sortOrder: string; active: boolean;
};

interface NavItem {
  id: Section;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    group: 'Dashboard',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    group: 'Operations',
    items: [
      { id: 'orders', label: 'Orders', icon: ShoppingCart },
      { id: 'payments', label: 'Payment management', icon: CircleDollarSign },
      { id: 'bookings', label: 'Service bookings', icon: CalendarDays },
      { id: 'inquiries', label: 'Customer inquiries', icon: Mail },
      { id: 'customers', label: 'Customers', icon: Users },
    ],
  },
  {
    group: 'Catalog & Inventory',
    items: [
      { id: 'products', label: 'Products', icon: Package },
      { id: 'services', label: 'Services', icon: Wrench },
      { id: 'categories', label: 'Categories', icon: Boxes },
      { id: 'brands', label: 'Brands', icon: Building2 },
    ],
  },
  {
    group: 'Marketing',
    items: [
      { id: 'coupons', label: 'Offers & coupons', icon: BadgePercent },
      { id: 'banners', label: 'Store banners', icon: ImagePlus },
      { id: 'reviews', label: 'Reviews', icon: Star },
    ],
  },
  {
    group: 'System',
    items: [
      { id: 'settings', label: 'Website settings', icon: Settings },
      { id: 'storage', label: 'Clear storage', icon: Trash2 },
    ],
  },
];

const navItems: NavItem[] = navGroups.flatMap((group) => group.items);

const emptyProduct: ProductForm = {
  name: '', sku: '', description: '', brand: 'Other', categoryId: '', price: '', salePrice: '',
  shippingCharge: '',
  stockQuantity: '0', lowStockThreshold: '5', active: true, tags: '', specificationText: '', compatibility: '', imageUrls: [], imageUrl: '',
};
const emptyService: ServiceForm = {
  name: '', categoryId: '', brandApplicability: 'All Brands', description: '', shortDescription: '',
  inspectionFee: '0', estimatedDuration: '1 hour', warrantyDays: '30', active: true,
};
const emptyCoupon: CouponForm = {
  code: '', description: '', discountType: 'PERCENTAGE', discountValue: '', minimumOrderAmount: '0',
  maximumDiscount: '', usageLimit: '', startsAt: new Date().toISOString().slice(0, 16),
  expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16), active: true,
};
const emptyServiceCategory: ServiceCategoryForm = {
  name: '', description: '', image: '', sortOrder: '0', active: true,
};
const emptyBanner: BannerForm = {
  title: '', subtitle: '', imageUrl: '', linkUrl: '', buttonText: '', sortOrder: '0', active: true,
};

async function adminRequest(path: string, method = 'GET', body?: unknown) {
  const response = await fetch(path, {
    method,
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (response.status === 401 || response.status === 403) {
    window.location.assign('/admin/login');
    throw new Error('Administrator session required.');
  }
  if (!response.ok || data.success === false) throw new Error(data.error || 'The request could not be completed.');
  return data;
}

function money(value: number | string | null | undefined) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function InputField({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="grid gap-1.5 text-xs font-semibold text-slate-700">{label}<input {...props} className={`min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ${props.className || ''}`} /></label>;
}

function TextAreaField({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <label className="grid gap-1.5 text-xs font-semibold text-slate-700">{label}<textarea {...props} className={`min-h-24 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ${props.className || ''}`} /></label>;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const { t } = useSite();
  const { refresh: refreshCatalog, refreshServices } = useCatalog();
  const [section, setSection] = useState<Section>(() => sectionForPath(window.location.pathname));
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [serviceEditor, setServiceEditor] = useState<{ id?: string; form: ServiceForm } | null>(null);
  const [productEditor, setProductEditor] = useState<{ id?: string; form: ProductForm } | null>(null);
  const [categoryEditor, setCategoryEditor] = useState<{ id?: string; name: string; description: string; parentId: string; active: boolean } | null>(null);
  const [serviceCategoryEditor, setServiceCategoryEditor] = useState<{ id?: string; form: ServiceCategoryForm } | null>(null);
  const [brandEditor, setBrandEditor] = useState<{ id?: string; name: string; active: boolean } | null>(null);
  const [couponEditor, setCouponEditor] = useState<{ id?: string; form: CouponForm } | null>(null);
  const [bannerEditor, setBannerEditor] = useState<{ id?: string; form: BannerForm } | null>(null);
  const [newBrand, setNewBrand] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [notice, setNotice] = useState<string | null>(null);
  const [liveBookingAlert, setLiveBookingAlert] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);

  useEffect(() => {
    let live = true;
    setBusy(true);
    setError(null);
    const requests: Record<Section, string> = {
      overview: '/api/admin/overview', services: `/api/admin/services?search=${encodeURIComponent(search)}`, products: `/api/admin/products?search=${encodeURIComponent(search)}`,
      categories: '/api/admin/categories', brands: '/api/admin/brands', coupons: '/api/admin/coupons',
      banners: '/api/admin/banners',
      orders: `/api/admin/orders?status=${orderFilter}&search=${encodeURIComponent(search)}`,
      payments: '/api/admin/orders?status=ALL',
      bookings: `/api/admin/service-bookings?status=${orderFilter}&search=${encodeURIComponent(search)}`,
      inquiries: '/api/admin/contact-inquiries',
      customers: `/api/admin/customers?search=${encodeURIComponent(search)}`,
      reviews: '/api/admin/reviews',
      settings: '/api/site-settings',
      storage: '/api/admin/overview',
    };
    const loadSection = async () => {
      if (section === 'overview' || section === 'storage') {
        return adminRequest(requests.overview);
      }
      if (section === 'reviews' || section === 'settings') {
        return adminRequest(requests[section]);
      }
      if (section === 'products') {
        const [items, categories, brands] = await Promise.all([
          adminRequest(requests.products),
          adminRequest('/api/admin/categories'),
          adminRequest('/api/admin/brands'),
        ]);
        return { ...items, categories: categories.categories, brands: brands.brands };
      }
      if (section === 'services') {
        const [items, categories] = await Promise.all([
          adminRequest(requests.services),
          adminRequest('/api/admin/service-categories'),
        ]);
        return { ...items, serviceCategories: categories.categories };
      }
      if (section === 'categories') {
        const [categories, serviceCategories] = await Promise.all([
          adminRequest(requests.categories),
          adminRequest('/api/admin/service-categories'),
        ]);
        return { ...categories, serviceCategories: serviceCategories.categories };
      }
      return adminRequest(requests[section]);
    };
    loadSection().then((result) => {
      if (live) setData(result);
    }).catch((requestError) => {
      if (live) setError(requestError.message || 'Could not load admin data.');
    }).finally(() => {
      if (live) setBusy(false);
    });
    return () => { live = false; };
  }, [section, refreshKey, search, orderFilter]);

  useEffect(() => {
    const eventSource = new EventSource('/api/admin/sse');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (['NEW_ORDER', 'NEW_BOOKING', 'LOCATION_UPDATE'].includes(data.type)) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
          }
          
          setLiveBookingAlert(data.type === 'NEW_BOOKING');
          setNotice(data.type === 'NEW_BOOKING'
            ? 'New customer service booking received.'
            : 'Live Update: ' + data.type.replaceAll('_', ' ') + ' detected!');
          setTimeout(() => {
            setNotice(null);
            setLiveBookingAlert(false);
          }, 5000);
          
          setRefreshKey(k => k + 1);
        }
      } catch (eventError) {
        console.error('[AdminDashboard] Could not process live update:', eventError);
      }
    };
    return () => eventSource.close();
  }, []);

  useEffect(() => {
    const syncSectionFromPath = () => {
      setSection(sectionForPath(window.location.pathname));
      setSearch('');
    };
    window.addEventListener('popstate', syncSectionFromPath);
    return () => window.removeEventListener('popstate', syncSectionFromPath);
  }, []);

  const reload = () => setRefreshKey((value) => value + 1);
  const flash = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(null), 3000); };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
    if (file.size > 5 * 1024 * 1024) throw new Error('Images must be 5 MB or smaller.');
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read image.'));
      reader.onerror = () => reject(new Error('Could not read image.'));
      reader.readAsDataURL(file);
    });
    const uploaded = await adminRequest('/api/admin/images', 'POST', { dataUrl, fileName: file.name });
    return uploaded.url as string;
  };

  const handleImageFile = async (file: File, onUploaded: (url: string) => void) => {
    setBusy(true);
    try { onUploaded(await uploadImage(file)); flash('Image uploaded.'); }
    catch (uploadError: any) { setError(uploadError.message || 'Image upload failed.'); }
    finally { setBusy(false); }
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>, onUploaded: (url: string) => void) => {
    const file = event.target.files?.[0];
    if (file) await handleImageFile(file, onUploaded);
    event.target.value = '';
  };

  const saveService = async (event: FormEvent) => {
    event.preventDefault();
    if (!serviceEditor) return;
    const form = serviceEditor.form;
    const payload = {
      name: form.name.trim(), categoryId: form.categoryId, brandApplicability: form.brandApplicability.trim() || 'All Brands',
      description: form.description.trim() || form.name.trim(), shortDescription: form.shortDescription.trim() || form.name.trim(),
      inspectionFee: Number(form.inspectionFee) || 0, estimatedDuration: form.estimatedDuration.trim() || '1 hour',
      warrantyDays: Number(form.warrantyDays) || 30, active: form.active,
    };
    setBusy(true);
    try {
      await adminRequest(serviceEditor.id ? `/api/admin/services/${serviceEditor.id}` : '/api/admin/services', serviceEditor.id ? 'PUT' : 'POST', payload);
      await refreshServices(); setServiceEditor(null); reload(); flash('Service saved.');
    } catch (saveError: any) { setError(saveError.message || 'Could not save service.'); }
    finally { setBusy(false); }
  };

  const saveServiceCategory = async (event: FormEvent) => {
    event.preventDefault();
    if (!serviceCategoryEditor) return;
    const form = serviceCategoryEditor.form;
    const payload = {
      ...form,
      image: form.image || null,
      sortOrder: Number(form.sortOrder),
    };
    setBusy(true);
    try {
      await adminRequest(
        serviceCategoryEditor.id ? `/api/admin/service-categories/${serviceCategoryEditor.id}` : '/api/admin/service-categories',
        serviceCategoryEditor.id ? 'PUT' : 'POST',
        payload,
      );
      await refreshServices();
      setServiceCategoryEditor(null);
      reload();
      flash('Service category saved.');
    } catch (saveError: any) {
      setError(saveError.message || 'Could not save service category.');
    } finally {
      setBusy(false);
    }
  };

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!productEditor) return;
    const form = productEditor.form;
    if (Number(form.salePrice) > Number(form.price)) {
      setError('Price cannot be higher than MRP.');
      return;
    }
    const payload = {
      name: form.name.trim(), sku: form.sku.trim(), description: form.description.trim() || form.name.trim(), brand: form.brand.trim() || 'Other',
      categoryId: form.categoryId, price: Number(form.price), salePrice: Number(form.salePrice),
      shippingCharge: form.shippingCharge.trim() ? Number(form.shippingCharge) : null,
      stockQuantity: Number(form.stockQuantity), lowStockThreshold: Number(form.lowStockThreshold), active: form.active,
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      imageUrls: [...new Set([...form.imageUrls, form.imageUrl.trim()].filter(Boolean))],
      specifications: Object.fromEntries(form.specificationText.split('\n').map((line) => line.split(':')).filter((parts) => parts.length > 1).map((parts) => [parts[0].trim(), parts.slice(1).join(':').trim()])),
      compatibility: form.compatibility.split(',').map((item) => item.trim()).filter(Boolean),
    };
    setBusy(true);
    try {
      await adminRequest(productEditor.id ? `/api/admin/products/${productEditor.id}` : '/api/admin/products', productEditor.id ? 'PUT' : 'POST', payload);
      await refreshCatalog(); setProductEditor(null); reload(); flash('Product saved.');
    } catch (saveError: any) { setError(saveError.message || 'Could not save product.'); }
    finally { setBusy(false); }
  };

  const saveCategory = async (event: FormEvent) => {
    event.preventDefault();
    if (!categoryEditor) return;
    setBusy(true);
    try {
      const { id, ...payload } = categoryEditor;
      await adminRequest(id ? `/api/admin/categories/${id}` : '/api/admin/categories', id ? 'PUT' : 'POST', payload);
      await refreshCatalog(); setCategoryEditor(null); reload(); flash('Category saved.');
    } catch (saveError: any) { setError(saveError.message || 'Could not save category.'); }
    finally { setBusy(false); }
  };

  const saveBrand = async (event: FormEvent) => {
    event.preventDefault();
    if (!brandEditor) return;
    const { id, ...payload } = brandEditor;
    setBusy(true);
    try {
      await adminRequest(id ? `/api/admin/brands/${id}` : '/api/admin/brands', id ? 'PUT' : 'POST', payload);
      setBrandEditor(null);
      reload();
      flash('Brand saved.');
    } catch (saveError: any) {
      setError(saveError.message || 'Could not save brand.');
    } finally {
      setBusy(false);
    }
  };

  const saveCoupon = async (event: FormEvent) => {
    event.preventDefault();
    if (!couponEditor) return;
    const form = couponEditor.form;
    const payload = {
      ...form, discountValue: Number(form.discountValue), minimumOrderAmount: Number(form.minimumOrderAmount),
      maximumDiscount: form.maximumDiscount ? Number(form.maximumDiscount) : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      startsAt: new Date(form.startsAt).toISOString(), expiresAt: new Date(form.expiresAt).toISOString(),
    };
    setBusy(true);
    try {
      await adminRequest(couponEditor.id ? `/api/admin/coupons/${couponEditor.id}` : '/api/admin/coupons', couponEditor.id ? 'PUT' : 'POST', payload);
      setCouponEditor(null); reload(); flash('Coupon saved.');
    } catch (saveError: any) { setError(saveError.message || 'Could not save coupon.'); }
    finally { setBusy(false); }
  };

  const saveBanner = async (event: FormEvent) => {
    event.preventDefault();
    if (!bannerEditor) return;
    const form = bannerEditor.form;
    const payload = {
      ...form, subtitle: form.subtitle || null, linkUrl: form.linkUrl || undefined,
      buttonText: form.buttonText || null, sortOrder: Number(form.sortOrder),
    };
    setBusy(true);
    try {
      await adminRequest(bannerEditor.id ? `/api/admin/banners/${bannerEditor.id}` : '/api/admin/banners', bannerEditor.id ? 'PUT' : 'POST', payload);
      setBannerEditor(null); reload(); flash('Banner saved.');
    } catch (saveError: any) { setError(saveError.message || 'Could not save banner.'); }
    finally { setBusy(false); }
  };

  const remove = async (path: string, label: string, permanent = true) => {
    const actionName = permanent ? 'permanently delete' : 'archive';
    if (!window.confirm(`Are you sure you want to ${actionName} this ${label}?`)) return;
    setBusy(true);
    try {
      await adminRequest(permanent ? `${path}?archive=false` : `${path}?archive=true`, 'DELETE');
      if (label === 'service' || label === 'service category') await refreshServices();
      if (label === 'category' || label === 'product') await refreshCatalog();
      reload();
      flash(`${label.charAt(0).toUpperCase() + label.slice(1)} ${permanent ? 'deleted' : 'archived'}.`);
    }
    catch (removeError: any) { setError(removeError.message || `Could not update ${label}.`); }
    finally { setBusy(false); }
  };

  const deleteBooking = async (id: string, number: string) => {
    if (!window.confirm(`Permanently delete booking ${number}? This will remove it completely from the database and cannot be undone.`)) return;
    setBusy(true);
    try {
      await adminRequest(`/api/admin/service-bookings/${id}`, 'DELETE');
      flash(`Booking ${number} deleted.`);
      reload();
    } catch (err: any) {
      setError(err.message || 'Could not delete booking.');
    } finally {
      setBusy(false);
    }
  };

  const deleteOrder = async (id: string, number: string) => {
    if (!window.confirm(`Permanently delete order ${number}? This will remove all items and payment records associated with this order.`)) return;
    setBusy(true);
    try {
      await adminRequest(`/api/admin/orders/${id}`, 'DELETE');
      flash(`Order ${number} deleted.`);
      reload();
    } catch (err: any) {
      setError(err.message || 'Could not delete order.');
    } finally {
      setBusy(false);
    }
  };

  const deleteCustomer = async (id: string, name: string) => {
    if (!window.confirm(`Permanently delete customer "${name}" and all associated orders, bookings, addresses, and account history? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await adminRequest(`/api/admin/customers/${id}`, 'DELETE');
      setSelectedCustomer(null);
      flash(`Customer ${name} deleted.`);
      reload();
    } catch (err: any) {
      setError(err.message || 'Could not delete customer.');
    } finally {
      setBusy(false);
    }
  };

  const purgeStorage = async (scope: string, label: string) => {
    if (!window.confirm(`Are you SURE you want to ${label}? This will permanently delete data and cannot be undone.`)) return;
    setBusy(true);
    try {
      if (scope === 'browser-cache') {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {}
        flash('Browser cache and local storage cleared.');
        window.location.reload();
        return;
      }
      const res = await adminRequest('/api/admin/storage/purge', 'POST', { scope });
      flash(res.message || 'Storage cleared.');
      setShowStorageModal(false);
      reload();
    } catch (err: any) {
      setError(err.message || 'Could not clear storage.');
    } finally {
      setBusy(false);
    }
  };

  const quickAddProduct = async () => {
    try {
      const [categoryData, brandData] = await Promise.all([
        adminRequest('/api/admin/categories'),
        adminRequest('/api/admin/brands'),
      ]);
      setData((current: any) => ({ ...current, categories: categoryData.categories, brands: brandData.brands }));
      setProductEditor({ form: { ...emptyProduct, categoryId: categoryData.categories.find((category: any) => category.active)?.id || '' } });
    } catch (quickActionError: any) {
      setError(quickActionError.message || 'Could not prepare a new product.');
    }
  };

  const quickAddService = async () => {
    try {
      const categoryData = await adminRequest('/api/admin/service-categories');
      setData((current: any) => ({ ...current, serviceCategories: categoryData.categories }));
      setServiceEditor({ form: { ...emptyService, categoryId: categoryData.categories.find((category: any) => category.active)?.id || '' } });
    } catch (quickActionError: any) {
      setError(quickActionError.message || 'Could not prepare a new service.');
    }
  };

  const content = () => {
    if (section === 'overview') return <Overview data={data} onOpenOrders={() => { setSection('orders'); window.history.pushState(null, '', sectionPaths.orders); }} onOpenBookings={() => { setSection('bookings'); window.history.pushState(null, '', sectionPaths.bookings); }} onAddProduct={() => void quickAddProduct()} onAddService={() => void quickAddService()} />;
    if (section === 'services') return <Services data={data} search={search} setSearch={setSearch} onAdd={() => setServiceEditor({ form: { ...emptyService, categoryId: data?.serviceCategories?.find((category: any) => category.active)?.id || '' } })} onEdit={(service: any) => setServiceEditor({ id: service.id, form: { ...emptyService, ...service, inspectionFee: String(service.inspectionFee), warrantyDays: String(service.warrantyDays) } })} onDelete={(id: string, permanent = true) => remove(`/api/admin/services/${id}`, 'service', permanent)} onToggle={async (service: any, change: Record<string, unknown>) => { try { await adminRequest(`/api/admin/services/${service.id}`, 'PUT', change); await refreshServices(); reload(); } catch (toggleError: any) { setError(toggleError.message); } }} />;
    if (section === 'products') return <Products data={data} search={search} setSearch={setSearch} busy={busy} onAdd={() => setProductEditor({ form: { ...emptyProduct, categoryId: data?.categories?.find((category: any) => category.active)?.id || '' } })} onEdit={(product: any) => setProductEditor({ id: product.id, form: { ...emptyProduct, ...product, salePrice: String(product.salePrice ?? product.price), price: String(product.price), shippingCharge: product.shippingCharge == null ? '' : String(product.shippingCharge), stockQuantity: String(product.stockQuantity), lowStockThreshold: String(product.lowStockThreshold), tags: product.tags.join(', '), specificationText: Object.entries(product.specifications || {}).map(([key, value]) => `${key}: ${value}`).join('\n'), compatibility: (product.compatibility || []).join(', '), imageUrls: (product.images || []).map((image: any) => image.url), imageUrl: '' } })} onDelete={(id: string, permanent = true) => remove(`/api/admin/products/${id}`, 'product', permanent)} onToggle={async (product: any, change: Record<string, unknown>) => { try { if (typeof change.active === 'boolean') { await adminRequest(`/api/admin/products/${product.id}/visibility`, 'PATCH', { isPublished: change.active }); setData((current: any) => current ? { ...current, products: current.products.map((item: any) => item.id === product.id ? { ...item, active: change.active } : item) } : current); } else { await adminRequest(`/api/admin/products/${product.id}`, 'PUT', change); setData((current: any) => current ? { ...current, products: current.products.map((item: any) => item.id === product.id ? { ...item, ...change } : item) } : current); } await refreshCatalog(); reload(); } catch (toggleError: any) { setError(toggleError.message || 'Could not update product.'); } }} />;
    if (section === 'categories') return <div className="space-y-5"><Categories data={data} onAdd={() => setCategoryEditor({ name: '', description: '', parentId: '', active: true })} onEdit={(category: any) => setCategoryEditor({ id: category.id, name: category.name, description: category.description || '', parentId: category.parentId || '', active: category.active })} onToggle={async (category: any) => { try { await adminRequest(`/api/admin/categories/${category.id}`, 'PUT', { active: !category.active }); await refreshCatalog(); reload(); } catch (toggleError: any) { setError(toggleError.message || 'Could not update category visibility.'); } }} onDelete={(id: string, permanent = true) => remove(`/api/admin/categories/${id}`, 'category', permanent)} /><ServiceCategories data={{ categories: data?.serviceCategories || [] }} onAdd={() => setServiceCategoryEditor({ form: { ...emptyServiceCategory } })} onEdit={(category: any) => setServiceCategoryEditor({ id: category.id, form: { ...emptyServiceCategory, ...category, image: category.image || '', sortOrder: String(category.sortOrder) } })} onToggle={async (category: any) => { try { await adminRequest(`/api/admin/service-categories/${category.id}`, 'PUT', { active: !category.active }); await refreshServices(); reload(); } catch (toggleError: any) { setError(toggleError.message || 'Could not update service category visibility.'); } }} onDelete={(id: string, permanent = true) => remove(`/api/admin/service-categories/${id}`, 'service category', permanent)} /></div>;
    if (section === 'brands') return <Brands data={data} value={newBrand} setValue={setNewBrand} onAdd={() => setBrandEditor({ name: newBrand, active: true })} onEdit={(brand: any) => setBrandEditor({ id: brand.id, name: brand.name, active: brand.active })} onDelete={(id: string, permanent = true) => remove(`/api/admin/brands/${id}`, 'brand', permanent)} />;
    if (section === 'coupons') return <Coupons data={data} onAdd={() => setCouponEditor({ form: { ...emptyCoupon } })} onEdit={(coupon: any) => setCouponEditor({ id: coupon.id, form: { ...emptyCoupon, ...coupon, discountValue: String(coupon.discountValue), minimumOrderAmount: String(coupon.minimumOrderAmount), maximumDiscount: coupon.maximumDiscount ? String(coupon.maximumDiscount) : '', usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '', startsAt: new Date(coupon.startsAt).toISOString().slice(0, 16), expiresAt: new Date(coupon.expiresAt).toISOString().slice(0, 16) } })} onDelete={(id: string) => remove(`/api/admin/coupons/${id}`, 'coupon', true)} />;
    if (section === 'banners') return <Banners data={data} onAdd={() => setBannerEditor({ form: { ...emptyBanner } })} onEdit={(banner: any) => setBannerEditor({ id: banner.id, form: { ...emptyBanner, ...banner, subtitle: banner.subtitle || '', linkUrl: banner.linkUrl || '', buttonText: banner.buttonText || '', sortOrder: String(banner.sortOrder) } })} onDelete={(id: string) => remove(`/api/admin/banners/${id}`, 'banner', true)} />;
    if (section === 'reviews') return <AdminReviewsPage />;
    if (section === 'inquiries') return <AdminContactInquiriesPage />;
    if (section === 'settings') return <AdminSettingsPage />;
    if (section === 'payments') return <AdminPaymentManagementPage />;
    if (section === 'storage') return <StorageManagementPanel data={data} onPurge={purgeStorage} busy={busy} />;
    if (section === 'bookings') return <ServiceBookings data={data} filter={orderFilter} setFilter={setOrderFilter} search={search} setSearch={setSearch} onUpdated={reload} onDelete={deleteBooking} />;
    if (section === 'orders') return <Orders data={data} filter={orderFilter} setFilter={setOrderFilter} search={search} setSearch={setSearch} onUpdated={reload} onDelete={deleteOrder} />;
    return <Customers data={data} search={search} setSearch={setSearch} onSelect={setSelectedCustomer} onDelete={deleteCustomer} />;
  };

  const activeItem = navItems.find((item) => item.id === section) || navItems[0];
  const SectionIcon = activeItem.icon;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:flex">
      <aside className="w-full border-b border-slate-200 bg-slate-950 text-slate-100 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r lg:border-slate-800 lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 shadow-sm shadow-blue-500/20"><Wrench className="h-4 w-4 text-white" /></div>
          <div><div className="text-sm font-bold text-white tracking-tight">Soham Admin</div><div className="text-[10px] text-slate-400">Commerce operations</div></div>
        </div>
        <nav className="flex gap-1 overflow-x-auto p-2 lg:block lg:flex-1 lg:overflow-y-auto lg:p-3 lg:space-y-3">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <div className="hidden lg:block px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.group}
              </div>
              <div className="flex lg:block gap-1 space-y-0 lg:space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = section === item.id;
                  const isStorage = item.id === 'storage';
                  const pendingBookings = item.id === 'bookings' ? data?.metrics?.pendingBookings : undefined;
                  const totalOrders = item.id === 'orders' ? data?.metrics?.totalOrders : undefined;
                  const badgeCount = pendingBookings ?? totalOrders;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setSection(item.id); setSearch(''); window.history.pushState(null, '', sectionPaths[item.id]); }}
                      className={`flex min-h-10 shrink-0 items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold transition lg:w-full ${
                        isActive
                          ? isStorage
                            ? 'bg-rose-600 text-white font-bold shadow-sm'
                            : 'bg-blue-600 text-white font-bold shadow-sm'
                          : isStorage
                          ? 'text-rose-300 hover:bg-rose-950/40 hover:text-rose-200'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : isStorage ? 'text-rose-400' : 'text-slate-400'}`} />
                        <span>{item.id === 'storage' ? 'Clear Storage' : item.id === 'payments' ? 'Payment management' : item.id === 'inquiries' ? 'Customer inquiries' : t(item.id === 'bookings' ? 'bookings' : item.id === 'reviews' ? 'reviewModeration' : item.id === 'settings' ? 'siteSettings' : item.id)}</span>
                      </div>
                      {typeof badgeCount === 'number' && badgeCount > 0 && (
                        <span className={`hidden lg:inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.id === 'bookings'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="hidden border-t border-slate-800 p-4 lg:block shrink-0"><div className="truncate text-xs font-semibold text-slate-200">{user?.name || 'Administrator'}</div><div className="truncate text-[11px] text-slate-400">{user?.email}</div></div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3"><SectionIcon className="h-4 w-4 text-blue-600" /><h1 className="text-sm font-bold sm:text-base">{section === 'storage' ? 'Clear Storage & Data Maintenance' : section === 'payments' ? 'Payment management' : section === 'inquiries' ? 'Customer inquiries' : t(section === 'bookings' ? 'bookings' : section === 'reviews' ? 'reviewModeration' : section === 'settings' ? 'siteSettings' : section)}</h1></div>
          <div className="flex items-center gap-2">
            <SiteControls compact />
            <button type="button" onClick={() => setShowStorageModal(true)} title="Clear Storage & Data" className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100">
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear Storage</span>
            </button>
            <button onClick={reload} title="Refresh" className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><RefreshCw className="h-4 w-4" /></button>
            <span className="hidden max-w-48 truncate text-xs text-slate-600 sm:inline">{user?.email}</span>
            <button onClick={async () => { await logout(); onNavigate('admin-login'); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-2 text-xs font-semibold hover:bg-slate-50"><LogOut className="h-3.5 w-3.5" /><span className="hidden sm:inline">Sign out</span></button>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-6 lg:p-8">
          {notice && <div role="status" className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{liveBookingAlert && <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-black tracking-wide text-white"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />LIVE</span>}<Check className="h-4 w-4" />{notice}</div>}
          {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><span>{error}</span><button onClick={() => setError(null)} aria-label="Dismiss"><X className="h-4 w-4" /></button></div>}
          {data?.status === 'degraded' && <div role="alert" className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{data.error || 'Some dashboard data is temporarily unavailable.'}</div>}
          {busy && !data && <div className="py-16 text-center text-sm text-slate-500">Loading admin data…</div>}
          {!busy && error && !data && <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">This section could not be loaded. Use refresh to try again.</div>}
          {content()}
        </div>
      </main>

      {serviceEditor && <Modal title={serviceEditor.id ? 'Edit service' : 'Add service'} onClose={() => setServiceEditor(null)}>
        <form onSubmit={saveService} className="grid gap-4 sm:grid-cols-2">
          <InputField label="Service title" required value={serviceEditor.form.name} onChange={(event) => setServiceEditor({ ...serviceEditor, form: { ...serviceEditor.form, name: event.target.value } })} />
          <label className="grid gap-1.5 text-xs font-semibold text-slate-700">Category<select required value={serviceEditor.form.categoryId} onChange={(event) => setServiceEditor({ ...serviceEditor, form: { ...serviceEditor.form, categoryId: event.target.value } })} className="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal"><option value="">Select a category</option>{(data?.serviceCategories || []).filter((category: any) => category.active).map((category: any) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <InputField label="Fee / price (INR)" required type="number" min="0" step="0.01" value={serviceEditor.form.inspectionFee} onChange={(event) => setServiceEditor({ ...serviceEditor, form: { ...serviceEditor.form, inspectionFee: event.target.value } })} />
          <InputField label="Average duration" required value={serviceEditor.form.estimatedDuration} onChange={(event) => setServiceEditor({ ...serviceEditor, form: { ...serviceEditor.form, estimatedDuration: event.target.value } })} placeholder="e.g. 1 hour" />
          <TextAreaField label="Description" required className="sm:col-span-2" value={serviceEditor.form.description} onChange={(event) => setServiceEditor({ ...serviceEditor, form: { ...serviceEditor.form, description: event.target.value } })} />
          <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm sm:col-span-2"><input type="checkbox" checked={serviceEditor.form.active} onChange={(event) => setServiceEditor({ ...serviceEditor, form: { ...serviceEditor.form, active: event.target.checked } })} />Active and available to customers</label>
          <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setServiceEditor(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button><button disabled={busy} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Save service</button></div>
        </form>
      </Modal>}

      {serviceCategoryEditor && <Modal title={serviceCategoryEditor.id ? 'Edit service category' : 'Add service category'} onClose={() => setServiceCategoryEditor(null)}>
        <form onSubmit={saveServiceCategory} className="grid gap-4">
          <InputField label="Category name" required value={serviceCategoryEditor.form.name} onChange={(event) => setServiceCategoryEditor({ ...serviceCategoryEditor, form: { ...serviceCategoryEditor.form, name: event.target.value } })} />
          <TextAreaField label="Description" required value={serviceCategoryEditor.form.description} onChange={(event) => setServiceCategoryEditor({ ...serviceCategoryEditor, form: { ...serviceCategoryEditor.form, description: event.target.value } })} />
          <InputField label="Image URL (optional)" type="url" value={serviceCategoryEditor.form.image} onChange={(event) => setServiceCategoryEditor({ ...serviceCategoryEditor, form: { ...serviceCategoryEditor.form, image: event.target.value } })} />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Display order" type="number" value={serviceCategoryEditor.form.sortOrder} onChange={(event) => setServiceCategoryEditor({ ...serviceCategoryEditor, form: { ...serviceCategoryEditor.form, sortOrder: event.target.value } })} />
            <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={serviceCategoryEditor.form.active} onChange={(event) => setServiceCategoryEditor({ ...serviceCategoryEditor, form: { ...serviceCategoryEditor.form, active: event.target.checked } })} />Published</label>
          </div>
          <button disabled={busy} className="justify-self-end rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Save category</button>
        </form>
      </Modal>}

      {productEditor && <Modal title={productEditor.id ? 'Edit product' : 'Add product'} onClose={() => setProductEditor(null)}>
        <form onSubmit={saveProduct} className="grid gap-4 sm:grid-cols-2">
          <InputField label="Title" required value={productEditor.form.name} onChange={(event) => setProductEditor({ ...productEditor, form: { ...productEditor.form, name: event.target.value } })} />
          <label className="grid gap-1.5 text-xs font-semibold text-slate-700">Category<select required value={productEditor.form.categoryId} onChange={(event) => setProductEditor({ ...productEditor, form: { ...productEditor.form, categoryId: event.target.value } })} className="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal">{(data?.categories || []).filter((category: any) => category.active).map((category: any) => <option key={category.id} value={category.id}>{category.parent?.name ? `${category.parent.name} / ` : ''}{category.name}</option>)}</select></label>
          <InputField label="Brand" list="admin-brand-options" required value={productEditor.form.brand} onChange={(event) => setProductEditor({ ...productEditor, form: { ...productEditor.form, brand: event.target.value } })} />
          <datalist id="admin-brand-options">{(data?.brands || []).map((brand: any) => <option key={brand.id} value={brand.name} />)}</datalist>
          <InputField label="Price (INR)" required type="number" min="0" step="0.01" value={productEditor.form.salePrice} onChange={(event) => setProductEditor({ ...productEditor, form: { ...productEditor.form, salePrice: event.target.value } })} />
          <InputField label="MRP (INR)" required type="number" min="0" step="0.01" value={productEditor.form.price} onChange={(event) => setProductEditor({ ...productEditor, form: { ...productEditor.form, price: event.target.value } })} />
          <InputField label="Fixed shipping charge per unit (INR)" type="number" min="0" max="1000000" step="0.01" value={productEditor.form.shippingCharge} onChange={(event) => setProductEditor({ ...productEditor, form: { ...productEditor.form, shippingCharge: event.target.value } })} />
          <p className="text-xs text-slate-500 sm:col-span-2">Leave blank to use the existing store shipping rule. Entered fees are charged per unit and added across the cart; blank-fee products retain the existing store rule.</p>
          <InputField label="Stock quantity" required type="number" min="0" step="1" value={productEditor.form.stockQuantity} onChange={(event) => setProductEditor({ ...productEditor, form: { ...productEditor.form, stockQuantity: event.target.value } })} />
          <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm"><input type="checkbox" checked={productEditor.form.active} onChange={(event) => setProductEditor({ ...productEditor, form: { ...productEditor.form, active: event.target.checked } })} />Publish immediately</label>
          <div className="flex items-end gap-2 sm:col-span-2">
            <InputField label="Image URL (optional)" type="url" value={productEditor.form.imageUrl} onChange={(event) => setProductEditor({ ...productEditor, form: { ...productEditor.form, imageUrl: event.target.value } })} />
            <button type="button" disabled={!productEditor.form.imageUrl.trim()} onClick={() => setProductEditor({ ...productEditor, form: { ...productEditor.form, imageUrls: [...new Set([...productEditor.form.imageUrls, productEditor.form.imageUrl.trim()])], imageUrl: '' } })} className="h-10 shrink-0 rounded-md border border-slate-300 px-3 text-xs font-semibold disabled:opacity-50">Add URL</button>
          </div>
          <div className="sm:col-span-2"><ImagePicker urls={productEditor.form.imageUrls} busy={busy} onUpload={(event) => handleUpload(event, (url) => setProductEditor((current) => current ? { ...current, form: { ...current.form, imageUrls: [...current.form.imageUrls, url] } } : current))} onDropFile={(file) => handleImageFile(file, (url) => setProductEditor((current) => current ? { ...current, form: { ...current.form, imageUrls: [...current.form.imageUrls, url] } } : current))} onRemove={(index) => setProductEditor({ ...productEditor, form: { ...productEditor.form, imageUrls: productEditor.form.imageUrls.filter((_, imageIndex) => index !== imageIndex) } })} /></div>
          <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setProductEditor(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button><button disabled={busy} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Save product</button></div>
        </form>
      </Modal>}

      {categoryEditor && <Modal title={categoryEditor.id ? 'Edit category' : 'Add category'} onClose={() => setCategoryEditor(null)}><form onSubmit={saveCategory} className="grid gap-4">
        <InputField label="Category name" required value={categoryEditor.name} onChange={(event) => setCategoryEditor({ ...categoryEditor, name: event.target.value })} />
        <TextAreaField label="Description" value={categoryEditor.description} onChange={(event) => setCategoryEditor({ ...categoryEditor, description: event.target.value })} />
        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">Parent category<select value={categoryEditor.parentId} onChange={(event) => setCategoryEditor({ ...categoryEditor, parentId: event.target.value })} className="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal"><option value="">Top-level</option>{(data?.categories || []).filter((category: any) => category.id !== categoryEditor.id).map((category: any) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={categoryEditor.active} onChange={(event) => setCategoryEditor({ ...categoryEditor, active: event.target.checked })} />Active</label>
        <button disabled={busy} className="justify-self-end rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Save category</button>
      </form></Modal>}

      {brandEditor && <Modal title={brandEditor.id ? 'Edit brand' : 'Add brand'} onClose={() => setBrandEditor(null)}><form onSubmit={saveBrand} className="grid gap-4">
        <InputField label="Brand name" required value={brandEditor.name} onChange={(event) => setBrandEditor({ ...brandEditor, name: event.target.value })} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={brandEditor.active} onChange={(event) => setBrandEditor({ ...brandEditor, active: event.target.checked })} />Active</label>
        <button disabled={busy} className="justify-self-end rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Save brand</button>
      </form></Modal>}

      {couponEditor && <Modal title={couponEditor.id ? 'Edit coupon' : 'Create coupon'} onClose={() => setCouponEditor(null)}><form onSubmit={saveCoupon} className="grid gap-4 md:grid-cols-2">
        <InputField label="Code" required value={couponEditor.form.code} onChange={(event) => setCouponEditor({ ...couponEditor, form: { ...couponEditor.form, code: event.target.value.toUpperCase() } })} />
        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">Discount type<select value={couponEditor.form.discountType} onChange={(event) => setCouponEditor({ ...couponEditor, form: { ...couponEditor.form, discountType: event.target.value as CouponForm['discountType'] } })} className="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal"><option value="PERCENTAGE">Percentage</option><option value="FLAT">Fixed amount</option></select></label>
        <TextAreaField label="Description" required value={couponEditor.form.description} onChange={(event) => setCouponEditor({ ...couponEditor, form: { ...couponEditor.form, description: event.target.value } })} />
        <InputField label="Discount value" required type="number" min="0.01" step="0.01" value={couponEditor.form.discountValue} onChange={(event) => setCouponEditor({ ...couponEditor, form: { ...couponEditor.form, discountValue: event.target.value } })} />
        <InputField label="Minimum order amount" type="number" min="0" value={couponEditor.form.minimumOrderAmount} onChange={(event) => setCouponEditor({ ...couponEditor, form: { ...couponEditor.form, minimumOrderAmount: event.target.value } })} />
        <InputField label="Maximum discount (optional)" type="number" min="0" value={couponEditor.form.maximumDiscount} onChange={(event) => setCouponEditor({ ...couponEditor, form: { ...couponEditor.form, maximumDiscount: event.target.value } })} />
        <InputField label="Usage limit (optional)" type="number" min="1" value={couponEditor.form.usageLimit} onChange={(event) => setCouponEditor({ ...couponEditor, form: { ...couponEditor.form, usageLimit: event.target.value } })} />
        <InputField label="Starts at" required type="datetime-local" value={couponEditor.form.startsAt} onChange={(event) => setCouponEditor({ ...couponEditor, form: { ...couponEditor.form, startsAt: event.target.value } })} />
        <InputField label="Expires at" required type="datetime-local" value={couponEditor.form.expiresAt} onChange={(event) => setCouponEditor({ ...couponEditor, form: { ...couponEditor.form, expiresAt: event.target.value } })} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={couponEditor.form.active} onChange={(event) => setCouponEditor({ ...couponEditor, form: { ...couponEditor.form, active: event.target.checked } })} />Active</label>
        <button disabled={busy} className="justify-self-end rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Save coupon</button>
      </form></Modal>}

      {bannerEditor && <Modal title={bannerEditor.id ? 'Edit banner' : 'Create banner'} onClose={() => setBannerEditor(null)}><form onSubmit={saveBanner} className="grid gap-4">
        <InputField label="Title" required value={bannerEditor.form.title} onChange={(event) => setBannerEditor({ ...bannerEditor, form: { ...bannerEditor.form, title: event.target.value } })} />
        <InputField label="Supporting text" value={bannerEditor.form.subtitle} onChange={(event) => setBannerEditor({ ...bannerEditor, form: { ...bannerEditor.form, subtitle: event.target.value } })} />
        <InputField label="Image URL" required type="url" value={bannerEditor.form.imageUrl} onChange={(event) => setBannerEditor({ ...bannerEditor, form: { ...bannerEditor.form, imageUrl: event.target.value } })} />
        <label className="grid gap-1.5 text-xs font-semibold text-slate-700">Upload banner image<input type="file" accept="image/*" disabled={busy} onChange={(event) => handleUpload(event, (url) => setBannerEditor((current) => current ? { ...current, form: { ...current.form, imageUrl: url } } : current))} className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm" /></label>
        {bannerEditor.form.imageUrl && <img src={bannerEditor.form.imageUrl} alt="Banner preview" className="max-h-44 rounded-md border border-slate-200 object-cover" />}
        <InputField label="Link URL" type="url" value={bannerEditor.form.linkUrl} onChange={(event) => setBannerEditor({ ...bannerEditor, form: { ...bannerEditor.form, linkUrl: event.target.value } })} />
        <div className="grid grid-cols-2 gap-3"><InputField label="Button label" value={bannerEditor.form.buttonText} onChange={(event) => setBannerEditor({ ...bannerEditor, form: { ...bannerEditor.form, buttonText: event.target.value } })} /><InputField label="Display order" type="number" value={bannerEditor.form.sortOrder} onChange={(event) => setBannerEditor({ ...bannerEditor, form: { ...bannerEditor.form, sortOrder: event.target.value } })} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={bannerEditor.form.active} onChange={(event) => setBannerEditor({ ...bannerEditor, form: { ...bannerEditor.form, active: event.target.checked } })} />Published</label>
        <button disabled={busy} className="justify-self-end rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Save banner</button>
      </form></Modal>}

      {selectedCustomer && <Modal title="Customer profile" onClose={() => setSelectedCustomer(null)}><div className="space-y-5 text-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">{selectedCustomer.name}</h3>
            <p className="text-slate-600">{selectedCustomer.email} · {selectedCustomer.phone || 'No phone on file'}</p>
            <p className="mt-1 text-xs text-slate-500">{selectedCustomer._count.orders} orders · {selectedCustomer._count.bookings} bookings</p>
          </div>
          <button type="button" onClick={() => deleteCustomer(selectedCustomer.id, selectedCustomer.name)} className="inline-flex items-center gap-1.5 rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100">
            <Trash2 className="h-3.5 w-3.5" />Delete Account
          </button>
        </div>
        {selectedCustomer.currentLocation && <p className="rounded-md bg-blue-50 p-3 text-blue-900">Current location: {selectedCustomer.currentLocation.label}</p>}
        <div><h4 className="mb-2 text-xs font-bold uppercase text-slate-500">Saved addresses</h4>{selectedCustomer.addresses.length ? selectedCustomer.addresses.map((address: any) => <p key={address.id} className="border-t border-slate-100 py-2 text-slate-700">{address.fullName} · {address.addressLine1}, {address.city} {address.pincode}{address.isDefault ? ' · Default' : ''}</p>) : <p className="text-slate-500">No saved addresses.</p>}</div>
        <div><h4 className="mb-2 text-xs font-bold uppercase text-slate-500">Purchase history</h4>{selectedCustomer.orders.length ? selectedCustomer.orders.map((order: any) => <p key={order.id} className="flex justify-between border-t border-slate-100 py-2"><span>{order.orderNumber} · {order.status}</span><span className="font-semibold">{money(order.totalAmount)}</span></p>) : <p className="text-slate-500">No orders yet.</p>}</div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-3">
          <p className="text-xs text-slate-500">Lifetime order total: {money(selectedCustomer.orders.reduce((sum: number, order: any) => sum + Number(order.totalAmount), 0))}</p>
          <button type="button" onClick={() => deleteCustomer(selectedCustomer.id, selectedCustomer.name)} className="text-xs font-semibold text-rose-700 hover:underline">Permanently remove customer</button>
        </div>
      </div></Modal>}

      {showStorageModal && (
        <Modal title="Clear System Storage & Purge Data" onClose={() => setShowStorageModal(false)}>
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Clean up temporary data or purge test records. Operations with red buttons permanently erase items from the database.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-sm font-bold text-slate-900">Browser Cache & Local Storage</h4>
                <p className="mt-1 text-xs text-slate-500">Clears browser localStorage, sessionStorage, and cached state then refreshes.</p>
                <button type="button" onClick={() => purgeStorage('browser-cache', 'clear local browser storage and reload')} className="mt-3 inline-flex items-center gap-1.5 rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900">
                  <RefreshCw className="h-3.5 w-3.5" />Clear Browser Cache
                </button>
              </div>
              <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-4">
                <h4 className="text-sm font-bold text-rose-950">Clear All Service Bookings</h4>
                <p className="mt-1 text-xs text-rose-700">Deletes every customer service booking record in the system.</p>
                <button type="button" onClick={() => purgeStorage('bookings', 'permanently delete ALL service bookings')} className="mt-3 inline-flex items-center gap-1.5 rounded bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
                  <Trash2 className="h-3.5 w-3.5" />Delete All Bookings
                </button>
              </div>
              <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-4">
                <h4 className="text-sm font-bold text-rose-950">Clear All Orders</h4>
                <p className="mt-1 text-xs text-rose-700">Deletes every order, order item snapshot, and payment log.</p>
                <button type="button" onClick={() => purgeStorage('orders', 'permanently delete ALL customer orders')} className="mt-3 inline-flex items-center gap-1.5 rounded bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
                  <Trash2 className="h-3.5 w-3.5" />Delete All Orders
                </button>
              </div>
              <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-4">
                <h4 className="text-sm font-bold text-rose-950">Clear All Customer Accounts</h4>
                <p className="mt-1 text-xs text-rose-700">Deletes all customer user profiles, addresses, carts, and geolocation logs.</p>
                <button type="button" onClick={() => purgeStorage('customers', 'permanently delete ALL customer accounts')} className="mt-3 inline-flex items-center gap-1.5 rounded bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
                  <Trash2 className="h-3.5 w-3.5" />Delete All Customers
                </button>
              </div>
            </div>
            <div className="rounded-lg border border-rose-300 bg-rose-100/90 p-4">
              <h4 className="text-sm font-bold text-rose-950">Nuclear Reset: Clear All Test & Activity Data</h4>
              <p className="mt-1 text-xs text-rose-800">Cleans up all service bookings, product orders, payments, carts, customer profiles, and feedback in a single sweep.</p>
              <button type="button" onClick={() => purgeStorage('all', 'RESET AND ERASE all customer activity, bookings, and orders')} className="mt-3 inline-flex items-center gap-2 rounded-md bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-800">
                <Trash2 className="h-4 w-4" />Purge All Activity Data
              </button>
            </div>
          </div>
        </Modal>
      )}
      <SupportActions />
    </div>
  );
};

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 px-4 sm:px-5"><h2 className="text-sm font-bold">{title}</h2>{action}</div>{children}</section>;
}

function Empty({ label }: { label: string }) { return <div className="px-5 py-12 text-center text-sm text-slate-500">{label}</div>; }

function Overview({ data, onOpenOrders, onOpenBookings, onAddProduct, onAddService }: {
  data: any;
  onOpenOrders: () => void;
  onOpenBookings: () => void;
  onAddProduct: () => void;
  onAddService: () => void;
}) {
  if (!data) return <Empty label="Overview data is not available." />;
  const metrics = data.metrics || {};
  const cards = [
    { label: 'Total revenue', value: money(metrics.totalRevenue), icon: CircleDollarSign, tone: 'text-emerald-700 bg-emerald-50' },
    { label: 'Total orders', value: metrics.totalOrders ?? 0, icon: ShoppingCart, tone: 'text-blue-700 bg-blue-50' },
    { label: 'Active customers (30d)', value: metrics.activeCustomers ?? 0, icon: Users, tone: 'text-indigo-700 bg-indigo-50' },
    { label: 'Pending service bookings', value: metrics.pendingBookings ?? 0, icon: CalendarDays, tone: 'text-amber-700 bg-amber-50' },
    { label: 'Low-stock alerts', value: metrics.lowStockAlerts ?? 0, icon: Activity, tone: 'text-amber-700 bg-amber-50' },
  ];
  const sales = data.monthlySales || [];
  const maxSales = Math.max(1, ...sales.map((month: any) => Number(month.revenue)));
  const chartPoints = sales.map((month: any, index: number) => {
    const x = sales.length > 1 ? 12 + index * (696 / (sales.length - 1)) : 360;
    const y = 148 - (Number(month.revenue) / maxSales) * 128;
    return `${x},${y}`;
  }).join(' ');
  return <div className="space-y-5">
    <div className="flex flex-wrap gap-2">
      <button onClick={onAddProduct} className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">+ Add Product</button>
      <button onClick={onAddService} className="rounded-md border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50">+ Add Service</button>
      <button onClick={onOpenBookings} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">View Bookings</button>
    </div>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">{cards.map((card) => { const Icon = card.icon; return <section key={card.label} className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5"><div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">{card.label}</span><span className={`rounded-md p-2 ${card.tone}`}><Icon className="h-4 w-4" /></span></div><div className="mt-4 text-xl font-bold">{card.value}</div></section>; })}</div>
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="Monthly sales">
        {sales.length === 0 ? <Empty label="No sales recorded in the last 12 months." /> : <div className="p-4">
          <div className="mb-3 text-xs text-slate-500">Order totals over the last 12 months</div>
          <svg viewBox="0 0 720 180" role="img" aria-label="Monthly sales chart" className="h-48 w-full overflow-visible">
            <line x1="12" y1="148" x2="708" y2="148" stroke="#cbd5e1" />
            <line x1="12" y1="84" x2="708" y2="84" stroke="#e2e8f0" strokeDasharray="4 4" />
            <line x1="12" y1="20" x2="708" y2="20" stroke="#e2e8f0" strokeDasharray="4 4" />
            <polyline points={chartPoints} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {sales.map((month: any, index: number) => {
              const x = sales.length > 1 ? 12 + index * (696 / (sales.length - 1)) : 360;
              const y = 148 - (Number(month.revenue) / maxSales) * 128;
              return <g key={`${month.month}-${index}`}><circle cx={x} cy={y} r="3.5" fill="#2563eb"><title>{month.month}: {money(month.revenue)}</title></circle><text x={x} y="170" textAnchor="middle" className="fill-slate-500 text-[10px]">{month.month}</text></g>;
            })}
          </svg>
        </div>}
      </Panel>
      <Panel title="Recent order activity" action={<button onClick={onOpenOrders} className="text-xs font-semibold text-blue-700">All orders</button>}>
        {(data.recentOrders || []).length === 0 ? <Empty label="No orders yet." /> : <div className="divide-y divide-slate-100">{data.recentOrders.map((order: any) => <div key={order.id} className="flex items-center justify-between gap-3 px-4 py-3"><div className="min-w-0"><div className="truncate text-sm font-semibold">{order.orderNumber} · {order.user?.name}</div><div className="text-xs text-slate-500">{order.user?.phone || 'No phone'} · {new Date(order.createdAt).toLocaleString()}</div></div><div className="text-right"><div className="text-sm font-bold">{money(order.totalAmount)}</div><Status status={order.status} /></div></div>)}</div>}
      </Panel>
      <Panel title="Order status breakdown"><div className="space-y-3 p-4">{Object.entries(data.orderStatusBreakdown || {}).map(([status, count]) => <div key={status} className="flex items-center justify-between text-sm"><span className="text-slate-600">{status.toLowerCase().replace('_', ' ')}</span><span className="font-bold">{String(count)}</span></div>)}</div></Panel>
    </div>
    <Panel title="Recent customer service bookings" action={<button onClick={onOpenBookings} className="text-xs font-semibold text-blue-700">All service bookings</button>}>
      {(data.recentBookings || []).length === 0 ? <Empty label="No service bookings yet." /> : (
        <div className="divide-y divide-slate-100">
          {data.recentBookings.map((booking: any) => (
            <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{booking.service?.name || booking.appliance} · {booking.user?.name || booking.address?.fullName}</div>
                <div className="text-xs text-slate-500">{booking.bookingNumber} · {new Date(booking.preferredDate).toLocaleDateString()} · {booking.preferredTimeSlot}</div>
                <div className="text-xs text-slate-500">{booking.user?.phone || booking.address?.phone} · {booking.user?.email}</div>
              </div>
              <div className="text-right"><div className="text-sm font-bold">{money(booking.finalAmount ?? booking.estimatedAmount)}</div><Status status={booking.status} /></div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  </div>;
}

function Status({ status }: { status: string }) {
  const colors: Record<string, string> = { PENDING: 'bg-amber-50 text-amber-800', CONFIRMED: 'bg-sky-50 text-sky-800', ON_THE_WAY: 'bg-indigo-50 text-indigo-800', IN_PROGRESS: 'bg-blue-50 text-blue-800', PROCESSING: 'bg-blue-50 text-blue-800', SHIPPED: 'bg-indigo-50 text-indigo-800', COMPLETED: 'bg-emerald-50 text-emerald-800', DELIVERED: 'bg-emerald-50 text-emerald-800', CANCELLED: 'bg-rose-50 text-rose-800' };
  const labels: Record<string, string> = { PROCESSING: 'In Progress', SHIPPED: 'Out for Delivery', DELIVERED: 'Completed', ON_THE_WAY: 'Out for Delivery' };
  const label = labels[status] || status.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  return <span className={`mt-1 inline-flex rounded px-2 py-0.5 text-[10px] font-bold ${colors[status] || 'bg-slate-100 text-slate-700'}`}>{label}</span>;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = { PROCESSING: 'In Progress', SHIPPED: 'Out for Delivery', DELIVERED: 'Completed', ON_THE_WAY: 'Out for Delivery' };
  return labels[status] || status.replaceAll('_', ' ');
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="flex h-10 min-w-48 items-center gap-2 rounded-md border border-slate-300 bg-white px-3"><Search className="h-4 w-4 text-slate-400" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm outline-none" /></label>;
}

function getBookingAddress(booking: any) {
  return [
    booking.address?.addressLine1,
    booking.address?.addressLine2,
    booking.address?.landmark && `Near ${booking.address.landmark}`,
    booking.address?.city,
    booking.address?.state,
    booking.address?.pincode,
  ].filter(Boolean).join(', ');
}

function getWhatsAppUrl(booking: any) {
  const rawPhone = booking.address?.phone || booking.user?.phone || '';
  let phone = rawPhone.replace(/\D/g, '');
  if (phone.length === 10) phone = `91${phone}`;
  else if (phone.length === 11 && phone.startsWith('0')) phone = `91${phone.slice(1)}`;
  if (!phone) return null;

  const customerName = booking.user?.name || booking.address?.fullName || 'Customer';
  const serviceName = booking.service?.name || booking.appliance;
  const dateTime = `${new Date(booking.preferredDate).toLocaleDateString()} ${booking.preferredTimeSlot}`;
  const text = `Hello ${customerName}, this is Soham Enterprises. We have received your ${serviceName} service booking (${booking.bookingNumber}) for ${dateTime}. Please reply to confirm this appointment. Service address: ${getBookingAddress(booking)}.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function getOrderWhatsAppUrl(order: any) {
  let phone = String(order.user?.phone || order.address?.phone || '').replace(/\D/g, '');
  if (phone.length === 10) phone = `91${phone}`;
  else if (phone.length === 11 && phone.startsWith('0')) phone = `91${phone.slice(1)}`;
  if (!phone) return null;
  const name = order.user?.name || order.address?.fullName || 'Customer';
  const message = `Hello ${name}, this is Soham Enterprises regarding your order ${order.orderNumber}. Current status: ${order.status.replaceAll('_', ' ')}.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function ServiceBookings({ data, filter, setFilter, search, setSearch, onUpdated, onDelete }: any) {
  const [openBooking, setOpenBooking] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<'today' | 'yesterday' | 'weekly' | 'monthly' | 'yearly'>('today');
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [reportError, setReportError] = useState('');
  const statuses = ['PENDING', 'CONFIRMED', 'ON_THE_WAY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  const filterStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
  const downloadReport = async () => {
    setDownloadingReport(true);
    setReportError('');
    let previewWindow: Window | null = null;
    try {
      previewWindow = window.open('about:blank', '_blank');
      previewWindow?.document.write('<p style="font:16px Arial,sans-serif;padding:24px">Preparing your technician PDF…</p>');
      const report = await adminRequest(`/api/admin/booking-reports?period=${reportPeriod}`);
      const { buildAdminBookingReportPdf, openPdfPreview } = await import('../../lib/pdf-documents');
      const pdf = buildAdminBookingReportPdf(report.bookings, reportPeriod);
      const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
      openPdfPreview(pdf, `sohom-bookings-${reportPeriod}-${date}.pdf`, previewWindow);
    } catch (error: any) {
      previewWindow?.close();
      setReportError(error.message || 'Could not download the booking report.');
    } finally {
      setDownloadingReport(false);
    }
  };

  const saveStatus = async () => {
    if (!openBooking || !statuses.includes(status)) return;
    setSaving(true);
    try {
      await adminRequest(`/api/admin/bookings/${openBooking.id}/status`, 'PATCH', { status });
      setOpenBooking(null);
      onUpdated();
    } catch (error: any) {
      window.alert(error.message || 'Could not update booking status.');
      onUpdated();
    } finally {
      setSaving(false);
    }
  };
  const updateInlineStatus = async (booking: any, nextStatus: string) => {
    try {
      await adminRequest(`/api/admin/bookings/${booking.id}/status`, 'PATCH', { status: nextStatus });
      onUpdated();
    } catch (error: any) {
      window.alert(error.message || 'Could not update booking status.');
      onUpdated();
    }
  };

  return (
    <Panel
      title="Customer service bookings"
      action={<div className="flex flex-wrap gap-2">
        <SearchBox value={search} onChange={setSearch} placeholder="Booking or customer" />
        <select aria-label="Filter bookings by status" value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-2 text-xs"><option value="ALL">All statuses</option>{filterStatuses.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</select>
        <select aria-label="Booking report period" value={reportPeriod} onChange={(event) => setReportPeriod(event.target.value as typeof reportPeriod)} className="h-10 rounded-md border border-slate-300 bg-white px-2 text-xs">
          <option value="today">Today</option><option value="yesterday">Yesterday</option><option value="weekly">This week</option><option value="monthly">This month</option><option value="yearly">This year</option>
        </select>
        <button type="button" onClick={() => void downloadReport()} disabled={downloadingReport} className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-700 px-3 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
          <Download className="h-4 w-4" />{downloadingReport ? 'Preparing…' : 'View / save technician PDF'}
        </button>
      </div>}
    >
      {reportError && <p role="alert" className="mx-4 mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700 sm:mx-5">{reportError}</p>}
      {!data?.bookings?.length ? <Empty label="No service bookings match this filter." /> : (
        <div className="divide-y divide-slate-100">
          {data.bookings.map((booking: any) => (
            <article key={booking.id} className="space-y-4 px-4 py-5 sm:px-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{booking.user?.name || booking.address?.fullName || 'Customer'}</h3>
                  <p className="mt-0.5 font-mono text-xs text-slate-500">{booking.bookingNumber}</p>
                </div>
                <Status status={booking.status} />
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Service</p><p className="mt-1 font-medium">{booking.service?.name || booking.appliance}</p></div>
                <div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Customer phone</p><p className="mt-1">{booking.address?.phone || booking.user?.phone || 'No phone provided'}</p></div>
                <div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Requested slot</p><p className="mt-1">{new Date(booking.preferredDate).toLocaleDateString()} · {booking.preferredTimeSlot}</p></div>
                <div><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Service fee</p><p className="mt-1 font-semibold">{money(booking.finalAmount ?? booking.estimatedAmount)}</p></div>
                <div className="sm:col-span-2 xl:col-span-4"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Address</p><p className="mt-1 text-slate-700">{getBookingAddress(booking) || 'No service address provided'}</p></div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">Update status
                  <select aria-label={`Status for ${booking.bookingNumber}`} value={booking.status} onChange={(event) => void updateInlineStatus(booking, event.target.value)} className="h-9 rounded border border-slate-300 bg-white px-2 text-xs font-normal">{statuses.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</select>
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {getWhatsAppUrl(booking) ? (
                    <a href={getWhatsAppUrl(booking)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                      <MessageCircle className="h-3.5 w-3.5" />Send WhatsApp Confirmation
                    </a>
                  ) : <span className="text-xs text-slate-500">Customer phone unavailable</span>}
                  <button onClick={() => { setOpenBooking(booking); setStatus(booking.status); }} className="text-xs font-semibold text-blue-700">Details</button>
                  <button onClick={() => onDelete(booking.id, booking.bookingNumber)} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:text-rose-800"><Trash2 className="h-3.5 w-3.5" />Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {openBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold">{openBooking.bookingNumber}</h2><button onClick={() => setOpenBooking(null)} aria-label="Close"><X className="h-5 w-5" /></button></div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-500">Customer</h3>
                <p className="mt-1 text-sm font-semibold">{openBooking.user?.name || openBooking.address?.fullName}</p>
                <p className="text-sm text-slate-600">{openBooking.address?.phone || openBooking.user?.phone || 'No phone'} · {openBooking.user?.email || 'No email'}</p>
                <h3 className="mt-4 text-xs font-bold uppercase text-slate-500">Service booking</h3>
                <p className="mt-1 text-sm font-semibold">{openBooking.service?.name || openBooking.appliance}</p>
                <p className="text-sm text-slate-600">{new Date(openBooking.preferredDate).toLocaleDateString()} · {openBooking.preferredTimeSlot}</p>
                <p className="mt-1 text-sm">Inspection fee: <strong>{money(openBooking.estimatedAmount)}</strong></p>
                {openBooking.finalAmount != null && <p className="text-sm">Final service fee: <strong>{money(openBooking.finalAmount)}</strong></p>}
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-500">Full service address</h3>
                <p className="mt-1 text-sm">{[
                  openBooking.address?.fullName,
                  openBooking.address?.addressLine1,
                  openBooking.address?.addressLine2,
                  openBooking.address?.landmark && `Near ${openBooking.address.landmark}`,
                  openBooking.address?.city,
                  openBooking.address?.state,
                  openBooking.address?.pincode,
                ].filter(Boolean).join(', ')}</p>
                {openBooking.user?.currentLocation ? (
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-blue-800">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{openBooking.user.currentLocation.label}<br />City: {openBooking.user.currentLocation.city || '—'} · Pincode: {openBooking.user.currentLocation.pincode || '—'}<br />Lat/Long: {openBooking.user.currentLocation.lat ?? '—'}, {openBooking.user.currentLocation.lng ?? '—'}</span>
                  </p>
                ) : <p className="mt-2 text-xs text-slate-500">Geolocation not shared by customer.</p>}
                {openBooking.problemDescription && <><h3 className="mt-4 text-xs font-bold uppercase text-slate-500">Reported issue</h3><p className="mt-1 text-sm">{openBooking.problemDescription}</p></>}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-slate-200 pt-4">
              <label className="grid gap-1 text-xs font-semibold">Booking status<select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded border border-slate-300 px-2 font-normal">{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => { const bId = openBooking.id; const bNum = openBooking.bookingNumber; setOpenBooking(null); onDelete(bId, bNum); }} className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100">
                  <Trash2 className="h-4 w-4" />Delete Booking
                </button>
                {getWhatsAppUrl(openBooking) ? (
                  <a href={getWhatsAppUrl(openBooking)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                    <MessageCircle className="h-4 w-4" />Send WhatsApp Confirmation
                  </a>
                ) : <span className="rounded-md bg-slate-100 px-4 py-2 text-xs text-slate-500">Customer phone unavailable</span>}
                <button onClick={() => setOpenBooking(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Close</button>
                <button onClick={saveStatus} disabled={saving || status === openBooking.status} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save status'}</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </Panel>
  );
}

function Services({ data, search, setSearch, onAdd, onEdit, onDelete, onToggle }: any) {
  return <Panel title="Service catalog" action={<div className="flex gap-2"><SearchBox value={search} onChange={setSearch} placeholder="Search services" /><button onClick={onAdd} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-4 w-4" /> Add service</button></div>}>
    {!data?.services?.length ? <Empty label="No services match this search." /> : <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr>{['Service', 'Category', 'Brands', 'Fee', 'Visibility', ''].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{data.services.map((service: any) => <tr key={service.id}><td className="px-4 py-3 font-semibold">{service.name}</td><td className="px-4 py-3 text-slate-600">{service.category?.name}</td><td className="px-4 py-3">{service.brandApplicability}</td><td className="px-4 py-3 font-semibold">{money(service.inspectionFee)}</td><td className="px-4 py-3"><span className={`rounded px-2 py-1 font-semibold ${service.active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{service.active ? 'Published' : 'Draft'}</span><div><button onClick={() => onToggle(service, { active: !service.active })} className="mt-1 font-semibold text-blue-700">Toggle visibility</button></div></td><td className="px-4 py-3 text-right"><button onClick={() => onEdit(service)} className="px-2 py-1 font-semibold text-blue-700">Edit</button><button onClick={() => onDelete(service.id, false)} className="px-2 py-1 font-semibold text-slate-600 hover:text-slate-800">Archive</button><button onClick={() => onDelete(service.id, true)} className="px-2 py-1 font-semibold text-rose-700 hover:text-rose-800">Delete</button></td></tr>)}</tbody></table></div>}
  </Panel>;
}

function Products({ data, search, setSearch, onAdd, onEdit, onDelete, onToggle }: any) {
  return <Panel title="Product catalog" action={<div className="flex gap-2"><SearchBox value={search} onChange={setSearch} placeholder="Search products" /><button onClick={onAdd} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-4 w-4" /> Add product</button></div>}>
    {!data?.products?.length ? <Empty label="No products match this search." /> : <div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr>{['Product', 'SKU / Brand', 'Category', 'Price', 'Stock', 'Visibility', ''].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{data.products.map((product: any) => <tr key={product.id}><td className="px-4 py-3"><div className="flex items-center gap-3"><ProductImage src={product.images?.[0]?.url} alt="" className="h-10 w-10 rounded border border-slate-200 bg-slate-50 object-cover" /><span className="font-semibold">{product.name}</span></div></td><td className="px-4 py-3 text-slate-600">{product.sku}<br />{product.brand}</td><td className="px-4 py-3">{product.category?.name}</td><td className="px-4 py-3 font-semibold">{money(product.salePrice ?? product.price)}{product.salePrice && <span className="ml-1 text-slate-400 line-through">{money(product.price)}</span>}</td><td className="px-4 py-3"><span className={product.stockQuantity > 0 ? 'text-emerald-700' : 'text-rose-700'}>{product.stockQuantity > 0 ? 'In stock' : 'Out of stock'}</span><div className="text-slate-500">{product.stockQuantity} units{product.stockQuantity <= product.lowStockThreshold ? ' · Low' : ''}</div><button onClick={() => onToggle(product, { stockQuantity: product.stockQuantity > 0 ? 0 : Math.max(1, product.lowStockThreshold + 1) })} className="mt-1 font-semibold text-blue-700">Toggle stock</button></td><td className="px-4 py-3"><span className={`rounded px-2 py-1 font-semibold ${product.active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{product.active ? 'Published' : 'Draft'}</span><div><button onClick={() => onToggle(product, { active: !product.active })} className="mt-1 font-semibold text-blue-700">Toggle visibility</button></div></td><td className="px-4 py-3 text-right"><button onClick={() => onEdit(product)} className="px-2 py-1 font-semibold text-blue-700">Edit</button><button onClick={() => onDelete(product.id, false)} className="px-2 py-1 font-semibold text-slate-600 hover:text-slate-800">Archive</button><button onClick={() => onDelete(product.id, true)} className="px-2 py-1 font-semibold text-rose-700 hover:text-rose-800">Delete</button></td></tr>)}</tbody></table></div>}
  </Panel>;
}

function Categories({ data, onAdd, onEdit, onToggle, onDelete }: any) {
  return <Panel title="Categories and subcategories" action={<button onClick={onAdd} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-4 w-4" /> Add category</button>}>
    {!data?.categories?.length ? <Empty label="No categories configured." /> : <div className="divide-y divide-slate-100">{data.categories.map((category: any) => <div key={category.id} className="flex items-center justify-between gap-3 px-4 py-3"><div><div className="text-sm font-semibold">{category.parent?.name ? `${category.parent.name} / ` : ''}{category.name}</div><div className="text-xs text-slate-500">{category._count.products} products · {category._count.children} subcategories · {category.active ? 'Published' : 'Hidden'}</div></div><div className="flex gap-2"><button onClick={() => onToggle(category)} className="text-xs font-semibold text-blue-700">{category.active ? 'Hide' : 'Publish'}</button><button onClick={() => onEdit(category)} className="text-xs font-semibold text-blue-700">Edit</button><button onClick={() => onDelete(category.id, false)} className="text-xs font-semibold text-slate-600">Archive</button><button onClick={() => onDelete(category.id, true)} className="text-xs font-semibold text-rose-700">Delete</button></div></div>)}</div>}
  </Panel>;
}

function ServiceCategories({ data, onAdd, onEdit, onToggle, onDelete }: any) {
  return <Panel title="Service categories" action={<button onClick={onAdd} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-4 w-4" /> Add service category</button>}>
    {!data?.categories?.length ? <Empty label="No service categories configured." /> : <div className="divide-y divide-slate-100">{data.categories.map((category: any) => <div key={category.id} className="flex items-center justify-between gap-3 px-4 py-3"><div><div className="text-sm font-semibold">{category.name}</div><div className="text-xs text-slate-500">{category._count.services} services · {category.active ? 'Published' : 'Hidden'}</div></div><div className="flex gap-2"><button onClick={() => onToggle(category)} className="text-xs font-semibold text-blue-700">{category.active ? 'Hide' : 'Publish'}</button><button onClick={() => onEdit(category)} className="text-xs font-semibold text-blue-700">Edit</button><button onClick={() => onDelete(category.id, false)} className="text-xs font-semibold text-slate-600">Archive</button><button onClick={() => onDelete(category.id, true)} className="text-xs font-semibold text-rose-700">Delete</button></div></div>)}</div>}
  </Panel>;
}

function Brands({ data, value, setValue, onAdd, onDelete }: any) {
  return <Panel title="Brand catalog"><div className="flex gap-2 border-b border-slate-100 p-4"><input value={value} onChange={(event) => setValue(event.target.value)} placeholder="New brand name" className="h-10 flex-1 rounded-md border border-slate-300 px-3 text-sm" /><button onClick={onAdd} disabled={!value.trim()} className="rounded-md bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-50">Add brand</button></div>{!data?.brands?.length ? <Empty label="No brands configured." /> : <div className="divide-y divide-slate-100">{data.brands.map((brand: any) => <div key={brand.id} className="flex items-center justify-between px-4 py-3"><div><span className="text-sm font-semibold">{brand.name}</span><span className="ml-2 text-xs text-slate-500">{brand._count.products} products · {brand.active ? 'Active' : 'Archived'}</span></div><div className="flex gap-2"><button onClick={() => onDelete(brand.id, false)} className="text-xs font-semibold text-slate-600">Archive</button><button onClick={() => onDelete(brand.id, true)} className="text-xs font-semibold text-rose-700">Delete</button></div></div>)}</div>}</Panel>;
}

function Coupons({ data, onAdd, onEdit, onDelete }: any) {
  const suspiciousCoupons = (data?.coupons || []).filter((coupon: any) =>
    coupon.discountType === 'PERCENTAGE' && Number(coupon.discountValue) > 100
  );
  return <Panel title="Offers and coupon codes" action={<button onClick={onAdd} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-4 w-4" /> Create coupon</button>}>
    {suspiciousCoupons.length > 0 && (
      <div role="alert" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
        Review these existing coupon records: percentage discount exceeds 100% and the coupons are unavailable to customers until corrected.
        <ul className="mt-2 list-inside list-disc font-semibold">
          {suspiciousCoupons.map((coupon: any) => <li key={coupon.id}>{coupon.code}: {coupon.discountValue}%</li>)}
        </ul>
      </div>
    )}
    {!data?.coupons?.length ? <Empty label="No coupons created." /> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr>{['Code', 'Offer', 'Usage', 'Valid through', 'Status', ''].map((value) => <th key={value} className="px-4 py-3">{value}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{data.coupons.map((coupon: any) => {
      const suspicious = coupon.discountType === 'PERCENTAGE' && Number(coupon.discountValue) > 100;
      return <tr key={coupon.id} className={suspicious ? 'bg-amber-50' : undefined}>
        <td className="px-4 py-3 font-bold">{coupon.code}{suspicious && <span className="mt-1 block text-amber-800">Review required</span>}</td>
        <td className="px-4 py-3">{coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : money(coupon.discountValue)}<div className="text-slate-500">{coupon.description}</div></td>
        <td className="px-4 py-3">{coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}</td>
        <td className="px-4 py-3">{new Date(coupon.expiresAt).toLocaleDateString()}</td>
        <td className="px-4 py-3">{suspicious ? 'Suspended: invalid percentage' : coupon.active ? 'Active' : 'Inactive'}</td>
        <td className="px-4 py-3 text-right"><button onClick={() => onEdit(coupon)} className="px-2 font-semibold text-blue-700">Edit</button><button onClick={() => onDelete(coupon.id)} className="px-2 font-semibold text-rose-700">Delete</button></td>
      </tr>;
    })}</tbody></table></div>}
  </Panel>;
}

function Banners({ data, onAdd, onEdit, onDelete }: any) {
  return <Panel title="Storefront banner carousel" action={<button onClick={onAdd} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-4 w-4" /> Add banner</button>}>
    {!data?.banners?.length ? <Empty label="No promotional banners configured." /> : <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">{data.banners.map((banner: any) => <article key={banner.id} className="overflow-hidden rounded-md border border-slate-200"><img src={banner.imageUrl} alt={banner.title} className="h-36 w-full object-cover" /><div className="space-y-2 p-3"><div className="flex justify-between gap-2"><h3 className="text-sm font-bold">{banner.title}</h3><span className="text-xs text-slate-500">#{banner.sortOrder}</span></div><p className="text-xs text-slate-600">{banner.subtitle}</p><div className="flex justify-between text-xs"><span>{banner.active ? 'Published' : 'Hidden'}</span><span><button onClick={() => onEdit(banner)} className="mr-3 font-semibold text-blue-700">Edit</button><button onClick={() => onDelete(banner.id)} className="font-semibold text-rose-700">Delete</button></span></div></div></article>)}</div>}
  </Panel>;
}

function Orders({ data, filter, setFilter, search, setSearch, onUpdated, onDelete }: any) {
  const [openOrder, setOpenOrder] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<'today' | 'yesterday' | 'weekly' | 'monthly' | 'yearly'>('today');
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [reportError, setReportError] = useState('');
  const downloadReport = async () => {
    setDownloadingReport(true);
    setReportError('');
    let previewWindow: Window | null = null;
    try {
      previewWindow = window.open('about:blank', '_blank');
      previewWindow?.document.write('<p style="font:16px Arial,sans-serif;padding:24px">Preparing your order PDF…</p>');
      const report = await adminRequest(`/api/admin/order-reports?period=${reportPeriod}`);
      const { buildAdminOrderReportPdf, openPdfPreview } = await import('../../lib/pdf-documents');
      const pdf = buildAdminOrderReportPdf(report.orders, reportPeriod);
      const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
      openPdfPreview(pdf, `sohom-orders-${reportPeriod}-${date}.pdf`, previewWindow);
    } catch (error: any) {
      previewWindow?.close();
      setReportError(error.message || 'Could not download the order report.');
    } finally {
      setDownloadingReport(false);
    }
  };
  const save = async () => {
    if (!openOrder) return;
    setSaving(true);
    try {
      await adminRequest(`/api/admin/orders/${openOrder.id}`, 'PATCH', { status, trackingCode: trackingCode || null });
      setOpenOrder(null); onUpdated();
    } catch (error: any) { window.alert(error.message || 'Could not update order.'); }
    finally { setSaving(false); }
  };
  const updateInlineStatus = async (order: any, nextStatus: string) => {
    try {
      await adminRequest(`/api/admin/orders/${order.id}`, 'PATCH', { status: nextStatus });
      onUpdated();
    } catch (error: any) {
      window.alert(error.message || 'Could not update order status.');
    }
  };
  const verifyPayment = async (order = openOrder) => {
    if (!order) return;
    const payment = order.payments?.[0];
    if (payment?.provider !== 'UPI_QR' || payment.status !== 'PENDING') return;
    const confirmed = window.confirm(
      `Confirm that ₹${Number(payment.amount).toLocaleString('en-IN')} was actually received for order ${order.orderNumber}. Only continue after checking the funds in the business account.`
    );
    if (!confirmed) return;

    setVerifyingPayment(true);
    try {
      const result = await adminRequest(`/api/admin/orders/${order.id}/verify-payment`, 'POST', { confirmReceived: true });
      setOpenOrder((current: any) => current?.id === order.id ? result.order : current);
      onUpdated();
    } catch (error: any) {
      window.alert(error.message || 'Could not verify UPI payment.');
    } finally {
      setVerifyingPayment(false);
    }
  };
  const orderStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  const pendingUpiOrders = (data?.orders || []).filter((order: any) =>
    order.payments?.[0]?.provider === 'UPI_QR' && order.payments[0].status === 'PENDING'
  );

  return (
    <Panel title="Order and delivery management" action={
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={search} onChange={setSearch} placeholder="Order or customer" />
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-md border border-slate-300 bg-white px-2 text-xs">
          {['ALL', ...orderStatuses].map((value) => <option key={value}>{value}</option>)}
        </select>
        <select aria-label="Order report period" value={reportPeriod} onChange={(event) => setReportPeriod(event.target.value as typeof reportPeriod)} className="h-10 rounded-md border border-slate-300 bg-white px-2 text-xs">
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="weekly">This week</option>
          <option value="monthly">This month</option>
          <option value="yearly">This year</option>
        </select>
        <button type="button" onClick={() => void downloadReport()} disabled={downloadingReport} className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-blue-700 px-3 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-60">
          <Download className="h-4 w-4" />{downloadingReport ? 'Preparing…' : 'View / save PDF'}
        </button>
      </div>
    }>
      {reportError && <p role="alert" className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">{reportError}</p>}
      {pendingUpiOrders.length > 0 && (
        <div role="status" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong>{pendingUpiOrders.length} UPI payment{pendingUpiOrders.length === 1 ? '' : 's'} awaiting verification.</strong>
          {' '}Open an order or use Verify below after confirming funds were received.
        </div>
      )}
      {!data?.orders?.length ? <Empty label="No orders match this filter." /> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-500"><tr>{['Order', 'Customer', 'Placed', 'Total', 'Payment', 'Status', ''].map((value) => <th key={value} className="px-4 py-3">{value}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.orders.map((order: any) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-bold">{order.orderNumber}</td>
                  <td className="px-4 py-3">{order.user.name}<div className="text-slate-500">{order.user.phone || order.address?.phone || 'No phone'}</div><div className="text-slate-500">{order.user.email}</div></td>
                  <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-semibold">{money(order.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{order.payments?.[0]?.provider === 'UPI_QR' ? 'UPI' : order.payments?.[0]?.provider === 'CASH_ON_DELIVERY' ? 'COD' : 'Payment'}</div>
                    <Status status={order.payments?.[0]?.status || 'PENDING'} />
                    {order.payments?.[0]?.provider === 'UPI_QR' && order.payments[0].status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => void verifyPayment(order)}
                        disabled={verifyingPayment}
                        className="mt-2 block rounded bg-emerald-700 px-2 py-1.5 text-[10px] font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
                      >
                        {verifyingPayment ? 'Verifying…' : 'Verify received UPI'}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select aria-label={`Status for ${order.orderNumber}`} value={order.status} onChange={(event) => void updateInlineStatus(order, event.target.value)} className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px]">
                      {orderStatuses.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {getOrderWhatsAppUrl(order) && <a href={getOrderWhatsAppUrl(order)!} target="_blank" rel="noopener noreferrer" className="mr-3 inline-flex items-center gap-1 font-semibold text-emerald-700"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>}
                    <button onClick={() => { setOpenOrder(order); setStatus(order.status); setTrackingCode(order.trackingCode || ''); }} className="mr-3 font-semibold text-blue-700">Details</button>
                    <button onClick={() => onDelete(order.id, order.orderNumber)} className="font-semibold text-rose-700 hover:text-rose-800">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {openOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold">{openOrder.orderNumber}</h2><button onClick={() => setOpenOrder(null)} aria-label="Close"><X className="h-5 w-5" /></button></div>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-500">Customer</h3>
                <p className="mt-1 text-sm font-semibold">{openOrder.user.name}</p>
                <p className="text-sm text-slate-600">{openOrder.user.email} · {openOrder.user.phone || openOrder.address?.phone || 'No phone'}</p>
                {getOrderWhatsAppUrl(openOrder) && <a href={getOrderWhatsAppUrl(openOrder)!} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"><MessageCircle className="h-4 w-4" />Message Customer via WhatsApp</a>}
                <p className="mt-3 text-xs font-bold uppercase text-slate-500">Delivery address</p>
                <p className="mt-1 text-sm">{openOrder.address.fullName}, {openOrder.address.addressLine1}, {openOrder.address.city}, {openOrder.address.state} {openOrder.address.pincode}</p>
                {openOrder.user.currentLocation && <p className="mt-2 text-xs text-blue-700">Current location: {openOrder.user.currentLocation.label}</p>}
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-500">Payment</h3>
                <p className="mt-1 text-sm">{openOrder.payments[0]?.provider || 'Unknown'} · {openOrder.payments[0]?.status || 'Pending'}</p>
                {openOrder.payments[0]?.provider === 'UPI_QR' && openOrder.payments[0]?.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => void verifyPayment()}
                    disabled={verifyingPayment}
                    className="mt-3 rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {verifyingPayment ? 'Verifying…' : 'Verify received UPI payment'}
                  </button>
                )}
                <p className="mt-3 text-xs font-bold uppercase text-slate-500">Items</p>
                {openOrder.items.map((item: any) => <div key={item.id} className="mt-1 flex justify-between text-sm"><span>{item.productNameSnapshot} × {item.quantity}</span><span>{money(item.total)}</span></div>)}
              </div>
            </div>
            <div className="mt-5 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
              <label className="grid gap-1 text-xs font-semibold">Order status<select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded border border-slate-300 px-2 font-normal">{orderStatuses.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></label>
              <InputField label="Tracking code" value={trackingCode} onChange={(event) => setTrackingCode(event.target.value)} />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => { const oId = openOrder.id; const oNum = openOrder.orderNumber; setOpenOrder(null); onDelete(oId, oNum); }}
                className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
              >
                <Trash2 className="h-4 w-4" />Delete Order
              </button>
              <div className="flex gap-2">
                <button onClick={() => setOpenOrder(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Close</button>
                <button onClick={save} disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save update'}</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </Panel>
  );
}

function Customers({ data, search, setSearch, onSelect, onDelete }: any) {
  return <Panel title="Customer accounts" action={<SearchBox value={search} onChange={setSearch} placeholder="Search customers" />}>
    {!data?.customers?.length ? <Empty label="No customers found." /> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr>{['Customer', 'Contact', 'Location', 'Orders', 'Bookings', ''].map((value) => <th key={value} className="px-4 py-3">{value}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{data.customers.map((customer: any) => <tr key={customer.id}><td className="px-4 py-3 font-semibold">{customer.name}</td><td className="px-4 py-3">{customer.email}<div className="text-slate-500">{customer.phone || 'No phone'}</div></td><td className="px-4 py-3">{customer.currentLocation?.label || customer.addresses[0]?.city || 'Not shared'}</td><td className="px-4 py-3">{customer._count.orders}</td><td className="px-4 py-3">{customer._count.bookings}</td><td className="px-4 py-3 text-right"><button onClick={() => onSelect(customer)} className="mr-3 font-semibold text-blue-700">Profile</button>{customer.role !== 'ADMIN' && <button onClick={() => onDelete(customer.id, customer.name)} className="font-semibold text-rose-700 hover:text-rose-800">Delete</button>}</td></tr>)}</tbody></table></div>}
  </Panel>;
}

function StorageManagementPanel({ data, onPurge, busy }: { data: any; onPurge: (scope: string, label: string) => void; busy: boolean }) {
  return (
    <div className="space-y-6">
      <Panel title="Storage & System Data Maintenance">
        <div className="space-y-6 p-4 sm:p-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">System Storage & Data Purge Center</h3>
            <p className="mt-1 text-xs text-slate-500">
              Manage client and server database storage. Purge test orders, reset customer service bookings, clean up abandoned shopping carts, or wipe activity data.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-5">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Browser Cache & Local Storage</h4>
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">Client-side</span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  Clears all browser localStorage, sessionStorage, cached authentication tokens, and state keys, then performs a fresh reload.
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => onPurge('browser-cache', 'clear local browser storage and reload')}
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-md bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Clear Browser Storage
              </button>
            </div>

            <div className="flex flex-col justify-between rounded-lg border border-rose-200 bg-rose-50/40 p-5">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-rose-950">Service Bookings Storage</h4>
                  <span className="rounded bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-800">
                    {data?.bookings?.length ?? data?.recentBookings?.length ?? 0} listed
                  </span>
                </div>
                <p className="mt-2 text-xs text-rose-800">
                  Permanently deletes all customer appliance & repair bookings from the database. Frees up booking history.
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => onPurge('bookings', 'permanently delete ALL service bookings')}
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-md bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete All Bookings
              </button>
            </div>

            <div className="flex flex-col justify-between rounded-lg border border-rose-200 bg-rose-50/40 p-5">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-rose-950">Customer Orders & Payments</h4>
                  <span className="rounded bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-800">
                    {data?.orders?.length ?? data?.recentOrders?.length ?? 0} listed
                  </span>
                </div>
                <p className="mt-2 text-xs text-rose-800">
                  Deletes all orders, order item snapshots, and payment transaction logs. Restores clean state for e-commerce testing.
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => onPurge('orders', 'permanently delete ALL customer orders')}
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-md bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete All Orders
              </button>
            </div>

            <div className="flex flex-col justify-between rounded-lg border border-rose-200 bg-rose-50/40 p-5">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-rose-950">Customer Accounts & Addresses</h4>
                  <span className="rounded bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-800">
                    {data?.customers?.length ?? 0} registered
                  </span>
                </div>
                <p className="mt-2 text-xs text-rose-800">
                  Safely removes all registered customer users, their addresses, carts, and geolocation entries. (Admin accounts are protected).
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => onPurge('customers', 'permanently delete ALL customer accounts')}
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-md bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete All Customers
              </button>
            </div>

            <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-5">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Abandoned Carts</h4>
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">Cache</span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  Cleans up all temporary shopping cart sessions and cart item records across all users.
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => onPurge('carts', 'empty all customer shopping carts')}
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-md bg-slate-700 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Empty All Carts
              </button>
            </div>

            <div className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-5">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Customer Reviews & Ratings</h4>
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">Feedback</span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  Deletes all product and service ratings, star reviews, and moderation records.
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => onPurge('reviews', 'permanently delete ALL customer reviews and ratings')}
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-md bg-slate-700 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete All Reviews
              </button>
            </div>
          </div>

          <div className="rounded-lg border-2 border-dashed border-rose-300 bg-rose-50/90 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-rose-950">Master Nuclear Reset: Clear All Activity Data</h4>
                <p className="mt-1 max-w-2xl text-xs text-rose-800">
                  Executes a full purge of all customer bookings, orders, payments, carts, customer profiles, and reviews.
                  <span className="mt-1 block font-bold text-emerald-800">
                    ✓ Note: Your Products, Services, Categories, and Store Settings remain completely untouched and preserved.
                  </span>
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => onPurge('all', 'EXECUTE MASTER NUCLEAR PURGE of all orders, bookings, carts, and customer accounts')}
                className="inline-flex items-center gap-2 rounded-md bg-rose-700 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow hover:bg-rose-800 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Nuclear Wipe All Data
              </button>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function ImagePicker({ urls, busy, onUpload, onDropFile, onRemove }: { urls: string[]; busy: boolean; onUpload: (event: ChangeEvent<HTMLInputElement>) => void; onDropFile: (file: File) => void; onRemove: (index: number) => void }) {
  return <div className="space-y-2"><label onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file && !busy) onDropFile(file); }} className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-700 hover:border-blue-400"><ImagePlus className="h-4 w-4" />{busy ? 'Uploading…' : 'Drop image here or choose a file'}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple={false} disabled={busy} onChange={onUpload} className="sr-only" /></label><div className="flex flex-wrap gap-2">{urls.map((url, index) => <div key={`${url}-${index}`} className="relative"><ProductImage src={url} alt={`Product image ${index + 1}`} className="h-16 w-16 rounded border border-slate-200 object-cover" /><button type="button" onClick={() => onRemove(index)} aria-label="Remove image" className="absolute -right-1 -top-1 rounded-full bg-rose-600 p-1 text-white"><X className="h-3 w-3" /></button></div>)}</div><p className="text-[11px] text-slate-500">Images may be uploaded through Cloudinary or stored as base64 when no provider is configured. Maximum 5 MB.</p></div>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl sm:p-6"><div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-3"><h2 className="text-lg font-bold">{title}</h2><button onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button></div>{children}</section></div>;
}
