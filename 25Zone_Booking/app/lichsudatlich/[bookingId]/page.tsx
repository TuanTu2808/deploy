"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import BookingAccountShell from "@/app/components/account/BookingAccountShell";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { apiRequest, errorMessage } from "@/lib/api";

type BookingStatus = "pending" | "confirmed" | "processing" | "completed" | "cancelled";

type BookingDetailItem = {
  Id_Booking_detail: number;
  Id_services: number | null;
  Id_combo: number | null;
  Item_type: "service" | "combo";
  Name: string;
  Price_at_booking: number;
  Duration_time: string;
  Rating?: number | null;
  Description?: string | null;
};

type BookingDetail = {
  Id_booking: number;
  Booking_code: string;
  Booking_date: string;
  Start_time: string;
  Status: BookingStatus;
  Total_price: number;
  Note: string;
  Description_cancel: string | null;
  Created_booking: string;
  Store_name: string | null;
  Store_address: string | null;
  Store_province: string | null;
  Store_ward: string | null;
  Store_phone: string | null;
  Stylist_name: string | null;
  Stylist_phone: string | null;
  Duration_minutes: number;
  items: BookingDetailItem[];
  resultImages?: string[];
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

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (value: string) => {
  const raw = String(value || "");
  if (!raw.includes(":")) return "0 phút";
  const [h = "0", m = "0"] = raw.split(":");
  const total = Number(h || 0) * 60 + Number(m || 0);
  return `${total} phút`;
};

export default function BookingHistoryDetailPage() {
  const params = useParams<{ bookingId: string }>();
  const { token, user, bootstrapped } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showHotlineModal, setShowHotlineModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [canceling, setCanceling] = useState(false);
  const [cancelErrorStr, setCancelErrorStr] = useState("");

  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingItem, setRatingItem] = useState<BookingDetailItem | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingDescription, setRatingDescription] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState("");

  const handleRateClick = (item: BookingDetailItem) => {
    setRatingItem(item);
    setRatingValue(item.Rating || 5);
    setRatingDescription(item.Description || "");
    setRatingError("");
    setRatingModalOpen(true);
  };

  const submitRating = async () => {
    if (!ratingItem) return;
    setSubmittingRating(true);
    setRatingError("");
    try {
      await apiRequest('/api/datlich/rating', {
        method: "POST",
        token,
        body: {
          detailId: ratingItem.Id_Booking_detail,
          rating: ratingValue,
          description: ratingDescription
        }
      });
      setBooking(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(i => i.Id_Booking_detail === ratingItem.Id_Booking_detail ? { ...i, Rating: ratingValue, Description: ratingDescription } : i)
        };
      });
      setRatingModalOpen(false);
    } catch (err) {
      setRatingError(errorMessage(err));
    } finally {
      setSubmittingRating(false);
    }
  };

  const canCancel = useMemo(() => {
    if (!booking) return false;
    if (booking.Status !== "pending" && booking.Status !== "confirmed") return false;

    if (!booking.Start_time) return false;
    const now = new Date().getTime();
    const startTimeStr = String(booking.Start_time);

    const startTime = startTimeStr.includes("T")
      ? new Date(startTimeStr).getTime()
      : new Date(startTimeStr.replace(" ", "T")).getTime();

    if (Number.isNaN(startTime)) return false;

    // 15 mins = 900000 ms
    return (startTime - now) > 900000;
  }, [booking]);

  const canShowCancelButton = useMemo(() => {
    if (!booking) return false;
    return booking.Status === "pending" || booking.Status === "confirmed";
  }, [booking]);

  const handleCancelClick = () => {
    if (canCancel) {
      setShowCancelModal(true);
    } else {
      setShowHotlineModal(true);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      setCancelErrorStr("Vui lòng nhập lý do huỷ");
      return;
    }
    setCancelErrorStr("");
    setCanceling(true);

    try {
      await apiRequest(`/api/datlich/${booking?.Id_booking}`, {
        method: "PATCH",
        token,
        body: {
          status: "cancelled",
          description_cancel: cancelReason.trim()
        }
      });
      setBooking(prev => prev ? { ...prev, Status: "cancelled", Note: cancelReason.trim() } : null);
      setShowCancelModal(false);
    } catch (err) {
      setCancelErrorStr(errorMessage(err));
    } finally {
      setCanceling(false);
    }
  };

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!token || !params?.bookingId) return;
      setError("");
      try {
        setLoading(true);
        const response = await apiRequest<{ booking: BookingDetail }>(
          `/api/datlich/me/${params.bookingId}`,
          { token }
        );
        setBooking(response.booking || null);
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, params?.bookingId]);

  const statusInfo = useMemo(
    () => (booking ? statusMap[booking.Status] || statusMap.pending : statusMap.pending),
    [booking]
  );

  if (!hydrated || !bootstrapped) {
    return (
      <main className="max-w-[1604px] mx-auto px-4 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">
          Đang tải chi tiết lịch hẹn...
        </div>
      </main>
    );
  }

  if (!user || !token) {
    return (
      <main className="max-w-[1604px] mx-auto px-4 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-700 font-semibold">
            Vui lòng đăng nhập để xem chi tiết lịch hẹn.
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
      <div className="max-w-[1604px] mx-auto px-4 mt-10 text-[15px] sm:text-base text-gray-500">
        <div className="flex flex-wrap items-center gap-2">
          <Link className="hover:text-[#003366] font-semibold transition" href="/">
            Trang chủ
          </Link>
          <i className="fa-solid fa-chevron-right text-[11px] text-gray-300"></i>
          <Link className="hover:text-[#003366] font-semibold transition" href="/lichsudatlich">
            Lịch sử đặt lịch
          </Link>
          <i className="fa-solid fa-chevron-right text-[11px] text-gray-300"></i>
          <span className="text-gray-700 font-extrabold">
            #{booking?.Booking_code || params?.bookingId}
          </span>
        </div>
      </div>

      <section className="max-w-[1604px] mx-auto px-4 py-10">
        <BookingAccountShell active="history">
          <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-6 text-sm text-gray-600">Đang tải dữ liệu lịch hẹn...</div>
            ) : null}

            {error ? (
              <div className="p-6">
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              </div>
            ) : null}

            {!loading && !error && !booking ? (
              <div className="p-6">
                <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-600">
                  Không tìm thấy lịch hẹn.
                </div>
              </div>
            ) : null}

            {!loading && !error && booking ? (
              <>
                <div className="p-6 border-b border-gray-100">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-extrabold text-[#003366]">
                          Chi tiết lịch hẹn{" "}
                          <span className="text-gray-900">#{booking.Booking_code}</span>
                        </h3>
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${statusInfo.className}`}
                        >
                          <i className={`fa-solid ${statusInfo.icon}`}></i>
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-2">
                          <i className="fa-solid fa-calendar text-gray-400"></i>
                          Lịch hẹn:{" "}
                          <span className="font-semibold text-gray-800">
                            {formatDateTime(booking.Start_time)}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <i className="fa-solid fa-clock text-gray-400"></i>
                          Tổng thời lượng:{" "}
                          <span className="font-semibold text-gray-800">
                            {Number(booking.Duration_minutes || 0)} phút
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {canShowCancelButton && (
                        <button
                          onClick={handleCancelClick}
                          className="inline-flex items-center justify-center rounded-xl bg-red-50 text-red-600 px-4 py-2 text-sm font-bold hover:bg-red-100 transition"
                        >
                          <i className="fa-solid fa-ban mr-2"></i>
                          Hủy lịch hẹn
                        </button>
                      )}
                      <Link
                        href="/lichsudatlich"
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
                      >
                        <i className="fa-solid fa-arrow-left mr-2"></i>
                        Quay lại
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 space-y-6">
                      <div className="border border-gray-200 rounded-2xl p-5">
                        <h4 className="font-extrabold text-[#003366] flex items-center gap-2">
                          <i className="fa-solid fa-list-check text-[#33B1FA]"></i>
                          Dịch vụ đã đặt
                        </h4>

                        <div className="mt-4 space-y-3">
                          {booking.items.map((item) => (
                            <div
                              key={item.Id_Booking_detail}
                              className="rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                            >
                              <div className="flex-1">
                                <p className="font-bold text-gray-900">{item.Name}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Loại: {item.Item_type === "combo" ? "Combo" : "Dịch vụ"} | Thời lượng:{" "}
                                  {formatDuration(item.Duration_time)}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <p className="font-extrabold text-[#8b1e1e] tabular-nums">
                                  {formatMoney(item.Price_at_booking)}
                                </p>
                                {booking.Status === "completed" && (
                                  <button
                                    onClick={() => handleRateClick(item)}
                                    className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-amber-400 text-amber-600 hover:bg-amber-50 transition flex items-center gap-1"
                                  >
                                    <i className={`${item.Rating ? 'fa-solid' : 'fa-regular'} fa-star`}></i>
                                    {item.Rating ? `Đã đánh giá (${item.Rating} sao)` : "Đánh giá dịch vụ"}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                      <div className="lg:sticky lg:top-24 space-y-6">
                        <div className="border border-gray-200 rounded-2xl p-5">
                          <h4 className="font-extrabold text-[#003366] flex items-center gap-2">
                            <i className="fa-solid fa-store text-[#33B1FA]"></i>
                            Thông tin salon
                          </h4>
                          <div className="mt-3 text-sm text-gray-700 space-y-1">
                            <p className="font-extrabold text-gray-900">
                              {booking.Store_name || "Đang cập nhật"}
                            </p>
                            <p>
                              {[
                                booking.Store_address,
                                booking.Store_ward,
                                booking.Store_province,
                              ]
                                .filter(Boolean)
                                .join(", ") || "Đang cập nhật địa chỉ"}
                            </p>
                            <p>{booking.Store_phone || "Đang cập nhật số điện thoại"}</p>
                          </div>
                        </div>

                        <div className="border border-gray-200 rounded-2xl p-5">
                          <h4 className="font-extrabold text-[#003366] flex items-center gap-2">
                            <i className="fa-solid fa-user-tie text-[#33B1FA]"></i>
                            Stylist phụ trách
                          </h4>
                          <div className="mt-3 text-sm text-gray-700 space-y-1">
                            <p className="font-semibold text-gray-900">
                              {booking.Stylist_name || "Đang cập nhật"}
                            </p>
                            <p>{booking.Stylist_phone || "Đang cập nhật số điện thoại"}</p>
                          </div>
                        </div>

                        <div className="border border-gray-200 rounded-2xl p-5">
                          <h4 className="font-extrabold text-[#003366] flex items-center gap-2">
                            <i className="fa-solid fa-wallet text-[#33B1FA]"></i>
                            Tổng thanh toán
                          </h4>
                          <div className="mt-3 text-sm text-gray-700 space-y-2">
                            <div className="flex items-center justify-between">
                              <span>Ngày tạo</span>
                              <span className="font-semibold text-gray-900">
                                {formatDateTime(booking.Created_booking)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Tổng dịch vụ</span>
                              <span className="font-semibold text-gray-900">
                                {booking.items.length}
                              </span>
                            </div>
                            <div className="h-px bg-gray-200"></div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-800">Tổng tiền</span>
                              <span className="font-extrabold text-[#8b1e1e] text-lg tabular-nums">
                                {formatMoney(booking.Total_price)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {booking.Note ? (
                          <div className="border border-gray-200 rounded-2xl p-5">
                            <h4 className="font-extrabold text-[#003366] flex items-center gap-2">
                              <i className="fa-solid fa-note-sticky text-[#33B1FA]"></i>
                              Ghi chú
                            </h4>
                            <p className="mt-3 text-sm text-gray-700">{booking.Note}</p>
                          </div>
                        ) : null}

                        {booking.Status === "cancelled" && booking.Description_cancel && (
                          <div className="border border-red-200 rounded-2xl p-5 bg-red-50/50 mt-6">
                            <h4 className="font-extrabold text-red-700 flex items-center gap-2">
                              <i className="fa-solid fa-circle-info text-red-500"></i>
                              Lý do huỷ
                            </h4>
                            <p className="mt-3 text-sm text-red-800">{booking.Description_cancel}</p>
                          </div>
                        )}

                        {booking.resultImages && booking.resultImages.length > 0 && (
                          <div className="border border-gray-200 rounded-2xl p-5 mt-6">
                            <h4 className="font-extrabold text-[#003366] flex items-center gap-2">
                              <i className="fa-solid fa-images text-[#33B1FA]"></i>
                              Hình ảnh kết quả dịch vụ
                            </h4>
                            <div className="grid grid-cols-2 gap-3 mt-4">
                              {booking.resultImages.map((img, idx) => {
                                const imgSrc = img.startsWith('http') || img.startsWith('blob') || img.startsWith('data')
                                  ? img
                                  : `http://localhost:5001${img.startsWith('/') ? '' : '/'}${img}`;
                                return (
                                  <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50 relative group">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={imgSrc}
                                      alt={`Hình ảnh kết quả ${idx + 1}`}
                                      className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
                                      onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400?text=L%E1%BB%97i+%E1%BA%A3nh'; }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </BookingAccountShell>
      </section>

      {/* CANCEL MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-[#0F172A] text-lg mb-2">Hủy lịch hẹn</h3>
            <p className="text-sm text-slate-500 mb-4">
              Vui lòng cho 25Zone biết lý do huỷ lịch của bạn:
            </p>

            <textarea
              className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none mb-2 ${cancelErrorStr ? "border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500 bg-slate-50"
                }`}
              rows={3}
              placeholder="Nhập lý do huỷ..."
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value);
                if (e.target.value.trim()) setCancelErrorStr("");
              }}
            />
            {cancelErrorStr && (
              <p className="text-red-500 text-xs mb-4">{cancelErrorStr}</p>
            )}

            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                  setCancelErrorStr("");
                }}
                disabled={canceling}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Trở lại
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={canceling}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
              >
                {canceling ? "Đang xử lý..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* HOTLINE MODAL */}
      {showHotlineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-4">
              <div className="mx-auto flex flex-col items-center justify-center h-16 w-16 rounded-full bg-orange-50 text-orange-500 mb-4">
                <i className="fa-solid fa-phone-volume text-2xl"></i>
              </div>
              <h3 className="font-bold text-[#0F172A] text-lg mb-2">Liên hệ hỗ trợ</h3>
              <p className="text-sm text-slate-500">
                Chỉ còn chưa đầy 15 phút là đến giờ hẹn hoặc giờ hẹn đã bắt đầu. Để huỷ lịch, vui lòng gọi điện thoại theo hotline <strong className="text-orange-600 text-base">1900.27.27.03</strong> để được nhân viên hỗ trợ huỷ lịch.
              </p>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={() => setShowHotlineModal(false)}
                className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 transition shadow-md shadow-orange-500/20"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
      {/* RATING MODAL */}
      {ratingModalOpen && ratingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="font-bold text-[#0F172A] text-lg mb-2">Đánh giá dịch vụ</h3>
            <p className="font-semibold text-gray-900 mb-4">{ratingItem.Name}</p>
            <p className="text-sm text-slate-500 mb-4">
              Vui lòng chọn số sao để đánh giá trải nghiệm dịch vụ của bạn (1 - 5 sao):
            </p>

            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRatingValue(star)}
                  className="text-3xl focus:outline-none transition hover:scale-110"
                >
                  <i className={`${star <= ratingValue ? 'fa-solid text-amber-400' : 'fa-regular text-gray-300'} fa-star`}></i>
                </button>
              ))}
            </div>

            <textarea
              className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none mb-4 ${ratingError ? "border-red-500 bg-red-50" : "border-slate-200 focus:border-blue-500 bg-slate-50"
                }`}
              rows={3}
              placeholder="Chia sẻ trải nghiệm của bạn (không bắt buộc)..."
              value={ratingDescription}
              onChange={(e) => setRatingDescription(e.target.value)}
            />

            {ratingError && (
              <p className="text-red-500 text-xs mb-4 text-center">{ratingError}</p>
            )}

            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => {
                  setRatingModalOpen(false);
                  setRatingItem(null);
                }}
                disabled={submittingRating}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Trở lại
              </button>
              <button
                onClick={submitRating}
                disabled={submittingRating}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#003366] hover:bg-[#002244] transition disabled:opacity-50"
              >
                {submittingRating ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
