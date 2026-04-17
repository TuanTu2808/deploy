"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  clearAdminNotifications,
  markAdminNotificationAsRead,
  markAllAdminNotificationsRead,
  pushAdminNotification,
  subscribeAdminNotifications,
  type AdminNotification,
} from "@/app/lib/admin-notifications";

type WindowWithFetchGuard = Window & {
  __adminFetchPatched?: boolean;
  __adminFetchOriginal?: typeof fetch;
};

const mutationMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const formatDatePill = (value: Date) => `Hôm nay, ${value.getDate()} th${value.getMonth() + 1}`;

const formatRelativeTime = (value: number, now: number) => {
  const diffMs = now - value;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "Hôm qua";

  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getMethodLabel = (method: string) => {
  switch (method) {
    case "POST":
      return "Tạo mới";
    case "PUT":
      return "Cập nhật";
    case "PATCH":
      return "Điều chỉnh";
    case "DELETE":
      return "Xóa";
    default:
      return "Thao tác";
  }
};

const getResourceLabel = (url: string) => {
  if (url.includes("/api/admin/users")) return "tài khoản";
  if (url.includes("/api/admin/orders")) return "đơn hàng";
  if (url.includes("/api/chinhanh")) return "chi nhánh";
  if (url.includes("/api/sanpham")) return "sản phẩm";
  if (url.includes("/api/dichvu")) return "dịch vụ";
  if (url.includes("/api/")) return "dữ liệu";
  return "hệ thống";
};

const toUrlText = (input: RequestInfo | URL) => {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
};

const shouldTrack = (url: string, method: string) => {
  if (!mutationMethods.has(method)) return false;
  if (!url.includes("/api/")) return false;
  if (url.includes("/api/auth/login")) return false;
  if (url.includes("/api/auth/refresh-token")) return false;
  if (url.includes("/api/auth/logout")) return false;
  // Bỏ qua các API upload hình ảnh / file để tránh sinh ra thông báo dư thừa
  if (url.includes("/upload")) return false;
  return true;
};

const typeMeta: Record<AdminNotification["type"], { icon: string; badge: string; dot: string }> = {
  success: {
    icon: "fa-circle-check",
    badge: "bg-[#ECFDF5] text-[#047857]",
    dot: "bg-[#10B981]",
  },
  error: {
    icon: "fa-circle-xmark",
    badge: "bg-[#FEF2F2] text-[#B91C1C]",
    dot: "bg-[#EF4444]",
  },
  warning: {
    icon: "fa-triangle-exclamation",
    badge: "bg-[#FFF7ED] text-[#C2410C]",
    dot: "bg-[#FB923C]",
  },
  info: {
    icon: "fa-circle-info",
    badge: "bg-[#EFF6FF] text-[#1D4ED8]",
    dot: "bg-[#3B82F6]",
  },
};

export default function Header() {
  const [today, setToday] = useState(new Date());
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [dateValue, setDateValue] = useState("");

  const panelRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  useEffect(() => {
    const timer = window.setInterval(() => setToday(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => subscribeAdminNotifications(setNotifications), []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!panelOpen) return;

      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        bellButtonRef.current?.contains(target)
      ) {
        return;
      }

      setPanelOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [panelOpen]);

  useEffect(() => {
    const win = window as WindowWithFetchGuard;
    if (win.__adminFetchPatched) return;

    const originalFetch = window.fetch.bind(window);
    win.__adminFetchPatched = true;
    win.__adminFetchOriginal = originalFetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = (
        init?.method ||
        (input instanceof Request ? input.method : "GET")
      ).toUpperCase();
      const url = toUrlText(input);

      const response = await originalFetch(input, init);

      if (shouldTrack(url, method)) {
        let backendMessage = "";
        try {
          const payload = await response.clone().json();
          if (payload && typeof payload === "object" && "message" in payload) {
            const message = (payload as { message?: unknown }).message;
            if (typeof message === "string") {
              backendMessage = message;
            }
          }
        } catch {
          // ignore parse errors from non-json endpoints
        }

        const action = getMethodLabel(method);
        const resource = getResourceLabel(url);

        pushAdminNotification({
          title: response.ok
            ? `${action} ${resource} thành công`
            : `${action} ${resource} thất bại`,
          message: backendMessage || `${method} ${resource}`,
          type: response.ok ? "success" : "error",
        });
      }

      return response;
    };

    return () => {
      const current = window as WindowWithFetchGuard;
      if (current.__adminFetchOriginal) {
        window.fetch = current.__adminFetchOriginal;
      }
      current.__adminFetchPatched = false;
      delete current.__adminFetchOriginal;
    };
  }, []);

  const onTogglePanel = () => {
    setPanelOpen((prev) => {
      const next = !prev;
      if (next && unreadCount > 0) {
        markAllAdminNotificationsRead();
      }
      return next;
    });
  };

  return (
    <header className="border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="relative"></div>

        <div className="flex items-center gap-4">
          <label className="relative flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-gray-600">
            <i className="fa-regular fa-calendar"></i>

            <input
              type="date"
              value={dateValue}
              onChange={(event) => setDateValue(event.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />

            <span className="font-bold text-[#334155]">{formatDatePill(today)}</span>
            <i className="fa-solid fa-chevron-down ml-auto text-xs"></i>
          </label>

          <div className="relative">
            <button
              ref={bellButtonRef}
              onClick={onTogglePanel}
              className="relative rounded-lg p-2 text-gray-600 transition hover:bg-slate-100"
              aria-label="Thông báo"
            >
              <i className="fa-regular fa-bell"></i>
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {panelOpen && (
              <div
                ref={panelRef}
                className="absolute right-0 top-11 z-50 w-[380px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_20px_50px_-25px_rgba(15,23,42,0.45)]"
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-[#0F172A]">Thông báo hệ thống</p>
                    <p className="text-xs text-[#64748B]">
                      {notifications.length} thông báo gần đây
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={clearAdminNotifications}
                    className="text-xs font-semibold text-[#0EA5E9] hover:text-[#0284C7]"
                  >
                    Xóa tất cả
                  </button>
                </div>

                <div className="max-h-[420px] overflow-y-auto">
                  {notifications.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-[#64748B]">
                      Chưa có thông báo nào.
                    </div>
                  )}

                  {notifications.map((item) => {
                    const meta = typeMeta[item.type];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => markAdminNotificationAsRead(item.id)}
                        className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-[#F8FAFC]"
                      >
                        <span
                          className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.badge}`}
                        >
                          <i className={`fa-solid ${meta.icon} text-xs`}></i>
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-[#0F172A]">
                            {item.title}
                          </span>
                          <span className="mt-0.5 block text-xs leading-5 text-[#64748B]">
                            {item.message}
                          </span>
                          <span className="mt-1 block text-[11px] text-[#94A3B8]">
                            {formatRelativeTime(item.createdAt, today.getTime())}
                          </span>
                        </span>

                        {!item.read && (
                          <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`}></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button className="rounded-lg p-2 text-gray-600 transition hover:bg-slate-100" aria-label="Cài đặt">
            <i className="fa-solid fa-gear"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
