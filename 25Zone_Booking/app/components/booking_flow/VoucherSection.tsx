"use client";

import { useState, useEffect, useRef } from "react";
import { formatCurrency } from "@/app/components/booking_flow/bookingData";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  buildBookingFlowHref,
  clearStoredBookingFlowSelection,
} from "@/lib/booking-flow-selection";
import { useAuth } from "../auth/AuthProvider";
import Toast from "@/app/components/Toast";

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  "https://api.25zone.io.vn";
type SelectedItem = {
  key: string;
  title: string;
  price: number;
  tone?: "amber" | "default" | "slate";
};
type Props = {
  total: number;
  selectedItems: SelectedItem[];
  safeSelection: any;
  selectedSalon: any;
  selectedStylist: any;
  selectedStylistId: number;
  selectedDate: string;
  selectedTime: string;
  totalStylistDuration: number;
};

export default function VoucherSection({
  total,
  selectedItems,
  safeSelection,
  selectedSalon,
  selectedStylist,
  selectedStylistId,
  selectedDate,
  selectedTime,
  totalStylistDuration,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();

  const [voucherCode, setVoucherCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [maxDiscount, setMaxDiscount] = useState(0);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [showAllVouchers, setShowAllVouchers] = useState(false);
  const [toast, setToast] = useState<{message: string, type: "success" | "error" | "warning"} | null>(null);

  const selectedItemsScrollRef = useRef<HTMLDivElement>(null);
  const [cartScrollState, setCartScrollState] = useState<'top' | 'bottom'>('top');

  const handleCartScroll = () => {
    if (!selectedItemsScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = selectedItemsScrollRef.current;
    if (scrollHeight <= clientHeight) {
      setCartScrollState('top');
      return;
    }
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
    setCartScrollState(isAtBottom ? 'bottom' : 'top');
  };

  useEffect(() => {
    handleCartScroll();
  }, [selectedItems]);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const res = await fetch(
          `${apiBase}/api/voucherbooking/available?total=${total}`
        );
        const data = await res.json();
        setVouchers(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchVouchers();
  }, [total]);

  const payable = total - discount;

  // APPLY VOUCHER
  const handleApplyVoucher = async () => {
    setError("");

    if (!voucherCode.trim()) {
      setError("Vui lòng nhập mã voucher");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${apiBase}/api/voucherbooking/check?code=${encodeURIComponent(voucherCode.trim())}&total=${total}`
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setDiscount(data.discount);
      setMaxDiscount(data.voucher?.maxDiscountAmount || 0);
    } catch (err: any) {
      setMaxDiscount(0);
      setDiscount(0);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleApplyVoucherFromList = async (voucher: any) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `${apiBase}/api/voucherbooking/check?code=${voucher.code}&total=${total}`
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setDiscount(data.discount);
      setMaxDiscount(data.voucher?.maxDiscountAmount || 0);
      setVoucherCode(voucher.code);
      setSelectedVoucher(voucher);
    } catch (err: any) {
      setDiscount(0);
      setMaxDiscount(0);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // CONFIRM
  const handleConfirm = async () => {
    setConfirming(true);

    try {
      const res = await fetch(`${apiBase}/api/datlich`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: safeSelection.phone,
          storeId: safeSelection.salonId,
          stylistId: selectedStylistId,
          date: selectedDate,
          time: selectedTime,
          serviceIds: safeSelection.serviceIds,
          comboIds: safeSelection.comboIds,
          duration: totalStylistDuration,
          voucherCode: voucherCode || undefined,
          discountAmount: discount || 0,
          finalPrice: payable, // total - discount
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      clearStoredBookingFlowSelection();

      const url = buildBookingFlowHref(4, safeSelection, {
        bookingId: data.bookingId,
        stylistId: selectedStylistId,
        date: selectedDate,
        time: selectedTime,
      }).replace("/xacnhan", "/datlichthanhcong");

      router.push(url);
    } catch (err: any) {
      setToast({ message: err.message || "Có lỗi xảy ra khi xác nhận", type: "error" });
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
      <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 sm:gap-6 items-start">
        <div className="rounded-3xl bg-white border border-gray-100 p-3 sm:p-6 shadow-sm lg:sticky lg:top-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-slate-900">
                Mục đã chọn
              </h2>
              <p className="text-[11px] sm:text-sm text-slate-500">
                Kiểm tra lại dịch vụ và mã giảm giá.
              </p>
            </div>
            <Link
              href={buildBookingFlowHref(2, safeSelection)}
              className="text-[12px] sm:text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Đổi dịch vụ
            </Link>
          </div>

          <div className="relative group">
            <div ref={selectedItemsScrollRef} onScroll={handleCartScroll} className="max-h-[250px] overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-6">
              {selectedItems.map((item) => (
                <div
                  key={item.key}
                  className={
                    item.tone === "amber" 
                      ? "rounded-2xl border border-amber-200 bg-amber-50 p-3" 
                      : "rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
                  }
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className={`text-[10px] font-bold uppercase tracking-[0.15em] mb-0.5 ${item.tone === "amber" ? "text-amber-700" : "text-slate-400"}`}>
                          {item.tone === "amber" ? "Combo" : "Dịch vụ"}
                        </p>
                        <h3 className="text-[13px] font-bold text-slate-900 leading-snug">{item.title}</h3>
                      </div>
                    </div>
                    <span className={`text-[13px] font-bold ${item.tone === "amber" ? "text-amber-700" : "text-slate-900"}`}>
                      {formatCurrency(item.price)}
                    </span>
                  </div>
                </div>
              ))}
              {selectedItems.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-slate-400 italic">
                  Chưa có dịch vụ nào được chọn
                </div>
              ) : null}
            </div>

            {/* FADE SCROLL HINT OVERLAY */}
            {(selectedItems.length > 2) && (
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

          {/* THÔNG TIN KHÁCH - GỌN */}
          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 flex items-center gap-3">
              <img
                src={
                  user?.Image
                    ? user.Image.startsWith("http")
                      ? user.Image
                      : `${apiBase}/image/${user.Image}`
                    : "/image/avatar.png"
                }
                alt="User Avatar"
                className="h-9 w-9 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-slate-800 truncate">
                  {user?.Name_user || "Khách đặt lịch"}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {user?.Phone || safeSelection.phone || "Chưa có số điện thoại"}
                </p>
              </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                Mã voucher
              </label>
              {selectedVoucher && (
                <button
                  type="button"
                  onClick={() => { setSelectedVoucher(null); setVoucherCode(""); setDiscount(0); setMaxDiscount(0); setError(""); }}
                  className="text-[11px] font-semibold text-red-500 hover:text-red-600 transition"
                >
                  Bỏ chọn voucher
                </button>
              )}
            </div>

            {/* DANH SÁCH VOUCHER */}
            {vouchers.length > 0 && (
              <div className="mb-4">
                <p className="text-[12px] font-semibold text-slate-600 mb-2.5">Voucher khả dụng ({vouchers.length})</p>
                <div className="space-y-2.5">
                  {(showAllVouchers ? vouchers : vouchers.slice(0, 2)).map((v: any) => {
                    const isSelected = selectedVoucher?.id === v.id;
                    const discountLabel = v.discountType === "percent"
                      ? `Giảm ${v.discountValue}%`
                      : `Giảm ${new Intl.NumberFormat("vi-VN").format(v.discountValue)}đ`;
                    const maxLabel = v.maxDiscountAmount > 0
                      ? `Tối đa ${new Intl.NumberFormat("vi-VN").format(v.maxDiscountAmount)}đ`
                      : null;
                    const minLabel = v.minOrderValue > 0
                      ? `Đơn tối thiểu ${new Intl.NumberFormat("vi-VN").format(v.minOrderValue)}đ`
                      : null;

                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleApplyVoucherFromList(v)}
                        disabled={loading}
                        className={`group relative w-full text-left rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/80 shadow-[0_0_0_1px_rgba(59,130,246,0.3),0_4px_12px_rgba(59,130,246,0.1)]"
                            : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-stretch">
                          {/* LEFT: Discount badge */}
                          <div className={`flex flex-col items-center justify-center px-4 py-3 shrink-0 min-w-[90px] border-r-2 border-dashed ${
                            isSelected ? "bg-blue-500 border-blue-400 text-white" : "bg-gradient-to-b from-blue-50 to-indigo-50 border-slate-200 text-blue-700"
                          }`}>
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Giảm</span>
                            <span className="text-[18px] font-black leading-none mt-0.5">
                              {v.discountType === "percent" ? `${v.discountValue}%` : `${Math.round(v.discountValue / 1000)}K`}
                            </span>
                          </div>
                          {/* RIGHT: Info */}
                          <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[12px] sm:text-[13px] font-bold truncate ${isSelected ? "text-blue-800" : "text-slate-800"}`}>
                                {v.name || discountLabel}
                              </span>
                              {isSelected && (
                                <span className="shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-blue-500 text-white">
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mb-1.5">
                              {v.description || discountLabel}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                                isSelected ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                              }`}>
                                {discountLabel}
                              </span>
                              {maxLabel && (
                                <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                                  {maxLabel}
                                </span>
                              )}
                              {minLabel && (
                                <span className="inline-flex items-center rounded-md bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                                  {minLabel}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Decorative notches */}
                        <div className={`absolute left-[88px] top-[-6px] h-3 w-3 rounded-full ${isSelected ? "bg-blue-50" : "bg-white"} border-2 ${isSelected ? "border-blue-500" : "border-slate-200"}`} />
                        <div className={`absolute left-[88px] bottom-[-6px] h-3 w-3 rounded-full ${isSelected ? "bg-blue-50" : "bg-white"} border-2 ${isSelected ? "border-blue-500" : "border-slate-200"}`} />
                      </button>
                    );
                  })}
                </div>
                {vouchers.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setShowAllVouchers(!showAllVouchers)}
                    className="mt-2.5 w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                  >
                    {showAllVouchers ? (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                        Thu gọn
                      </>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        Xem thêm {vouchers.length - 2} voucher
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* NHẬP MÃ THỦ CÔNG */}
            <div className="flex gap-2">
              <input
                id="bookingVoucherCode"
                type="text"
                placeholder="Hoặc nhập mã voucher..."
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[12px] text-slate-700 focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleApplyVoucher}
                disabled={loading || !voucherCode.trim()}
                className="px-4 rounded-xl bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? "Đang kiểm tra..." : "Áp dụng"}
              </button>
            </div>
            {error ? (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            ) : null}

            {!error && discount > 0 ? (
              <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5 flex items-center gap-2">
                <svg className="h-4 w-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div>
                  <p className="text-[12px] font-semibold text-emerald-700">
                    Đã áp dụng: giảm {formatCurrency(discount)}
                  </p>
                  {maxDiscount > 0 && (
                    <p className="text-[10px] text-emerald-600/80">
                      Giảm tối đa: {formatCurrency(maxDiscount)}
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>


        <div className="rounded-3xl bg-white border border-gray-100 p-3 sm:p-6 shadow-sm space-y-5 lg:sticky lg:top-6">
          <div>
            <h2 className="text-base sm:text-xl font-bold text-slate-900">
              Thanh toán
            </h2>
            <p className="text-[11px] sm:text-sm text-slate-500">
              Tất cả giá đã bao gồm VAT
            </p>
          </div>

          {/* CHI TIẾT GIÁ */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
            {selectedItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between text-[12px] sm:text-sm">
                <span className="text-slate-600 truncate mr-2">{item.title}</span>
                <span className="font-semibold text-slate-800 shrink-0">
                  {formatCurrency(item.price)}
                </span>
              </div>
            ))}
            <div className="h-px bg-slate-200" />
            <div className="flex items-center justify-between text-[12px] sm:text-sm">
              <span className="text-slate-500">Tổng cộng</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(total)}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex items-center justify-between text-[12px] sm:text-sm">
                <span className="text-emerald-600 flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                  Voucher
                </span>
                <span className="font-semibold text-emerald-600">
                  -{formatCurrency(discount)}
                </span>
              </div>
            )}
            <div className="h-px bg-slate-300" />
            <div className="flex items-center justify-between text-[14px] sm:text-lg font-black text-slate-900">
              <span>Thanh toán</span>
              <span className="text-blue-700">{formatCurrency(payable)}</span>
            </div>
          </div>


          {/* CAM KẾT */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-3.5">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              <p className="text-[13px] sm:text-sm text-slate-600 leading-relaxed">Đặt lịch <strong className="text-slate-800">miễn phí</strong> – Thanh toán khi đến salon</p>
            </div>
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-[13px] sm:text-sm text-slate-600 leading-relaxed">Hủy lịch <strong className="text-slate-800">miễn phí</strong> trước giờ hẹn</p>
            </div>
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              <p className="text-[13px] sm:text-sm text-slate-600 leading-relaxed">Bảo hành tóc <strong className="text-slate-800">7 ngày</strong> miễn phí</p>
            </div>
          </div>

          {/* NÚT XÁC NHẬN */}
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white px-6 py-4 rounded-2xl text-base font-black uppercase tracking-wide shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {confirming ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐẶT LỊCH"}
          </button>
        </div>
      </section>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}