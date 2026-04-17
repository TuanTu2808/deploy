"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";

// API endpoints Configuration
const API_URL = "http://localhost:5001/api";

const extractMinutes = (timeStr: string) => {
  if (!timeStr) return 0;
  if (!timeStr.includes(":")) return Number(timeStr) || 0;
  const [h = "0", m = "0"] = timeStr.split(":");
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
  const [storeId, setStoreId] = useState("");
  const [stylistId, setStylistId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateMode, setDateMode] = useState<"day" | "month" | "year">("day");
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

  const [cancelError, setCancelError] = useState("");

  const [completeErrorModal, setCompleteErrorModal] = useState<{show: boolean, message: string}>({show: false, message: ""});
  const [earlyCompleteModal, setEarlyCompleteModal] = useState<{show: boolean, bookingId: number | null, message: string}>({show: false, bookingId: null, message: ""});
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
    if (pendingAction?.newStatus === "confirmed" && !selectedBooking?.stylist_id) {
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

            const durationMin = selectedBooking.total_duration_minutes || 30; // fallback 30 phút
            const numSlotsRequired = Math.max(1, Math.ceil(durationMin / 30));

            const filtered = data.filter((st: any) => {
              if (!st.hours) return false;
              
              const startIndex = st.hours.findIndex((h: any) => h.Hours.substring(0, 5) === targetHHmm);
              if (startIndex === -1) return false;

              // Check if enough consecutive slots are available
              const slotsToCheck = st.hours.slice(startIndex, startIndex + numSlotsRequired);
              
              if (slotsToCheck.length < numSlotsRequired) return false;
              
              return slotsToCheck.every((h: any) => h.Status === 1);
            });

            setAvailableStylists(filtered);
            if (filtered.length > 0) setAssignStylistId(String(filtered[0].Id_user));
          }
        } catch (error) {
          console.error("Lỗi lấy danh sách thợ:", error);
        } finally {
          setFetchingStylists(false);
        }
      };
      
      loadAvailableStylists();
    } else {
      setAvailableStylists([]);
      setAssignStylistId("");
    }
  }, [pendingAction, selectedBooking, stores]);

  const openDetailModal = async (b: any, action?: { bookingId: number, newStatus: string }) => {
    setSelectedBooking(b);
    if (action) {
       setPendingAction(action);
    } else {
       setPendingAction(null);
    }
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
        alert("Upload thành công!");
      } else {
        const err = await res.json();
        alert(err.message || "Lỗi upload ảnh.");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối.");
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
        fetch(`${API_URL}/combodichvu`),
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
      setCombos(Array.isArray(comboData) ? comboData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Có lỗi xảy ra khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: number, newStatus: string, description_cancel?: string, newStylistId?: string, forceComplete?: boolean) => {
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
             const endFormatted = `${String(endDate.getHours()).padStart(2,"0")}:${String(endDate.getMinutes()).padStart(2,"0")}`;

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
      if (newStylistId) payload.stylistId = newStylistId;

      const res = await fetch(`${API_URL}/datlich/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        let updatedStylistName = undefined;
        if (newStylistId) {
          const st = availableStylists.find((s) => String(s.Id_user) === String(newStylistId));
          if (st) updatedStylistName = st.Name_user;
        }

        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { 
            ...b, 
            status: newStatus, 
            description_cancel: description_cancel || b.description_cancel,
            stylist_id: newStylistId || b.stylist_id,
            stylist_name: updatedStylistName || b.stylist_name
          } : b))
        );
        // Notify sidebar to refresh pending count immediately
        window.dispatchEvent(new Event('booking_status_updated'));
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      alert("Lỗi kết nối.");
    }
  };

  const filteredBookings = useMemo(() => {
    const today = new Date();
    return bookings.filter((b) => {
      // 1. Store filter
      if (storeId && String(b.store_name) !== String(storeId)) {
        const storeObj = stores.find((s) => String(s.Id_store) === storeId);
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
        if (dateMode === "day") {
          // Filter exactly today
          if (bd.getDate() !== today.getDate() || bd.getMonth() !== today.getMonth() || bd.getFullYear() !== today.getFullYear()) {
            return false;
          }
        } else if (dateMode === "month") {
          if (bd.getMonth() !== today.getMonth() || bd.getFullYear() !== today.getFullYear()) return false;
        } else if (dateMode === "year") {
          if (bd.getFullYear() !== today.getFullYear()) return false;
        }
      }

      // 5. Status filter
      if (statusFilter && b.status !== statusFilter) return false;

      return true;
    });
  }, [bookings, storeId, stylistId, searchTerm, dateMode, statusFilter, stores]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.phone || !newBooking.storeId || !newBooking.stylistId || !newBooking.date || !newBooking.time) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }
    if (newBooking.serviceIds.length === 0 && newBooking.comboIds.length === 0) {
      alert("Vui lòng chọn ít nhất 1 dịch vụ hoặc combo.");
      return;
    }

    if (!newBookingStylists.find(s => String(s.Id_user) === String(newBooking.stylistId))) {
      alert("Thợ cắt đã chọn không còn trống với khung giờ và thời lượng này. Vui lòng kiểm tra lại dịch vụ và thời gian.");
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
        alert("Tạo lịch hẹn thành công!");
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
        alert(err.message || "Lỗi khi tạo lịch hẹn.");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối server.");
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
      return timeStr.slice(11,16);
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
              className="border border-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
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

            <div className="ml-auto flex border border-[#e2e8f0] rounded-lg overflow-hidden text-sm font-medium">
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
                    {pendingAction?.newStatus === "confirmed" && !selectedBooking.stylist_id ? "Phân công thợ *" : "Thợ cắt"}
                  </p>
                  {pendingAction?.newStatus === "confirmed" && !selectedBooking.stylist_id ? (
                    fetchingStylists ? (
                      <div className="text-sm text-slate-400">Đang tìm thợ rảnh...</div>
                    ) : availableStylists.length > 0 ? (
                      <select 
                        className="w-full border rounded-lg px-2 py-1 text-sm focus:outline-none border-slate-200 focus:border-blue-500"
                        value={assignStylistId}
                        onChange={(e) => setAssignStylistId(e.target.value)}
                      >
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
                <p className="text-xs text-slate-500 mb-2">Dịch vụ đã chọn</p>
                <div className="flex flex-wrap gap-2">
                  {selectedBooking.service_names ? (
                    selectedBooking.service_names.split(",").map((sv: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100"
                      >
                        {sv.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic text-sm">Không có dịch vụ</span>
                  )}
                </div>
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
                    if (!selectedBooking.stylist_id && !assignStylistId) {
                      alert("Không có thợ rảnh để phân công!");
                      return;
                    }
                    await handleUpdateStatus(
                      pendingAction.bookingId,
                      pendingAction.newStatus,
                      undefined,
                      !selectedBooking.stylist_id ? assignStylistId : undefined
                    );
                    setPendingAction(null);
                    setShowDetailModal(false);
                  }}
                  disabled={!selectedBooking.stylist_id && (!assignStylistId || fetchingStylists)}
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
                Vui lòng chờ dịch vụ kết thúc để có thể xác nhận.<br/>
                <span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded inline-block mt-2">
                  {completeErrorModal.message}
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
                Chưa tới giờ kết thúc dự kiến.<br/>
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
    </main>
  );
}
