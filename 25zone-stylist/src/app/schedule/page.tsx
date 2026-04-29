"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getCurrentUser, type StylistUser } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

/* ─── Types ─── */
interface WeekShift {
  Id_work_shifts: number;
  Id_user: number;
  Shift_date: string;
  Start_time: string;
  End_time: string;
}

interface HourSlot {
  Id_work_shifts_hour: number;
  Hours: string;
  Status: number; // 1 = available, 0 = booked
}

interface ShiftDetail {
  shift: {
    Id_work_shifts: number;
    Shift_date: string;
    Start_time: string;
    End_time: string;
  };
  hours: HourSlot[];
}

interface Booking {
  id: number;
  booking_date: string;
  start_time: string;
  status: string;
  total_price: number;
  note: string | null;
  customer_name: string;
  customer_phone: string;
  store_name: string;
  service_names: string | null;
  combo_names: string | null;
  total_duration_minutes: number;
}

/* ─── Date helpers ─── */
const WEEKDAY_NAMES = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function formatDateShort(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatTimeHHMM(t: string): string {
  if (!t) return "--:--";
  return t.substring(0, 5);
}

function formatBookingTime(startTime: string): string {
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

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  if (sameMonth) {
    return `${String(monday.getDate()).padStart(2, "0")} - ${String(sunday.getDate()).padStart(2, "0")}/${String(monday.getMonth() + 1).padStart(2, "0")}/${monday.getFullYear()}`;
  }
  return `${formatDateShort(monday)} - ${formatDateShort(sunday)}/${sunday.getFullYear()}`;
}

function getStatusInfo(status: string): { label: string; dot: string } {
  switch (status) {
    case "completed": return { label: "Đã xong", dot: "bg-green-500" };
    case "processing": return { label: "Đang làm", dot: "bg-amber-500" };
    case "confirmed": return { label: "Đã xác nhận", dot: "bg-accent-blue" };
    case "pending": return { label: "Chờ xác nhận", dot: "bg-slate-400" };
    case "cancelled": return { label: "Đã huỷ", dot: "bg-red-500" };
    default: return { label: status, dot: "bg-slate-400" };
  }
}

export default function Schedule() {
  const today = useMemo(() => new Date(), []);
  const [user, setUser] = useState<StylistUser | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(today));
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Data
  const [weekShifts, setWeekShifts] = useState<WeekShift[]>([]);
  const [dayDetail, setDayDetail] = useState<ShiftDetail | null>(null);
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);

  // Loading / error
  const [loadingWeek, setLoadingWeek] = useState(true);
  const [loadingDay, setLoadingDay] = useState(false);
  const [errorWeek, setErrorWeek] = useState("");

  // Week days array
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Init user
  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  // Fetch week shifts
  const fetchWeekShifts = useCallback(async (u: StylistUser, monday: Date) => {
    setLoadingWeek(true);
    setErrorWeek("");
    try {
      const startDate = toDateString(monday);
      const endDate = toDateString(addDays(monday, 6));
      const res = await fetch(`${API_BASE}/lichlamviec/week?startDate=${startDate}&endDate=${endDate}&userId=${u.Id_user}`);
      if (!res.ok) throw new Error("Không thể tải lịch làm việc.");
      const data: WeekShift[] = await res.json();
      setWeekShifts(data);
    } catch (err: unknown) {
      setErrorWeek(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setLoadingWeek(false);
    }
  }, []);

  // Fetch day detail (shift hours + bookings)
  const fetchDayDetail = useCallback(async (u: StylistUser, date: Date) => {
    setLoadingDay(true);
    const dateStr = toDateString(date);
    try {
      const [shiftRes, bookingRes] = await Promise.all([
        fetch(`${API_BASE}/lichlamviec?userId=${u.Id_user}&date=${dateStr}`),
        fetch(`${API_BASE}/datlich?stylistId=${u.Id_user}&date=${dateStr}`),
      ]);

      if (shiftRes.ok) {
        const shiftData = await shiftRes.json();
        setDayDetail(shiftData);
      } else {
        setDayDetail(null);
      }

      if (bookingRes.ok) {
        const bookingData: Booking[] = await bookingRes.json();
        setDayBookings(bookingData);
      } else {
        setDayBookings([]);
      }
    } catch {
      setDayDetail(null);
      setDayBookings([]);
    } finally {
      setLoadingDay(false);
    }
  }, []);

  // Fetch week data when user or weekStart changes
  useEffect(() => {
    if (user) fetchWeekShifts(user, weekStart);
  }, [user, weekStart, fetchWeekShifts]);

  // Fetch day detail when selectedDate changes
  useEffect(() => {
    if (user) fetchDayDetail(user, selectedDate);
  }, [user, selectedDate, fetchDayDetail]);

  // Navigation
  const goToPrevWeek = () => setWeekStart((prev) => addDays(prev, -7));
  const goToNextWeek = () => setWeekStart((prev) => addDays(prev, 7));
  const goToToday = () => {
    const monday = getMonday(today);
    setWeekStart(monday);
    setSelectedDate(today);
  };

  // Find shift for a specific date
  const getShiftForDate = (date: Date): WeekShift | null => {
    const dateStr = toDateString(date);
    return weekShifts.find((s) => {
      const shiftDate = typeof s.Shift_date === "string" ? s.Shift_date.substring(0, 10) : "";
      return shiftDate === dateStr;
    }) || null;
  };

  // Selected date info
  const selectedShift = getShiftForDate(selectedDate);
  const isToday = isSameDay(selectedDate, today);
  const selectedDateStr = `${WEEKDAY_NAMES[selectedDate.getDay()]}, ${String(selectedDate.getDate()).padStart(2, "0")}/${String(selectedDate.getMonth() + 1).padStart(2, "0")}/${selectedDate.getFullYear()}`;

  // Stats for selected day
  const bookedSlots = dayDetail?.hours.filter((h) => h.Status === 0).length || 0;
  const availableSlots = dayDetail?.hours.filter((h) => h.Status === 1).length || 0;
  const activeBookings = dayBookings.filter((b) => b.status !== "cancelled").length;

  return (
    <div className="w-full max-w-5xl mx-auto pt-4 pb-8 md:py-8">

      {/* ─── Week Navigation ─── */}
      <div className="bg-white dark:bg-primary-dark rounded-[2rem] p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-primary/50 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPrevWeek}
            className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-primary/30 hover:bg-slate-100 dark:hover:bg-primary/50 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors border border-slate-200 dark:border-primary"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>

          <div className="text-center">
            <p className="text-lg font-bold text-primary dark:text-white">{formatWeekRange(weekStart)}</p>
            <button
              onClick={goToToday}
              className="text-xs font-bold text-accent-blue hover:underline mt-0.5 transition-colors"
            >
              Về hôm nay
            </button>
          </div>

          <button
            onClick={goToNextWeek}
            className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-primary/30 hover:bg-slate-100 dark:hover:bg-primary/50 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors border border-slate-200 dark:border-primary"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        {/* ─── Week Days Row ─── */}
        {loadingWeek ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-3 border-slate-200 dark:border-slate-700 border-t-accent-blue rounded-full animate-spin"></div>
          </div>
        ) : errorWeek ? (
          <div className="text-center py-4">
            <p className="text-sm text-red-500 font-semibold">{errorWeek}</p>
            <button onClick={() => user && fetchWeekShifts(user, weekStart)} className="text-xs text-accent-blue font-bold mt-2 hover:underline">Thử lại</button>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const shift = getShiftForDate(day);
              const isSelected = isSameDay(day, selectedDate);
              const isDayToday = isSameDay(day, today);
              const hasShift = !!shift;

              return (
                <button
                  key={toDateString(day)}
                  onClick={() => setSelectedDate(day)}
                  className={`relative flex flex-col items-center py-3 sm:py-4 rounded-2xl transition-all duration-300 border-2 cursor-pointer ${
                    isSelected
                      ? "bg-primary dark:bg-accent-blue text-white border-primary dark:border-accent-blue shadow-lg shadow-primary/20 dark:shadow-accent-blue/20 scale-[1.02]"
                      : hasShift
                        ? "bg-white dark:bg-primary/40 border-slate-100 dark:border-primary/60 hover:border-accent-blue/40 dark:hover:border-accent-blue/40 hover:shadow-sm"
                        : "bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-primary/30 hover:border-slate-200 dark:hover:border-primary/50"
                  }`}
                >
                  {/* Today dot */}
                  {isDayToday && !isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-blue animate-pulse"></div>
                  )}

                  <span className={`text-[10px] sm:text-xs font-bold mb-1 ${isSelected ? "text-white/80" : "text-slate-400 dark:text-slate-500"}`}>
                    {WEEKDAY_SHORT[day.getDay()]}
                  </span>

                  <span className={`text-base sm:text-lg font-black ${isSelected ? "text-white" : hasShift ? "text-primary dark:text-white" : "text-slate-300 dark:text-slate-600"}`}>
                    {day.getDate()}
                  </span>

                  {/* Shift indicator */}
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 transition-colors ${
                    isSelected
                      ? "bg-white/60"
                      : hasShift
                        ? "bg-accent-blue"
                        : "bg-transparent"
                  }`}></div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Selected Day Detail ─── */}
      <div className="space-y-5">
        {/* Day Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-primary dark:text-white flex items-center gap-2">
              {selectedDateStr}
              {isToday && (
                <span className="px-2.5 py-0.5 bg-accent-blue/10 text-accent-blue text-xs font-bold rounded-full border border-accent-blue/20">
                  Hôm nay
                </span>
              )}
            </h2>
          </div>
        </div>

        {loadingDay ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="relative">
              <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
              <div className="absolute top-0 left-0 w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-400 dark:text-slate-500 font-medium text-sm">Đang tải chi tiết...</p>
          </div>
        ) : !selectedShift && !dayDetail ? (
          /* ─── No shift ─── */
          <div className="bg-white dark:bg-primary-dark rounded-[2rem] p-10 md:p-14 shadow-sm border border-slate-100 dark:border-primary/50 flex flex-col items-center text-center">
            <div className="w-20 h-20 mb-5 rounded-[1.2rem] bg-slate-50 dark:bg-primary/30 flex items-center justify-center border border-slate-200 dark:border-primary">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-primary dark:text-white mb-1">Không có ca làm việc</h3>
            <p className="text-slate-400 dark:text-slate-500 font-medium text-sm max-w-[280px]">
              Bạn không có lịch làm việc vào ngày này. Liên hệ quản lý nếu cần điều chỉnh.
            </p>
          </div>
        ) : (
          <>
            {/* ─── Shift Info Card ─── */}
            <div className="bg-white dark:bg-primary-dark rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-primary/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-accent-blue/10 dark:bg-accent-blue/20 flex items-center justify-center border border-accent-blue/20 dark:border-accent-blue/30 shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#33B1FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-primary dark:text-white">Ca làm việc</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
                      {dayDetail ? `${formatTimeHHMM(dayDetail.shift.Start_time)} - ${formatTimeHHMM(dayDetail.shift.End_time)}` : selectedShift ? `${formatTimeHHMM(selectedShift.Start_time)} - ${formatTimeHHMM(selectedShift.End_time)}` : "--"}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-3">
                  <div className="px-4 py-2.5 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30 text-center">
                    <p className="text-lg font-black text-green-600 dark:text-green-400">{availableSlots}</p>
                    <p className="text-[10px] font-bold text-green-500/80 uppercase tracking-wider">Trống</p>
                  </div>
                  <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/30 text-center">
                    <p className="text-lg font-black text-amber-600 dark:text-amber-400">{bookedSlots}</p>
                    <p className="text-[10px] font-bold text-amber-500/80 uppercase tracking-wider">Đã đặt</p>
                  </div>
                  <div className="px-4 py-2.5 bg-blue-50 dark:bg-accent-blue/10 rounded-xl border border-blue-100 dark:border-accent-blue/20 text-center">
                    <p className="text-lg font-black text-primary dark:text-accent-blue">{activeBookings}</p>
                    <p className="text-[10px] font-bold text-accent-blue/80 uppercase tracking-wider">Lịch hẹn</p>
                  </div>
                </div>
              </div>

              {/* ─── Time Slots Grid ─── */}
              {dayDetail && dayDetail.hours.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Khung giờ</p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {dayDetail.hours.map((slot) => {
                      const isBooked = slot.Status === 0;
                      const timeStr = formatTimeHHMM(typeof slot.Hours === "string" ? slot.Hours : String(slot.Hours));
                      return (
                        <div
                          key={slot.Id_work_shifts_hour}
                          className={`relative py-2.5 px-1 rounded-xl text-center text-sm font-bold transition-all border ${
                            isBooked
                              ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30"
                              : "bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/20"
                          }`}
                        >
                          {timeStr}
                          <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${isBooked ? "bg-amber-500" : "bg-green-500"}`}></div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-5 mt-3 text-xs font-semibold text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span>Trống</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Đã đặt</span>
                  </div>
                </div>
              )}
            </div>

            {/* ─── Bookings List ─── */}
            <div>
              <h3 className="text-lg font-bold text-primary dark:text-white mb-4 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 2v4" /><path d="M8 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
                </svg>
                Lịch hẹn trong ngày
                {dayBookings.length > 0 && (
                  <span className="text-sm font-bold text-accent-blue">({dayBookings.length})</span>
                )}
              </h3>

              {dayBookings.length === 0 ? (
                <div className="bg-white dark:bg-primary-dark rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-primary/50 text-center">
                  <p className="text-slate-400 dark:text-slate-500 font-medium text-sm">Chưa có lịch hẹn nào trong ngày này.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayBookings.map((bk) => {
                    const statusInfo = getStatusInfo(bk.status);
                    const serviceText = [bk.service_names, bk.combo_names].filter(Boolean).join(", ") || "Dịch vụ";
                    const isCancelled = bk.status === "cancelled";
                    return (
                      <div
                        key={bk.id}
                        className={`bg-white dark:bg-primary-dark rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 dark:border-primary/50 flex items-start gap-4 transition-all hover:shadow-md ${isCancelled ? "opacity-50" : ""}`}
                      >
                        {/* Time */}
                        <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-primary/30 flex flex-col items-center justify-center shrink-0 border border-slate-200 dark:border-primary">
                          <span className="text-sm font-black text-primary dark:text-accent-blue">{formatBookingTime(bk.start_time)}</span>
                          <span className="text-[10px] font-bold text-slate-400">{formatDuration(bk.total_duration_minutes)}</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className={`font-bold text-primary dark:text-white truncate ${isCancelled ? "line-through text-slate-400 dark:text-slate-500" : ""}`}>
                              {bk.customer_name || "Khách hàng"}
                            </h4>
                            <span className="flex items-center gap-1.5 text-xs font-bold shrink-0">
                              <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`}></span>
                              <span className="text-slate-500 dark:text-slate-400">{statusInfo.label}</span>
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">{serviceText}</p>
                          {bk.customer_phone && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">SĐT: {bk.customer_phone}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
