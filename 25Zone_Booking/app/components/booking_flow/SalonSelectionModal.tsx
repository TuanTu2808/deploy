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

export default function SalonSelectionModal({ isOpen, onClose, currentSalonId, onSelect }: Props) {
  const [salons, setSalons] = useState<BookingSalon[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
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
    }
  }, [isOpen, salons.length]);

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

  const normalizedKeyword = normalizeQuery(keyword);
  const filteredSalons = salons.filter((salon) =>
    normalizeQuery(`${salon.name} ${salon.address}`).includes(normalizedKeyword)
  );

  return createPortal(
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8">
      <div className="bg-white rounded-[24px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] h-auto min-h-0 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col shrink-0 gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">Chọn chi nhánh</h2>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
              </svg>
            </div>
            <input
              type="text"
              className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow transition-colors placeholder:text-slate-400"
              placeholder="Tìm tên hoặc địa chỉ chi nhánh..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 custom-scrollbar bg-slate-50/50">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredSalons.length > 0 ? (
            <div className="space-y-3">
              {filteredSalons.map((salon) => {
                const isSelected = salon.id === currentSalonId;
                return (
                  <button
                    key={salon.id}
                    onClick={() => {
                      onSelect(salon.id);
                      onClose();
                    }}
                    className={`nav-btn w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-start gap-3 group relative overflow-hidden bg-white ${isSelected
                        ? "border-blue-400 ring-1 ring-blue-400 shadow-md scale-[1.02]"
                        : "border-slate-200 hover:border-blue-300 hover:shadow-sm"
                      }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 right-0 h-4 rounded-bl-xl bg-blue-500 text-[10px] font-bold text-white px-2 flex items-center justify-center">
                        Đang chọn
                      </div>
                    )}
                    <div className="h-12 w-12 rounded-xl shrink-0 overflow-hidden bg-slate-100 border border-slate-100">
                      <img src={salon.image} alt={salon.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-[15px] font-bold leading-tight line-clamp-1 mb-1 ${isSelected ? "text-blue-700" : "text-slate-900 group-hover:text-blue-700 transition-colors"}`}>
                        {salon.name}
                      </h3>
                      <p className="text-[12px] text-slate-500 mb-1 leading-snug line-clamp-2">
                        {salon.address}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${salon.statusTone}`}>
                          {salon.status}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">
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
              <p className="text-xs text-slate-500 mt-1">Vui lòng thử lại với từ khóa khác</p>
            </div>
          )}
        </div>
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
