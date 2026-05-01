"use client";

import { toast } from "../../component/Toast";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DichVu, ComboDichVu } from "@/types/index";
import ComboModal, { type ComboEdit } from "../../component/CombodichvuForm";
import DichVuForm from "../../component/DichVuForm";
import { API_BASE, authorizedAdminFetch, clearAdminSession } from "@/app/lib/admin-auth";

const ITEMS_PER_PAGE = 8;

type PaginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

type PagedResponse<T> = {
  data?: T[];
  pagination?: Partial<PaginationMeta>;
};

type ComboDetailData = ComboDichVu & {
  services: DichVu[];
};

const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  limit: ITEMS_PER_PAGE,
  totalItems: 0,
  totalPages: 0,
};

const normalizePagedPayload = <T,>(
  payload: unknown
): { data: T[]; pagination: PaginationMeta } => {
  if (Array.isArray(payload)) {
    const totalItems = payload.length;
    return {
      data: payload as T[],
      pagination: {
        page: 1,
        limit: ITEMS_PER_PAGE,
        totalItems,
        totalPages: totalItems > 0 ? 1 : 0,
      },
    };
  }

  const parsed = payload as PagedResponse<T> | null;
  const data = Array.isArray(parsed?.data) ? parsed.data : [];
  const limit = Number(parsed?.pagination?.limit || ITEMS_PER_PAGE);
  const totalItems = Number(parsed?.pagination?.totalItems ?? data.length);
  const totalPages = Number(
    parsed?.pagination?.totalPages ??
      (totalItems > 0 ? Math.ceil(totalItems / Math.max(limit, 1)) : 0)
  );
  const page = Number(parsed?.pagination?.page || 1);

  return {
    data,
    pagination: {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) && limit > 0 ? limit : ITEMS_PER_PAGE,
      totalItems: Number.isFinite(totalItems) && totalItems >= 0 ? totalItems : 0,
      totalPages: Number.isFinite(totalPages) && totalPages >= 0 ? totalPages : 0,
    },
  };
};

const buildPageList = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: number[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    pages.push(-1);
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) {
    pages.push(-2);
  }

  pages.push(totalPages);
  return pages;
};

const parseDescriptionLines = (description: string | null | undefined): string[] =>
  String(description || "")
    .split(/\r?\n+/)
    .map((line) => line.replace(/^[•*\-\u2022]+\s*/u, "").trim())
    .filter(Boolean);

export default function DichVuComboPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dichvu" | "combo">("dichvu");
  const [dichVuList, setDichVuList] = useState<DichVu[]>([]);
  const [comboList, setComboList] = useState<ComboDichVu[]>([]);
  const [allServicesForCombo, setAllServicesForCombo] = useState<DichVu[]>([]);
  const [loading, setLoading] = useState(true);

  const [servicePage, setServicePage] = useState(1);
  const [comboPage, setComboPage] = useState(1);
  const [servicePagination, setServicePagination] =
    useState<PaginationMeta>(EMPTY_PAGINATION);
  const [comboPagination, setComboPagination] =
    useState<PaginationMeta>(EMPTY_PAGINATION);

  const [openComboModal, setOpenComboModal] = useState(false);
  const [openDichVuModal, setOpenDichVuModal] = useState(false);
  const [editingService, setEditingService] = useState<DichVu | null>(null);
  const [editingCombo, setEditingCombo] = useState<ComboEdit | null>(null);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [detailType, setDetailType] = useState<"dichvu" | "combo" | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [serviceDetail, setServiceDetail] = useState<DichVu | null>(null);
  const [comboDetail, setComboDetail] = useState<ComboDetailData | null>(null);

  const handleUnauthorized = useCallback(() => {
    clearAdminSession();
    router.replace("/admin/login");
  }, [router]);

  const authorizedFetch = useCallback(
    (input: string, init: RequestInit = {}) =>
      authorizedAdminFetch(input, init, handleUnauthorized),
    [handleUnauthorized]
  );

  const fetchData = useCallback(
    async (targetPages?: { servicePage?: number; comboPage?: number }) => {
      const requestedServicePage = targetPages?.servicePage ?? servicePage;
      const requestedComboPage = targetPages?.comboPage ?? comboPage;

      try {
        setLoading(true);

        const [dvRes, cbRes, allServiceRes] = await Promise.all([
          authorizedFetch(
            `${API_BASE}/api/dichvu?page=${requestedServicePage}&limit=${ITEMS_PER_PAGE}&paginate=1`
          ),
          authorizedFetch(
            `${API_BASE}/api/combodichvu?page=${requestedComboPage}&limit=${ITEMS_PER_PAGE}&paginate=1`
          ),
          authorizedFetch(`${API_BASE}/api/dichvu?paginate=0`),
        ]);

        if (!dvRes.ok) throw new Error("Fetch dịch vụ thất bại");
        if (!cbRes.ok) throw new Error("Fetch combo thất bại");
        if (!allServiceRes.ok) throw new Error("Fetch danh sách dịch vụ thất bại");

        const dvData = await dvRes.json();
        const cbData = await cbRes.json();
        const allServiceData = await allServiceRes.json();

        const normalizedServices = normalizePagedPayload<DichVu>(dvData);
        const normalizedCombos = normalizePagedPayload<ComboDichVu>(cbData);

        setDichVuList(normalizedServices.data);
        setComboList(normalizedCombos.data);
        setServicePagination(normalizedServices.pagination);
        setComboPagination(normalizedCombos.pagination);
        setAllServicesForCombo(
          Array.isArray(allServiceData) ? allServiceData : normalizedServices.data
        );

        if (
          normalizedServices.pagination.totalPages > 0 &&
          requestedServicePage > normalizedServices.pagination.totalPages
        ) {
          setServicePage(normalizedServices.pagination.totalPages);
        }

        if (
          normalizedCombos.pagination.totalPages > 0 &&
          requestedComboPage > normalizedCombos.pagination.totalPages
        ) {
          setComboPage(normalizedCombos.pagination.totalPages);
        }
      } catch (error) {
        console.error("Lỗi fetch dữ liệu:", error);
        setDichVuList([]);
        setComboList([]);
        setAllServicesForCombo([]);
        setServicePagination(EMPTY_PAGINATION);
        setComboPagination(EMPTY_PAGINATION);
      } finally {
        setLoading(false);
      }
    },
    [authorizedFetch, servicePage, comboPage]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatPrice = (price?: number) => {
    const numeric = Number(price || 0);
    return `${numeric.toLocaleString("vi-VN")}đ`;
  };

  const renderSalePrice = (sale?: number) => {
    if (!sale || sale === 0) return "-";
    return `${sale}%`;
  };

  const renderStatus = (status?: number) => {
    if (status === 1) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs text-[#059669]">
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
          Hoạt động
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs text-orange-500">
        <span className="h-2 w-2 rounded-full bg-orange-500"></span>
        Tạm ngưng
      </span>
    );
  };

  const resolveImage = (imageUrl?: string | null) => {
    if (!imageUrl) return "/no-image.png";
    if (String(imageUrl).startsWith("http")) return String(imageUrl);
    return `${API_BASE}${imageUrl}`;
  };

  const openServiceDetailModal = async (serviceId: number) => {
    try {
      setDetailLoading(true);
      setDetailType("dichvu");
      setOpenDetailModal(true);
      setComboDetail(null);

      const response = await authorizedFetch(`${API_BASE}/api/dichvu/${serviceId}`);
      if (!response.ok) {
        throw new Error("Không thể tải chi tiết dịch vụ");
      }

      const payload = (await response.json()) as DichVu;
      setServiceDetail(payload);
    } catch (error) {
      console.error("Lỗi mở chi tiết dịch vụ:", error);
      setOpenDetailModal(false);
      toast.error("Không thể tải chi tiết dịch vụ.");
    } finally {
      setDetailLoading(false);
    }
  };

  const openComboDetailModal = async (comboId: number) => {
    try {
      setDetailLoading(true);
      setDetailType("combo");
      setOpenDetailModal(true);
      setServiceDetail(null);

      const response = await authorizedFetch(`${API_BASE}/api/combodichvu/${comboId}`);
      if (!response.ok) {
        throw new Error("Không thể tải chi tiết combo");
      }

      const payload = (await response.json()) as ComboDetailData;
      setComboDetail({
        ...payload,
        services: Array.isArray(payload.services) ? payload.services : [],
      });
    } catch (error) {
      console.error("Lỗi mở chi tiết combo:", error);
      setOpenDetailModal(false);
      toast.error("Không thể tải chi tiết combo.");
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleServiceStatus = async (id: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;

      const res = await authorizedFetch(`${API_BASE}/api/dichvu/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ Status: newStatus }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message || "Đổi trạng thái dịch vụ thất bại");
      }

      await fetchData();
    } catch (error) {
      console.error("Lỗi đổi trạng thái dịch vụ:", error);
      toast.error(error instanceof Error ? error.message : "Không thể đổi trạng thái dịch vụ");
    }
  };

  const toggleComboStatus = async (id: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;

      const res = await authorizedFetch(`${API_BASE}/api/combodichvu/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ Status: newStatus }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message || payload?.error || "Đổi trạng thái combo thất bại");
      }

      await fetchData();
    } catch (error) {
      console.error("Lỗi đổi trạng thái combo:", error);
      toast.error(error instanceof Error ? error.message : "Không thể đổi trạng thái combo");
    }
  };

  const openEditComboModal = async (comboId: number) => {
    try {
      const response = await authorizedFetch(`${API_BASE}/api/combodichvu/${comboId}`);

      if (!response.ok) {
        throw new Error("Không thể lấy chi tiết combo");
      }

      const combo = (await response.json()) as ComboEdit;
      setEditingCombo(combo);
      setOpenComboModal(true);
    } catch (error) {
      console.error("Lỗi mở form chỉnh sửa combo:", error);
      toast.error("Không thể tải dữ liệu combo để chỉnh sửa.");
    }
  };

  const refreshAfterMutation = useCallback(async () => {
    setServicePage(1);
    setComboPage(1);
    await fetchData({ servicePage: 1, comboPage: 1 });
  }, [fetchData]);

  const activePagination = activeTab === "dichvu" ? servicePagination : comboPagination;
  const pageList = useMemo(
    () => buildPageList(activePagination.page, activePagination.totalPages),
    [activePagination.page, activePagination.totalPages]
  );

  const handleSwitchTab = (tab: "dichvu" | "combo") => {
    setActiveTab(tab);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1) return;

    if (activeTab === "dichvu") {
      if (nextPage > servicePagination.totalPages && servicePagination.totalPages !== 0) {
        return;
      }
      setServicePage(nextPage);
      return;
    }

    if (nextPage > comboPagination.totalPages && comboPagination.totalPages !== 0) {
      return;
    }
    setComboPage(nextPage);
  };

  const closeDetailModal = () => {
    setOpenDetailModal(false);
    setDetailType(null);
    setServiceDetail(null);
    setComboDetail(null);
    setDetailLoading(false);
  };

  const visibleCount = activeTab === "dichvu" ? dichVuList.length : comboList.length;
  const emptyMessage = activeTab === "dichvu" ? "Không có dịch vụ" : "Không có combo";
  const comboDescriptionLines = useMemo(() => {
    const fromDescription = parseDescriptionLines(comboDetail?.Description);
    if (fromDescription.length > 0) {
      return fromDescription;
    }

    if (!comboDetail?.services?.length) {
      return [];
    }

    return comboDetail.services
      .map((service) => String(service.Name || "").trim())
      .filter(Boolean);
  }, [comboDetail]);

  return (
    <main className="flex-1 bg-white px-[100px] py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#003366]">Quản lý Dịch vụ & Combo</h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Cập nhật và điều chỉnh các gói dịch vụ làm đẹp của 25Zone.
          </p>
        </div>

        <button
          onClick={() =>
            activeTab === "combo"
              ? (setEditingCombo(null), setOpenComboModal(true))
              : (setEditingService(null), setOpenDichVuModal(true))
          }
          className="flex items-center gap-2 rounded-lg bg-[#0B3C6D] px-5 py-2.5 text-white hover:opacity-90"
        >
          <i className="fa-solid fa-plus"></i>
          {activeTab === "dichvu" ? "Thêm dịch vụ mới" : "Thêm combo"}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex h-[52px] items-center border-b border-slate-200 px-6">
          <button
            onClick={() => handleSwitchTab("dichvu")}
            className={`h-full w-[163px] border-b-2 text-[14px] font-medium ${
              activeTab === "dichvu"
                ? "border-[#0B3C6D] text-[#0B3C6D]"
                : "border-transparent text-[#94A3B8]"
            }`}
          >
            Dịch vụ đơn lẻ
          </button>

          <button
            onClick={() => handleSwitchTab("combo")}
            className={`h-full w-[200px] text-[14px] ${
              activeTab === "combo"
                ? "border-b-2 border-[#0B3C6D] text-[#0B3C6D]"
                : "text-[#94A3B8]"
            }`}
          >
            Gói Combo trọn gói
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <p className="text-sm text-gray-400">
            Hiển thị {visibleCount} / {activePagination.totalItems}{" "}
            {activeTab === "dichvu" ? "dịch vụ" : "combo"}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-[#94A3B8]">
              <tr className="text-center">
                <th className="px-6 py-4">Hình ảnh</th>
                <th className="px-6 py-4">Tên</th>
                <th className="px-6 py-4">Danh mục</th>
                <th className="px-6 py-4">Giá niêm yết</th>
                <th className="px-6 py-4">Khuyến mãi</th>
                <th className="px-6 py-4">Thời lượng</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F1F5F9]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : activeTab === "dichvu" ? (
                dichVuList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500">
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  dichVuList.map((dv) => (
                    <tr
                      key={dv.Id_services}
                      className="text-center transition hover:bg-gray-50"
                    >
                      <td className="flex justify-center px-6 py-4">
                        <img
                          src={dv.Image_URL ? `${API_BASE}${dv.Image_URL}` : "/no-image.png"}
                          alt={dv.Name}
                          className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                        />
                      </td>

                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => openServiceDetailModal(dv.Id_services)}
                          className="font-bold text-[#003366] hover:text-blue-600 hover:underline"
                        >
                          {dv.Name || "Không có tên"}
                        </button>
                      </td>

                      <td className="px-6 py-4">{dv.category_name || `ID: ${dv.Id_category}`}</td>

                      <td className="px-6 py-4 font-bold text-[#003366]">{formatPrice(dv.Price)}</td>

                      <td className="px-6 py-4 text-gray-400">{renderSalePrice(dv.Sale_Price)}</td>

                      <td className="px-6 py-4 text-[#475569]">{dv.Duration_time || 0} phút</td>

                      <td className="px-6 py-4">{renderStatus(dv.Status)}</td>

                      <td className="space-x-3 px-6 py-4 text-gray-500">
                        <i
                          className="fa-solid fa-circle-info cursor-pointer hover:text-blue-600"
                          title="Xem chi tiết"
                          onClick={() => openServiceDetailModal(dv.Id_services)}
                        />
                        <i
                          className="fa-regular fa-pen-to-square cursor-pointer hover:text-blue-600"
                          onClick={() => {
                            setEditingService(dv);
                            setOpenDichVuModal(true);
                          }}
                        ></i>

                        <i
                          className={`fa-regular ${
                            dv.Status === 1 ? "fa-eye" : "fa-eye-slash"
                          } cursor-pointer hover:text-blue-600`}
                          title="Đổi trạng thái"
                          onClick={() => toggleServiceStatus(dv.Id_services, dv.Status)}
                        />
                      </td>
                    </tr>
                  ))
                )
              ) : comboList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                comboList.map((cb) => (
                  <tr key={cb.Id_combo} className="text-center transition hover:bg-gray-50">
                    <td className="flex justify-center px-6 py-4">
                      <img
                        src={
                          cb.Image_URL
                            ? cb.Image_URL.startsWith("http")
                              ? cb.Image_URL
                              : `${API_BASE}${cb.Image_URL}`
                            : "/no-image.png"
                        }
                        alt="Combo"
                        className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                      />
                    </td>

                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => openComboDetailModal(cb.Id_combo)}
                        className="font-bold text-[#003366] hover:text-blue-600 hover:underline"
                      >
                        {cb.Name}
                      </button>
                    </td>

                    <td className="px-6 py-4">Combo dịch vụ</td>

                    <td className="px-6 py-4 font-bold text-[#003366]">{formatPrice(cb.Price)}</td>

                    <td className="px-6 py-4 text-gray-400">-</td>

                    <td className="px-6 py-4 text-[#475569]">{cb.Duration_time} phút</td>

                    <td className="px-6 py-4">{renderStatus(cb.Status)}</td>

                    <td className="space-x-3 px-6 py-4 text-gray-500">
                      <i
                        className="fa-solid fa-circle-info cursor-pointer hover:text-blue-600"
                        title="Xem chi tiết"
                        onClick={() => openComboDetailModal(cb.Id_combo)}
                      />
                      <i
                        className="fa-regular fa-pen-to-square cursor-pointer hover:text-blue-600"
                        onClick={() => openEditComboModal(cb.Id_combo)}
                      />
                      <i
                        className={`fa-regular ${
                          cb.Status === 1 ? "fa-eye" : "fa-eye-slash"
                        } cursor-pointer hover:text-blue-600`}
                        onClick={() => toggleComboStatus(cb.Id_combo, cb.Status)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <button
            disabled={activePagination.page <= 1}
            onClick={() => handlePageChange(activePagination.page - 1)}
            className="rounded-lg border border-slate-200 px-4 py-2 disabled:opacity-50"
          >
            Trước
          </button>

          <div className="flex items-center gap-2">
            {pageList.map((page, index) =>
              page < 0 ? (
                <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`h-9 w-9 rounded-lg ${
                    activePagination.page === page
                      ? "bg-[#0B3C6D] text-white"
                      : "border border-slate-200"
                  }`}
                >
                  {page}
                </button>
              )
            )}
          </div>

          <button
            disabled={
              activePagination.totalPages === 0 ||
              activePagination.page >= activePagination.totalPages
            }
            onClick={() => handlePageChange(activePagination.page + 1)}
            className="rounded-lg border border-slate-200 px-4 py-2 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </div>

      {openDetailModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[86vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <h3 className="text-lg font-bold text-[#003366]">
                {detailType === "dichvu" ? "Chi tiết dịch vụ" : "Chi tiết combo"}
              </h3>
              <button
                type="button"
                onClick={closeDetailModal}
                className="h-8 w-8 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {detailLoading ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500">
                Đang tải chi tiết...
              </div>
            ) : detailType === "dichvu" && serviceDetail ? (
              <div className="space-y-6 px-6 py-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
                  <img
                    src={resolveImage(serviceDetail.Image_URL)}
                    alt={serviceDetail.Name}
                    className="h-[220px] w-[220px] rounded-xl border border-slate-200 object-cover"
                  />

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Dịch vụ lẻ
                      </p>
                      <h4 className="mt-1 text-2xl font-bold text-[#003366]">
                        {serviceDetail.Name}
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-slate-500">Danh mục</p>
                        <p className="font-semibold text-slate-800">
                          {serviceDetail.category_name || `ID: ${serviceDetail.Id_category}`}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-slate-500">Trạng thái</p>
                        <div className="mt-1">{renderStatus(serviceDetail.Status)}</div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-slate-500">Giá niêm yết</p>
                        <p className="font-semibold text-slate-800">
                          {formatPrice(serviceDetail.Price)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-slate-500">Khuyến mãi</p>
                        <p className="font-semibold text-slate-800">
                          {renderSalePrice(serviceDetail.Sale_Price)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                      <p className="text-slate-500">Thời lượng</p>
                      <p className="font-semibold text-slate-800">
                        {serviceDetail.Duration_time || 0} phút
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                  <p className="mb-2 text-sm font-semibold text-slate-700">Mô tả dịch vụ</p>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {serviceDetail.Description?.trim() || "Chưa có mô tả cho dịch vụ này."}
                  </p>
                </div>
              </div>
            ) : detailType === "combo" && comboDetail ? (
              <div className="space-y-6 px-6 py-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
                  <img
                    src={resolveImage(comboDetail.Image_URL)}
                    alt={comboDetail.Name}
                    className="h-[220px] w-[220px] rounded-xl border border-slate-200 object-cover"
                  />

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Combo trọn gói
                      </p>
                      <h4 className="mt-1 text-2xl font-bold text-[#003366]">
                        {comboDetail.Name}
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-slate-500">Tổng giá</p>
                        <p className="font-semibold text-slate-800">
                          {formatPrice(comboDetail.Price)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-slate-500">Thời lượng</p>
                        <p className="font-semibold text-slate-800">
                          {comboDetail.Duration_time || 0} phút
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-slate-500">Số dịch vụ</p>
                        <p className="font-semibold text-slate-800">
                          {comboDetail.services.length}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-slate-500">Trạng thái</p>
                        <div className="mt-1">{renderStatus(comboDetail.Status)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                  <p className="mb-3 text-sm font-semibold text-slate-700">Mô tả combo</p>
                  {comboDescriptionLines.length === 0 ? (
                    <p className="text-sm leading-relaxed text-slate-500">
                      Chưa có mô tả cho combo này.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {comboDescriptionLines.map((line, index) => (
                        <div
                          key={`${comboDetail.Id_combo}-desc-${index}`}
                          className="flex items-start gap-2 text-sm text-slate-700"
                        >
                          <i className="fa-solid fa-circle-check mt-0.5 text-emerald-500" />
                          <span>{line}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                  <p className="mb-3 text-sm font-semibold text-slate-700">
                    Danh sách dịch vụ trong combo
                  </p>

                  {comboDetail.services.length === 0 ? (
                    <p className="text-sm text-slate-500">Combo chưa có dịch vụ.</p>
                  ) : (
                    <div className="space-y-3">
                      {comboDetail.services.map((service) => (
                        <div
                          key={service.Id_services}
                          className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
                        >
                          <img
                            src={resolveImage(service.Image_URL)}
                            alt={service.Name}
                            className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-slate-800">
                              {service.Name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {service.category_name || `ID: ${service.Id_category}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">
                              {service.Duration_time || 0} phút
                            </p>
                            <p className="font-semibold text-[#003366]">
                              {formatPrice(service.Price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-sm text-slate-500">
                Không có dữ liệu chi tiết.
              </div>
            )}
          </div>
        </div>
      ) : null}

      <ComboModal
        open={openComboModal}
        onClose={() => {
          setOpenComboModal(false);
          setEditingCombo(null);
        }}
        dichVuList={allServicesForCombo}
        onCreated={refreshAfterMutation}
        comboEdit={editingCombo}
      />

      <DichVuForm
        open={openDichVuModal}
        onClose={() => {
          setOpenDichVuModal(false);
          setEditingService(null);
        }}
        onCreated={refreshAfterMutation}
        initialData={editingService}
      />
    </main>
  );
}
