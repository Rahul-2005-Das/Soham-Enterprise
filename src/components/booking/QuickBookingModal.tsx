import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Phone, CheckCircle, Shield, AlertCircle } from 'lucide-react';
import { SERVICES_LIST } from '../../data/mockData';
import { Button } from '../ui/Button';

interface QuickBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultServiceId?: string;
}

export const QuickBookingModal: React.FC<QuickBookingModalProps> = ({
  isOpen,
  onClose,
  defaultServiceId
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState(
    defaultServiceId || SERVICES_LIST[0].id
  );
  const [selectedProblem, setSelectedProblem] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 01:00 PM');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingRef, setBookingRef] = useState('');

  if (!isOpen) return null;

  const currentService =
    SERVICES_LIST.find((s) => s.id === selectedServiceId) || SERVICES_LIST[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          appliance: currentService.shortName,
          problemDescription: selectedProblem || 'Doorstep general checkup & diagnostic required',
          preferredDate: scheduledDate || new Date().toISOString().split('T')[0],
          preferredTimeSlot: timeSlot,
          customerNotes: notes || undefined,
          address: {
            fullName: name,
            phone: phone,
            addressLine1: address,
            city: 'Kolkata',
            state: 'West Bengal',
            pincode: '700001',
          },
        }),
      });
      const data = await res.json();
      if (data?.bookingNumber) {
        setBookingRef(data.bookingNumber);
      }
    } catch (err) {
      console.error('Booking API call failed:', err);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setBookingRef('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8 animate-in fade-in duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">Service Visit Scheduled!</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Thank you, <strong>{name || 'Customer'}</strong>! Your service request for{' '}
              <strong>{currentService.shortName}</strong> has been registered. Our technician coordinator will call{' '}
              <strong>{phone || 'your phone'}</strong> within 30 minutes to confirm your doorstep slot.
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2 mt-4 max-w-md mx-auto">
              {bookingRef && (
                <div className="flex justify-between items-center py-1 px-2.5 bg-blue-50/80 rounded-lg border border-blue-100 mb-2">
                  <span className="text-blue-700 font-semibold">Booking ID:</span>
                  <span className="font-mono font-bold text-blue-900">{bookingRef}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-slate-900">{currentService.shortName}</span>
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
                <span className="font-bold text-blue-600">₹{currentService.startingPrice} (Adjustable in repair)</span>
              </div>
            </div>

            <div className="pt-4">
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
                Book a Technician Visit
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Select your appliance and tell us the problem. Transparent inspection rates.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Appliance Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Select Appliance
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SERVICES_LIST.map((srv) => (
                    <button
                      type="button"
                      key={srv.id}
                      onClick={() => {
                        setSelectedServiceId(srv.id);
                        setSelectedProblem(srv.commonProblems[0]);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition flex flex-col justify-between h-20 ${
                        selectedServiceId === srv.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="line-clamp-2">{srv.shortName}</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        from ₹{srv.startingPrice}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Symptom / Problem Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  2. What seems to be the issue?
                </label>
                <select
                  value={selectedProblem}
                  onChange={(e) => setSelectedProblem(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                >
                  <option value="">Select common symptom or describe below</option>
                  {currentService.commonProblems.map((prob) => (
                    <option key={prob} value={prob}>
                      {prob}
                    </option>
                  ))}
                  <option value="other">Other issue / general inspection</option>
                </select>
              </div>

              {/* Date and Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" /> Preferred Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" /> Preferred Slot
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  >
                    <option value="09:00 AM - 12:00 PM">Morning (09:00 AM - 12:00 PM)</option>
                    <option value="12:00 PM - 03:00 PM">Afternoon (12:00 PM - 03:00 PM)</option>
                    <option value="03:00 PM - 06:00 PM">Late Afternoon (03:00 PM - 06:00 PM)</option>
                    <option value="06:00 PM - 09:00 PM">Evening (06:00 PM - 09:00 PM)</option>
                  </select>
                </div>
              </div>

              {/* Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Ghosh"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-blue-600" /> Contact Phone
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>

              {/* Doorstep Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" /> Doorstep Service Address
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Flat No, Building, Street, Landmark & Pincode"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 resize-none"
                />
              </div>

              {/* Price & Guarantee Note */}
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
                <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Inspection fee ₹{currentService.startingPrice} only</p>
                  <p className="text-blue-700/90 text-[11px] mt-0.5">
                    If repair is carried out, inspection fee is adjusted in the final bill. 30-Day post-service warranty included.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button variant="primary" type="submit" className="w-full justify-center py-3 text-base">
                  Confirm Technician Booking
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
