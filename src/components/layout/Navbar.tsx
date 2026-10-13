import React, { useState, useEffect, useRef } from 'react';
import { Wrench, ShoppingBag, Search, User, Menu, X, ChevronDown, PhoneCall, Shield, LogOut, Settings, UserCheck, MapPin } from 'lucide-react';
import { PageRoute } from '../../types';
import { COMPANY_INFO } from '../../data/mockData';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useCatalog } from '../../context/CatalogContext';
import { useSite } from '../../context/SiteContext';
import { SiteControls } from './SiteControls';


interface NavbarProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute, params?: { serviceId?: string; productId?: string }) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenBooking: (serviceId?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  cartCount,
  onOpenCart,
  onOpenBooking
}) => {
  const { user, loading: authLoading, logout, location, locationStatus, requestCurrentLocation } = useAuth();
  const { services } = useCatalog();
  const { settings, t } = useSite();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (page: PageRoute) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    setServicesDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectService = (serviceId: string) => {
    onNavigate('service-detail', { serviceId });
    setServicesDropdownOpen(false);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const defaultAddress = user?.addresses?.find((address) => address.isDefault) || user?.addresses?.[0];
  const savedAddressLabel = defaultAddress ? [defaultAddress.city, defaultAddress.pincode].filter(Boolean).join(' ') : null;
  const locationLabel = location
    ? location.city && location.pincode
      ? `${location.city} ${location.pincode}`
      : location.city || location.label
    : savedAddressLabel;
  const locationUnavailable = ['denied', 'unavailable', 'error'].includes(locationStatus);

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/80 py-2.5'
            : 'bg-white border-b border-slate-200 py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-3 cursor-pointer group"
              id="brand-logo"
            >
              {settings.logoUrl
                ? <img src={settings.logoUrl} alt="Soham Enterprises" className="h-10 w-10 rounded-xl object-contain" />
                : <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20 group-hover:bg-blue-700 transition"><Wrench className="w-5 h-5 transition-transform group-hover:rotate-12" /></div>}
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-slate-900 leading-none">
                  {settings.storeName}
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 mt-1 hidden sm:inline">
                  Appliance Service & Spare Parts
                </span>
                {user?.role === 'CUSTOMER' && (
                  <button
                    type="button"
                    onClick={() => locationUnavailable ? handleNavClick('profile') : requestCurrentLocation()}
                    disabled={locationStatus === 'requesting'}
                    className="mt-1 inline-flex max-w-[180px] items-center gap-1 text-left text-[10px] font-medium text-blue-700 disabled:cursor-wait"
                    aria-live="polite"
                    title={locationUnavailable ? 'Choose a saved address' : 'Update current location'}
                  >
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {locationStatus === 'requesting'
                        ? 'Finding your location...'
                        : locationLabel
                          ? `Deliver to: ${locationLabel}`
                          : locationUnavailable
                            ? 'Location off · Choose address'
                            : 'Set delivery location'}
                    </span>
                  </button>
                )}
                {user?.role === 'CUSTOMER' && location && (
                  <span className="pl-4 text-[9px] text-slate-400">© OpenStreetMap contributors</span>
                )}
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 font-medium text-sm">
              <button
                onClick={() => handleNavClick('home')}
                className={`px-3 py-2 rounded-lg transition ${
                  currentPage === 'home'
                    ? 'text-blue-600 bg-blue-50 font-semibold'
                    : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                {t('home')}
              </button>

              <button
                onClick={() => handleNavClick('about')}
                className={`px-3 py-2 rounded-lg transition ${
                  currentPage === 'about'
                    ? 'text-blue-600 bg-blue-50 font-semibold'
                    : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                {t('about')}
              </button>

              {/* Services Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setServicesDropdownOpen(true)}
                onMouseLeave={() => setServicesDropdownOpen(false)}
              >
                <button
                  onClick={() => handleNavClick('services')}
                  className={`px-3 py-2 rounded-lg inline-flex items-center gap-1.5 transition ${
                    currentPage === 'services' || currentPage === 'service-detail'
                      ? 'text-blue-600 bg-blue-50 font-semibold'
                      : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{t('services')}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {servicesDropdownOpen && (
                  <div className="absolute top-full left-0 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Appliance Categories
                      </span>
                      <button
                        onClick={() => handleNavClick('services')}
                        className="text-xs text-blue-600 font-semibold hover:underline"
                      >
                        View All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-0.5">
                      {services.map((srv) => (
                        <button
                          key={srv.id}
                          onClick={() => handleSelectService(srv.id)}
                          className="w-full text-left px-3 py-2 rounded-xl text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition flex items-center justify-between group"
                        >
                          <span className="font-medium">{srv.shortDescription || srv.name}</span>
                          <span className="text-xs text-slate-400 group-hover:text-blue-600">
                            ₹{Number(srv.inspectionFee)}+
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleNavClick('spare-parts')}
                className={`px-3 py-2 rounded-lg transition ${
                  currentPage === 'spare-parts' || currentPage === 'product-detail'
                    ? 'text-blue-600 bg-blue-50 font-semibold'
                    : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                {t('spareParts')}
              </button>

              <button
                onClick={() => handleNavClick('contact')}
                className={`px-3 py-2 rounded-lg transition ${
                  currentPage === 'contact'
                    ? 'text-blue-600 bg-blue-50 font-semibold'
                    : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                Contact
              </button>
            </nav>

            {/* Actions: Search, Cart, Login, Book Service CTA */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden lg:block"><SiteControls compact /></div>
              {/* Search Button */}
              <button
                onClick={() => setSearchModalOpen(true)}
                className="p-2.5 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition"
                title="Search services & spare parts"
                aria-label="Search"
                id="navbar-search-btn"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Cart Button */}
              <button
                onClick={onOpenCart}
                className="p-2.5 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition relative"
                title="Shopping Cart"
                aria-label={`Cart with ${cartCount} items`}
                id="navbar-cart-btn"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                    {cartCount}
                  </span>
                )}
              </button>

              {user?.role === 'ADMIN' ? (
                <button
                  type="button"
                  onClick={() => handleNavClick('admin-dashboard')}
                  title="Open admin dashboard"
                  aria-label="Admin Dashboard"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 sm:px-3"
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden md:inline">Admin Dashboard</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleNavClick('admin-login')}
                  title="Admin Login"
                  aria-label="Admin Login"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 sm:px-3"
                >
                  <Shield className="h-4 w-4 text-slate-400" />
                  <span className="hidden md:inline">Admin Login</span>
                </button>
              )}

              {/* Login or User Menu */}
              {user ? (
                <div className="relative hidden sm:block" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-left"
                    id="navbar-user-menu-btn"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">
                        {user.name.split(' ')[0]}
                      </span>
                      <span className="text-[10px] text-slate-500 capitalize leading-none">
                        {user.role.toLowerCase()}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in duration-100">
                      <div className="px-3.5 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                        <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                          {user.role}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleNavClick('profile');
                        }}
                        className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 text-left flex items-center gap-2 transition"
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>My Account & Addresses</span>
                      </button>

                      {user.role === 'ADMIN' && (
                        <div>
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              handleNavClick('admin-dashboard');
                            }}
                            className="w-full px-3.5 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 text-left flex items-center gap-2 transition"
                          >
                            <Shield className="w-3.5 h-3.5 text-blue-600" />
                            <span>Admin Dashboard</span>
                          </button>
                        </div>
                      )}

                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={async () => {
                            setUserMenuOpen(false);
                            await logout();
                            handleNavClick('home');
                          }}
                          className="w-full px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 text-left flex items-center gap-2 transition"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : authLoading ? (
                <span role="status" className="hidden px-3 py-2 text-xs text-slate-500 sm:inline-flex">Checking session…</span>
              ) : (
                <button
                  onClick={() => handleNavClick('login')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 rounded-xl hover:bg-slate-50 transition"
                  id="navbar-login-btn"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Login</span>
                </button>
              )}


              {/* Primary CTA: Book Service */}
              <Button
                variant="primary"
                size="sm"
                className="hidden md:inline-flex shadow-blue-500/25"
                onClick={() => onOpenBooking()}
                id="navbar-book-btn"
              >
                Book Service
              </Button>

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition"
                aria-label="Toggle Navigation Menu"
                id="mobile-menu-toggle"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex justify-end"><SiteControls /></div>
              {/* Mobile Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  {settings.logoUrl
                    ? <img src={settings.logoUrl} alt="" className="h-8 w-8 rounded-lg object-contain" />
                    : <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white"><Wrench className="w-4 h-4" /></div>}
                  <span className="font-bold text-slate-900 text-base">{settings.storeName}</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Nav Links */}
              <div className="flex flex-col space-y-1">
                <button
                  onClick={() => handleNavClick('home')}
                  className={`text-left px-3.5 py-2.5 rounded-xl text-base font-medium ${
                    currentPage === 'home' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-800'
                  }`}
                >
                  {t('home')}
                </button>

                <button
                  onClick={() => handleNavClick('about')}
                  className={`text-left px-3.5 py-2.5 rounded-xl text-base font-medium ${
                    currentPage === 'about' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-800'
                  }`}
                >
                  {t('about')}
                </button>

                <button
                  onClick={() => handleNavClick('services')}
                  className={`text-left px-3.5 py-2.5 rounded-xl text-base font-medium ${
                    currentPage === 'services' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-800'
                  }`}
                >
                  {t('services')}
                </button>

                <button
                  onClick={() => handleNavClick('spare-parts')}
                  className={`text-left px-3.5 py-2.5 rounded-xl text-base font-medium ${
                    currentPage === 'spare-parts' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-800'
                  }`}
                >
                  {t('spareParts')}
                </button>

                <button
                  onClick={() => handleNavClick('faq')}
                  className={`text-left px-3.5 py-2.5 rounded-xl text-base font-medium ${
                    currentPage === 'faq' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-800'
                  }`}
                >
                  FAQ
                </button>

                <button
                  onClick={() => handleNavClick('contact')}
                  className={`text-left px-3.5 py-2.5 rounded-xl text-base font-medium ${
                    currentPage === 'contact' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-800'
                  }`}
                >
                  Contact & Support
                </button>
              </div>

              {/* Fast Booking CTA in Mobile Menu */}
              <div className="pt-2">
                <Button
                  variant="primary"
                  className="w-full justify-center py-3"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenBooking();
                  }}
                >
                  Book a Technician
                </Button>
              </div>

              {/* Mobile Auth Section */}
              {user ? (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleNavClick('profile')}
                    className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 text-left flex items-center justify-between"
                  >
                    <span>My Account & Addresses</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-bold uppercase">
                      {user.role}
                    </span>
                  </button>

                  {user.role === 'ADMIN' ? (
                    <button
                      onClick={() => handleNavClick('admin-dashboard')}
                      className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 text-left flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Admin Dashboard</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleNavClick('admin-login')}
                      className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 text-left flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5 text-slate-400" />
                      <span>Admin Login</span>
                    </button>
                  )}

                  <button
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await logout();
                      handleNavClick('home');
                    }}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : authLoading ? (
                <p role="status" className="border-t border-slate-100 pt-3 text-xs text-slate-500">Checking session…</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleNavClick('login')}
                  >
                    Login
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => handleNavClick('register')}
                  >
                    Register
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full col-span-2 border-slate-300 text-slate-600"
                    onClick={() => handleNavClick('admin-login')}
                  >
                    <Shield className="w-4 h-4 mr-2 inline-block text-slate-400" />
                    Admin Login
                  </Button>
                </div>
              )}

            </div>

            {/* Mobile Footer Help */}
            <div className="pt-6 border-t border-slate-100 text-xs text-slate-500 space-y-2">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <PhoneCall className="w-4 h-4 text-blue-600" />
                <span>{settings.phone || 'Support number coming soon'}</span>
              </div>
              <p>{settings.businessHours}</p>
            </div>
          </div>
        </div>
      )}

      {/* Global Quick Search Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-100 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-base">Search Appliance Services & Parts</span>
              <button
                onClick={() => setSearchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Aquaguard membrane, AC gas refill, Washing machine motor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 text-sm"
                  autoFocus
                />
              </div>
            </div>

            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {services.slice(0, 5).map((srv) => (
                  <button
                    key={srv.id}
                    onClick={() => {
                      setSearchModalOpen(false);
                      handleSelectService(srv.id);
                    }}
                    className="text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 px-3 py-1.5 rounded-lg transition"
                  >
                    {srv.shortDescription || srv.name}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setSearchModalOpen(false);
                    handleNavClick('spare-parts');
                  }}
                  className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-100 transition"
                >
                  Browse All Spare Parts →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
