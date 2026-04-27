"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { API_BASE, authorizedAdminFetch, clearAdminSession, getAdminStoreId } from "@/app/lib/admin-auth";

type DashboardView = "products" | "services";
type DashboardGranularity = "day" | "month" | "year";

type DashboardPayload = {
  filters: {
    view: DashboardView;
    granularity: DashboardGranularity;
    date: string;
    rangeLabel: string;
    comparisonLabel: string;
    updatedAt: string;
  };
  summary: {
    revenue: number;
    previousRevenue: number;
    changePct: number | null;
    transactions: number;
    units: number;
    pending: number;
    completed: number;
    cancelled: number;
    averageValue: number;
  };
  chart: {
    labels: string[];
    values: number[];
  };
  ranking: Array<{
    id: number | string;
    name: string;
    category: string;
    quantity: number;
    revenue: number;
    stock: number | null;
  }>;
  promotion: {
    totalActive: number;
    onSale: number;
    regularPrice: number;
    percentage: number;
  } | null;
  lowStock: Array<{
    id: number;
    name: string;
    category: string;
    quantity: number;
  }>;
  bookings: Array<{
    id: number;
    bookingDate: string;
    startTime: string;
    status: "pending" | "confirmed" | "processing" | "completed" | "cancelled";
    customerName: string;
    storeName: string;
    servicesPreview: string;
  }>;
};

const dashboardCopy: Record<
  DashboardView,
  {
    tabLabel: string;
    summaryRevenue: string;
    summaryTransactions: string;
    summaryUnits: string;
    chartTitle: string;
    chartSubtitle: string;
    rankingTitle: string;
    rankingSubtitle: string;
    rankingQuantityLabel: string;
  }
> = {
  products: {
    tabLabel: "Thống kê sản phẩm",
    summaryRevenue: "Doanh thu sản phẩm",
    summaryTransactions: "Đơn hàng phát sinh",
    summaryUnits: "Sản phẩm bán ra",
    chartTitle: "Doanh thu bán hàng",
    chartSubtitle: "Theo dõi doanh thu thực tế từ đơn hàng theo mốc thời gian bạn chọn.",
    rankingTitle: "Sản phẩm bán chạy",
    rankingSubtitle: "Tập trung vào mặt hàng đang kéo doanh thu tốt nhất.",
    rankingQuantityLabel: "SL bán",
  },
  services: {
    tabLabel: "Thống kê dịch vụ",
    summaryRevenue: "Doanh thu dịch vụ",
    summaryTransactions: "Lịch hẹn phát sinh",
    summaryUnits: "Lượt phục vụ",
    chartTitle: "Doanh thu dịch vụ",
    chartSubtitle: "Nhìn nhanh hiệu quả lịch hẹn và sức bán của các dịch vụ chủ lực.",
    rankingTitle: "Dịch vụ bán chạy",
    rankingSubtitle: "Danh sách dịch vụ hoặc combo đang tạo nhiều lượt đặt nhất.",
    rankingQuantityLabel: "Lượt",
  },
};

const BOOKING_SOON_THRESHOLD_MINUTES = 90;

const formatMoney = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatCompactMoney = (value: number) => {
  const amount = Number(value || 0);
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(amount >= 10_000_000_000 ? 0 : 1)} tỷ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 0 : 1)} tr`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(amount >= 10_000 ? 0 : 1)}k`;
  return formatNumber(amount);
};

const formatPercent = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(Math.abs(value));

const clampPercentage = (value: number) => Math.max(0, Math.min(100, Number(value || 0)));

const toLocalDateValue = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

const defaultDateValue = (granularity: DashboardGranularity) => {
  const today = toLocalDateValue();
  if (granularity === "year") return today.slice(0, 4);
  if (granularity === "month") return today.slice(0, 7);
  return today;
};

const normalizeDateValue = (value: string, granularity: DashboardGranularity) => {
  const source = String(value || "").trim();

  if (granularity === "year") {
    if (/^\d{4}$/.test(source)) return source;
    if (/^\d{4}-\d{2}/.test(source)) return source.slice(0, 4);
    return defaultDateValue("year");
  }

  if (granularity === "month") {
    if (/^\d{4}-\d{2}$/.test(source)) return source;
    if (/^\d{4}-\d{2}-\d{2}$/.test(source)) return source.slice(0, 7);
    if (/^\d{4}$/.test(source)) return `${source}-01`;
    return defaultDateValue("month");
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(source)) return source;
  if (/^\d{4}-\d{2}$/.test(source)) return `${source}-01`;
  if (/^\d{4}$/.test(source)) return `${source}-01-01`;
  return defaultDateValue("day");
};

const formatBookingSchedule = (bookingDate: string, startTime: string) => {
  const dateSource = startTime || bookingDate;
  const parsedDate = dateSource ? new Date(String(dateSource).replace(" ", "T")) : new Date(bookingDate);
  const dateLabel = Number.isNaN(parsedDate.getTime())
    ? bookingDate
    : parsedDate.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

  let timeLabel = "";
  if (startTime) {
    const timeSource = String(startTime);
    if (timeSource.includes("T") || timeSource.includes(" ")) {
      const parsedTime = new Date(timeSource.replace(" ", "T"));
      if (!Number.isNaN(parsedTime.getTime())) {
        timeLabel = parsedTime.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } else if (timeSource.includes(":")) {
      timeLabel = timeSource.slice(0, 5);
    }
  }

  return timeLabel ? `${timeLabel} • ${dateLabel}` : dateLabel;
};

const getBookingStartDate = (bookingDate: string, startTime: string) => {
  const timeSource = String(startTime || "").trim();

  if (timeSource) {
    if (timeSource.includes("T") || timeSource.includes(" ")) {
      const parsed = new Date(timeSource.replace(" ", "T"));
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    if (timeSource.includes(":")) {
      const [hour = "00", minute = "00"] = timeSource.split(":");
      const parsed = new Date(
        `${String(bookingDate).slice(0, 10)}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00`,
      );
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  const fallback = new Date(`${String(bookingDate).slice(0, 10)}T00:00:00`);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const getBookingScheduleTone = (bookingDate: string, startTime: string) => {
  const bookingStart = getBookingStartDate(bookingDate, startTime);

  if (!bookingStart) {
    return { tone: "text-slate-500" };
  }

  const diffMinutes = Math.round((bookingStart.getTime() - Date.now()) / 60_000);

  if (diffMinutes < 0) {
    return { tone: "text-rose-600" };
  }

  if (diffMinutes <= BOOKING_SOON_THRESHOLD_MINUTES) {
    return { tone: "text-emerald-600" };
  }

  return { tone: "text-slate-500" };
};

const getStockSeverity = (quantity: number) => {
  if (quantity <= 5) {
    return {
      label: "Rất thấp",
      tone: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
    };
  }

  if (quantity <= 10) {
    return {
      label: "Cần nhập",
      tone: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
    };
  }

  return {
    label: "Theo dõi",
    tone: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
  };
};

export default function AdminDashboardPage() {
  const adminStoreId = getAdminStoreId();
  const isAdminTong = adminStoreId === 0 || adminStoreId === null || Number.isNaN(adminStoreId);

  const [view, setView] = useState<DashboardView>(isAdminTong ? "products" : "services");
  const [granularity, setGranularity] = useState<DashboardGranularity>("month");
  const [selectedDate, setSelectedDate] = useState(() => defaultDateValue("month"));
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingActionId, setBookingActionId] = useState<number | null>(null);
  const [bookingActionError, setBookingActionError] = useState("");
const [selectedBooking, setSelectedBooking] = useState<any>(null);
const [showDetailModal, setShowDetailModal] = useState(false);
const [pendingAction, setPendingAction] = useState<{
  bookingId: number;
  newStatus: "confirmed" | "cancelled";
} | null>(null);

const [cancelReason, setCancelReason] = useState("");
const [cancelError, setCancelError] = useState("");
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const authorizedFetch = useCallback(
    async (input: string, init: RequestInit = {}) =>
      authorizedAdminFetch(input, init, () => {
        clearAdminSession();
        if (typeof window !== "undefined") {
          window.location.href = "/admin/login";
        }
      }),
    []
  );

const handleUpdateStatus = async (
  bookingId: number,
  newStatus: "confirmed" | "cancelled",
  description_cancel?: string
) => {
  try {
    setBookingActionError("");

    const res = await authorizedFetch(`${API_BASE}/api/datlich/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: newStatus,
        description_cancel: description_cancel || null,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || "Cập nhật thất bại");
    }

    // cập nhật dashboard
    setDashboard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        bookings: prev.bookings.filter((b) => b.id !== bookingId),
      };
    });

  } catch (err) {
    setBookingActionError(
      err instanceof Error ? err.message : "Lỗi cập nhật"
    );
  }
};

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const query = new URLSearchParams({
          view,
          granularity,
          date: normalizeDateValue(selectedDate, granularity),
        });
        if (!isAdminTong) {
          query.append("storeId", String(adminStoreId));
        }

        const response = await authorizedFetch(`${API_BASE}/api/admin/dashboard?${query.toString()}`, {
          cache: "no-store",
        });

        const payload = (await response.json()) as DashboardPayload & { message?: string };
        if (!response.ok) {
          throw new Error(payload?.message || "Không thể tải dữ liệu dashboard.");
        }

        if (!active) return;
        setDashboard(payload);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi tải dashboard.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [authorizedFetch, granularity, selectedDate, view]);

  useEffect(() => {
    const canvas = chartCanvasRef.current;
    if (!canvas || !dashboard) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const strokeColor = view === "products" ? "#0EA5E9" : "#10B981";
    const gradient = context.createLinearGradient(0, 0, 0, 340);
    gradient.addColorStop(0, view === "products" ? "rgba(14, 165, 233, 0.24)" : "rgba(16, 185, 129, 0.22)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    chartInstanceRef.current?.destroy();
    chartInstanceRef.current = new Chart(context, {
      type: "line",
      data: {
        labels: dashboard.chart.labels,
        datasets: [
          {
            data: dashboard.chart.values,
            borderColor: strokeColor,
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointRadius: dashboard.chart.values.length > 18 ? 0 : 3,
            pointHoverRadius: 5,
            pointBackgroundColor: "#ffffff",
            pointBorderColor: strokeColor,
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: "index",
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            padding: 12,
            backgroundColor: "#0F172A",
            callbacks: {
              label: (context) => ` ${formatMoney(Number(context.parsed.y || 0))}`,
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: "#64748B",
              font: {
                size: 11,
              },
              maxRotation: 0,
            },
            border: {
              display: false,
            },
          },
          y: {
            grid: {
              color: "#E2E8F0",
            },
            ticks: {
              color: "#94A3B8",
              font: {
                size: 11,
              },
              callback: (value) => formatCompactMoney(Number(value || 0)),
            },
            border: {
              display: false,
            },
          },
        },
      },
    });

    return () => {
      chartInstanceRef.current?.destroy();
      chartInstanceRef.current = null;
    };
  }, [dashboard, view]);

  const content = dashboardCopy[view];
  const normalizedDate = normalizeDateValue(selectedDate, granularity);
  const promotionStats = dashboard?.promotion ?? {
    totalActive: 0,
    onSale: 0,
    regularPrice: 0,
    percentage: 0,
  };
  const promotionPercentage = clampPercentage(promotionStats.percentage);

  const summaryCards = useMemo(() => {
    if (!dashboard) return [];

    const changeText =
      dashboard.summary.changePct === null
        ? `Chưa có mốc ${dashboard.filters.comparisonLabel.toLowerCase()} để so sánh`
        : `${dashboard.summary.changePct >= 0 ? "+" : "-"}${formatPercent(dashboard.summary.changePct)}% so với ${dashboard.filters.comparisonLabel.toLowerCase()}`;

    return [
      {
        key: "revenue",
        label: content.summaryRevenue,
        value: formatMoney(dashboard.summary.revenue),
        secondary: changeText,
      },
      {
        key: "transactions",
        label: content.summaryTransactions,
        value: formatNumber(dashboard.summary.transactions),
        secondary: `Hoàn tất: ${formatNumber(dashboard.summary.completed)}`,
      },
      {
        key: "units",
        label: content.summaryUnits,
        value: formatNumber(dashboard.summary.units),
        secondary: `Giá trị TB: ${formatMoney(dashboard.summary.averageValue)}`,
      },
      {
        key: "pending",
        label: "Cần xử lý",
        value: formatNumber(dashboard.summary.pending),
        secondary: `Đã hủy: ${formatNumber(dashboard.summary.cancelled)}`,
      },
    ];
  }, [content.summaryRevenue, content.summaryTransactions, content.summaryUnits, dashboard]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, index) => String(currentYear - 4 + index));
  }, []);

  const filterControl = useMemo(() => {
    if (granularity === "year") {
      return (
        <select
          value={normalizeDateValue(selectedDate, "year")}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-[#0B3C6D] focus:ring-2 focus:ring-[#0B3C6D]/15"
          disabled={loading}
        >
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              Năm {year}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={granularity === "month" ? "month" : "date"}
        value={normalizeDateValue(selectedDate, granularity)}
        onChange={(event) => setSelectedDate(event.target.value)}
        className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-[#0B3C6D] focus:ring-2 focus:ring-[#0B3C6D]/15"
        disabled={loading}
      />
    );
  }, [granularity, loading, selectedDate, yearOptions]);

  const rankingSection = (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_50px_-34px_rgba(15,23,42,0.34)]">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
        <p className="text-lg font-semibold text-slate-900">{content.rankingTitle}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{content.rankingSubtitle}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-5 py-4 sm:px-6">STT</th>
              <th className="px-5 py-4 sm:px-6">Tên</th>
              <th className="px-5 py-4 text-right sm:px-6">{content.rankingQuantityLabel}</th>
              <th className="px-5 py-4 text-right sm:px-6">Doanh thu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dashboard?.ranking.length ? (
              dashboard.ranking.map((item, index) => (
                <tr key={`${item.id}-${index}`} className="align-top">
                  <td className="px-5 py-4 font-semibold text-slate-400 sm:px-6">{index + 1}</td>
                  <td className="px-5 py-4 sm:px-6">
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.category || "Chưa phân loại"}
                      {view === "products" && item.stock !== null ? ` • Tồn hiện tại: ${formatNumber(item.stock)}` : ""}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-slate-700 sm:px-6">
                    {formatNumber(item.quantity)}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-slate-900 sm:px-6">
                    {formatMoney(item.revenue)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-500 sm:px-6">
                  Chưa có dữ liệu phát sinh trong mốc thời gian này.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const promotionSection = (
    <section className="h-full rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_50px_-34px_rgba(15,23,42,0.34)] sm:p-6">
      <div className="flex h-full flex-col gap-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-900">Thống kê Khuyến mãi</p>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
              Tỷ lệ sản phẩm đang chạy chương trình khuyến mãi trên toàn bộ danh mục đang bán.
            </p>
          </div>
          <span className="inline-flex w-fit shrink-0 whitespace-nowrap rounded-full bg-[#2EB2FF]/12 px-3 py-1 text-xs font-semibold leading-none text-[#2EB2FF]">
            Dữ liệu đang bán hiện tại
          </span>
        </div>

        <div className="grid flex-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
          <div className="rounded-[26px] border border-[#2EB2FF]/20 bg-[linear-gradient(180deg,#F3FBFF_0%,#FFFFFF_100%)] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex w-fit shrink-0 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-semibold leading-none text-slate-600 shadow-sm">
                Tổng đang bán: {formatNumber(promotionStats.totalActive)} SP
              </span>
              <span className="shrink-0 whitespace-nowrap text-xs font-medium uppercase tracking-[0.16em] text-slate-400 sm:text-right">
                Tỷ lệ đang giảm giá
              </span>
            </div>

            <div className="mx-auto mt-7 flex w-full max-w-[320px] justify-center">
              <div className="relative w-full">
                <svg viewBox="0 0 120 76" className="w-full">
                  <path
                    d="M 16 60 A 44 44 0 0 1 104 60"
                    pathLength={100}
                    fill="none"
                    stroke="#DDEAF3"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 16 60 A 44 44 0 0 1 104 60"
                    pathLength={100}
                    fill="none"
                    stroke="#2EB2FF"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${promotionPercentage} 100`}
                  />
                </svg>

                <div className="absolute inset-x-0 bottom-1 text-center">
                  <p className="text-4xl font-bold tracking-tight text-[#2EB2FF]">
                    {formatPercent(promotionPercentage)}%
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Đang khuyến mãi
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm">
              Tập trung vào nhóm sản phẩm đang được đẩy bán để theo dõi hiệu quả giá và ưu tiên tồn kho.
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[22px] border border-[#2EB2FF]/15 bg-[#F7FCFF] px-4 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Đang khuyến mãi
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[#2EB2FF]">
                {formatNumber(promotionStats.onSale)} SP
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {promotionStats.totalActive > 0
                  ? `${formatPercent(promotionPercentage)}% danh mục đang bán`
                  : "Chưa có sản phẩm đang hoạt động"}
              </p>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Giá gốc</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {formatNumber(promotionStats.regularPrice)} SP
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Nhóm sản phẩm chưa áp dụng giá bán ưu đãi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const lowStockSection = (
    <section className="h-full rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_50px_-34px_rgba(15,23,42,0.34)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">Cảnh báo tồn kho</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Danh sách ưu tiên nhập hàng để tránh hụt doanh thu do thiếu sản phẩm.
          </p>
        </div>
        <span className="inline-flex w-fit shrink-0 whitespace-nowrap rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold leading-none text-rose-700">
          {dashboard ? `${dashboard.lowStock.length} mục cần chú ý` : "Đang tải"}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {dashboard?.lowStock.length ? (
          dashboard.lowStock.map((item) => {
            const severity = getStockSeverity(item.quantity);
            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-800">{item.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.category || "Chưa phân loại"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Tồn kho</p>
                    <p className="text-lg font-bold text-slate-900">{formatNumber(item.quantity)}</p>
                  </div>
                  <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold leading-none ${severity.tone}`}>
                    {severity.label}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            Tồn kho đang ổn, chưa có sản phẩm nào chạm ngưỡng cảnh báo.
          </div>
        )}
      </div>
    </section>
  );

  const bookingSection = (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_50px_-34px_rgba(15,23,42,0.34)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">Lịch hẹn cần xử lý</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Theo dõi nhanh các lịch đang chờ xử lý để xác nhận hoặc hủy ngay trên dashboard.
          </p>
        </div>
        <span className="inline-flex w-fit shrink-0 whitespace-nowrap rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold leading-none text-sky-700">
          {dashboard ? `${dashboard.bookings.length} lịch cần xử lý` : "Đang tải"}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {bookingActionError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {bookingActionError}
          </div>
        ) : null}

        {dashboard?.bookings.length ? (
          dashboard.bookings.map((booking) => {
            const scheduleTone = getBookingScheduleTone(booking.bookingDate, booking.startTime);
            const isActing = bookingActionId === booking.id;

            return (
              <div key={booking.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{booking.customerName || "Khách chưa cập nhật tên"}</p>
                    <p className="mt-1 text-sm text-slate-500">{booking.servicesPreview || "Chưa có dịch vụ đi kèm"}</p>
                    <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                      {booking.storeName || "Chưa gán chi nhánh"}
                    </p>
                    <p className={`mt-1 text-sm font-semibold ${scheduleTone.tone}`}>
                      {formatBookingSchedule(booking.bookingDate, booking.startTime)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
  setSelectedBooking(booking);
  setPendingAction({
    bookingId: booking.id,
    newStatus: "confirmed",
  });
  setShowDetailModal(true);
}}
                      disabled={isActing}
                      title="Xác nhận lịch hẹn"
                      aria-label="Xác nhận lịch hẹn"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                        <path
                          d="M5 10.5L8.25 13.75L15 7"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
  setSelectedBooking(booking);
  setPendingAction({
    bookingId: booking.id,
    newStatus: "cancelled",
  });
  setCancelReason("");
  setCancelError("");
  setShowDetailModal(true);
}}
                      disabled={isActing}
                      title="Hủy lịch hẹn"
                      aria-label="Hủy lịch hẹn"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                        <path
                          d="M6 6L14 14"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14 6L6 14"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            Chưa có lịch hẹn nào đang chờ xử lý.
          </div>
        )}
      </div>
    </section>
  );

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tổng Quan Hoạt Động</h1>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {(isAdminTong ? (["products", "services"] as DashboardView[]) : (["services"] as DashboardView[])).map((tab) => {
            const isActive = tab === view;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setView(tab)}
                className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#0B3C6D] text-white shadow-lg shadow-[#0B3C6D]/20"
                    : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:text-[#0B3C6D] hover:ring-[#0B3C6D]/25"
                }`}
              >
                {dashboardCopy[tab].tabLabel}
              </button>
            );
          })}
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <section
              key={card.key}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.32)]"
            >
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{card.value}</p>
              <p className="mt-3 text-xs leading-5 text-slate-500">{card.secondary}</p>
            </section>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,1fr)]">
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_50px_-34px_rgba(15,23,42,0.34)]">
            <div className="flex flex-col gap-5 border-b border-slate-100 px-5 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-900">{content.chartTitle}</p>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{content.chartSubtitle}</p>
                <p className="mt-3 inline-flex w-fit shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold leading-none text-slate-600">
                  {dashboard?.filters.rangeLabel || normalizedDate}
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: "day", label: "Ngày" },
                    { key: "month", label: "Tháng" },
                    { key: "year", label: "Năm" },
                  ] as { key: DashboardGranularity; label: string }[]).map((item) => {
                    const isActive = item.key === granularity;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setGranularity(item.key);
                          setSelectedDate((current) => normalizeDateValue(current, item.key));
                        }}
                        disabled={loading}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                          isActive
                            ? "bg-[#0B3C6D] text-white"
                            : "bg-[#0B3C6D]/10 text-[#0B3C6D] hover:bg-[#0B3C6D]/15"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {filterControl}
                  <div className="min-w-[220px] rounded-2xl bg-slate-50 px-4 py-3 text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Doanh thu hiện tại</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                      {dashboard ? formatMoney(dashboard.summary.revenue) : "--"}
                    </p>
                    <p
                      className={`mt-1 text-xs font-medium ${
                        dashboard?.summary.changePct === null
                          ? "text-slate-500"
                          : (dashboard?.summary.changePct ?? 0) >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                      }`}
                    >
                      {dashboard
                        ? dashboard.summary.changePct === null
                          ? "Mới phát sinh doanh thu trong kỳ này"
                          : `${dashboard.summary.changePct >= 0 ? "+" : "-"}${formatPercent(dashboard.summary.changePct)}%`
                        : "Đang tính toán"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-[340px] px-4 py-4 sm:px-6 sm:py-6">
              <canvas ref={chartCanvasRef} className="h-full w-full" />
            </div>
          </section>

          {view === "services" ? bookingSection : rankingSection}
        </div>

        {view === "products" ? (
          <div className="mt-6 grid items-stretch gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
            {promotionSection}
            {lowStockSection}
          </div>
        ) : (
          <div className="mt-6">{rankingSection}</div>
        )}
      </div>
{showDetailModal && selectedBooking && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-[#F8FAFC] px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-[#0F172A] text-lg">Chi tiết lịch hẹn</h3>
        <button 
          onClick={() => setShowDetailModal(false)}
          className="text-slate-400 hover:text-slate-600 transition w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200"
        >
          ✕
        </button>
      </div>

      {/* BODY */}
      <div className="p-6 space-y-5">
        
        {/* KHÁCH + STATUS */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Khách hàng</p>
            <p className="font-semibold text-[#1E293B]">
              {selectedBooking.customerName || "Khách vãng lai"}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">Trạng thái</p>
            <span className={`px-2 py-1 font-bold rounded text-xs inline-block border ${
              selectedBooking.status === "pending"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : selectedBooking.status === "confirmed"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : selectedBooking.status === "completed"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              {selectedBooking.status}
            </span>
          </div>
        </div>

        {/* CHI NHÁNH */}
        <div className="border-t border-slate-100 pt-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Chi nhánh</p>
            <p className="font-medium text-[#334155]">
              {selectedBooking.storeName || "Chưa có"}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">Thời gian</p>
            <p className="font-medium text-[#334155]">
              {formatBookingSchedule(
                selectedBooking.bookingDate,
                selectedBooking.startTime
              )}
            </p>
          </div>
        </div>

        {/* DỊCH VỤ */}
        <div className="border-t border-slate-100 pt-5">
          <p className="text-xs text-slate-500 mb-2">Dịch vụ đã chọn</p>

          <div className="flex flex-wrap gap-2">
            {selectedBooking.servicesPreview ? (
              selectedBooking.servicesPreview.split(",").map((sv: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100"
                >
                  {sv.trim()}
                </span>
              ))
            ) : (
              <span className="text-slate-400 italic text-sm">
                Không có dịch vụ
              </span>
            )}
          </div>
        </div>

        {/* MODE HUỶ */}
        {pendingAction?.newStatus === "cancelled" ? (
          <div className="border-t border-slate-100 pt-5">
            <p className="text-xs text-slate-500 mb-2">Lý do huỷ *</p>

            <textarea
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${
                cancelError
                  ? "border-red-500"
                  : "border-slate-200 focus:border-blue-500"
              }`}
              rows={3}
              placeholder="Nhập lý do huỷ lịch..."
              value={cancelReason}
              onChange={(e) => {
                const value = e.target.value;
                setCancelReason(value);

                if (value.trim()) setCancelError("");
              }}
            />

            {cancelError && (
              <p className="text-red-500 text-xs mt-1">
                {cancelError}
              </p>
            )}
          </div>
        ) : (
          selectedBooking.note && (
            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs text-slate-500 mb-1">
                {selectedBooking.status === "cancelled"
                  ? "Lý do huỷ"
                  : "Ghi chú"}
              </p>

              <p
                className={`text-sm p-3 rounded-lg border ${
                  selectedBooking.status === "cancelled"
                    ? "text-red-600 bg-red-50 border-red-100"
                    : "text-[#334155] bg-slate-50 border-slate-100"
                }`}
              >
                {selectedBooking.status === "cancelled"
                  ? selectedBooking.description_cancel
                  : selectedBooking.note}
              </p>
            </div>
          )
        )}
      </div>

      {/* FOOTER */}
      <div className="bg-[#F8FAFC] px-6 py-4 border-t border-slate-100 flex justify-end">
        
        {/* CONFIRM */}
        {pendingAction?.newStatus === "confirmed" && (
          <button
            onClick={async () => {
              await handleUpdateStatus(selectedBooking.id, "confirmed");
              setPendingAction(null);
              setShowDetailModal(false);
            }}
            className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
          >
            Xác nhận lịch
          </button>
        )}

        {/* CANCEL */}
        {pendingAction?.newStatus === "cancelled" && (
          <button
            onClick={async () => {
              if (!cancelReason.trim()) {
                setCancelError("Vui lòng nhập lý do huỷ");
                return;
              }

              await handleUpdateStatus(
                selectedBooking.id,
                "cancelled"
              );

              setCancelReason("");
              setPendingAction(null);
              setShowDetailModal(false);
            }}
            className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
          >
            Xác nhận huỷ
          </button>
        )}

        <button 
          onClick={() => setShowDetailModal(false)}
          className="px-5 ml-2 py-2.5 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition"
        >
          Đóng
        </button>
      </div>
    </div>
  </div>
)}
    </main>
  );
}
