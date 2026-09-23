import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  MapPin,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  LogOut,
  Building,
  Wrench,
  ShieldAlert,
  ArrowRight,
  Check,
} from 'lucide-react';
import { PageRoute, UserAddress } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

interface ProfilePageProps {
  onNavigate: (page: PageRoute) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, logout, updateProfile, changePassword, addAddress, deleteAddress, setDefaultAddress } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'security'>('profile');

  // Profile Edit State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Address Modal/Form State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressFullName, setAddressFullName] = useState(user?.name || '');
  const [addressPhone, setAddressPhone] = useState(user?.phone || '');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('Kolkata');
  const [state, setState] = useState('West Bengal');
  const [pincode, setPincode] = useState('700019');
  const [landmark, setLandmark] = useState('');
  const [isDefault, setIsDefault] = useState(true);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 px-4">
        <Card className="p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Authentication Required</h2>
          <p className="text-xs text-slate-600">
            Please sign in to access your user profile, service history, and saved addresses.
          </p>
          <Button variant="primary" size="md" className="w-full justify-center" onClick={() => onNavigate('login')}>
            Go to Sign In
          </Button>
        </Card>
      </div>
    );
  }

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      const res = await updateProfile({ name, phone });
      if (res.success) {
        setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });
      } else {
        setProfileMessage({ type: 'error', text: res.error || 'Failed to update profile.' });
      }
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Error occurred.' });
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordMessage(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      setPasswordSaving(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      setPasswordSaving(false);
      return;
    }

    try {
      const res = await changePassword({ currentPassword, newPassword, confirmNewPassword });
      if (res.success) {
        setPasswordMessage({ type: 'success', text: res.message || 'Password changed successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: res.error || 'Failed to change password.' });
      }
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Error changing password.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  // Handle Add Address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressSaving(true);
    setAddressError(null);

    try {
      const res = await addAddress({
        fullName: addressFullName,
        phone: addressPhone,
        addressLine1,
        addressLine2: addressLine2 || undefined,
        city,
        state,
        pincode,
        landmark: landmark || undefined,
        isDefault,
      });

      if (!res.success) {
        setAddressError(res.error || 'Could not save address.');
      } else {
        setShowAddressModal(false);
        setAddressLine1('');
        setAddressLine2('');
        setLandmark('');
      }
    } catch (err: any) {
      setAddressError(err.message || 'Error saving address.');
    } finally {
      setAddressSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Shield className="w-3 h-3 text-purple-600" /> Administrator
          </span>
        );
      case 'TECHNICIAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Wrench className="w-3 h-3 text-amber-600" /> Certified Technician
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <User className="w-3 h-3 text-blue-600" /> Verified Customer
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-600/20">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
                {getRoleBadge(user.role)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                <span>{user.email}</span>
                <span>•</span>
                <span>Member since {new Date(user.createdAt).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user.role === 'ADMIN' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('admin-users')}
                className="text-xs text-purple-700 border-purple-200 bg-purple-50/50 hover:bg-purple-100"
              >
                <Shield className="w-3.5 h-3.5 mr-1" />
                Staff Management
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await logout();
                onNavigate('home');
              }}
              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Admin Navigation Banner if Admin */}
        {user.role === 'ADMIN' && (
          <div className="bg-purple-900 text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="space-y-0.5">
              <div className="text-sm font-bold flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-300" /> Administrator Privileges Active
              </div>
              <div className="text-xs text-purple-200">
                You have authorized clearance to provision staff accounts (Technicians & Admins).
              </div>
            </div>
            <button
              onClick={() => onNavigate('admin-users')}
              className="px-3 py-1.5 bg-white text-purple-900 text-xs font-bold rounded-lg hover:bg-purple-50 transition inline-flex items-center gap-1.5 self-start sm:self-center"
            >
              Open Staff Management <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Tabs Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Profile Details
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'addresses'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" /> Saved Addresses ({user.addresses?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'security'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Password & Security
          </button>
        </div>

        {/* Tab 1: Profile Details */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 md:col-span-2 border-slate-200 space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
                <p className="text-xs text-slate-500">Update your primary contact details for doorstep technician visits.</p>
              </div>

              {profileMessage && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    profileMessage.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-rose-50 border border-rose-200 text-rose-700'
                  }`}
                >
                  {profileMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{profileMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <Input
                  label="Full Name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  icon={<User className="w-4 h-4" />}
                />

                <Input
                  label="Email Address (Login Identity)"
                  type="email"
                  disabled
                  value={user.email}
                  icon={<Mail className="w-4 h-4" />}
                  helperText="Primary email cannot be changed directly to prevent security mismatch."
                />

                <Input
                  label="Mobile Phone Number"
                  type="tel"
                  placeholder="+91 98300 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  icon={<Phone className="w-4 h-4" />}
                  helperText="Used by our dispatch desk and assigned technicians."
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={profileSaving}
                  className="shadow-blue-600/20"
                >
                  {profileSaving ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </form>
            </Card>

            <Card className="p-6 border-slate-200 space-y-4 h-fit">
              <h3 className="text-sm font-bold text-slate-900">Account Status</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Role Tier</span>
                  <span className="font-semibold text-slate-800">{user.role}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Email Status</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Session Type</span>
                  <span className="font-semibold text-slate-800">Secure HTTP-Only</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Default City</span>
                  <span className="font-semibold text-slate-800">Kolkata & Suburbs</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 2: Saved Addresses */}
        {activeTab === 'addresses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Service & Delivery Addresses</h3>
                <p className="text-xs text-slate-500">Used for doorstep appliance visits and spare parts delivery.</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddressModal(true)}
                className="shadow-blue-600/20"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add New Address
              </Button>
            </div>

            {(!user.addresses || user.addresses.length === 0) ? (
              <Card className="p-8 text-center border-slate-200 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Saved Addresses Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Add your home or office address so our technicians can reach you without delay.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddressModal(true)}
                >
                  Add Your First Address
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.addresses.map((addr) => (
                  <Card key={addr.id} className="p-5 border-slate-200 relative flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">{addr.fullName}</span>
                        {addr.isDefault && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Default Address
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {addr.addressLine1}
                        {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                        <br />
                        {addr.city}, {addr.state} - <span className="font-semibold">{addr.pincode}</span>
                        {addr.landmark ? ` (Landmark: ${addr.landmark})` : ''}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {addr.phone}
                      </p>
                    </div>

                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                      {!addr.isDefault ? (
                        <button
                          type="button"
                          onClick={() => setDefaultAddress(addr.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          Set as Default
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Primary location</span>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteAddress(addr.id)}
                        className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Address Modal */}
            {showAddressModal && (
              <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                <Card className="max-w-lg w-full p-6 space-y-4 border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900">Add Doorstep Address</h3>
                    <button
                      onClick={() => setShowAddressModal(false)}
                      className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {addressError && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{addressError}</span>
                    </div>
                  )}

                  <form onSubmit={handleAddAddress} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Full Name"
                        required
                        value={addressFullName}
                        onChange={(e) => setAddressFullName(e.target.value)}
                      />
                      <Input
                        label="Contact Phone"
                        required
                        value={addressPhone}
                        onChange={(e) => setAddressPhone(e.target.value)}
                      />
                    </div>

                    <Input
                      label="Address Line 1 (Flat, House, Building)"
                      required
                      placeholder="e.g. Flat 3B, Sunshine Apartments, 45 Rashbehari Ave"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                    />

                    <Input
                      label="Address Line 2 (Area, Locality)"
                      placeholder="e.g. Gariahat / Ballygunge"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                    />

                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        label="City"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                      <Input
                        label="State"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                      />
                      <Input
                        label="Pincode (6 digits)"
                        required
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                      />
                    </div>

                    <Input
                      label="Nearby Landmark (Optional)"
                      placeholder="e.g. Opposite Triangular Park"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                    />

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="modal-default-address"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="modal-default-address" className="text-xs text-slate-700">
                        Set this address as default for service bookings
                      </label>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        onClick={() => setShowAddressModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={addressSaving}
                      >
                        {addressSaving ? 'Saving...' : 'Save Address'}
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Security & Password */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 md:col-span-2 border-slate-200 space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Change Account Password</h3>
                <p className="text-xs text-slate-500">
                  Ensure your account uses a strong password with a combination of letters, numbers, and symbols.
                </p>
              </div>

              {passwordMessage && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    passwordMessage.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-rose-50 border border-rose-200 text-rose-700'
                  }`}
                >
                  {passwordMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                />

                <Input
                  label="New Password (min 8 characters)"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={passwordSaving}
                  className="shadow-blue-600/20"
                >
                  {passwordSaving ? 'Updating Password...' : 'Update Password'}
                </Button>
              </form>
            </Card>

            <Card className="p-6 border-slate-200 space-y-4 h-fit">
              <h3 className="text-sm font-bold text-slate-900">Security Best Practices</h3>
              <ul className="text-xs text-slate-600 space-y-2.5 list-disc pl-4 leading-relaxed">
                <li>Never share your password or OTP with anyone.</li>
                <li>Sohom Enterprises technicians will never request your login password.</li>
                <li>Passwords are salted and hashed using bcrypt (10 rounds).</li>
                <li>Sessions are stored in HTTP-only cookies protected from script injection.</li>
              </ul>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
