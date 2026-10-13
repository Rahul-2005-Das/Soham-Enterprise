import React, { useState } from 'react';
import { KeyRound, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PageRoute } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface AdminLoginPageProps {
  onNavigate: (page: PageRoute) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onNavigate }) => {
  const { loginAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await loginAdmin(email, password);
      if (!result.success) {
        setError(result.error || 'Invalid email or password.');
        return;
      }
      onNavigate('admin-dashboard');
    } catch {
      setError('Unable to sign in right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 flex items-center justify-center">
      <section className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
        <div className="bg-slate-950 px-7 py-8 text-white">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold uppercase text-blue-300">Soham Enterprises</p>
          <h1 className="mt-1 text-2xl font-bold">Admin sign in</h1>
          <p className="mt-2 text-sm text-slate-300">Administrator credentials are required to continue.</p>
        </div>

        <form onSubmit={submit} className="space-y-5 p-7">
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Input label="Administrator email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input label="Password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} icon={<KeyRound className="h-4 w-4" />} />
          <Button type="submit" variant="primary" disabled={submitting} className="w-full justify-center">
            {submitting ? 'Signing in...' : 'Sign in securely'}
            {!submitting && <ArrowRight className="ml-1 h-4 w-4" />}
          </Button>
          <button type="button" onClick={() => onNavigate('home')} className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-900">
            Return to storefront
          </button>
        </form>
      </section>
    </main>
  );
};
