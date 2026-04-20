"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import TimeSlotPicker from "./TimeSlotPicker";

type Stylist = {
  id: number;
  name: string;
  image: string;
  times: string[];
};

type Props = {
  stylists: Stylist[];
  initialDate?: string;
  onSelectionChange?: (selection: {
    stylist: Stylist;
    date: string;
    time: string;
  }) => void;
  onDateChange?: (date: string) => void;
  requiresStylist?: boolean;
  onOpenSalonModal?: () => void;
};

export default function StylistTimePanel({
  stylists,
  initialDate,
  onSelectionChange,
  onDateChange,
  requiresStylist = true,
  onOpenSalonModal,
}: Props) {
  // 👉 default stylist
  const defaultStylist: Stylist = useMemo(
    () => ({
      id: -1,
      name: "25Zone chọn giúp bạn",
      image: "25Zone.png",
      times: [],
    }),
    []
  );

  // 👉 merge list (default + real stylists)
  const mergedStylists = useMemo(() => {
    return [defaultStylist, ...(stylists ?? [])];
  }, [stylists, defaultStylist]);

  const total = mergedStylists.length;

  const [index, setIndex] = useState(0);
  const stylist = mergedStylists[index];

  const [selectedDate, setSelectedDate] = useState(
    initialDate ?? new Date().toISOString().slice(0, 10)
  );

  const [selectedTime, setSelectedTime] = useState("");

  const handlePrev = () => {
    if (total === 0) return;
    setIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    if (total === 0) return;
    setIndex((prev) => (prev + 1) % total);
  };

const handleSlotChange = useCallback(
  ({ date, time }: { date: string; time: string }) => {
    setSelectedDate(date);
    setSelectedTime(time);

    onDateChange?.(date); // 👈 QUAN TRỌNG
  },
  [onDateChange]
);
  const [isOpen, setIsOpen] = useState(false);
  const [stylistDetail, setStylistDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isRatingExpanded, setIsRatingExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchStylistDetail = async (id: number) => {
    try {
      setLoadingDetail(true);
      const res = await fetch(`http://localhost:5001/api/thocat/${id}`);
      const data = await res.json();
      setStylistDetail(data);
    } catch (err) {
      console.error("Fetch stylist detail error:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleToggleDetail = () => {
    setIsOpen(true);
    setIsRatingExpanded(false);
    if (!stylistDetail) {
      fetchStylistDetail(stylist.id);
    }
  };

  // reset index khi list đổi
  const stylistIds = stylists.map(s => s.id).join(",");

  useEffect(() => {
    setIndex(0);
    setSelectedTime("");
    setIsOpen(false);
    setStylistDetail(null);
    setIsRatingExpanded(false);
  }, [stylistIds]);

  // reset details khi đổi stylist qua prev/next
  useEffect(() => {
    setIsOpen(false);
    setStylistDetail(null);
    setIsRatingExpanded(false);
  }, [index]);

  // emit selection
  useEffect(() => {
    if (!stylist) return;
    // if (stylist.id === -1) return;
    if (!selectedDate || !selectedTime) return;
    onSelectionChange?.({
      stylist,
      date: selectedDate,
      time: selectedTime,
    });
  }, [stylist, selectedDate, selectedTime, onSelectionChange]);

  // Kiểm tra xem tất cả thợ (trừ mặc định) có rảnh không
  const isAllStylistsBusy = useMemo(() => {
    return !stylists || stylists.length === 0;
  }, [stylists]);

  // Nếu hết giờ, khóa hết
  if (isAllStylistsBusy) {
    return (
      <div className="flex flex-col h-full bg-white border border-slate-100 rounded-3xl p-6 shadow-sm items-center justify-center text-center">
        <div className="mx-auto flex flex-col items-center justify-center h-16 w-16 rounded-full bg-red-50 text-red-500 mb-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <i className="fa-solid fa-calendar-xmark text-2xl"></i>
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Hết ca làm việc</h2>
        <p className="text-[14px] text-slate-600 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed max-w-sm">
          Rất tiếc, chi nhánh đang chọn hiện không có thợ nào hoạt động hoặc đã kín lịch trong ngày này. Vui lòng chọn ngày khác hoặc đổi chi nhánh để tiếp tục.
        </p>
        <button
          onClick={onOpenSalonModal}
          className="w-full max-w-[240px] bg-blue-900 text-white font-semibold py-3 rounded-xl hover:bg-blue-800 transition-colors shadow-md shadow-blue-900/20 active:scale-95"
        >
          Chọn lại chi nhánh
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border border-slate-100 rounded-3xl p-4 sm:p-5 shadow-sm">
      {/* TOP: Stylist Selection */}
      <div className="shrink-0 pb-2 sm:pb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold">
              Stylist
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-none">
                {stylist?.id === -1 ? "25Zone Gợi ý" : stylist?.name}
              </h2>
              {stylist.id !== -1 && (
                <button
                  onClick={handleToggleDetail}
                  className="text-[9.5px] text-blue-600 font-bold hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 shadow-sm"
                >
                  <i className="fa-solid fa-circle-info"></i> Chi tiết
                </button>
              )}
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200 shadow-sm whitespace-nowrap">
            {mergedStylists.length > 0 ? "Vuốt để chọn" : ""}
          </span>
        </div>

        {/* HORIZONTAL SWIPE LIST */}
        <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-3 pt-1.5 px-2 -mx-2 custom-scrollbar snap-x">
          {(requiresStylist ? mergedStylists : [defaultStylist]).map((s, idx) => {
            const isSelected = index === idx;
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => requiresStylist && setIndex(idx)}
                className={`snap-start shrink-0 flex flex-col items-center gap-1.5 transition-all duration-300 focus:outline-none group ${requiresStylist ? '' : 'cursor-default'}`}
              >
                {/* RING BOUNDARY - Guarantees no clipping */}
                <div className={`rounded-full p-[2.5px] transition-all duration-300 ${isSelected ? 'bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 scale-105 shadow-sm shadow-blue-500/20' : 'bg-transparent scale-100'}`}>
                  <div className="rounded-full bg-white p-[2px]">
                    <div className="relative">
                      <img
                        src={
                          s.image
                            ? s.image.startsWith("http")
                              ? s.image
                              : `http://localhost:5001/image/${s.image}`
                            : "http://localhost:5001/image/25Zone.png"
                        }
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover bg-slate-100"
                        alt={s.name}
                      />
                      {/* Badge for default stylist */}
                      {s.id === -1 && (
                         <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-blue-600 to-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center border-[2px] border-white text-[9px] shadow-sm z-10">
                           ✨
                         </div>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`text-[9.5px] sm:text-[10.5px] max-w-[90px] sm:max-w-[100px] truncate text-center transition-all duration-300 ${isSelected ? 'font-bold text-slate-900' : 'font-semibold text-slate-400 group-hover:text-slate-600'}`}>
                  {s.id === -1 ? "Gợi ý" : s.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* optional label */}
        {stylist?.id === -1 && (
          <p className="mt-1.5 text-[10px] text-slate-600 text-left font-medium bg-blue-50 p-2 rounded-lg border border-blue-100/60 shadow-sm flex items-start gap-1.5">
            <span className="text-blue-600 shrink-0 mt-0.5">✨</span> 
            <span className="leading-tight">Hệ thống sẽ ưu tiên chọn giúp bạn stylist xuất sắc nhất có lịch trống phù hợp.</span>
          </p>
        )}
      </div>

      {/* BOTTOM: Time Selection */}
      <div className="border-t border-slate-100 pt-3 sm:pt-4 flex flex-col flex-1 min-h-0 bg-white">
        <div className="shrink-0 mb-3">
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold">
            Thời gian
          </p>
          <h2 className="mt-1 text-base sm:text-lg font-bold text-slate-900">
            Chọn lịch hẹn
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0 pb-4">
          <TimeSlotPicker
          key={selectedDate} // 👈 THÊM DÒNG NÀY
            userId={stylist.id}
            initialDate={selectedDate}
            initialTime={selectedTime}
            onChange={handleSlotChange}
          />
        </div>
      </div>
      {/* POPUP VIEW */}
      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300">
          <div
            className="bg-white rounded-[24px] w-[90%] max-w-[360px] relative shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 sm:-translate-y-8"
          >
            {/* Header Gradient */}
            <div className="h-28 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 w-full relative">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 h-8 w-8 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-colors shadow-sm focus:outline-none"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Content Area */}
            <div className="px-6 pb-6 pt-0 relative flex flex-col items-center">
              {/* Avatar overlapping header */}
              <div className="h-[100px] w-[100px] rounded-full border-4 border-white shadow-[0_2px_15px_rgba(0,0,0,0.1)] overflow-hidden bg-white -mt-[50px] mb-3 relative z-10">
                <img
                  src={
                    stylist.image
                      ? stylist.image.startsWith("http")
                        ? stylist.image
                        : `http://localhost:5001/image/${stylist.image}`
                      : "http://localhost:5001/image/25Zone.png"
                  }
                  alt={stylist?.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <h2 className="text-[20px] font-black tracking-tight text-slate-900 mb-5">
                {stylist?.name}
              </h2>

              {loadingDetail ? (
                <div className="flex justify-center items-center py-8 w-full">
                  <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : stylistDetail ? (
                  <div className="w-full space-y-3 overflow-y-auto max-h-[50vh] pr-1 pb-2 custom-scrollbar">
                    {/* ĐÁNH GIÁ */}
                    <div 
                      className="bg-slate-50 rounded-2xl border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.01)] transition-all hover:border-slate-200 overflow-hidden cursor-pointer"
                      onClick={() => setIsRatingExpanded(!isRatingExpanded)}
                    >
                      <div className="flex items-center justify-between p-4">
                        <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest pl-1 flex items-center gap-2">
                          Đánh giá
                          <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-300 ${isRatingExpanded ? 'rotate-180' : ''}`}></i>
                        </span>
                        <div className="flex items-center gap-1.5 text-amber-500 font-black text-[15px]">
                          <i className="fa-solid fa-star mb-[1px]"></i>
                          <span>{stylistDetail.avgRating > 0 ? Number(stylistDetail.avgRating).toFixed(1) : "5.0"}</span>
                          <span className="text-slate-400 font-semibold text-[13px] ml-1">({stylistDetail.reviewCount > 0 ? stylistDetail.reviewCount : 0})</span>
                        </div>
                      </div>
                      
                      {/* Bảng phân tích chi tiết */}
                      <div className={`transition-all duration-300 ease-in-out bg-white border-t border-slate-100 ${isRatingExpanded ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-4 space-y-3">
                          <div className="flex justify-between items-center text-[13px]">
                            <span className="font-semibold text-slate-600">✂️ Cắt tóc</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800">{stylistDetail.ratingDetails?.cut?.avg > 0 ? Number(stylistDetail.ratingDetails.cut.avg).toFixed(1) : "5.0"}</span>
                              <i className="fa-solid fa-star text-amber-400 text-[10px]"></i>
                              <span className="text-slate-400 text-[11px] w-8 text-right">({stylistDetail.ratingDetails?.cut?.count || 0})</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-[13px]">
                            <span className="font-semibold text-slate-600">🎨 Nhuộm</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800">{stylistDetail.ratingDetails?.dye?.avg > 0 ? Number(stylistDetail.ratingDetails.dye.avg).toFixed(1) : "5.0"}</span>
                              <i className="fa-solid fa-star text-amber-400 text-[10px]"></i>
                              <span className="text-slate-400 text-[11px] w-8 text-right">({stylistDetail.ratingDetails?.dye?.count || 0})</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-[13px]">
                            <span className="font-semibold text-slate-600">🌀 Uốn</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800">{stylistDetail.ratingDetails?.perm?.avg > 0 ? Number(stylistDetail.ratingDetails.perm.avg).toFixed(1) : "5.0"}</span>
                              <i className="fa-solid fa-star text-amber-400 text-[10px]"></i>
                              <span className="text-slate-400 text-[11px] w-8 text-right">({stylistDetail.ratingDetails?.perm?.count || 0})</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  {/* KINH NGHIỆM */}
                  <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.01)] transition-all hover:border-slate-200">
                    <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest pl-1">Kinh nghiệm</span>
                    <div className="flex items-center gap-2 text-slate-800 font-black text-[15px]">
                      <i className="fa-solid fa-briefcase text-blue-600"></i>
                      <span>{3 + (stylist.id % 6)} năm</span>
                    </div>
                  </div>

                  {/* NƠI LÀM VIỆC */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.01)] transition-all hover:border-slate-200">
                    <span className="block text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">Nơi làm việc</span>
                    <div className="flex items-start gap-2.5 text-slate-800 text-[14px] font-bold leading-snug">
                      <i className="fa-solid fa-store mt-0.5 text-blue-600 w-4 text-center"></i>
                      <span>{stylistDetail.Name_store || "Chi nhánh 25Zone"}</span>
                    </div>
                  </div>

                  {/* HÌNH ẢNH SẢN PHẨM */}
                  {stylistDetail.resultImages && stylistDetail.resultImages.length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.01)] transition-all hover:border-slate-200">
                      <span className="block text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2 pl-1">Tác phẩm ({stylistDetail.resultImages.length})</span>
                      <div className="grid grid-cols-4 gap-2">
                        {stylistDetail.resultImages.slice(0, 12).map((img: string, idx: number) => {
                          const imgSrc = img.startsWith('http') || img.startsWith('blob') || img.startsWith('data') 
                                    ? img 
                                    : `http://localhost:5001${img.startsWith('/') ? '' : '/'}${img}`;
                          return (
                            <div key={idx} className="aspect-square rounded-lg border border-slate-200 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                              <img src={imgSrc} alt={`Tác phẩm ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-[13px] font-semibold text-slate-400 py-6">Chưa có thông tin</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
