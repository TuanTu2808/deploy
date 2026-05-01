"use client";

import { toast } from "../../component/Toast";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE, authorizedAdminFetch, clearAdminSession } from "@/app/lib/admin-auth";

interface DanhMuc {
  Id_category_service: number;
  Name: string;
  Is_active: number;
  total_services: number;
}

const ITEMS_PER_PAGE = 10;

export default function DanhMucDichVuPage() {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [danhMucList, setDanhMucList] = useState<DanhMuc[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const handleUnauthorized = useCallback(() => {
    clearAdminSession();
    router.replace("/admin/login");
  }, [router]);

  const authorizedFetch = useCallback(
    (input: string, init: RequestInit = {}) =>
      authorizedAdminFetch(input, init, handleUnauthorized),
    [handleUnauthorized]
  );

  const fetchDanhMuc = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authorizedFetch(`${API_BASE}/api/danhmucdichvu`);
      if (!res.ok) {
        throw new Error("Không thể lấy danh mục dịch vụ.");
      }
      const data = await res.json();
      setDanhMucList(data);
    } catch (error) {
      console.error("Lỗi lấy danh mục dịch vụ:", error);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setCategoryError("Vui lòng nhập tên danh mục");
      return;
    }
    if (newCategoryName.trim().length < 3) {
      setCategoryError("Tên danh mục phải từ 3 ký tự trở lên");
      return;
    }
    setCategoryError("");

    try {
      const response = await authorizedFetch(`${API_BASE}/api/danhmucdichvu`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Name: newCategoryName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Không thể thêm danh mục dịch vụ.");
      }

      setNewCategoryName("");
      setShowAddModal(false);
      fetchDanhMuc();
    } catch (error) {
      console.error("Lỗi thêm danh mục dịch vụ:", error);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await authorizedFetch(`${API_BASE}/api/danhmucdichvu/${id}/status`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Không thể cập nhật trạng thái.");
      }

      fetchDanhMuc();
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
    }
  };

  const handleEdit = async (item: DanhMuc) => {
    const newName = prompt("Nhập tên danh mục mới:", item.Name);
    if (!newName) return;
    if (!newName.trim() || newName.trim().length < 3) {
      toast.error("Tên danh mục không hợp lệ (ít nhất 3 ký tự).");
      return;
    }

    try {
      const response = await authorizedFetch(
        `${API_BASE}/api/danhmucdichvu/${item.Id_category_service}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ Name: newName.trim() }),
        }
      );

      if (!response.ok) {
        throw new Error("Không thể cập nhật danh mục dịch vụ.");
      }

      fetchDanhMuc();
    } catch (error) {
      console.error("Lỗi cập nhật danh mục dịch vụ:", error);
    }
  };

  useEffect(() => {
    fetchDanhMuc();
  }, [fetchDanhMuc]);

  const totalPages = Math.ceil(danhMucList.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = danhMucList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

  return (
    <main className="flex-1 bg-[#F8FAFC] py-8 px-[100px]">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A]">Quản lý Danh mục Dịch vụ</h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Sắp xếp và quản lý phân loại dịch vụ cho cửa hàng.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-[#0B3C6D] px-4 py-2 text-white hover:opacity-90"
        >
          + Thêm danh mục
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <p className="text-sm text-gray-400">
            Hiển thị {currentData.length} / {danhMucList.length} danh mục
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] text-[#94A3B8]">
              <tr className="text-left">
                <th className="px-6 py-4 font-medium">Tên danh mục</th>
                <th className="px-6 py-4 text-center font-medium">Số lượng dịch vụ</th>
                <th className="px-6 py-4 text-center font-medium">Trạng thái</th>
                <th className="px-6 py-4 text-center font-medium">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center">
                    Không có danh mục
                  </td>
                </tr>
              ) : (
                currentData.map((item) => (
                  <tr key={item.Id_category_service} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-[#0F172A]">{item.Name}</td>

                    <td className="px-6 py-4 text-center">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                        {item.total_services ?? 0} dịch vụ
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      {item.Is_active === 1 ? (
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600">
                          Hoạt động
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
                          Không hoạt động
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          title="Sửa danh mục"
                          aria-label="Sửa danh mục"
                          className="rounded-md border border-slate-200 px-3 py-1 text-sm text-blue-600 hover:bg-gray-50"
                        >
                          <i className="fa-regular fa-pen-to-square" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(item.Id_category_service)}
                          title={item.Is_active === 1 ? "Ẩn danh mục" : "Hiện danh mục"}
                          aria-label={item.Is_active === 1 ? "Ẩn danh mục" : "Hiện danh mục"}
                          className={`rounded-md border border-slate-200 px-3 py-1 text-sm hover:bg-gray-50 ${
                            item.Is_active === 1 ? "text-red-500" : "text-green-600"
                          }`}
                        >
                          <i
                            className={`fa-regular ${
                              item.Is_active === 1 ? "fa-eye-slash" : "fa-eye"
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end border-t border-slate-200 px-6 py-4 gap-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            className="rounded-lg border border-slate-200 px-4 py-2 disabled:opacity-50 text-sm hover:bg-slate-50 transition"
          >
            Sau
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[400px] rounded-xl bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">Thêm danh mục mới</h3>

            <input
              type="text"
              placeholder="Nhập tên danh mục..."
              value={newCategoryName}
              onChange={(e) => {
                setNewCategoryName(e.target.value);
                setCategoryError("");
              }}
              className={`w-full rounded-md border px-3 py-2 ${categoryError ? 'border-red-500 mb-1' : 'border-slate-300 mb-4'}`}
            />
            {categoryError && <p className="text-red-500 text-xs mb-4">{categoryError}</p>}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setCategoryError("");
                }}
                className="rounded-md border border-slate-200 px-4 py-2"
              >
                Hủy
              </button>

              <button
                onClick={handleAddCategory}
                className="rounded-md bg-[#0B3C6D] px-4 py-2 text-white"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
