"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  buildBookingFlowHref,
  normalizeBookingFlowSelection,
  writeStoredBookingFlowSelection,
} from "@/lib/booking-flow-selection";
import StylistTimePanel from "./StylistTimePanel";
import { formatCurrency } from "./bookingData";
import SalonSelectionModal from "./SalonSelectionModal";

type Stylist = {
  id: number;
  name: string;
  image: string;
  times: string[];
};

type Props = {
  stylists: Stylist[];
  initialDate?: string;
  phone?: string;
  salonId?: number;
  serviceIds?: number[];
  comboIds?: number[];
  safeSelection?: any;
  salon?: any;
  services?: any[];
  combos?: any[];
  totalPrice?: number;
  duration?: number;
};

type Selection = {
  stylist: Stylist;
  date: string;
  time: string;
};

export default function TimeSelectionStep({
  stylists,
  initialDate,
  phone,
  salonId,
  serviceIds = [],
  comboIds = [],
  safeSelection,
  salon,
  services = [],
  combos = [],
  totalPrice = 0,
  duration = 30,
}: Props) {
  const router = useRouter();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    initialDate ?? new Date().toISOString().slice(0, 10)
  );
  const [isSalonModalOpen, setIsSalonModalOpen] = useState(false);

  const requiresStylist = useMemo(() => {
    const hasServiceReq = (services || []).some(s =>
      /cắt|uốn|nhuộm|cat|uon|nhuom/i.test(`${s?.categoryName || ""} ${s?.title || ""}`)
    );
    const hasComboReq = (combos || []).some(c => {
      const comboNameMatch = /cắt|uốn|nhuộm|cat|uon|nhuom/i.test(c?.Name || c?.name || "");
      const catMatch = Array.isArray(c?.category_names) && c.category_names.some((name: string) => /cắt|uốn|nhuộm|cat|uon|nhuom/i.test(name || ""));
      return comboNameMatch || catMatch;
    });
    return hasServiceReq || hasComboReq;
  }, [services, combos]);

  useEffect(() => {
    if (!stylists.length) return;
    if (selection) return;
    const first = stylists[0];
    setSelection({
      stylist: first,
      date: initialDate ?? new Date().toISOString().slice(0, 10),
      time: first.times[0] ?? "08:00",
    });
  }, [initialDate, selection, stylists]);

  const handleDateChange = useCallback((newDate: string) => {
    setSelectedDate(newDate);

    const currentSelection = normalizeBookingFlowSelection({
      phone,
      salonId,
      serviceIds,
      comboIds: comboIds.length ? comboIds : undefined,
    });

    router.replace(
      buildBookingFlowHref(3, currentSelection, {
        date: newDate,
        stylistId: selection?.stylist?.id,
      }),
      { scroll: false }
    );
  }, [router, phone, salonId, serviceIds, comboIds, selection]);

  const handleSelectionChange = useCallback((next: Selection) => {
    setSelection((prev) => {
      if (
        prev &&
        prev.stylist.id === next.stylist.id &&
        prev.date === next.date &&
        prev.time === next.time
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const handleContinue = async () => {
    if (!selection) return;

    // Check if selected time is in the past
    const now = new Date();
    const [year, month, day] = selection.date.split('-').map(Number);
    const [hours, minutes] = selection.time.split(':').map(Number);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day) && !isNaN(hours) && !isNaN(minutes)) {
      const selectedDateTime = new Date(year, month - 1, day, hours, minutes);
      if (selectedDateTime < now) {
        setPopupMessage("Thời gian bạn chọn đã trôi qua. Hệ thống không thể đặt lịch ở quá khứ. Vui lòng chọn thời gian mới.");
        return;
      }
    }

    if (selection.stylist.id !== -1) {
      try {
        setIsChecking(true);
        const apiBase =
          process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
          "https://api.25zone.io.vn";
        const res = await fetch(
          `${apiBase}/api/lichlamviec?userId=${selection.stylist.id}&date=${selection.date}`,
        );
        const data = await res.json();
        const hours = data.hours || [];

        const startIndex = hours.findIndex(
          (h: any) => h.Hours?.slice(0, 5) === selection.time,
        );

        if (startIndex === -1) {
          setPopupMessage("Không tìm thấy khung giờ bạn chọn trong lịch làm việc của stylist.");
          return;
        }

        const slotCount = Math.ceil(duration / 30);
        const slotsToCheck = hours.slice(startIndex, startIndex + slotCount);

        if (slotsToCheck.length < slotCount) {
          setPopupMessage(
            "Stylist không đủ thời gian làm việc trong ngày hôm nay để phục vụ hết các dịch vụ bạn đã chọn. Vui lòng chọn khung giờ sớm hơn, bớt dịch vụ hoặc chọn stylist khác."
          );
          return;
        }

        const conflictSlot = slotsToCheck.find((h: any) => h.Status !== 1);
        if (conflictSlot) {
          setPopupMessage(
            "Khung giờ tiếp theo không đủ trống do đã có khách đặt trước hoặc sự kiện bận. Quý khách vui lòng dời sang khung giờ khác hoặc giảm bớt dịch vụ."
          );
          return;
        }
      } catch (error) {
        console.error("Validation error:", error);
        setPopupMessage("Lỗi khi kiểm tra dữ liệu khung giờ.");
        return;
      } finally {
        setIsChecking(false);
      }
    }

    const currentSelection = normalizeBookingFlowSelection({
      phone,
      salonId,
      serviceIds,
      comboIds: comboIds.length ? comboIds : undefined,
    });

    writeStoredBookingFlowSelection(currentSelection);
    router.push(
      buildBookingFlowHref(4, currentSelection, {
        stylistId: selection.stylist.id,
        date: selection.date,
        time: selection.time,
      }),
    );
  };

  const canContinue =
    Boolean(selection?.date) &&
    Boolean(selection?.time) &&
    Boolean(selection?.stylist?.id) &&
    Boolean(salonId) &&
    (serviceIds.length > 0 || comboIds.length > 0) &&
    Boolean(phone);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 lg:gap-8 lg:items-start pb-28 lg:pb-0">
      {/* LEFT COLUMN: Stylist & Time Panel */}
      <div className="lg:sticky lg:top-[120px] lg:z-40 lg:max-h-[calc(100vh-190px)] min-h-0">
        <StylistTimePanel
          stylists={stylists}
          initialDate={selectedDate}
          onDateChange={handleDateChange}
          onSelectionChange={handleSelectionChange}
          requiresStylist={requiresStylist}
          onOpenSalonModal={() => setIsSalonModalOpen(true)}
        />
      </div>

      {/* RIGHT COLUMN: Sticky Cart Container */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] lg:static lg:block lg:shadow-sm lg:rounded-3xl lg:border lg:bg-white lg:p-5 lg:sticky lg:top-[120px] lg:z-40 lg:max-h-[calc(100vh-190px)] lg:min-h-0 lg:flex lg:flex-col lg:gap-5 flex flex-col gap-4 transition-all">

        {/* ================= MOBILE COMPACT CART ================= */}
        <div className="flex lg:hidden items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
              Tóm tắt lịch hẹn
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {selection ? (
                <>
                  <span className="text-[12px] sm:text-[14px] font-bold text-slate-900 truncate">
                    {selection.time}
                  </span>
                  <span className="text-slate-300 text-[10px]">|</span>
                </>
              ) : null}
              <span className="text-[12px] sm:text-[14px] font-bold text-blue-700 truncate">
                {formatCurrency(totalPrice)}
              </span>
            </div>
          </div>

          <div className="w-[120px] sm:w-[150px] shrink-0">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue || isChecking}
              className={
                canContinue
                  ? "flex h-10 w-full items-center justify-center rounded-full bg-blue-900 text-[12px] font-semibold text-white transition-all shadow-md active:scale-95 sm:h-11 sm:text-[13px] disabled:opacity-70 disabled:scale-100"
                  : "flex h-10 w-full items-center justify-center rounded-full bg-slate-200 text-[12px] font-semibold text-slate-500 sm:h-11 sm:text-[13px] text-center px-2 line-clamp-1 leading-tight"
              }
            >
              {isChecking ? "Đang xử lý..." : "Tiếp tục →"}
            </button>
          </div>
        </div>

        {/* ================= DESKTOP FULL CART ================= */}
        <div className="hidden lg:flex flex-col h-full min-h-0 w-full overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6 pb-4">
            {/* SALON SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Salon</h3>
                {safeSelection && (
                  <button
                    onClick={() => setIsSalonModalOpen(true)}
                    className="flex items-center justify-center rounded-full border border-blue-600 bg-white px-3 py-1.5 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 hover:border-blue-700 hover:text-blue-700 transition-colors"
                  >
                    <i className="fa-solid fa-rotate mr-1.5"></i> Đổi chi nhánh
                  </button>
                )}
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 sm:p-4 border border-slate-100">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg">
                  📍
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{salon?.name ?? "Chưa chọn salon"}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{salon?.address}</p>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* SERVICES SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Dịch vụ & Combo</h3>
                {safeSelection && (
                  <Link
                    href={buildBookingFlowHref(2, safeSelection)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Thay đổi
                  </Link>
                )}
              </div>
              <div className="space-y-2">
                {services.map((s) => (
                  <div key={s.id} className="flex justify-between items-start gap-2">
                    <span className="text-sm text-slate-600">{s.title}</span>
                    <span className="text-sm font-medium text-slate-900 shrink-0">{formatCurrency(s.priceValue)}</span>
                  </div>
                ))}
                {combos.map((c) => (
                  <div key={c.Id_combo} className="flex justify-between items-start gap-2">
                    <span className="text-sm text-amber-700 font-medium">{c.Name}</span>
                    <span className="text-sm font-medium text-slate-900 shrink-0">{formatCurrency(Number(c.Price || 0))}</span>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* TIME & STYLIST SECTION */}
            <div className="space-y-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-50/50">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Thời gian hẹn</h3>
              {selection ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Ngày giờ:</span>
                    <span className="font-semibold text-blue-700">
                      {selection.time} - {selection.date.split('-').reverse().join('/')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Stylist:</span>
                    <span className="font-semibold text-slate-900 line-clamp-1 max-w-[150px] text-right">
                      {selection.stylist.name}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">Vui lòng chọn thời gian</p>
              )}
            </div>

            <hr className="border-slate-100" />
          </div>

          {/* TOTAL & SUBMIT */}
          <div className="pt-4 mt-auto shrink-0 bg-white border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Tổng cộng</span>
              <span className="text-xl font-black text-blue-700">
                {formatCurrency(totalPrice)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue || isChecking}
              className={
                canContinue
                  ? "w-full h-14 bg-blue-900 text-white rounded-2xl font-semibold text-base hover:bg-blue-800 flex items-center justify-center transition-all duration-300 active:scale-95 shadow-md shadow-blue-900/20 disabled:opacity-70 disabled:scale-100"
                  : "w-full h-14 rounded-2xl font-semibold text-base flex items-center justify-center bg-slate-100 text-slate-400 cursor-not-allowed"
              }
            >
              {isChecking ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang xử lý...</span>
                </div>
              ) : (
                "Tiếp tục →"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* POPUP VIEW */}
      {popupMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="text-center">
              <div className="mx-auto flex flex-col items-center justify-center h-16 w-16 rounded-full bg-red-50 text-red-500 mb-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Không đủ thời gian</h3>
              <p className="text-[13.5px] text-slate-600 mb-6 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {popupMessage}
              </p>
              <button
                onClick={() => setPopupMessage("")}
                className="w-full bg-blue-900 text-white font-semibold py-3 rounded-xl hover:bg-blue-800 transition-colors shadow-md shadow-blue-900/20 active:scale-95"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      <SalonSelectionModal
        isOpen={isSalonModalOpen}
        onClose={() => setIsSalonModalOpen(false)}
        currentSalonId={salonId || null}
        onSelect={(newSalonId) => {
          const currentSelection = normalizeBookingFlowSelection({
            phone,
            salonId: newSalonId,
            serviceIds,
            comboIds: comboIds && comboIds.length ? comboIds : undefined,
          });
          writeStoredBookingFlowSelection(currentSelection);
          router.replace(buildBookingFlowHref(3, currentSelection, { date: selectedDate }));
          setIsSalonModalOpen(false);
        }}
      />
    </div>
  );
}
