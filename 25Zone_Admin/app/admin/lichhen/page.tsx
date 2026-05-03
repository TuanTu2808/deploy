"use client";

import { toast } from "../../component/Toast";
import React, { useState, useEffect, useMemo, useRef } from "react";

import { getAdminStoreId } from "@/app/lib/admin-auth";

// API endpoints Configuration
const API_URL = "http://localhost:5001/api";

const extractMinutes = (timeStr: any) => {
  if (!timeStr) return 0;
  const str = String(timeStr);
  if (!str.includes(":")) return Number(str) || 0;
  const [h = "0", m = "0"] = str.split(":");
  return Number(h || 0) * 60 + Number(m || 0);
};

export default function LichHenPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [stylists, setStylists] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [combos, setCombos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const SINGLE_SELECT_CATEGORY_IDS = [1, 2, 3]; // Cắt, Uốn, Nhuộm

  const adminStoreId = getAdminStoreId();
  const isAdminTong = adminStoreId === 0 || adminStoreId === null || Number.isNaN(adminStoreId);

  const [storeId, setStoreId] = useState(isAdminTong ? "" : String(adminStoreId));
  const [stylistId, setStylistId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateMode, setDateMode] = useState<"day" | "month" | "year">("day");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    bookingId: number;
    newStatus: string;
  } | null>(null);

  const [confirmServiceIds, setConfirmServiceIds] = useState<number[]>([]);
  const [confirmComboIds, setConfirmComboIds] = useState<number[]>([]);
  const [showAddService, setShowAddService] = useState(false);
  const [showConfirmChangesModal, setShowConfirmChangesModal] = useState(false);
  const [pendingConflict, setPendingConflict] = useState<{
    targetId: number;
    targetType: "service" | "combo";
    removeServiceIds: number[];
    removeComboIds: number[];
    message: string;
    conflictNames: string[];
  } | null>(null);

  const [cancelError, setCancelError] = useState("");

  const [completeErrorModal, setCompleteErrorModal] = useState<{ show: boolean, message: string }>({ show: false, message: "" });
  const [earlyCompleteModal, setEarlyCompleteModal] = useState<{ show: boolean, bookingId: number | null, message: string }>({ show: false, bookingId: null, message: "" });
  // Assign Stylist in Modal
  const [availableStylists, setAvailableStylists] = useState<any[]>([]);
  const [assignStylistId, setAssignStylistId] = useState<string>("");
  const [fetchingStylists, setFetchingStylists] = useState(false);

  // Result Images inside Modal
  const [resultImages, setResultImages] = useState<string[]>([]);
  const [fetchingImages, setFetchingImages] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Booking Form State
  const [newBooking, setNewBooking] = useState({
    phone: "",
    customerName: "",
    storeId: "",
    stylistId: "",
    date: new Date().toISOString().split('T')[0],
    time: "09:00",
    serviceIds: [] as number[],
    comboIds: [] as number[],
    note: "Admin tạo lịch trực tiếp."
  });
  const [createLoading, setCreateLoading] = useState(false);

  const [newBookingStylists, setNewBookingStylists] = useState<any[]>([]);
  const [fetchingNewBookingStylists, setFetchingNewBookingStylists] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (newBooking.storeId && newBooking.date && newBooking.time) {
      const loadStylists = async () => {
        setFetchingNewBookingStylists(true);
        try {
          const res = await fetch(`${API_URL}/lichlamviec/danhsachkhunggiolamviec?storeId=${newBooking.storeId}&date=${newBooking.date}`);
          if (res.ok) {
            const data = await res.json();
            const targetHHmm = newBooking.time;

            // Calc duration
            const durationMin =
              newBooking.serviceIds.reduce((sum, id) => {
                const s = services.find(x => x.Id_services === id);
                return sum + (s ? extractMinutes(s.Duration_time) : 0);
              }, 0) +
              newBooking.comboIds.reduce((sum, id) => {
                const c = combos.find(x => x.Id_combo === id);
                return sum + (c ? extractMinutes(c.Duration_time) : 0);
              }, 0);

            const finalDuration = durationMin || 30; // Fallback 30 mins
            const numSlotsRequired = Math.max(1, Math.ceil(finalDuration / 30));

            const filtered = data.filter((st: any) => {
              if (!st.hours) return false;

              const startIndex = st.hours.findIndex((h: any) => h.Hours.substring(0, 5) === targetHHmm);
              if (startIndex === -1) return false;

              const slotsToCheck = st.hours.slice(startIndex, startIndex + numSlotsRequired);
              if (slotsToCheck.length < numSlotsRequired) return false;

              return slotsToCheck.every((h: any) => h.Status === 1);
            });

            setNewBookingStylists(filtered);
            setNewBooking(prev => {
              if (prev.stylistId && !filtered.find(s => String(s.Id_user) === String(prev.stylistId))) {
                return { ...prev, stylistId: "" };
              }
              return prev;
            });
          }
        } catch (err) {
          console.error("Lỗi lấy danh sách thợ form đăng ký:", err);
        } finally {
          setFetchingNewBookingStylists(false);
        }
      };

      const bounceId = setTimeout(loadStylists, 300);
      return () => clearTimeout(bounceId);
    } else {
      setNewBookingStylists([]);
    }
  }, [newBooking.storeId, newBooking.date, newBooking.time, newBooking.serviceIds, newBooking.comboIds, services, combos]);

  useEffect(() => {
    if (pendingAction?.newStatus === "confirmed") {
      const loadAvailableStylists = async () => {
        setFetchingStylists(true);
        try {
          const storeObj = stores.find((s) => s.Name_store === selectedBooking.store_name);
          const currentStoreId = storeObj ? storeObj.Id_store : undefined;
          const dateStr = selectedBooking.booking_date ? selectedBooking.booking_date.substring(0, 10) : "";

          if (!currentStoreId || !dateStr) return;

          const res = await fetch(`${API_URL}/lichlamviec/danhsachkhunggiolamviec?storeId=${currentStoreId}&date=${dateStr}`);
          if (res.ok) {
            const data = await res.json();

            let targetHHmm = "";
            let timeRaw = selectedBooking.start_time;
            if (typeof timeRaw === "string") {
              if (timeRaw.includes(" ")) {
                targetHHmm = timeRaw.split(" ")[1].substring(0, 5);
              } else if (timeRaw.includes("T")) {
                const d = new Date(timeRaw);
                targetHHmm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
              } else if (timeRaw.length >= 5) {
                targetHHmm = timeRaw.substring(0, 5);
              }
            }

            // Tính duration theo dịch vụ đang chọn
            const durationMin =
              confirmServiceIds.reduce((sum, id) => {
                const s = services.find(x => x.Id_services === id);
                return sum + (s ? extractMinutes(s.Duration_time) : 0);
              }, 0) +
              confirmComboIds.reduce((sum, id) => {
                const c = combos.find(x => x.Id_combo === id);
                return sum + (c ? extractMinutes(c.Duration_time) : 0);
              }, 0);

            const finalDuration = durationMin || 30; // fallback 30 phút
            const numSlotsRequired = Math.max(1, Math.ceil(finalDuration / 30));

            let filtered = data.filter((st: any) => {
              if (!st.hours) return false;

              const startIndex = st.hours.findIndex((h: any) => h.Hours.substring(0, 5) === targetHHmm);
              if (startIndex === -1) return false;

              // Check if enough consecutive slots are available
              const slotsToCheck = st.hours.slice(startIndex, startIndex + numSlotsRequired);

              if (slotsToCheck.length < numSlotsRequired) return false;

              // Nếu đang check chính thợ đã book thì bỏ qua check Status (vì slot đó đang bị giữ bởi chính lịch này)
              // Tuy nhiên API trả về status 0 cho các slot đã book. Nên nếu là thợ đang chọn, ta coi slot bị book (0) là hợp lệ (1)
              return slotsToCheck.every((h: any) => {
                if (selectedBooking?.stylist_id && String(st.Id_user) === String(selectedBooking.stylist_id)) {
                  // Cần phân biệt slot đang khoá là của lịch này hay lịch khác. Tạm thời chỉ check status.
                  // Việc kiểm tra này trên frontend khá phức tạp vì không biết slot nào thuộc lịch nào.
                  // Sẽ tạm cho qua nếu thợ này là thợ cũ.
                  return true;
                }
                return h.Status === 1;
              });
            });

            // Đưa thợ cũ lên đầu nếu có
            if (selectedBooking?.stylist_id) {
              const stId = String(selectedBooking.stylist_id);
              const oldStylist = filtered.find((st: any) => String(st.Id_user) === stId);
              if (oldStylist) {
                filtered = [oldStylist, ...filtered.filter((st: any) => String(st.Id_user) !== stId)];
              } else {
                // Thợ cũ không đủ giờ, lấy thông tin thợ từ stylists list gốc đưa vào nhưng cảnh báo
                const originalSt = stylists.find(s => String(s.Id_user) === stId);
                if (originalSt) {
                  originalSt.Name_user += " (Không đủ giờ)";
                  filtered = [originalSt, ...filtered];
                }
              }
            }

            const checkRequiresStylist = () => {
              for (const sId of confirmServiceIds) {
                const s = services.find(x => x.Id_services === sId);
                if (s && SINGLE_SELECT_CATEGORY_IDS.includes(s.Id_category)) return true;
              }
              for (const cId of confirmComboIds) {
                const c = combos.find(x => x.Id_combo === cId);
                if (!c) continue;
                const cats = typeof c.category_ids === 'string' ? c.category_ids.split(',').filter((x: string) => x && x !== 'null').map(Number) : (Array.isArray(c.category_ids) ? c.category_ids.map(Number) : []);
                if (cats.some(catId => SINGLE_SELECT_CATEGORY_IDS.includes(catId))) return true;
              }
              return false;
            };

            const isStylistRequired = checkRequiresStylist();

            setAvailableStylists(filtered);
            if (!assignStylistId && filtered.length > 0) {
              if (selectedBooking?.stylist_id) {
                setAssignStylistId(String(selectedBooking.stylist_id));
              } else if (isStylistRequired) {
                // Tự động gán thợ rảnh đầu tiên nếu dịch vụ BẮT BUỘC có thợ
                setAssignStylistId(String(filtered[0].Id_user));
              } else {
                setAssignStylistId("");
              }
            } else if (assignStylistId && !filtered.find((s: any) => String(s.Id_user) === assignStylistId)) {
              setAssignStylistId(isStylistRequired && filtered.length > 0 ? String(filtered[0].Id_user) : "");
            }
          }
        } catch (error) {
          console.error("Lỗi lấy danh sách thợ:", error);
        } finally {
          setFetchingStylists(false);
        }
      };

      const bounce = setTimeout(loadAvailableStylists, 300);
      return () => clearTimeout(bounce);
    } else {
      setAvailableStylists([]);
      setAssignStylistId("");
    }
  }, [pendingAction, selectedBooking, stores, confirmServiceIds, confirmComboIds, services, combos]);

  const handleAdminToggleService = (serviceId: number) => {
    const service = services.find(s => s.Id_services === serviceId);
    if (!service) return;

    if (confirmServiceIds.includes(serviceId)) {
      setConfirmServiceIds(prev => prev.filter(id => id !== serviceId));
      return;
    }

    // 1. Check conflict with selected combos
    const conflictCombo = combos.find(c => {
      if (!confirmComboIds.includes(c.Id_combo)) return false;
      const cServiceIds = typeof c.service_ids === 'string' ? c.service_ids.split(',').filter((x: string) => x && x !== 'null').map(Number) : (Array.isArray(c.service_ids) ? c.service_ids.map(Number) : []);
      return cServiceIds.includes(serviceId);
    });

    if (conflictCombo) {
      setPendingConflict({
        targetId: serviceId,
        targetType: "service",
        removeServiceIds: [],
        removeComboIds: [conflictCombo.Id_combo],
        message: "Dịch vụ này đã nằm trong combo bạn chọn. Bạn có muốn bỏ combo để chọn dịch vụ lẻ không?",
        conflictNames: [conflictCombo.Name]
      });
      return;
    }

    // 2. Check SINGLE_SELECT category
    if (SINGLE_SELECT_CATEGORY_IDS.includes(service.Id_category)) {
      // a. Check with existing single services
      const conflictExistingServiceId = confirmServiceIds.find(id => {
        const s = services.find(x => x.Id_services === id);
        return s && s.Id_category === service.Id_category;
      });

      if (conflictExistingServiceId) {
        const conflictService = services.find(s => s.Id_services === conflictExistingServiceId);
        setPendingConflict({
          targetId: serviceId,
          targetType: "service",
          removeServiceIds: [conflictExistingServiceId],
          removeComboIds: [],
          message: "Chỉ được chọn 1 dịch vụ trong nhóm (Cắt/Uốn/Nhuộm). Bạn có muốn thay thế dịch vụ cũ bằng dịch vụ này không?",
          conflictNames: [conflictService?.Name || "Dịch vụ cũ"]
        });
        return;
      }

      // b. Check with existing combos
      const conflictComboCat = combos.find(c => {
        if (!confirmComboIds.includes(c.Id_combo)) return false;
        const cCategoryIds = typeof c.category_ids === 'string' ? c.category_ids.split(',').filter((x: string) => x && x !== 'null').map(Number) : (Array.isArray(c.category_ids) ? c.category_ids.map(Number) : []);
        return cCategoryIds.includes(service.Id_category);
      });

      if (conflictComboCat) {
        setPendingConflict({
          targetId: serviceId,
          targetType: "service",
          removeServiceIds: [],
          removeComboIds: [conflictComboCat.Id_combo],
          message: "Dịch vụ này bị trùng nhóm (Cắt/Uốn/Nhuộm) với combo bạn đang chọn. Bạn có muốn bỏ combo để chọn dịch vụ lẻ này không?",
          conflictNames: [conflictComboCat.Name]
        });
        return;
      }
    }

    setConfirmServiceIds(prev => [...prev, serviceId]);
  };

  const handleAdminToggleCombo = (comboId: number) => {
    if (confirmComboIds.includes(comboId)) {
      setConfirmComboIds(prev => prev.filter(id => id !== comboId));
      return;
    }

    const combo = combos.find(c => c.Id_combo === comboId);
    if (!combo) return;

    const cServiceIds = typeof combo.service_ids === 'string' ? combo.service_ids.split(',').filter((x: string) => x && x !== 'null').map(Number) : (Array.isArray(combo.service_ids) ? combo.service_ids.map(Number) : []);
    const cCategoryIds = typeof combo.category_ids === 'string' ? combo.category_ids.split(',').filter((x: string) => x && x !== 'null').map(Number) : (Array.isArray(combo.category_ids) ? combo.category_ids.map(Number) : []);

    const removeServiceIds: number[] = [];
    const removeComboIds: number[] = [];
    const conflictNames: string[] = [];

    // 1. Check exact service overlap with selected services
    for (const sId of cServiceIds) {
      if (confirmServiceIds.includes(sId)) {
        removeServiceIds.push(sId);
        const s = services.find(x => x.Id_services === sId);
        if (s) conflictNames.push(s.Name);
      }
    }

    // 2. Check SINGLE_SELECT overlap with selected services
    for (const cCatId of cCategoryIds) {
      if (SINGLE_SELECT_CATEGORY_IDS.includes(cCatId)) {
        const conflictExistingServiceId = confirmServiceIds.find(id => {
          const s = services.find(x => x.Id_services === id);
          return s && s.Id_category === cCatId;
        });

        if (conflictExistingServiceId && !removeServiceIds.includes(conflictExistingServiceId)) {
          removeServiceIds.push(conflictExistingServiceId);
          const s = services.find(x => x.Id_services === conflictExistingServiceId);
          if (s) conflictNames.push(s.Name);
        }
      }
    }

    if (removeServiceIds.length > 0) {
      setPendingConflict({
        targetId: comboId,
        targetType: "combo",
        removeServiceIds,
        removeComboIds: [],
        message: "Combo này chứa dịch vụ trùng với dịch vụ lẻ đang chọn. Bạn có muốn xoá dịch vụ lẻ để tiếp tục không?",
        conflictNames
      });
      return;
    }

    // 3. Check exact service overlap with OTHER selected combos
    for (const existingComboId of confirmComboIds) {
      const existingCombo = combos.find(c => c.Id_combo === existingComboId);
      if (!existingCombo) continue;

      const existingServices = typeof existingCombo.service_ids === 'string' ? existingCombo.service_ids.split(',').filter((x: string) => x && x !== 'null').map(Number) : (Array.isArray(existingCombo.service_ids) ? existingCombo.service_ids.map(Number) : []);

      const overlap = cServiceIds.find(sId => existingServices.includes(sId));
      if (overlap) {
        removeComboIds.push(existingComboId);
        conflictNames.push(existingCombo.Name);
      }
    }

    // 4. Check SINGLE_SELECT overlap with OTHER selected combos
    for (const existingComboId of confirmComboIds) {
      if (removeComboIds.includes(existingComboId)) continue;
      const existingCombo = combos.find(c => c.Id_combo === existingComboId);
      if (!existingCombo) continue;

      const existingCats = typeof existingCombo.category_ids === 'string' ? existingCombo.category_ids.split(',').filter((x: string) => x && x !== 'null').map(Number) : (Array.isArray(existingCombo.category_ids) ? existingCombo.category_ids.map(Number) : []);

      const overlap = cCategoryIds.find(catId => SINGLE_SELECT_CATEGORY_IDS.includes(catId) && existingCats.includes(catId));
      if (overlap) {
        removeComboIds.push(existingComboId);
        conflictNames.push(existingCombo.Name);
      }
    }

    if (removeComboIds.length > 0) {
      setPendingConflict({
        targetId: comboId,
        targetType: "combo",
        removeServiceIds: [],
        removeComboIds,
        message: "Combo này chứa dịch vụ trùng với một combo khác. Bạn có muốn thay thế combo cũ không?",
        conflictNames
      });
      return;
    }

    setConfirmComboIds(prev => [...prev, comboId]);
  };

  const openDetailModal = async (b: any, action?: { bookingId: number, newStatus: string }) => {
    setSelectedBooking(b);
    if (action) {
      setPendingAction(action);
    } else {
      setPendingAction(null);
    }

    // Gán dịch vụ hiện tại vào state để sửa
    setConfirmServiceIds(b.service_ids || []);
    setConfirmComboIds(b.combo_ids || []);
    setShowAddService(false);

    setCancelReason("");
    setCancelError("");
    setShowDetailModal(true);

    if (b.status === "completed") {
      setFetchingImages(true);
      try {
        const res = await fetch(`${API_URL}/datlich/${b.id}/results`);
        if (res.ok) {
          const data = await res.json();
          setResultImages(data.images || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setFetchingImages(false);
      }
    } else {
      setResultImages([]);
    }
  };

  const handleUploadResultImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedBooking) return;

    setUploadingImages(true);
    const formData = new FormData();
    Array.from(e.target.files).forEach(file => {
      formData.append("images", file);
    });

    try {
      const res = await fetch(`${API_URL}/datlich/${selectedBooking.id}/results`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setResultImages(data.images || []);
        toast.success("Upload thành công!");
      } else {
        const err = await res.json();
        toast.error(err.message || "Lỗi upload ảnh.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối.");
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookRes, storeRes, stylistRes, serviceRes, comboRes] = await Promise.all([
        fetch(`${API_URL}/datlich`),
        fetch(`${API_URL}/chinhanh`),
        fetch(`${API_URL}/thocat`),
        fetch(`${API_URL}/dichvu`),
        fetch(`${API_URL}/combodichvu/catalog`),
      ]);

      const [bookData, storeData, stylistData, serviceData, comboData] = await Promise.all([
        bookRes.ok ? bookRes.json() : [],
        storeRes.ok ? storeRes.json() : [],
        stylistRes.ok ? stylistRes.json() : [],
        serviceRes.ok ? serviceRes.json() : [],
        comboRes.ok ? comboRes.json() : [],
      ]);

      setBookings(Array.isArray(bookData) ? bookData : []);
      setStores(Array.isArray(storeData) ? storeData : []);
      setStylists(Array.isArray(stylistData) ? stylistData : []);
      setServices(Array.isArray(serviceData) ? serviceData : []);
      setCombos(Array.isArray(comboData?.combos) ? comboData.combos : (Array.isArray(comboData) ? comboData : []));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Có lỗi xảy ra khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: number, newStatus: string, description_cancel?: string, newStylistId?: string, forceComplete?: boolean, serviceIds?: number[], comboIds?: number[]) => {
    // Kiểm tra không được chọn hoàn thành khi chưa đến giờ kết thúc
    if (newStatus === "completed" && !forceComplete) {
      const b = bookings.find(x => x.id === bookingId);
      if (b && b.start_time) {
        const durationMin = b.total_duration_minutes || 0;
        const startTimeStr = String(b.start_time);

        const startTimeMs = startTimeStr.includes("T")
          ? new Date(startTimeStr).getTime()
          : new Date(startTimeStr.replace(" ", "T")).getTime();

        if (!Number.isNaN(startTimeMs)) {
          const endTimeMs = startTimeMs + durationMin * 60000;
          const nowMs = new Date().getTime();

          if (nowMs < endTimeMs) {
            const timeDiff = endTimeMs - nowMs;
            const endDate = new Date(endTimeMs);
            const endFormatted = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;

            if (timeDiff <= 900000) {
              // Dưới 15 phút
              setEarlyCompleteModal({
                show: true,
                bookingId,
                message: `Dự kiến xong lúc ${endFormatted}. Sớm hơn ${(timeDiff / 60000).toFixed(0)} phút.`
              });
              return;
            } else {
              // Trên 15 phút
              setCompleteErrorModal({
                show: true,
                message: `Dự kiến hoàn thành lúc ${endFormatted}`
              });
              return;
            }
          }
        }
      }
    }

    try {
      const payload: any = { status: newStatus, description_cancel: description_cancel || null };
      if (newStylistId !== undefined) payload.stylistId = newStylistId === "" ? null : newStylistId;
      if (serviceIds) payload.serviceIds = serviceIds;
      if (comboIds) payload.comboIds = comboIds;

      const res = await fetch(`${API_URL}/datlich/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        let updatedStylistName = undefined;
        if (newStylistId) {
          const st = stylists.find((s) => String(s.Id_user) === String(newStylistId));
          if (st) updatedStylistName = st.Name_user;
        }

        const targetBooking = bookings.find(x => x.id === bookingId) || {};
        let newServiceNames = targetBooking.service_names;
        let newComboNames = targetBooking.combo_names;

        if (serviceIds || comboIds) {
          const sNames = (serviceIds || []).map((id: number) => {
            const s = services.find((x: any) => x.Id_services === id);
            return s ? s.Name : "";
          }).filter(Boolean);
          const cNames = (comboIds || []).map((id: number) => {
            const c = combos.find((x: any) => x.Id_combo === id);
            return c ? c.Name : "";
          }).filter(Boolean);

          newServiceNames = sNames.length > 0 ? sNames.join(", ") : null;
          newComboNames = cNames.length > 0 ? cNames.join(", ") : null;
        }

        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? {
            ...b,
            status: newStatus,
            description_cancel: description_cancel || b.description_cancel,
            stylist_id: newStylistId !== undefined ? (newStylistId === "" ? null : newStylistId) : b.stylist_id,
            stylist_name: newStylistId !== undefined ? (newStylistId === "" ? null : (updatedStylistName || b.stylist_name)) : b.stylist_name,
            service_ids: serviceIds || b.service_ids,
            combo_ids: comboIds || b.combo_ids,
            service_names: serviceIds || comboIds ? newServiceNames : b.service_names,
            combo_names: serviceIds || comboIds ? newComboNames : b.combo_names
          } : b))
        );
        await fetchData(); // Đợi load xong data từ server để bảo đảm đồng bộ 100%
        window.dispatchEvent(new Event('booking_status_updated'));
        
        if (newStatus === "cancelled") {
          toast.error("Đã huỷ lịch hẹn thành công");
        } else {
          toast.success("Cập nhật thành công");
        }
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      toast.error("Lỗi kết nối.");
    }
  };

  const filteredBookings = useMemo(() => {
    const today = new Date();
    return bookings.filter((b) => {
      // 1. Store filter
      if (!isAdminTong) {
        const storeObj = stores.find((s) => String(s.Id_store) === String(adminStoreId));
        if (!storeObj || String(b.store_name) !== String(storeObj.Name_store)) return false;
      } else if (storeId && String(b.store_name) !== String(storeId)) {
        const storeObj = stores.find((s) => String(s.Id_store) === String(storeId));
        if (storeObj && b.store_name !== storeObj.Name_store) return false;
      }
      // 2. Stylist filter
      if (stylistId && String(b.stylist_id) !== String(stylistId)) return false;

      // 3. Search Term (Phone or Name)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchName = String(b.customer_name || "").toLowerCase().includes(searchLower);
        const matchPhone = String(b.customer_phone || "").toLowerCase().includes(searchLower);
        if (!matchName && !matchPhone) return false;
      }

      // 4. Date Filter mode ('day' | 'month' | 'year')
      if (b.booking_date) {
        const bd = new Date(b.booking_date);
        const filterD = selectedDate ? new Date(selectedDate) : today;
        if (dateMode === "day") {
          // Filter exactly today
          if (bd.getDate() !== filterD.getDate() || bd.getMonth() !== filterD.getMonth() || bd.getFullYear() !== filterD.getFullYear()) {
            return false;
          }
        } else if (dateMode === "month") {
          if (bd.getMonth() !== filterD.getMonth() || bd.getFullYear() !== filterD.getFullYear()) return false;
        } else if (dateMode === "year") {
          if (bd.getFullYear() !== filterD.getFullYear()) return false;
        }
      }

      // 5. Status filter
      if (statusFilter && b.status !== statusFilter) return false;

      return true;
    });
  }, [bookings, storeId, stylistId, searchTerm, dateMode, selectedDate, statusFilter, stores]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.phone || !newBooking.storeId || !newBooking.stylistId || !newBooking.date || !newBooking.time) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }
    if (newBooking.serviceIds.length === 0 && newBooking.comboIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 dịch vụ hoặc combo.");
      return;
    }

    if (!newBookingStylists.find(s => String(s.Id_user) === String(newBooking.stylistId))) {
      toast.error("Thợ cắt đã chọn không còn trống với khung giờ và thời lượng này. Vui lòng kiểm tra lại dịch vụ và thời gian.");
      return;
    }

    setCreateLoading(true);
    try {
      const res = await fetch(`${API_URL}/datlich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBooking),
      });

      if (res.ok) {
        toast.success("Tạo lịch hẹn thành công!");
        setShowCreateModal(false);
        setNewBooking({
          phone: "",
          customerName: "",
          storeId: "",
          stylistId: "",
          date: new Date().toISOString().split('T')[0],
          time: "09:00",
          serviceIds: [],
          comboIds: [],
          note: "Admin tạo lịch trực tiếp."
        });
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.message || "Lỗi khi tạo lịch hẹn.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi kết nối server.");
    } finally {
      setCreateLoading(false);
    }
  };

  const toggleService = (id: number) => {
    setNewBooking(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(id)
        ? prev.serviceIds.filter(sid => sid !== id)
        : [...prev.serviceIds, id]
    }));
  };

  const toggleCombo = (id: number) => {
    setNewBooking(prev => ({
      ...prev,
      comboIds: prev.comboIds.includes(id)
        ? prev.comboIds.filter(cid => cid !== id)
        : [...prev.comboIds, id]
    }));
  };

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage) || 1;
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";

    // Nếu là dạng full datetime (2026-04-16T16:00:00...)
    if (timeStr.includes("T")) {
      const d = new Date(timeStr);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }

    // Nếu là HH:mm:ss
    if (timeStr.length >= 5) {
      return timeStr.slice(11, 16);
    }

    return timeStr;
  };

  const formatDateLabel = (dateRaw: string) => {
    if (!dateRaw) return "";
    const d = new Date(dateRaw);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "● Chờ xử lý", classes: "bg-[#FFFbeb] border-[#fde68a] text-[#d97706]" };
      case "confirmed":
        return { label: "● Phê duyệt", classes: "bg-[#EFF6FF] border-[#bfdbfe] text-[#2563EB]" };
      case "processing":
        return { label: "● Đang làm", classes: "bg-[#FAF5FF] border-[#e9d5ff] text-[#9333ea]" };
      case "completed":
        return { label: "● Hoàn thành", classes: "bg-[#ECFDF5] border-[#a7f3d0] text-[#059669]" };
      case "cancelled":
        return { label: "● Đã hủy", classes: "bg-[#FEF2F2] border-[#fecaca] text-[#DC2626]" };
      default:
        return { label: status, classes: "bg-gray-100 text-gray-600" };
    }
  };

  // Today's date logic for consistent filtering
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-CA'); // Local YYYY-MM-DD
  const isToday = (dateRaw: string) => {
    if (!dateRaw) return false;
    return new Date(dateRaw).toLocaleDateString('en-CA') === todayStr;
  };

  // Queue - "Hàng chờ" (pending today)
  const todayPending = bookings.filter((b) => b.status === "pending" && isToday(b.booking_date));

  // Performance - "Hiệu suất hôm nay"
  const todayBookings = bookings.filter((b) => isToday(b.booking_date));
  const servedToday = todayBookings.filter((b) => b.status === "completed").length;
  const cancelledToday = todayBookings.filter((b) => b.status === "cancelled").length;
  let perfRaw = todayBookings.length > 0 ? (servedToday / todayBookings.length) * 100 : 0;
  const performancePct = Math.round(perfRaw);

  return (
    <main className="flex-1 bg-[#F8FAFC] py-8 px-[32px]">
      {/* HEADER */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Quản lý Lịch Hẹn</h2>
          <p className="text-sm text-[#64748B] mt-1">
            Theo dõi và điều phối lịch hẹn toàn hệ thống.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="flex items-center gap-2 border border-slate-200 bg-white px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
            <i className={`fa-solid fa-rotate-right ${loading ? 'animate-spin' : ''}`}></i>
            Tải lại
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#0077B6] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#005f91] transition"
          >
            <i className="fa-solid fa-plus"></i>
            Tạo lịch hẹn
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT */}
        <div className="col-span-9 space-y-6">
          {/* FILTER */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3">
            <select
              className="border border-slate-200 w-56 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 disabled:opacity-60 disabled:bg-gray-100"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              disabled={!isAdminTong}
            >
              <option value="">Tất cả Chi nhánh</option>
              {stores.map((s) => (
                <option key={s.Id_store} value={s.Id_store}>
                  {s.Name_store}
                </option>
              ))}
            </select>

            <select
              className="border border-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              value={stylistId}
              onChange={(e) => setStylistId(e.target.value)}
            >
              <option value="">Tất cả Thợ cắt</option>
              {stylists.map((st) => (
                <option key={st.Id_user} value={st.Id_user}>
                  {st.Name_user}
                </option>
              ))}
            </select>

            <select
              className="border border-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-40 truncate"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả Trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="confirmed">Phê duyệt</option>
              <option value="processing">Đang làm</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>

            <div className="ml-auto flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setDateMode('day');
                }}
                className="border border-slate-200 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-600 outline-none"
              />
              <div className="flex border border-[#e2e8f0] rounded-lg overflow-hidden text-sm font-medium">
                <button
                  onClick={() => setDateMode('day')}
                  className={`px-4 py-1.5 transition ${dateMode === 'day' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  Ngày
                </button>
                <button
                  onClick={() => setDateMode('month')}
                  className={`px-4 py-1.5 border-l border-[#e2e8f0] transition ${dateMode === 'month' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  Tháng
                </button>
                <button
                  onClick={() => setDateMode('year')}
                  className={`px-4 py-1.5 border-l border-[#e2e8f0] transition ${dateMode === 'year' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  Năm
                </button>
              </div>
            </div>
          </div>

          {/* TABLE CARD */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            {/* TOP */}
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold">Danh sách lịch hẹn ({filteredBookings.length})</h3>

              <div className="relative w-[241px] h-[38px]">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Tìm tên khách, SĐT..."
                  className="w-full h-full pl-9 pr-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-400 border-b border-[#F1F5F9]">
                  <tr className="text-left">
                    <th className="py-3 font-medium cursor-pointer">Khách hàng</th>
                    <th className="py-3 font-medium cursor-pointer">Thợ cắt</th>
                    <th className="py-3 font-medium cursor-pointer w-[200px]">Dịch vụ</th>
                    <th className="py-3 font-medium cursor-pointer">Thời gian</th>
                    <th className="py-3 font-medium cursor-pointer">Trạng thái</th>
                    <th className="py-3 font-medium text-right pr-2">Thao tác</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#F1F5F9]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        Đang kêt nối cơ sở dữ liệu...
                      </td>
                    </tr>
                  ) : paginatedBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        Không tìm thấy lịch hẹn nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    paginatedBookings.map((b) => {
                      const statInfo = getStatusInfo(b.status);
                      return (
                        <tr key={b.id} className="hover:bg-slate-50 transition min-h-[70px]">
                          <td className="py-4">
                            <p className="font-semibold text-[#0F172A]">{b.customer_name || "Khách không tên"}</p>
                            <p className="text-xs text-slate-400 mt-1">{b.customer_phone}</p>
                          </td>

                          <td className="text-[#334155]">{b.stylist_name || "Chưa chọn"}</td>

                          <td>
                            <div className="flex flex-wrap gap-1 mt-1 pr-4 max-w-[200px]">
                              {b.service_names ? (
                                b.service_names.split(",").map((sv: string, i: number) => (
                                  <span
                                    key={i}
                                    className="px-2 py-1 font-medium bg-[#F8FAFC] border border-slate-200 text-[#475569] rounded text-xs whitespace-nowrap"
                                  >
                                    {sv.trim()}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-400 italic text-xs">Không có dịch vụ</span>
                              )}
                            </div>
                          </td>

                          <td>
                            <p className="font-medium text-[#0F172A]">{formatDateLabel(b.booking_date)}</p>
                            <p className="text-xs text-[#64748B] mt-1">{formatTime(b.start_time)}</p>
                          </td>

                          <td>
                            <span
                              className={`px-2 py-1 font-bold rounded text-xs inline-block min-w-max border ${statInfo.classes}`}
                            >
                              {statInfo.label}
                            </span>
                          </td>

                          <td className="space-x-4 text-slate-400 text-right pr-4 text-base">
                            <i
                              title="Xem chi tiết"
                              className="fa-regular fa-eye cursor-pointer hover:text-blue-500 transition"
                              onClick={() => openDetailModal(b)}
                            ></i>

                            {b.status === 'pending' && (
                              <i
                                title="Xác nhận lịch"
                                className="fa-regular fa-circle-check cursor-pointer hover:text-green-500 transition"
                                onClick={() => openDetailModal(b, { bookingId: b.id, newStatus: "confirmed" })}
                              ></i>
                            )}

                            {b.status === 'confirmed' && (
                              <i
                                title="Đã hoàn thành"
                                className="fa-solid fa-check-double cursor-pointer hover:text-green-600 transition"
                                onClick={() => handleUpdateStatus(b.id, 'completed')}
                              ></i>
                            )}

                            {(b.status !== 'completed' && b.status !== 'cancelled') && (
                              <i
                                title="Hủy lịch"
                                className="fa-solid fa-ban cursor-pointer hover:text-red-500 transition"
                                onClick={() => openDetailModal(b, { bookingId: b.id, newStatus: "cancelled" })}
                              ></i>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="flex justify-between items-center mt-6 text-sm text-[#64748B] border-t border-slate-100 pt-4">
              <p>
                Hiển thị {(currentPage - 1) * itemsPerPage + (filteredBookings.length > 0 ? 1 : 0)}–
                {Math.min(currentPage * itemsPerPage, filteredBookings.length)} trên tổng số {filteredBookings.length}
              </p>

              <div className="flex gap-2">
                <button
                  className="border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Trước
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    className={`px-3 py-1.5 rounded-lg transition ${currentPage === idx + 1
                      ? "bg-[#0077B6] text-white"
                      : "border border-slate-200 hover:bg-slate-50"
                      }`}
                    onClick={() => setCurrentPage(idx + 1)}
                  >
                    {idx + 1}
                  </button>
                ))}

                <button
                  className="border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Tiếp
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="col-span-3 space-y-6">
          {/* PERFORMANCE TODAY */}
          <div className="rounded-2xl p-6 text-white bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] shadow-md shadow-indigo-100">
            <p className="text-sm opacity-80 font-medium">Hiệu suất hôm nay</p>

            <div className="flex items-end gap-2 my-3">
              <h2 className="text-4xl font-bold">{performancePct}%</h2>
              <span className="text-xs opacity-70 mb-1">hoàn thành</span>
            </div>

            <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden mt-1 mb-5">
              <div
                className="bg-white h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${performancePct}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div>
                <p className="opacity-80 text-xs">Đã phục vụ</p>
                <p className="font-bold text-xl mt-0.5">{servedToday}</p>
              </div>

              <div>
                <p className="opacity-80 text-xs">Hủy lịch</p>
                <p className="font-bold text-xl mt-0.5">{cancelledToday}</p>
              </div>
            </div>

            <p className="text-[11px] opacity-70 mt-3 text-center w-full">
              Dựa trên tổng số {todayBookings.length} lịch hẹn
            </p>
          </div>

          {/* QUEUE */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold flex items-center gap-2 text-[#0F172A]">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
                Hàng chờ ({todayPending.length})
              </h4>
            </div>

            <div className="space-y-3 text-sm max-h-[500px] overflow-y-auto pr-1">
              {todayPending.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <i className="fa-regular fa-face-smile text-2xl mb-2"></i>
                  <p>Hôm nay không có khách chờ</p>
                </div>
              ) : (
                todayPending.map((p) => {
                  const services = typeof p.service_names === 'string' ? p.service_names.split(',')[0] : 'N/A';
                  return (
                    <div key={p.id} className="border border-slate-100 bg-slate-50/50 rounded-xl p-3.5 hover:bg-slate-50 transition hover:shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-[#1E293B] truncate max-w-[120px]" title={p.customer_name}>
                            {p.customer_name || "Khách"}
                          </p>
                          <p className="text-[#64748B] text-[11px] mt-1 pr-1 truncate max-w-[130px]" title={p.service_names}>
                            {services}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-orange-500 text-xs bg-orange-50 px-2 py-1 rounded-md">
                            {formatTime(p.start_time)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {todayPending.length > 0 && (
              <div className="flex justify-between items-center text-sm mt-4 pt-3 border-t border-slate-100">
                <span className="text-[#64748B]">Tổng đang chờ:</span>
                <span className="text-[#1E293B] font-bold text-base">{todayPending.length} <span className="text-xs font-normal">lịch</span></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL XEM CHI TIẾT */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center bg-[#F8FAFC] px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-[#0F172A] text-lg">Chi tiết lịch hẹn</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 transition w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Khách hàng</p>
                  <p className="font-semibold text-[#1E293B]">{selectedBooking.customer_name || "Khách vãng lai"}</p>
                  <p className="text-sm text-slate-500">{selectedBooking.customer_phone}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Trạng thái</p>
                  <span className={`px-2 py-1 font-bold rounded text-xs inline-block border ${getStatusInfo(selectedBooking.status).classes}`}>
                    {getStatusInfo(selectedBooking.status).label}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Chi nhánh</p>
                  <p className="font-medium text-[#334155]">{selectedBooking.store_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">
                    {pendingAction?.newStatus === "confirmed" ? "Phân công thợ *" : "Thợ cắt"}
                  </p>
                  {pendingAction?.newStatus === "confirmed" ? (
                    fetchingStylists ? (
                      <div className="text-sm text-slate-400">Đang tìm thợ rảnh...</div>
                    ) : availableStylists.length > 0 ? (
                      <select
                        className="w-full border rounded-lg px-2 py-1 text-sm focus:outline-none border-slate-200 focus:border-blue-500"
                        value={assignStylistId}
                        onChange={(e) => setAssignStylistId(e.target.value)}
                      >
                        <option value="">25Zone chọn giúp bạn</option>
                        {availableStylists.map(st => (
                          <option key={st.Id_user} value={st.Id_user}>{st.Name_user}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-xs text-red-500">Kín lịch lúc {formatTime(selectedBooking.start_time)}!</p>
                    )
                  ) : (
                    <p className="font-medium text-[#334155]">{selectedBooking.stylist_name || "Chưa phân công"}</p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <p className="text-xs text-slate-500 mb-1">Thời gian đặt</p>
                <p className="font-medium text-[#334155]">
                  Ngày {formatDateLabel(selectedBooking.booking_date)} - Vào lúc {formatTime(selectedBooking.start_time)}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs text-slate-500">{pendingAction?.newStatus === "confirmed" ? "Chỉnh sửa dịch vụ" : "Dịch vụ đã chọn"}</p>
                  {pendingAction?.newStatus === "confirmed" && (
                    <button
                      onClick={() => setShowAddService(!showAddService)}
                      className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium"
                    >
                      <i className={`fa-solid ${showAddService ? 'fa-minus' : 'fa-plus'}`}></i>
                      {showAddService ? 'Đóng' : 'Thêm dịch vụ'}
                    </button>
                  )}
                </div>

                {pendingAction?.newStatus === "confirmed" ? (
                  <div className="space-y-3">
                    {/* Danh sách các dịch vụ ĐANG ĐƯỢC CHỌN */}
                    <div className="flex flex-wrap gap-2">
                      {combos.filter(c => confirmComboIds.includes(c.Id_combo)).map(c => (
                        <span key={`sel-c-${c.Id_combo}`} className="flex px-3 py-1.5 rounded-full text-xs font-medium transition border bg-blue-600 text-white border-blue-600 shadow-sm">
                          {c.Name}
                          <button onClick={() => setConfirmComboIds(prev => prev.filter(id => id !== c.Id_combo))} className="text-blue-400 hover:text-red-500 w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-50 transition">
                            <i className="fa-solid fa-xmark text-[10px]"></i>
                          </button>
                        </span>
                      ))}
                      {services.filter(s => confirmServiceIds.includes(s.Id_services)).map(s => (
                        <span key={`sel-s-${s.Id_services}`} className="flex px-3 py-1.5 rounded-full text-xs font-medium transition border bg-blue-600 text-white border-blue-600 shadow-sm">
                          {s.Name}
                          <button onClick={() => setConfirmServiceIds(prev => prev.filter(id => id !== s.Id_services))} className="text-blue-400 hover:text-red-500 w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-50 transition">
                            <i className="fa-solid fa-xmark text-[10px]"></i>
                          </button>
                        </span>
                      ))}
                      {confirmComboIds.length === 0 && confirmServiceIds.length === 0 && (
                        <span className="text-slate-400 italic text-sm">Chưa có dịch vụ nào</span>
                      )}
                    </div>

                    {/* Vùng Thêm Dịch Vụ */}
                    {showAddService && (
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-2">Combo</p>
                          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                            {combos.map(c => (
                              <button
                                key={`add-c-${c.Id_combo}`} type="button"
                                onClick={() => handleAdminToggleCombo(c.Id_combo)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${confirmComboIds.includes(c.Id_combo)
                                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                                  }`}
                              >
                                {c.Name}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 mb-2">Dịch vụ lẻ</p>
                          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                            {services.map(s => (
                              <button
                                key={`add-s-${s.Id_services}`} type="button"
                                onClick={() => handleAdminToggleService(s.Id_services)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${confirmServiceIds.includes(s.Id_services)
                                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                                  }`}
                              >
                                {s.Name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedBooking.combo_names && (
                      selectedBooking.combo_names.split(",").map((cb: string, i: number) => (
                        <span
                          key={`cb-${i}`}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-100"
                        >
                          {cb.trim()}
                        </span>
                      ))
                    )}
                    {selectedBooking.service_names && (
                      selectedBooking.service_names.split(",").map((sv: string, i: number) => (
                        <span
                          key={`sv-${i}`}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100"
                        >
                          {sv.trim()}
                        </span>
                      ))
                    )}
                    {!selectedBooking.service_names && !selectedBooking.combo_names && (
                      <span className="text-slate-400 italic text-sm">Không có dịch vụ</span>
                    )}
                  </div>
                )}
              </div>

              {/* MODE HUỶ */}
              {pendingAction?.newStatus === "cancelled" ? (
                <div className="border-t border-slate-100 pt-5">
                  <p className="text-xs text-slate-500 mb-2">Lý do huỷ *</p>
                  <textarea
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${cancelError ? "border-red-500" : "border-slate-200 focus:border-blue-500"
                      }`}
                    rows={3}
                    placeholder="Nhập lý do huỷ lịch..."
                    value={cancelReason}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCancelReason(value);

                      // clear lỗi khi user nhập lại
                      if (value.trim()) {
                        setCancelError("");
                      }
                    }}
                  />

                  {/* TEXT LỖI */}
                  {cancelError && (
                    <p className="text-red-500 text-xs mt-1">{cancelError}</p>
                  )}
                </div>
              ) : (
                /* MODE XEM BÌNH THƯỜNG */
                selectedBooking.note && (
                  <div className="border-t border-slate-100 pt-5">
                    <p className="text-xs text-slate-500 mb-1">
                      {selectedBooking.status === "cancelled" ? "Lý do huỷ" : "Ghi chú"}
                    </p>

                    <p className={`text-sm p-3 rounded-lg border ${selectedBooking.status === "cancelled"
                      ? "text-red-600 bg-red-50 border-red-100"
                      : "text-[#334155] bg-slate-50 border-slate-100"
                      }`}>
                      {selectedBooking.status === "cancelled"
                        ? selectedBooking.description_cancel
                        : selectedBooking.note}
                    </p>
                  </div>
                )
              )}

              {/* HÌNH ẢNH KẾT QUẢ KHI HOÀN THÀNH */}
              {selectedBooking.status === "completed" && !pendingAction && (
                <div className="border-t border-slate-100 pt-5 mt-2">
                  <div className="flex justify-between flex-wrap gap-2 items-center mb-3">
                    <p className="text-xs text-slate-500">Hình ảnh kết quả dịch vụ</p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleUploadResultImages}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImages || fetchingImages}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded drop-shadow-sm hover:bg-blue-100 whitespace-nowrap disabled:opacity-50"
                    >
                      {uploadingImages ? <i className="fa-solid fa-spinner fa-spin mr-1"></i> : <i className="fa-solid fa-cloud-arrow-up mr-1"></i>}
                      Tải lên hình ảnh
                    </button>
                  </div>
                  {fetchingImages ? (
                    <p className="text-xs text-gray-400 italic">Đang tải hình ảnh...</p>
                  ) : resultImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {resultImages.map((img, idx) => (
                        <div key={idx} className="aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                          <img src={`http://localhost:5001${img}`} alt="Result image" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Chưa có hình ảnh nào.</p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-[#F8FAFC] px-6 py-4 border-t border-slate-100 flex justify-end">
              {/* Nút xác nhận */}
              {pendingAction?.newStatus === "confirmed" && (
                <button
                  onClick={async () => {
                    const requiresStylist = () => {
                      for (const sId of confirmServiceIds) {
                        const s = services.find(x => x.Id_services === sId);
                        if (s && SINGLE_SELECT_CATEGORY_IDS.includes(s.Id_category)) return true;
                      }
                      for (const cId of confirmComboIds) {
                        const c = combos.find(x => x.Id_combo === cId);
                        if (!c) continue;
                        const cats = typeof c.category_ids === 'string' ? c.category_ids.split(',').filter((x: string) => x && x !== 'null').map(Number) : (Array.isArray(c.category_ids) ? c.category_ids.map(Number) : []);
                        if (cats.some(catId => SINGLE_SELECT_CATEGORY_IDS.includes(catId))) return true;
                      }
                      return false;
                    };

                    const isRequired = requiresStylist();

                    if (isRequired && !assignStylistId) {
                      setCancelError("Vui lòng chọn thợ cắt vì danh sách dịch vụ hiện tại bắt buộc phải có thợ (Cắt/Uốn/Nhuộm)!");
                      toast.error("Vui lòng chọn thợ cắt vì danh sách dịch vụ hiện tại bắt buộc phải có thợ (Cắt/Uốn/Nhuộm)!");
                      return;
                    }
                    if (confirmServiceIds.length === 0 && confirmComboIds.length === 0) {
                      toast.error("Vui lòng chọn ít nhất 1 dịch vụ hoặc combo.");
                      return;
                    }

                    const oldServiceIds = selectedBooking.service_ids || [];
                    const oldComboIds = selectedBooking.combo_ids || [];
                    const oldStylistId = String(selectedBooking.stylist_id || "");

                    const finalStylistId = isRequired ? assignStylistId : "";

                    const servicesChanged =
                      confirmServiceIds.length !== oldServiceIds.length ||
                      !confirmServiceIds.every(id => oldServiceIds.includes(id));
                    const combosChanged =
                      confirmComboIds.length !== oldComboIds.length ||
                      !confirmComboIds.every(id => oldComboIds.includes(id));

                    const stylistChanged = finalStylistId !== oldStylistId;

                    if (servicesChanged || combosChanged || stylistChanged) {
                      setShowConfirmChangesModal(true);
                    } else {
                      await handleUpdateStatus(
                        pendingAction.bookingId,
                        pendingAction.newStatus,
                        undefined,
                        finalStylistId,
                        undefined,
                        confirmServiceIds,
                        confirmComboIds
                      );
                      setPendingAction(null);
                      setShowDetailModal(false);
                    }
                  }}
                  disabled={fetchingStylists}
                  className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  Xác nhận lịch
                </button>
              )}
              {/* Nút xác nhận huỷ */}
              {pendingAction?.newStatus === "cancelled" && (
                <button
                  onClick={async () => {
                    if (!cancelReason.trim()) {
                      setCancelError("Vui lòng nhập lý do huỷ");
                      return;
                    }

                    await handleUpdateStatus(
                      pendingAction.bookingId,
                      "cancelled",
                      cancelReason
                    );

                    setCancelReason("");
                    setPendingAction(null);
                    setShowDetailModal(false);
                  }}
                  className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
                >
                  Xác nhận huỷ
                </button>
              )}
              {/* Nút đóng */}
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 ml-2 py-2.5 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TẠO LỊCH HẸN */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center bg-[#F8FAFC] px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-[#0F172A] text-lg">Tạo lịch hẹn mới</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 transition w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Số điện thoại *</label>
                  <input
                    type="text" required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Nhập SĐT khách..."
                    value={newBooking.phone}
                    onChange={e => setNewBooking({ ...newBooking, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Tên khách hàng</label>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Nhập tên khách (không bắt buộc)..."
                    value={newBooking.customerName}
                    onChange={e => setNewBooking({ ...newBooking, customerName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Chi nhánh *</label>
                  <select
                    required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    value={newBooking.storeId}
                    onChange={e => setNewBooking({ ...newBooking, storeId: e.target.value })}
                  >
                    <option value="">Chọn chi nhánh</option>
                    {stores.map(s => <option key={s.Id_store} value={s.Id_store}>{s.Name_store}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Thợ cắt * {fetchingNewBookingStylists && <i className="fa-solid fa-spinner fa-spin ml-1 text-blue-500"></i>}
                  </label>
                  <select
                    required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    value={newBooking.stylistId}
                    onChange={e => setNewBooking({ ...newBooking, stylistId: e.target.value })}
                    disabled={!newBooking.storeId || !newBooking.date || !newBooking.time || fetchingNewBookingStylists}
                  >
                    <option value="">{fetchingNewBookingStylists ? "Đang tải..." : (!newBooking.storeId || !newBooking.date || !newBooking.time) ? "Nhập chi nhánh ngày giờ trước" : "Chọn thợ cắt"}</option>
                    {newBookingStylists.map(s => <option key={s.Id_user} value={s.Id_user}>{s.Name_user}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Ngày hẹn *</label>
                  <input
                    type="date" required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    value={newBooking.date}
                    onChange={e => setNewBooking({ ...newBooking, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Giờ hẹn *</label>
                  <input
                    type="time" required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    value={newBooking.time}
                    onChange={e => setNewBooking({ ...newBooking, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs font-semibold text-slate-500 uppercase">Chọn Combo</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-slate-100 rounded-lg bg-slate-50">
                  {combos.map(c => (
                    <button
                      key={c.Id_combo} type="button"
                      onClick={() => toggleCombo(c.Id_combo)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${newBooking.comboIds.includes(c.Id_combo)
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                        }`}
                    >
                      {c.Name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs font-semibold text-slate-500 uppercase">Chọn Dịch vụ (tối đa 3)</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-slate-100 rounded-lg bg-slate-50">
                  {services.map(s => (
                    <button
                      key={s.Id_services} type="button"
                      disabled={!newBooking.serviceIds.includes(s.Id_services) && newBooking.serviceIds.length >= 3}
                      onClick={() => toggleService(s.Id_services)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${newBooking.serviceIds.includes(s.Id_services)
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 disabled:opacity-50"
                        }`}
                    >
                      {s.Name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs font-semibold text-slate-500 uppercase">Ghi chú</label>
                <textarea
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  rows={2}
                  placeholder="Ghi chú cho thợ..."
                  value={newBooking.note}
                  onChange={e => setNewBooking({ ...newBooking, note: e.target.value })}
                ></textarea>
              </div>

              <div className="sticky bottom-0 pt-4 pb-2 bg-white border-t border-slate-50 flex justify-end gap-3 shrink-0">
                <button
                  type="button" onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit" disabled={createLoading}
                  className="px-8 py-2.5 bg-[#0077B6] text-white font-bold rounded-xl hover:opacity-90 shadow-md shadow-blue-100 disabled:opacity-50 flex items-center gap-2"
                >
                  {createLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check"></i>}
                  Xác nhận đặt lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ERROR MODAL */}
      {completeErrorModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-clock text-3xl text-red-500"></i>
              </div>
              <h3 className="font-bold text-[#0F172A] text-lg mb-2">Chưa hoàn thành</h3>
              <p className="text-sm text-slate-600 mb-6">
                Vui lòng chờ dịch vụ kết thúc để có thể xác nhận.<br />
                <span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded inline-block mt-2">
                  {completeErrorModal.message}
                </span>
                <span className="block text-[11.5px] text-slate-400 mt-4 italic">
                  * Có thể bấm hoàn thành sớm trước 15 phút
                </span>
              </p>
              <button
                onClick={() => setCompleteErrorModal({ show: false, message: "" })}
                className="w-full px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EARLY COMPLETE CONFIRM MODAL */}
      {earlyCompleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-triangle-exclamation text-3xl text-amber-500"></i>
              </div>
              <h3 className="font-bold text-[#0F172A] text-lg mb-2">Hoàn thành sớm</h3>
              <p className="text-sm text-slate-600 mb-6">
                Chưa tới giờ kết thúc dự kiến.<br />
                <span className="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block mt-2">
                  {earlyCompleteModal.message}
                </span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setEarlyCompleteModal({ show: false, bookingId: null, message: "" })}
                  className="w-full px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    if (earlyCompleteModal.bookingId) {
                      handleUpdateStatus(earlyCompleteModal.bookingId, "completed", undefined, undefined, true);
                    }
                    setEarlyCompleteModal({ show: false, bookingId: null, message: "" });
                  }}
                  className="w-full px-4 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition"
                >
                  Xác nhận xong
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* CONFIRM CHANGES MODAL */}
      {showConfirmChangesModal && pendingAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-circle-info text-3xl text-blue-500"></i>
              </div>
              <h3 className="font-bold text-[#0F172A] text-lg mb-2">Xác nhận thay đổi</h3>
              <p className="text-sm text-slate-600 mb-6">
                Bạn đã thay đổi dịch vụ hoặc thợ cắt so với lựa chọn ban đầu của khách hàng.
                Bạn có chắc chắn muốn xác nhận lịch hẹn với các thay đổi này không?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmChangesModal(false)}
                  className="w-full px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition"
                >
                  Kiểm tra lại
                </button>
                <button
                  onClick={async () => {
                    const oldStylistId = String(selectedBooking.stylist_id || "");
                    const stylistChanged = assignStylistId !== oldStylistId;

                    await handleUpdateStatus(
                      pendingAction.bookingId,
                      pendingAction.newStatus,
                      undefined,
                      stylistChanged ? assignStylistId : undefined,
                      undefined,
                      confirmServiceIds,
                      confirmComboIds
                    );
                    setShowConfirmChangesModal(false);
                    setPendingAction(null);
                    setShowDetailModal(false);
                  }}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
                >
                  Xác nhận lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP XUNG ĐỘT */}
      {pendingConflict && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-5 rounded-2xl w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-triangle-exclamation text-lg"></i>
              </div>
              <h2 className="text-lg font-bold text-slate-800">
                Xác nhận thay thế
              </h2>
            </div>

            <p className="text-sm text-slate-600 mb-3">
              {pendingConflict.message}
            </p>
            <ul className="text-xs text-orange-600 font-medium mb-5 bg-orange-50 p-3 rounded-xl space-y-1">
              {pendingConflict.conflictNames.map((name, i) => (
                <li key={i}>• {name}</li>
              ))}
            </ul>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingConflict(null)}
                className="px-4 py-2 text-sm font-semibold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition"
              >
                Huỷ bỏ
              </button>
              <button
                onClick={() => {
                  if (pendingConflict.targetType === "service") {
                    setConfirmServiceIds(prev => {
                      const next = prev.filter(id => !pendingConflict.removeServiceIds.includes(id));
                      return [...next, pendingConflict.targetId];
                    });
                    setConfirmComboIds(prev => prev.filter(id => !pendingConflict.removeComboIds.includes(id)));
                  } else {
                    setConfirmComboIds(prev => {
                      const next = prev.filter(id => !pendingConflict.removeComboIds.includes(id));
                      return [...next, pendingConflict.targetId];
                    });
                    setConfirmServiceIds(prev => prev.filter(id => !pendingConflict.removeServiceIds.includes(id)));
                  }
                  setPendingConflict(null);
                }}
                className="px-4 py-2 text-sm font-semibold bg-orange-500 text-white rounded-xl hover:bg-orange-600 shadow-sm shadow-orange-500/20 transition"
              >
                Đồng ý thay thế
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
