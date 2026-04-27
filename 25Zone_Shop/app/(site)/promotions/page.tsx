"use client";
import CartPopup from "@/app/components/CartPopup";
import { useCart } from "@/app/hooks/useCart";
import Link from "next/link";
import { useEffect } from "react";
import { useMemo, useState } from "react";
import {
  DEFAULT_MAX,
  DEFAULT_MIN,
  FilterPanel,
} from "@/app/components/products/FilterPanel";
import { Product } from "@/types/sanpham.type";

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
  p,
  onAddToCart,
}: {
  p: Product;
  onAddToCart: (product: Product) => void;
}) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    setLiked(isFavorite(p.Id_product));
    const handleUpdate = () => setLiked(isFavorite(p.Id_product));
    window.addEventListener("favorites-updated", handleUpdate);
    return () => window.removeEventListener("favorites-updated", handleUpdate);
  }, [p.Id_product]);

  const discount =
    p.Price && p.Sale_Price
      ? Math.round(((p.Price - p.Sale_Price) / p.Price) * 100)
      : 0;
  return (
    <div
      className="group rounded-2xl border border-gray-200 bg-white shadow-sm 
        transition-all duration-300 ease-out 
        hover:shadow-xl hover:scale-[1.02]
        overflow-hidden"
    >
      <div className="relative overflow-hidden w-full h-[210px] bg-[#f8f9fb]">
        {/* Background full */}
        <img
          src={getImageUrl(p.Thumbnail)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-md scale-110"
        />

        {/* Ảnh sản phẩm */}
        <img
          src={getImageUrl(p.Thumbnail)}
          alt={p.Name_product}
          className="relative w-full h-full object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-105"
        />

      </div>

      <div className="p-5 flex flex-col flex-1 gap-2">
        <h3 className="font-extrabold text-[#003366] uppercase text-[16px] line-clamp-2">
          {p.Name_product}
        </h3>
        <p className="text-sm text-[#003366] font-semibold line-clamp-1">
          {p.Category_Name || "Sản phẩm khuyến mãi"}
        </p>

        <div className="w-12 h-1 bg-[#003366] rounded-full my-2"></div>

        <div className="mt-auto pt-2">
          <p className="text-xs font-semibold text-gray-400 mb-1">GIÁ KHUYẾN MÃI</p>
          <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
            <div>
              <p className="text-[#8b1e1e] font-extrabold text-2xl tracking-tight">
                {(p.Sale_Price ?? p.Price)?.toLocaleString()}đ
              </p>
              {p.Sale_Price && (
                <p className="text-sm text-gray-400 line-through tabular-nums">
                  {p.Price?.toLocaleString()}đ
                </p>
              )}
            </div>

            <button 
              type="button" 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(p); }}
              className="w-10 h-10 rounded-full bg-[#003366] flex items-center justify-center hover:bg-[#002244] hover:scale-105 active:scale-95 text-white transition-all shadow-md shrink-0"
            >
              <i className={liked ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToCart(p);
              }}
              className="w-full py-2 rounded-xl font-bold text-sm bg-[#003366] text-white hover:bg-[#00264d] transition disabled:opacity-50"
            >
              THÊM VÀO GIỎ
            </button>
            <Link
              href={`/products/${p.Id_product}`}
              className="w-full py-2 rounded-xl font-bold text-sm bg-gray-100 text-[#003366] hover:bg-gray-200 transition text-center flex items-center justify-center"
            >
              CHI TIẾT
            </Link>
          </div>
        </div>
      </div>
    </div>


  );
}

export default function PromotionsPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<string>(DEFAULT_MIN);
  const [priceMax, setPriceMax] = useState<string>(DEFAULT_MAX);
  const [saleProducts, setSaleProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { addToCart, showPopup, popupProduct } = useCart();

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 9;

  const indexOfLast = currentPage * productsPerPage;
  const indexOfFirst = indexOfLast - productsPerPage;

  const currentProducts = saleProducts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(saleProducts.length / productsPerPage);

  const getVisiblePages = () => {
    if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1);

    if (currentPage <= 3) return [1, 2, 3, 4, 5, 6];

    if (currentPage >= totalPages - 2)
      return [totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];

    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2, currentPage + 3].filter(p => p <= totalPages);
  };

  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5001/api/sanpham/flash-sale");

        if (!res.ok) {
          console.error("API flash-sale lỗi");
          return;
        }

        const data = await res.json();
        setSaleProducts(Array.isArray(data) ? data : []);
        setCurrentPage(1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashSale();
  }, []);
  const priceChanged = priceMin !== DEFAULT_MIN || priceMax !== DEFAULT_MAX;

  const filterCount = useMemo(() => {
    const base = selectedCategories.length + selectedBrands.length;
    return base + (priceChanged ? 1 : 0);
  }, [selectedCategories.length, selectedBrands.length, priceChanged]);

  const resetAll = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setPriceMin(DEFAULT_MIN);
    setPriceMax(DEFAULT_MAX);
  };
  const handleApplyFilter = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      selectedCategories.forEach((c) => params.append("categories", c));

      selectedBrands.forEach((b) => params.append("brands", b));

      if (priceMin !== DEFAULT_MIN) params.append("priceMin", priceMin);

      if (priceMax !== DEFAULT_MAX) params.append("priceMax", priceMax);

      const res = await fetch(
        `http://localhost:5001/api/sanpham/filter?${params.toString()}`,
      );

      const data = await res.json();

      setSaleProducts(data);
      setCurrentPage(1);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <main>
      {/* Breadcrumb */}
      <div className="max-w-[1604px] mx-auto px-4 mt-10 text-[15px] sm:text-base text-gray-500">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="hover:text-[#003366] font-semibold transition"
            href="/"
          >
            Trang chủ
          </Link>
          <i className="fa-solid fa-chevron-right text-[11px] text-gray-300"></i>
          <span className="text-gray-700 font-extrabold">Khuyến mãi</span>
        </div>
      </div>

      <section className="max-w-[1604px] mx-auto px-4 py-10">
        {/* HERO */}
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 sm:p-9 bg-[linear-gradient(90deg,#003366_0%,#0b3a66_55%,#33B1FA_140%)] text-white">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-extrabold">
                  <i className="fa-solid fa-tags" />
                  SALE
                </p>
                <h1 className="mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight">
                  Sản phẩm đang giảm giá
                </h1>
                <p className="mt-2 text-white/90 text-sm sm:text-base">
                  Trang tĩnh kiểu listing sản phẩm sale — sau này gắn API chỉ
                  replace data.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 rounded-full bg-white text-[#003366] px-6 py-3 text-sm font-extrabold hover:bg-gray-100 transition"
                >
                  <i className="fa-solid fa-bag-shopping" />
                  Xem tất cả
                </Link>
                <Link
                  href="/cart"
                  className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-6 py-3 text-sm font-extrabold hover:bg-white/20 transition"
                >
                  <i className="fa-solid fa-cart-shopping" />
                  Tới giỏ hàng
                </Link>
              </div>
            </div>
          </div>

          {/* Filter bar (giống listing) */}
          <div className="p-4 sm:p-6 border-t border-gray-100 bg-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* chỉ 1 pill SALE */}
              <span className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-extrabold bg-[#003366] text-white border-[#003366] shadow">
                <i className="fa-solid fa-tags" />
                SALE
              </span>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative w-full sm:w-[360px]">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm focus:outline-none"
                    placeholder="Tìm sản phẩm đang sale..."
                    type="text"
                  />
                </div>

                <select
                  className="w-full sm:w-[220px] rounded-xl border border-gray-200 bg-white py-3 px-4 text-sm font-bold text-gray-700 focus:outline-none"
                  defaultValue="popular"
                >
                  <option value="popular">Phổ biến</option>
                  <option value="new">Mới nhất</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                  <option value="discount_desc">Giảm nhiều nhất</option>
                </select>
              </div>
            </div>

            {/* (optional) chỗ này ní có thể show badge count nếu muốn */}
            {filterCount > 0 && (
              <p className="mt-3 text-xs text-gray-500">
                Đang chọn{" "}
                <span className="font-extrabold text-[#003366]">
                  {filterCount}
                </span>{" "}
                bộ lọc
              </p>
            )}
          </div>
        </div>

        {/* Layout: Sidebar + Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ✅ Sidebar dùng chung FilterPanel */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-28">
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
            </div>
          </aside>

          {/* Grid */}
          <div className="lg:col-span-9">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#003366]">
                Sản phẩm Sale
              </h2>
              <span className="text-sm text-gray-500">
                {saleProducts.length} sản phẩm
              </span>
            </div>

            {loading ? (
              <div className="text-center py-20">Loading...</div>
            ) : (
              <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
                {currentProducts.map((p) => (
                  <ProductCard
                    key={p.Id_product}
                    p={p}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
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
          </div>
        </div>
      </section>
      {showPopup && <CartPopup product={popupProduct} />}
    </main>
  );
}
