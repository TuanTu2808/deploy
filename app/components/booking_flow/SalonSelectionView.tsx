"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildBookingFlowHref,
  normalizeBookingFlowSelection,
  resolveClientBookingFlowSelection,
  setSalonInBookingSelection,
  type BookingFlowSelection,
  writeStoredBookingFlowSelection,
} from "@/lib/booking-flow-selection";
import type { BookingSalon } from "@/lib/booking-salons";

type SalonSelectionViewProps = {
  salons: BookingSalon[];
  initialSelection: BookingFlowSelection;
  initialNotice?: string;
};

const PAGE_SIZE = 6;
const FEEDBACK_VISIBLE_MS = 5000;

const normalizeKeyword = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

const getInitialPage = (items: BookingSalon[], salonId?: number | null) => {
  if (!salonId) return 1;
  const selectedIndex = items.findIndex((salon) => salon.id === salonId);
  if (selectedIndex < 0) return 1;
  return Math.floor(selectedIndex / PAGE_SIZE) + 1;
};

const getInitialNoticeMessage = (notice?: string) => {
  if (notice === "inactive_selection") return "Combo hoặc dịch vụ bạn đang chọn đang ngưng hoạt động. Vui lòng chọn lại.";
  if (notice === "salon_selected") return "Salon bạn chọn từ trang chi nhánh đã được giữ lại ở đây.";
  if (notice === "salon_updated") return "Đã cập nhật salon cho lịch hẹn hiện tại.";
  if (notice === "salon_duplicate") return "Salon này đã được chọn sẵn.";
  return "";
};

function SearchIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
    </svg>
  );
}

function ChevronIcon({ direction = "right", className = "h-4 w-4" }: { direction?: "left" | "right"; className?: string; }) {
  return (
    <svg className={`${className} ${direction === "left" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  );
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;  
  const dLon = (lon2 - lon1) * Math.PI / 180; 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
};

export default function SalonSelectionView({
  salons,
  initialSelection,
  initialNotice,
}: SalonSelectionViewProps) {
  const [selection, setSelection] = useState(() =>
    resolveClientBookingFlowSelection(initialSelection)
  );
  const [isMounted, setIsMounted] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [currentPage, setCurrentPage] = useState(() => getInitialPage(salons, initialSelection.salonId));
  const [selectionFeedback, setSelectionFeedback] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [pendingSelection, setPendingSelection] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasHandledFilterReset = useRef(false);
  const lastSelectionRef = useRef<string>("");

  const fetchLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLocating(false);
        },
        (error) => {
          console.warn("Geolocation error:", error);
          if (error.code === error.PERMISSION_DENIED) {
            setLocationError("Trình duyệt chưa được cấp quyền vị trí.");
          } else {
            setLocationError("Không thể lấy vị trí hiện tại.");
          }
          setIsLocating(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setLocationError("Trình duyệt không hỗ trợ vị trí.");
      setIsLocating(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  useEffect(() => {
    const resolved = resolveClientBookingFlowSelection(initialSelection);
    const nextStr = JSON.stringify(resolved);

    if (lastSelectionRef.current === nextStr) {
      setIsMounted(true);
      return;
    }
    
    lastSelectionRef.current = nextStr;
    setSelection(resolved);
    writeStoredBookingFlowSelection(resolved);
    setCurrentPage(getInitialPage(salons, resolved.salonId));
    setIsMounted(true);
  }, [initialSelection, salons]);

  useEffect(() => {
    const message = getInitialNoticeMessage(initialNotice);
    if (message) setSelectionFeedback(message);
  }, [initialNotice]);

  useEffect(() => {
    if (!selectionFeedback) return;
    const timeout = window.setTimeout(() => setSelectionFeedback(""), FEEDBACK_VISIBLE_MS);
    return () => window.clearTimeout(timeout);
  }, [selectionFeedback]);

  const salonsWithDistance = useMemo(() => {
    if (!userLocation) return salons;
    return salons.map(s => {
      if (s.latitude && s.longitude) {
         const dist = calculateDistance(userLocation.lat, userLocation.lng, s.latitude, s.longitude);
         return { ...s, distanceValue: dist };
      }
      return s;
    });
  }, [salons, userLocation]);

  const provinceOptions = useMemo(() =>
    Array.from(new Set(salonsWithDistance.map((salon) => salon.province.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "vi")),
    [salonsWithDistance]
  );

  const selectedSalon = salonsWithDistance.find((salon) => salon.id === selection.salonId);
  const normalizedKeyword = normalizeKeyword(searchKeyword);
  const normalizedProvince = selectedProvince === "all" ? "" : normalizeKeyword(selectedProvince);

  const provinceFilteredSalons = selectedProvince === "all" ? salonsWithDistance : salonsWithDistance.filter((salon) => normalizeKeyword(salon.province) === normalizedProvince);
  const filteredSalons = normalizedKeyword
    ? provinceFilteredSalons.filter((salon) =>
      normalizeKeyword(`${salon.name} ${salon.address} ${salon.phone} ${salon.ward} ${salon.province}`).includes(normalizedKeyword)
    )
    : provinceFilteredSalons;

  const sortedFilteredSalons = useMemo(() => {
    const list = [...filteredSalons];
    if (userLocation) {
      list.sort((a, b) => {
        if (a.distanceValue === undefined) return 1;
        if (b.distanceValue === undefined) return -1;
        return a.distanceValue - b.distanceValue;
      });
    }
    return list;
  }, [filteredSalons, userLocation]);

  const totalPages = Math.max(1, Math.ceil(sortedFilteredSalons.length / PAGE_SIZE));
  const pageStartIndex = (currentPage - 1) * PAGE_SIZE;
  const pageEndIndex = pageStartIndex + PAGE_SIZE;
  const visibleSalons = sortedFilteredSalons.slice(pageStartIndex, pageEndIndex);
  const visibleStart = sortedFilteredSalons.length ? pageStartIndex + 1 : 0;
  const visibleEnd = Math.min(pageEndIndex, sortedFilteredSalons.length);

  useEffect(() => {
    if (!hasHandledFilterReset.current) {
      hasHandledFilterReset.current = true;
      return;
    }
    setCurrentPage(1);
  }, [normalizedKeyword, selectedProvince]);

  useEffect(() => {
    setCurrentPage((prev) => Math.max(1, Math.min(prev, totalPages)));
  }, [totalPages]);

  const buildStepHref = (step: number, overrides: Partial<BookingFlowSelection> = {}) =>
    buildBookingFlowHref(step, normalizeBookingFlowSelection({ ...selection, ...overrides }));

  const updateSelection = (nextSelection: BookingFlowSelection) => {
    setSelection(nextSelection);
    writeStoredBookingFlowSelection(nextSelection);
    lastSelectionRef.current = JSON.stringify(nextSelection);
    return nextSelection;
  };

  const clearAllFilters = () => {
    setSelectedProvince("all");
    setSearchKeyword("");
  };

  const handleClearSelection = () => {
    const nextSelection = normalizeBookingFlowSelection({ phone: selection.phone, salonId: null, serviceIds: [], comboIds: [] });
    updateSelection(nextSelection);
    setSelectionFeedback("Đã xóa toàn bộ dịch vụ và combo đang giữ.");
  };

  const MAX_DISTANCE_KM = 15;

  const handleSelectSalon = (salonId: number) => {
    const salon = salonsWithDistance.find(s => s.id === salonId);
    if (salon && salon.distanceValue !== undefined && salon.distanceValue > MAX_DISTANCE_KM) {
       setPendingSelection(salonId);
       return;
    }
    confirmSelectSalon(salonId);
  };

  const confirmSelectSalon = (salonId: number) => {
    const nextSelection = updateSelection(setSalonInBookingSelection(selection, salonId));
    setSelectionFeedback("Đã chọn salon thành công.");
    setPendingSelection(null);
  };

  const selectedItemCount = selection.serviceIds.length + (selection.comboIds?.length || 0);

  const pageButtons: Array<number | "left-dots" | "right-dots"> = [];
  if (totalPages <= 5) {
    for (let page = 1; page <= totalPages; page += 1) pageButtons.push(page);
  } else {
    pageButtons.push(1);
    if (currentPage > 3) pageButtons.push("left-dots");
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);
    for (let page = startPage; page <= endPage; page += 1) pageButtons.push(page);
    if (currentPage < totalPages - 2) pageButtons.push("right-dots");
    pageButtons.push(totalPages);
  }

  return (
    <>
      {/* CẢNH BÁO KHOẢNG CÁCH */}
      {pendingSelection && (() => {
        const salon = salonsWithDistance.find(s => s.id === pendingSelection);
        const closestSalon = salonsWithDistance
          .filter(s => s.distanceValue !== undefined)
          .sort((a, b) => (a.distanceValue || Infinity) - (b.distanceValue || Infinity))[0];

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Chi nhánh ở khá xa</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Chi nhánh <strong>{salon?.name}</strong> cách vị trí hiện tại của bạn khoảng <strong>{salon?.distanceValue?.toFixed(1)} km</strong>. Bạn có chắc chắn muốn đặt lịch tại đây không?
              </p>
              
              {closestSalon && closestSalon.id !== salon?.id && (
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/80 p-4">
                  <p className="text-[13px] text-blue-800 mb-3">
                    <span className="font-bold text-blue-900">💡 Gợi ý:</span> Chi nhánh <strong>{closestSalon.name}</strong> gần bạn nhất (chỉ cách <strong>{closestSalon.distanceValue?.toFixed(1)} km</strong>).
                  </p>
                  <button
                    onClick={() => confirmSelectSalon(closestSalon.id)}
                    className="flex w-full items-center justify-center rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 shadow-sm"
                  >
                    Chọn chi nhánh này
                  </button>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setPendingSelection(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  onClick={() => confirmSelectSalon(pendingSelection)}
                  className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Vẫn tiếp tục
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* HEADER: Tiêu đề, Mô tả và Thanh tiến trình (Giống bước 2) */}
      <section className="rounded-3xl border border-gray-100 bg-white p-3 shadow-sm sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 sm:gap-6">
          <div className="flex-1">
            <h1 className="mt-1 text-xl font-black text-slate-900 sm:text-3xl lg:text-4xl">
              Chọn salon
            </h1>
            <p className="mt-2 hidden max-w-2xl text-[12px] text-slate-600 sm:block sm:text-base">
              Vui lòng chọn cơ sở thuận tiện nhất để tiếp tục hoàn thiện lịch hẹn của bạn.
            </p>

            <div className="mt-4 flex w-full items-center gap-2 overflow-x-auto pb-1 sm:overflow-visible lg:justify-between">
              <div className="inline-flex shrink-0 items-center justify-center rounded-full border border-blue-300 bg-blue-50 px-4 py-2 text-[11px] font-semibold text-blue-700 sm:min-w-[140px] sm:text-sm lg:min-w-[210px] lg:px-6 lg:py-3 lg:text-base shadow-sm">
                1. Chọn salon
              </div>
              <span className="h-px w-4 shrink-0 bg-slate-200 sm:w-10 lg:mx-2 lg:w-auto lg:flex-1" />
              <Link
                href={buildStepHref(2)}
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700 sm:min-w-[140px] sm:text-sm lg:min-w-[210px] lg:px-6 lg:py-3 lg:text-base transition-colors"
              >
                2. Dịch vụ
              </Link>
              <span className="h-px w-4 shrink-0 bg-slate-200 sm:w-10 lg:mx-2 lg:w-auto lg:flex-1" />
              <Link
                href={buildStepHref(3)}
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700 sm:min-w-[140px] sm:text-sm lg:min-w-[210px] lg:px-6 lg:py-3 lg:text-base transition-colors"
              >
                3. Chọn thợ
              </Link>
              <span className="h-px w-4 shrink-0 bg-slate-200 sm:w-10 lg:mx-2 lg:w-auto lg:flex-1" />
              <div className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-600 sm:min-w-[140px] sm:text-sm lg:min-w-[210px] lg:px-6 lg:py-3 lg:text-base">
                4. Xác nhận
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start pb-28 lg:pb-0">
        {/* CỘT TRÁI: DANH SÁCH CHI NHÁNH VÀ BỘ LỌC */}
        <section className="flex-1 w-full space-y-4">
          {selectionFeedback ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
              {selectionFeedback}
            </div>
          ) : null}

          {/* BỘ LỌC VÀ TÌM KIẾM (KIỂU BƯỚC 2) */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Lọc Tỉnh thành (Select Box cho gọn) */}
              <div className="relative">
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="h-9 appearance-none rounded-full border border-slate-200 bg-white pl-4 pr-10 text-[12px] font-semibold text-slate-700 focus:border-blue-500 focus:outline-none shadow-sm"
                >
                  <option value="all">Tất cả tỉnh thành</option>
                  {provinceOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Tìm kiếm */}
              <div 
                className={`flex items-center gap-2 rounded-full border border-slate-200 bg-white shadow-sm transition-all duration-300 ${isSearchExpanded || searchKeyword ? "px-3 py-1.5 w-[140px] sm:w-[180px]" : "w-10 h-10 justify-center cursor-pointer"}`}
                onClick={() => {
                  if (!isSearchExpanded) {
                    setIsSearchExpanded(true);
                    setTimeout(() => searchInputRef.current?.focus(), 50);
                  }
                }}
              >
                <SearchIcon className="h-4 w-4 text-slate-400 shrink-0" />
                {(isSearchExpanded || searchKeyword) && (
                  <input
                    ref={searchInputRef}
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onBlur={() => {
                      if (!searchKeyword) setIsSearchExpanded(false);
                    }}
                    className="w-full bg-transparent text-[12px] text-slate-700 placeholder-slate-400 focus:outline-none border-none"
                    placeholder="Tìm salon..."
                    type="text"
                  />
                )}
              </div>

              {(selectedProvince !== "all" || searchKeyword) && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition-colors hover:border-red-200 hover:text-red-700"
                >
                  Đặt lại
                </button>
              )}
            </div>

            {/* THÔNG BÁO VỊ TRÍ */}
            <div className="flex items-center gap-2 text-[12px]">
              {isLocating ? (
                <span className="text-slate-500 animate-pulse">⏳ Đang lấy vị trí của bạn để tính khoảng cách...</span>
              ) : locationError ? (
                <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                  <span className="text-red-600 font-medium">⚠️ {locationError}</span>
                  <button onClick={fetchLocation} className="text-blue-600 underline font-semibold hover:text-blue-700 transition">Thử lại</button>
                </div>
              ) : userLocation ? (
                <span className="text-green-600 font-medium flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  Đã lấy vị trí (đang ưu tiên salon gần nhất)
                </span>
              ) : null}
            </div>
          </div>

          {sortedFilteredSalons.length > 0 && (
            <div className="text-[11px] font-medium text-slate-500 sm:text-sm">
              Hiển thị {visibleStart}-{visibleEnd} / {sortedFilteredSalons.length} salon
            </div>
          )}

          {sortedFilteredSalons.length ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {visibleSalons.map((salon) => {
                const isSelected = salon.id === selection.salonId;
                return (
                  <div
                    key={salon.id}
                    onClick={() => handleSelectSalon(salon.id)}
                    className={`group cursor-pointer overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isSelected ? "border-blue-600 ring-1 ring-blue-600/20" : "border-slate-100"
                      }`}
                  >
                    <div className="relative h-40 overflow-hidden sm:h-44">
                      <img
                        src={salon.image}
                        alt={salon.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute left-3 top-3 flex flex-col gap-2 items-start">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-lg ${salon.status === "Đang mở"
                            ? "bg-red-500 text-white"
                            : "bg-green-600 text-white"
                          }`}
                        >
                          {salon.status}
                        </span>
                        {salon.distanceValue !== undefined && salon.distanceValue === sortedFilteredSalons[0]?.distanceValue && (
                          <span className="inline-flex items-center rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold text-white shadow-lg">
                            📍 Gần bạn nhất
                          </span>
                        )}
                      </div>
                      {salon.distanceValue !== undefined && (
                        <div className="absolute right-3 top-3">
                          <span className="inline-flex items-center rounded-full bg-blue-100/90 px-3 py-1 text-[10px] font-bold text-blue-800 shadow-lg backdrop-blur-sm">
                             Cách {salon.distanceValue < 1 ? "< 1" : salon.distanceValue.toFixed(1)} km
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <h3 className="line-clamp-1 text-[15px] font-bold text-slate-900 group-hover:text-blue-700 transition-colors uppercase tracking-tight">
                        {salon.name}
                      </h3>
                      <p className="line-clamp-2 min-h-[32px] text-[12px] text-slate-500 leading-relaxed">
                        {salon.address}
                      </p>
                      <button
                        type="button"
                        className={`flex w-full items-center justify-center rounded-xl py-2 text-[11px] font-semibold transition-colors sm:text-base ${isSelected
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          : "bg-blue-900 text-white hover:bg-blue-800 shadow-sm"
                          }`}
                      >
                        {isSelected ? "✅ Đã chọn" : "Chọn salon này"}
                        {!isSelected && (
                          <svg
                            className="ml-2 h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center text-slate-400 italic shadow-sm">
              Không tìm thấy salon nào phù hợp
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[12px] font-medium text-slate-500 sm:text-sm">
                Trang <span className="text-slate-900">{currentPage}</span>/{totalPages}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-full border px-4 text-[12px] font-semibold transition-all ${currentPage === 1
                    ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700 shadow-sm hover:shadow-md"
                    }`}
                >
                  <ChevronIcon direction="left" className="h-3.5 w-3.5" />
                  Trước
                </button>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {pageButtons.map((page) =>
                    typeof page === "number" ? (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        aria-current={page === currentPage ? "page" : undefined}
                        className={`inline-flex h-10 min-w-[40px] items-center justify-center rounded-full border px-3 text-[12px] font-bold transition-all ${page === currentPage
                          ? "border-blue-900 bg-blue-900 text-white shadow-lg shadow-blue-900/30"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700 shadow-sm"
                          }`}
                      >
                        {page}
                      </button>
                    ) : (
                      <span
                        key={page}
                        className="inline-flex h-10 min-w-[40px] items-center justify-center text-[12px] text-slate-400"
                      >
                        ...
                      </span>
                    )
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-full border px-4 text-[12px] font-semibold transition-all ${currentPage === totalPages
                    ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700 shadow-sm hover:shadow-md"
                    }`}
                >
                  Sau
                  <ChevronIcon direction="right" className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* CỘT PHẢI: TÓM TẮT SALON ĐÃ CHỌN VÀ NÚT TIẾP TỤC */}
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] lg:static lg:block lg:w-[320px] lg:shrink-0 xl:w-[380px] lg:border-none lg:bg-transparent lg:p-0 lg:shadow-none lg:sticky lg:top-[120px] lg:z-40">
          
          {/* GIAO DIỆN MOBILE COMPACT (Chỉ hiện trên mobile/tablet) */}
          <div className="flex lg:hidden items-center justify-between gap-3">
             <div className="flex-1 min-w-0">
               <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Trạng thái</div>
               <div className="text-[13px] sm:text-[15px] font-bold text-slate-900 truncate">
                 {isMounted && selectedSalon ? selectedSalon.name : "Chưa chọn salon"}
               </div>
               {/* Hiển thị số lượng dịch vụ trên mobile mờ nhạt nếu có */}
               {selectedItemCount > 0 && (
                 <div className="text-[10px] text-blue-600 font-medium truncate mt-0.5">
                   Đang giữ {selectedItemCount} dịch vụ/combo
                 </div>
               )}
             </div>
             
             <div className="w-[120px] sm:w-[150px] shrink-0">
               {selectedSalon ? (
                 <Link
                   href={buildStepHref(2)}
                   className="flex h-10 w-full items-center justify-center rounded-full bg-blue-900 text-[12px] font-semibold text-white transition-all shadow-md active:scale-95 sm:h-11 sm:text-[13px]"
                 >
                   Tiếp tục →
                 </Link>
               ) : (
                 <div className="flex h-10 w-full items-center justify-center rounded-full bg-slate-200 text-[12px] font-semibold text-slate-500 sm:h-11 sm:text-[13px]">
                   Chọn salon
                 </div>
               )}
             </div>
          </div>

          {/* GIAO DIỆN DESKTOP FULL (Chỉ hiện trên desktop) */}
          <div className="hidden lg:flex flex-col gap-4">
            {/* TÓM TẮT LỰA CHỌN */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4">
                {/* SALON ĐÃ CHỌN */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">
                        Trạng thái chọn
                      </span>
                      <h2 className="text-base font-bold text-slate-900 sm:text-xl">
                        {isMounted && selectedSalon ? selectedSalon.name : "Chưa chọn salon"}
                      </h2>
                      <p className="text-[11px] text-slate-600 sm:text-sm">
                        {isMounted && selectedSalon ? selectedSalon.address : "Vui lòng chọn salon để tiếp tục."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* DỊCH VỤ/COMBO ĐÃ CHỌN TRƯỚC ĐÓ (NẾU CÓ) */}
                {selectedItemCount > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-3 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-100 transition-colors"
                    >
                      Xóa tất cả
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER ACTION */}
            <div className="flex justify-center pt-2">
              {selectedSalon ? (
                <Link
                  href={buildStepHref(2)}
                  className="flex h-11 w-full items-center justify-center rounded-full bg-blue-900 text-[13px] font-semibold text-white transition-all duration-300 hover:bg-blue-800 active:scale-95 sm:h-14 sm:text-base lg:h-16 shadow-xl shadow-blue-900/20"
                >
                  Tiếp tục bước tiếp theo →
                </Link>
              ) : (
                <div className="flex h-11 w-full items-center justify-center rounded-full bg-slate-200 text-[13px] font-semibold text-slate-500 sm:h-14 sm:text-base lg:h-16 text-center px-4">
                  Vui lòng chọn cơ sở salon để tiếp tục
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

