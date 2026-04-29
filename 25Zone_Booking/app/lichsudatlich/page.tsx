"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BookingAccountShell from "@/app/components/account/BookingAccountShell";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { apiRequest, errorMessage } from "@/lib/api";
import { useRouter } from "next/navigation";
import { buildBookingFlowHref, writeStoredBookingFlowSelection } from "@/lib/booking-flow-selection";
import Toast from "@/app/components/Toast";

type BookingStatus = "pending" | "confirmed" | "processing" | "completed" | "cancelled";

type BookingHistoryItem = {
  Id_booking: number;
  Booking_code: string;
  Booking_date: string;
  Start_time: string;
  Status: BookingStatus;
  Total_price: number;
  Note: string;
  Store_name: string | null;
  Stylist_name: string | null;
  Total_items: number;
  Duration_minutes: number;
  Services_preview: string[];
};

const statusMap: Record<
  BookingStatus,
  { label: string; className: string; icon: string }
> = {
  pending: { label: "Chờ xác nhận", className: "bg-amber-50 text-amber-700", icon: "fa-clock" },
  confirmed: { label: "Đã xác nhận", className: "bg-indigo-50 text-indigo-700", icon: "fa-check" },
  processing: { label: "Đang thực hiện", className: "bg-sky-50 text-sky-700", icon: "fa-scissors" },
  completed: { label: "Hoàn thành", className: "bg-emerald-50 text-emerald-700", icon: "fa-circle-check" },
  cancelled: { label: "Đã hủy", className: "bg-rose-50 text-rose-700", icon: "fa-ban" },
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(
    Number(value || 0)
  );

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function BookingHistoryPage() {
  const { token, user, bootstrapped } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [bookings, setBookings] = useState<BookingHistoryItem[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{message: string, type: "success" | "error" | "warning"} | null>(null);

  const router = useRouter();
  const [rebookingId, setRebookingId] = useState<number | null>(null);
  const [rebookPopup, setRebookPopup] = useState<{ show: boolean, message: string, onConfirm?: () => void }>({ show: false, message: "" });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const totalPages = Math.ceil(bookings.length / itemsPerPage);
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return bookings.slice(start, start + itemsPerPage);
  }, [bookings, currentPage]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const loadBookings = async () => {
    if (!token) return;
    setError("");
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (status) query.set("status", status);
      if (search.trim()) query.set("search", search.trim());
      const url = `/api/datlich/me${query.toString() ? `?${query.toString()}` : ""}`;
      const response = await apiRequest<{ bookings: BookingHistoryItem[] }>(url, { token });
      setBookings(Array.isArray(response.bookings) ? response.bookings : []);
      setCurrentPage(1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadBookings();
  }, [token, status]);

  const handleRebook = async (booking: BookingHistoryItem) => {
    if (!token || !user) return;
    try {
      setRebookingId(booking.Id_booking);

      const res = await apiRequest<{ booking: any }>(`/api/datlich/me/${booking.Id_booking}`, { token });
      const detail = res.booking;

      const serviceIds = detail.items.filter((i: any) => i.Item_type === 'service').map((i: any) => i.Id_services);
      const comboIds = detail.items.filter((i: any) => i.Item_type === 'combo').map((i: any) => i.Id_combo);
      const salonId = detail.Id_store;
      const stylistId = detail.Id_stylist;
      const startDate = new Date(booking.Start_time);
      const oldTime = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;

      // Local time date string
      const today = new Date();
      const todayDateStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

      writeStoredBookingFlowSelection({
        phone: (user as any).phone || "",
        salonId,
        serviceIds,
        comboIds
      });

      let isAvailable = false;

      if (stylistId) {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:5001";
        const availRes = await fetch(`${apiBase}/api/lichlamviec?userId=${stylistId}&date=${todayDateStr}`);
        if (availRes.ok) {
          const availData = await availRes.json();
          const hours = availData?.hours || [];
          if (hours.length > 0) {
            const startIndex = hours.findIndex((h: any) => h.Hours?.slice(0, 5) === oldTime);
            if (startIndex !== -1) {
              const durationMinutes = detail.Duration_minutes || 30;
              const slotCount = Math.ceil(durationMinutes / 30);
              const slotsToCheck = hours.slice(startIndex, startIndex + slotCount);

              const currentMinutes = today.getHours() * 60 + today.getMinutes();
              const [oldH, oldM] = oldTime.split(':').map(Number);
              const oldMinutes = oldH * 60 + oldM;

              if (slotsToCheck.length === slotCount && slotsToCheck.every((h: any) => h.Status === 1) && oldMinutes > currentMinutes) {
                isAvailable = true;
              }
            }
          }
        }
      }

      if (stylistId && !isAvailable) {
        setRebookPopup({
          show: true,
          message: `Stylist ${booking.Stylist_name} hiện đang bận hoặc không làm việc vào lúc ${oldTime} hôm nay, hoặc khung giờ này đã qua. Bạn có muốn chuyển sang bước chọn thời gian/stylist khác không?`,
          onConfirm: () => {
            setRebookPopup({ show: false, message: "" });
            router.push(buildBookingFlowHref(3, { salonId, serviceIds, comboIds }, { date: todayDateStr, stylistId }));
          }
        });
        return;
      }

      if (isAvailable) {
        router.push(buildBookingFlowHref(4, { salonId, serviceIds, comboIds }, { date: todayDateStr, time: oldTime, stylistId }));
      } else {
        router.push(buildBookingFlowHref(3, { salonId, serviceIds, comboIds }, { date: todayDateStr }));
      }

    } catch (err) {
      console.error("Rebook error:", err);
      setToast({ message: "Lỗi khi đặt lại lịch. Vui lòng thử lại.", type: "error" });
    } finally {
      setRebookingId(null);
    }
  };

  const statuses = useMemo(
    () => [
      { value: "", label: "Tất cả" },
      { value: "pending", label: "Chờ xác nhận" },
      { value: "confirmed", label: "Đã xác nhận" },
      { value: "completed", label: "Hoàn thành" },
      { value: "cancelled", label: "Đã hủy" },
    ],
    []
  );

  if (!hydrated || !bootstrapped) {
    return (
      <main className="mx-auto max-w-container px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">
          Đang tải lịch sử đặt lịch...
        </div>
      </main>
    );
  }

  if (!user || !token) {
    return (
      <main className="mx-auto max-w-container px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-700 font-semibold">
            Vui lòng đăng nhập để xem lịch sử đặt lịch.
          </p>
          <Link
            href="/?auth=login"
            className="inline-flex mt-4 rounded-xl bg-[#003366] px-5 py-3 text-white font-bold hover:bg-[#002244] transition"
          >
            Đăng nhập
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8 mt-10 text-[15px] sm:text-base text-gray-500">
        <div className="flex flex-wrap items-center gap-2">
          <Link className="hover:text-[#003366] font-semibold transition" href="/">
            Trang chủ
          </Link>
          <i className="fa-solid fa-chevron-right text-[11px] text-gray-300"></i>
          <span className="text-gray-700 font-extrabold">Lịch sử đặt lịch</span>
        </div>
      </div>

      <section className="mx-auto max-w-container px-4 sm:px-6 lg:px-8 py-12">
        <BookingAccountShell active="history">
          <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg sm:text-xl font-extrabold text-[#003366]">
                  Lịch sử đặt lịch
                </h3>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    loadBookings();
                  }}
                  className="relative w-full sm:w-[380px] lg:w-[430px]"
                >
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/15"
                    placeholder="Tìm theo mã lịch hoặc salon..."
                  />
                </form>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {statuses.map((item) => (
                  <button
                    key={item.value || "all"}
                    type="button"
                    onClick={() => setStatus(item.value)}
                    className={
                      "px-4 py-2 rounded-full font-semibold text-sm border transition " +
                      (status === item.value
                        ? "bg-[#003366] text-white border-[#003366]"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50")
                    }
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 space-y-5">
              {loading ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  Đang tải dữ liệu...
                </div>
              ) : null}

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              ) : null}

              {!loading && !error && bookings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 px-6 py-8 text-center text-sm text-gray-600">
                  Bạn chưa có lịch đặt nào phù hợp.
                </div>
              ) : null}

              {paginatedBookings.map((booking) => {
                const statusInfo = statusMap[booking.Status] || statusMap.pending;
                return (
                  <article
                    key={booking.Id_booking}
                    className="rounded-2xl border border-gray-200 p-5 bg-white hover:shadow-md transition"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Mã lịch hẹn</p>
                        <p className="font-extrabold text-[#003366]">
                          #{booking.Booking_code}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${statusInfo.className}`}
                        >
                          <i className={`fa-solid ${statusInfo.icon}`}></i>
                          {statusInfo.label}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(booking.Booking_date)} - {formatTime(booking.Start_time)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-800">Salon:</span>{" "}
                        {booking.Store_name || "Đang cập nhật"}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-800">Stylist:</span>{" "}
                        {booking.Stylist_name || "Đang cập nhật"}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-800">Dịch vụ:</span>{" "}
                        {booking.Services_preview?.length
                          ? booking.Services_preview.join(", ")
                          : "Đang cập nhật"}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span>
                          Số mục:{" "}
                          <span className="font-semibold text-gray-800">{booking.Total_items}</span>
                        </span>
                        <span>
                          Thời lượng:{" "}
                          <span className="font-semibold text-gray-800">
                            {Number(booking.Duration_minutes || 0)} phút
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-extrabold text-[#8b1e1e] tabular-nums">
                          {formatMoney(booking.Total_price)}
                        </p>
                        {(booking.Status === "completed" || booking.Status === "cancelled") && (
                          <button
                            onClick={() => handleRebook(booking)}
                            disabled={rebookingId === booking.Id_booking}
                            className="inline-flex items-center justify-center rounded-xl bg-blue-50 border border-blue-200 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition disabled:opacity-50"
                          >
                            {rebookingId === booking.Id_booking ? (
                              <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                            ) : (
                              <i className="fa-solid fa-rotate-right mr-2"></i>
                            )}
                            Đặt lại
                          </button>
                        )}
                        <Link
                          href={`/lichsudatlich/${booking.Id_booking}`}
                          className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
                        >
                          Xem chi tiết
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 focus:outline-none disabled:opacity-50 transition"
                  >
                    <i className="fa-solid fa-chevron-left"></i>
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageStr = i + 1;
                    return (
                      <button
                        key={pageStr}
                        onClick={() => setCurrentPage(pageStr)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition ${currentPage === pageStr
                          ? "bg-[#003366] text-white"
                          : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                      >
                        {pageStr}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 focus:outline-none disabled:opacity-50 transition"
                  >
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        </BookingAccountShell>
      </section>

      {rebookPopup.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="text-center">
              <div className="mx-auto flex flex-col items-center justify-center h-16 w-16 rounded-full bg-blue-50 text-blue-600 mb-4 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                <i className="fa-solid fa-calendar-days text-2xl"></i>
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Đổi thời gian / Stylist</h3>
              <p className="text-[13.5px] text-slate-600 mb-6 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {rebookPopup.message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setRebookPopup({ show: false, message: "" })}
                  className="w-1/2 bg-white text-gray-700 font-semibold py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm active:scale-95"
                >
                  Hủy
                </button>
                <button
                  onClick={rebookPopup.onConfirm}
                  className="w-1/2 bg-blue-900 text-white font-semibold py-3 rounded-xl hover:bg-blue-800 transition-colors shadow-md shadow-blue-900/20 active:scale-95"
                >
                  Đồng ý
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </main>
  );
}
