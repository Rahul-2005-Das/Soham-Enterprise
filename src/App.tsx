import React, { useState } from 'react';
import { PageRoute } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CatalogProvider } from './context/CatalogContext';
import { CartProvider, useCart } from './context/CartContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { TopBar } from './components/layout/TopBar';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { QuickBookingModal } from './components/booking/QuickBookingModal';
import { SupportActions, SiteControls } from './components/layout/SiteControls';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ServicesPage } from './pages/ServicesPage';
import { ServiceDetailPage } from './pages/ServiceDetailPage';
import { SparePartsPage } from './pages/SparePartsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ContactPage } from './pages/ContactPage';
import { FAQPage } from './pages/FAQPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { SiteProvider, useSite } from './context/SiteContext';
import { useCatalog } from './context/CatalogContext';

function pageFromPath(path: string): PageRoute {
  if (path === '/admin/login') return 'admin-login';
  if (path.startsWith('/admin')) return 'admin-dashboard';
  if (/^\/products\/[^/]+\/?$/.test(path)) return 'product-detail';
  if (/^\/services\/[^/]+\/?$/.test(path)) return 'service-detail';
  if (path === '/services') return 'services';
  if (path === '/spare-parts') return 'spare-parts';
  if (path === '/contact') return 'contact';
  if (path === '/about') return 'about';
  return 'home';
}

function pathSlug(path: string) {
  return path.split('/').filter(Boolean).pop();
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageRoute>(() => {
    return pageFromPath(window.location.pathname);
  });
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(() =>
    pageFromPath(window.location.pathname) === 'service-detail' ? pathSlug(window.location.pathname) : undefined
  );
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(() =>
    pageFromPath(window.location.pathname) === 'product-detail' ? pathSlug(window.location.pathname) : undefined
  );
  const [activeResetEmail, setActiveResetEmail] = useState<string>('');

  const { user, loading, refreshUser } = useAuth();
  const { products, services } = useCatalog();
  const { settings } = useSite();
  const cart = useCart();
  const { showToast } = useToast();

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Booking modal state management
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [bookingServiceId, setBookingServiceId] = useState<string | undefined>(undefined);

  React.useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const page = pageFromPath(path);
      setCurrentPage(page);
      setSelectedServiceId(page === 'service-detail' ? pathSlug(path) : undefined);
      setSelectedProductId(page === 'product-detail' ? pathSlug(path) : undefined);
      void refreshUser();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  React.useEffect(() => {
    if (loading) return;
    if (currentPage === 'admin-dashboard' && user?.role !== 'ADMIN') {
      window.history.replaceState(null, '', '/admin/login');
      setCurrentPage('admin-login');
    } else if (currentPage === 'admin-login' && user?.role === 'ADMIN') {
      window.history.replaceState(null, '', '/admin');
      setCurrentPage('admin-dashboard');
    }
  }, [currentPage, loading, user]);

  // Navigation handler
  const handleNavigate = (
    page: PageRoute,
    params?: { serviceId?: string; productId?: string; resetEmail?: string }
  ) => {
    const wasAdminPath = window.location.pathname.startsWith('/admin');
    const targetPage = page === 'admin-login' && user?.role === 'ADMIN' ? 'admin-dashboard' : page;
    const isAdminDestination = targetPage === 'admin-login' || targetPage === 'admin-dashboard';
    if (!isAdminDestination && wasAdminPath) void refreshUser();
    setCurrentPage(targetPage);
    const service = params?.serviceId
      ? services.find((item) => item.id === params.serviceId || item.slug === params.serviceId)
      : undefined;
    const product = params?.productId
      ? products.find((item) => item.id === params.productId || item.slug === params.productId)
      : undefined;
    const publicPaths: Partial<Record<PageRoute, string>> = {
      home: '/',
      about: '/about',
      services: '/services',
      'service-detail': service ? `/services/${encodeURIComponent(service.slug)}` : '',
      'spare-parts': '/spare-parts',
      'product-detail': product ? `/products/${encodeURIComponent(product.slug)}` : '',
      contact: '/contact',
    };
    if (!isAdminDestination && publicPaths[targetPage] !== undefined && publicPaths[targetPage]) {
      const targetPath = publicPaths[targetPage] as string;
      if (window.location.pathname !== targetPath) window.history.pushState(null, '', targetPath);
    } else if (!isAdminDestination && wasAdminPath) {
      window.history.pushState(null, '', '/');
    }
    if (targetPage === 'admin-login') {
      window.history.pushState(null, '', '/admin/login');
      if (!wasAdminPath) void refreshUser();
    }
    if (targetPage === 'admin-dashboard') {
      window.history.pushState(null, '', '/admin');
      if (!wasAdminPath) void refreshUser();
    }
    if (targetPage === 'service-detail') setSelectedServiceId(service?.slug || params?.serviceId);
    else setSelectedServiceId(undefined);
    if (targetPage === 'product-detail') setSelectedProductId(product?.slug || params?.productId);
    else setSelectedProductId(undefined);
    if (params?.resetEmail) setActiveResetEmail(params.resetEmail);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  React.useEffect(() => {
    const service = services.find((item) => item.id === selectedServiceId || item.slug === selectedServiceId);
    const product = products.find((item) => item.id === selectedProductId || item.slug === selectedProductId);
    const titles: Partial<Record<PageRoute, [string, string]>> = {
      home: ['Soham Enterprises | Best AC Repair & RO Water Purifier Service in Kolkata', 'Professional AC repair, installation, gas charging & RO Aquaguard purifier service in Kolkata. Fast 2-hour doorstep service. Call now!'],
      services: ['AC, RO & Appliance Repair Services in Kolkata | Soham Enterprises', 'Book trusted AC repair, RO purifier service, and appliance maintenance in Kolkata. Convenient doorstep visits with clear pricing.'],
      'spare-parts': ['Genuine Appliance Spare Parts in Kolkata | Soham Enterprises', 'Shop genuine AC, RO purifier, and home appliance spare parts in Kolkata with doorstep delivery and expert support.'],
      contact: ['Contact Soham Enterprises | Appliance Service in Kolkata', 'Contact Soham Enterprises for AC repair, RO purifier service, and appliance support in Kolkata, West Bengal.'],
      about: ['About Soham Enterprises | Kolkata Appliance Experts', 'Learn about Soham Enterprises, your local team for appliance service and spare parts in Kolkata.'],
    };
    const metadata = targetMetadata();
    function targetMetadata(): [string, string] {
      if (product) return [`${product.name} | Genuine Spare Parts in Kolkata | Soham Enterprises`, `Buy ${product.name} from Soham Enterprises in Kolkata. Genuine appliance spare parts with expert support.`];
      if (service) return [`${service.name} in Kolkata | Soham Enterprises`, `${service.description.slice(0, 250)} Book a doorstep visit in Kolkata.`];
      return titles[currentPage] || ['Soham Enterprises | Appliance Service in Kolkata', 'Appliance repair and doorstep service in Kolkata from Soham Enterprises.'];
    }
    document.title = metadata[0];
    const setMeta = (selector: string, attribute: string, value: string) => {
      let element = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
      if (!element) {
        element = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, value);
    };
    setMeta('meta[name="description"]', 'content', metadata[1]);
    setMeta('meta[property="og:title"]', 'content', metadata[0]);
    setMeta('meta[property="og:description"]', 'content', metadata[1]);
    setMeta('meta[property="og:url"]', 'content', window.location.href);
    setMeta('meta[property="og:type"]', 'content', product ? 'product' : 'website');
    setMeta('meta[name="twitter:title"]', 'content', metadata[0]);
    setMeta('meta[name="twitter:description"]', 'content', metadata[1]);
    setMeta('link[rel="canonical"]', 'href', window.location.href);
    const shareImage = product?.imageUrl || settings.homeBannerUrl || settings.logoUrl || '/images/placeholder.png';
    const absoluteShareImage = new URL(shareImage, window.location.origin).toString();
    setMeta('meta[property="og:image"]', 'content', absoluteShareImage);
    setMeta('meta[name="twitter:image"]', 'content', absoluteShareImage);
  }, [currentPage, products, selectedProductId, selectedServiceId, services, settings.homeBannerUrl, settings.logoUrl]);

  if (currentPage === 'admin-login') {
    return <>
      <div className="fixed right-4 top-4 z-50"><SiteControls /></div>
      <AdminLoginPage onNavigate={handleNavigate} />
      <SupportActions />
    </>;
  }

  if (currentPage === 'admin-dashboard') {
    if (loading) {
      return (
        <>
        <main className="grid min-h-screen place-items-center bg-slate-100">
          <div role="status" className="flex items-center gap-3 text-sm text-slate-600">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
            Checking administrator session…
          </div>
        </main>
        <SupportActions />
        </>
      );
    }
    if (user?.role !== 'ADMIN') {
      return <>
        <div className="fixed right-4 top-4 z-50"><SiteControls /></div>
        <AdminLoginPage onNavigate={handleNavigate} />
        <SupportActions />
      </>;
    }
    return <AdminDashboardPage onNavigate={handleNavigate} />;
  }

  // The authenticated server cart is canonical. CartContext updates its local
  // per-user cache only after the server accepts a product and quantity.
  const handleAddToCart = async (productId: string, quantity = 1) => {
    if (!user) {
      showToast('Please log in to add items to your cart.', 'info');
      handleNavigate('login');
      return false;
    }
    const result = await cart.addItem(productId, quantity);
    if (!result.success) {
      showToast(result.error || 'Could not add item to cart.', 'error');
      return false;
    } else {
      showToast('Added to cart.', 'success');
      return true;
    }
  };

  const handleBuyNow = async (productId: string, quantity = 1) => {
    if (await handleAddToCart(productId, quantity)) {
      setIsCartOpen(false);
      handleNavigate('checkout');
    }
  };

  // CartDrawer sends a DELTA (+1/-1), not an absolute quantity.
  const handleUpdateCartQuantity = async (productId: string, delta: number) => {
    const current = cart.items.find((item) => item.product.id === productId);
    const newQuantity = (current?.quantity ?? 0) + delta;
    const result = await cart.setItemQuantity(productId, Math.max(0, newQuantity));
    if (!result.success) {
      showToast(result.error || 'Could not update cart.', 'error');
    }
  };

  const handleRemoveFromCart = async (productId: string) => {
    await cart.removeItem(productId);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    handleNavigate('checkout');
  };

  const handleOpenBooking = (serviceId?: string) => {
    setBookingServiceId(serviceId);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* 1. Top Bar */}
      <TopBar />

      {/* 2. Main Navigation Header */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        cartCount={cart.totalItems}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenBooking={(serviceId) => handleOpenBooking(serviceId)}
      />

      {/* 3. Page Router Container */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onOpenBooking={handleOpenBooking}
            onAddToCart={async (id) => {
              if (await handleAddToCart(id, 1)) setIsCartOpen(true);
            }}
          />
        )}

        {currentPage === 'about' && (
          <AboutPage
            onNavigate={handleNavigate}
            onOpenBooking={() => handleOpenBooking()}
          />
        )}

        {currentPage === 'services' && (
          <ServicesPage
            onNavigate={handleNavigate}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {currentPage === 'service-detail' && (
          <ServiceDetailPage
            serviceId={selectedServiceId}
            onNavigate={handleNavigate}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {currentPage === 'spare-parts' && (
          <SparePartsPage
            onNavigate={handleNavigate}
            onAddToCart={async (id) => {
              if (await handleAddToCart(id, 1)) setIsCartOpen(true);
            }}
            onBuyNow={(id) => { void handleBuyNow(id, 1); }}
          />
        )}

        {currentPage === 'product-detail' && (
          <ProductDetailPage
            productId={selectedProductId}
            onNavigate={handleNavigate}
            onAddToCartWithQty={async (id, qty) => {
              const added = await handleAddToCart(id, qty);
              if (added) setIsCartOpen(true);
              return added;
            }}
            onBuyNowWithQty={(id, qty) => { void handleBuyNow(id, qty); }}
          />
        )}

        {currentPage === 'checkout' && <CheckoutPage onNavigate={handleNavigate} />}

        {currentPage === 'contact' && <ContactPage />}

        {currentPage === 'faq' && <FAQPage />}

        {currentPage === 'login' && <LoginPage onNavigate={handleNavigate} />}

        {currentPage === 'register' && <RegisterPage onNavigate={handleNavigate} />}

        {currentPage === 'forgot-password' && (
          <ForgotPasswordPage
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'reset-password' && (
          <ResetPasswordPage
            onNavigate={handleNavigate}
            initialEmail={activeResetEmail}
          />
        )}

        {currentPage === 'profile' && <ProfilePage onNavigate={handleNavigate} />}

              </main>

      {/* 4. Global Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* 5. Interactive Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart.items}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleCheckout}
      />

      {/* 6. Doorstep Technician Quick Booking Modal */}
      <QuickBookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        defaultServiceId={bookingServiceId}
      />
      <SupportActions />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SiteProvider>
        <ToastProvider>
          <CatalogProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </CatalogProvider>
        </ToastProvider>
      </SiteProvider>
    </AuthProvider>
  );
}
