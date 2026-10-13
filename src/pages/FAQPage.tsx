import React, { useState } from 'react';
import { Search, ChevronDown, HelpCircle, PhoneCall, MessageSquare } from 'lucide-react';
import { FAQS_LIST } from '../data/mockData';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { normalizePhoneForTel, normalizeWhatsappNumber, useSite } from '../context/SiteContext';

export const FAQPage: React.FC = () => {
  const { settings } = useSite();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openIndex, setOpenIndex] = useState<string | null>(FAQS_LIST[0].id);

  const managedFaqs = settings.faqContent
    .split(/\r?\n/)
    .map((line, index) => {
      const separator = line.indexOf('|');
      if (separator < 1) return null;
      const question = line.slice(0, separator).trim();
      const answer = line.slice(separator + 1).trim();
      return question && answer ? { id: `managed-faq-${index}`, category: 'Business information', question, answer } : null;
    })
    .filter((faq): faq is NonNullable<typeof faq> => faq !== null);
  const faqs = managedFaqs.length > 0 ? managedFaqs : FAQS_LIST;
  const categories = managedFaqs.length > 0
    ? ['All', 'Business information']
    : ['All', 'Booking & Inspection', 'Spare Parts & Authenticity', 'Warranty & Revisit', 'Technician Safety'];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || faq.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });
  const phone = settings.phone.trim();
  const whatsapp = normalizeWhatsappNumber(settings.whatsappNumber);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* FAQ Banner */}
      <div className="bg-slate-900 text-white py-14 sm:py-20 px-4 border-b border-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 border border-blue-800/60 px-3 py-1 rounded-full">
            Help Center
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about our appliance repair services, spare parts delivery, and warranties.
          </p>

          {/* Search box */}
          <div className="max-w-xl mx-auto pt-2">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions (e.g. warranty, inspection charge, genuine parts)..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main FAQ Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-8">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQs Accordion */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <Card className="text-center py-12 p-6">
              <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-900">No matching questions found</h4>
              <p className="text-xs text-slate-500 mt-1">Try another search keyword or contact our desk directly.</p>
            </Card>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openIndex === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs transition"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : faq.id)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 hover:text-blue-600 transition"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-2">
                      <div className="pt-3">{faq.answer}</div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Still Have Questions CTA */}
        <Card className="p-8 text-center bg-slate-900 text-white border-slate-800 space-y-4">
          <h3 className="text-xl font-bold">Still have questions?</h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            Our customer service specialists are ready to answer your questions and assist with appliance diagnoses.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {phone && <a
              href={`tel:${normalizePhoneForTel(phone)}`}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Call {phone}</span>
            </a>}
            {whatsapp && <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hello Soham Enterprises')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Chat on WhatsApp</span>
            </a>}
          </div>
        </Card>
      </div>
    </div>
  );
};
