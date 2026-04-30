"use client";

import Link from "next/link";
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
  if (minutes < 60) return `${minutes}p`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}p` : `${h}h`;
}

function getServicePreview(apt: Appointment): string {
  const parts: string[] = [];
  if (apt.service_names) parts.push(apt.service_names);
  if (apt.combo_names) parts.push(apt.combo_names);
  return parts.join(", ") || "Dịch vụ";
}

function getStatusInfo(status: string): { label: string; colorClass: string } {
  switch (status) {
    case "completed":
      return { label: "Đã xong", colorClass: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30" };
    case "processing":
      return { label: "Đang làm", colorClass: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30" };
    case "confirmed":
      return { label: "Đã xác nhận", colorClass: "bg-accent-blue/10 dark:bg-accent-blue/20 text-primary dark:text-accent-blue border-accent-blue/20 dark:border-accent-blue/30" };
    case "pending":
      return { label: "Chờ xác nhận", colorClass: "bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700" };
    case "cancelled":
      return { label: "Đã huỷ", colorClass: "bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border-red-100 dark:border-red-900/30" };
    default:
      return { label: status, colorClass: "bg-slate-50 text-slate-500 border-slate-200" };
  }
}

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isUpcoming(status: string): boolean {
  return ["pending", "confirmed", "processing"].includes(status);
}

export default function Home() {
  const [user, setUser] = useState<StylistUser | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAppointments = useCallback(async (stylistUser: StylistUser) => {
    setLoading(true);
    setError("");
    try {
      const today = getTodayString();
      const res = await fetch(
        `${API_BASE}/datlich?stylistId=${stylistUser.Id_user}&date=${today}`
      );
      if (!res.ok) {
        throw new Error("Không thể tải dữ liệu lịch hẹn.");
      }
      const data: Appointment[] = await res.json();
      setAppointments(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      fetchAppointments(currentUser);
    } else {
      setLoading(false);
    }
  }, [fetchAppointments]);

  const upcomingCount = appointments.filter((a) => isUpcoming(a.status)).length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;

  return (
    <div className="w-full max-w-4xl mx-auto pt-4 pb-8 md:py-8">

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-400 dark:text-slate-500 font-medium text-sm">Đang tải lịch hẹn...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-100 dark:border-red-900/30 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 font-semibold mb-3">{error}</p>
          <button
            onClick={() => user && fetchAppointments(user)}
            className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors text-sm"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && appointments.length === 0 && (
        <div className="bg-white dark:bg-primary-dark rounded-[2.5rem] p-10 md:p-16 shadow-sm border border-slate-100 dark:border-primary/50 flex flex-col items-center text-center">
          <div className="w-24 h-24 mb-6 rounded-[1.5rem] bg-slate-50 dark:bg-primary/30 flex items-center justify-center border border-slate-200 dark:border-primary">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
              <path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" />
              <path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-primary dark:text-white mb-2">Không có ca làm việc</h2>
          <p className="text-slate-400 dark:text-slate-500 font-medium max-w-[300px] leading-relaxed">
            Bạn không có lịch hẹn nào trong ngày hôm nay. Hãy kiểm tra lại lịch làm việc của bạn.
          </p>
          <Link
            href="/schedule"
            className="mt-6 px-6 py-3 bg-primary dark:bg-accent-blue text-white font-bold rounded-xl hover:shadow-md transition-all text-sm"
          >
            Xem lịch làm việc
          </Link>
        </div>
      )}

      {/* Appointments List */}
      {!loading && !error && appointments.length > 0 && (
        <div className="space-y-4">
          {appointments.map((apt) => {
            const statusInfo = getStatusInfo(apt.status);
            const time = formatTime(apt.start_time);
            const duration = formatDuration(apt.total_duration_minutes);
            const service = getServicePreview(apt);
            const isDone = apt.status === "completed";
            const isCancelled = apt.status === "cancelled";

            return (
              <div
                key={apt.id}
                className={`bg-white dark:bg-primary-dark rounded-[2rem] p-5 sm:p-6 shadow-sm border border-slate-100 dark:border-primary hover:shadow-md transition-all flex flex-col sm:flex-row gap-5 sm:gap-6 ${isCancelled ? "opacity-60" : ""}`}
              >
                {/* Time Block */}
                <div
                  className={`w-full sm:w-28 h-20 sm:h-auto sm:min-h-[6rem] rounded-2xl flex flex-col items-center justify-center shrink-0 border ${isDone || isCancelled
                    ? "bg-slate-50 dark:bg-primary/30 border-slate-100 dark:border-primary/50 text-slate-400 dark:text-slate-500"
                    : "bg-blue-50 dark:bg-accent-blue/10 border-blue-100 dark:border-accent-blue/20 text-primary dark:text-accent-blue"
                    }`}
                >
                  <span className="text-2xl font-black tracking-tight">{time}</span>
                  <span className="text-sm font-bold opacity-80">{duration}</span>
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3
                        className={`text-xl font-bold ${isDone || isCancelled
                          ? "text-slate-400 dark:text-slate-500 line-through"
                          : "text-primary dark:text-white"
                          }`}
                      >
                        {apt.customer_name || "Khách hàng"}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                        Dịch vụ: {service}
                      </p>
                      {apt.customer_phone && (
                        <p className="text-slate-400 dark:text-slate-500 text-sm font-medium mt-0.5">
                          SĐT: {apt.customer_phone}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full border shrink-0 ${statusInfo.colorClass}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-primary/50">
                  {isUpcoming(apt.status) ? (
                    <Link
                      href={`/booking/${apt.id}`}
                      className="w-full sm:w-auto px-6 py-3.5 bg-primary dark:bg-accent-blue hover:bg-primary-dark dark:hover:bg-blue-400 text-white font-bold rounded-xl transition-colors shadow-sm text-center"
                    >
                      Chi tiết lịch hẹn
                    </Link>
                  ) : apt.status === "completed" ? (
                    <Link
                      href={`/booking/${apt.id}`}
                      className="w-full sm:w-auto px-6 py-3.5 bg-slate-50 dark:bg-primary hover:bg-slate-100 dark:hover:bg-primary-dark text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors text-center border border-slate-200 dark:border-primary-dark"
                    >
                      Xem chi tiết
                    </Link>
                  ) : apt.status === "cancelled" ? (
                    <Link
                      href={`/booking/${apt.id}`}
                      className="w-full sm:w-auto px-5 py-3 bg-slate-50 dark:bg-primary/30 hover:bg-slate-100 dark:hover:bg-primary/50 text-slate-500 dark:text-slate-400 font-bold rounded-xl transition-colors text-center border border-slate-200 dark:border-primary/50 text-sm"
                    >
                      Xem chi tiết
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
