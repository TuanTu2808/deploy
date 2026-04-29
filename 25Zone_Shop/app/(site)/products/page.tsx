"use client";
import CartPopup from "@/app/components/CartPopup";
import { useCart } from "@/app/hooks/useCart";
import { Product } from "../../../types/sanpham.type";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/components/auth/AuthProvider";
import {
  DEFAULT_MAX,
  DEFAULT_MIN,
  FilterPanel,
} from "@/app/components/products/FilterPanel";

const getImageUrl = (thumbnail: any) => {
  if (!thumbnail) return "/img/placeholder.png";
  if (typeof thumbnail === "string") {
    if (thumbnail.startsWith("http")) return thumbnail;
    try {
      const parsed = JSON.parse(thumbnail);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0].startsWith("http")
          ? parsed[0]
          : `http://localhost:5001${parsed[0]}`;
      }
    } catch (e) {
      // not a json array
    }
    return thumbnail.startsWith("/")
      ? `http://localhost:5001${thumbnail}`
      : `http://localhost:5001/${thumbnail}`;
  }
  return `http://localhost:5001${thumbnail}`;
};

import { useFavorites } from "@/app/hooks/useFavorites";

function ProductCard({
  product,
  onAddToCart,
  onBuyNow,
}: {
  product: Product;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    setLiked(isFavorite(product.Id_product));
    const handleUpdate = () => setLiked(isFavorite(product.Id_product));
    window.addEventListener("favorites-updated", handleUpdate);
    return () => window.removeEventListener("favorites-updated", handleUpdate);
  }, [product.Id_product]);

  return (
    <Link href={`/products/${product.Id_product}`} className="block h-full w-full">
      <div className="group bg-white rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-xl sm:shadow-2xl w-full h-full flex flex-col transition-transform hover:-translate-y-1 cursor-pointer border border-gray-100">
        <div className="relative w-full overflow-hidden h-[180px] sm:h-[220px]">
          <img
            src={getImageUrl(product.Thumbnail)}
            alt={product.Name_product}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        <div className="bg-white flex-1 flex flex-col p-3 sm:p-5">
          <h3 className="font-extrabold text-[#003366] uppercase text-sm sm:text-[16px] line-clamp-2 leading-snug min-h-[42px] sm:min-h-[48px]">
            {product.Name_product}
          </h3>

          <p className="text-xs sm:text-sm text-[#003366] font-semibold line-clamp-1 mt-1">
            {product.Category_Name}
          </p>

          <div className="h-[2px] sm:h-[3px] w-8 sm:w-12 bg-[#003366] mt-2 mb-2 sm:mb-3"></div>

          <div className="mt-auto">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-400 mb-1">GIÁ SẢN PHẨM</p>
            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
              <div className="flex-1">
                <p className="text-[#8b1e1e] font-extrabold text-base sm:text-xl lg:text-2xl tracking-tight leading-none break-words">
                  {product.Price.toLocaleString()}đ
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(product); }}
                className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full bg-[#003366] text-white flex items-center justify-center hover:bg-[#002244] hover:scale-105 active:scale-95 transition-all shadow-md ml-auto"
              >
                <i className={`${liked ? "fa-solid fa-heart" : "fa-regular fa-heart"} text-xs sm:text-sm`}></i>
              </button>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCart(product);
              }}
              disabled={product.Quantity === 0}
              className={`w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-sm transition ${product.Quantity === 0
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-[#003366] text-white hover:bg-[#00264d]"
                }`}
            >
              {product.Quantity === 0 ? "HẾT HÀNG" : "THÊM SẢN PHẨM"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, showPopup, popupProduct } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const handleBuyNow = (product: Product) => {
    if (!user) {
      localStorage.setItem("pending_buynow", JSON.stringify({ ...product, quantity: 1 }));
      router.push("/login?returnTo=/checkout");
    } else {
      addToCart(product);
      router.push("/checkout");
    }
  };

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<string>(DEFAULT_MIN);
  const [priceMax, setPriceMax] = useState<string>(DEFAULT_MAX);

  const [hasAppliedFilter, setHasAppliedFilter] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  const indexOfLast = currentPage * productsPerPage;
  const indexOfFirst = indexOfLast - productsPerPage;

  const currentProducts = products.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(products.length / productsPerPage);

  const getVisiblePages = () => {
    if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1);

    if (currentPage <= 3) return [1, 2, 3, 4, 5, 6];

    if (currentPage >= totalPages - 2)
      return [totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];

    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2, currentPage + 3].filter(p => p <= totalPages);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        let url = "http://localhost:5001/api/sanpham";

        if (searchQuery.trim()) {
          url = `http://localhost:5001/api/sanpham/search?q=${encodeURIComponent(searchQuery)}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        const available = Array.isArray(data) ? data.filter((p: any) => p.Quantity && p.Quantity > 0) : [];
        setProducts(available);
        setCurrentPage(1);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery]);

  const priceChanged = priceMin !== DEFAULT_MIN || priceMax !== DEFAULT_MAX;

  const filterCount = useMemo(() => {
    const base = selectedCategories.length + selectedBrands.length;
    return base + (priceChanged ? 1 : 0);
  }, [selectedCategories, selectedBrands, priceChanged]);

  const resetAll = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setPriceMin(DEFAULT_MIN);
    setPriceMax(DEFAULT_MAX);
    setHasAppliedFilter(false);
  };

  // Helper: fetch filter with explicit values to avoid stale closure
  const applyFilterWith = async (
    cats: string[],
    brands: string[],
    pMin: string,
    pMax: string
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      cats.forEach((c) => params.append("categories", c));
      brands.forEach((b) => params.append("brands", b));
      if (pMin !== DEFAULT_MIN) params.append("priceMin", pMin);
      if (pMax !== DEFAULT_MAX) params.append("priceMax", pMax);
      const res = await fetch(`http://localhost:5001/api/sanpham/filter?${params.toString()}`);
      const data = await res.json();
      
      const available = Array.isArray(data) ? data.filter((p: any) => p.Quantity && p.Quantity > 0) : [];
      setProducts(available);
      setHasAppliedFilter(true);
      setCurrentPage(1);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-filter khi category/brand thay đổi
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    applyFilterWith(selectedCategories, selectedBrands, priceMin, priceMax);
  }, [selectedCategories, selectedBrands]);

  const handleApplyFilter = () =>
    applyFilterWith(selectedCategories, selectedBrands, priceMin, priceMax);

  return (
    <main className="max-w-[1604px] mx-auto px-6 py-10">
      {/* header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-[#003366]">SẢN PHẨM</h1>

        <span className="text-gray-500">{products.length} sản phẩm</span>
      </div>

      <div className="grid grid-cols-12 gap-10">
        {/* sidebar */}
        {!searchQuery && (
          <aside className="col-span-3 hidden lg:block">
            <FilterPanel
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              selectedBrands={selectedBrands}
              setSelectedBrands={setSelectedBrands}
              priceMin={priceMin}
              setPriceMin={setPriceMin}
              priceMax={priceMax}
              setPriceMax={setPriceMax}
              onReset={resetAll}
              onApply={handleApplyFilter}
              onClear={resetAll}
            />
          </aside>
        )}

        {/* products */}
        <div className={searchQuery ? "col-span-12" : "col-span-9"}>
          {loading ? (
            <div className="text-center py-20">Loading...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentProducts.map((item) => (
                  <ProductCard
                    key={item.Id_product}
                    product={item}
                    onAddToCart={addToCart}
                    onBuyNow={handleBuyNow}
                  />
                ))}
              </div>

              {/* pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center md:justify-end mt-10 gap-2">
                  {getVisiblePages().map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-[8px] font-extrabold text-[15px] transition focus:outline-none flex items-center justify-center
                      ${currentPage === page
                          ? "bg-[#003366] text-white shadow-sm border border-[#003366]"
                          : "bg-white border border-[#a2b5cd] text-[#003366] hover:bg-[#f2f6f9]"
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                  {currentPage < totalPages && (
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="w-10 h-10 rounded-[8px] font-extrabold text-[15px] transition focus:outline-none flex items-center justify-center bg-white border border-[#a2b5cd] text-[#003366] hover:bg-[#f2f6f9]"
                    >
                      &gt;&gt;
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* popup */}
      {showPopup && <CartPopup product={popupProduct} />}
    </main>
  );
}
