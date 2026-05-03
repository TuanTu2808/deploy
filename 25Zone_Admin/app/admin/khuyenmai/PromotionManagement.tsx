"use client";

import { toast } from "../../component/Toast";
import React, { useEffect, useMemo, useState } from "react";
// import Link from "next/link";
import { API_BASE, authorizedAdminFetch } from "@/app/lib/admin-auth";

const initialCampaigns: CampaignType[] = [];


const segments = [
  {
    tag: "NEW",
    tagTone: "bg-[#EEF4FF] text-[#4F7CFF]",
    title: "Khách hàng mới",
    description: "Chưa đặt lịch hẹn nào",
  },
  {
    tag: "VIP",
    tagTone: "bg-[#FFF4D8] text-[#D79A00]",
    title: "Khách hàng VIP",
    description: "Chi tiêu > 5tr/năm",
  },
  {
    tag: "LOST",
    tagTone: "bg-[#F4F4F5] text-[#64748B]",
    title: "Khách vãng lai",
    description: "> 3 tháng chưa quay lại",
  },
];

type CampaignType = {
  Id_voucher: number;
  code: string;
  codeTone: string;
  name: string;
  description: string;
  discount: string;
  usage: string;
  type: string;
  duration: string;
  status: string;
  statusTone: string;
  raw: VoucherType | BookingVoucherType;
};

type VoucherType = {
  Id_voucher: number;
  Name: string;
  Description: string;
  Voucher_Coder: string;
  Status: number;
  Min_order_value: number;
  Discount_value: number;
  Discount_type: string;
  Max_discount: number | null;
  Start_date: string | null;
  End_date: string | null;
  is_expired: boolean;
  is_not_started: boolean;
  is_active: boolean;
};

const tabs = ["Tất cả", "Đang chạy", "Sắp tới", "Đã kết thúc"];

type PromotionManagementMode = "product" | "booking" | "all";

type PromotionManagementProps = {
  mode?: PromotionManagementMode | string;
};

const getStatusLabel = (status: number) => {
  if (status === 1) return "Đang hoạt động";
  if (status === 2) return "Sắp tới";
  if (status === 3) return "Đã kết thúc";
  if (status === 0) return "Đã ẩn";
  return "Không xác định";
};

const getStatusTone = (status: number) => {
  if (status === 1) return "bg-[#DDF8EA] text-[#15803D]";
  if (status === 2) return "bg-[#FFF1D8] text-[#C28103]";
  if (status === 3) return "bg-[#EEF2F6] text-[#64748B]";
  if (status === 0) return "bg-[#F8F1F2] text-[#C92B3A]";
  return "bg-[#E2E8F0] text-[#64748B]";
};

const parseJsonResponse = async (res: Response) => {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }

  const text = await res.text();
  throw new Error(`API trả về không phải JSON (status=${res.status}): ${text.slice(0, 200)}`);
};

const getCodeTone = (code: string) =>
  code
    ? "bg-[#E9DDFB] text-[#F26B34]"
    : "bg-[#D8E5DB] text-[#5B7B67]";

const formatCurrency = (value: number | string | null | undefined) => {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return "0";
  return numeric.toLocaleString("vi-VN");
};

const formatDuration = (
  start: string | null | undefined,
  end: string | null | undefined
) => {
  if (!start && !end) return "Vô thời hạn";
  const format = (d?: string | null | undefined) => {
    if (!d) return "";
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleDateString("vi-VN");
  };
  const s = format(start);
  const e = format(end);
  if (s && e) return `${s} - ${e}`;
  if (s) return `Bắt đầu: ${s}`;
  if (e) return `Kết thúc: ${e}`;
  return "Vô thời hạn";
};

const mapVoucherToCampaign = (voucher: VoucherType): CampaignType => {
  // Tính toán status dựa trên trạng thái thực tế
  let statusNum = voucher.Status;
  if (voucher.is_expired) {
    statusNum = 3; // Đã kết thúc
  } else if (voucher.is_not_started) {
    statusNum = 2; // Sắp tới
  } else if (voucher.is_active) {
    statusNum = 1; // Đang hoạt động
  } else {
    statusNum = 0; // Đã ẩn
  }

  return {
    Id_voucher: voucher.Id_voucher,
    code: voucher.Voucher_Coder || "",
    codeTone: getCodeTone(voucher.Voucher_Coder || ""),
    name: voucher.Name || "",
    description: voucher.Description || "",
    discount:
      voucher.Discount_type === "percent"
        ? `${voucher.Discount_value || 0}%`
        : `${formatCurrency(voucher.Discount_value)} đ`,
    usage: `Min ${formatCurrency(voucher.Min_order_value)} đ`,
    type: voucher.Discount_type === "percent" ? "Giảm giá %" : "Giảm giá cố định",
    duration: formatDuration(voucher.Start_date, voucher.End_date),
    status: getStatusLabel(statusNum),
    statusTone: getStatusTone(statusNum),
    raw: voucher,
  };
};
  const normalizeBookingVoucherStatus = (status: BookingVoucherType["Status"]): number => {
  if (status === null || status === undefined) return 0;
  if (typeof status === "number" && !Number.isNaN(status)) return status;
  const normalized = String(status).trim().toLowerCase();
  if (normalized === "active") return 1;
  if (normalized === "upcoming" || normalized === "sắp tới" || normalized === "sap toi") return 2;
  if (normalized === "ended" || normalized === "đã kết thúc" || normalized === "ket thuc") return 3;
  if (normalized === "inactive" || normalized === "hidden" || normalized === "ẩn") return 0;
  const numeric = Number(normalized);
  return Number.isNaN(numeric) ? 0 : numeric;
};

const mapBookingVoucherToCampaign = (voucher: BookingVoucherType): CampaignType => {
    let statusNum = normalizeBookingVoucherStatus(voucher.Status);
    if (voucher.is_expired) {
      statusNum = 3;
    } else if (voucher.is_not_started) {
      statusNum = 2;
    } else if (voucher.is_active) {
      statusNum = 1;
    }

    return {
      Id_voucher: voucher.Id_voucher ?? voucher.id_voucher ?? 0,
      code: voucher.Voucher_code || "",
      codeTone: getCodeTone(voucher.Voucher_code || ""),
      name: voucher.Name || "",
      description: voucher.Description || "",
      discount:
        voucher.Discount_type === "percent"
          ? `${voucher.Discount_value || 0}%`
          : `${formatCurrency(voucher.Discount_value)} đ`,
      usage: `Min ${formatCurrency(voucher.Min_order_value)} đ`,
      type: voucher.Discount_type === "percent" ? "Giảm giá %" : "Giảm giá cố định",
      duration: formatDuration(voucher.Start_date, voucher.End_date),
      status: getStatusLabel(statusNum),
      statusTone: getStatusTone(statusNum),
      raw: voucher,
    };
  };type FormData = {
  Name: string;
  Description: string;
  Voucher_Coder: string;
  Status: number;
  Min_order_value: number | null;
  Discount_value: number | null;
  Discount_type: "percent" | "fixed";
  Max_discount: number | null;
  Start_date: string | null;
  End_date: string | null;
};

type BookingVoucherType = {
  id_voucher?: number;
  Id_voucher?: number;
  Name?: string;
  Description?: string;
  Voucher_code?: string;
  Status?: string | number | null;
  Min_order_value?: number | null;
  Discount_value?: number | null;
  Discount_type?: "percent" | "fixed" | string;
  Max_discount_amount?: number | null;
  Start_date?: string | null;
  End_date?: string | null;
  is_expired?: boolean;
  is_not_started?: boolean;
  is_active?: boolean;
};

type FormFieldValue = string | number | null;
type FormFieldErrors = Partial<Record<keyof FormData, string>>;

const initialFormData: FormData = {
  Name: "",
  Description: "",
  Voucher_Coder: "",
  Status: 1,
  Min_order_value: null,
  Discount_value: null,
  Discount_type: "percent",
  Max_discount: null,
  Start_date: null,
  End_date: null,
};

export default function PromotionManagement({ mode = "all" }: PromotionManagementProps) {
  const [campaigns, setCampaigns] = useState<CampaignType[]>(initialCampaigns);
  const [bookingCampaigns, setBookingCampaigns] = useState<CampaignType[]>(initialCampaigns);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedRow, setSelectedRow] = useState<CampaignType | null>(null);
  const [editingVoucherId, setEditingVoucherId] = useState<number | null>(null);
  const [editingSource, setEditingSource] = useState<"product" | "booking">(
    mode === "booking" ? "booking" : "product"
  );
  const [campaignPage, setCampaignPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);
  const [originalVoucherCode, setOriginalVoucherCode] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormFieldErrors>({});

  const minDateTimeLocal = useMemo(() => {
    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, "0");
    const DD = String(now.getDate()).padStart(2, "0");
    return `${YYYY}-${MM}-${DD}T00:00`;
  }, []);

  const stats = useMemo(() => {
    const productCount = campaigns.filter((item) => item.status === "Đang hoạt động").length;
    const bookingCount = bookingCampaigns.filter((item) => item.status === "Đang hoạt động").length;
    const runningCampaignCount =
      mode === "booking" ? bookingCount : mode === "product" ? productCount : productCount + bookingCount;

    return [
      {
        label: "CHIẾN DỊCH ĐANG CHẠY",
        value: runningCampaignCount.toString(),
        hint: "+2 so với tháng trước",
        icon: "fa-bullhorn",
        iconTone: "bg-[#E8F7FD] text-[#11A5D8]",
        hintTone: "text-[#059669]",
      },
      {
        label: "DOANH THU TỪ KM",
        value: "128.5tr đ",
        hint: "15.3% Tổng doanh thu",
        icon: "fa-wallet",
        iconTone: "bg-[#EAFBF4] text-[#10B981]",
        hintTone: "text-[#059669]",
      },
      {
        label: "TỶ LỆ SỬ DỤNG MÃ",
        value: "42.8%",
        hint: "",
        icon: "fa-qrcode",
        iconTone: "bg-[#F1EEFF] text-[#6D5EF7]",
        hintTone: "text-slate-500",
      },
    ];
  }, [campaigns, bookingCampaigns, mode]);

  const showPopup = (message: string, isError = false) => {
    const title = isError ? "Lỗi" : "Thành công";
    toast.error(`${title}: ${message}`);
  };

  const loadVouchers = async () => {
  try {
    setLoading(true);

    const res = await authorizedAdminFetch(`${API_BASE}/api/voucher?admin=true`);
    const data = await parseJsonResponse(res);

    if (!res.ok) {
      throw new Error(data?.message || `Lỗi ${res.status}`);
    }

    const mapped = data.map(mapVoucherToCampaign);
    setCampaigns(mapped);
  } catch (err: unknown) {
    console.error("Lỗi lấy voucher:", err);
    const msg = err instanceof Error ? err.message : "Lỗi server";
    setError(msg);
    showPopup(msg, true);
  } finally {
    setLoading(false);
  }
};

const loadBookingVouchers = async () => {
  try {
    setLoading(true);
    const res = await authorizedAdminFetch(`${API_BASE}/api/voucherbooking?admin=true`);
    const data = await parseJsonResponse(res);

    if (!res.ok) {
      throw new Error(data?.message || `Lỗi ${res.status}`);
    }

    const mapped = data.map(mapBookingVoucherToCampaign);
    setBookingCampaigns(mapped);
  } catch (err: unknown) {
    console.error("Lỗi lấy voucher booking:", err);
    const msg = err instanceof Error ? err.message : "Lỗi server";
    setError(msg);
    showPopup(msg, true);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (mode !== "booking") {
      loadVouchers();
    }
    if (mode !== "product") {
      loadBookingVouchers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);


  const filteredCampaigns = useMemo(() => {
    if (activeTab === 0) return campaigns;
    if (activeTab === 1) return campaigns.filter((item) => item.status === "Đang hoạt động");
    if (activeTab === 2) return campaigns.filter((item) => item.status === "Sắp tới");
    if (activeTab === 3) return campaigns.filter((item) => item.status === "Đã kết thúc");
    return campaigns;
  }, [activeTab, campaigns]);

  const filteredBookingCampaigns = useMemo(() => {
    if (activeTab === 0) return bookingCampaigns;
    if (activeTab === 1) return bookingCampaigns.filter((item) => item.status === "Đang hoạt động");
    if (activeTab === 2) return bookingCampaigns.filter((item) => item.status === "Sắp tới");
    if (activeTab === 3) return bookingCampaigns.filter((item) => item.status === "Đã kết thúc");
    return bookingCampaigns;
  }, [activeTab, bookingCampaigns]);

  const itemsPerPage = 4;
  const totalCampaignPages = Math.max(1, Math.ceil(filteredCampaigns.length / itemsPerPage));
  const totalBookingPages = Math.max(1, Math.ceil(filteredBookingCampaigns.length / itemsPerPage));

  const pagedCampaigns = filteredCampaigns.slice((campaignPage - 1) * itemsPerPage, campaignPage * itemsPerPage);
  const pagedBookingCampaigns = filteredBookingCampaigns.slice((bookingPage - 1) * itemsPerPage, bookingPage * itemsPerPage);

  useEffect(() => {
    setCampaignPage(1);
    setBookingPage(1);
  }, [activeTab, filteredCampaigns.length, filteredBookingCampaigns.length]);

  const updateStatus = async (id_voucher: number, status: number) => {
  try {
    const res = await authorizedAdminFetch(
      `${API_BASE}/api/voucher/${id_voucher}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Status: status }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Lỗi cập nhật trạng thái");
    }

    const statusText = status === 0 ? "ẩn" : status === 1 ? "đang hoạt động" : "cập nhật";
    const successMsg = `Voucher đã được chuyển sang trạng thái ${statusText}!`;
    setError(successMsg);
    showPopup(successMsg, false);

    loadVouchers();
  } catch (err: unknown) {
    console.error(err);
    const msg = err instanceof Error ? err.message : "Lỗi cập nhật trạng thái";
    setError(msg);
    showPopup(msg, true);
  }
};

  const onHide = (item: CampaignType) => {
    updateStatus(item.Id_voucher, 0);
  };

  const onRun = (item: CampaignType) => {
    updateStatus(item.Id_voucher, 1);
  };

  const updateStatusBooking = async (id_voucher: number, status: number) => {
    try {
      const res = await authorizedAdminFetch(
        `${API_BASE}/api/voucherbooking/${id_voucher}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Status: status }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Lỗi cập nhật trạng thái voucher booking");
      }

      const statusText = status === 0 ? "ẩn" : status === 1 ? "đang hoạt động" : "cập nhật";
      const successMsg = `Voucher booking đã được chuyển sang trạng thái ${statusText}!`;
      setError(successMsg);
      showPopup(successMsg, false);

      loadBookingVouchers();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Lỗi cập nhật trạng thái voucher booking";
      setError(msg);
      showPopup(msg, true);
    }
  };

  const onHidebooking = (item: CampaignType) => {
    const bookingId = resolveBookingId(item);
    if (bookingId == null) {
      setError("ID voucher không hợp lệ");
      showPopup("ID voucher không hợp lệ", true);
      return;
    }
    updateStatusBooking(Number(bookingId), 0);
  };

  const onRunbooking = (item: CampaignType) => {
    const bookingId = resolveBookingId(item);
    if (bookingId == null) {
      setError("ID voucher không hợp lệ");
      showPopup("ID voucher không hợp lệ", true);
      return;
    }
    updateStatusBooking(Number(bookingId), 1);
  };

  const resolveBookingId = (item: CampaignType) => {
    if (item.Id_voucher != null) return item.Id_voucher;
    const raw = item.raw as BookingVoucherType | undefined;
    if (raw?.id_voucher != null) return raw.id_voucher;
    if (raw?.Id_voucher != null) return raw.Id_voucher;
    return null;
  };

  const onEditBooking = async (item: CampaignType) => {
    const bookingId = resolveBookingId(item);
    if (bookingId == null) {
      setError("ID voucher không hợp lệ");
      showPopup("ID voucher không hợp lệ", true);
      return;
    }

    setLoading(true);
    try {
      setEditingSource("booking");
      setEditingVoucherId(Number(bookingId));
      setIsEditing(true);

      const res = await authorizedAdminFetch(`${API_BASE}/api/voucherbooking/${bookingId}`);
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data?.message || `Lỗi lấy voucher booking ${item.Id_voucher}`);

      const bookingVoucher = data as BookingVoucherType;
      fillFormFromVoucher({
        Id_voucher: bookingVoucher.Id_voucher ?? bookingVoucher.id_voucher ?? 0,
        Name: bookingVoucher.Name || "",
        Description: bookingVoucher.Description || "",
        Voucher_Coder: bookingVoucher.Voucher_code || "",
        Status: normalizeBookingVoucherStatus(bookingVoucher.Status),
        Min_order_value: bookingVoucher.Min_order_value ?? 0,
        Discount_value: bookingVoucher.Discount_value ?? 0,
        Discount_type: bookingVoucher.Discount_type === "fixed" ? "fixed" : "percent",
        Max_discount: bookingVoucher.Max_discount_amount ?? null,
        Start_date: bookingVoucher.Start_date ? toInputDateValue(bookingVoucher.Start_date) : null,
        End_date: bookingVoucher.End_date ? toInputDateValue(bookingVoucher.End_date) : null,
      } as VoucherType);

      setSelectedRow(item);
      setOriginalVoucherCode(bookingVoucher.Voucher_code || "");
      setError(`Chỉnh sửa voucher booking: ${bookingVoucher.Name || item.name}`);
      setShowVoucherModal(true);
    } catch (err: unknown) {
      console.error("Lỗi onEditBooking:", err);
      const msg = err instanceof Error ? err.message : "Lỗi khi lấy dữ liệu voucher booking";
      setError(msg);
      showPopup(msg, true);
    } finally {
      setLoading(false);
    }
  };

  const toInputDateValue = (dateValue: string | null): string | null => {
    if (!dateValue) return null;
    const normalized = dateValue.replace(" ", "T");
    if (normalized.length === 16) return normalized;
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return null;
    const YYYY = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, "0");
    const DD = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
  };

  const fillFormFromVoucher = (voucher: VoucherType) => {
    setSelectedRow({
      Id_voucher: voucher.Id_voucher,
      code: voucher.Voucher_Coder || "",
      codeTone: getCodeTone(voucher.Voucher_Coder || ""),
      name: voucher.Name || "",
      description: voucher.Description || "",
      discount:
        voucher.Discount_type === "percent"
          ? `${voucher.Discount_value || 0}%`
          : `${(voucher.Discount_value || 0).toLocaleString("vi-VN")} đ`,
      usage: `Min ${(voucher.Min_order_value || 0).toLocaleString("vi-VN")} đ`,
      type: voucher.Discount_type === "percent" ? "Giảm giá %" : "Giảm giá cố định",
      duration: formatDuration(voucher.Start_date, voucher.End_date),
      status: getStatusLabel(voucher.Status ?? 0),
      statusTone: getStatusTone(voucher.Status ?? 0),
      raw: voucher,
    });

    const maxDiscount = voucher.Max_discount ?? (voucher as BookingVoucherType).Max_discount_amount ?? null;

    setFormData({
      Name: voucher.Name || "",
      Description: voucher.Description || "",
      Voucher_Coder: voucher.Voucher_Coder || "",
      Status: voucher.Status ?? 1,
      Min_order_value: voucher.Min_order_value ?? 0,
      Discount_value: voucher.Discount_value ?? 0,
      Discount_type: voucher.Discount_type === "fixed" ? "fixed" : "percent",
      Max_discount: maxDiscount,
      Start_date: toInputDateValue(voucher.Start_date),
      End_date: toInputDateValue(voucher.End_date),
    });
  };

  const isVoucherType = (raw: VoucherType | BookingVoucherType): raw is VoucherType => {
    return (
      raw !== null &&
      typeof raw === "object" &&
      "Voucher_Coder" in raw &&
      "Max_discount" in raw
    );
  };

  const onEdit = async (item: CampaignType) => {
    if (item.Id_voucher == null) {
      setError("ID voucher không hợp lệ");
      return;
    }

    setLoading(true);
    try {
      setEditingSource("product");
      setEditingVoucherId(item.Id_voucher);
      setIsEditing(true);

      if (item.raw && isVoucherType(item.raw)) {
        fillFormFromVoucher(item.raw);
        setOriginalVoucherCode(item.raw.Voucher_Coder || "");
        setError(`Chỉnh sửa voucher: ${item.raw.Name || item.name}`);
        setShowVoucherModal(true);
      } else {
        const res = await authorizedAdminFetch(`${API_BASE}/api/voucher/${item.Id_voucher}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || `Lỗi lấy voucher ${item.Id_voucher}`);

        fillFormFromVoucher(data as VoucherType);
        setOriginalVoucherCode(data.Voucher_Coder || "");
        setError(`Chỉnh sửa voucher: ${data.Name || item.name}`);
        setShowVoucherModal(true);
      }
    } catch (err: unknown) {
      console.error("Lỗi onEdit:", err);
      const msg = err instanceof Error ? err.message : "Lỗi khi lấy dữ liệu voucher";
      setError(msg);
      showPopup(msg, true);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field: keyof FormData, value: FormFieldValue) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setFormErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const validateForm = (): boolean => {
    const errors: FormFieldErrors = {};
    if (!formData.Name.trim()) {
      errors.Name = "Vui lòng nhập tên voucher";
    }
    if (!formData.Voucher_Coder.trim()) {
      errors.Voucher_Coder = "Vui lòng nhập mã voucher";
    }
    if (formData.Discount_value === null || formData.Discount_value <= 0) {
      errors.Discount_value = "Giá trị giảm giá phải lớn hơn 0";
    }
    if (formData.Discount_type === "percent" && formData.Max_discount !== null && formData.Max_discount < 0) {
      errors.Max_discount = "Giá trị tối đa giảm phải lớn hơn hoặc bằng 0";
    }
    if (formData.Min_order_value !== null && formData.Min_order_value < 0) {
      errors.Min_order_value = "Giá trị tối thiểu phải là số dương";
    }
    if (formData.Start_date && formData.End_date) {
      const start = new Date(formData.Start_date);
      const end = new Date(formData.End_date);
      if (end < start) {
        errors.End_date = "Ngày kết thúc phải sau ngày bắt đầu";
      }
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("Vui lòng kiểm tra lại thông tin trong biểu mẫu.");
      return false;
    }

    setError("");
    return true;
  };

  const updateVoucherFull = async () => {
    if (editingVoucherId === null) {
      const msg = "Không có voucher để cập nhật";
      setError(msg);
      showPopup(msg, true);
      return;
    }

    try {
      if (!validateForm()) {
        showPopup("Vui lòng kiểm tra lại thông tin trong biểu mẫu.", true);
        return;
      }

      // ✅ Kiểm tra trùng lặp mã voucher chỉ khi mã thay đổi
      const trimmedCode = formData.Voucher_Coder.trim();
      if (trimmedCode !== originalVoucherCode) {
        const existingVoucher = (editingSource === "booking" ? bookingCampaigns : campaigns).find(
          (item) => item.code.toLowerCase() === trimmedCode.toLowerCase()
        );
        if (existingVoucher) {
          const msg = "Mã voucher đã tồn tại";
          setError(msg);
          showPopup(msg, true);
          return;
        }
      }

      if (formData.Discount_value === null || formData.Discount_value <= 0) {
        const msg = "Giá trị giảm giá phải lớn hơn 0";
        setError(msg);
        showPopup(msg, true);
        return;
      }

      setLoading(true);
      const path = editingSource === "booking" ? "voucherbooking" : "voucher";
      const normalizedVoucherCode = formData.Voucher_Coder.trim();
      const requestData =
        editingSource === "booking"
          ? {
              ...formData,
              Voucher_code: normalizedVoucherCode,
              Voucher_Coder: normalizedVoucherCode,
              Max_discount_amount: formData.Max_discount,
            }
          : {
              ...formData,
              Voucher_Coder: normalizedVoucherCode,
            };

      console.log("[updateVoucherFull] path=", path, "requestData=", requestData);

      const res = await authorizedAdminFetch(`${API_BASE}/api/${path}/${editingVoucherId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data?.message || `Lỗi cập nhật voucher: ${res.status}`);
      }

      const successMsg = "Cập nhật voucher thành công!";
      setError(successMsg);
      showPopup(successMsg, false);
      setIsEditing(false);
      setEditingVoucherId(null);
      setSelectedRow(null);
      setOriginalVoucherCode("");
      setFormData(initialFormData);
      setShowVoucherModal(false);
      if (editingSource === "booking") {
        await loadBookingVouchers();
      } else {
        await loadVouchers();
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Lỗi cập nhật voucher";
      setError(msg);
      showPopup(msg, true);
    } finally {
      setLoading(false);
    }
  };

  const createVoucherFull = async () => {
    if (isEditing && editingVoucherId !== null) {
      return updateVoucherFull();
    }

    try {
      if (!validateForm()) {
        showPopup("Vui lòng kiểm tra lại thông tin trong biểu mẫu.", true);
        return;
      }

      // ✅ Kiểm tra trùng lặp mã voucher
      const existingVoucher = (editingSource === "booking" ? bookingCampaigns : campaigns).find(
        (item) => item.code.toLowerCase() === formData.Voucher_Coder.trim().toLowerCase()
      );
      if (existingVoucher) {
        const msg = "Mã voucher đã tồn tại";
        setError(msg);
        showPopup(msg, true);
        return;
      }

      if (formData.Discount_value === null || formData.Discount_value <= 0) {
        const msg = "Giá trị giảm giá phải lớn hơn 0";
        setError(msg);
        showPopup(msg, true);
        return;
      }

      setLoading(true);
      const path = editingSource === "booking" ? "voucherbooking" : "voucher";
      const normalizedVoucherCode = formData.Voucher_Coder.trim();
      const requestData =
        editingSource === "booking"
          ? {
              ...formData,
              Voucher_code: normalizedVoucherCode,
              Voucher_Coder: normalizedVoucherCode,
              Max_discount_amount: formData.Max_discount,
            }
          : {
              ...formData,
              Voucher_Coder: normalizedVoucherCode,
            };

      const res = await authorizedAdminFetch(`${API_BASE}/api/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data?.message || `Lỗi tạo voucher: ${res.status}`);
      }

      const successMsg = "Tạo voucher thành công!";
      setError(successMsg);
      showPopup(successMsg, false);
      setFormData(initialFormData);
      setShowVoucherModal(false);
      if (editingSource === "booking") {
        await loadBookingVouchers();
      } else {
        await loadVouchers();
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Lỗi tạo voucher";
      setError(msg);
      showPopup(msg, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <section>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Quản lý Khuyến mãi</h1>
          <p className="mt-2 text-sm text-slate-500">
            Tạo, quản lý và theo dõi hiệu suất các chiến dịch marketing cho 25Zone.
          </p>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-3">
          {stats.map((item) => (
            <article
              key={item.label}
              className="rounded-[24px] border border-slate-200 bg-white px-5 py-5 shadow-[0_20px_45px_-34px_rgba(15,23,42,0.26)] sm:px-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-[2.1rem] font-bold leading-none tracking-tight text-slate-900">
                    {item.value}
                  </p>
                  {item.hint ? (
                    <p className={`mt-3 text-sm font-semibold ${item.hintTone}`}>
                      ↗ {item.hint}
                    </p>
                  ) : (
                    <div className="mt-4 h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-[42.8%] rounded-full bg-[#6D5EF7]" />
                    </div>
                  )}
                </div>

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg ${item.iconTone}`}
                >
                  <i className={`fa-solid ${item.icon}`} />
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-6">
          {mode !== "booking" && (
            <div className="space-y-6">
              <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_20px_45px_-34px_rgba(15,23,42,0.26)] sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="inline-flex w-fit rounded-2xl bg-slate-100 p-1">
                  {tabs.map((tab, index) => {
                    const active = index === activeTab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(index)}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                          active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingVoucherId(null);
                      setSelectedRow(null);
                      setOriginalVoucherCode("");
                      setFormData(initialFormData);
                      setError("");
                      setEditingSource(mode === "booking" ? "booking" : "product");
                      setShowVoucherModal(true);
                    }}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#11A5D8] px-4 text-sm font-semibold text-white hover:bg-[#0E8BC2]"
                  >
                    <i className="fa-solid fa-plus" />
                    {mode === "booking" ? "Thêm voucher booking" : "Thêm voucher sản phẩm"}
                  </button>
                </div>
              </div>
            </article>

            <article className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_20px_45px_-34px_rgba(15,23,42,0.26)]">
              <div className="px-4 py-4 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">Voucher sản phẩm</h2>
                <p className="text-sm text-slate-500">Danh sách voucher sản phẩm .</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed text-left">
                  <colgroup>
                    <col className="w-[25%]" />
                    <col className="w-[15%]" />
                    <col className="w-[15%]" />
                    <col className="w-[25%]" />
                    <col className="w-[10%]" />
                    <col className="w-[10%]" />
                  </colgroup>
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    <tr>
                      <th className="px-4 py-4 sm:px-5">Mã Voucher</th>
                      <th className="px-4 py-4 sm:px-5">Phần trăm giảm</th>
                      <th className="px-4 py-4 sm:px-5">Loại</th>
                      <th className="px-4 py-4 sm:px-5">Thời gian</th>
                      <th className="px-4 py-4 sm:px-5">Trạng thái</th>
                      <th className="px-4 py-4 text-right sm:px-5">Thao tác</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {pagedCampaigns.map((item) => (
                      <tr key={`${item.name}-${item.duration}`} className="align-top">
                        <td className="px-4 py-4 sm:px-5">
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="w-full text-left"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex h-8 w-[120px] items-center justify-center rounded-lg px-3 text-xs font-semibold tracking-tight overflow-hidden text-ellipsis whitespace-nowrap ${item.codeTone}`}
                              >
                                {item.code || ""}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{item.name}</p>
                                <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                              </div>
                            </div>
                          </button>
                        </td>

                        <td className="px-4 py-4 sm:px-5">
                          <p className="font-semibold text-slate-900">{item.discount}</p>
                          <p className="mt-1 text-xs text-slate-400">{item.usage}</p>
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-500 sm:px-5">{item.type}</td>
                        <td className="px-4 py-4 text-sm text-slate-500 sm:px-5">{item.duration}</td>

                        <td className="px-4 py-4 sm:px-5">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${item.statusTone}`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="px-4 py-4 sm:px-5">
                          <div className="flex items-center justify-end gap-3 text-slate-400">
                            {/* Nút Ẩn - chỉ hiện khi status !== 0 */}
                            {item.status !== "Đã ẩn" && (
                              <button
                                type="button"
                                onClick={() => onHide(item)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-slate-100 hover:text-slate-700"
                                title="Ẩn voucher"
                              >
                                <i className="fa-regular fa-eye" />
                              </button>
                            )}

                            {/* Nút Sửa */}
                            <button
                              type="button"
                              onClick={() => onEdit(item)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-slate-100 hover:text-slate-700"
                              title="Sửa voucher"
                            >
                              <i className="fa-solid fa-pen" />
                            </button>

                            {/* Nút Chạy - chỉ hiện khi status !== 1 */}
                            {item.status !== "Đang hoạt động" && (
                              <button
                                type="button"
                                onClick={() => onRun(item)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-slate-100 hover:text-slate-700"
                                title="Chạy voucher"
                              >
                                <i className="fa-solid fa-play" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p>
                  Hiển thị {pagedCampaigns.length} trên {filteredCampaigns.length} chiến dịch (trang {campaignPage}/{totalCampaignPages})
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCampaignPage((prev) => Math.max(1, prev - 1))}
                    disabled={campaignPage <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 disabled:opacity-50"
                  >
                    <i className="fa-solid fa-chevron-left text-xs" />
                  </button>
                  <span className="text-sm text-slate-600">{campaignPage}</span>
                  <span className="text-sm text-slate-400">/ {totalCampaignPages}</span>
                  <button
                    type="button"
                    onClick={() => setCampaignPage((prev) => Math.min(totalCampaignPages, prev + 1))}
                    disabled={campaignPage >= totalCampaignPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 disabled:opacity-50"
                  >
                    <i className="fa-solid fa-chevron-right text-xs" />
                  </button>
                </div>
              </div>
            </article>
          </div>
          )}

          {mode !== "product" && (
            <div className="space-y-6">
              <article className="rounded-[24px] border border-slate-200 bg-white shadow-[0_20px_45px_-34px_rgba(15,23,42,0.26)] sm:p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="inline-flex w-fit rounded-2xl bg-slate-100 p-1">
                    {tabs.map((tab, index) => {
                      const active = index === activeTab;
                      return (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setActiveTab(index)}
                          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                            active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                          }`}
                        >
                          {tab}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditingVoucherId(null);
                        setSelectedRow(null);
                        setOriginalVoucherCode("");
                        setFormData(initialFormData);
                        setError("");
                        setEditingSource("booking");
                        setShowVoucherModal(true);
                      }}
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#11A5D8] px-4 text-sm font-semibold text-white hover:bg-[#0E8BC2]"
                    >
                      <i className="fa-solid fa-plus" />
                      Thêm voucher booking
                    </button>
                  </div>
                </div>
              </article>

              <article className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_20px_45px_-34px_rgba(15,23,42,0.26)]">
                <div className="px-4 py-4 border-b border-slate-100">
                  <h2 className="text-lg font-semibold text-slate-900">Voucher Booking</h2>
                  <p className="text-sm text-slate-500">Danh sách voucher booking.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-fixed text-left">
                  <colgroup>
                    <col className="w-[25%]" />
                    <col className="w-[15%]" />
                    <col className="w-[15%]" />
                    <col className="w-[25%]" />
                    <col className="w-[10%]" />
                    <col className="w-[10%]" />
                  </colgroup>
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    <tr>
                      <th className="px-4 py-4 sm:px-5">Mã Voucher</th>
                      <th className="px-4 py-4 sm:px-5">Phần trăm giảm</th>
                      <th className="px-4 py-4 sm:px-5">Loại</th>
                      <th className="px-4 py-4 sm:px-5">Thời gian</th>
                      <th className="px-4 py-4 sm:px-5">Trạng thái</th>
                      <th className="px-4 py-4 text-right sm:px-5">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagedBookingCampaigns.map((item) => (
                      <tr key={`booking-${item.Id_voucher}-${item.code}`} className="align-top">
                        <td className="px-4 py-4 sm:px-5">
                          <button
                            type="button"
                            onClick={() => onEditBooking(item)}
                            className="w-full text-left"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex h-8 w-[120px] items-center justify-center rounded-lg px-3 text-xs font-semibold tracking-tight overflow-hidden text-ellipsis whitespace-nowrap ${item.codeTone}`}
                              >
                                {item.code || ""}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{item.name}</p>
                                <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                              </div>
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-4 sm:px-5">
                          <p className="font-semibold text-slate-900">{item.discount}</p>
                          <p className="mt-1 text-xs text-slate-400">{item.usage}</p>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-500 sm:px-5">{item.type}</td>
                        <td className="px-4 py-4 text-sm text-slate-500 sm:px-5">{item.duration}</td>
                        <td className="px-4 py-4 sm:px-5">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${item.statusTone}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 sm:px-5">
                          <div className="flex items-center justify-end gap-3 text-slate-400">
                            {item.status !== "Đã ẩn" && (
                              <button
                                type="button"
                                onClick={() => onHidebooking(item)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-slate-100 hover:text-slate-700"
                                title="Ẩn voucher booking"
                              >
                                <i className="fa-regular fa-eye" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => onEditBooking(item)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-slate-100 hover:text-slate-700"
                              title="Sửa voucher booking"
                            >
                              <i className="fa-solid fa-pen" />
                            </button>

                            {item.status !== "Đang hoạt động" && (
                              <button
                                type="button"
                                onClick={() => onRunbooking(item)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-slate-100 hover:text-slate-700"
                                title="Chạy voucher booking"
                              >
                                <i className="fa-solid fa-play" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p>
                  Hiển thị {pagedBookingCampaigns.length} trên {filteredBookingCampaigns.length} voucher booking (trang {bookingPage}/{totalBookingPages})
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingPage((prev) => Math.max(1, prev - 1))}
                    disabled={bookingPage <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 disabled:opacity-50"
                  >
                    <i className="fa-solid fa-chevron-left text-xs" />
                  </button>
                  <span className="text-sm text-slate-600">{bookingPage}</span>
                  <span className="text-sm text-slate-400">/ {totalBookingPages}</span>
                  <button
                    type="button"
                    onClick={() => setBookingPage((prev) => Math.min(totalBookingPages, prev + 1))}
                    disabled={bookingPage >= totalBookingPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 disabled:opacity-50"
                  >
                    <i className="fa-solid fa-chevron-right text-xs" />
                  </button>
                </div>
              </div>
            </article>
          </div>
          )}

          <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-34px_rgba(15,23,42,0.26)] sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1EEFF] text-[#6D5EF7]">
                <i className="fa-solid fa-users-viewfinder" />
              </span>
              <div>
                <p className="text-lg font-semibold text-slate-900">Phân khúc khách hàng</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {segments.map((segment) => (
                <button
                  key={segment.title}
                  type="button"
                  className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 px-4 py-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${segment.tagTone}`}
                  >
                    {segment.tag}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-slate-900">{segment.title}</span>
                    <span className="mt-1 block text-sm text-slate-500">{segment.description}</span>
                  </span>
                  <span className="text-slate-300">
                    <i className="fa-solid fa-arrow-right" />
                  </span>
                </button>
              ))}
            </div>
          </article>
        </section>
      </div>

      {showVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[780px] overflow-y-auto max-h-[90vh] rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {isEditing
                    ? editingSource === "booking"
                      ? "Chỉnh sửa voucher booking"
                      : "Chỉnh sửa voucher"
                    : editingSource === "booking"
                    ? "Tạo voucher booking mới"
                    : "Tạo voucher sản phẩm mới"}
                </h2>
                {selectedRow && <p className="text-sm text-slate-500">Đang sửa: {selectedRow.name}</p>}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowVoucherModal(false);
                  setIsEditing(false);
                  setEditingSource(mode === "booking" ? "booking" : "product");
                  setEditingVoucherId(null);
                  setSelectedRow(null);
                  setOriginalVoucherCode("");
                  setFormData(initialFormData);
                  setError("");
                }}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Tên voucher *</label>
                <input
                  type="text"
                  value={formData.Name}
                  onChange={(e) => handleFormChange("Name", e.target.value)}
                  className={`mt-1 h-10 w-full rounded-lg border px-3 text-sm text-slate-900 outline-none transition ${
                    formErrors.Name ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-[#11A5D8]"
                  }`}
                  placeholder="VD: Giảm giá tết"
                />
                {formErrors.Name && <p className="mt-1 text-sm text-red-600">{formErrors.Name}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Mã voucher *</label>
                <input
                  type="text"
                  value={formData.Voucher_Coder}
                  onChange={(e) => handleFormChange("Voucher_Coder", e.target.value)}
                  className={`mt-1 h-10 w-full rounded-lg border px-3 text-sm text-slate-900 outline-none transition ${
                    formErrors.Voucher_Coder ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-[#11A5D8]"
                  }`}
                  placeholder="VD: TET2024"
                />
                {formErrors.Voucher_Coder && <p className="mt-1 text-sm text-red-600">{formErrors.Voucher_Coder}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Loại giảm giá *</label>
                <select
                  value={formData.Discount_type}
                  onChange={(e) => handleFormChange("Discount_type", e.target.value)}
                  className={`mt-1 h-10 w-full rounded-lg border px-3 text-sm text-slate-900 outline-none transition bg-white ${
                    formErrors.Discount_type ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-[#11A5D8]"
                  }`}
                >
                  <option value="percent">Giảm giá %</option>
                  <option value="fixed">Giảm giá cố định (đ)</option>
                </select>
                {formErrors.Discount_type && <p className="mt-1 text-sm text-red-600">{formErrors.Discount_type}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Giá trị giảm giá * {formData.Discount_type === "percent" ? "(%)" : "(đ)"}
                </label>
                <input
                  type="number"
                  value={formData.Discount_value ?? ""}
                  onChange={(e) =>
                    handleFormChange(
                      "Discount_value",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className={`mt-1 h-10 w-full rounded-lg border px-3 text-sm text-slate-900 outline-none transition ${
                    formErrors.Discount_value ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-[#11A5D8]"
                  }`}
                  placeholder="Nhập giá trị"
                  min="0"
                />
                {formErrors.Discount_value && <p className="mt-1 text-sm text-red-600">{formErrors.Discount_value}</p>}
              </div>

              {formData.Discount_type === "percent" && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Max discount (đ)</label>
                  <input
                    type="number"
                    value={formData.Max_discount ?? ""}
                    onChange={(e) => handleFormChange("Max_discount", e.target.value ? Number(e.target.value) : null)}
                    className={`mt-1 h-10 w-full rounded-lg border px-3 text-sm text-slate-900 outline-none transition ${
                      formErrors.Max_discount ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-[#11A5D8]"
                    }`}
                    placeholder="(tùy chọn)"
                    min="0"
                  />
                  {formErrors.Max_discount && <p className="mt-1 text-sm text-red-600">{formErrors.Max_discount}</p>}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-700">Min order value (đ)</label>
                <input
                  type="number"
                  value={formData.Min_order_value ?? ""}
                  onChange={(e) =>
                    handleFormChange(
                      "Min_order_value",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className={`mt-1 h-10 w-full rounded-lg border px-3 text-sm text-slate-900 outline-none transition ${
                    formErrors.Min_order_value ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-[#11A5D8]"
                  }`}
                  placeholder="Nhập giá trị"
                  min="0"
                />
                {formErrors.Min_order_value && <p className="mt-1 text-sm text-red-600">{formErrors.Min_order_value}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Ngày bắt đầu</label>
                <input
                  type="datetime-local"
                  min={minDateTimeLocal}
                  value={formData.Start_date || ""}
                  onChange={(e) => handleFormChange("Start_date", e.target.value || null)}
                  className={`mt-1 h-10 w-full rounded-lg border px-3 text-sm text-slate-900 outline-none transition ${
                    formErrors.Start_date ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-[#11A5D8]"
                  }`}
                />
                {formErrors.Start_date && <p className="mt-1 text-sm text-red-600">{formErrors.Start_date}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Ngày kết thúc</label>
                <input
                  type="datetime-local"
                  min={minDateTimeLocal}
                  value={formData.End_date || ""}
                  onChange={(e) => handleFormChange("End_date", e.target.value || null)}
                  className={`mt-1 h-10 w-full rounded-lg border px-3 text-sm text-slate-900 outline-none transition ${
                    formErrors.End_date ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-[#11A5D8]"
                  }`}
                />
                {formErrors.End_date && <p className="mt-1 text-sm text-red-600">{formErrors.End_date}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Trạng thái *</label>
                <select
                  value={formData.Status}
                  onChange={(e) => handleFormChange("Status", Number(e.target.value))}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-[#11A5D8] transition bg-white"
                >
                  <option value={1}>Đang hoạt động</option>
                  <option value={2}>Sắp tới</option>
                  <option value={3}>Đã kết thúc</option>
                  <option value={0}>Ẩn</option>
                </select>
              </div>

              <button
                type="button"
                onClick={createVoucherFull}
                disabled={loading}
                className="mt-4 flex h-10 w-full items-center justify-center rounded-lg bg-[#11A5D8] text-sm font-semibold text-white transition hover:bg-[#0E8BC2] disabled:opacity-50"
              >
                {loading ? (isEditing ? "Đang cập nhật..." : "Đang tạo...") : isEditing ? "Cập nhật voucher" : "Tạo voucher"}
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setShowVoucherModal(false);
                    setIsEditing(false);
                    setEditingSource(mode === "booking" ? "booking" : "product");
                    setEditingVoucherId(null);
                    setSelectedRow(null);
                    setOriginalVoucherCode("");
                    setFormData(initialFormData);
                    setError("");
                  }}
                  className="mt-2 flex h-10 w-full items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Hủy chỉnh sửa
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-center mt-4">{error}</p>}
    </main>
  );
}
