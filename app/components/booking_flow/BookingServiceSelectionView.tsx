"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/app/components/booking_flow/bookingData";
import type { BookingComboItem } from "@/lib/booking-combo";
import { fetchBookingComboById } from "@/lib/booking-combo";
import { calculateBookingDurations } from "@/lib/booking-duration";
import {
  MAX_BOOKING_SERVICES,
  buildBookingFlowHref,
  normalizeBookingFlowSelection,
  resolveClientBookingFlowSelection,
  selectComboInBookingSelection,
  toggleServiceInBookingSelection,
  type BookingFlowSelection,
  writeStoredBookingFlowSelection,
} from "@/lib/booking-flow-selection";
import { fetchBookingSalonById, type BookingSalon } from "@/lib/booking-salons";
import type { BookingService } from "@/lib/booking-services";
import SalonSelectionModal from "./SalonSelectionModal";

type BookingServiceSelectionViewProps = {
  services: BookingService[];
  combos: BookingComboItem[];
  selectedSalon: BookingSalon | null;
  initialSelection: BookingFlowSelection;
  initialSelectedCombos: BookingComboItem[];
  initialNotice?: string;
};

const PAGE_SIZE = 6;
const COMBO_CATEGORY_KEY = "__combo__";
const FEEDBACK_VISIBLE_MS = 5000;

const patternBgStyle = {
  backgroundImage:
    'url("data:image/svg+xml,%3Csvg%20width%3D%2720%27%20height%3D%2720%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cg%20fill%3D%27%23e2e8f0%27%20fill-opacity%3D%270.55%27%3E%3Cpath%20d%3D%27M0%200h10v10H0zM10%2010h10v10H10z%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E")',
  backgroundSize: "20px 20px",
};

const normalizeKeyword = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

const getInitialPage = (items: BookingService[], serviceIds: number[]) => {
  if (serviceIds.length === 0) return 1;

  const selectedIndex = items.findIndex((service) => service.id === serviceIds[0]);
  if (selectedIndex < 0) return 1;

  return Math.floor(selectedIndex / PAGE_SIZE) + 1;
};

const getInitialNoticeMessage = (notice?: string) => {
  if (notice === "inactive_selection") {
    return "Combo hoặc dịch vụ bạn đang chọn đang ngưng hoạt động. Vui lòng chọn lại.";
  }

  if (notice === "service_added") {
    return "Dịch vụ đã được thêm vào danh sách tạm chọn.";
  }

  if (notice === "service_duplicate") {
    return "Dịch vụ này đã có trong danh sách tạm chọn.";
  }

  if (notice === "service_limit") {
    return `Bạn chỉ có thể chọn tối đa ${MAX_BOOKING_SERVICES} dịch vụ.`;
  }

  if (notice === "combo_selected") {
    return "Combo đã được giữ cho lịch hẹn của bạn.";
  }

  if (notice === "combo_duplicate") {
    return "Combo này đã có trong lịch hẹn hiện tại.";
  }

  if (notice === "combo_replaced") {
    return "Đã thay combo trước đó bằng combo mới.";
  }

  return "";
};

function ChevronIcon({
  direction = "right",
  className = "h-4 w-4",
}: {
  direction?: "left" | "right";
  className?: string;
}) {
  return (
    <svg
      className={`${className} ${direction === "left" ? "rotate-180" : ""}`}
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
  );
}

function SearchIcon({ className = "h-4 w-4 text-slate-400" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
      />
    </svg>
  );
}

export default function BookingServiceSelectionView({
  services,
  combos,
  selectedSalon,
  initialSelection,
  initialSelectedCombos,
  initialNotice,
}: BookingServiceSelectionViewProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [selection, setSelection] = useState(() =>
    resolveClientBookingFlowSelection(initialSelection),
  );
  const [activeSalon, setActiveSalon] = useState<BookingSalon | null>(selectedSalon);
  const [selectedCombos, setSelectedCombos] = useState<BookingComboItem[]>(
    initialSelectedCombos ?? [],
  );
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(() =>
    getInitialPage(services, initialSelection.serviceIds),
  );
  const [serviceFeedback, setServiceFeedback] = useState("");
  const hasHandledFilterReset = useRef(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const selectedItemsScrollRef = useRef<HTMLDivElement>(null);
  const [cartScrollState, setCartScrollState] = useState<"top" | "middle" | "bottom">("top");
  const [isSalonModalOpen, setIsSalonModalOpen] = useState(false);

  const handleCartScroll = () => {
    if (!selectedItemsScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = selectedItemsScrollRef.current;
    if (scrollTop === 0) {
      setCartScrollState("top");
    } else if (scrollTop + clientHeight >= scrollHeight - 5) {
      setCartScrollState("bottom");
    } else {
      setCartScrollState("middle");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => handleCartScroll(), 100);
    return () => clearTimeout(timer);
  }, [selection.serviceIds.length, selection.comboIds.length]);
  const [pendingConflict, setPendingConflict] = useState<null | {
    comboId: number;
    conflictServiceIds: number[];
    type: "service" | "combo";
    action: "select_combo" | "select_service"; // 🔥 thêm dòng này
  }>(null);

  const lastSelectionRef = useRef<string>("");

  useEffect(() => {
    if (pendingConflict) return; // 🔥 chặn khi đang mở popup

    const resolved = resolveClientBookingFlowSelection(initialSelection);
    const nextStr = JSON.stringify(resolved);

    if (lastSelectionRef.current === nextStr) return;

    lastSelectionRef.current = nextStr;

    setSelection(resolved);
    writeStoredBookingFlowSelection(resolved);
    setCurrentPage(getInitialPage(services, resolved.serviceIds));
    setIsMounted(true);
  }, [initialSelection, services]);
  useEffect(() => {
    setActiveSalon(selectedSalon);
  }, [selectedSalon]);

  useEffect(() => {
    const message = getInitialNoticeMessage(initialNotice);
    if (!message) return;
    setServiceFeedback(message);
  }, [initialNotice]);

  useEffect(() => {
    if (!selection.salonId) {
      setActiveSalon(null);
      return;
    }

    if (activeSalon?.id === selection.salonId) {
      return;
    }

    let isMounted = true;
    void fetchBookingSalonById(selection.salonId).then((salon) => {
      if (isMounted) {
        setActiveSalon(salon);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeSalon?.id, selection.salonId]);

  useEffect(() => {
    if (!selection.comboIds.length) {
      setSelectedCombos([]);
      return;
    }

    let isMounted = true;

    Promise.all(
      selection.comboIds.map((id) => fetchBookingComboById(id))
    ).then((results) => {
      if (isMounted) {
        setSelectedCombos(
          results.filter((c): c is BookingComboItem => Boolean(c))
        );
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selection.comboIds]);

  useEffect(() => {
    if (!serviceFeedback) return undefined;

    const timeout = window.setTimeout(() => setServiceFeedback(""), FEEDBACK_VISIBLE_MS);
    return () => window.clearTimeout(timeout);
  }, [serviceFeedback]);

  const categoryLabels: string[] = [];
  for (const service of services) {
    if (!service.categoryName || categoryLabels.includes(service.categoryName)) {
      continue;
    }
    categoryLabels.push(service.categoryName);
  }
  const hasHaircutCategory = categoryLabels.some((label) =>
    normalizeKeyword(label).includes("cat toc"),
  );
  const isComboCategory = selectedCategory === COMBO_CATEGORY_KEY;

  const normalizedKeyword = normalizeKeyword(searchKeyword);
  const categoryFilteredServices =
    selectedCategory === "all" || isComboCategory
      ? services
      : services.filter((service) => service.categoryName === selectedCategory);

  const filteredServices = normalizedKeyword
    ? categoryFilteredServices.filter((service) =>
      normalizeKeyword(
        `${service.title} ${service.subtitle} ${service.desc} ${service.categoryName}`,
      ).includes(normalizedKeyword),
    )
    : categoryFilteredServices;

  const sortedServices = filteredServices;

  const filteredCombos = normalizedKeyword
    ? combos.filter((combo) =>
      normalizeKeyword(
        `${combo.Name} ${combo.Description || ""} ${combo.service_names.join(" ")} ${combo.category_names.join(" ")}`,
      ).includes(normalizedKeyword),
    )
    : combos;

  const sortedCombos = filteredCombos;

  const visibleSource = isComboCategory ? sortedCombos : sortedServices;
  const totalPages = Math.max(1, Math.ceil(visibleSource.length / PAGE_SIZE));
  const pageStartIndex = (currentPage - 1) * PAGE_SIZE;
  const pageEndIndex = pageStartIndex + PAGE_SIZE;
  const visibleServices = sortedServices.slice(pageStartIndex, pageEndIndex);
  const visibleCombos = sortedCombos.slice(pageStartIndex, pageEndIndex);
  const visibleStart = visibleSource.length ? pageStartIndex + 1 : 0;
  const visibleEnd = Math.min(pageEndIndex, visibleSource.length);
  const selectedServices = selection.serviceIds
    .map((serviceId) => services.find((service) => service.id === serviceId) || null)
    .filter((service): service is BookingService => Boolean(service));
  const { totalCustomerDuration, totalStylistDuration } =
  calculateBookingDurations(
    services,
    selectedServices,
    selectedCombos
  );
  const hasActiveFilters =
    selectedCategory !== "all" ||
    Boolean(normalizedKeyword);

  useEffect(() => {
    if (!hasHandledFilterReset.current) {
      hasHandledFilterReset.current = true;
      return;
    }

    setCurrentPage(1);
  }, [normalizedKeyword, selectedCategory]);

  useEffect(() => {
    setCurrentPage((prev) => {
      if (prev < 1) return 1;
      if (prev > totalPages) return totalPages;
      return prev;
    });
  }, [totalPages]);

  const buildStepHref = (
    step: number,
    overrides: Partial<BookingFlowSelection> = {},
  ) =>
    buildBookingFlowHref(
      step,
      normalizeBookingFlowSelection({
        ...selection,
        ...overrides,
      }),
    );

  const updateSelection = (nextSelection: BookingFlowSelection) => {
    setSelection(nextSelection);
    writeStoredBookingFlowSelection(nextSelection);
    lastSelectionRef.current = JSON.stringify(nextSelection);
    return nextSelection;
  };

  const handleToggleService = (serviceId: number) => {
    // 🚨 CHECK conflict với combo
    const conflictCombo = selectedCombos.find(combo =>
      combo.service_ids.includes(serviceId)
    );

    if (conflictCombo) {
      setPendingConflict({
        comboId: conflictCombo.Id_combo,
        conflictServiceIds: [serviceId],
        type: "service",
        action: "select_service", // 🔥 thêm
      });
      return;
    }

    const result = toggleServiceInBookingSelection(selection, serviceId, services,combos);
    // 🔥 nếu conflict với combo
if (result.status === "conflict") {
  setPendingConflict({
    comboId: result.conflictComboId!,
    conflictServiceIds: [serviceId],
    type: "service",
    action: "select_service",
  });
  return;
}
    updateSelection(result.selection);

    if (result.status === "replaced") {
      setServiceFeedback("Chỉ được chọn 1 dịch vụ trong nhóm này. Đã thay bằng lựa chọn mới.");
      return;
    }

    setServiceFeedback(
      result.status === "removed"
        ? "Đã bỏ dịch vụ khỏi danh sách tạm chọn."
        : "Đã thêm dịch vụ vào danh sách tạm chọn.",
    );
  };
  const handleRemoveCombo = (comboId: number) => {
    const nextSelection = {
      ...selection,
      comboIds: selection.comboIds.filter((id) => id !== comboId),
    };

    const normalized = normalizeBookingFlowSelection(nextSelection);

    updateSelection(normalized);
    // 🔥 QUAN TRỌNG NHẤT
    window.history.replaceState(
      null,
      "",
      buildBookingFlowHref(2, normalized)
    );

    setSelectedCombos((prev) =>
      prev.filter((c) => c.Id_combo !== comboId),
    );
  };


const handleSelectCombo = async (combo: BookingComboItem) => {
  const fullCombo = await fetchBookingComboById(combo.Id_combo);
  const serviceIds = fullCombo?.service_ids || [];

  const SINGLE_SELECT_CATEGORY_IDS = [1, 2, 3];

  // =========================
  // 🔥 1. CHECK combo ↔ service (reuse logic category)
  // =========================
  for (const serviceId of serviceIds) {
    const newService = services.find(s => s.id === serviceId);
    if (!newService) continue;

    if (SINGLE_SELECT_CATEGORY_IDS.includes(newService.categoryId)) {
      const conflictService = selection.serviceIds.find(id => {
        const s = services.find(sv => sv.id === id);
        return s?.categoryId === newService.categoryId;
      });

      if (conflictService) {
        setPendingConflict({
          comboId: combo.Id_combo,
          conflictServiceIds: [conflictService],
          type: "service",
          action: "select_combo",
        });
        return;
      }
    }
  }

  // =========================
  // 🔥 2. CHECK combo ↔ combo
  // =========================
  for (const existingComboId of selection.comboIds) {
    const existingCombo = combos.find(c => c.Id_combo === existingComboId);
    if (!existingCombo) continue;

    const conflictIds: number[] = [];

    for (const newServiceId of serviceIds) {
      const newService = services.find(s => s.id === newServiceId);
      if (!newService) continue;

      if (!SINGLE_SELECT_CATEGORY_IDS.includes(newService.categoryId)) continue;

      const matched = existingCombo.service_ids.find(existingServiceId => {
        const existingService = services.find(s => s.id === existingServiceId);
        return existingService?.categoryId === newService.categoryId;
      });

      if (matched) {
        conflictIds.push(matched);
      }
    }

    if (conflictIds.length > 0) {
      setPendingConflict({
        comboId: combo.Id_combo,
        conflictServiceIds: conflictIds, // ✅ chỉ chứa service bị trùng
        type: "combo",
        action: "select_combo",
      });
      return;
    }
  }

  // =========================
  // 🔥 3. Logic gốc
  // =========================
  const result = selectComboInBookingSelection(
    selection,
    combo.Id_combo,
    combos
  );

  if (result.status === "conflict") {
    const conflictIds = result.conflictServiceIds || [];

    const isServiceConflict = conflictIds.some(id =>
      selection.serviceIds.includes(id)
    );

    setPendingConflict({
      comboId: combo.Id_combo,
      conflictServiceIds: conflictIds,
      type: isServiceConflict ? "service" : "combo",
      action: "select_combo",
    });

    return;
  }

  if (result.status === "duplicate") {
    setServiceFeedback("Combo này đã có trong lịch hẹn hiện tại.");
    return;
  }

  if (result.status === "removed") {
    updateSelection(result.selection);
    setSelectedCombos(prev =>
      prev.filter(c => c.Id_combo !== combo.Id_combo)
    );
    return;
  }

  // ✅ success
  updateSelection(result.selection);

  setSelectedCombos(prev => {
    if (prev.find(c => c.Id_combo === combo.Id_combo)) return prev;
    return [...prev, combo];
  });

  setServiceFeedback("Đã thêm combo vào lịch hẹn.");
};

  const canContinue =
    Boolean(selection.salonId) &&
    (selection.serviceIds.length > 0 || selection.comboIds.length > 0);

  const totalSelectedPrice =
    selectedServices.reduce((sum, service) => sum + service.priceValue, 0) +
    selectedCombos.reduce((sum, c) => sum + Number(c.Price || 0), 0)
  const pageButtons: Array<number | "left-dots" | "right-dots"> = [];

  // 👉 THÊM ĐOẠN NÀY NGAY SAU CÁC CONST KHÁC
  const conflictCombo = pendingConflict
    ? combos.find(c => c.Id_combo === pendingConflict.comboId)
    : null;

  if (totalPages <= 5) {
    for (let page = 1; page <= totalPages; page += 1) {
      pageButtons.push(page);
    }
  } else {
    pageButtons.push(1);

    if (currentPage > 3) {
      pageButtons.push("left-dots");
    }

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let page = startPage; page <= endPage; page += 1) {
      pageButtons.push(page);
    }

    if (currentPage < totalPages - 2) {
      pageButtons.push("right-dots");
    }

    pageButtons.push(totalPages);
  }

  const clearAllFilters = () => {
    setSelectedCategory("all");
    setSearchKeyword("");
    setCurrentPage(1);
  };

  return (
    <>
      <section className="rounded-3xl border border-gray-100 bg-white p-3 shadow-sm sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 sm:gap-6">
          <div className="flex-1">
            <h1 className="mt-1 text-xl font-black text-slate-900 sm:text-3xl lg:text-4xl">
              Chọn dịch vụ
            </h1>
            <p className="mt-2 hidden max-w-2xl text-[12px] text-slate-600 sm:block sm:text-base">
              Dịch vụ và combo bạn chọn từ trang chủ sẽ được giữ lại ở đây để bạn
              tiếp tục hoàn thiện lịch hẹn.
            </p>

            <div className="mt-4 flex w-full items-center gap-2 overflow-x-auto pb-1 sm:overflow-visible lg:justify-between">
              <Link
                href={buildStepHref(1)}
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700 sm:min-w-[140px] sm:text-sm lg:min-w-[210px] lg:px-6 lg:py-3 lg:text-base"
              >
                1. Chọn salon
              </Link>
              <span className="h-px w-4 shrink-0 bg-slate-200 sm:w-10 lg:mx-2 lg:w-auto lg:flex-1" />
              <div className="inline-flex shrink-0 items-center justify-center rounded-full border border-blue-300 bg-blue-50 px-4 py-2 text-[11px] font-semibold text-blue-700 sm:min-w-[140px] sm:text-sm lg:min-w-[210px] lg:px-6 lg:py-3 lg:text-base">
                2. Dịch vụ
              </div>
              <span className="h-px w-4 shrink-0 bg-slate-200 sm:w-10 lg:mx-2 lg:w-auto lg:flex-1" />
              <Link
                href={buildStepHref(3)}
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700 sm:min-w-[140px] sm:text-sm lg:min-w-[210px] lg:px-6 lg:py-3 lg:text-base"
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
        
        {/* CỘT TRÁI: DỊCH VỤ VÀ COMBO */}
        <section className="flex-1 w-full space-y-4">
          {/* SALON ĐÃ CHỌN BLOCK (MOBILE ONLY) */}
          <div className="lg:hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 mb-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-700">
                      Salon đã chọn
                    </span>
                    <h2 className="text-base font-bold text-slate-900 sm:text-xl">
                      {activeSalon?.name ?? "Chưa chọn salon"}
                    </h2>
                    <p className="text-[11px] text-slate-600 sm:text-sm">
                      {activeSalon?.address ?? "Bạn có thể chọn salon trước hoặc sau."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSalonModalOpen(true)}
                  className="inline-flex w-full items-center justify-center rounded-full border border-blue-600 bg-white px-4 py-2 text-[11px] font-semibold text-blue-600 hover:border-blue-700 hover:text-blue-700 hover:bg-blue-50 sm:w-auto transition-colors"
                >
                  <i className="fa-solid fa-rotate mr-1.5"></i> Đổi chi nhánh
                </button>
              </div>
            </div>
          </div>

          {serviceFeedback ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
              {serviceFeedback}
            </div>
          ) : null}

          {/* BỘ LỌC */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={selectedCategory === COMBO_CATEGORY_KEY ? "all" : selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`h-9 rounded-full border bg-white pl-4 pr-8 text-[12px] font-semibold text-slate-700 focus:border-blue-500 focus:outline-none shadow-sm transition-colors ${
                  selectedCategory === COMBO_CATEGORY_KEY ? "border-slate-200 opacity-60" : "border-slate-200"
                }`}
              >
                <option value="all">Tất cả danh mục</option>
                {categoryLabels.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                if (selectedCategory === COMBO_CATEGORY_KEY) {
                  setSelectedCategory("all");
                } else {
                  setSelectedCategory(COMBO_CATEGORY_KEY);
                }
              }}
              className={`group relative inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-5 text-[12px] font-bold transition-all duration-300 ${
                selectedCategory === COMBO_CATEGORY_KEY
                  ? "bg-slate-100 text-slate-700 border border-slate-200 shadow-inner"
                  : "bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-white shadow-md shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 border border-transparent"
              }`}
            >
              {selectedCategory !== COMBO_CATEGORY_KEY && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              )}
              {selectedCategory === COMBO_CATEGORY_KEY ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Quay lại Dịch vụ
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5 text-yellow-100" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  Combo Tiết Kiệm
                </>
              )}
            </button>

            <div 
              className={`flex items-center gap-2 rounded-full border border-slate-200 bg-white shadow-sm transition-all duration-300 ${isSearchExpanded || searchKeyword ? "px-3 py-1.5 w-[140px] sm:w-[180px]" : "w-10 h-9 justify-center cursor-pointer"}`}
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
                  placeholder={isComboCategory ? "Tìm combo..." : "Tìm dịch vụ..."}
                  type="text"
                />
              )}
            </div>
          </div>

          <div className="mb-3 flex flex-col gap-3 sm:mb-5">
            {visibleSource.length > 0 ? (
              <div className="text-[11px] font-medium text-slate-500 sm:text-sm">
                Hiển thị {visibleStart}-{visibleEnd} / {visibleSource.length} {isComboCategory ? "combo" : "dịch vụ"}
              </div>
            ) : null}
          </div>

          {visibleSource.length ? (
            <>
              {isComboCategory ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                  {visibleCombos.map((combo) => {
                    const isSelected = selection.comboIds.includes(combo.Id_combo);
                    const featureLines = combo.feature_lines.length > 0 ? combo.feature_lines.slice(0, 3) : combo.service_names.slice(0, 3);
                    return (
                      <div
                        key={combo.Id_combo}
                        className={`flex flex-col h-full overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isSelected ? "border-amber-300 ring-1 ring-amber-200" : "border-gray-100"}`}
                      >
                        <div
                          className="relative shrink-0 h-32 bg-gray-200 bg-center bg-cover sm:h-44"
                          style={combo.Image_URL ? { backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.08) 0%, rgba(15, 23, 42, 0.22) 100%), url(${combo.Image_URL})`, backgroundSize: "cover", backgroundPosition: "center" } : patternBgStyle}
                        >
                          <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-700">Combo</span>
                            <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold text-slate-600">{combo.Duration_time ? `${combo.Duration_time} phút` : "Đang cập nhật"}</span>
                          </div>
                        </div>
                        <div className="flex flex-col flex-1 p-3 sm:p-4">
                          <div className="flex-1 space-y-2">
                            <div>
                              <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-gray-800 sm:text-[15px]">{combo.Name}</h3>
                              <p className="mt-1 line-clamp-2 text-[11px] text-gray-500 sm:text-[12px]">{combo.Description || "Combo dịch vụ trọn gói."}</p>
                            </div>
                            {featureLines.length > 0 ? (
                              <div className="space-y-1">
                                {featureLines.map((line, index) => (
                                  <p key={`${combo.Id_combo}-line-${index}`} className="line-clamp-1 text-[11px] font-medium text-slate-600 sm:text-[12px]">• {line}</p>
                                ))}
                              </div>
                            ) : null}
                          </div>
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[14px] font-bold text-gray-900 sm:text-base">{formatCurrency(combo.Price)}</p>
                              <span className="text-[10px] font-semibold text-slate-400">{combo.service_count > 0 ? `${combo.service_count} DV` : "Combo"}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectCombo(combo)}
                              className={`flex w-full items-center justify-center rounded-xl py-2 text-[11px] font-semibold transition-colors sm:text-[13px] ${isSelected ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "bg-blue-900 text-white hover:bg-blue-800 shadow-sm"}`}
                            >
                              {isSelected ? "Đã chọn combo" : selection.comboIds.length > 0 ? "Thêm combo này" : "Chọn combo"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                  {visibleServices.map((item) => {
                    const isSelected = selection.serviceIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`flex flex-col h-full overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isSelected ? "border-blue-300 ring-1 ring-blue-200" : "border-gray-100"}`}
                      >
                        <div
                          className="relative shrink-0 h-24 bg-gray-200 bg-center bg-cover sm:h-40"
                          style={item.image ? { backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.08) 0%, rgba(15, 23, 42, 0.22) 100%), url(${item.image})`, backgroundSize: "cover", backgroundPosition: "center" } : patternBgStyle}
                        >
                          <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${item.badgeTone}`}>{item.badge}</span>
                            <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold text-slate-600">{item.duration}</span>
                          </div>
                        </div>
                        <div className="flex flex-col flex-1 p-3 sm:p-4">
                          <div className="flex-1 space-y-1.5">
                            <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-gray-800 sm:text-[14px]">{item.title}</h3>
                            <p className="line-clamp-1 text-[10px] text-slate-500 sm:text-[11px]">{item.subtitle}</p>
                            <p className="line-clamp-2 text-[10px] text-gray-500 sm:text-[12px]">{item.desc}</p>
                          </div>
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[14px] font-bold text-gray-900 sm:text-base">{formatCurrency(item.priceValue)}</p>
                              <span className="text-[10px] font-semibold text-slate-400">Đã gồm VAT</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleService(item.id)}
                              className={`flex w-full items-center justify-center rounded-xl py-2 text-[11px] font-semibold transition-colors sm:text-[13px] ${isSelected ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-blue-900 text-white hover:bg-blue-800 shadow-sm"}`}
                            >
                              {isSelected ? "Bỏ dịch vụ" : "Chọn dịch vụ"}
                              <svg className="ml-1.5 h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-[12px] font-medium text-slate-500 sm:text-sm">Trang <span className="text-slate-900">{currentPage}</span>/{totalPages}</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => { setCurrentPage((prev) => Math.max(1, prev - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={currentPage === 1} className={`inline-flex h-10 items-center justify-center gap-2 rounded-full border px-4 text-[12px] font-semibold transition-all ${currentPage === 1 ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700 shadow-sm hover:shadow-md"}`}><ChevronIcon direction="left" className="h-3.5 w-3.5" /> Trước</button>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {pageButtons.map((page) => typeof page === "number" ? (<button key={page} type="button" onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-current={page === currentPage ? "page" : undefined} className={`inline-flex h-10 min-w-[40px] items-center justify-center rounded-full border px-3 text-[12px] font-bold transition-all ${page === currentPage ? "border-blue-900 bg-blue-900 text-white shadow-lg shadow-blue-900/30" : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700 shadow-sm"}`}>{page}</button>) : (<span key={page} className="inline-flex h-10 min-w-[40px] items-center justify-center text-[12px] text-slate-400">...</span>))}
                    </div>
                    <button type="button" onClick={() => { setCurrentPage((prev) => Math.min(totalPages, prev + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={currentPage === totalPages} className={`inline-flex h-10 items-center justify-center gap-2 rounded-full border px-4 text-[12px] font-semibold transition-all ${currentPage === totalPages ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700 shadow-sm hover:shadow-md"}`}>Sau <ChevronIcon direction="right" className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-16 text-center shadow-sm sm:px-8">
              <p className="text-base font-semibold text-slate-700 sm:text-lg">Chưa tìm thấy dịch vụ phù hợp</p>
              <p className="mt-2 text-sm text-slate-500">Thử đổi danh mục, đổi từ khóa ngắn hơn hoặc đặt lại bộ lọc.</p>
              <button type="button" onClick={clearAllFilters} className="mt-5 inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-700">Đặt lại tất cả</button>
            </div>
          )}
        </section>

        {/* CỘT PHẢI: GIỎ HÀNG (MỤC ĐÃ CHỌN) */}
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] lg:static lg:block lg:w-[360px] lg:shrink-0 xl:w-[420px] lg:border-none lg:bg-transparent lg:p-0 lg:shadow-none lg:sticky lg:top-[120px] lg:z-40">
          
          {/* GIAO DIỆN MOBILE COMPACT */}
          <div className="flex lg:hidden items-center justify-between gap-3">
             <div className="flex-1 min-w-0">
               <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Mục đã chọn</div>
               <div className="flex flex-wrap items-center gap-1.5 mt-1">
                 <span className="text-[12px] sm:text-[14px] font-bold text-slate-900">
                   {selectedServices.length + selectedCombos.length} mục
                 </span>
                 <span className="text-slate-300 text-[10px]">|</span>
                 <span className="text-[12px] sm:text-[14px] font-bold text-blue-700 truncate">
                   {formatCurrency(totalSelectedPrice)}
                 </span>
               </div>
             </div>
             
             <div className="w-[120px] sm:w-[150px] shrink-0">
               {canContinue ? (
                 <Link
                   href={buildStepHref(3)}
                   className="flex h-10 w-full items-center justify-center rounded-full bg-blue-900 text-[12px] font-semibold text-white transition-all shadow-md active:scale-95 sm:h-11 sm:text-[13px]"
                 >
                   Tiếp tục →
                 </Link>
               ) : (
                 <div className="flex h-10 w-full items-center justify-center rounded-full bg-slate-200 text-[12px] font-semibold text-slate-500 sm:h-11 sm:text-[13px] text-center px-2 line-clamp-1 leading-tight">
                   Chọn dịch vụ
                 </div>
               )}
             </div>
          </div>

          {/* GIAO DIỆN DESKTOP FULL */}
          <div className="hidden lg:flex flex-col gap-4">
            {/* SALON ĐÃ CHỌN BLOCK (DESKTOP) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                    Salon đã chọn
                  </span>
                </div>
                <button
                  onClick={() => setIsSalonModalOpen(true)}
                  className="rounded-full border border-blue-600 bg-white px-3 py-1.5 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 hover:border-blue-700 hover:text-blue-700 transition-colors shrink-0"
                >
                  <i className="fa-solid fa-rotate mr-1"></i> Đổi chi nhánh
                </button>
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900 line-clamp-1">
                  {activeSalon?.name ?? "Chưa chọn salon"}
                </h2>
                <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-1">
                  {activeSalon?.address ?? "Bạn có thể chọn salon trước hoặc sau."}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 sm:text-xl">Mục đã chọn</h2>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">
                    {selectedServices.length + selectedCombos.length} đang giữ
                  </span>
                </div>

                {/* THỜI GIAN VÀ GIÁ */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                  {totalCustomerDuration > 0 && <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700">Thời lượng: {totalCustomerDuration} phút</span>}
                  {/* {totalStylistDuration > 0 && <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700">Nội bộ: {totalStylistDuration} phút</span>} */}
                </div>

                <div className="relative group">
                  <div ref={selectedItemsScrollRef} onScroll={handleCartScroll} className="max-h-[250px] overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-6">
                  {/* COMBO ĐÃ CHỌN */}
                  {selectedCombos.map((combo) => (
                    <div key={combo.Id_combo} className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-700 mb-0.5">Combo</p>
                            <h3 className="text-sm font-bold text-slate-900 leading-snug">{combo.Name}</h3>
                          </div>
                          <button type="button" onClick={() => handleRemoveCombo(combo.Id_combo)} className="shrink-0 p-1.5 rounded-full hover:bg-amber-100 text-amber-700 transition">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                        <span className="text-sm font-bold text-amber-700">{formatCurrency(Number(combo.Price || 0))}</span>
                      </div>
                    </div>
                  ))}

                  {/* DỊCH VỤ ĐÃ CHỌN */}
                  {selectedServices.map((service) => (
                    <div key={service.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-0.5">Dịch vụ</p>
                          <h3 className="text-[13px] font-bold text-slate-900 leading-snug">{service.title}</h3>
                          <p className="text-[10px] text-slate-500">{service.duration}</p>
                        </div>
                        <button type="button" onClick={() => handleToggleService(service.id)} className="shrink-0 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-red-500 transition">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <p className="mt-2 text-[13px] font-bold text-slate-900">{formatCurrency(service.priceValue)}</p>
                    </div>
                  ))}
                  
                  {(selectedServices.length === 0 && selectedCombos.length === 0) && (
                    <div className="py-8 text-center text-slate-400 text-sm italic">
                      Chưa có dịch vụ nào được chọn
                    </div>
                  )}
                  </div>

                  {/* FADE SCROLL HINT OVERLAY */}
                  {(selectedServices.length + selectedCombos.length > 2) && (
                    <div className={`absolute bottom-0 left-0 right-2 pointer-events-none flex items-end justify-center pb-2 transition-all duration-300 ${cartScrollState === 'bottom' ? 'h-12' : 'h-16 bg-gradient-to-t from-white via-white/95 to-transparent'}`}>
                      <div className={`pointer-events-auto ${cartScrollState === 'bottom' ? '' : 'animate-bounce hover:animate-none'}`}>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedItemsScrollRef.current) {
                              if (cartScrollState === 'bottom') {
                                selectedItemsScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                              } else {
                                selectedItemsScrollRef.current.scrollBy({ top: 120, behavior: 'smooth' });
                              }
                            }
                          }}
                          className="relative overflow-hidden flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-slate-100 text-blue-500 hover:text-blue-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300/50 active:scale-95 transition-all before:absolute before:inset-0 before:bg-blue-300/40 before:rounded-full before:scale-0 active:before:scale-[2.5] before:transition-all before:duration-500 before:ease-out before:opacity-0 active:before:opacity-100"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 relative z-10">{cartScrollState === 'bottom' ? 'Lên đầu' : 'Xem thêm'}</span>
                          <svg className={`w-3.5 h-3.5 relative z-10 transition-transform duration-300 ${cartScrollState === 'bottom' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <span className="text-sm font-semibold text-slate-600">Tổng cộng:</span>
                  <span className="text-xl font-black text-blue-700">{formatCurrency(totalSelectedPrice)}</span>
                </div>
              </div>
            </div>

            {/* BUTTON TIẾP TỤC BẢN DESKTOP */}
            {canContinue ? (
              <Link href={buildStepHref(3)} className="flex h-14 w-full items-center justify-center rounded-full bg-blue-900 text-[15px] font-semibold text-white transition-all shadow-xl shadow-blue-900/20 hover:bg-blue-800 active:scale-95">
                Tiếp tục chọn thợ →
              </Link>
            ) : (
              <div className="flex h-14 w-full items-center justify-center rounded-full bg-slate-200 text-[14px] font-semibold text-slate-500 text-center px-4">
                Chọn ít nhất 1 mục để tiếp tục
              </div>
            )}
          </div>
        </div>
      </div>
      {pendingConflict && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-xl w-[320px] shadow-lg">
            <h2 className="text-lg font-semibold mb-2">
              Xác nhận chọn combo
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              {pendingConflict.action === "select_service"
                ? "Dịch vụ này đã nằm trong combo bạn chọn. Bạn có muốn bỏ combo để chọn dịch vụ lẻ không?"
                : pendingConflict.type === "service"
                  ? "Combo này chứa dịch vụ lẻ bạn đã chọn. Bạn có muốn xoá dịch vụ lẻ để tiếp tục không?"
                  : "Combo này chứa dịch vụ trùng với một combo khác. Bạn có muốn thay thế combo cũ không?"}
            </p>
            <ul className="text-xs text-red-500 mb-2">
              {pendingConflict.action === "select_service" ? (
                <li>• {conflictCombo?.Name || `Combo ID ${pendingConflict.comboId}`}</li>
              ) : (
                pendingConflict.conflictServiceIds.map(id => {
                  const service = services.find(s => s.id === id);
                  return (
                    <li key={id}>
                      • {service?.title || `ID ${id}`}
                    </li>
                  );
                })
              )}
            </ul>
            <div className="flex justify-end gap-2">
              {/* ❌ Huỷ */}
              <button
                onClick={() => setPendingConflict(null)}
                className="px-3 py-1 border rounded"
              >
                Huỷ
              </button>

              {/* ✅ Đồng ý */}
              <button
                onClick={() => {
                  if (!pendingConflict) return;

                  const combo = combos.find(c => c.Id_combo === pendingConflict.comboId);
                  if (!combo) return;

                  setSelection(prev => {
                    let newServiceIds = [...prev.serviceIds];
                    let newComboIds = [...prev.comboIds];

                    // =========================
                    // CASE 1: chọn combo → conflict với service
                    // =========================
                    if (
                      pendingConflict.action === "select_combo" &&
                      pendingConflict.type === "service"
                    ) {
                      newServiceIds = newServiceIds.filter(
                        id => !pendingConflict.conflictServiceIds.includes(id)
                      );
                    }

                    // =========================
                    // CASE 2: chọn combo → conflict với combo
                    // =========================
                    if (
                      pendingConflict.action === "select_combo" &&
                      pendingConflict.type === "combo"
                    ) {
                      newComboIds = newComboIds.filter(existingComboId => {
                        const existingCombo = combos.find(c => c.Id_combo === existingComboId);
                        if (!existingCombo) return true;

                        return !existingCombo.service_ids.some(id =>
                          pendingConflict.conflictServiceIds.includes(id)
                        );
                      });
                    }

                    // =========================
                    // CASE 3: chọn service → conflict với combo
                    // =========================
                    if (pendingConflict.action === "select_service") {
                      newComboIds = newComboIds.filter(
                        id => id !== pendingConflict.comboId
                      );

                      const serviceId = pendingConflict.conflictServiceIds[0];
                      if (!newServiceIds.includes(serviceId)) {
                        newServiceIds.push(serviceId);
                      }
                    }

                    // 👉 thêm combo nếu đang chọn combo
                    if (pendingConflict.action === "select_combo") {
                      if (!newComboIds.includes(combo.Id_combo)) {
                        newComboIds.push(combo.Id_combo);
                      }
                    }

                    const newSelection: BookingFlowSelection = {
                      ...prev,
                      serviceIds: newServiceIds,
                      comboIds: newComboIds,
                    };

                    writeStoredBookingFlowSelection(newSelection);
                    return newSelection;
                  });

                  // 👉 sync UI combo
                  if (pendingConflict.action === "select_combo") {
                    setSelectedCombos(prev => {
                      if (prev.find(c => c.Id_combo === combo.Id_combo)) return prev;
                      return [...prev, combo];
                    });
                  }

                  if (pendingConflict.action === "select_service") {
                    setSelectedCombos(prev =>
                      prev.filter(c => c.Id_combo !== pendingConflict.comboId)
                    );
                  }

                  setPendingConflict(null);
                }}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      <SalonSelectionModal
        isOpen={isSalonModalOpen}
        onClose={() => setIsSalonModalOpen(false)}
        currentSalonId={activeSalon?.id}
        onSelect={(newSalonId) => {
          const nextSelection = {
            ...selection,
            salonId: newSalonId,
          };
          const normalized = normalizeBookingFlowSelection(nextSelection);
          updateSelection(normalized);
          window.history.replaceState(null, "", buildBookingFlowHref(2, normalized));
          setIsSalonModalOpen(false);
        }}
      />
    </>
  );
}
