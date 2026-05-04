"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchBookingComboCatalog,
  type BookingComboCatalog,
  type BookingComboItem,
} from "@/lib/booking-combo";
import {
  buildBookingFlowHref,
  readStoredBookingFlowSelection,
  selectComboInBookingSelection,
  writeStoredBookingFlowSelection,
} from "@/lib/booking-flow-selection";

type SortValue = "popular" | "price_asc" | "price_desc" | "newest";

type ComboCatalogPageProps = {
  initialSort: SortValue;
  initialCategory: string;
  initialQuery: string;
  initialComboId: number | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.25zone.io.vn";
const PAGE_SIZE = 6;

const SORT_OPTIONS: Array<{ value: SortValue; label: string }> = [
  { value: "popular", label: "Phổ biến nhất" },
  { value: "price_asc", label: "Giá thấp đến cao" },
  { value: "price_desc", label: "Giá cao đến thấp" },
  { value: "newest", label: "Mới nhất" },
];

const normalizeText = (value: string | null | undefined) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))}đ`;

const pickBadge = (combo: BookingComboItem, index: number) => {
  const normalizedName = normalizeText(combo.Name);
  if (combo.Id_combo === 5 || normalizedName.includes("shine")) {
    return {
      label: "Best Seller",
      className: "bg-[#FFD700] text-text-main",
    };
  }
  if (combo.Id_combo === 11 || normalizedName.includes("cat uon nhuom")) {
    return {
      label: "Hot Deal",
      className: "bg-red-600 text-white",
    };
  }
  if (index % 4 === 0) {
    return {
      label: "Combo VIP",
      className: "bg-purple-600 text-white",
    };
  }
  return null;
};

const pickCardIcon = (combo: BookingComboItem) => {
  const normalizedCategories = combo.category_names.map(normalizeText).join(" ");
  if (normalizedCategories.includes("cat")) return "content_cut";
  if (normalizedCategories.includes("uon")) return "waves";
  if (normalizedCategories.includes("nhuom")) return "palette";
  if (normalizedCategories.includes("thu gian")) return "self_improvement";
  if (normalizedCategories.includes("cham soc da")) return "spa";
  return "auto_awesome";
};

const pickChipIcon = (categoryName: string) => {
  const normalized = normalizeText(categoryName);
  if (normalized.includes("cat")) return "content_cut";
  if (normalized.includes("uon") || normalized.includes("nhuom")) return "palette";
  if (normalized.includes("thu gian")) return "self_improvement";
  if (normalized.includes("cham soc da")) return "face";
  return "sell";
};

function ComboCatalogSkeleton() {
  return (
    <div className="relative z-30 bg-background-light pt-10 sm:pt-12 pb-14 sm:pb-20">
      <div className="max-w-content mx-auto px-4 sm:px-6 xl:px-0">
        <div className="h-12 w-80 rounded-xl bg-gray-200 animate-pulse mb-10" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5 sm:gap-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`combo-skeleton-${index}`}
              className="h-[540px] rounded-2xl bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

type ComboCardProps = {
  combo: BookingComboItem;
  index: number;
  highlighted: boolean;
  combos: BookingComboItem[];
};

function ComboCard({ combo, index, highlighted, combos }: ComboCardProps) {
  const router = useRouter();
  const badge = pickBadge(combo, index);
  const imageUrl = combo.Image_URL;
  const featureLines =
    combo.feature_lines.length > 0
      ? combo.feature_lines.slice(0, 3)
      : combo.service_names.length > 0
      ? combo.service_names.slice(0, 3)
      : combo.category_names.slice(0, 3);
  const handleBookCombo = useCallback(() => {
    const currentSelection = readStoredBookingFlowSelection();
    const result = selectComboInBookingSelection(
  currentSelection,
  combo.Id_combo,
  combos
);
    const nextSelection = result.selection;

    writeStoredBookingFlowSelection(nextSelection);
    router.push(
      buildBookingFlowHref(2, nextSelection, {
        notice:
          result.status === "duplicate"
            ? "combo_duplicate"
            : result.status === "conflict"
              ? "combo_conflict"
              : result.status === "added"
                ? "combo_selected"
                : undefined,
      }),
    );
  }, [combo.Id_combo, router]);

  return (
    <article
      id={`combo-${combo.Id_combo}`}
      className={`group relative flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-card-hover transition-all duration-500 border ${
        highlighted
          ? "border-primary ring-2 ring-primary/50"
          : "border-gray-100 hover:border-primary/50"
      }`}
    >
      <div className="relative h-[180px] sm:h-[220px] lg:h-[280px] overflow-hidden">
        {badge ? (
          <div
            className={`absolute top-0 left-0 z-20 text-sm font-black uppercase px-4 py-2 clip-badge h-12 flex items-start pt-1.5 shadow-md ${badge.className}`}
          >
            {badge.label}
          </div>
        ) : null}

        <div className="absolute top-4 right-4 z-20 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20">
          <span className="material-symbols-outlined text-[#FFD700] text-base">
            timer
          </span>
          <span>{combo.Duration_time ? `${combo.Duration_time} phút` : "Đang cập nhật"}</span>
        </div>

        {imageUrl ? (
          <div
            className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
            style={{ backgroundImage: `url("${imageUrl}")` }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center text-gray-500 px-4 text-center">
            <span className="material-symbols-outlined text-4xl mb-2">
              image_not_supported
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide">
              Chưa cập nhật ảnh
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5 sm:p-6 relative">
        <div className="absolute -top-5 sm:-top-6 right-5 sm:right-6 size-10 sm:size-12 bg-primary rounded-full flex items-center justify-center shadow-lg border-4 border-white z-20 group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-text-main">
            {pickCardIcon(combo)}
          </span>
        </div>

        <div className="mb-4">
          <h3 className="text-xl sm:text-2xl font-heading font-bold uppercase leading-tight mb-2 text-text-main group-hover:text-[#0F4F96] transition-colors line-clamp-2">
            {combo.Name}
          </h3>
          <p className="text-gray-500 text-[13px] sm:text-sm line-clamp-3">
            {combo.Description || "Combo dịch vụ chuyên nghiệp, tối ưu trải nghiệm tại salon."}
          </p>
        </div>

        <div className="flex flex-col gap-2 mb-6 bg-surface-light/50 p-3 rounded-lg border border-surface-light min-h-[110px]">
          {featureLines.length > 0 ? (
            featureLines.map((line, lineIndex) => (
              <div
                key={`${combo.Id_combo}-line-${lineIndex}`}
                className="flex items-center gap-2 text-[13px] sm:text-sm font-semibold text-gray-700"
              >
                <span className="material-symbols-outlined text-green-600 text-lg">
                  check_circle
                </span>
                <span className="line-clamp-1">{line}</span>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2 text-[13px] sm:text-sm font-semibold text-gray-500">
              <span className="material-symbols-outlined text-gray-400 text-lg">info</span>
              <span>Đang cập nhật chi tiết dịch vụ.</span>
            </div>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 pt-4 border-t border-dashed border-gray-200">
          <div>
            <div className="text-xs text-gray-400 font-medium mb-0.5">
              {combo.service_count > 0 ? `${combo.service_count} dịch vụ` : "Combo"}
            </div>
            <div className="text-2xl sm:text-3xl font-heading font-bold text-red-600">
              {formatCurrency(combo.Price)}
            </div>
          </div>
          <button
            type="button"
            onClick={handleBookCombo}
            className="flex-1 h-11 sm:h-12 bg-text-main hover:bg-primary hover:text-text-main text-white text-xs sm:text-sm font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg group-hover:shadow-primary/30"
          >
            <span>Đặt ngay</span>
            <span className="material-symbols-outlined text-lg">calendar_month</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export default function ComboCatalogPage({
  initialSort,
  initialCategory,
  initialQuery,
  initialComboId,
}: ComboCatalogPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const syncParamsRef = useRef(false);

  const [catalog, setCatalog] = useState<BookingComboCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sortBy, setSortBy] = useState<SortValue>(initialSort);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory || "all");
  const [searchValue, setSearchValue] = useState(initialQuery);
  const [focusComboId, setFocusComboId] = useState<number | null>(initialComboId);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loadCatalog = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const nextCatalog = await fetchBookingComboCatalog();
      setCatalog(nextCatalog);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu combo.");
      setCatalog(null);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog(true);
  }, [loadCatalog]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const source = new EventSource(`${API_BASE}/api/realtime/booking-updates`);
    const onBookingContent = () => {
      void loadCatalog(false);
    };

    source.addEventListener("booking-content", onBookingContent);
    source.onerror = () => {};

    return () => {
      source.removeEventListener("booking-content", onBookingContent);
      source.close();
    };
  }, [loadCatalog]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const interval = window.setInterval(() => {
      void loadCatalog(false);
    }, 10_000);

    const onFocus = () => {
      void loadCatalog(false);
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadCatalog]);

  const categories = useMemo(() => {
    const base = [{ key: "all", label: "Tất cả", total: catalog?.combos.length || 0 }];
    if (!catalog) return base;
    return [
      ...base,
      ...catalog.categories.map((category) => ({
        key: String(category.Id_category_service),
        label: category.Name,
        total: category.combo_total,
      })),
    ];
  }, [catalog]);

  const normalizedSearch = useMemo(() => normalizeText(searchValue), [searchValue]);

  const filteredCombos = useMemo(() => {
    const source = catalog?.combos || [];
    const byCategory =
      categoryFilter === "all"
        ? source
        : source.filter((combo) => combo.category_ids.includes(Number(categoryFilter)));

    const byKeyword = normalizedSearch
      ? byCategory.filter((combo) => {
          const haystack = normalizeText(
            [
              combo.Name,
              combo.Description || "",
              combo.category_names.join(" "),
              combo.service_names.join(" "),
            ].join(" ")
          );
          return haystack.includes(normalizedSearch);
        })
      : byCategory;

    const sorted = [...byKeyword];
    sorted.sort((left, right) => {
      if (sortBy === "price_asc") return left.Price - right.Price;
      if (sortBy === "price_desc") return right.Price - left.Price;
      if (sortBy === "newest") return right.Id_combo - left.Id_combo;

      const scoreDiff = right.service_count - left.service_count;
      if (scoreDiff !== 0) return scoreDiff;
      return right.Id_combo - left.Id_combo;
    });

    return sorted;
  }, [catalog, categoryFilter, normalizedSearch, sortBy]);

  useEffect(() => {
    const focusIndex = focusComboId
      ? filteredCombos.findIndex((combo) => combo.Id_combo === focusComboId)
      : -1;

    if (focusIndex >= 0) {
      const requiredCount = (Math.floor(focusIndex / PAGE_SIZE) + 1) * PAGE_SIZE;
      setVisibleCount(Math.max(PAGE_SIZE, requiredCount));
      return;
    }

    setVisibleCount(PAGE_SIZE);
  }, [filteredCombos, focusComboId, categoryFilter, sortBy, normalizedSearch]);

  useEffect(() => {
    if (!focusComboId) return;
    const target = document.getElementById(`combo-${focusComboId}`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusComboId, visibleCount]);

  useEffect(() => {
    if (!syncParamsRef.current) {
      syncParamsRef.current = true;
      return;
    }

    const params = new URLSearchParams();
    if (sortBy !== "popular") params.set("sort", sortBy);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (searchValue.trim()) params.set("q", searchValue.trim());
    if (focusComboId) params.set("comboId", String(focusComboId));
    router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`, {
      scroll: false,
    });
  }, [sortBy, categoryFilter, searchValue, focusComboId, pathname, router]);

  const visibleCombos = filteredCombos.slice(0, visibleCount);
  const hasMore = filteredCombos.length > visibleCount;

  const onClickCategory = (categoryKey: string) => {
    setCategoryFilter(categoryKey);
  };

  return (
    <>
      <div className="relative w-full bg-background-dark overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div
          className="absolute inset-0 z-0 scale-105"
          style={{
            backgroundImage:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDZEkuRrvtNlvt44BtWgDQbL3-PPIQh3F-12JQovq0VzV989URnuZfGyuzlXqGfkLkpQ5865o5MW3tDnQuD7C8RbmDzIOCDuZdq_yu-BFzUf2L-1BfjeB-NnoVoPRBiGJfitNbiLAE-3tja9x5C2lfp86RgJiXPSaeCmQsbOwhCzug1ZayAy0_jpwB2EKgr3T0i54m_FwkpBDu185K-6eTA_YHXh20Y5HgSlGbrdxf_kj_w6kr75KsihfZJE6wlGyB9ShVKqwRUSLU")',
            backgroundPosition: "center 20%",
            backgroundSize: "cover",
          }}
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-background-dark via-background-dark/60 to-transparent lg:bg-gradient-to-r lg:from-background-dark/90 lg:via-background-dark/50 lg:to-transparent" />
        <div className="relative z-20 max-w-content mx-auto px-4 sm:px-6 xl:px-0 h-[360px] sm:h-[460px] lg:h-[600px] flex items-center">
          <div className="max-w-3xl flex flex-col items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 pt-6 sm:pt-10">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 sm:w-12 bg-primary" />
              <span className="text-primary text-[10px] sm:text-sm md:text-base font-bold uppercase tracking-[0.2em]">
                Đẳng cấp phái mạnh
              </span>
            </div>
            <h1 className="text-white font-heading text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black leading-[1.05] sm:leading-[0.95] tracking-tight uppercase">
              Trải nghiệm
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary">
                Đỉnh cao
              </span>
            </h1>
            <p className="text-gray-300 text-sm sm:text-base md:text-xl font-medium max-w-xl leading-relaxed border-l-0 sm:border-l-4 border-primary pl-0 sm:pl-6">
              Hệ thống các gói combo dịch vụ toàn diện, được thiết kế riêng để
              nâng cấp diện mạo và mang lại sự thư giãn tuyệt đối.
            </p>
            <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <Link
                href="/chonsalon?step=1"
                className="group relative h-12 sm:h-14 px-6 sm:px-10 bg-primary hover:bg-white text-text-main text-sm sm:text-lg font-black uppercase tracking-wider rounded-none skew-x-[-10deg] transition-all duration-300 shadow-[0_0_20px_rgba(51,177,250,0.4)] w-full sm:w-auto inline-flex items-center justify-center"
              >
                <span className="block skew-x-[10deg] group-hover:scale-105 transition-transform">
                  Đặt lịch ngay
                </span>
              </Link>
              <Link
                href="/chinhanh"
                className="group h-12 sm:h-14 px-5 sm:px-8 border-2 border-white/30 hover:border-white text-white hover:text-white text-sm sm:text-base font-bold uppercase tracking-wider rounded-none skew-x-[-10deg] transition-all backdrop-blur-sm w-full sm:w-auto inline-flex items-center justify-center"
              >
                <span className="block skew-x-[10deg]">Tư vấn dịch vụ</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <ComboCatalogSkeleton />
      ) : (
        <div className="relative z-30 bg-background-light pt-10 sm:pt-12 pb-14 sm:pb-20">
          <div className="max-w-content mx-auto px-4 sm:px-6 xl:px-0">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8 mb-8 sm:mb-12">
              <div className="flex flex-col gap-3">
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-heading font-black text-text-main uppercase tracking-tight">
                  Chọn gói dịch vụ{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary">
                    Hoàn hảo
                  </span>
                </h2>
                <p className="text-gray-500 text-sm sm:text-base lg:text-lg font-medium max-w-2xl">
                  Dữ liệu combo được đồng bộ trực tiếp từ hệ thống quản trị.
                  Chọn danh mục, sắp xếp và đặt lịch ngay tại salon gần bạn.
                </p>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100 w-full sm:w-auto">
                <span className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-wider ml-2">
                  Xếp theo:
                </span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortValue)}
                  className="form-select border-none bg-transparent text-xs sm:text-sm font-bold text-text-main focus:ring-0 cursor-pointer py-2 pr-8 pl-2 w-full sm:w-auto"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <input
                value={searchValue}
                onChange={(event) => {
                  setSearchValue(event.target.value);
                  setFocusComboId(null);
                }}
                placeholder="Tìm combo theo tên, mô tả hoặc dịch vụ..."
                className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm font-medium text-text-main outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="sticky top-20 z-40 bg-background-light/95 backdrop-blur-md py-3 sm:py-4 mb-8 sm:mb-10 border-b border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {categories.map((category) => {
                  const active = categoryFilter === category.key;
                  const icon = category.key === "all" ? "grid_view" : pickChipIcon(category.label);

                  return (
                    <button
                      key={category.key}
                      type="button"
                      onClick={() => {
                        onClickCategory(category.key);
                        setFocusComboId(null);
                      }}
                      className={`h-9 sm:h-10 px-4 sm:px-6 rounded-lg whitespace-nowrap shrink-0 text-sm font-bold transition-all hover:-translate-y-0.5 ${
                        active
                          ? "bg-text-main text-white shadow-lg hover:shadow-xl"
                          : "bg-white border border-gray-200 hover:border-primary hover:bg-surface-light text-text-main"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">{icon}</span>
                        {category.label}
                        <span className="text-xs opacity-70">({category.total})</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error ? (
              <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {!error && filteredCombos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
                <p className="text-lg font-bold text-text-main mb-1">
                  Không tìm thấy combo phù hợp
                </p>
                <p className="text-sm text-gray-500">
                  Thử đổi danh mục, từ khóa hoặc cách sắp xếp để xem thêm kết quả.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5 sm:gap-8 mb-12 sm:mb-20">
                  {visibleCombos.map((combo, index) => (
                    <ComboCard
                      key={combo.Id_combo}
                      combo={combo}
                      index={index}
                      highlighted={focusComboId === combo.Id_combo}
                      combos={catalog?.combos || []} // 👈 thêm
                    />
                  ))}
                </div>

                {hasMore ? (
                  <div className="flex justify-center mb-12">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                      className="group relative overflow-hidden bg-white border border-gray-300 hover:border-primary text-text-main text-sm sm:text-base font-bold py-3 sm:py-4 px-8 sm:px-12 rounded-full transition-all duration-300 shadow-sm hover:shadow-lg"
                    >
                      <span className="relative z-10 flex items-center gap-2 group-hover:text-primary-hover transition-colors">
                        XEM THÊM {Math.max(filteredCombos.length - visibleCount, 0)} DỊCH VỤ KHÁC
                        <span className="material-symbols-outlined group-hover:animate-bounce">
                          keyboard_arrow_down
                        </span>
                      </span>
                      <div className="absolute inset-0 bg-text-main opacity-0 group-hover:opacity-100 transition-opacity duration-300 origin-bottom scale-y-0 group-hover:scale-y-100 ease-out" />
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
