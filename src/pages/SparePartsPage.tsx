import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Star,
  ShoppingBag,
  ShieldCheck,
  CheckCircle,
  SlidersHorizontal,
  X,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown
} from 'lucide-react';
import { PageRoute, SparePartProduct } from '../types';
import { useCatalog } from '../context/CatalogContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface SparePartsPageProps {
  onNavigate: (page: PageRoute, params?: { serviceId?: string; productId?: string }) => void;
  onAddToCart: (productId: string) => void;
  onBuyNow: (productId: string) => void;
}

export const SparePartsPage: React.FC<SparePartsPageProps> = ({
  onNavigate,
  onAddToCart,
  onBuyNow
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [priceMax, setPriceMax] = useState<number>(2500);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'popularity' | 'price-low' | 'price-high' | 'rating'>('popularity');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const { products, loading, error } = useCatalog();

  const itemsPerPage = 6;

  // Extract distinct categories and brands
  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(products.map((p) => p.category)))];
  }, [products]);

  const brands = useMemo(() => {
    return ['All', ...Array.from(new Set(products.map((p) => p.brand.split('/')[0].trim())))];
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matches =
          product.name.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // Category
      if (selectedCategory !== 'All' && product.category !== selectedCategory) {
        return false;
      }

      // Brand
      if (selectedBrand !== 'All' && !product.brand.toLowerCase().includes(selectedBrand.toLowerCase())) {
        return false;
      }

      // Price
      if (product.price > priceMax) {
        return false;
      }

      // Stock
      if (inStockOnly && product.stockStatus === 'OUT_OF_STOCK') {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return b.reviewCount - a.reviewCount; // Popularity
    });
  }, [products, searchQuery, selectedCategory, selectedBrand, priceMax, inStockOnly, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedBrand('All');
    setPriceMax(2500);
    setInStockOnly(false);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Shop Header */}
      <div className="bg-slate-900 text-white py-12 sm:py-16 px-4 border-b border-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-950/80 border border-sky-800/60 px-3 py-1 rounded-full">
            Direct OEM Certified Replacements
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Appliance Spare Parts Store
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Genuine spare parts with warranty. RO membranes, filters, AC capacitors, fridge relays, washing machine pumps & geyser elements.
          </p>

          {/* Search bar inside header */}
          <div className="max-w-xl mx-auto pt-2">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by part name, SKU, or appliance model (e.g. Aquaguard membrane, 45 MFD)..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Store Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Mobile Filter Toggle & Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              icon={<SlidersHorizontal className="w-4 h-4" />}
              onClick={() => setMobileFilterOpen(true)}
            >
              Filters
            </Button>
            <span className="text-xs sm:text-sm font-semibold text-slate-700">
              Showing <strong>{filteredProducts.length}</strong> Products
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 hidden sm:inline">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 font-semibold focus:border-blue-600 focus:outline-none"
            >
              <option value="popularity">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <span>Filters</span>
              </h3>
              <button
                onClick={handleResetFilters}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Reset All
              </button>
            </div>

            {/* Category Filter */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                Category
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                      selectedCategory === cat
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat}</span>
                    {cat !== 'All' && (
                      <span className="text-[10px] text-slate-400">
                        {products.filter((p) => p.category === cat).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                Brand Compatibility
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {brands.map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      setSelectedBrand(b);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                      selectedBrand === b
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{b}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Max Price Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Max Price
                </h4>
                <span className="text-xs font-bold text-blue-600">₹{priceMax}</span>
              </div>
              <input
                type="range"
                min="200"
                max="2500"
                step="50"
                value={priceMax}
                onChange={(e) => {
                  setPriceMax(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>₹200</span>
                <span>₹2,500</span>
              </div>
            </div>

            {/* Stock Availability Toggle */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => {
                    setInStockOnly(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>In Stock Only</span>
              </label>
            </div>
          </aside>

          {/* Product Cards Grid Area */}
          <div className="lg:col-span-9 space-y-8">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-80 rounded-2xl bg-white border border-slate-200 animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <Card className="text-center py-16 p-6">
                <h3 className="text-base font-bold text-slate-900">Couldn't load spare parts</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{error}</p>
              </Card>
            ) : paginatedProducts.length === 0 ? (
              <Card className="text-center py-16 p-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 mx-auto flex items-center justify-center mb-3">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {products.length === 0 ? 'No spare parts available yet' : 'No matching spare parts found'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {products.length === 0
                    ? 'Check back soon - the catalog is being stocked.'
                    : 'Try adjusting your search terms, changing the category filter, or increasing the max price.'}
                </p>
                {products.length > 0 && (
                  <Button variant="outline" size="sm" className="mt-4" onClick={handleResetFilters}>
                    Clear All Filters
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProducts.map((part) => (
                  <Card
                    key={part.id}
                    hoverEffect
                    className="flex flex-col justify-between border-slate-200 group"
                  >
                    <div>
                      {/* Product Image Box */}
                      <div
                        className="relative h-48 rounded-xl overflow-hidden mb-3 bg-white p-3 cursor-pointer border border-slate-100"
                        onClick={() => onNavigate('product-detail', { productId: part.id })}
                      >
                        <img
                          src={part.imageUrl}
                          alt={part.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2.5 left-2.5 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          {part.category}
                        </span>

                        {part.stockStatus === 'IN_STOCK' ? (
                          <span className="absolute bottom-2.5 right-2.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                            In Stock
                          </span>
                        ) : (
                          <span className="absolute bottom-2.5 right-2.5 bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                            Low Stock ({part.stockQuantity} left)
                          </span>
                        )}
                      </div>

                      {/* Ratings & SKU */}
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        {part.reviewCount > 0 ? (
                          <div className="flex items-center gap-1 text-amber-500 font-bold">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="text-slate-800">{part.rating}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({part.reviewCount})</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">No reviews yet</span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium">SKU: {part.sku}</span>
                      </div>

                      {/* Product Name */}
                      <h4
                        className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-2 cursor-pointer leading-snug"
                        onClick={() => onNavigate('product-detail', { productId: part.id })}
                      >
                        {part.name}
                      </h4>

                      {/* Brand Tag */}
                      <p className="text-[11px] text-slate-500 mt-1 truncate">
                        Brand: <span className="font-semibold text-slate-700">{part.brand}</span>
                      </p>

                      {/* Pricing */}
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-lg font-black text-slate-900">₹{part.price}</span>
                        {part.originalPrice > part.price && (
                          <>
                            <span className="text-xs text-slate-400 line-through">₹{part.originalPrice}</span>
                            <span className="text-[10px] font-bold text-emerald-600">
                              {Math.round(((part.originalPrice - part.price) / part.originalPrice) * 100)}% OFF
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions: Add to Cart & Buy Now */}
                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => onAddToCart(part.id)}
                      >
                        Add to Cart
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs"
                        onClick={() => onBuyNow(part.id)}
                      >
                        Buy Now
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-200">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  icon={<ChevronLeft className="w-4 h-4" />}
                >
                  Prev
                </Button>

                {[...Array(totalPages)].map((_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition ${
                        currentPage === pNum
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  icon={<ChevronRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm lg:hidden flex justify-end">
          <div className="w-full max-w-xs bg-white h-full p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Filter Spare Parts</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Category</h4>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCurrentPage(1);
                      setMobileFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold ${
                      selectedCategory === cat ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full justify-center"
              onClick={() => setMobileFilterOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
