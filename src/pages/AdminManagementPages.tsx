import React, { useEffect, useState } from 'react';
import { Check, EyeOff, ImagePlus, Save, Star } from 'lucide-react';
import { useSite, SiteSettings } from '../context/SiteContext';

async function requestJson(path: string, init?: RequestInit) {
  const response = await fetch(path, { credentials: 'include', ...init });
  const payload = await response.json();
  if (!response.ok || payload.success === false) throw new Error(payload.error || 'The request could not be completed.');
  return payload;
}

function AdminPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <h2 className="border-b border-slate-200 px-5 py-4 text-lg font-bold">{title}</h2>
    <div className="p-4 sm:p-6">{children}</div>
  </section>;
}

function Toggle({ checked, label, disabled, onLabel, offLabel, onChange }: {
  checked: boolean; label: string; disabled?: boolean; onChange: (checked: boolean) => void;
  onLabel: string; offLabel: string;
}) {
  return <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-400 bg-slate-100 text-slate-800'}`}
  >
    {checked ? <Check className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
    {checked ? onLabel : offLabel}
  </button>;
}

export const AdminContactInquiriesPage: React.FC = () => {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'NEW' | 'CONTACTED' | 'RESOLVED'>('ALL');

  const loadInquiries = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const result = await requestJson('/api/admin/contact-inquiries');
      setInquiries(result.inquiries);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load customer inquiries.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void loadInquiries(); }, []);

  const updateStatus = async (id: string, status: 'NEW' | 'CONTACTED' | 'RESOLVED') => {
    setSavingId(id);
    setError('');
    try {
      const result = await requestJson(`/api/admin/contact-inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setInquiries((current) => current.map((inquiry) => inquiry.id === id ? result.inquiry : inquiry));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update inquiry status.');
    } finally {
      setSavingId(null);
    }
  };

  const visibleInquiries = inquiries.filter((inquiry) => filter === 'ALL' || inquiry.status === filter);
  const statusClasses: Record<string, string> = {
    NEW: 'border-amber-200 bg-amber-50',
    CONTACTED: 'border-blue-200 bg-blue-50',
    RESOLVED: 'border-emerald-200 bg-emerald-50',
  };

  return <AdminPanel title="Customer inquiries">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-600">Messages submitted through the public Contact page are saved here.</p>
      <div className="flex items-center gap-2">
        <select aria-label="Filter inquiries by status" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
          <option value="ALL">All inquiries</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="RESOLVED">Resolved</option>
        </select>
        <button type="button" onClick={() => void loadInquiries(true)} disabled={refreshing} className="min-h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 disabled:opacity-60">{refreshing ? 'Refreshing…' : 'Refresh'}</button>
      </div>
    </div>
    {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-800">{error}</p>}
    {loading ? <p role="status" className="py-10 text-center text-sm text-slate-500">Loading inquiries…</p>
      : visibleInquiries.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">{filter === 'ALL' ? 'No customer inquiries have been received yet.' : `No ${filter.toLowerCase()} inquiries.`}</p>
        : <div className="space-y-4">
          {visibleInquiries.map((inquiry) => <article key={inquiry.id} className={`rounded-lg border p-4 ${statusClasses[inquiry.status] || 'border-slate-200 bg-white'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900">{inquiry.subject}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-800">{inquiry.name}</p>
                <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                  <a className="font-semibold text-blue-700 hover:underline" href={`tel:${inquiry.phone}`}>{inquiry.phone}</a>
                  {inquiry.email && <a className="font-semibold text-blue-700 hover:underline" href={`mailto:${inquiry.email}`}>{inquiry.email}</a>}
                  <span>{new Date(inquiry.createdAt).toLocaleString()}</span>
                </p>
              </div>
              <label className="grid gap-1 text-[10px] font-bold uppercase text-slate-500">
                Status
                <select aria-label={`Status for inquiry from ${inquiry.name}`} value={inquiry.status} disabled={savingId === inquiry.id} onChange={(event) => void updateStatus(inquiry.id, event.target.value as 'NEW' | 'CONTACTED' | 'RESOLVED')} className="min-h-10 rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold normal-case text-slate-800">
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </label>
            </div>
            <p className="mt-4 whitespace-pre-wrap break-words rounded-md border border-white/80 bg-white/80 p-3 text-sm leading-6 text-slate-800">{inquiry.message}</p>
            {savingId === inquiry.id && <p role="status" className="mt-2 text-xs text-slate-500">Saving status…</p>}
          </article>)}
        </div>}
  </AdminPanel>;
};

export const AdminReviewsPage: React.FC = () => {
  const { t } = useSite();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await requestJson('/api/admin/reviews');
      setReviews(data.reviews);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load reviews.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void loadReviews(); }, []);

  const update = async (id: string, changes: { isApproved?: boolean; isFeatured?: boolean; active?: boolean }) => {
    setSavingId(id);
    setError('');
    try {
      const data = await requestJson(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      setReviews((current) => current.map((review) => review.id === id ? { ...review, ...data.review } : review));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update review.');
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Permanently delete this customer review? This cannot be undone.')) return;
    setSavingId(id);
    setError('');
    try {
      await requestJson(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      setReviews((current) => current.filter((review) => review.id !== id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete review.');
    } finally {
      setSavingId(null);
    }
  };

  return <AdminPanel title={t('customerFeedback')}>
    <p className="mb-5 text-sm text-slate-600">Approve reviews to publish them, hide them to remove them from the storefront, and feature approved reviews on the homepage.</p>
    {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-800">{error}</p>}
    {loading ? <p role="status" className="py-10 text-center text-slate-600">{t('loadingFeedback')}</p>
      : reviews.length === 0 ? <p className="py-10 text-center text-slate-600">{t('noFeedback')}</p>
        : <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr><th className="p-3">Customer</th><th className="p-3">Rating & feedback</th><th className="p-3">Category</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reviews.map((review) => {
                const customerName = review.userName || review.user?.name || 'Customer';
                const status = review.isApproved ? 'Approved' : review.active === false ? 'Hidden' : 'Pending';
                const statusClass = status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : status === 'Hidden' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800';
                return <tr key={review.id} className="align-top">
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{customerName}</p>
                    {review.user?.email && <p className="mt-1 text-xs text-slate-500">{review.user.email}</p>}
                    <p className="mt-1 text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="max-w-md p-3">
                    <p className="font-bold text-amber-600" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                    <p className="mt-1 whitespace-pre-wrap text-slate-700">{review.comment}</p>
                    {review.imageUrl && <a className="mt-2 inline-block text-xs font-semibold text-blue-700 underline" href={review.imageUrl} target="_blank" rel="noreferrer">View customer photo</a>}
                  </td>
                  <td className="p-3 text-slate-700">{review.serviceName || review.product?.name || review.service?.name || 'General feedback'}</td>
                  <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass}`}>{status}</span></td>
                  <td className="space-y-2 p-3">
                    <div className="flex flex-wrap gap-2">
                      {!review.isApproved && <button type="button" disabled={savingId === review.id} onClick={() => void update(review.id, { isApproved: true, active: true })} className="min-h-9 rounded-md bg-emerald-700 px-3 text-xs font-bold text-white disabled:opacity-50">Approve / Publish</button>}
                      {status !== 'Hidden' && <button type="button" disabled={savingId === review.id} onClick={() => void update(review.id, { active: false })} className="min-h-9 rounded-md bg-slate-700 px-3 text-xs font-bold text-white disabled:opacity-50">Hide / Reject</button>}
                      {status === 'Hidden' && <button type="button" disabled={savingId === review.id} onClick={() => void update(review.id, { isApproved: true, active: true })} className="min-h-9 rounded-md bg-emerald-700 px-3 text-xs font-bold text-white disabled:opacity-50">Publish</button>}
                      <button type="button" disabled={savingId === review.id} onClick={() => void remove(review.id)} className="min-h-9 rounded-md border border-rose-300 px-3 text-xs font-bold text-rose-700 disabled:opacity-50">Delete</button>
                    </div>
                    <Toggle checked={review.isFeatured} onLabel="Featured" offLabel="Feature" disabled={!review.isApproved || !review.active || savingId === review.id} label={`Feature review by ${customerName}`} onChange={(isFeatured) => void update(review.id, { isFeatured })} />
                    {savingId === review.id && <p role="status" className="text-xs text-slate-500">Saving…</p>}
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>}
  </AdminPanel>;
};

export const AdminPaymentManagementPage: React.FC = () => {
  const [tab, setTab] = useState<'transactions' | 'upi-settings'>('transactions');
  const [filter, setFilter] = useState<'ALL' | 'UPI_PENDING' | 'UPI_COMPLETED' | 'COD'>('ALL');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const loadOrders = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const data = await requestJson('/api/admin/orders?status=ALL');
      setOrders(data.orders);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load payment transactions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void loadOrders(); }, []);

  const verifyPayment = async (order: any) => {
    const payment = order.payments?.[0];
    if (payment?.provider !== 'UPI_QR' || payment.status !== 'PENDING') return;
    if (!window.confirm(`Confirm that ₹${Number(payment.amount).toLocaleString('en-IN')} was actually received for order ${order.orderNumber}. Only continue after checking the business account.`)) return;

    setVerifyingId(order.id);
    setError('');
    try {
      await requestJson(`/api/admin/orders/${order.id}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmReceived: true }),
      });
      await loadOrders(true);
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Could not verify UPI payment.');
    } finally {
      setVerifyingId(null);
    }
  };

  const payments = orders.filter((order) => order.payments?.[0]);
  const pendingUpiCount = payments.filter((order) =>
    order.payments[0].provider === 'UPI_QR' && order.payments[0].status === 'PENDING'
  ).length;
  const completedCount = payments.filter((order) => order.payments[0].status === 'COMPLETED').length;
  const visiblePayments = payments.filter((order) => {
    const payment = order.payments[0];
    if (filter === 'UPI_PENDING') return payment.provider === 'UPI_QR' && payment.status === 'PENDING';
    if (filter === 'UPI_COMPLETED') return payment.provider === 'UPI_QR' && payment.status === 'COMPLETED';
    if (filter === 'COD') return payment.provider === 'CASH_ON_DELIVERY';
    return true;
  });

  return <section className="space-y-5">
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Payment management</h2>
          <p className="mt-1 text-sm text-slate-600">Review payment records, manually verify received UPI payments, and manage checkout UPI details.</p>
        </div>
        <button type="button" onClick={() => void loadOrders(true)} disabled={refreshing} className="min-h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 disabled:opacity-60">
          {refreshing ? 'Refreshing…' : 'Refresh transactions'}
        </button>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase text-slate-500">Payment records</p><p className="mt-1 text-2xl font-black text-slate-900">{payments.length}</p></div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-semibold uppercase text-amber-800">UPI awaiting verification</p><p className="mt-1 text-2xl font-black text-amber-900">{pendingUpiCount}</p></div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-semibold uppercase text-emerald-800">Payments confirmed</p><p className="mt-1 text-2xl font-black text-emerald-900">{completedCount}</p></div>
      </div>
      <div className="flex flex-wrap gap-2 px-4 pb-4" role="tablist" aria-label="Payment management sections">
        <button type="button" role="tab" aria-selected={tab === 'transactions'} onClick={() => setTab('transactions')} className={`min-h-11 rounded-md px-4 text-sm font-bold ${tab === 'transactions' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-800'}`}>Transactions</button>
        <button type="button" role="tab" aria-selected={tab === 'upi-settings'} onClick={() => setTab('upi-settings')} className={`min-h-11 rounded-md px-4 text-sm font-bold ${tab === 'upi-settings' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-800'}`}>UPI ID & QR settings</button>
      </div>
    </div>

    {tab === 'upi-settings' ? (
      <AdminSettingsPage initialTab="payments" visibleTabs={['payments']} title="UPI payment settings" />
    ) : (
      <AdminPanel title="Payment transactions">
        <label className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
          Show
          <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="min-h-10 rounded-md border border-slate-300 bg-white px-3">
            <option value="ALL">All payment methods</option>
            <option value="UPI_PENDING">UPI awaiting verification</option>
            <option value="UPI_COMPLETED">Verified UPI</option>
            <option value="COD">Cash on delivery</option>
          </select>
        </label>
        {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-800">{error}</p>}
        {loading ? <p role="status" className="py-8 text-center text-sm text-slate-500">Loading payment transactions…</p>
          : visiblePayments.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No payment records match this filter.</p>
            : <div className="space-y-3">
              {visiblePayments.map((order) => {
                const payment = order.payments[0];
                const isPendingUpi = payment.provider === 'UPI_QR' && payment.status === 'PENDING';
                return <article key={payment.id} className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="break-all text-sm font-bold text-slate-900">{order.orderNumber}</p>
                    <p className="mt-1 text-xs text-slate-600">{order.user?.name || 'Customer'} · {order.user?.email || 'No email'}</p>
                    <p className="mt-1 text-xs text-slate-600">{payment.provider === 'UPI_QR' ? 'UPI' : 'Cash on Delivery'} · <strong>{payment.status}</strong></p>
                    <p className="mt-1 text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()} · {order.items?.length || 0} item type(s)</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                    <strong className="text-base text-slate-900">₹{Number(payment.amount).toLocaleString('en-IN')}</strong>
                    {isPendingUpi && <button type="button" onClick={() => void verifyPayment(order)} disabled={verifyingId !== null} className="min-h-10 rounded-md bg-emerald-700 px-3 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">{verifyingId === order.id ? 'Verifying…' : 'Verify received payment'}</button>}
                    {payment.status === 'COMPLETED' && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Confirmed</span>}
                  </div>
                </article>;
              })}
            </div>}
        <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">UPI payments stay pending until you confirm the funds arrived in the business account. COD collection is recorded as pending and must not be marked received here.</p>
      </AdminPanel>
    )}
  </section>;
};

type SettingsTab = 'business' | 'shipping' | 'payments' | 'content' | 'branding';
const defaultSettingsTabs: SettingsTab[] = ['business', 'shipping', 'content', 'branding'];

const settingFields: Record<SettingsTab, Array<{ key: keyof SiteSettings; label: string; multiline?: boolean; type?: string }>> = {
  business: [
    { key: 'storeName', label: 'Store name' },
    { key: 'phone', label: 'Support phone number', type: 'tel' },
    { key: 'emergencyPhone', label: 'Emergency hotline number', type: 'tel' },
    { key: 'whatsappNumber', label: 'WhatsApp number', type: 'tel' },
    { key: 'supportEmail', label: 'Support email', type: 'email' },
    { key: 'shopAddress', label: 'Shop address', multiline: true },
    { key: 'businessHours', label: 'Business hours' },
    { key: 'facebookUrl', label: 'Facebook page URL' },
    { key: 'instagramUrl', label: 'Instagram profile URL' },
    { key: 'youtubeUrl', label: 'YouTube channel URL' },
  ],
  shipping: [
    { key: 'shippingFee', label: 'Default shipping charge (INR)', type: 'number' },
    { key: 'freeShippingThreshold', label: 'Free shipping threshold (INR)', type: 'number' },
  ],
  payments: [
    { key: 'upiVpa', label: 'Business UPI ID' },
    { key: 'upiPayeeName', label: 'UPI payee name' },
    { key: 'upiQrImageUrl', label: 'Official UPI QR image path or HTTPS URL' },
  ],
  content: [
    { key: 'heroTitle', label: 'Homepage hero title' },
    { key: 'heroSubtitle', label: 'Homepage hero subtitle', multiline: true },
    { key: 'announcementText', label: 'Announcement top-bar text' },
    { key: 'offerBannerText', label: 'Offer banner text', multiline: true },
    { key: 'aboutUs', label: 'About us text', multiline: true },
    { key: 'serviceTerms', label: 'Service terms and warranty text', multiline: true },
    { key: 'emergencyBannerText', label: 'Emergency line banner text', multiline: true },
    { key: 'faqContent', label: 'FAQ entries (one per line: Question | Answer)', multiline: true },
  ],
  branding: [
    { key: 'logoUrl', label: 'Logo image URL' },
    { key: 'homeBannerUrl', label: 'Homepage banner image URL' },
  ],
};

export const AdminSettingsPage: React.FC<{
  initialTab?: SettingsTab;
  visibleTabs?: SettingsTab[];
  title?: string;
}> = ({ initialTab = 'business', visibleTabs = defaultSettingsTabs, title = 'Website Content & Business Settings' }) => {
  const { settings, refreshSettings, updateSettings, t } = useSite();
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [form, setForm] = useState<SiteSettings>(settings);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => { setForm(settings); }, [settings]);
  useEffect(() => {
    void refreshSettings().catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Could not load site settings.'));
  }, [refreshSettings]);

  const upload = async (file: File, key: 'logoUrl' | 'homeBannerUrl' | 'upiQrImageUrl') => {
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setError('Choose an image file no larger than 5 MB.');
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read image.'));
      reader.onerror = () => reject(new Error('Could not read image.'));
      reader.readAsDataURL(file);
    });
    setBusy(true);
    try {
      const result = await requestJson('/api/admin/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, fileName: file.name }),
      });
      setForm((current) => ({ ...current, [key]: result.url }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Image upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const isPaymentTab = tab === 'payments';
    if (isPaymentTab && !window.confirm('Before activating these payment details, confirm that you checked the official QR and that its recipient UPI ID exactly matches the ID entered here.')) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const updates = Object.fromEntries(settingFields[tab].map(({ key }) => [key, form[key]])) as Partial<SiteSettings>;
      await updateSettings(updates, isPaymentTab);
      setNotice(isPaymentTab ? 'UPI payment settings saved after recipient confirmation.' : 'Website settings saved and published.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save website settings.');
    } finally {
      setBusy(false);
    }
  };

  const settingsTabLabels: Record<SettingsTab, string> = {
    business: t('businessProfile'),
    shipping: 'Shipping',
    payments: 'UPI & payments',
    content: t('websiteContent'),
    branding: t('bannersBranding'),
  };

  return <AdminPanel title={title}>
    {visibleTabs.length > 1 && <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Website settings sections">
      {visibleTabs.map((id) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`min-h-12 rounded-lg px-4 text-sm font-bold ${tab === id ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}>{settingsTabLabels[id]}</button>)}
    </div>}
    <form onSubmit={save} className="space-y-5">
      {settingFields[tab].map(({ key, label, multiline, type }) => <label key={key} className="grid gap-2 text-sm font-bold text-slate-800">
        {label}
        {multiline
          ? <textarea value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} rows={key === 'aboutUs' || key === 'serviceTerms' ? 7 : 4} className="w-full resize-y rounded-lg border border-slate-300 bg-white p-4 font-serif text-base font-normal leading-7 text-slate-900 shadow-inner focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          : <input type={type || 'text'} min={tab === 'shipping' ? '0' : undefined} max={tab === 'shipping' ? '1000000' : undefined} step={tab === 'shipping' ? '0.01' : undefined} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-normal text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100" />}
      </label>)}
      {tab === 'shipping' && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">Shipping settings apply to new checkouts only. Existing orders retain their recorded shipping amounts and totals.</p>}
      {tab === 'payments' && <>
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          Verify the UPI ID printed on the official QR before saving. UPI payments remain pending until an authorized admin manually verifies receipt.
        </p>
        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-400 p-3 text-sm font-bold text-slate-700">
          <ImagePlus className="h-5 w-5" /> Upload official UPI QR image (max 5 MB)
          <input className="sr-only" type="file" accept="image/*" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file, 'upiQrImageUrl'); event.target.value = ''; }} />
        </label>
        {form.upiQrImageUrl && <img src={form.upiQrImageUrl} alt="Active UPI QR preview" className="max-h-80 max-w-full rounded-xl border border-slate-200 bg-white object-contain p-2" />}
        <p className="break-all text-sm text-slate-700">Active UPI ID preview: <strong className="font-mono">{form.upiVpa || 'Not configured'}</strong> · Payee: <strong>{form.upiPayeeName || 'Not configured'}</strong></p>
      </>}
      {tab === 'content' && <aside aria-label="Live homepage content preview" className="rounded-xl border border-blue-200 bg-slate-50 p-5 shadow-inner">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-blue-700">Live content preview</p>
        {form.announcementText && <p className="mb-3 rounded bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white">{form.announcementText}</p>}
        <h3 className="text-2xl font-black text-slate-900">{form.heroTitle || 'Homepage hero title'}</h3>
        <p className="mt-2 whitespace-pre-wrap text-slate-600">{form.heroSubtitle || 'Homepage hero subtitle'}</p>
        {form.offerBannerText && <p className="mt-4 whitespace-pre-wrap rounded-lg bg-amber-100 p-3 font-semibold text-amber-950">{form.offerBannerText}</p>}
        {form.emergencyBannerText && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-900 p-3 text-sm text-white">{form.emergencyBannerText}</p>}
      </aside>}
      {tab === 'branding' && <>
        {(['logoUrl', 'homeBannerUrl'] as const).map((key) => <label key={key} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-400 p-3 text-sm font-bold text-slate-700">
          <ImagePlus className="h-5 w-5" /> Upload {key === 'logoUrl' ? 'logo' : 'homepage banner'} (max 5 MB)
          <input className="sr-only" type="file" accept="image/*" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file, key); event.target.value = ''; }} />
        </label>)}
        {form.logoUrl && <img src={form.logoUrl} alt="Current site logo preview" className="max-h-20 max-w-48 object-contain" />}
        {form.homeBannerUrl && <img src={form.homeBannerUrl} alt="Homepage banner preview" className="max-h-48 w-full rounded-xl object-cover" />}
        <label className="grid gap-2 text-sm font-bold text-slate-800">Brand color preset
          <select value={form.brandColor} onChange={(event) => setForm({ ...form, brandColor: event.target.value })} className="min-h-12 rounded-lg border border-slate-300 bg-white px-3 text-base font-normal">
            <option value="blue">Ocean blue</option><option value="teal">Teal</option><option value="indigo">Indigo</option><option value="orange">Warm orange</option>
          </select>
        </label>
      </>}
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-800">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{notice}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-blue-700 px-5 text-base font-bold text-white disabled:opacity-60"><Save className="h-5 w-5" />{busy ? 'Saving…' : t('saveAndPublish')}</button>
        <button type="button" disabled={busy} onClick={() => { setForm(settings); setError(''); setNotice(''); }} className="min-h-12 rounded-lg border border-slate-300 px-5 text-base font-bold text-slate-700 disabled:opacity-60">Cancel changes</button>
      </div>
    </form>
  </AdminPanel>;
};
