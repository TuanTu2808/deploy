"use client";

import { toast } from "./Toast";
import { useState, useEffect, useMemo, useCallback, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { DichVu } from "@/types";
import { API_BASE, authorizedAdminFetch, clearAdminSession } from "@/app/lib/admin-auth";

export interface ComboEdit {
  Id_combo: number;
  Name: string;
  Status: number;
  Image_URL?: string | null;
  services: DichVu[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  dichVuList: DichVu[];
  onCreated: () => void | Promise<void>;
  comboEdit?: ComboEdit | null;
}

type GroupedServices = Record<string, DichVu[]>;

const toAbsoluteImage = (url?: string | null) => {
  const value = String(url || "").trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${API_BASE}${value}`;
};

const normalizeText = (value: string | null | undefined) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getServiceCategoryKey = (service: DichVu) => Number(service.Id_category || 0);

const formatPrice = (value: number) =>
  `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const getStatusLabel = (status: number) => (status === 1 ? "Đang hoạt động" : "Tạm ngưng");

export default function ComboModal({
  open,
  onClose,
  dichVuList,
  onCreated,
  comboEdit,
}: Props) {
  const router = useRouter();
  const isEdit = Boolean(comboEdit);

  const [name, setName] = useState<string>("");
  const [status, setStatus] = useState<number>(1);
  const [selectedServices, setSelectedServices] = useState<DichVu[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [serviceKeyword, setServiceKeyword] = useState<string>("");
  const [selectedKeyword, setSelectedKeyword] = useState<string>("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const handleUnauthorized = useCallback(() => {
    clearAdminSession();
    router.replace("/admin/login");
  }, [router]);

  const authorizedFetch = useCallback(
    (input: string, init: RequestInit = {}) =>
      authorizedAdminFetch(input, init, handleUnauthorized),
    [handleUnauthorized]
  );

  useEffect(() => {
    if (!open) return;

    if (comboEdit) {
      setName(comboEdit.Name ?? "");
      setStatus(comboEdit.Status ?? 1);
      setImageFile(null);
      setImagePreview(toAbsoluteImage(comboEdit.Image_URL));
      setSelectedServices(
        Array.from(
          new Map(
            (comboEdit.services || []).map((service) => [service.Id_services, service])
          ).values()
        )
      );
    } else {
      setName("");
      setStatus(1);
      setImageFile(null);
      setImagePreview("");
      setSelectedServices([]);
    }

    setServiceKeyword("");
    setSelectedKeyword("");
  }, [comboEdit, open]);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const grouped: GroupedServices = useMemo(() => {
    const source = [...dichVuList].sort((left, right) => {
      const categoryDiff = (left.category_name || "Khác").localeCompare(
        right.category_name || "Khác",
        "vi",
        { sensitivity: "base" }
      );
      if (categoryDiff !== 0) return categoryDiff;
      return left.Name.localeCompare(right.Name, "vi", { sensitivity: "base" });
    });

    return source.reduce((acc: GroupedServices, service: DichVu) => {
      const categoryName = service.category_name?.trim() || "Khác";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(service);
      return acc;
    }, {});
  }, [dichVuList]);

  const categoryNames = useMemo(() => Object.keys(grouped), [grouped]);

  useEffect(() => {
    if (!open) return;
    if (categoryNames.length === 0) {
      setExpandedCategories([]);
      return;
    }

    setExpandedCategories((prev) => {
      const kept = prev.filter((category) => categoryNames.includes(category));
      if (kept.length > 0) return kept;
      return [categoryNames[0]];
    });
  }, [open, categoryNames]);

  const selectedServiceIds = useMemo(
    () => new Set(selectedServices.map((service) => service.Id_services)),
    [selectedServices]
  );

  const selectedCategoryMap = useMemo(() => {
    const next = new Map<number, DichVu>();

    selectedServices.forEach((service) => {
      const categoryKey = getServiceCategoryKey(service);
      if (!next.has(categoryKey)) {
        next.set(categoryKey, service);
      }
    });

    return next;
  }, [selectedServices]);

  const filteredGrouped = useMemo(() => {
    const keyword = normalizeText(serviceKeyword);
    if (!keyword) return grouped;

    const next: GroupedServices = {};
    Object.entries(grouped).forEach(([category, services]) => {
      const matched = services.filter((service) =>
        normalizeText(`${service.Name} ${category} ${service.Description || ""}`).includes(
          keyword
        )
      );
      if (matched.length > 0) {
        next[category] = matched;
      }
    });
    return next;
  }, [grouped, serviceKeyword]);

  const filteredSelectedServices = useMemo(() => {
    const keyword = normalizeText(selectedKeyword);
    if (!keyword) return selectedServices;

    return selectedServices.filter((service) =>
      normalizeText(
        `${service.Name} ${service.category_name || "Khác"} ${service.Description || ""}`
      ).includes(keyword)
    );
  }, [selectedServices, selectedKeyword]);

  const totalPrice = useMemo(
    () =>
      selectedServices.reduce((sum, service) => {
        return sum + Number(service.Price || 0);
      }, 0),
    [selectedServices]
  );

  const totalDuration = useMemo(
    () =>
      selectedServices.reduce((sum, service) => {
        return sum + Number(service.Duration_time || 0);
      }, 0),
    [selectedServices]
  );

  if (!open) return null;

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    if (imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  };

  const addService = (service: DichVu) => {
    if (service.Status !== 1) return;
    setSelectedServices((prev) => {
      if (prev.some((item) => item.Id_services === service.Id_services)) return prev;
      if (prev.some((item) => getServiceCategoryKey(item) === getServiceCategoryKey(service))) {
        alert(
          `Danh mục "${service.category_name || "Khác"}" đã có dịch vụ trong combo. Mỗi danh mục chỉ chọn 1 dịch vụ.`
        );
        return prev;
      }

      return [...prev, service];
    });
  };

  const removeService = (serviceId: number) => {
    setSelectedServices((prev) =>
      prev.filter((service) => service.Id_services !== serviceId)
    );
  };

  const clearSelectedServices = () => {
    setSelectedServices([]);
  };

  const handleSubmit = async (): Promise<void> => {
    try {
      setLoading(true);

      const serviceIds = selectedServices.map((service) => service.Id_services);

      if (!name.trim()) {
        toast.error("Vui lòng nhập tên combo");
        return;
      }

      if (serviceIds.length === 0) {
        toast.error("Vui lòng chọn ít nhất 1 dịch vụ cho combo");
        return;
      }

      if (!imageFile && !imagePreview) {
        toast.error("Vui lòng chọn ảnh combo");
        return;
      }

      const url = isEdit
        ? `${API_BASE}/api/combodichvu/${comboEdit!.Id_combo}`
        : `${API_BASE}/api/combodichvu`;
      const method = isEdit ? "PUT" : "POST";

      const formData = new FormData();
      formData.append("Name", name.trim());
      formData.append("Price", String(totalPrice));
      formData.append("Duration_time", String(totalDuration));
      formData.append("Status", String(status));
      formData.append("services", JSON.stringify(serviceIds));

      if (imageFile) {
        formData.append("Image", imageFile);
      } else if (comboEdit?.Image_URL) {
        formData.append("Image_URL", comboEdit.Image_URL);
      }

      const response = await authorizedFetch(url, {
        method,
        body: formData,
      });

      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        if (contentType?.includes("application/json")) {
          const payload = await response.json();
          throw new Error(payload.message || payload.error || "Lưu combo thất bại");
        }
        throw new Error("Không thể lưu combo, vui lòng kiểm tra API backend");
      }

      toast.success(isEdit ? "Cập nhật combo thành công!" : "Tạo combo thành công!");
      await onCreated();
      onClose();
    } catch (error) {
      console.error("Lỗi submit combo:", error);
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra khi lưu combo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="flex max-h-[92vh] w-[min(1240px,95vw)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-[#003366]">
              {isEdit ? "Chỉnh sửa Gói combo" : "Thêm Gói combo"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Thiết lập thông tin combo và chọn dịch vụ ở khu vực bên trái.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <section className="rounded-2xl bg-slate-50/80 p-5">
            <h4 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              Thông tin combo
            </h4>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <label className="text-sm font-medium text-slate-700">Tên combo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ví dụ: Shine Cut Premium"
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-[#0B3C6D] focus:ring-2 focus:ring-[#0B3C6D]/15"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Trạng thái</label>
                <select
                  value={status}
                  onChange={(event) => setStatus(Number(event.target.value))}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-[#0B3C6D] focus:ring-2 focus:ring-[#0B3C6D]/15"
                >
                  <option value={1}>Hoạt động</option>
                  <option value={0}>Tạm ngưng</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="text-sm font-medium text-slate-700">Ảnh combo *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Khuyến nghị ảnh tỉ lệ ngang, dung lượng dưới 5MB.
                </p>
              </div>

              <div className="flex items-end justify-start lg:justify-center">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview combo"
                    className="h-[110px] w-[110px] rounded-xl border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex h-[110px] w-[110px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
                    Chưa có ảnh
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl bg-slate-50/80 p-4">
              <div className="px-1 py-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wide text-[#003366]">
                    Dịch vụ theo danh mục
                  </h4>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {Object.values(filteredGrouped).reduce(
                      (sum, services) => sum + services.length,
                      0
                    )}{" "}
                    dịch vụ
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Mỗi danh mục chỉ được chọn 1 dịch vụ trong combo.
                </p>
                <div className="mt-3 relative">
                  <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                  <input
                    type="text"
                    value={serviceKeyword}
                    onChange={(event) => setServiceKeyword(event.target.value)}
                    placeholder="Tìm dịch vụ theo tên, mô tả..."
                    className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#0B3C6D] focus:ring-2 focus:ring-[#0B3C6D]/15"
                  />
                </div>
              </div>

              <div className="max-h-[460px] overflow-y-auto pr-1">
                {Object.keys(filteredGrouped).length === 0 ? (
                  <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-500">
                    Không có dịch vụ phù hợp với từ khóa tìm kiếm.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(filteredGrouped).map(([category, services]) => {
                      const isExpanded = expandedCategories.includes(category);
                      const selectedCount = services.filter((service) =>
                        selectedServiceIds.has(service.Id_services)
                      ).length;

                      return (
                        <div key={category} className="rounded-xl bg-white px-3 py-3 shadow-sm ring-1 ring-inset ring-slate-100">
                          <button
                            type="button"
                            onClick={() => toggleCategory(category)}
                            className="flex w-full items-center justify-between gap-3 text-left"
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{category}</p>
                              <p className="text-xs text-slate-500">
                                {services.length} dịch vụ • đã chọn {selectedCount}
                              </p>
                            </div>
                            <i
                              className={`fa-solid fa-chevron-down text-xs text-slate-400 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {isExpanded ? (
                            <div className="space-y-2 pt-3">
                              {services.map((service) => {
                                const alreadySelected = selectedServiceIds.has(
                                  service.Id_services
                                );
                                const inactive = service.Status !== 1;
                                const selectedCategoryService = selectedCategoryMap.get(
                                  getServiceCategoryKey(service)
                                );
                                const hasCategoryConflict = Boolean(
                                  selectedCategoryService &&
                                    selectedCategoryService.Id_services !== service.Id_services
                                );
                                const disableAdd = alreadySelected || inactive || hasCategoryConflict;
                                const imageSrc =
                                  toAbsoluteImage(service.Image_URL) || "/no-image.png";

                                return (
                                  <div
                                    key={service.Id_services}
                                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                                      alreadySelected
                                        ? "bg-emerald-50/70 ring-1 ring-inset ring-emerald-200"
                                        : hasCategoryConflict
                                        ? "bg-amber-50/70 ring-1 ring-inset ring-amber-200"
                                        : "bg-white ring-1 ring-inset ring-slate-100 hover:ring-[#0B3C6D]/25"
                                    }`}
                                  >
                                    <img
                                      src={imageSrc}
                                      alt={service.Name}
                                      className="h-11 w-11 shrink-0 rounded-md border border-slate-200 object-cover"
                                    />

                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-semibold text-slate-800">
                                        {service.Name}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {formatPrice(service.Price)} • {service.Duration_time || 0}{" "}
                                        phút
                                      </p>
                                      <p
                                        className={`mt-0.5 text-[11px] ${
                                          hasCategoryConflict ? "text-amber-700" : "text-slate-400"
                                        }`}
                                      >
                                        {hasCategoryConflict
                                          ? `Đã có "${selectedCategoryService?.Name}" trong nhóm này`
                                          : getStatusLabel(service.Status)}
                                      </p>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => addService(service)}
                                      disabled={disableAdd}
                                      className={`h-8 min-w-[70px] rounded-md px-2 text-xs font-semibold transition ${
                                        alreadySelected
                                          ? "cursor-not-allowed bg-emerald-100 text-emerald-700"
                                          : hasCategoryConflict
                                          ? "cursor-not-allowed bg-amber-100 text-amber-700"
                                          : inactive
                                          ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                          : "bg-[#0B3C6D] text-white hover:opacity-90"
                                      }`}
                                    >
                                      {alreadySelected
                                        ? "Đã chọn"
                                        : hasCategoryConflict
                                        ? "Trùng nhóm"
                                        : inactive
                                        ? "Ngưng"
                                        : "Chọn"}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50/80 p-4">
              <div className="px-1 py-1">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-bold uppercase tracking-wide text-[#003366]">
                    Dịch vụ trong combo
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#0B3C6D]/10 px-2.5 py-1 text-xs font-semibold text-[#0B3C6D]">
                      {selectedServices.length} dịch vụ
                    </span>
                    <button
                      type="button"
                      onClick={clearSelectedServices}
                      disabled={selectedServices.length === 0}
                      className="h-8 rounded-md border border-slate-300 px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Xóa tất cả
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Combo hiện tại đang dùng {selectedCategoryMap.size} danh mục khác nhau.
                </p>

                <div className="mt-3 relative">
                  <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                  <input
                    type="text"
                    value={selectedKeyword}
                    onChange={(event) => setSelectedKeyword(event.target.value)}
                    placeholder="Tìm trong danh sách đã chọn..."
                    className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#0B3C6D] focus:ring-2 focus:ring-[#0B3C6D]/15"
                  />
                </div>
              </div>

              <div className="max-h-[380px] overflow-y-auto pr-1">
                {filteredSelectedServices.length === 0 ? (
                  <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-500">
                    Chưa có dịch vụ nào trong combo. Hãy chọn từ danh sách bên trái.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredSelectedServices.map((service, index) => {
                      const imageSrc = toAbsoluteImage(service.Image_URL) || "/no-image.png";
                      return (
                        <div
                          key={service.Id_services}
                          className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-inset ring-slate-100"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                            {index + 1}
                          </span>

                          <img
                            src={imageSrc}
                            alt={service.Name}
                            className="h-10 w-10 shrink-0 rounded-md border border-slate-200 object-cover"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {service.Name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {service.category_name || "Khác"} •{" "}
                              {service.Duration_time || 0} phút • {formatPrice(service.Price)}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeService(service.Id_services)}
                            className="h-8 w-8 rounded-md border border-red-100 text-red-500 transition hover:bg-red-50"
                            title="Xóa khỏi combo"
                          >
                            <i className="fa-solid fa-trash-can text-xs" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-4 bg-white/70 px-1 py-1">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-inset ring-slate-100">
                    <p className="text-xs text-slate-500">Số dịch vụ</p>
                    <p className="font-semibold text-slate-800">{selectedServices.length}</p>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-inset ring-slate-100">
                    <p className="text-xs text-slate-500">Tổng thời lượng</p>
                    <p className="font-semibold text-slate-800">{totalDuration} phút</p>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-inset ring-slate-100">
                    <p className="text-xs text-slate-500">Tổng giá</p>
                    <p className="font-semibold text-[#0B3C6D]">{formatPrice(totalPrice)}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="h-10 rounded-lg bg-[#0B3C6D] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Đang lưu..." : isEdit ? "Cập nhật combo" : "Lưu combo"}
          </button>
        </div>
      </div>
    </div>
  );
}
