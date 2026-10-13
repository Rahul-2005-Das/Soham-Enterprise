import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { ImagePlus, Star, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export interface SelectableFeedbackOption {
  id: string;
  label: string;
  serviceName: string;
  serviceId?: string;
  type?: 'booking' | 'order' | 'category';
}

interface ReviewSubmissionFormProps {
  productId?: string;
  productName?: string;
  compact?: boolean;
  selectableOptions?: SelectableFeedbackOption[];
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

const defaultCategoryOptions = ['RO Purifier', 'AC Repair', 'Spare Parts', 'General feedback'];

export const ReviewSubmissionForm: React.FC<ReviewSubmissionFormProps> = ({
  productId,
  productName,
  compact = false,
  selectableOptions,
  onSuccess,
  title,
  subtitle,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState(user?.name || '');
  const [rating, setRating] = useState(5);

  const initialOption = selectableOptions && selectableOptions.length > 0 ? selectableOptions[0] : null;
  const [selectedOptionId, setSelectedOptionId] = useState(initialOption ? initialOption.id : '');
  const [serviceName, setServiceName] = useState(
    productName || (initialOption ? initialOption.serviceName : 'General feedback')
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(
    initialOption ? initialOption.serviceId : undefined
  );

  const [comment, setComment] = useState('');
  const [imageData, setImageData] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectableOptions && selectableOptions.length > 0 && !selectedOptionId) {
      setSelectedOptionId(selectableOptions[0].id);
      setServiceName(selectableOptions[0].serviceName);
      setSelectedServiceId(selectableOptions[0].serviceId);
    }
  }, [selectableOptions]);

  useEffect(() => {
    if (user?.name) setFullName(user.name);
  }, [user?.name]);

  const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1_500_000) {
      showToast('Choose a PNG, JPEG, or WebP photo smaller than 1.5 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        showToast('Could not read that photo. Please try another image.', 'error');
        return;
      }
      setImageData(reader.result);
      setImagePreview(reader.result);
    };
    reader.onerror = () => showToast('Could not read that photo. Please try another image.', 'error');
    reader.readAsDataURL(file);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (fullName.trim().length < 2) {
      showToast('Please enter your full name.', 'error');
      return;
    }
    if (comment.trim().length < 10) {
      showToast('Please write at least 10 characters of feedback.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const response = await api.post<{ success: boolean; message?: string }>('/api/reviews', {
        fullName: fullName.trim(),
        rating,
        serviceName: productName || serviceName,
        comment: comment.trim(),
        ...(selectedServiceId ? { serviceId: selectedServiceId } : {}),
        ...(productId ? { productId } : {}),
        ...(imageData ? { imageData } : {}),
      });
      if (!response.success) throw new Error(response.message || 'Could not submit your review.');
      showToast('Thank you! Your review has been submitted for approval.', 'success');
      setComment('');
      setRating(5);
      setImageData('');
      setImagePreview('');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      showToast(error instanceof ApiError || error instanceof Error ? error.message : 'Could not submit your review.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return <section aria-label="Submit a customer review" className={`rounded-2xl border border-amber-200 bg-white shadow-sm ${compact ? 'p-5' : 'p-6 sm:p-8'}`}>
    <div className="mb-5">
      <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Customer feedback</p>
      <h2 className="mt-1 text-xl font-black text-slate-900">{title || (productName ? `Review ${productName}` : 'Share your experience')}</h2>
      <p className="mt-1 text-sm text-slate-600">{subtitle || 'Your review will appear after our team approves it.'}</p>
    </div>
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
        Full name
        <input required minLength={2} maxLength={100} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 px-3 text-base font-normal focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
        Service / product category
        {productName
          ? <input readOnly value={productName} className="min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-base font-normal text-slate-700" />
          : <select
              value={selectedOptionId || serviceName}
              onChange={(event) => {
                const val = event.target.value;
                setSelectedOptionId(val);
                const found = selectableOptions?.find((opt) => opt.id === val);
                if (found) {
                  setServiceName(found.serviceName);
                  setSelectedServiceId(found.serviceId);
                } else {
                  setServiceName(val);
                  setSelectedServiceId(undefined);
                }
              }}
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base font-normal focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {selectableOptions && selectableOptions.length > 0 && (
                <optgroup label="Your Recent Bookings & Orders">
                  {selectableOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="General Categories">
                {defaultCategoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </optgroup>
            </select>}
      </label>
      <fieldset className="sm:col-span-2">
        <legend className="mb-1.5 text-sm font-semibold text-slate-800">Your rating</legend>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating from 1 to 5 stars">
          {[1, 2, 3, 4, 5].map((value) => <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}
            onClick={() => setRating(value)}
            className="rounded p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600"
          ><Star className={`h-8 w-8 ${value <= rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} /></button>)}
          <span className="ml-2 text-sm font-bold text-slate-700">{rating} / 5</span>
        </div>
      </fieldset>
      <label className="grid gap-1.5 text-sm font-semibold text-slate-800 sm:col-span-2">
        Review / feedback
        <textarea required minLength={10} maxLength={3000} rows={compact ? 3 : 4} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Tell us about your experience…" className="resize-y rounded-lg border border-slate-300 p-3 text-base font-normal leading-6 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100" />
      </label>
      <div className="sm:col-span-2">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-400 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <ImagePlus className="h-5 w-5" /> Add optional photo
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleImage} />
        </label>
        {imagePreview && <div className="mt-3 flex items-start gap-3">
          <img src={imagePreview} alt="Review photo preview" className="h-20 w-20 rounded-lg border border-slate-200 object-cover" />
          <button type="button" onClick={() => { setImageData(''); setImagePreview(''); }} className="inline-flex min-h-9 items-center gap-1 rounded px-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"><X className="h-4 w-4" /> Remove photo</button>
        </div>}
      </div>
      <button type="submit" disabled={submitting} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-blue-700 px-5 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60 sm:col-span-2 sm:justify-self-start">
        {submitting ? 'Submitting review…' : 'Submit review'}
      </button>
    </form>
  </section>;
};
