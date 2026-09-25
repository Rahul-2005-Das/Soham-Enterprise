import React, { useState, useEffect } from 'react';
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle,
  ShoppingBag,
  Plus,
  Minus,
  ArrowLeft,
  ChevronRight,
  Package,
  Award
} from 'lucide-react';
import { PageRoute, SparePartProduct } from '../types';
import { useCatalog } from '../context/CatalogContext';
import { api, ApiError } from '../lib/api';
import { ApiProduct, mapApiProductToSparePart } from '../lib/productMapper';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface ProductDetailPageProps {
  productId?: string;
  onNavigate: (page: PageRoute, params?: { serviceId?: string; productId?: string }) => void;
  onAddToCartWithQty: (productId: string, qty: number) => void;
  onBuyNowWithQty: (productId: string, qty: number) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onNavigate,
  onAddToCartWithQty,
  onBuyNowWithQty
}) => {
  const { products: catalogProducts } = useCatalog();
  const [product, setProduct] = useState<SparePartProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!productId) {
      setLoading(false);
      setLoadError('No product specified.');
      return;
    }
    setLoading(true);
    setLoadError(null);
    api
      .get<ApiProduct>(`/api/products?id=${encodeURIComponent(productId)}`)
      .then((data) => {
        if (!cancelled) setProduct(mapApiProductToSparePart(data));
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof ApiError && err.status === 404
            ? 'This product could not be found. It may have been removed.'
            : 'Could not load this product. Please try again.';
        setLoadError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState<'specs' | 'compatibility' | 'warranty'>('specs');
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    setQuantity(1);
  }, [productId]);

  // Related products from same category, sourced from the shared catalog
  const relatedProducts = product
    ? catalogProducts.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 3)
    : [];

  const handleAddToCart = () => {
    if (!product) return;
    onAddToCartWithQty(product.id, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleBuyNow = () => {
    if (!product) return;
    onBuyNowWithQty(product.id, quantity);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center py-24 px-4 text-center">
        <h2 className="text-lg font-bold text-slate-900 mb-2">
          {loadError || 'Product not found'}
        </h2>
        <Button variant="primary" size="sm" onClick={() => onNavigate('spare-parts')}>
          Browse Spare Parts
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <button onClick={() => onNavigate('home')} className="hover:text-blue-600">
            Home
          </button>
          <span>/</span>
          <button onClick={() => onNavigate('spare-parts')} className="hover:text-blue-600">
            Spare Parts
          </button>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate max-w-xs">{product.name}</span>
        </div>
      </div>

      {/* Main Product Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Product Image Gallery Box */}
          <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="relative h-80 sm:h-96 w-full flex items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="max-h-full max-w-full object-contain drop-shadow-md"
              />
              <span className="absolute top-4 left-4 bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full">
                {product.category}
              </span>
              <span className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-1 rounded-xl shadow-xs">
                SKU: {product.sku}
              </span>
            </div>

            {/* Quality Badges Row */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center gap-1">
                <Award className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-800">100% Genuine</span>
                <span className="text-[10px] text-slate-500">OEM Grade</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center gap-1">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-800">Fast Shipping</span>
                <span className="text-[10px] text-slate-500">Doorstep Delivery</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span className="font-bold text-slate-800">{product.warrantyMonths} Mo Warranty</span>
                <span className="text-[10px] text-slate-500">Replacement Cover</span>
              </div>
            </div>
          </div>

          {/* Right Column: Product Info & Purchase Controls */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="blue" size="sm">
                    {product.brand}
                  </Badge>
                  {product.stockStatus === 'IN_STOCK' ? (
                    <Badge variant="emerald" size="sm">
                      In Stock ({product.stockQuantity} available)
                    </Badge>
                  ) : (
                    <Badge variant="amber" size="sm">
                      Low Stock
                    </Badge>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                  {product.name}
                </h1>

                {/* Rating */}
                {product.reviewCount > 0 ? (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating) ? 'fill-current' : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-900">{product.rating}</span>
                    <span className="text-xs text-slate-400">({product.reviewCount} customer reviews)</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-3">No reviews yet - be the first to review this part.</p>
                )}
              </div>

              {/* Price Block */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-black text-slate-900">₹{product.price}</span>
                {product.originalPrice > product.price && (
                  <>
                    <span className="text-sm text-slate-400 line-through">₹{product.originalPrice}</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Save ₹{product.originalPrice - product.price} (
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF)
                    </span>
                  </>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.description}
              </p>

              {/* Quantity Selector & Dual Actions */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quantity:</span>
                  <div className="flex items-center border border-slate-300 rounded-xl bg-white shadow-xs">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-l-xl transition"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 text-sm font-bold text-slate-900">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-r-xl transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-500">
                    Total: <strong className="text-slate-900">₹{product.price * quantity}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="lg"
                    icon={<ShoppingBag className="w-5 h-5 text-blue-600" />}
                    onClick={handleAddToCart}
                    className="w-full justify-center"
                  >
                    Add to Cart
                  </Button>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleBuyNow}
                    className="w-full justify-center shadow-blue-500/20"
                  >
                    Buy Now
                  </Button>
                </div>

                {addedToast && (
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Added {quantity} unit(s) of "{product.name}" to your cart!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Specifications & Compatibility Tabs */}
            <Card className="p-6">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4 text-xs font-bold">
                <button
                  onClick={() => setSelectedTab('specs')}
                  className={`pb-2 px-1 border-b-2 transition ${
                    selectedTab === 'specs'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Technical Specifications
                </button>
                <button
                  onClick={() => setSelectedTab('compatibility')}
                  className={`pb-2 px-1 border-b-2 transition ${
                    selectedTab === 'compatibility'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Model Compatibility
                </button>
                <button
                  onClick={() => setSelectedTab('warranty')}
                  className={`pb-2 px-1 border-b-2 transition ${
                    selectedTab === 'warranty'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Warranty & Return Policy
                </button>
              </div>

              {selectedTab === 'specs' && (
                <div className="space-y-2 text-xs">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                      <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-semibold text-slate-800">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedTab === 'compatibility' && (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-600 leading-relaxed">
                    This component is guaranteed to fit the following verified appliance models and universal brands:
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {product.compatibility.map((model, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                        ✓ {model}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTab === 'warranty' && (
                <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  <p>
                    <strong>Warranty:</strong> {product.warrantyMonths} Months standard replacement warranty against manufacturing faults.
                  </p>
                  <p>
                    <strong>Returns:</strong> 7-Day replacement if the part does not match your unit specifications or arrives damaged.
                  </p>
                  <p className="text-slate-500 text-[11px] pt-1">
                    *Ensure installation is performed by a qualified appliance technician to preserve warranty coverage.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Related Spare Parts Section */}
        <div className="mt-16 pt-12 border-t border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Frequently Bought Together</h3>
              <p className="text-xs text-slate-500 mt-0.5">Compatible components and accessories for your home setup</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('spare-parts')}
            >
              View Full Catalog →
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedProducts.map((rel) => (
              <Card key={rel.id} hoverEffect className="p-4 border-slate-200 flex flex-col justify-between">
                <div>
                  <div
                    className="h-36 w-full rounded-xl bg-white p-2 mb-3 cursor-pointer"
                    onClick={() => onNavigate('product-detail', { productId: rel.id })}
                  >
                    <img src={rel.imageUrl} alt={rel.name} className="h-full w-full object-contain" />
                  </div>
                  <h4
                    className="text-xs font-bold text-slate-900 line-clamp-2 cursor-pointer hover:text-blue-600"
                    onClick={() => onNavigate('product-detail', { productId: rel.id })}
                  >
                    {rel.name}
                  </h4>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-sm font-extrabold text-slate-900">₹{rel.price}</span>
                    {rel.originalPrice > rel.price && (
                      <span className="text-xs text-slate-400 line-through">₹{rel.originalPrice}</span>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => onNavigate('product-detail', { productId: rel.id })}
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
