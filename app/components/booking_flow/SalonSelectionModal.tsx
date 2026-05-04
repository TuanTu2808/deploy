"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { fetchBookingSalons } from "@/lib/booking-salons";
import type { BookingSalon } from "@/lib/booking-salons";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  currentSalonId?: number | null;
  onSelect: (salonId: number) => void;
};

const PAGE_SIZE = 5;

export default function SalonSelectionModal({ isOpen, onClose, currentSalonId, onSelect }: Props) {
  const [salons, setSalons] = useState<BookingSalon[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (salons.length === 0) {
        setLoading(true);
        fetchBookingSalons()
          .then((data) => setSalons(data))
          .catch(console.error)
          .finally(() => setLoading(false));
      }
    } else {
      document.body.style.overflow = "";
      setKeyword("");
      setSelectedProvince("all");
      setCurrentPage(1);
    }
    
    return () => { document.body.style.overflow = ""; };
  }, [isOpen, salons.length]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, selectedProvince]);

  if (!mounted || !isOpen) return null;

  const normalizeQuery = (text: string) => {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .trim();
  };

  const provinces = Array.from(new Set(salons.map(s => s.province).filter(Boolean)));

  const normalizedKeyword = normalizeQuery(keyword);
  const filteredSalons = salons.filter((salon) => {
    const matchKeyword = normalizeQuery(`${salon.name} ${salon.address}`).includes(normalizedKeyword);
    const matchProvince = selectedProvince === "all" || salon.province === selectedProvince;
    return matchKeyword && matchProvince;
  });

  const totalPages = Math.max(1, Math.ceil(filteredSalons.length / PAGE_SIZE));
  const paginatedSalons = filteredSalons.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return createPortal(
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-end sm:justify-center bg-black/60 backdrop-blur-sm sm:px-4 sm:py-8">
      {/* Nền bấm để đóng trên mobile/desktop */}
      <div className="absolute inset-0 z-0" onClick={onClose}></div>

      <div className="relative z-10 bg-white rounded-t-[24px] sm:rounded-[24px] w-full max-w-2xl shadow-2xl flex flex-col min-h-0 max-h-[90vh] sm:max-h-[85vh] animate-in fade-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        
        {/* Thanh cầm kéo trên mobile */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden pointer-events-none">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
        </div>

        <div className="p-4 sm:p-6 sm:pt-6 border-b border-slate-100 flex flex-col shrink-0 gap-3 sm:gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-slate-900">Chọn chi nhánh</h2>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                </svg>
              </div>
              <input
                type="text"
                className="w-full h-10 sm:h-11 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400 transition-shadow"
                placeholder="Tìm tên hoặc địa chỉ chi nhánh..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="h-10 sm:h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 focus:outline-none focus:border-blue-500 sm:w-44 transition-shadow"
            >
              <option value="all">Tất cả khu vực</option>
              {provinces.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 custom-scrollbar bg-slate-50/50 overscroll-contain">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : paginatedSalons.length > 0 ? (
            <div className="space-y-3">
              {paginatedSalons.map((salon) => {
                const isSelected = salon.id === currentSalonId;
                return (
                  <button
                    key={salon.id}
                    onClick={() => {
                      onSelect(salon.id);
                      onClose();
                    }}
                    className={`nav-btn w-full text-left p-3 sm:p-4 rounded-2xl border transition-all duration-300 flex items-start gap-3 group relative overflow-hidden bg-white ${isSelected
                        ? "border-blue-400 ring-1 ring-blue-400 shadow-md sm:scale-[1.02]"
                        : "border-slate-200 hover:border-blue-300 hover:shadow-sm"
                      }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 right-0 h-4 rounded-bl-xl bg-blue-500 text-[10px] font-bold text-white px-2 flex items-center justify-center">
                        Đang chọn
                      </div>
                    )}
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl shrink-0 overflow-hidden bg-slate-100 border border-slate-100">
                      <img src={salon.image} alt={salon.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-[14px] sm:text-[15px] font-bold leading-tight line-clamp-1 mb-1 ${isSelected ? "text-blue-700" : "text-slate-900 group-hover:text-blue-700 transition-colors"}`}>
                        {salon.name}
                      </h3>
                      <p className="text-[11px] sm:text-[12px] text-slate-500 mb-1 leading-snug line-clamp-2">
                        {salon.address}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${salon.statusTone}`}>
                          {salon.status}
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-medium text-slate-500">
                          {salon.hours}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-700">Không tìm thấy chi nhánh nào</p>
              <p className="text-xs text-slate-500 mt-1">Vui lòng thử lại với từ khóa hoặc bộ lọc khác</p>
            </div>
          )}
        </div>

        {/* PHÂN TRANG */}
        {totalPages > 1 && (
          <div className="p-3 sm:p-4 border-t border-slate-100 flex items-center justify-between bg-white shrink-0 sm:rounded-b-[24px]">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center justify-center h-8 sm:h-9 px-3 sm:px-4 rounded-lg border border-slate-200 text-[11px] sm:text-[12px] font-semibold text-slate-600 disabled:opacity-40 disabled:bg-slate-50 hover:bg-slate-50 active:scale-95 transition-all"
            >
              <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              Trước
            </button>
            <div className="flex flex-col items-center">
              <span className="text-[12px] font-bold text-slate-700">
                Trang {currentPage} <span className="text-slate-400 font-medium">/ {totalPages}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Tổng {filteredSalons.length} chi nhánh
              </span>
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center h-8 sm:h-9 px-3 sm:px-4 rounded-lg border border-slate-200 text-[11px] sm:text-[12px] font-semibold text-slate-600 disabled:opacity-40 disabled:bg-slate-50 hover:bg-slate-50 active:scale-95 transition-all"
            >
              Sau
              <svg className="w-3.5 h-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        .nav-btn:active { transform: scale(0.98); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}} />
    </div>,
    document.body
  );
}
