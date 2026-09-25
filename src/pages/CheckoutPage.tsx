import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin, Plus, ShieldCheck, CheckCircle, QrCode, Banknote, ShoppingBag, Loader2
} from 'lucide-react';
import { PageRoute } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { api, ApiError } from '../lib/api';
import { generateUpiQrDataUrl } from '../lib/upiQr';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

interface CheckoutConfig {
  freeShippingThreshold: number;
  flatShippingFee: number;
  upiVpa: string;
  upiPayeeName: string;
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
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);

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

  useEffect(() => {
    api
      .get<CheckoutConfig>('/api/config/checkout')
      .then(setConfig)
      .catch(() => showToast('Could not load checkout settings.', 'error'));
  }, []);

  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0 && !selectedAddressId) {
      const def = user.addresses.find((a) => a.isDefault) || user.addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [user, selectedAddressId]);

  const shippingAmount = useMemo(() => {
    if (!config) return 0;
    if (subtotal <= 0) return 0;
    return subtotal > config.freeShippingThreshold ? 0 : config.flatShippingFee;
  }, [config, subtotal]);

  const estimatedTotal = subtotal + shippingAmount;

  useEffect(() => {
    if (paymentMethod === 'UPI' && config?.upiConfigured && estimatedTotal > 0) {
      generateUpiQrDataUrl({
        vpa: config.upiVpa,
        payeeName: config.upiPayeeName,
        amount: estimatedTotal,
        transactionNote: `Sohom Enterprises Order`,
      })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(null));
    } else {
      setQrDataUrl(null);
    }
  }, [paymentMethod, config, estimatedTotal]);

  const handleSaveAddress = async () => {
    if (
      !newAddress.fullName ||
      !newAddress.phone ||
      !newAddress.addressLine1 ||
      !newAddress.city ||
      !newAddress.state ||
      !newAddress.pincode
    ) {
      showToast('Please fill in all required address fields.', 'error');
      return;
    }
    setSavingAddress(true);
    const res = await addAddress(newAddress);
    setSavingAddress(false);
    if (res.success && res.address) {
      showToast('Address saved.', 'success');
      setSelectedAddressId(res.address.id);
      setShowAddAddress(false);
    } else {
      showToast(res.error || 'Could not save address.', 'error');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      showToast('Please select or add a delivery address.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post<{ success: boolean; order: PlacedOrder }>('/api/orders', {
        addressId: selectedAddressId,
        paymentMethod,
        paymentReference: paymentReference || undefined,
        couponCode: couponCode || undefined,
      });
      setPlacedOrder(res.order);
      await refreshCart();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not place your order. Please try again.';
      showToast(message, 'error');
    } finally {
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
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              If you haven't paid yet, please complete the UPI payment using the reference note "{placedOrder.orderNumber}" so we can match it to your order.
            </p>
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

            {showAddAddress && (
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Full Name" value={newAddress.fullName} onChange={(e) => setNewAddress((a) => ({ ...a, fullName: e.target.value }))} />
                <Input label="Phone" value={newAddress.phone} onChange={(e) => setNewAddress((a) => ({ ...a, phone: e.target.value }))} />
                <Input label="Address Line 1" className="sm:col-span-2" value={newAddress.addressLine1} onChange={(e) => setNewAddress((a) => ({ ...a, addressLine1: e.target.value }))} />
                <Input label="Address Line 2 (optional)" className="sm:col-span-2" value={newAddress.addressLine2} onChange={(e) => setNewAddress((a) => ({ ...a, addressLine2: e.target.value }))} />
                <Input label="City" value={newAddress.city} onChange={(e) => setNewAddress((a) => ({ ...a, city: e.target.value }))} />
                <Input label="State" value={newAddress.state} onChange={(e) => setNewAddress((a) => ({ ...a, state: e.target.value }))} />
                <Input label="Pincode" value={newAddress.pincode} onChange={(e) => setNewAddress((a) => ({ ...a, pincode: e.target.value }))} />
                <Input label="Landmark (optional)" value={newAddress.landmark} onChange={(e) => setNewAddress((a) => ({ ...a, landmark: e.target.value }))} />
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
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                {!config?.upiConfigured ? (
                  <p className="text-xs text-amber-700">
                    UPI payment isn't configured yet. Please choose Cash on Delivery, or contact us at {config?.businessPhone || '[BUSINESS PHONE]'}.
                  </p>
                ) : qrDataUrl ? (
                  <>
                    <img src={qrDataUrl} alt="UPI payment QR code" className="w-40 h-40 mx-auto rounded-lg border border-slate-200 bg-white p-1" />
                    <p className="text-[11px] text-slate-500">
                      Scan with any UPI app and pay <strong>₹{estimatedTotal}</strong> to <strong>{config.upiVpa}</strong>
                    </p>
                  </>
                ) : (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                )}
                <Input
                  label="UPI Transaction / Reference Number (optional)"
                  placeholder="e.g. 123456789012"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 text-left">
                  You can also pay after placing the order and share the reference number from your order history.
                </p>
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
                  <img src={item.product.imageUrl} alt={item.product.name} className="w-10 h-10 rounded-lg object-cover border border-slate-100" />
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

            <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span><span className="font-semibold text-slate-900">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className="font-semibold text-slate-900">
                  {shippingAmount === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${shippingAmount}`}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                <span>Estimated Total</span><span className="text-blue-600">₹{estimatedTotal}</span>
              </div>
              {couponCode && (
                <p className="text-[10px] text-slate-400">Coupon discount (if valid) will be applied when you place the order.</p>
              )}
            </div>

            <Button
              variant="primary"
              className="w-full justify-center py-3"
              loading={submitting}
              disabled={!selectedAddressId}
              onClick={handlePlaceOrder}
            >
              Place Order
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
