import React, { useState } from 'react';
import {
  Shield,
  UserPlus,
  Wrench,
  Mail,
  Lock,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { PageRoute, UserRole } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

interface AdminUsersPageProps {
  onNavigate: (page: PageRoute) => void;
}

export const AdminUsersPage: React.FC<AdminUsersPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'TECHNICIAN' | 'ADMIN'>('TECHNICIAN');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdStaff, setCreatedStaff] = useState<any | null>(null);

  // Guard: Admin Only
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 px-4">
        <Card className="p-8 max-w-md w-full text-center space-y-4 border-slate-200 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">403: Forbidden Access</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Staff provisioning is strictly restricted to administrator clearance. Your current role ({user ? user.role : 'Guest'}) is not permitted to view or execute staff provisioning operations.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Button
              variant="primary"
              size="md"
              className="w-full justify-center"
              onClick={() => onNavigate(user ? 'profile' : 'login')}
            >
              {user ? 'Return to My Account' : 'Sign in as Administrator'}
            </Button>
            <Button
              variant="outline"
              size="md"
              className="w-full justify-center"
              onClick={() => onNavigate('home')}
            >
              Return to Homepage
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setCreatedStaff(null);

    if (password.length < 8) {
      setErrorMessage('Staff password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          password,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to provision staff user.');
      } else {
        setSuccessMessage(`Successfully provisioned ${role.toLowerCase()} account for ${name}.`);
        setCreatedStaff(data.user);
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred during staff provisioning.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('profile')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Account Profile
          </button>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
            <Shield className="w-3 h-3 text-purple-600" /> Admin Clearance Verified
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Staff Account Provisioning</h1>
              <p className="text-xs text-slate-500">
                Authorize and initialize internal accounts for certified field technicians and administrators.
              </p>
            </div>
          </div>
        </div>

        {/* Informative Notice on Role Boundaries */}
        <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-4 text-xs text-purple-900 leading-relaxed space-y-1.5">
          <div className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-700" /> Role Boundary & Security Policy:
          </div>
          <p>
            Public customer registrations are locked strictly to the <strong>CUSTOMER</strong> role. Client applications can never promote or specify elevated roles. Only authenticated administrators can issue verified credentials for <strong>TECHNICIAN</strong> and <strong>ADMIN</strong> roles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 md:col-span-2 border-slate-200 space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">New Staff Credentials</h3>
              <p className="text-xs text-slate-500">Fill in the staff member's official details.</p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
                {createdStaff && (
                  <div className="bg-white p-3 rounded-lg border border-emerald-100 text-[11px] font-mono text-slate-700 space-y-1">
                    <div>User ID: {createdStaff.id}</div>
                    <div>Email: {createdStaff.email}</div>
                    <div>Role: {createdStaff.role}</div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Staff Role Tier</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('TECHNICIAN')}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      role === 'TECHNICIAN'
                        ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Wrench className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Certified Technician</div>
                      <div className="text-[10px] text-slate-500">Field repairs & appointments</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      role === 'ADMIN'
                        ? 'border-purple-500 bg-purple-50/50 ring-1 ring-purple-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-purple-600 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Administrator</div>
                      <div className="text-[10px] text-slate-500">Catalog, staff & dispatch control</div>
                    </div>
                  </button>
                </div>
              </div>

              <Input
                label="Staff Member Full Name"
                type="text"
                required
                placeholder="e.g. Subir Karmakar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<User className="w-4 h-4" />}
              />

              <Input
                label="Official Email Address"
                type="email"
                required
                placeholder="subir.tech@sohomenterprises.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Mobile Phone Number"
                type="tel"
                placeholder="+91 98300 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                icon={<Phone className="w-4 h-4" />}
              />

              <Input
                label="Initial Temporary Password (min 8 characters)"
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                helperText="Hashed securely before storage. The staff member can change it upon initial login."
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                className="w-full justify-center shadow-purple-600/20 bg-purple-700 hover:bg-purple-800"
              >
                {isSubmitting ? 'Provisioning Staff...' : `Create ${role} Account`}
              </Button>
            </form>
          </Card>

          <Card className="p-6 border-slate-200 space-y-4 h-fit">
            <h3 className="text-sm font-bold text-slate-900">Provisioning Guidelines</h3>
            <ul className="text-xs text-slate-600 space-y-2.5 list-disc pl-4 leading-relaxed">
              <li><strong>Technicians:</strong> An employee code and skills array will be automatically attached to their technician record in PostgreSQL.</li>
              <li><strong>Administrators:</strong> Receive full administrative clearance across catalogs, bookings, and user management.</li>
              <li>Always verify staff identity before issuing credentials.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
