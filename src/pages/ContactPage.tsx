import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, MessageSquare, AlertCircle } from 'lucide-react';
import { COMPANY_INFO } from '../data/mockData';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Section } from '../components/ui/Section';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Service Inquiry');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Contact Banner */}
      <div className="bg-slate-900 text-white py-14 sm:py-20 px-4 border-b border-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 border border-blue-800/60 px-3 py-1 rounded-full">
            We're Here For You
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
            Contact Sohom Enterprises
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Have an appliance breakdown or spare parts inquiry? Reach our customer support desk directly.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Direct Contact Info Cards */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-6 space-y-6">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Customer Support Details
              </h3>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Booking & Support</h4>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{COMPANY_INFO.phone}</p>
                  <p className="text-xs text-slate-500">Mon - Sun: {COMPANY_INFO.workingHours}</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp Instant Chat</h4>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{COMPANY_INFO.whatsapp}</p>
                  <p className="text-xs text-slate-500">Send appliance photos for fast diagnosis</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Helpdesk</h4>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{COMPANY_INFO.email}</p>
                  <p className="text-xs text-slate-500">Invoices, corporate AMCs & partnerships</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Office & Service Hub</h4>
                  <p className="text-xs text-slate-800 font-semibold mt-0.5 leading-relaxed">
                    {COMPANY_INFO.address}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    GSTIN: {COMPANY_INFO.gstin}
                  </p>
                </div>
              </div>
            </Card>

            {/* Emergency 2-hour card */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                <AlertCircle className="w-4 h-4" />
                <span>Emergency 2-Hour Breakdown Line</span>
              </div>
              <p className="text-lg font-black text-white">{COMPANY_INFO.emergencyPhone}</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                For urgent AC gas leakage, water purifier major leaks, or severe electrical short circuits.
              </p>
            </div>
          </div>

          {/* Right Column: Contact Inquiry Form */}
          <div className="lg:col-span-7">
            <Card className="p-6 sm:p-8">
              <h3 className="text-xl font-bold text-slate-900">Send Us an Inquiry</h3>
              <p className="text-xs text-slate-500 mt-1 mb-6">
                Fill in your details below and our service supervisor will get back to you within 60 minutes.
              </p>

              {submitted ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">Inquiry Received!</h4>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                    Thank you, {name || 'valued customer'}. Your message regarding "{subject}" has been assigned to our customer service desk.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setSubmitted(false);
                      setMessage('');
                    }}
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      required
                      placeholder="e.g. Anirban Roy"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <Input
                      label="Phone Number"
                      required
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Inquiry Topic
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-3.5 text-slate-900 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                      >
                        <option value="Service Inquiry">Book Appliance Service</option>
                        <option value="Spare Part Availability">Spare Part Stock Inquiry</option>
                        <option value="Warranty Claim">Warranty / Free Revisit Request</option>
                        <option value="Commercial AMC">Commercial / Corporate AMC</option>
                        <option value="Other Feedback">General Feedback</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Your Message / Appliance Symptoms
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Please mention your appliance model, problem symptoms, or spare part requirements..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full justify-center shadow-blue-500/20"
                      icon={<Send className="w-4 h-4" />}
                    >
                      Submit Message
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
