"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AccountShell } from "@/app/components/account/AccountShell";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { apiRequest, errorMessage, toAbsoluteImageUrl } from "@/lib/api";

type OrderItem = {
  Id_order: number;
  Created_order: string;
  Final_amount: number;
  Status: "pending" | "confirmed" | "processing" | "completed" | "cancelled";
  Payment_method_name: string | null;
  Order_code: string;
  Total_items: number;
  First_product_name: string;
  First_product_image: string | null;
};

const statusMap: Record<
  OrderItem["Status"],
  { label: string; className: string; icon: string }
> = {
  pending: {
    label: "Chờ xác nhận",
    className: "bg-amber-50 text-amber-700",
    icon: "fa-clock",
  },
  confirmed: {
    label: "Đã xác nhận",
    className: "bg-indigo-50 text-indigo-700",
    icon: "fa-check",
  },
  processing: {
    label: "Đang giao",
    className: "bg-sky-50 text-sky-700",
    icon: "fa-truck-fast",
  },
  completed: {
    label: "Hoàn thành",
    className: "bg-emerald-50 text-emerald-700",
    icon: "fa-circle-check",
  },
  cancelled: {
    label: "Đã hủy",
    className: "bg-rose-50 text-rose-700",
    icon: "fa-ban",
  },
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

export default function AccountOrdersPage() {
  const { token, user, bootstrapped } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    if (!token) return;
    setError("");
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (status) query.set("status", status);
      if (search.trim()) query.set("search", search.trim());
      const url = `/api/orders/me${query.toString() ? `?${query.toString()}` : ""}`;
      const response = await apiRequest<{ orders: OrderItem[] }>(url, { token });
      setOrders(response.orders || []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadOrders();
  }, [token, status]);

  const currentStatuses = useMemo(
    () => [
      { value: "", label: "Tất cả" },
      { value: "pending", label: "Chờ xác nhận" },
      { value: "confirmed", label: "Đã xác nhận" },
      { value: "processing", label: "Đang giao" },
      { value: "completed", label: "Hoàn thành" },
      { value: "cancelled", label: "Đã hủy" },
    ],
    []
  );

  if (!bootstrapped) {
    return (
      <main className="max-w-[1604px] mx-auto px-4 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-600">
          Đang tải lịch sử đơn hàng...
        </div>
      </main>
    );
  }

  if (!user || !token) {
    return (
      <main className="max-w-[1604px] mx-auto px-4 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-700 font-semibold">Vui lòng đăng nhập để xem đơn hàng của bạn.</p>
          <Link
            href="/"
            className="inline-flex mt-4 rounded-xl bg-[#003366] px-5 py-3 text-white font-bold hover:bg-[#002244] transition"
          >
            Về trang chủ
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
          <span className="text-gray-700 font-semibold">Tài khoản</span>
          <i className="fa-solid fa-chevron-right text-[11px] text-gray-300"></i>
          <span className="text-gray-700 font-extrabold">Đơn hàng của tôi</span>
        </div>
      </div>

      <section className="max-w-[1604px] mx-auto px-4 py-10">
        <AccountShell active="orders">
          <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg sm:text-xl font-extrabold text-[#003366]">Đơn hàng của tôi</h3>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    loadOrders();
                  }}
                  className="relative w-full sm:w-[360px]"
                >
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/15"
                    placeholder="Tìm theo mã đơn hàng..."
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </form>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {currentStatuses.map((item) => (
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
              {loading && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  Đang tải đơn hàng...
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {!loading && !error && orders.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">
                  Chưa có đơn hàng nào phù hợp với điều kiện tìm kiếm.
                </div>
              )}

              {orders.map((order) => {
                const statusInfo = statusMap[order.Status] || statusMap.pending;
                return (
                  <div
                    key={order.Id_order}
                    className="border border-gray-200 rounded-2xl p-5 bg-white hover:shadow-md transition"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Mã đơn hàng</p>
                        <p className="font-extrabold text-[#003366]">#{order.Order_code}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${statusInfo.className}`}
                        >
                          <i className={`fa-solid ${statusInfo.icon}`}></i>
                          {statusInfo.label}
                        </span>
                        <span className="text-sm text-gray-500">{formatDate(order.Created_order)}</span>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <img
                            alt={order.First_product_name || "Sản phẩm"}
                            className="w-20 h-20 rounded-xl border border-gray-200 object-cover"
                            src={toAbsoluteImageUrl(order.First_product_image) || "/img/image%2077.png"}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {order.First_product_name || "Đơn hàng"}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Số lượng sản phẩm: {order.Total_items}
                            </p>
                          </div>
                        </div>

                        <div className="sm:text-right">
                          <p className="text-xs text-gray-500">Tổng thanh toán</p>
                          <p className="font-extrabold text-[#8b1e1e] text-lg tabular-nums">
                            {formatMoney(order.Final_amount)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <i className="fa-solid fa-credit-card text-gray-400"></i>
                          Thanh toán:
                          <span className="font-semibold text-gray-800">
                            {order.Payment_method_name || "Không xác định"}
                          </span>
                        </div>
                        <div className="flex gap-3">
                          <Link
                            className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
                            href={`/account/orders/${order.Id_order}`}
                          >
                            Xem chi tiết
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </AccountShell>
      </section>
    </main>
  );
}
