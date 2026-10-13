import React, { useState } from 'react';
import { Wrench, Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { PageRoute } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

interface ForgotPasswordPageProps {
  onNavigate: (page: PageRoute, params?: any) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Request could not be processed.');
      } else {
        setSuccessMessage(data.message || 'If an account matches this email, a verification code has been sent to your inbox.');
        setTimeout(() => {
          onNavigate('reset-password', { resetEmail: email.trim().toLowerCase() });
        }, 350);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2.5 cursor-pointer justify-center"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              Soham <span className="text-blue-600 font-extrabold">Enterprises</span>
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Reset Your Password</h2>
          <p className="text-xs text-slate-500">
            Enter your account email to receive a one-time verification code.
          </p>
        </div>

        <Card className="p-6 sm:p-8 border-slate-200 shadow-sm">
          {successMessage ? (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-slate-900">Check Your Email</h3>
                <p className="text-xs text-slate-600">{successMessage}</p>
              </div>

              <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 text-left space-y-2">
                <p className="text-[11px] text-slate-600">
                  If an account matches this email, a verification code has been sent. Continue to enter the code and choose a new password.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-center text-xs"
                  onClick={() => {
                    onNavigate('reset-password', { resetEmail: email.trim().toLowerCase() });
                  }}
                >
                  Enter Verification Code
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Input
                label="Registered Email Address"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                helperText="We will send a 6-digit verification code to the email on your account."
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                className="w-full justify-center mt-2 shadow-blue-600/20"
              >
                {isSubmitting ? 'Sending Code...' : 'Send Code'}
                {!isSubmitting && <ArrowRight className="w-4 h-4 ml-1.5" />}
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </button>
              </div>
            </form>
          )}
        </Card>

        <div className="text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verification codes expire in 10 minutes and become invalid after a single successful use.
          </p>
        </div>
      </div>
    </div>
  );
};
