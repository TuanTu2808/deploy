"use client";
import { Product } from "../../../types/sanpham.type";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  DEFAULT_MAX,
  DEFAULT_MIN,
  FilterPanel,
} from "@/app/components/products/FilterPanel";

function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.Id_product}`}>
      <div className="group cursor-pointer bg-white rounded-[34px] shadow-2xl overflow-hidden flex flex-col transition hover:-translate-y-1">
        <div className="relative overflow-hidden rounded-t-[34px]">
          <div className="aspect-[4/3] flex items-center justify-center bg-[#f8f9fb]">
            <img
              alt={product.Name_product}
              className="w-full h-[250px] object-cover transition duration-300 group-hover:scale-[1.03]"
              src={`http://localhost:5000${product.Thumbnail}`}
            />
          </div>
        </div>

        <div className="bg-white rounded-t-[34px] -mt-4 px-6 pt-6 pb-6 relative flex flex-col space-y-3">
          <h3 className="text-[14px] sm:text-[16px] lg:text-[18px] leading-none font-extrabold text-[#003366] uppercase">
            {product.Name_product}
          </h3>

          <p className="mt-2 text-[#003366] font-semibold text-xs sm:text-sm">
            {product.Category_Name}
          </p>

          <div className="h-[4px] lg:h-[5px] w-12 sm:w-14 lg:w-16 bg-[#003366] mt-2"></div>
          <div className="h-px bg-gray-300 mt-3"></div>

          <p className="mt-2 text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-wider font-bold">
            {product.Price.toLocaleString()} VND
          </p>

          <div className="mt-2 flex items-center mb-4 sm:mb-6">
            <span className="text-[#8b1e1e] font-extrabold text-[20px] sm:text-[22px] lg:text-[24px] leading-none tabular-nums">
              {product.Price.toLocaleString()} VND
            </span>

            <button
              onClick={(e) => e.stopPropagation()}
              className="ml-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#003366] text-white flex items-center justify-center hover:bg-[#00264d] transition"
            >
              <i className="fa-solid fa-heart text-base sm:text-lg"></i>
            </button>
          </div>

          <button
            onClick={(e) => e.stopPropagation()}
            className="mt-auto w-full py-2 sm:py-2 rounded-2xl bg-[#003366] text-white text-sm font-extrabold tracking-wide hover:bg-[#00264d] transition"
          >
            MUA NGAY
          </button>
        </div>
      </div>
    </Link>
  );
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const [openFilter, setOpenFilter] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAppliedFilter, setHasAppliedFilter] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let url = "http://localhost:5000/api/sanpham";
        
        // Nếu có query search, gọi endpoint search
        if (searchQuery.trim()) {
          url = `http://localhost:5000/api/sanpham/search?q=${encodeURIComponent(searchQuery)}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("Lỗi lấy sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<string>(DEFAULT_MIN);
  const [priceMax, setPriceMax] = useState<string>(DEFAULT_MAX);

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
    setHasAppliedFilter(false);
  };

  const handleApplyFilter = async () => {
    try {
      setLoading(true);
      
      // Xây dựng URL với query parameters
      const params = new URLSearchParams();
      
      if (selectedCategories.length > 0) {
        selectedCategories.forEach(cat => params.append('categories', cat));
      }
      
      if (selectedBrands.length > 0) {
        selectedBrands.forEach(brand => params.append('brands', brand));
      }
      
      if (priceMin !== DEFAULT_MIN) {
        params.append('priceMin', priceMin);
      }
      
      if (priceMax !== DEFAULT_MAX) {
        params.append('priceMax', priceMax);
      }

      const url = `http://localhost:5000/api/sanpham/filter?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      
      setProducts(data);
      setHasAppliedFilter(true);
    } catch (error) {
      console.error("Lỗi lọc sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <section className="max-w-[1604px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        {/* Search header */}
        {searchQuery && (
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#003366] mb-2">
              Kết quả tìm kiếm cho: <span className="text-[#33B1FA]">"{searchQuery}"</span>
            </h1>
            <p className="text-gray-600">Tìm thấy {products.length} sản phẩm</p>
          </div>
        )}

        {/* Filter applied header */}
        {!searchQuery && hasAppliedFilter && filterCount > 0 && (
          <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#003366] mb-2">Đã áp dụng {filterCount} bộ lọc</h2>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map(cat => (
                    <span key={cat} className="px-3 py-1 bg-white border border-blue-200 rounded-full text-sm font-semibold text-gray-700">
                      {cat}
                    </span>
                  ))}
                  {selectedBrands.map(brand => (
                    <span key={brand} className="px-3 py-1 bg-white border border-blue-200 rounded-full text-sm font-semibold text-gray-700">
                      {brand}
                    </span>
                  ))}
                  {priceChanged && (
                    <span className="px-3 py-1 bg-white border border-blue-200 rounded-full text-sm font-semibold text-gray-700">
                      {priceMin} - {priceMax} VND
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-8 lg:gap-12">
          {!searchQuery && (
            <aside className="hidden lg:block col-span-3">
              <div className="sticky top-24">
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
          )}

          <div className={searchQuery ? "col-span-12" : "col-span-12 lg:col-span-9"}>
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#003366] border-t-transparent"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <i className="fa-solid fa-magnifying-glass text-5xl text-gray-300 mb-4 block"></i>
                <h2 className="text-xl font-bold text-gray-600 mb-2">
                  {searchQuery ? "Không tìm thấy sản phẩm" : "Không tìm thấy sản phẩm"}
                </h2>
                <p className="text-gray-500">
                  {searchQuery 
                    ? `Không có sản phẩm nào khớp với "${searchQuery}". Vui lòng thử tìm kiếm với từ khóa khác.` 
                    : hasAppliedFilter 
                      ? "Không có sản phẩm nào khớp với bộ lọc được chọn. Vui lòng thay đổi điều kiện lọc."
                      : "Vui lòng quay lại sau"
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {products.map((item) => (
                  <ProductCard key={item.Id_product} product={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}