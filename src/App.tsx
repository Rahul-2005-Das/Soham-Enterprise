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
import { AdminUsersPage } from './pages/AdminUsersPage';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [activeResetToken, setActiveResetToken] = useState<string>('');

  const { user } = useAuth();
  const cart = useCart();
  const { showToast } = useToast();

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Booking modal state management
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [bookingServiceId, setBookingServiceId] = useState<string | undefined>(undefined);

  // Navigation handler
  const handleNavigate = (
    page: PageRoute,
    params?: { serviceId?: string; productId?: string; resetToken?: string }
  ) => {
    setCurrentPage(page);
    if (params?.serviceId) setSelectedServiceId(params.serviceId);
    if (params?.productId) setSelectedProductId(params.productId);
    if (params?.resetToken) setActiveResetToken(params.resetToken);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart actions - real backend-backed cart. A cart belongs to a logged-in
  // user (Cart.userId is unique in the schema), so adding to cart while
  // logged out sends the person to log in rather than faking a local cart
  // that could never actually be checked out.
  const handleAddToCart = async (productId: string, quantity = 1) => {
    if (!user) {
      showToast('Please log in to add items to your cart.', 'info');
      handleNavigate('login');
      return;
    }
    const result = await cart.addItem(productId, quantity);
    if (!result.success) {
      showToast(result.error || 'Could not add item to cart.', 'error');
    } else {
      showToast('Added to cart.', 'success');
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
            onAddToCart={(id) => handleAddToCart(id, 1)}
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
            onAddToCart={(id) => handleAddToCart(id, 1)}
            onBuyNow={(id) => {
              handleAddToCart(id, 1);
              setIsCartOpen(true);
            }}
          />
        )}

        {currentPage === 'product-detail' && (
          <ProductDetailPage
            productId={selectedProductId}
            onNavigate={handleNavigate}
            onAddToCartWithQty={(id, qty) => handleAddToCart(id, qty)}
            onBuyNowWithQty={(id, qty) => {
              handleAddToCart(id, qty);
              setIsCartOpen(true);
            }}
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
            onSetResetToken={(token) => setActiveResetToken(token)}
          />
        )}

        {currentPage === 'reset-password' && (
          <ResetPasswordPage
            onNavigate={handleNavigate}
            initialToken={activeResetToken}
          />
        )}

        {currentPage === 'profile' && <ProfilePage onNavigate={handleNavigate} />}

        {currentPage === 'admin-users' && <AdminUsersPage onNavigate={handleNavigate} />}
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
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CatalogProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </CatalogProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
