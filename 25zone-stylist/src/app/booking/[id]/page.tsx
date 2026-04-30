"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { getCurrentUser, type StylistUser } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

/* ─── Types ─── */
interface Appointment {
  id: number;
  booking_date: string;
  start_time: string;
  status: string;
  total_price: number;
  note: string | null;
  description_cancel: string | null;
  customer_name: string;
  customer_phone: string;
  store_name: string;
  service_names: string | null;
  combo_names: string | null;
  total_duration_minutes: number;
}

/* ─── Helpers ─── */
function formatTime(startTime: string): string {
  try {
    const d = new Date(startTime);
    if (isNaN(d.getTime())) return "--:--";
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return "--:--";
  }
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "--";
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function getStatusInfo(status: string): { label: string; colorClass: string; icon: string } {
  switch (status) {
    case "completed":
      return { label: "Hoàn thành", colorClass: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30", icon: "✓" };
    case "processing":
      return { label: "Đang thực hiện", colorClass: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30", icon: "✂" };
    case "confirmed":
      return { label: "Đã xác nhận", colorClass: "bg-blue-50 dark:bg-accent-blue/10 text-primary dark:text-accent-blue border-blue-100 dark:border-accent-blue/20", icon: "✓" };
    case "pending":
      return { label: "Chờ xác nhận", colorClass: "bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700", icon: "⏳" };
    case "cancelled":
      return { label: "Đã huỷ", colorClass: "bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border-red-100 dark:border-red-900/30", icon: "✕" };
    default:
      return { label: status, colorClass: "bg-slate-50 text-slate-500 border-slate-200", icon: "?" };
  }
}

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<StylistUser | null>(null);
  const [booking, setBooking] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  const fetchBooking = useCallback(async (stylistUser: StylistUser, bookingId: string) => {
    setLoading(true);
    setError("");
    try {
      // Fetch all bookings for stylist (the API doesn't have a single-booking endpoint for stylists)
      const res = await fetch(`${API_BASE}/datlich`);
      if (!res.ok) throw new Error("Không thể tải dữ liệu.");
      const data: Appointment[] = await res.json();
      const found = data.find((b) => String(b.id) === bookingId);
      if (!found) {
        setError("Không tìm thấy lịch hẹn này.");
        return;
      }
      setBooking(found);

      // Fetch result images for completed bookings
      if (found.status === "completed") {
        setLoadingImages(true);
        try {
          const imgRes = await fetch(`${API_BASE}/datlich/${found.id}/results`);
          if (imgRes.ok) {
            const imgData = await imgRes.json();
            setResultImages(imgData.images || []);
          }
        } catch {
          // ignore image fetch errors
        } finally {
          setLoadingImages(false);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    if (currentUser && params?.id) {
      fetchBooking(currentUser, params.id);
    } else {
      setLoading(false);
      if (!currentUser) setError("Vui lòng đăng nhập.");
    }
  }, [fetchBooking, params?.id]);

  const statusInfo = booking ? getStatusInfo(booking.status) : null;

  return (
    <div className="w-full max-w-lg mx-auto pb-28">

      {/* ─── Sticky Header ─── */}
      <div className="sticky top-0 z-30 bg-background-light/80 dark:bg-[#0f1c23]/80 backdrop-blur-xl border-b border-slate-100 dark:border-primary/30 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white dark:bg-primary/50 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-primary/70 transition-colors border border-slate-200 dark:border-primary/50 shadow-sm active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black text-primary dark:text-white truncate">Chi tiết lịch hẹn</h1>
          {booking && (
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Mã: #BKG-{String(booking.id).padStart(6, "0")}</p>
          )}
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 rounded-full" />
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-slate-400 dark:text-slate-500 font-medium text-sm">Đang tải chi tiết...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-8 border border-red-100 dark:border-red-900/30 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 text-2xl">!</div>
            <p className="text-red-600 dark:text-red-400 font-semibold mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors text-sm"
            >
              Quay lại
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && booking && statusInfo && (
          <>
            {/* Status */}
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2.5 text-sm font-bold rounded-full border ${statusInfo.colorClass}`}>
                {statusInfo.icon} {statusInfo.label}
              </span>
            </div>

            {/* Customer */}
            <div className="bg-white dark:bg-primary-dark rounded-[1.5rem] p-5 border border-slate-100 dark:border-primary/50 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Khách hàng</p>
              <p className="text-xl font-black text-primary dark:text-white">{booking.customer_name || "Khách hàng"}</p>
              {booking.customer_phone && (
                <a
                  href={`tel:${booking.customer_phone}`}
                  className="mt-3 flex items-center gap-3 bg-accent-blue/10 dark:bg-accent-blue/15 text-accent-blue px-4 py-3 rounded-xl font-bold text-sm border border-accent-blue/20 dark:border-accent-blue/25 active:scale-[0.98] transition-transform"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  Gọi: {booking.customer_phone}
                </a>
              )}
            </div>

            {/* Time & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-primary-dark rounded-[1.5rem] p-5 border border-slate-100 dark:border-primary/50 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Thời gian</p>
                <p className="text-2xl font-black text-primary dark:text-accent-blue">{formatTime(booking.start_time)}</p>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{formatDate(booking.booking_date)}</p>
              </div>
              <div className="bg-white dark:bg-primary-dark rounded-[1.5rem] p-5 border border-slate-100 dark:border-primary/50 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Thời lượng</p>
                <p className="text-2xl font-black text-primary dark:text-white">{formatDuration(booking.total_duration_minutes)}</p>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 leading-relaxed truncate">{booking.store_name}</p>
              </div>
            </div>

            {/* Services */}
            <div className="bg-white dark:bg-primary-dark rounded-[1.5rem] p-5 border border-slate-100 dark:border-primary/50 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Dịch vụ đã đặt</p>
              <div className="flex flex-wrap gap-2">
                {booking.combo_names && booking.combo_names.split(",").map((name, i) => (
                  <span key={`c-${i}`} className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-sm font-bold rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                    {name.trim()}
                  </span>
                ))}
                {booking.service_names && booking.service_names.split(",").map((name, i) => (
                  <span key={`s-${i}`} className="px-3.5 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-bold rounded-xl border border-blue-100 dark:border-blue-900/30">
                    {name.trim()}
                  </span>
                ))}
                {!booking.service_names && !booking.combo_names && (
                  <span className="text-slate-400 dark:text-slate-500 font-medium italic text-sm">Không có dịch vụ</span>
                )}
              </div>
            </div>

            {/* Total Price */}
            <div className="flex items-center justify-between bg-gradient-to-r from-primary to-secondary dark:from-accent-blue dark:to-blue-600 rounded-[1.5rem] px-6 py-5 text-white shadow-lg shadow-primary/15 dark:shadow-accent-blue/15">
              <span className="font-bold opacity-80 text-base">Tổng tiền</span>
              <span className="text-2xl font-black">{formatMoney(booking.total_price)}</span>
            </div>

            {/* Note */}
            {booking.note && booking.status !== "cancelled" && (
              <div className="bg-amber-50 dark:bg-amber-900/10 rounded-[1.5rem] p-5 border border-amber-100 dark:border-amber-900/20">
                <p className="text-[10px] font-bold text-amber-500 dark:text-amber-400/70 uppercase tracking-wider mb-2">Ghi chú</p>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 leading-relaxed">{booking.note}</p>
              </div>
            )}

            {/* Cancel Reason */}
            {booking.status === "cancelled" && booking.description_cancel && (
              <div className="bg-red-50 dark:bg-red-900/10 rounded-[1.5rem] p-5 border border-red-100 dark:border-red-900/20">
                <p className="text-[10px] font-bold text-red-400 dark:text-red-400/70 uppercase tracking-wider mb-2">Lý do huỷ</p>
                <p className="text-sm font-medium text-red-700 dark:text-red-300 leading-relaxed">{booking.description_cancel}</p>
              </div>
            )}

            {/* Result Images */}
            {booking.status === "completed" && (
              <div className="bg-white dark:bg-primary-dark rounded-[1.5rem] p-5 border border-slate-100 dark:border-primary/50 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Hình ảnh kết quả</p>
                {loadingImages ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-3 border-slate-200 dark:border-slate-700 border-t-accent-blue rounded-full animate-spin" />
                  </div>
                ) : resultImages.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2.5">
                    {resultImages.map((img, idx) => {
                      const imgSrc = img.startsWith("http") ? img : `http://localhost:5001${img}`;
                      return (
                        <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-primary/50 bg-slate-50 dark:bg-primary/30">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imgSrc} alt={`Kết quả ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-primary/20 rounded-xl p-6 text-center">
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Chưa có hình ảnh kết quả.</p>
                  </div>
                )}
              </div>
            )}

            {/* Back Button (bottom) */}
            <div className="pt-2 pb-4">
              <button
                onClick={() => router.back()}
                className="w-full py-4 bg-white dark:bg-primary-dark text-primary dark:text-white font-bold rounded-[1.2rem] border border-slate-200 dark:border-primary/50 hover:bg-slate-50 dark:hover:bg-primary/30 transition-colors text-sm active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                Quay lại
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
