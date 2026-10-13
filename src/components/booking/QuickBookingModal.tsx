import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, MapPin, Phone, CheckCircle, Shield, AlertCircle } from 'lucide-react';
import { useCatalog } from '../../context/CatalogContext';
import { Button } from '../ui/Button';
import { useSite } from '../../context/SiteContext';
import { useAuth } from '../../context/AuthContext';

interface QuickBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultServiceId?: string;
}

const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;

function applianceIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('purifier') || lower.includes('water') || lower.includes('filter')) return '💧';
  if (lower.includes('air conditioner') || lower.includes(' ac') || lower.startsWith('ac ')) return '❄️';
  if (lower.includes('fridge') || lower.includes('refrigerator')) return '🧊';
  if (lower.includes('washing machine') || lower.includes('washer')) return '🧺';
  if (lower.includes('geyser') || lower.includes('water heater')) return '🚿';
  if (lower.includes('microwave')) return '♨️';
  return '🔧';
}

export const QuickBookingModal: React.FC<QuickBookingModalProps> = ({
  isOpen,
  onClose,
  defaultServiceId
}) => {
  const { services, servicesLoading, servicesError } = useCatalog();
  const { user } = useAuth();
  const { t } = useSite();

  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedProblem, setSelectedProblem] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('09:00 AM - 12:00 PM');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Kolkata');
  const [state, setState] = useState('West Bengal');
  const [pincode, setPincode] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  // Error state: shown inline in the form so a failed request never looks like success,
  // and the user's typed-in values are left untouched so they can just retry.
  const [errorMessage, setErrorMessage] = useState('');
  const [pincodeError, setPincodeError] = useState('');
  const [bookingStep, setBookingStep] = useState<1 | 2>(1);

  const resetFormState = () => {
    const nextServiceId = services.find((service) => service.id === defaultServiceId)?.id
      || services[0]?.id
      || '';
    setSelectedServiceId(nextServiceId);
    setSelectedProblem('');
    setScheduledDate('');
    setTimeSlot('09:00 AM - 12:00 PM');
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setAddress('');
    setCity('Kolkata');
    setState('West Bengal');
    setPincode('');
    setNotes('');
    setSubmitted(false);
    setIsSubmitting(false);
    setBookingRef('');
    setErrorMessage('');
    setPincodeError('');
    setBookingStep(1);
  };

  useEffect(() => {
    if (!isOpen) return;

    if (user) {
      const savedAddress = user.addresses?.find((item) => item.isDefault) || user.addresses?.[0];
      setName(user.name);
      setPhone(user.phone || '');
      if (savedAddress) {
        setAddress([savedAddress.addressLine1, savedAddress.addressLine2, savedAddress.landmark].filter(Boolean).join(', '));
        setCity(savedAddress.city);
        setState(savedAddress.state);
        setPincode(savedAddress.pincode);
      }
    }
    setSelectedServiceId((current) => services.find((service) => service.id === defaultServiceId)?.id
      || services.find((service) => service.id === current)?.id
      || services[0]?.id
      || '');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        resetFormState();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, defaultServiceId, services, user]);

  const handleClose = () => {
    resetFormState();
    onClose();
  };

  if (!isOpen) return null;

  const currentService = services.find((service) => service.id === selectedServiceId);

  if (!currentService) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
        <div role="status" className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl">
          <p className="text-sm text-slate-700">
            {servicesLoading ? 'Loading published services…' : servicesError || 'No published services are available for booking right now.'}
          </p>
          <Button variant="outline" onClick={onClose} className="mt-4">Close</Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!services.some((service) => service.id === selectedServiceId)) {
      setErrorMessage('This service is no longer available. Please choose an active service.');
      return;
    }

    if (!PINCODE_PATTERN.test(pincode.trim())) {
      setPincodeError('Enter a valid 6-digit pincode.');
      return;
    }
    setPincodeError('');

    const sanitizedPhone = phone.replace(/\D/g, '');
    if (sanitizedPhone.length < 10 || sanitizedPhone.length > 15) {
      setErrorMessage('Enter a valid phone number with 10 to 15 digits.');
      return;
    }

    setIsSubmitting(true);
    try {
      const preferredDate = new Date(scheduledDate).toISOString();
      const res = await fetch('/api/service-bookings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          appliance: currentService.shortDescription || currentService.name,
          problemDescription: selectedProblem || 'Doorstep general checkup & diagnostic required',
          preferredDate,
          preferredTimeSlot: timeSlot,
          customerNotes: notes.trim() || undefined,
          address: {
            fullName: name.trim(),
            phone: sanitizedPhone,
            addressLine1: address.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim(),
          },
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // Non-JSON response body - treated as a failure below (data stays null).
      }

      // Only ever treat this as a success when the server genuinely confirms it: a 2xx status,
      // an explicit success flag, and a real booking number. Anything else - a non-2xx status,
      // a malformed/empty body, or success:false - is a failure and must NOT show the
      // "Service Visit Scheduled!" screen. The booking was only actually created in the
      // database when the server says so; showing success on a failed request would tell the
      // customer a technician is coming when no booking exists.
      const bookingId = data?.bookingId || data?.booking?.id;
      if (res.ok && data?.success && bookingId) {
        setBookingRef(data?.bookingNumber || bookingId);
        setSubmitted(true);
      } else {
        setErrorMessage(
          data?.error || 'We could not confirm your booking. Please check your details and try again.'
        );
      }
    } catch (err) {
      // Network-level failure (offline, server unreachable, etc.)
      setErrorMessage('Network error - could not reach the server. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    if (bookingStep === 1) {
      event.preventDefault();
      if (!selectedServiceId || !scheduledDate) {
        setErrorMessage('Choose your appliance and a visit date to continue.');
        return;
      }
      setErrorMessage('');
      setBookingStep(2);
      return;
    }
    void handleSubmit(event);
  };

  const handleReset = () => {
    resetFormState();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8 animate-in fade-in duration-150"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close booking form"
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shadow-sm border border-slate-200 bg-white/90"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">Booking received</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Thank you, <strong>{name || 'Customer'}</strong>! Your service request for{' '}
              <strong>{currentService.shortDescription || currentService.name}</strong> has been saved. We will contact{' '}
              <strong>{phone || 'your phone'}</strong> to confirm your requested doorstep slot.
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2 mt-4 max-w-md mx-auto">
              {bookingRef && (
                <div className="flex justify-between items-center py-1 px-2.5 bg-blue-50/80 rounded-lg border border-blue-100 mb-2">
                  <span className="text-blue-700 font-semibold">Booking ID:</span>
                  <span className="font-mono font-bold text-blue-900">{bookingRef}</span>
                </div>
              )}
              <div className="flex justify-between"><span className="text-slate-500">Status:</span><span className="font-semibold text-amber-700">Pending confirmation</span></div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-slate-900">{currentService.shortDescription || currentService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Date:</span>
                <span className="font-semibold text-slate-900">{scheduledDate || 'Today (Fast Track)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Slot:</span>
                <span className="font-semibold text-slate-900">{timeSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Diagnostic Fee:</span>
                <span className="font-bold text-blue-600">₹{Number(currentService.inspectionFee)} (Adjustable in repair)</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="primary" onClick={handleReset} className="w-full sm:w-auto px-8">
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                Fast Doorstep Booking
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                {t('bookingTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {t('bookingIntro')}
              </p>
              <ol aria-label="Booking progress" className="mt-5 grid grid-cols-2 gap-2">
                {[t('chooseAppliance'), t('yourDetails')].map((step, index) => {
                  const active = bookingStep === index + 1;
                  const complete = bookingStep > index + 1;
                  return <li key={step} aria-current={active ? 'step' : undefined} className={`flex min-h-12 items-center gap-2 rounded-xl px-3 text-sm font-bold ${active || complete ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20">{complete ? '✓' : index + 1}</span>
                    <span>{step}</span>
                  </li>;
                })}
              </ol>
            </div>

            {errorMessage && (
              <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Booking not confirmed</p>
                  <p className="text-rose-700/90 text-[11px] mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {bookingStep === 1 && <>
              {/* Appliance Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {t('chooseAppliance')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {services.map((srv) => (
                    <button
                      type="button"
                      key={srv.id}
                      onClick={() => {
                        setSelectedServiceId(srv.id);
                        setSelectedProblem('');
                      }}
                      aria-pressed={selectedServiceId === srv.id}
                      className={`min-h-28 rounded-xl border p-3 text-sm font-bold text-left transition flex flex-col justify-between ${
                        selectedServiceId === srv.id
                          ? 'border-blue-700 bg-blue-50 text-blue-900 ring-2 ring-blue-700/30'
                          : 'border-slate-300 bg-white hover:border-blue-500 text-slate-800'
                      }`}
                    >
                      <span aria-hidden="true" className="text-3xl">{applianceIcon(srv.name)}</span>
                      <span className="line-clamp-2">{srv.shortDescription || srv.name}</span>
                      <span className="text-xs text-slate-600 font-semibold">
                        from ₹{Number(srv.inspectionFee)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="booking-issue" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('issue')}
                </label>
                <input
                  type="text"
                  id="booking-issue"
                  value={selectedProblem}
                  onChange={(e) => setSelectedProblem(e.target.value)}
                  placeholder="Describe the problem (optional)"
                  className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base text-slate-900 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20"
                />
              </div>

              {/* Date and Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="booking-date" className="block text-sm font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-blue-700" /> {t('preferredDate')}
                  </label>
                  <input id="booking-date" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="min-h-12 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-base text-slate-900 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20" required />
                </div>
                <div>
                  <label htmlFor="booking-time-slot" className="block text-sm font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-blue-700" /> {t('preferredSlot')}
                  </label>
                  <select id="booking-time-slot" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base text-slate-900 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20">
                    <option value="09:00 AM - 12:00 PM">Morning (09:00 AM - 12:00 PM)</option>
                    <option value="12:00 PM - 03:00 PM">Afternoon (12:00 PM - 03:00 PM)</option>
                    <option value="03:00 PM - 06:00 PM">Late Afternoon (03:00 PM - 06:00 PM)</option>
                    <option value="06:00 PM - 09:00 PM">Evening (06:00 PM - 09:00 PM)</option>
                  </select>
                </div>
              </div>
              </>}

              {bookingStep === 2 && <>
              <div className="flex items-center gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
                <span aria-hidden="true" className="text-4xl">{applianceIcon(currentService.name)}</span>
                <div className="min-w-0 text-sm">
                  <p className="font-extrabold">{currentService.shortDescription || currentService.name}</p>
                  <p className="mt-1">{new Date(`${scheduledDate}T00:00:00`).toLocaleDateString()} · {timeSlot}</p>
                </div>
              </div>
              {/* Symptom / Problem Selector */}
              {/* Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="booking-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {t('yourName')}
                  </label>
                  <input
                    type="text"
                    id="booking-name"
                    required
                    placeholder="e.g. Ramesh Ghosh"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="min-h-12 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-base text-slate-900 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20"
                  />
                </div>

                <div>
                  <label htmlFor="booking-phone" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-blue-600" /> {t('contactPhone')}
                  </label>
                  <input
                    type="tel"
                    id="booking-phone"
                    required
                    maxLength={15}
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="min-h-12 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-base text-slate-900 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20"
                  />
                </div>
              </div>

              {/* Doorstep Address */}
              <div>
                <label htmlFor="booking-address" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" /> {t('serviceAddress')}
                </label>
                <textarea
                  required
                  id="booking-address"
                  rows={2}
                  placeholder="Flat No, Building, Street, Landmark"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="min-h-16 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-base text-slate-900 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20 resize-none"
                />
              </div>

              {/* Pincode */}
              <div>
                <label htmlFor="booking-pincode" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('pincode')}
                </label>
                <input
                  type="text"
                  id="booking-pincode"
                  inputMode="numeric"
                  required
                  maxLength={6}
                  aria-invalid={Boolean(pincodeError)}
                  aria-describedby={pincodeError ? 'booking-pincode-error' : undefined}
                  placeholder="e.g. 700045"
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6));
                    if (pincodeError) setPincodeError('');
                  }}
                  className={`min-h-12 w-full rounded-xl border px-3.5 py-2 text-base text-slate-900 focus:ring-2 ${
                    pincodeError
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
                  }`}
                />
                {pincodeError && <p id="booking-pincode-error" role="alert" className="mt-1 text-[11px] font-semibold text-rose-600">{pincodeError}</p>}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="booking-city" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">{t('city')}</label>
                  <input id="booking-city" required value={city} onChange={(event) => setCity(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-base text-slate-900 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20" />
                </div>
                <div>
                  <label htmlFor="booking-state" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">{t('state')}</label>
                  <input id="booking-state" required value={state} onChange={(event) => setState(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-base text-slate-900 focus:border-blue-700 focus:ring-2 focus:ring-blue-700/20" />
                </div>
              </div>
              </>}

              {/* Price & Guarantee Note */}
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
                <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{t('inspectionFee')} ₹{Number(currentService.inspectionFee)}</p>
                  <p className="text-blue-700/90 text-[11px] mt-0.5">
                    If repair is carried out, inspection fee is adjusted in the final bill. 30-Day post-service warranty included.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                {bookingStep === 2 && <Button variant="outline" type="button" onClick={() => setBookingStep(1)} className="min-h-14 flex-1 justify-center py-3 text-base">{t('back')}</Button>}
                <Button
                  variant="primary"
                  type="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  className="min-h-14 flex-1 justify-center py-3 text-base"
                >
                  {bookingStep === 1 ? t('next') : isSubmitting ? 'Confirming...' : t('submitBooking')}
                </Button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="sm:w-auto px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
