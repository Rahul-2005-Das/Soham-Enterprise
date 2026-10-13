import React, { useEffect, useState } from 'react';
import { Wrench, Lock, KeyRound, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { PageRoute } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

interface ResetPasswordPageProps {
  onNavigate: (page: PageRoute) => void;
  initialEmail?: string;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onNavigate, initialEmail = '' }) => {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (resendCooldown === 0) return;

    const timeout = window.setTimeout(() => {
      setResendCooldown((remaining) => Math.max(remaining - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [resendCooldown]);

  const resendCode = async () => {
    setErrorMessage(null);
    if (!email.trim() || resendCooldown > 0) return;

    setIsResendingCode(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Request could not be processed.');
        return;
      }

      setCode('');
      setCodeVerified(false);
      setPassword('');
      setConfirmPassword('');
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error.');
    } finally {
      setIsResendingCode(false);
    }
  };

  const verifyCode = async () => {
    setErrorMessage(null);
    if (!email.trim()) {
      setErrorMessage('A valid email address is required.');
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setErrorMessage('Verification code must be a 6-digit number.');
      return;
    }

    setIsVerifyingCode(true);
    try {
      const res = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Verification failed.');
        return;
      }
      setCodeVerified(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!codeVerified) {
      setErrorMessage('Please verify the 6-digit code before setting a new password.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('A valid email address is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Password reset failed.');
      } else {
        setSuccess(true);
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
          <h2 className="text-xl font-bold text-slate-900">{codeVerified ? 'Set New Password' : 'Verify Your Code'}</h2>
          <p className="text-xs text-slate-500">
            {codeVerified ? 'Choose a new password for your account.' : 'Enter the 6-digit code from your email to continue.'}
          </p>
        </div>

        <Card className="p-6 sm:p-8 border-slate-200 shadow-sm">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Password Updated Successfully</h3>
              <p className="text-xs text-slate-600">
                Your credentials have been securely updated in our encrypted database. You can now log into your account.
              </p>
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center mt-2"
                onClick={() => onNavigate('login')}
              >
                Sign In With New Password
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setCode('');
                  setCodeVerified(false);
                  setPassword('');
                  setConfirmPassword('');
                  setResendCooldown(0);
                }}
                icon={<KeyRound className="w-4 h-4" />}
              />

              <Input
                label="6-Digit Verification Code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                placeholder="123456"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setCodeVerified(false);
                  setPassword('');
                  setConfirmPassword('');
                }}
                icon={<KeyRound className="w-4 h-4" />}
              />

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>If your account matches, a code was sent to your email.</span>
                <button
                  type="button"
                  onClick={resendCode}
                  disabled={isResendingCode || resendCooldown > 0}
                  className="font-semibold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {isResendingCode ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>

              <Button
                type="button"
                variant={codeVerified ? 'primary' : 'outline'}
                size="md"
                onClick={verifyCode}
                disabled={isVerifyingCode || (!codeVerified && code.length !== 6)}
                className="w-full justify-center"
              >
                {isVerifyingCode ? 'Verifying...' : codeVerified ? 'Code Verified Successfully' : 'Verify Code'}
              </Button>

              {codeVerified && (
                <>
                  <p className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700" role="status">
                    <CheckCircle2 className="h-4 w-4" />
                    Code Verified Successfully
                  </p>
                  <Input
                    label="New Password (min 8 characters)"
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isSubmitting}
                    className="w-full justify-center mt-2 shadow-blue-600/20"
                  >
                    {isSubmitting ? 'Updating Password...' : 'Save New Password'}
                    {!isSubmitting && <ArrowRight className="w-4 h-4 ml-1.5" />}
                  </Button>
                </>
              )}

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium"
                >
                  Cancel and return to Sign In
                </button>
              </div>
            </form>
          )}
        </Card>

        <div className="text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verification codes are single-use, expire in 10 minutes, and are invalid after a successful reset.
          </p>
        </div>
      </div>
    </div>
  );
};
