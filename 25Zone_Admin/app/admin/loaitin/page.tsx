"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE, authorizedAdminFetch, clearAdminSession } from "@/app/lib/admin-auth";

type NewsCategory = {
  Id_category_news: number;
  Name_category_news: string;
  Status: number;
  Total_news?: number;
};

type Notice = {
  type: "success" | "error";
  message: string;
};

const initialForm = {
  Name_category_news: "",
  Status: 1,
};

const parseJsonSafe = async <T,>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const getMessage = (payload: unknown, fallback: string) => {
  if (payload && typeof payload === "object" && "message" in payload) {
    const value = (payload as { message?: unknown }).message;
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
};

export default function QuanLyLoaiTinPage() {
  const router = useRouter();
  const [items, setItems] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "1" | "0">("all");

  const [notice, setNotice] = useState<Notice | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsCategory | null>(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const handleUnauthorized = useCallback(() => {
    clearAdminSession();
    router.replace("/admin/login");
  }, [router]);

  const authorizedFetch = useCallback(
    (input: string, init: RequestInit = {}) =>
      authorizedAdminFetch(input, init, handleUnauthorized),
    [handleUnauthorized]
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authorizedFetch(`${API_BASE}/api/admin/news-categories`);
      const payload = await parseJsonSafe<NewsCategory[] | { message?: string }>(response);

      if (!response.ok) {
        throw new Error(getMessage(payload, "Không thể tải loại tin."));
      }

      setItems(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Có lỗi xảy ra.",
      });
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = item.Name_category_news
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      const matchStatus = statusFilter === "all" || String(item.Status) === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [items, search, statusFilter]);

  const openCreate = () => {
    setEditingItem(null);
    setForm(initialForm);
    setOpenModal(true);
  };

  const openEdit = (item: NewsCategory) => {
    setEditingItem(item);
    setForm({
      Name_category_news: item.Name_category_news,
      Status: item.Status === 0 ? 0 : 1,
    });
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setEditingItem(null);
    setForm(initialForm);
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = form.Name_category_news.trim();
    if (!name) {
      setNotice({ type: "error", message: "Vui lòng nhập tên loại tin." });
      return;
    }

    try {
      setSaving(true);
      const isEdit = Boolean(editingItem);
      const url = isEdit
        ? `${API_BASE}/api/admin/news-categories/${editingItem!.Id_category_news}`
        : `${API_BASE}/api/admin/news-categories`;
      const method = isEdit ? "PUT" : "POST";

      const response = await authorizedFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Name_category_news: name,
          Status: form.Status,
        }),
      });
      const payload = await parseJsonSafe<{ message?: string }>(response);

      if (!response.ok) {
        throw new Error(getMessage(payload, "Không thể lưu loại tin."));
      }

      setNotice({
        type: "success",
        message: getMessage(payload, isEdit ? "Cập nhật loại tin thành công." : "Tạo loại tin thành công."),
      });
      closeModal();
      loadData();
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Có lỗi xảy ra.",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (item: NewsCategory) => {
    try {
      const response = await authorizedFetch(
        `${API_BASE}/api/admin/news-categories/${item.Id_category_news}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Status: item.Status === 1 ? 0 : 1 }),
        }
      );
      const payload = await parseJsonSafe<{ message?: string }>(response);
      if (!response.ok) {
        throw new Error(getMessage(payload, "Không thể cập nhật trạng thái."));
      }
      setNotice({ type: "success", message: getMessage(payload, "Đã cập nhật trạng thái loại tin.") });
      loadData();
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Có lỗi xảy ra.",
      });
    }
  };

  const removeItem = async (item: NewsCategory) => {
    const accepted = window.confirm(`Bạn có chắc muốn xóa loại tin "${item.Name_category_news}"?`);
    if (!accepted) return;

    try {
      const response = await authorizedFetch(
        `${API_BASE}/api/admin/news-categories/${item.Id_category_news}`,
        { method: "DELETE" }
      );
      const payload = await parseJsonSafe<{ message?: string }>(response);
      if (!response.ok) {
        throw new Error(getMessage(payload, "Không thể xóa loại tin."));
      }
      setNotice({ type: "success", message: getMessage(payload, "Xóa loại tin thành công.") });
      loadData();
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Có lỗi xảy ra.",
      });
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Quản lý loại tin</h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Quản lý danh mục để phân loại bài viết tin tức trên hệ thống.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0077B6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#02679D]"
        >
          <i className="fa-solid fa-plus"></i>
          Thêm loại tin mới
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"></i>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên loại tin..."
            className="h-11 w-full rounded-xl border border-[#D0D7E2] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#0EA5E9]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as "all" | "1" | "0")}
          className="h-11 rounded-xl border border-[#D0D7E2] bg-white px-3 text-sm outline-none focus:border-[#0EA5E9]"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="1">Đang hoạt động</option>
          <option value="0">Đang ẩn</option>
        </select>
      </div>

      {notice && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]"
              : "border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]"
          }`}
        >
          {notice.message}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#64748B]">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Tên loại tin</th>
              <th className="px-4 py-3 text-left">Số bài viết</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              <th className="px-4 py-3 text-left">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td className="px-4 py-6 text-center text-[#64748B]" colSpan={5}>
                  Đang tải dữ liệu...
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-[#64748B]" colSpan={5}>
                  Không có loại tin phù hợp.
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((item, index) => (
                <tr key={item.Id_category_news} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3 text-[#64748B]">{index + 1}</td>
                  <td className="px-4 py-3 font-semibold text-[#0F172A]">{item.Name_category_news}</td>
                  <td className="px-4 py-3 text-[#334155]">{item.Total_news || 0}</td>
                  <td className="px-4 py-3">
                    {item.Status === 1 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2.5 py-1 text-xs font-semibold text-[#047857]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]"></span>
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7ED] px-2.5 py-1 text-xs font-semibold text-[#C2410C]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FB923C]"></span>
                        Đang ẩn
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-sm">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="text-[#2563EB] hover:text-[#1D4ED8]"
                        title="Chỉnh sửa"
                      >
                        <i className="fa-regular fa-pen-to-square"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleStatus(item)}
                        className={item.Status === 1 ? "text-[#EA580C] hover:text-[#C2410C]" : "text-[#16A34A] hover:text-[#15803D]"}
                        title={item.Status === 1 ? "Ẩn loại tin" : "Hiện loại tin"}
                      >
                        <i className={`fa-regular ${item.Status === 1 ? "fa-eye-slash" : "fa-eye"}`}></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item)}
                        className="text-[#DC2626] hover:text-[#B91C1C]"
                        title="Xóa loại tin"
                      >
                        <i className="fa-regular fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {openModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#E2E8F0] bg-white">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
              <h2 className="text-lg font-bold text-[#0F172A]">
                {editingItem ? "Chỉnh sửa loại tin" : "Thêm loại tin mới"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-[#64748B] hover:bg-[#F1F5F9]"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-4 px-5 py-4">
              <label className="block space-y-1 text-sm text-[#334155]">
                <span className="font-semibold">Tên loại tin</span>
                <input
                  value={form.Name_category_news}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, Name_category_news: event.target.value }))
                  }
                  className="h-11 w-full rounded-xl border border-[#D0D7E2] px-3 outline-none focus:border-[#0EA5E9]"
                  placeholder="Nhập tên loại tin..."
                />
              </label>

              <label className="block space-y-1 text-sm text-[#334155]">
                <span className="font-semibold">Trạng thái</span>
                <select
                  value={form.Status}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, Status: Number(event.target.value) === 0 ? 0 : 1 }))
                  }
                  className="h-11 w-full rounded-xl border border-[#D0D7E2] px-3 outline-none focus:border-[#0EA5E9]"
                >
                  <option value={1}>Hoạt động</option>
                  <option value={0}>Đang ẩn</option>
                </select>
              </label>

              <div className="flex justify-end gap-2 border-t border-[#E2E8F0] pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-[#D0D7E2] px-4 py-2 text-sm font-semibold text-[#334155] hover:bg-[#F8FAFC]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#0EA5E9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0284C7] disabled:opacity-60"
                >
                  {saving ? "Đang lưu..." : editingItem ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
