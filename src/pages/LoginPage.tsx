import React, { useState } from 'react';
import { Wrench, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2, User, KeyRound } from 'lucide-react';
import { PageRoute } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onNavigate: (page: PageRoute) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { user, login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleQuickFill = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setErrorMessage(null);
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
              Sohom <span className="text-blue-600 font-extrabold">Enterprises</span>
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Secure Sign In</h2>
          <p className="text-xs text-slate-500">
            Access doorstep technician bookings, genuine spare parts tracking, and invoices.
          </p>
        </div>

        {/* Quick Testing Role Presets */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 text-xs text-blue-900">
          <div className="flex items-center justify-between font-semibold mb-2">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" /> Quick Credential Select:
            </span>
            <span className="text-[10px] text-blue-600 uppercase tracking-wide">Test Accounts</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickFill('customer_test1@example.com', 'FinalPassword789!')}
              className="px-2 py-1.5 bg-white border border-blue-200 rounded-lg hover:bg-blue-100/60 transition text-left text-[11px] font-medium"
            >
              <div className="font-bold text-slate-800">Customer</div>
              <div className="text-[10px] text-slate-500 truncate">customer_test1</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@sohomenterprises.com', 'Admin@2026Sohom')}
              className="px-2 py-1.5 bg-white border border-blue-200 rounded-lg hover:bg-blue-100/60 transition text-left text-[11px] font-medium"
            >
              <div className="font-bold text-slate-800">Admin</div>
              <div className="text-[10px] text-slate-500 truncate">admin@sohom</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('technician@sohomenterprises.com', 'Tech@2026Sohom')}
              className="px-2 py-1.5 bg-white border border-blue-200 rounded-lg hover:bg-blue-100/60 transition text-left text-[11px] font-medium"
            >
              <div className="font-bold text-slate-800">Technician</div>
              <div className="text-[10px] text-slate-500 truncate">technician@</div>
            </button>
          </div>
        </div>

        <Card className="p-6 sm:p-8 border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
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
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
            />

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
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="text-blue-600 hover:text-blue-700 font-bold ml-1 hover:underline"
                id="login-to-register-btn"
              >
                Register as Customer
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
