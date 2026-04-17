"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE, authorizedAdminFetch, clearAdminSession } from "@/app/lib/admin-auth";

type NewsCategory = {
  Id_category_news: number;
  Name_category_news: string;
  Status: number;
};

type NewsItem = {
  Id_news: number;
  Title: string;
  Slug: string;
  Content: string;
  Thumbnail: string;
  Status: number;
  Id_category_news: number;
  Name_category_news?: string;
};

type Notice = {
  type: "success" | "error";
  message: string;
};

const initialForm = {
  Title: "",
  Slug: "",
  Content: "",
  Thumbnail: "",
  Id_category_news: 0,
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

const excerpt = (value: string, max = 96) => {
  const text = String(value || "").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
};

const toAbsoluteImageUrl = (path?: string | null) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
};

export default function NewsManagerPage() {
  const router = useRouter();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "1" | "0">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [notice, setNotice] = useState<Notice | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
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

  const loadCategories = useCallback(async () => {
    const response = await authorizedFetch(`${API_BASE}/api/admin/news-categories`);
    const payload = await parseJsonSafe<NewsCategory[] | { message?: string }>(response);
    if (!response.ok) {
      throw new Error(getMessage(payload, "Không thể tải loại tin."));
    }
    const rows = Array.isArray(payload) ? payload : [];
    setCategories(rows);
    if (!form.Id_category_news && rows.length > 0) {
      setForm((prev) => ({ ...prev, Id_category_news: rows[0].Id_category_news }));
    }
  }, [authorizedFetch, form.Id_category_news]);

  const loadNews = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search.trim()) query.set("search", search.trim());
      if (statusFilter !== "all") query.set("status", statusFilter);
      if (categoryFilter !== "all") query.set("categoryId", categoryFilter);

      const response = await authorizedFetch(
        `${API_BASE}/api/admin/news${query.toString() ? `?${query.toString()}` : ""}`
      );
      const payload = await parseJsonSafe<NewsItem[] | { message?: string }>(response);
      if (!response.ok) {
        throw new Error(getMessage(payload, "Không thể tải danh sách tin tức."));
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
  }, [authorizedFetch, search, statusFilter, categoryFilter]);

  useEffect(() => {
    loadCategories().catch((error) => {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Không thể tải loại tin.",
      });
    });
  }, [loadCategories]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const totalPublished = useMemo(() => items.filter((item) => item.Status === 1).length, [items]);
  const totalHidden = useMemo(() => items.filter((item) => item.Status === 0).length, [items]);

  const openCreate = () => {
    setEditingItem(null);
    setForm({
      ...initialForm,
      Id_category_news: categories[0]?.Id_category_news || 0,
    });
    setOpenModal(true);
  };

  const openEdit = (item: NewsItem) => {
    setEditingItem(item);
    setForm({
      Title: item.Title,
      Slug: item.Slug,
      Content: item.Content,
      Thumbnail: item.Thumbnail,
      Id_category_news: item.Id_category_news,
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
    if (!form.Title.trim() || !form.Content.trim() || !form.Thumbnail.trim() || !form.Id_category_news) {
      setNotice({
        type: "error",
        message: "Vui lòng nhập đầy đủ tiêu đề, nội dung, ảnh và loại tin.",
      });
      return;
    }

    try {
      setSaving(true);
      const isEdit = Boolean(editingItem);
      const url = isEdit
        ? `${API_BASE}/api/admin/news/${editingItem!.Id_news}`
        : `${API_BASE}/api/admin/news`;
      const method = isEdit ? "PUT" : "POST";

      const response = await authorizedFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Title: form.Title.trim(),
          Slug: form.Slug.trim(),
          Content: form.Content.trim(),
          Thumbnail: form.Thumbnail.trim(),
          Id_category_news: form.Id_category_news,
          Status: form.Status,
        }),
      });
      const payload = await parseJsonSafe<{ message?: string }>(response);
      if (!response.ok) {
        throw new Error(getMessage(payload, "Không thể lưu bài viết."));
      }

      setNotice({
        type: "success",
        message: getMessage(payload, isEdit ? "Cập nhật bài viết thành công." : "Tạo bài viết thành công."),
      });
      closeModal();
      loadNews();
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Có lỗi xảy ra.",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (item: NewsItem) => {
    try {
      const response = await authorizedFetch(`${API_BASE}/api/admin/news/${item.Id_news}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Status: item.Status === 1 ? 0 : 1 }),
      });
      const payload = await parseJsonSafe<{ message?: string }>(response);
      if (!response.ok) {
        throw new Error(getMessage(payload, "Không thể cập nhật trạng thái."));
      }
      setNotice({ type: "success", message: getMessage(payload, "Đã cập nhật trạng thái bài viết.") });
      loadNews();
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "Có lỗi xảy ra.",
      });
    }
  };

  const removeItem = async (item: NewsItem) => {
    const accepted = window.confirm(`Bạn có chắc muốn xóa bài viết "${item.Title}"?`);
    if (!accepted) return;

    try {
      const response = await authorizedFetch(`${API_BASE}/api/admin/news/${item.Id_news}`, {
        method: "DELETE",
      });
      const payload = await parseJsonSafe<{ message?: string }>(response);
      if (!response.ok) {
        throw new Error(getMessage(payload, "Không thể xóa bài viết."));
      }
      setNotice({ type: "success", message: getMessage(payload, "Xóa bài viết thành công.") });
      loadNews();
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
          <h1 className="text-2xl font-bold text-[#0F172A]">Quản lý tin tức</h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Soạn thảo, chỉnh sửa và quản lý các bài viết tin tức trên hệ thống.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0077B6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#02679D]"
        >
          <i className="fa-solid fa-plus"></i>
          Tạo bài viết mới
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard title="Tổng bài viết" value={items.length} />
        <StatCard title="Đã đăng" value={totalPublished} />
        <StatCard title="Đang ẩn" value={totalHidden} />
        <StatCard title="Loại tin" value={categories.length} />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px]">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"></i>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tiêu đề hoặc nội dung..."
            className="h-11 w-full rounded-xl border border-[#D0D7E2] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#0EA5E9]"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="h-11 rounded-xl border border-[#D0D7E2] bg-white px-3 text-sm outline-none focus:border-[#0EA5E9]"
        >
          <option value="all">Tất cả loại tin</option>
          {categories.map((item) => (
            <option key={item.Id_category_news} value={item.Id_category_news}>
              {item.Name_category_news}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as "all" | "1" | "0")}
          className="h-11 rounded-xl border border-[#D0D7E2] bg-white px-3 text-sm outline-none focus:border-[#0EA5E9]"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="1">Đã đăng</option>
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
              <th className="px-4 py-3 text-left">Bài viết</th>
              <th className="px-4 py-3 text-left">Loại tin</th>
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

            {!loading && items.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-[#64748B]" colSpan={5}>
                  Không có bài viết phù hợp.
                </td>
              </tr>
            )}

            {!loading &&
              items.map((item, index) => (
                <tr key={item.Id_news} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3 text-[#64748B]">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={toAbsoluteImageUrl(item.Thumbnail) || "/no-image.png"}
                        alt={item.Title}
                        className="h-14 w-20 rounded-md object-cover"
                      />
                      <div>
                        <p className="font-semibold text-[#0F172A] line-clamp-2">{item.Title}</p>
                        <p className="mt-1 text-xs text-[#64748B] line-clamp-2">{excerpt(item.Content)}</p>
                        <p className="mt-1 text-xs text-[#94A3B8]">/{item.Slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#334155]">{item.Name_category_news || "Không xác định"}</td>
                  <td className="px-4 py-3">
                    {item.Status === 1 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2.5 py-1 text-xs font-semibold text-[#047857]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]"></span>
                        Đã đăng
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
                        title={item.Status === 1 ? "Ẩn bài viết" : "Hiện bài viết"}
                      >
                        <i className={`fa-regular ${item.Status === 1 ? "fa-eye-slash" : "fa-eye"}`}></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item)}
                        className="text-[#DC2626] hover:text-[#B91C1C]"
                        title="Xóa bài viết"
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
          <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
              <h2 className="text-lg font-bold text-[#0F172A]">
                {editingItem ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
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
                <span className="font-semibold">Tiêu đề</span>
                <input
                  value={form.Title}
                  onChange={(event) => setForm((prev) => ({ ...prev, Title: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-[#D0D7E2] px-3 outline-none focus:border-[#0EA5E9]"
                  placeholder="Nhập tiêu đề bài viết..."
                />
              </label>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="block space-y-1 text-sm text-[#334155]">
                  <span className="font-semibold">Slug (có thể để trống)</span>
                  <input
                    value={form.Slug}
                    onChange={(event) => setForm((prev) => ({ ...prev, Slug: event.target.value }))}
                    className="h-11 w-full rounded-xl border border-[#D0D7E2] px-3 outline-none focus:border-[#0EA5E9]"
                    placeholder="vi-du-slug-bai-viet"
                  />
                </label>

                <label className="block space-y-1 text-sm text-[#334155]">
                  <span className="font-semibold">Loại tin</span>
                  <select
                    value={form.Id_category_news}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, Id_category_news: Number(event.target.value) || 0 }))
                    }
                    className="h-11 w-full rounded-xl border border-[#D0D7E2] px-3 outline-none focus:border-[#0EA5E9]"
                  >
                    <option value={0}>Chọn loại tin</option>
                    {categories.map((item) => (
                      <option key={item.Id_category_news} value={item.Id_category_news}>
                        {item.Name_category_news}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block space-y-1 text-sm text-[#334155]">
                <span className="font-semibold">Ảnh thumbnail (URL hoặc /image/...)</span>
                <input
                  value={form.Thumbnail}
                  onChange={(event) => setForm((prev) => ({ ...prev, Thumbnail: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-[#D0D7E2] px-3 outline-none focus:border-[#0EA5E9]"
                  placeholder="/image/news/ten-anh.png"
                />
              </label>

              <label className="block space-y-1 text-sm text-[#334155]">
                <span className="font-semibold">Nội dung</span>
                <textarea
                  rows={7}
                  value={form.Content}
                  onChange={(event) => setForm((prev) => ({ ...prev, Content: event.target.value }))}
                  className="w-full rounded-xl border border-[#D0D7E2] px-3 py-2.5 outline-none focus:border-[#0EA5E9]"
                  placeholder="Nhập nội dung bài viết..."
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
                  <option value={1}>Đã đăng</option>
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

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
      <p className="text-xs font-semibold uppercase text-[#64748B]">{title}</p>
      <p className="mt-2 text-2xl font-bold text-[#0F172A]">{value}</p>
    </div>
  );
}
