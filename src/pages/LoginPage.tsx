import React, { useEffect, useState } from 'react';
import { Wrench, Mail, Lock, KeyRound, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { PageRoute } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onNavigate: (page: PageRoute) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { user, login, requestLoginCode, verifyLoginCode, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'code' | 'password'>('code');
  const [codeRequested, setCodeRequested] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown === 0) return;

    const timeout = window.setTimeout(() => {
      setResendCooldown((remaining) => Math.max(remaining - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid credentials.');
      } else {
        // Successfully logged in
        onNavigate('profile');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestCode = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setIsRequestingCode(true);
    try {
      const result = await requestLoginCode(email);
      if (!result.success) {
        setErrorMessage(result.error || 'Could not request a sign-in code.');
        return;
      }
      setCodeRequested(true);
      setCode('');
      setResendCooldown(60);
      setInfoMessage(result.message || 'If this email can receive messages, a sign-in code has been sent.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not request a sign-in code.');
    } finally {
      setIsRequestingCode(false);
    }
  };

  const verifyCode = async () => {
    setErrorMessage(null);
    if (!/^\d{6}$/.test(code)) {
      setErrorMessage('Enter the 6-digit code from your email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await verifyLoginCode(email, code);
      if (!result.success) {
        setErrorMessage(result.error || 'Invalid or expired verification code.');
      } else {
        onNavigate('profile');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not verify the sign-in code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    if (mode === 'code') {
      e.preventDefault();
      if (codeRequested) {
        void verifyCode();
      } else {
        void requestCode();
      }
      return;
    }
    void handleSubmit(e);
  };

  if (user) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full mx-auto space-y-6">
          <Card className="p-8 text-center space-y-5 border-slate-200 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Already Signed In</h3>
              <p className="text-sm text-slate-600 mt-1">
                You are currently authenticated as <span className="font-semibold text-slate-900">{user.email}</span> ({user.role}).
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2.5">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center"
                onClick={() => onNavigate('profile')}
              >
                Go to My Account
              </Button>
              <Button
                variant="outline"
                size="md"
                className="w-full justify-center"
                onClick={() => onNavigate('home')}
              >
                Back to Homepage
              </Button>
              <button
                type="button"
                onClick={logout}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium pt-2"
              >
                Sign out of this session
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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
          <h2 className="text-xl font-bold text-slate-900">Secure Sign In</h2>
          <p className="text-xs text-slate-500">
            Access doorstep technician bookings, genuine spare parts tracking, and invoices.
          </p>
        </div>

        <Card className="p-6 sm:p-8 border-slate-200 shadow-sm">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 mb-5" role="tablist" aria-label="Sign-in method">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'code'}
              onClick={() => { setMode('code'); setErrorMessage(null); }}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${mode === 'code' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Email code
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'password'}
              onClick={() => { setMode('password'); setErrorMessage(null); }}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${mode === 'password' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Password
            </button>
          </div>

          {mode === 'code' && (
            <p className="mb-4 text-center text-xs text-slate-500">
              Sign in or create a customer account with a one-time email code.
            </p>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              required
              placeholder="e.g. yourname@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setCodeRequested(false);
                setInfoMessage(null);
                setCode('');
                setResendCooldown(0);
              }}
              icon={<Mail className="w-4 h-4" />}
            />

            {mode === 'password' ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => onNavigate('forgot-password')}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  className="w-full justify-center mt-2 shadow-blue-600/20"
                  id="login-submit-btn"
                >
                  {isSubmitting ? 'Authenticating...' : 'Sign In'}
                  {!isSubmitting && <ArrowRight className="w-4 h-4 ml-1.5" />}
                </Button>
              </>
            ) : (
              <>
                {codeRequested && (
                  <>
                    {infoMessage && <p className="text-xs text-emerald-700" role="status">{infoMessage}</p>}
                    <Input
                      label="6-Digit Email Code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      icon={<KeyRound className="w-4 h-4" />}
                    />
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Code expires in 10 minutes.</span>
                      <button
                        type="button"
                        onClick={requestCode}
                        disabled={isRequestingCode || resendCooldown > 0}
                        className="font-semibold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400"
                      >
                        {isRequestingCode ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                      </button>
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isSubmitting || code.length !== 6}
                      className="w-full justify-center mt-2"
                    >
                      {isSubmitting ? 'Verifying...' : 'Verify & Sign In'}
                      {!isSubmitting && <ArrowRight className="w-4 h-4 ml-1.5" />}
                    </Button>
                  </>
                )}
                {!codeRequested && (
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isRequestingCode}
                    className="w-full justify-center mt-2 shadow-blue-600/20"
                  >
                    {isRequestingCode ? 'Sending Code...' : 'Send Sign-in Code'}
                    {!isRequestingCode && <ArrowRight className="w-4 h-4 ml-1.5" />}
                  </Button>
                )}
              </>
            )}
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              New to Soham?{' '}
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="text-blue-600 hover:text-blue-700 font-bold ml-1 hover:underline"
                id="login-to-register-btn"
              >
                Create an account
              </button>
            </p>
          </div>
        </Card>

        <div className="text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Protected by HTTP-only secure cookie sessions & bcrypt encryption
          </p>
        </div>
      </div>
    </div>
  );
};
