"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DEFAULT_MAX, DEFAULT_MIN, FilterPanel } from "@/app/components/products/FilterPanel";


type SaleProduct = {
    id: string;
    name: string;
    image: string;
    price: string;
    oldPrice: string;
    discountPercent: number;
    rating?: number;
    soldText?: string;
};

const SALE_PRODUCTS: SaleProduct[] = [
    {
        id: "sp1",
        name: "Sữa Rửa Mặt Tràm Trà Dr.FORSKIN Tea tree",
        image: "/img/image%2077.png",
        price: "497.000đ",
        oldPrice: "620.000đ",
        discountPercent: 20,
        rating: 4.8,
        soldText: "Đã bán 1.2k",
    },
    {
        id: "sp2",
        name: "Sáp Zone Clay tạo kiểu tóc",
        image: "/img/image%2077.png",
        price: "350.000đ",
        oldPrice: "420.000đ",
        discountPercent: 17,
        rating: 4.7,
        soldText: "Đã bán 860",
    },
    {
        id: "sp3",
        name: "Dầu gội Volcanic 500ml",
        image: "/img/image%2077.png",
        price: "249.000đ",
        oldPrice: "299.000đ",
        discountPercent: 16,
        rating: 4.6,
        soldText: "Đã bán 540",
    },
    {
        id: "sp4",
        name: "Toner phục hồi (demo)",
        image: "/img/image%2077.png",
        price: "189.000đ",
        oldPrice: "239.000đ",
        discountPercent: 21,
        rating: 4.5,
        soldText: "Đã bán 420",
    },
    {
        id: "sp5",
        name: "Kem chống nắng (demo) SPF50+",
        image: "/img/image%2077.png",
        price: "219.000đ",
        oldPrice: "289.000đ",
        discountPercent: 24,
        rating: 4.9,
        soldText: "Đã bán 2.1k",
    },
    {
        id: "sp6",
        name: "Serum Vitamin C (demo)",
        image: "/img/image%2077.png",
        price: "279.000đ",
        oldPrice: "369.000đ",
        discountPercent: 24,
        rating: 4.8,
        soldText: "Đã bán 1k",
    },
    ...Array.from({ length: 8 }).map((_, i) => ({
        id: `sp_demo_${i + 7}`,
        name: `Sản phẩm sale (demo) #${i + 7}`,
        image: "/img/image%2077.png",
        price: `${179 + i * 10}.000đ`,
        oldPrice: `${249 + i * 10}.000đ`,
        discountPercent: 15 + (i % 4) * 5,
        rating: 4.3 + (i % 6) * 0.1,
        soldText: `Đã bán ${180 + i * 40}`,
    })),
];

function ProductCard({ p }: { p: SaleProduct }) {
    return (
        <div className="group rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden">
            <div className="relative">
                <img src={p.image} alt={p.name} className="w-full h-[210px] object-cover" />

                <span className="absolute top-3 left-3 rounded-full bg-[#003366] text-white px-3 py-1 text-xs font-extrabold">
                    -{p.discountPercent}%
                </span>
            </div>

            <div className="p-4">
                <p className="font-extrabold text-gray-900 line-clamp-2 leading-snug">{p.name}</p>

                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-500">
                    <div className="inline-flex items-center gap-2">
                        <i className="fa-solid fa-star text-amber-400" />
                        <span className="font-bold text-gray-700">{(p.rating ?? 4.6).toFixed(1)}</span>
                    </div>
                    <span>{p.soldText ?? "Đã bán 300+"}</span>
                </div>

                <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                        <p className="font-extrabold text-[#8b1e1e] text-lg tabular-nums">{p.price}</p>
                        <p className="text-sm text-gray-400 line-through tabular-nums">{p.oldPrice}</p>
                    </div>

                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-xl bg-[#003366] px-4 py-2 text-sm font-extrabold text-white hover:bg-[#002244] transition active:scale-95 focus:outline-none"
                    >
                        Thêm
                    </button>
                </div>

                <Link
                    href="/products"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-extrabold text-gray-700 hover:bg-gray-50 transition"
                >
                    Xem chi tiết
                </Link>
            </div>
        </div>
    );
}

export default function PromotionsPage() {
    // ✅ State filter dùng chung (y như products)
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
    };

    return (
        <main>
            {/* Breadcrumb */}
            <div className="max-w-[1604px] mx-auto px-4 mt-10 text-[15px] sm:text-base text-gray-500">
                <div className="flex flex-wrap items-center gap-2">
                    <Link className="hover:text-[#003366] font-semibold transition" href="/">
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
                                    Trang tĩnh kiểu listing sản phẩm sale — sau này gắn API chỉ replace data.
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
                                Đang chọn <span className="font-extrabold text-[#003366]">{filterCount}</span> bộ lọc
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
                                onApply={() => { }}
                                onClear={resetAll}
                            />
                        </div>
                    </aside>

                    {/* Grid */}
                    <div className="lg:col-span-9">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-lg sm:text-xl font-extrabold text-[#003366]">Sản phẩm Sale</h2>
                            <span className="text-sm text-gray-500">{SALE_PRODUCTS.length} sản phẩm</span>
                        </div>

                        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                            {SALE_PRODUCTS.map((p) => (
                                <ProductCard key={p.id} p={p} />
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="mt-8 flex justify-end gap-2">
                            <button className="w-10 h-10 rounded-xl bg-[#003366] text-white font-extrabold focus:outline-none">
                                1
                            </button>
                            <button className="w-10 h-10 rounded-xl border border-gray-200 font-extrabold hover:bg-gray-50 transition focus:outline-none">
                                2
                            </button>
                            <button className="w-10 h-10 rounded-xl border border-gray-200 font-extrabold hover:bg-gray-50 transition focus:outline-none">
                                3
                            </button>
                            <button className="w-10 h-10 rounded-xl border border-gray-200 font-extrabold hover:bg-gray-50 transition focus:outline-none">
                                &gt;&gt;
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
