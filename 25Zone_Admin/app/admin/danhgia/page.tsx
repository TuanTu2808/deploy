"use client";

import { toast } from "../../component/Toast";
import { useCallback, useEffect, useState } from "react";
import { API_BASE, authorizedAdminFetch, clearAdminSession } from "@/app/lib/admin-auth";

type ReviewView = "services" | "products";

type ReviewSort = "attention" | "newest" | "oldest" | "highest" | "lowest";
type ReviewEntity = "service" | "stylist" | "product";

type ReviewRecord = {
  id: number;
  entity: ReviewEntity;
  rating: number;
  comment: string;
  createdAt: string | null;
  customer: {
    id: number | null;
    name: string;
    phone: string;
  };
  booking: {
    id: number;
    date: string;
    status: string;
  } | null;
  subject: {
    id: number | null;
    name: string;
    type: string;
    category: string;
    brand: string;
  };
  stylist: {
    id: number;
    name: string;
  } | null;
  store: {
    id: number;
    name: string;
  } | null;
  relatedServices: string;
};

type ReviewPayload = {
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  data: ReviewRecord[];
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Chưa cập nhật";
  const parsed = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const renderStars = (rating: number) => {
  if (!rating || rating <= 0) return <span className="text-slate-400 italic text-sm">Chưa đánh giá</span>;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < Math.max(0, Math.min(5, Math.round(rating)));
        return (
          <i
            key={index}
            className={`fa-solid fa-star text-[13px] ${filled ? "text-[#F59E0B]" : "text-slate-200"}`}
          />
        );
      })}
    </div>
  );
};

export default function DanhGiaPage() {
  const [view, setView] = useState<ReviewView>("services");
  const [rating, setRating] = useState("all");
  const [sort, setSort] = useState<ReviewSort>("newest");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  
  const [payload, setPayload] = useState<ReviewPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const authorizedFetch = useCallback(
    (input: string, init: RequestInit = {}) =>
      authorizedAdminFetch(input, init, () => {
        clearAdminSession();
        if (typeof window !== "undefined") {
          window.location.href = "/admin/login";
        }
      }),
    []
  );

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);

      const query = new URLSearchParams({
        view,
        sort,
        page: String(page),
        limit: "10",
        search: searchTerm,
      });

      if (view === "services") {
        query.set("source", "all");
        query.set("rating", rating);
      }

      const response = await authorizedFetch(`${API_BASE || "http://localhost:5001"}/api/admin/reviews?${query.toString()}`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Lỗi tải dữ liệu");

      setPayload(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, page, rating, searchTerm, sort, view]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleDelete = async (entity: ReviewEntity, id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa phản hồi này?")) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await authorizedFetch(`${API_BASE || "http://localhost:5001"}/api/admin/reviews/${entity}/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Lỗi xóa phản hồi");
      await loadReviews();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra khi xóa.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTabChange = (newView: ReviewView) => {
    setView(newView);
    setSearchInput("");
    setSearchTerm("");
    setPage(1);
    setRating("all");
    setSort("newest");
  };

  const RATING_OPTIONS = [
    { value: "all", label: "Tất cả sao" },
    { value: "5", label: "5 sao" },
    { value: "4", label: "4 sao" },
    { value: "3", label: "3 sao" },
    { value: "2", label: "2 sao" },
    { value: "1", label: "1 sao" },
  ];

  return (
    <main className="flex-1 bg-[#F8FAFC] py-8 px-[32px]">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A]">Chăm sóc khách hàng</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý Đánh giá dịch vụ & Bình luận sản phẩm</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-200 mb-6 gap-8">
        <button
          onClick={() => handleTabChange("services")}
          className={`pb-3 text-sm font-semibold transition relative ${
            view === "services" ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-star"></i> Đánh giá Dịch vụ
          </div>
          {view === "services" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-lg"></div>}
        </button>

        <button
          onClick={() => handleTabChange("products")}
          className={`pb-3 text-sm font-semibold transition relative ${
            view === "products" ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-comments"></i> Bình luận Sản phẩm
          </div>
          {view === "products" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-lg"></div>}
        </button>
      </div>

      {/* CONTROLS */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 flex items-center px-4 h-10 w-full max-w-sm">
          <i className="fa-solid fa-magnifying-glass text-slate-400 mr-2"></i>
          <input
            type="text"
            className="w-full text-sm outline-none"
            placeholder={view === "services" ? "Tìm theo tên, SĐT, dịch vụ..." : "Tìm theo tên, SĐT, sản phẩm..."}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearchTerm(searchInput);
                setPage(1);
              }
            }}
          />
        </div>

        {view === "services" && (
          <>

            <select
              className="border border-slate-200 px-3 h-10 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              value={rating}
              onChange={(e) => { setRating(e.target.value); setPage(1); }}
            >
              {RATING_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </>
        )}

        <select
          className="border border-slate-200 px-3 h-10 rounded-lg text-sm focus:outline-none focus:border-blue-500 ml-auto"
          value={sort}
          onChange={(e) => { setSort(e.target.value as ReviewSort); setPage(1); }}
        >
          <option value="newest">Mới nhất trước</option>
          <option value="oldest">Cũ nhất trước</option>
          {view === "services" && <option value="attention">Ưu tiên (1-2 sao)</option>}
        </select>
      </div>

      {/* TABLE DATA */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="font-semibold text-[#1E293B]">Danh sách {view === "services" ? "đánh giá" : "bình luận"}</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-400 border-b border-[#F1F5F9]">
              <tr className="text-left">
                <th className="py-3 font-medium">Khách hàng</th>
                <th className="py-3 font-medium">Đối tượng</th>
                <th className="py-3 font-medium w-[250px]">{view === "services" ? "Đánh giá sao" : "Nội dung bình luận"}</th>
                <th className="py-3 font-medium">Chi nhánh/Lịch hẹn</th>
                <th className="py-3 font-medium">Thời gian</th>
                <th className="py-3 font-medium text-right pr-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : payload && payload.data.length > 0 ? (
                payload.data.map((item) => (
                  <tr key={`${item.entity}-${item.id}`} className="border-b last:border-b-0 border-[#F8FAFC] hover:bg-[#F8FAFC] transition">
                    <td className="py-4">
                      <p className="font-semibold text-[#1E293B]">{item.customer.name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{item.customer.phone || "Không có SĐT"}</p>
                    </td>

                    <td className="py-4">
                      <span className="font-medium text-[#334155]">{item.subject.name}</span>
                      <p className="text-[11px] text-slate-400 uppercase mt-0.5">
                        {item.entity === "product" ? "Sản phẩm" : item.entity === "stylist" ? "Stylist" : "Dịch vụ"}
                      </p>
                    </td>

                    <td className="py-4">
                      {view === "services" ? (
                        <>
                          {renderStars(item.rating)}
                          {item.rating > 0 && item.rating <= 2 && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded ring-1 ring-inset ring-rose-200">
                              Cần chú ý
                            </span>
                          )}
                        </>
                      ) : (
                        <p className="text-slate-600 line-clamp-2">{item.comment || <span className="text-slate-400 italic">Không có nội dung</span>}</p>
                      )}
                    </td>

                    <td className="py-4">
                      {view === "services" ? (
                        <>
                           <p className="font-medium text-slate-700">{item.store?.name || "Chưa xác định"}</p>
                           {item.booking && (
                              <p className="text-[11px] text-slate-500 mt-0.5">Mã lịch: #{item.booking.id}</p>
                           )}
                        </>
                      ) : (
                         <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-4">
                      <div className="text-[#64748B]">{formatDateTime(item.createdAt)}</div>
                    </td>

                    <td className="text-right pr-2">
                       <button
                         title="Xóa phản hồi"
                         onClick={() => handleDelete(item.entity, item.id)}
                         disabled={deletingId === item.id}
                         className={`w-8 h-8 flex items-center justify-center rounded-lg border transition shadow-sm
                            ${deletingId === item.id 
                                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" 
                                : "text-red-500 bg-red-50 border-red-100 hover:bg-red-100 hover:text-red-600"
                            }
                         `}
                       >
                         {deletingId === item.id ? (
                           <i className="fa-solid fa-spinner fa-spin text-sm"></i>
                         ) : (
                           <i className="fa-solid fa-trash-can"></i>
                         )}
                       </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex justify-center mb-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                        <i className={view === "services" ? "fa-solid fa-star text-xl" : "fa-solid fa-comments text-xl"}></i>
                      </div>
                    </div>
                    <p className="font-medium text-slate-600 mb-1">Chưa có phản hồi nào</p>
                    <p className="text-sm text-slate-400">Hệ thống chưa ghi nhận dữ liệu tại mục này.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {payload && payload.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#F1F5F9] pt-4 mt-2">
            <p className="text-sm text-slate-500">
              Trang {payload.pagination.page} / {payload.pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
              >
                Trước
              </button>
              <button
                disabled={page >= payload.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
