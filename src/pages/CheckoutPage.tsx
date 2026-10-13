import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapPin, Plus, ShieldCheck, CheckCircle, QrCode, Banknote, ShoppingBag, Loader2, Copy
} from 'lucide-react';
import { PageRoute } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { api, ApiError } from '../lib/api';
import { Button } from '../components/ui/Button';
import { ProductImage } from '../components/ProductImage';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

interface CheckoutConfig {
  freeShippingThreshold: number;
  flatShippingFee: number;
  upiVpa: string;
  upiPayeeName: string;
  upiQrImageUrl: string;
  upiConfigured: boolean;
  businessName: string;
  businessPhone: string;
}

interface PlacedOrder {
  id: string;
  orderNumber: string;
  totalAmount: string | number;
  subtotal: string | number;
  shippingAmount: string | number;
  discountAmount: string | number;
}

interface ActiveCoupon {
  id: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number | string;
  minimumOrderAmount: number | string;
  maximumDiscount: number | string | null;
  expiresAt: string;
}

interface CheckoutQuote {
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
}

interface CheckoutPageProps {
  onNavigate: (page: PageRoute, params?: { serviceId?: string; productId?: string }) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const { user, addAddress } = useAuth();
  const { items, subtotal, refresh: refreshCart } = useCart();
  const { showToast } = useToast();

  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'COD'>('UPI');
  const [paymentReference, setPaymentReference] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState<ActiveCoupon[]>([]);
  const [couponLoadError, setCouponLoadError] = useState<string | null>(null);
  const [checkoutQuote, setCheckoutQuote] = useState<CheckoutQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [qrImageError, setQrImageError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [addressError, setAddressError] = useState('');

  // New-address form state
  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  });
  const [savingAddress, setSavingAddress] = useState(false);

  const validateAddress = (address: {
    fullName?: string | null;
    phone?: string | null;
    addressLine1?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
  }) => {
    if (!address.fullName?.trim()) return 'Enter the recipient name.';
    const phoneDigits = address.phone?.replace(/\D/g, '') || '';
    if (phoneDigits.length < 10 || phoneDigits.length > 15) return 'Enter a valid phone number with 10 to 15 digits.';
    if (!address.addressLine1?.trim()) return 'Enter the delivery street address.';
    if (!address.city?.trim()) return 'Enter the delivery city.';
    if (!address.state?.trim()) return 'Enter the delivery state.';
    if (!/^\d{6}$/.test(address.pincode?.trim() || '')) return 'Enter a valid 6-digit PIN code.';
    return '';
  };

  useEffect(() => {
    api
      .get<CheckoutConfig>('/api/config/checkout')
      .then(setConfig)
      .catch(() => showToast('Could not load checkout settings.', 'error'));
  }, []);

  useEffect(() => {
    let current = true;
    api.get<{ success: boolean; coupons: ActiveCoupon[] }>('/api/coupons', { cache: 'no-store' })
      .then((result) => {
        if (current) setAvailableCoupons(result.coupons);
      })
      .catch((error) => {
        console.error('[CheckoutPage] Could not load active coupon offers:', error);
        if (current) setCouponLoadError('Available offers could not be loaded. You can still enter a coupon code.');
      });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0 && !selectedAddressId) {
      const def = user.addresses.find((a) => a.isDefault) || user.addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [user, selectedAddressId]);

  const estimatedShippingAmount = useMemo(() => {
    if (!config) return 0;
    if (subtotal <= 0) return 0;
    return subtotal > config.freeShippingThreshold ? 0 : config.flatShippingFee;
  }, [config, subtotal]);

  const shippingAmount = checkoutQuote?.shippingAmount ?? estimatedShippingAmount;
  const estimatedTotal = checkoutQuote?.totalAmount ?? subtotal + shippingAmount;
  const displayedSubtotal = checkoutQuote?.subtotal ?? subtotal;

  const cartQuoteKey = items.map(({ product, quantity }) => `${product.id}:${quantity}`).join('|');
  useEffect(() => {
    if (items.length === 0) {
      setCheckoutQuote(null);
      setQuoteError(null);
      setQuoteLoading(false);
      return;
    }
    let current = true;
    setCheckoutQuote(null);
    setQuoteError(null);
    setQuoteLoading(true);
    const timer = window.setTimeout(() => {
      api.post<{ success: boolean; quote: CheckoutQuote }>('/api/checkout/quote', {
        couponCode: couponCode.trim() || undefined,
      })
        .then((response) => {
          if (!current) return;
          setCheckoutQuote(response.quote);
          setQuoteError(null);
        })
        .catch((error: unknown) => {
          if (!current) return;
          setCheckoutQuote(null);
          setQuoteError(error instanceof Error ? error.message : 'Could not calculate the checkout total.');
        })
        .finally(() => {
          if (current) setQuoteLoading(false);
        });
    }, 250);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [couponCode, cartQuoteKey, items.length]);

  const eligibleCoupons = availableCoupons.filter((coupon) => {
    const discountValue = Number(coupon.discountValue);
    const minimumOrderAmount = Number(coupon.minimumOrderAmount);
    const maximumDiscount = coupon.maximumDiscount === null ? null : Number(coupon.maximumDiscount);
    return Number.isFinite(discountValue) &&
      discountValue > 0 &&
      (coupon.discountType !== 'PERCENTAGE' || discountValue <= 100) &&
      Number.isFinite(minimumOrderAmount) &&
      subtotal >= minimumOrderAmount &&
      (maximumDiscount === null || (Number.isFinite(maximumDiscount) && maximumDiscount >= 0));
  });

  const handleCopyUpi = async () => {
    const upiId = config?.upiConfigured ? config.upiVpa : '';
    if (!upiId) {
      showToast('Business UPI details are not available. Please use Cash on Delivery.', 'error');
      return;
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(upiId);
      } else {
        const input = document.createElement('input');
        input.value = upiId;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedUpi(true);
      showToast('UPI ID copied to clipboard!', 'success');
      setTimeout(() => setCopiedUpi(false), 2500);
    } catch {
      showToast('Could not copy UPI ID automatically. Please copy it manually.', 'error');
    }
  };

  const handleSaveAddress = async () => {
    const validationError = validateAddress(newAddress);
    setAddressError(validationError);
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }
    setSavingAddress(true);
    try {
      const res = await addAddress({
        ...newAddress,
        fullName: newAddress.fullName.trim(),
        phone: newAddress.phone.trim(),
        addressLine1: newAddress.addressLine1.trim(),
        addressLine2: newAddress.addressLine2.trim(),
        city: newAddress.city.trim(),
        state: newAddress.state.trim(),
        pincode: newAddress.pincode.trim(),
        landmark: newAddress.landmark.trim(),
      });
      if (res.success && res.address) {
        showToast('Address saved.', 'success');
        setSelectedAddressId(res.address.id);
        setShowAddAddress(false);
        setAddressError('');
      } else {
        showToast(res.error || 'Could not save address.', 'error');
      }
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (submittingRef.current) return;
    if (!selectedAddressId) {
      setAddressError('Select a delivery address or add a new one.');
      showToast('Select a delivery address or add a new one.', 'error');
      return;
    }
    const selectedAddress = (user?.addresses || []).find((address) => address.id === selectedAddressId);
    if (!selectedAddress) {
      setAddressError('That delivery address is unavailable. Select another address or add a new one.');
      showToast('That delivery address is unavailable. Select another address or add a new one.', 'error');
      return;
    }
    const validationError = validateAddress(selectedAddress);
    if (validationError) {
      setAddressError(validationError);
      showToast(validationError, 'error');
      return;
    }
    if (items.length === 0) {
      showToast('Your cart is empty. Add products before placing an order.', 'error');
      return;
    }
    if (paymentMethod === 'UPI' && !config?.upiConfigured) {
      showToast('Business UPI details are not available. Please use Cash on Delivery.', 'error');
      return;
    }
    setAddressError('');
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await api.post<{ success: boolean; orderId: string; order: PlacedOrder }>('/api/checkout', {
        addressId: selectedAddressId,
        paymentMethod,
        paymentReference: paymentReference || undefined,
        couponCode: couponCode || undefined,
      });
      if (!res.success || !res.order) throw new Error('The order service returned an incomplete confirmation. Please check your order history before trying again.');
      setPlacedOrder(res.order);
      await refreshCart();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not place your order. Please try again.';
      showToast(message, 'error');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  // ---- Guards ----
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center py-24 px-4 text-center">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Please log in to check out</h2>
        <p className="text-xs text-slate-500 mb-4">You need an account to place an order and track it.</p>
        <Button variant="primary" onClick={() => onNavigate('login')}>Log In</Button>
      </div>
    );
  }

  if (placedOrder) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center py-20 px-4">
        <Card className="max-w-md w-full text-center p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Order Placed!</h2>
          <p className="text-sm text-slate-600">
            Order <span className="font-bold text-slate-900">{placedOrder.orderNumber}</span> has been recorded.
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5">
            <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-semibold">₹{Number(placedOrder.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Shipping</span><span className="font-semibold">₹{Number(placedOrder.shippingAmount)}</span></div>
            {Number(placedOrder.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-700"><span>Discount</span><span className="font-semibold">-₹{Number(placedOrder.discountAmount)}</span></div>
            )}
            <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-slate-900"><span>Total</span><span>₹{Number(placedOrder.totalAmount)}</span></div>
          </div>
          {paymentMethod === 'UPI' && (
            <div className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-left space-y-2">
              <p className="font-bold text-amber-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>UPI Payment Instructions (Order {placedOrder.orderNumber})</span>
              </p>
              <p className="leading-relaxed text-slate-700">
                1. Transfer exact order total <strong>₹{Number(placedOrder.totalAmount)}</strong> to business UPI ID{' '}
                <strong className="font-mono text-slate-900 select-all">{config?.upiVpa}</strong>.
              </p>
              <p className="leading-relaxed text-slate-700">
                2. Verify payee displays as <strong>"{config?.upiPayeeName || config?.businessName || 'Soham Enterprises'}"</strong> in your UPI app.
              </p>
              <p className="leading-relaxed text-slate-700">
                3. Include order reference <strong className="font-mono text-slate-900">"{placedOrder.orderNumber}"</strong> in the transaction remarks.
              </p>
              <p className="text-[10px] text-amber-800 pt-1.5 border-t border-amber-200/80 font-medium">
                Payment status is recorded as <strong>PENDING</strong> and will be manually verified by our team before dispatch.
              </p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 justify-center" onClick={() => onNavigate('spare-parts')}>
              Continue Shopping
            </Button>
            <Button variant="primary" className="flex-1 justify-center" onClick={() => onNavigate('profile')}>
              View My Orders
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center py-24 px-4 text-center">
        <ShoppingBag className="w-10 h-10 text-slate-300 mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-2">Your cart is empty</h2>
        <Button variant="primary" onClick={() => onNavigate('spare-parts')}>Browse Spare Parts</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="bg-slate-900 text-white py-8 px-4 border-b border-slate-800">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-black">Checkout</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Address + Payment */}
        <div className="lg:col-span-7 space-y-6">
          {/* Address */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" /> Delivery Address
              </h3>
              <Button variant="ghost" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAddAddress((v) => !v)}>
                Add New
              </Button>
            </div>

            {(user.addresses || []).length === 0 && !showAddAddress && (
              <p className="text-xs text-slate-500">No saved addresses yet. Add one to continue.</p>
            )}

            <div className="space-y-2">
              {(user.addresses || []).map((addr) => (
                <label
                  key={addr.id}
                  className={`block p-3 rounded-xl border cursor-pointer text-xs transition ${
                    selectedAddressId === addr.id ? 'border-blue-600 bg-blue-50/60' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-bold text-slate-900">{addr.fullName} · {addr.phone}</p>
                      <p className="text-slate-600 mt-0.5">
                        {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {addressError && !showAddAddress && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">{addressError}</p>}

            {showAddAddress && (
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Full Name (required)" autoComplete="name" value={newAddress.fullName} onChange={(e) => { setAddressError(''); setNewAddress((a) => ({ ...a, fullName: e.target.value })); }} />
                <Input label="Phone (10–15 digits)" type="tel" autoComplete="tel" value={newAddress.phone} onChange={(e) => { setAddressError(''); setNewAddress((a) => ({ ...a, phone: e.target.value })); }} />
                <Input label="Address Line 1 (required)" autoComplete="address-line1" className="sm:col-span-2" value={newAddress.addressLine1} onChange={(e) => { setAddressError(''); setNewAddress((a) => ({ ...a, addressLine1: e.target.value })); }} />
                <Input label="Address Line 2 (optional)" className="sm:col-span-2" value={newAddress.addressLine2} onChange={(e) => setNewAddress((a) => ({ ...a, addressLine2: e.target.value }))} />
                <Input label="City (required)" autoComplete="address-level2" value={newAddress.city} onChange={(e) => { setAddressError(''); setNewAddress((a) => ({ ...a, city: e.target.value })); }} />
                <Input label="State (required)" autoComplete="address-level1" value={newAddress.state} onChange={(e) => { setAddressError(''); setNewAddress((a) => ({ ...a, state: e.target.value })); }} />
                <Input label="PIN code (6 digits)" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={newAddress.pincode} onChange={(e) => { setAddressError(''); setNewAddress((a) => ({ ...a, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })); }} />
                <Input label="Landmark (optional)" value={newAddress.landmark} onChange={(e) => setNewAddress((a) => ({ ...a, landmark: e.target.value }))} />
                {addressError && <p role="alert" className="sm:col-span-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">{addressError}</p>}
                <div className="sm:col-span-2">
                  <Button variant="primary" size="sm" loading={savingAddress} onClick={handleSaveAddress}>
                    Save Address
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Payment */}
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Payment Method</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                  paymentMethod === 'UPI' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'
                }`}
              >
                <QrCode className="w-5 h-5" /> UPI (QR Code)
              </button>
              <button
                onClick={() => setPaymentMethod('COD')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                  paymentMethod === 'COD' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'
                }`}
              >
                <Banknote className="w-5 h-5" /> Cash on Delivery
              </button>
            </div>

            {paymentMethod === 'UPI' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="text-center space-y-2">
                  <div className="mx-auto flex w-full max-w-[344px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    {!qrImageError ? (
                      <img
                        src={config?.upiQrImageUrl || '/images/business-upi-qr.png'}
                        alt={`Official UPI payment QR code for ${config?.upiPayeeName || 'the business'}`}
                        className="block h-auto w-full max-w-[320px] rounded-lg object-contain"
                        onError={() => setQrImageError(true)}
                      />
                    ) : (
                      <p role="alert" className="p-4 text-xs text-amber-800">
                        The official UPI QR image could not be loaded. You can use the UPI ID below or choose Cash on Delivery.
                      </p>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-700">Official UPI QR code</p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Scan with any UPI app. This QR does not set an amount; enter the final payable amount shown after placing your order.
                  </p>
                </div>

                {/* Business UPI ID with Copy Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-white border border-slate-200">
                  <div className="text-left min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Business UPI ID</span>
                    <span className="text-sm font-extrabold text-slate-900 font-mono tracking-tight select-all truncate block">
                      {config?.upiVpa || 'Loading business UPI ID…'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    disabled={!config?.upiConfigured}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition border border-blue-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    id="copy-upi-btn"
                  >
                    {copiedUpi ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy UPI ID</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Amount & Payee Verification Card */}
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-left space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-800">
                    <span className="text-slate-600 font-medium">Current Estimated Total:</span>
                    <span className="text-base font-black text-blue-700">₹{estimatedTotal}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-800">
                    <span className="text-slate-600 font-medium">Expected Payee Name:</span>
                    <span className="font-bold text-slate-900">{config?.upiPayeeName || config?.businessName || 'Soham Enterprises'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    The QR does not include an amount because a coupon may change the final total. Enter the final amount shown after placing your order.
                  </p>
                  <div className="pt-2 border-t border-blue-200/60 text-[11px] text-blue-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-blue-900">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      Payee & Amount Verification
                    </p>
                    <p className="leading-relaxed">
                      Verify that the payee name appears as <strong>"{config?.upiPayeeName || config?.businessName || 'Soham Enterprises'}"</strong> and enter the final total shown after placing your order before authorising payment.
                    </p>
                  </div>
                </div>

                {/* Status Notice */}
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-left text-[11px] text-amber-900 space-y-1">
                  <p className="font-bold text-amber-800 flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>Payment Verification Policy</span>
                  </p>
                  <p className="leading-relaxed">
                    Scanning the QR code or submitting this order records your order with payment status <strong>PENDING</strong>. An authorized {config?.businessName || 'business'} administrator will manually verify the payment in the business account before confirming dispatch.
                  </p>
                </div>

                {/* Transaction Reference Input */}
                <div className="space-y-1 text-left">
                  <Input
                    label="UPI Transaction / Reference Number (UTR / Ref ID)"
                    placeholder="e.g. 12-digit UTR from payment receipt"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-500">
                    Enter the 12-digit reference number after paying. You can also pay after placing the order and submit your reference number from Order History.
                  </p>
                </div>
              </div>
            )}

            {paymentMethod === 'COD' && (
              <p className="text-xs text-slate-600 p-3 rounded-xl bg-slate-50 border border-slate-200">
                Pay in cash to our technician/delivery staff when your order arrives.
              </p>
            )}
          </Card>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5">
          <Card className="p-5 sticky top-24 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Order Summary</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-2.5 text-xs">
                  <ProductImage src={item.product.imageUrl} alt={item.product.name} className="w-10 h-10 rounded-lg object-cover border border-slate-100" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{item.product.name}</p>
                    <p className="text-slate-400">Qty {item.quantity}</p>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">₹{item.product.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <Input
              placeholder="Coupon code (optional)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            />
            {couponLoadError && <p role="alert" className="text-xs text-rose-700">{couponLoadError}</p>}
            {eligibleCoupons.length > 0 && (
              <div className="space-y-2 rounded-md border border-emerald-100 bg-emerald-50/60 p-3">
                <p className="text-xs font-bold text-slate-800">Available offers</p>
                {eligibleCoupons.map((coupon) => (
                  <button
                    key={coupon.id}
                    type="button"
                    onClick={() => setCouponCode(coupon.code)}
                    className="flex w-full items-start justify-between gap-3 rounded bg-white px-2.5 py-2 text-left text-xs hover:bg-emerald-50"
                  >
                    <span><strong>{coupon.code}</strong><span className="ml-2 text-slate-600">{coupon.description}</span></span>
                    <span className="shrink-0 font-semibold text-emerald-700">
                      {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% off` : `₹${Number(coupon.discountValue).toLocaleString('en-IN')} off`}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span><span className="font-semibold text-slate-900">₹{displayedSubtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Coupon discount</span>
                <span className="font-semibold text-emerald-700">{checkoutQuote?.discountAmount ? `-₹${checkoutQuote.discountAmount}` : '₹0'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className="font-semibold text-slate-900">
                  {shippingAmount === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${shippingAmount}`}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                <span>Final Total</span><span className="text-blue-600">₹{estimatedTotal}</span>
              </div>
              {quoteLoading && <p role="status" className="text-[10px] text-slate-500">Updating trusted order total…</p>}
              {quoteError && <p role="alert" className="text-[10px] text-rose-700">{quoteError}</p>}
            </div>

            <Button
              variant="primary"
              className="w-full justify-center py-3"
              loading={submitting}
              disabled={!selectedAddressId || quoteLoading || !checkoutQuote || Boolean(quoteError)}
              onClick={handlePlaceOrder}
            >
              {submitting ? 'Processing Order...' : 'Place Order'}
            </Button>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Payment verified manually by our team before dispatch</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
