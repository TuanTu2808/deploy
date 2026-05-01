"use client";

import { toast } from "../../component/Toast";
import { useEffect, useMemo, useState } from "react";
import { API_BASE, authorizedAdminFetch, clearAdminSession } from "@/app/lib/admin-auth";

type AdminOrder = {
  Id_order: number;
  Order_code: string;
  Name_user: string | null;
  Phone: string;
  Receiver_name: string;
  Created_order: string;
  Final_amount: number;
  Status: "pending" | "confirmed" | "processing" | "completed" | "cancelled";
  Status_payment: number;
  Payment_method_name: string | null;
};

const statusLabel: Record<AdminOrder["Status"], string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  processing: "Đang giao",
  completed: "Đã hoàn thành",
  cancelled: "Đã hủy",
};

const statusOptions: AdminOrder["Status"][] = [
  "pending",
  "confirmed",
  "processing",
  "completed",
  "cancelled",
];

const formatMoney = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const ITEMS_PER_PAGE = 10;

export default function QuanLyDonHang() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const authorizedFetch = async (input: string, init: RequestInit = {}) =>
    authorizedAdminFetch(input, init, () => {
      clearAdminSession();
      if (typeof window !== "undefined") {
        window.location.href = "/admin/login";
      }
    });

  const loadOrders = async (params?: { search?: string; status?: string }) => {
    try {
      setLoading(true);
      if (params) {
        setCurrentPage(1);
      }
      setError("");
      const query = new URLSearchParams();
      if (params?.search) query.set("search", params.search);
      if (params?.status) query.set("status", params.status);
      const url = `${API_BASE}/api/admin/orders${query.toString() ? `?${query.toString()}` : ""}`;
      const response = await authorizedFetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Không thể tải danh sách đơn hàng.");
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const stats = useMemo(() => {
    const result = {
      all: orders.length,
      pending: 0,
      confirmed: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const order of orders) {
      result[order.Status] += 1;
    }
    return result;
  }, [orders]);

  const onSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadOrders({ search: search.trim(), status: statusFilter });
  };

  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentOrders = orders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const onChangeStatus = async (orderId: number, nextStatus: AdminOrder["Status"]) => {
    if (!confirm("Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng này?")) return;
    try {
      setUpdatingOrderId(orderId);
      const response = await authorizedFetch(`${API_BASE}/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Cập nhật trạng thái thất bại.");

      setOrders((prev) =>
        prev.map((order) => (order.Id_order === orderId ? { ...order, Status: nextStatus } : order))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <main className="p-6 bg-[#F8FAFC] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">Quản lý đơn hàng</h1>
        <p className="text-sm text-[#64748B] mt-1">Theo dõi và cập nhật trạng thái tất cả đơn hàng.</p>
      </div>

      <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 h-[59px] border-b border-slate-200 text-[14px] overflow-x-auto">
          <button
            onClick={() => {
              setStatusFilter("");
              loadOrders({ search: search.trim(), status: "" });
            }}
            className={`h-full w-[155px] text-center font-semibold border-b-2 ${
              statusFilter === "" ? "text-sky-500 border-sky-500" : "text-slate-500 border-transparent"
            }`}
          >
            Tất cả ({stats.all})
          </button>
          <button
            onClick={() => {
              setStatusFilter("pending");
              loadOrders({ search: search.trim(), status: "pending" });
            }}
            className={`h-full w-[155px] text-center font-semibold border-b-2 ${
              statusFilter === "pending" ? "text-sky-500 border-sky-500" : "text-slate-500 border-transparent"
            }`}
          >
            Chờ xử lý ({stats.pending})
          </button>
          <button
            onClick={() => {
              setStatusFilter("confirmed");
              loadOrders({ search: search.trim(), status: "confirmed" });
            }}
            className={`h-full w-[155px] text-center font-semibold border-b-2 ${
              statusFilter === "confirmed" ? "text-sky-500 border-sky-500" : "text-slate-500 border-transparent"
            }`}
          >
            Đã xác nhận ({stats.confirmed})
          </button>
          <button
            onClick={() => {
              setStatusFilter("processing");
              loadOrders({ search: search.trim(), status: "processing" });
            }}
            className={`h-full w-[155px] text-center font-semibold border-b-2 ${
              statusFilter === "processing" ? "text-sky-500 border-sky-500" : "text-slate-500 border-transparent"
            }`}
          >
            Đang giao ({stats.processing})
          </button>
          <button
            onClick={() => {
              setStatusFilter("completed");
              loadOrders({ search: search.trim(), status: "completed" });
            }}
            className={`h-full w-[155px] text-center font-semibold border-b-2 ${
              statusFilter === "completed" ? "text-sky-500 border-sky-500" : "text-slate-500 border-transparent"
            }`}
          >
            Đã hoàn thành ({stats.completed})
          </button>
          <button
            onClick={() => {
              setStatusFilter("cancelled");
              loadOrders({ search: search.trim(), status: "cancelled" });
            }}
            className={`h-full w-[155px] text-center font-semibold border-b-2 ${
              statusFilter === "cancelled" ? "text-sky-500 border-sky-500" : "text-slate-500 border-transparent"
            }`}
          >
            Đã hủy ({stats.cancelled})
          </button>
        </div>

        <form onSubmit={onSearchSubmit} className="flex items-center justify-between p-4 gap-4">
          <div className="flex items-center gap-2 w-[340px] px-3 py-2 border border-slate-200 rounded-lg text-slate-500 text-sm">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Tìm theo mã đơn, tên khách hàng..."
              className="w-full outline-none bg-transparent"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-[#334155]" type="submit">
            Tìm kiếm
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-6">
        <table className="w-full text-sm">
          <thead className="bg-[#F8FAFC] text-[#64748B]">
            <tr className="border-b border-slate-200">
              <th className="p-4 text-left">MÃ ĐƠN HÀNG</th>
              <th className="p-4 text-left">KHÁCH HÀNG</th>
              <th className="p-4 text-left">NGÀY ĐẶT</th>
              <th className="p-4 text-left">TỔNG GIÁ TRỊ</th>
              <th className="p-4 text-left">TRẠNG THÁI</th>
              <th className="p-4 text-left">THANH TOÁN</th>
              <th className="p-4 text-left">PHƯƠNG THỨC</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading && (
              <tr>
                <td className="p-4 text-slate-500" colSpan={7}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td className="p-4 text-red-500" colSpan={7}>
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && orders.length === 0 && (
              <tr>
                <td className="p-4 text-slate-500" colSpan={7}>
                  Không có đơn hàng nào.
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              currentOrders.map((order) => (
                <tr key={order.Id_order} className="border-b border-slate-200 hover:bg-slate-50 transition">
                  <td className="p-4 text-[#00B4D8] font-bold">#{order.Order_code}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center font-semibold text-slate-700">
                        {(order.Name_user || order.Receiver_name || "KH").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[#0F172A] text-[14px] font-semibold">
                          {order.Name_user || order.Receiver_name || "Khách hàng"}
                        </p>
                        <p className="text-xs text-slate-500">{order.Phone || "Không có SĐT"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-[#475569] text-sm">{formatDateTime(order.Created_order)}</td>
                  <td className="p-4 text-[#0F172A] font-bold">{formatMoney(order.Final_amount)}</td>
                  <td className="p-4">
                    <select
                      disabled={updatingOrderId === order.Id_order}
                      className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-[#0F172A] text-sm focus:ring-1 focus:ring-sky-400 outline-none disabled:opacity-60"
                      value={order.Status}
                      onChange={(event) =>
                        onChangeStatus(order.Id_order, event.target.value as AdminOrder["Status"])
                      }
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 font-medium">
                    {Number(order.Status_payment) === 1 ? "Đã thanh toán" : "Chưa thanh toán"}
                  </td>
                  <td className="p-4">{order.Payment_method_name || "Không xác định"}</td>
                </tr>
              ))}
          </tbody>
        </table>
        
        <div className="flex items-center justify-end border-t border-slate-200 px-6 py-4 gap-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="rounded-lg border border-slate-200 px-4 py-2 disabled:opacity-50 text-sm hover:bg-slate-50 transition"
          >
            Trước
          </button>

          <div className="flex items-center gap-2">
            {getVisiblePages().map((page, i) => (
              page === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-slate-400">...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page as number)}
                  className={`h-9 w-9 rounded-lg text-sm transition ${
                    currentPage === page ? "bg-[#0B3C6D] text-white shadow-sm" : "border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              )
            ))}
          </div>

          <button
            disabled={totalPages === 0 || currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="rounded-lg border border-slate-200 px-4 py-2 disabled:opacity-50 text-sm hover:bg-slate-50 transition"
          >
            Sau
          </button>
        </div>
      </div>
    </main>
  );
}


