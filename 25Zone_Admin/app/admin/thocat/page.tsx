"use client";

import React, { useState, useEffect } from "react";
import { API_BASE, authorizedAdminFetch, getAdminStoreId } from "@/app/lib/admin-auth";

export default function StylistPage() {
  const [stylists, setStylists] = useState<any[]>([]);
  const [stores, setStores] = useState([{ Id_store: 1, Name_store: "Mặc định" }]);
  const [loading, setLoading] = useState(true);
  const [selectedStylist, setSelectedStylist] = useState<any>(null);

  const adminStoreId = getAdminStoreId();
  const isAdminTong = adminStoreId === 0 || adminStoreId === null || Number.isNaN(adminStoreId);

  // Pagination & Filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStore, setFilterStore] = useState(isAdminTong ? "all" : String(adminStoreId));
  const [filterRole, setFilterRole] = useState("all");
  const [filterSearch, setFilterSearch] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const itemsPerPage = 7;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Address states
  const [provinces, setProvinces] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedWardId, setSelectedWardId] = useState("");
  const [addressDetail, setAddressDetail] = useState("");

  // Schedule Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    Start_time: "08:00",
    End_time: "21:00",
  });
  const [isWeeklySchedule, setIsWeeklySchedule] = useState(true);

  const getLocalYYYYMMDD = (d = new Date()) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getDatesOfWeek = (dateString: string) => {
    const [y, m, d] = dateString.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const day = dateObj.getDay();
    const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(dateObj);
    monday.setDate(diff);
    
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      dates.push(getLocalYYYYMMDD(nextDay));
    }
    return dates;
  };

  const [thisWeekSchedule, setThisWeekSchedule] = useState<any[]>([]);
  const [thisWeekScheduleLoading, setThisWeekScheduleLoading] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const getTargetWeekDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return getLocalYYYYMMDD(d);
  };

  const fetchThisWeekSchedule = async (userId: string) => {
    try {
      setThisWeekScheduleLoading(true);
      const dates = getDatesOfWeek(getTargetWeekDate());
      const res = await authorizedAdminFetch(`${API_BASE}/api/lichlamviec/week?startDate=${dates[0]}&endDate=${dates[6]}&userId=${userId}&t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setThisWeekSchedule(data || []);
      } else {
        setThisWeekSchedule([]);
      }
    } catch (error) {
      console.error(error);
      setThisWeekSchedule([]);
    } finally {
      setThisWeekScheduleLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStylist) {
      fetchThisWeekSchedule(selectedStylist.Id_user);
    }
  }, [selectedStylist, weekOffset]);

  const fetchSchedule = async (userId: string, date: string) => {
    try {
      setScheduleLoading(true);
      const res = await authorizedAdminFetch(`${API_BASE}/api/lichlamviec?userId=${userId}&date=${date}&t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setScheduleData(data);
        if (data && data.shift) {
          setScheduleForm({
            Start_time: data.shift.Start_time.substring(0, 5),
            End_time: data.shift.End_time.substring(0, 5),
          });
        }
      } else {
        setScheduleData(null);
        setScheduleForm({ Start_time: "08:00", End_time: "21:00" });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setScheduleLoading(false);
    }
  };

  const openScheduleModal = (stylist: any, targetDate?: string, isWeek = false) => {
    const todayStr = getLocalYYYYMMDD();
    const initialDate = targetDate || todayStr;
    setSelectedDate(initialDate); // Tôn trọng ngày bấm hoặc mặc định ngày hôm nay
    setScheduleForm({ Start_time: "08:00", End_time: "21:00" });
    setIsWeeklySchedule(isWeek); // Tôn trọng cờ isWeek (false trừ khi bấm Xếp lịch cả tuần)
    setIsScheduleModalOpen(true);
    fetchSchedule(stylist.Id_user, initialDate);
  };

  const closeScheduleModal = () => setIsScheduleModalOpen(false);

  useEffect(() => {
    if (isScheduleModalOpen && selectedStylist) {
      fetchSchedule(selectedStylist.Id_user, selectedDate);
    }
  }, [selectedDate]);

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStylist) return;

    const todayStr = getLocalYYYYMMDD();
    if (!scheduleData?.shift) {
       if (isWeeklySchedule) {
           const endOfWeek = getDatesOfWeek(selectedDate)[6]; // CN
           if (endOfWeek < todayStr) {
               alert("Tuần này đã hoàn toàn đi qua, không thể xếp lịch mới.");
               return;
           }
       } else {
           if (selectedDate < todayStr) {
               alert("Không thể thiết lập lịch mới cho quá khứ. (Chỉ cho phép sửa lịch đã có sẵn)");
               return;
           }
       }
    }

    try {
      if (isWeeklySchedule) {
        const dates = getDatesOfWeek(selectedDate).filter(d => d >= selectedDate);
        const payload = {
          Id_user: selectedStylist.Id_user,
          dates: dates,
          Start_time: scheduleForm.Start_time,
          End_time: scheduleForm.End_time
        };
        const res = await authorizedAdminFetch(`${API_BASE}/api/lichlamviec/batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          alert("Tạo/Cập nhật lịch cả tuần thành công!");
          fetchSchedule(selectedStylist.Id_user, selectedDate);
          fetchThisWeekSchedule(selectedStylist.Id_user);
        } else {
          const err = await res.json();
          alert(`Lỗi: ${err.message}`);
        }
      } else {
        if (scheduleData?.shift) {
          const res = await authorizedAdminFetch(`${API_BASE}/api/lichlamviec/${scheduleData.shift.Id_work_shifts}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ Start_time: scheduleForm.Start_time, End_time: scheduleForm.End_time })
          });
          if (res.ok) {
            alert("Cập nhật giờ làm việc thành công!");
            fetchSchedule(selectedStylist.Id_user, selectedDate);
            fetchThisWeekSchedule(selectedStylist.Id_user);
          } else {
            const err = await res.json();
            alert(`Lỗi: ${err.message}`);
          }
        } else {
          const payload = {
            Id_user: selectedStylist.Id_user,
            Shift_date: selectedDate,
            Start_time: scheduleForm.Start_time,
            End_time: scheduleForm.End_time
          };
          const res = await authorizedAdminFetch(`${API_BASE}/api/lichlamviec`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            alert("Tạo lịch làm việc thành công!");
            fetchSchedule(selectedStylist.Id_user, selectedDate);
            fetchThisWeekSchedule(selectedStylist.Id_user);
          } else {
            const err = await res.json();
            alert(`Lỗi: ${err.message}`);
          }
        }
      }
    } catch (error) {
      console.error(error);
      alert("Đã xảy ra lỗi hệ thống.");
    }
  };

  const handleDeleteSchedule = async () => {
    if (!scheduleData?.shift) return;
    if (!confirm("Bạn muốn xóa lịch làm việc ngày này? (Sẽ xóa toàn bộ các ca làm việc)")) return;
    try {
      const res = await authorizedAdminFetch(`${API_BASE}/api/lichlamviec/${scheduleData.shift.Id_work_shifts}`, {
        method: "DELETE"
      });
      if (res.ok) {
        alert("Xóa thành công!");
        fetchSchedule(selectedStylist.Id_user, selectedDate);
        fetchThisWeekSchedule(selectedStylist.Id_user);
      } else {
        const err = await res.json();
        alert(`Lỗi: ${err.message}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const [formData, setFormData] = useState({
    Name_user: "",
    Email: "",
    Phone: "",
    Pass_word: "",
    Address: "",
    Image: "",
    Id_store: 1,
  });

  const fetchStylists = async () => {
    try {
      setLoading(true);
      const res = await authorizedAdminFetch(`${API_BASE}/api/admin/users?role=stylist`);
      if (res.ok) {
        const data = await res.json();
        setStylists(data);
        if (data.length > 0 && !selectedStylist) {
          setSelectedStylist(data[0]);
        }
      } else {
        console.error("Failed to fetch stylists");
      }
    } catch (error) {
      console.error("Error fetching stylists:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    // Implement fetching stores if you have GET /api/chinhanh
    // For now, we mock one store if the endpoint is not confirmed.
    try {
      const res = await fetch(`${API_BASE}/api/chinhanh`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setStores(data);
        }
      }
    } catch (error) {
      console.log("No store API found, using default");
    }
  };

  useEffect(() => {
    fetchStylists();
    fetchStores();

    // Fetch Provinces (V2 - Sau Sáp Nhập 34 Tỉnh)
    fetch("https://provinces.open-api.vn/api/v2/?depth=2")
      .then((res) => res.json())
      .then((data) => {
        // Map to match the new 2-tier structure (Province -> Ward)
        const mappedProvinces = data.map((p: any) => ({
          id: String(p.code),
          name: p.name,
          full_name: p.name,
          wards: p.wards?.map((w: any) => ({
            id: String(w.code),
            name: w.name,
            full_name: w.name
          }))
        }));
        setProvinces(mappedProvinces);
      })
      .catch((err) => console.error("Failed to fetch provinces", err));
  }, []);

  useEffect(() => {
    if (selectedProvinceId) {
      const p = provinces.find((x: any) => String(x.id) === String(selectedProvinceId));
      if (p && p.wards) setWards(p.wards);
      else setWards([]);
    } else {
      setWards([]);
    }
  }, [selectedProvinceId, provinces]);

  const openModal = (mode: string, stylist: any = null) => {
    setModalMode(mode);
    setImageFile(null);
    setErrors({});
    if (mode === "edit" && stylist) {
      setImagePreview(stylist.Image || "");
      setFormData({
        Name_user: stylist.Name_user || "",
        Email: stylist.Email || "",
        Phone: stylist.Phone || "",
        Pass_word: "", // Leave blank for edit unless they want to change
        Address: stylist.Address || "",
        Image: stylist.Image || "",
        Id_store: stylist.Id_store || 1,
      });
      setSelectedStylist(stylist);

      // Parse existing address
      const rawAddress = stylist.Address || "";
      const parts = rawAddress.split(",").map((s: string) => s.trim());
      if (parts.length >= 3 && provinces.length > 0) {
        const pName = parts[parts.length - 1];
        const p = provinces.find((x) => x.full_name === pName || x.name === pName);
        const pId = p ? String(p.id) : "";

        setSelectedProvinceId(pId);
        // We can't synchronously set WardId because wards array needs fetching.
        setSelectedWardId("");
        setAddressDetail(rawAddress);
      } else {
        setSelectedProvinceId("");
        setSelectedWardId("");
        setAddressDetail(rawAddress);
      }
    } else {
      setImagePreview("");
      setFormData({
        Name_user: "",
        Email: "",
        Phone: "",
        Pass_word: "",
        Address: "",
        Image: "",
        Id_store: stores.length > 0 ? stores[0].Id_store : 1,
      });
      setSelectedProvinceId("");
      setSelectedWardId("");
      setAddressDetail("");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!formData.Name_user.trim()) newErrors.Name_user = "Vui lòng nhập họ tên";

    if (!formData.Phone.trim()) {
      newErrors.Phone = "Vui lòng nhập số điện thoại";
    } else if (!/^[0-9]{9,11}$/.test(formData.Phone)) {
      newErrors.Phone = "Số điện thoại không hợp lệ (9-11 số)";
    }

    if (!formData.Email.trim()) {
      newErrors.Email = "Vui lòng nhập email";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.Email)) {
      newErrors.Email = "Email không đúng định dạng";
    }

    if (modalMode === "create" && !formData.Pass_word.trim()) {
      newErrors.Pass_word = "Vui lòng nhập mật khẩu (ít nhất 6 ký tự)";
    } else if (formData.Pass_word && formData.Pass_word.length < 6) {
      newErrors.Pass_word = "Mật khẩu tối thiểu 6 ký tự";
    }

    if (!selectedProvinceId || !selectedWardId || !addressDetail.trim()) {
      newErrors.Address = "Vui lòng nhập đầy đủ địa chỉ chi tiết và chọn Khu vực (Tỉnh/Thành, Phường/Xã)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: any) => {
    setErrors({ ...errors, [e.target.name]: "" });
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Build address
    const p = provinces.find((x) => String(x.id) === String(selectedProvinceId))?.full_name || "";
    const w = wards.find((x: any) => String(x.id) === String(selectedWardId))?.full_name || "";
    const fullAddress = `${addressDetail.trim()}, ${w}, ${p}`;

    const url =
      modalMode === "create"
        ? `${API_BASE}/api/admin/users`
        : `${API_BASE}/api/admin/users/${selectedStylist?.Id_user || ''}`;

    const method = modalMode === "create" ? "POST" : "PUT";

    try {
      const isFormData = !!imageFile;

      let payload: any;
      let headers: any = {};

      if (isFormData) {
        payload = new FormData();
        payload.append("Name_user", formData.Name_user);
        payload.append("Email", formData.Email);
        payload.append("Phone", formData.Phone);
        if (formData.Pass_word) payload.append("Pass_word", formData.Pass_word);
        payload.append("Address", fullAddress);
        payload.append("Id_store", String(formData.Id_store));
        payload.append("role", "stylist");
        payload.append("avatar", imageFile);
      } else {
        payload = JSON.stringify({
          ...formData,
          role: "stylist",
          Address: fullAddress
        });
        headers["Content-Type"] = "application/json";
      }

      const res = await authorizedAdminFetch(url, {
        method,
        headers,
        body: payload,
      });

      if (res.ok) {
        alert(modalMode === "create" ? "Thêm thành công!" : "Cập nhật thành công!");
        closeModal();
        fetchStylists(); // Refresh list
      } else {
        const err = await res.json();
        alert(`Lỗi: ${err.message || 'Xảy ra lỗi khi gửi yêu cầu'}`);
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Đã xảy ra lỗi khi lưu.");
    }
  };

  const handleDelete = async (id: any) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thợ cắt này?")) return;
    try {
      const res = await authorizedAdminFetch(`${API_BASE}/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Xóa thành công!");
        if (selectedStylist && selectedStylist.Id_user === id) {
          setSelectedStylist(null);
        }
        fetchStylists();
      } else {
        const err = await res.json();
        alert(`Không thể xóa: ${err.message}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Đã xảy ra lỗi khi xóa.");
    }
  };

  // Calculate filters & pagination
  const filteredStylists = stylists.filter((stylist) => {
    if (filterSearch.trim()) {
      const s = filterSearch.toLowerCase();
      if (!stylist.Name_user?.toLowerCase().includes(s) &&
        !stylist.Phone?.includes(s) &&
        !stylist.Name_store?.toLowerCase().includes(s)) return false;
    }
    if (filterStore !== "all" && String(stylist.Id_store) !== String(filterStore)) return false;
    // Note: Database Currently only has role='stylist', so "Thợ Chính"/"Thợ Phụ" is mockup logic.
    return true;
  });

  const totalPages = Math.ceil(filteredStylists.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentStylists = filteredStylists.slice(startIndex, startIndex + itemsPerPage);

  // Logic to show a maximum of 5 page buttons to prevent layout breaks
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  const visiblePages = Array.from({ length: endPage - startPage + 1 }).map((_, i) => startPage + i);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStore, filterRole, filterSearch]);

  return (
    <main className="flex-1 bg-[#F8FAFC] px-8 py-6 relative">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản Lý Thợ Cắt</h1>
          <p className="text-sm text-slate-500">Quản lý hồ sơ, lịch làm việc và hiệu suất nhân sự.</p>
        </div>
        <div className="flex gap-3">
          <button className="border border-slate-200 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            Quản lý vai trò
          </button>
          <button
            onClick={() => openModal("create")}
            className="bg-[#0077B6] text-white px-4 py-2 rounded-lg text-sm"
          >
            + Thêm nhân sự mới
          </button>
        </div>
      </div>

      {/* STATISTIC */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { title: "TỔNG NHÂN SỰ", value: stylists.length, icon: "fa-solid fa-users", color: "text-slate-600", bg: "bg-slate-100", valueColor: "text-slate-800" },
          { title: "ĐANG LÀM VIỆC", value: stylists.length, icon: "fa-solid fa-user-check", color: "text-[#059669]", bg: "bg-green-50", valueColor: "text-[#059669]" },
          { title: "ĐIỂM ĐÁNH GIÁ TB", value: "4.8 ★", icon: "fa-solid fa-star", color: "text-orange-500", bg: "bg-orange-50", valueColor: "text-orange-500" },
        ].map((item, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 tracking-wide">{item.title}</p>
              <h3 className={`text-2xl font-bold mt-1 ${item.valueColor || "text-slate-800"}`}>{item.value}</h3>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.bg}`}>
              <i className={`${item.icon} ${item.color} text-lg`}></i>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* LEFT TABLE */}
        <div className="col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          {/* HEADER TABLE */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <i className="fa-regular fa-rectangle-list text-cyan-500 text-lg"></i>
              <h2 className="font-semibold text-slate-800">Danh sách nhân sự</h2>
            </div>

            <div className="flex gap-2">
              <div className={`flex items-center gap-2 border border-slate-200 rounded-lg bg-white px-2 py-1.5 transition-all duration-300 ${isSearchExpanded ? 'w-64' : 'w-[38px] cursor-pointer'}`} onClick={() => !isSearchExpanded && setIsSearchExpanded(true)}>
                <button type="button" onClick={(e) => { e.stopPropagation(); setIsSearchExpanded(!isSearchExpanded); if (isSearchExpanded) setFilterSearch(''); }} className="text-slate-400 hover:text-cyan-500 flex-shrink-0 w-5 h-5 flex items-center justify-center outline-none transition-colors">
                  <i className={`fa-solid ${isSearchExpanded ? 'fa-xmark' : 'fa-magnifying-glass'} text-sm`}></i>
                </button>
                <input
                  type="text"
                  placeholder="Tìm tên, SĐT nhân sự, chi nhánh..."
                  value={filterSearch}
                  onChange={(e) => { setFilterSearch(e.target.value); setCurrentPage(1); }}
                  className={`text-sm outline-none transition-all w-full bg-transparent text-slate-700 ${isSearchExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}
                />
              </div>

              <select value={filterStore} onChange={e => setFilterStore(e.target.value)} disabled={!isAdminTong} className="border border-slate-200 px-3 py-1.5 rounded-lg text-sm text-slate-600 focus:outline-none disabled:opacity-60 disabled:bg-gray-100">
                <option value="all">Tất cả chi nhánh</option>
                {stores.map(s => <option key={s.Id_store} value={s.Id_store}>{s.Name_store}</option>)}
              </select>
              <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="border border-slate-200 px-3 py-1.5 rounded-lg text-sm text-slate-600 focus:outline-none">
                <option value="all">Tất cả vị trí</option>
                <option value="Thợ Chính">Thợ Chính</option>
                <option value="Thợ Phụ">Thợ Phụ</option>
              </select>
            </div>
          </div>

          {/* TABLE */}
          <div className="px-5 overflow-x-auto flex-1">
            {loading ? (
              <div className="py-10 text-center text-slate-500">Đang tải dữ liệu...</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100">
                    <th className="py-4 font-medium">NHÂN SỰ</th>
                    <th className="font-medium">SĐT / EMAIL</th>
                    <th className="font-medium">CHI NHÁNH</th>
                    <th className="font-medium text-center">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStylists.map((item) => (
                    <tr key={item.Id_user} className={`border-b border-slate-100 last:border-none hover:bg-slate-50 transition cursor-pointer ${selectedStylist?.Id_user === item.Id_user ? "bg-cyan-50/80 border-l-[6px] border-l-cyan-500 rounded shadow-sm scale-[1.01]" : ""}`} onClick={() => setSelectedStylist(item)}>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <img src={item.Image ? (item.Image.startsWith("http") ? item.Image : `${API_BASE}${item.Image}`) : "/no-image.png"} className="w-10 h-10 rounded-full object-cover ring-2 ring-cyan-400" alt="avatar" />
                          <div className="leading-tight">
                            <p className="font-semibold text-slate-800">{item.Name_user}</p>
                            <p className="text-xs text-slate-400 mt-0.5">ID: #{item.Id_user}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="font-semibold text-slate-700">{item.Phone}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.Email}</p>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 bg-[#FEF2F2] text-blue-600 px-3 py-1 rounded-full text-xs font-medium">
                          <i className="fa-solid fa-building text-xs"></i>
                          {item.Name_store || "Mặc định"}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedStylist(item); openScheduleModal(item); }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition"
                            title="Xếp lịch làm việc"
                          >
                            <i className="fa-regular fa-clock"></i>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); openModal("edit", item); }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition"
                          >
                            <i className="fa-regular fa-pen-to-square"></i>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.Id_user); }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredStylists.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-slate-400">Không có thợ cắt nào.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* FOOTER PAGINATION */}
          {!loading && filteredStylists.length > 0 && (
            <div className="flex items-center justify-between px-5 py-4 text-sm border-t border-slate-100">
              <p className="text-slate-400">
                Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredStylists.length)} trên {filteredStylists.length} nhân sự
              </p>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border border-slate-200 px-3 py-1 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-slate-600"
                >
                  Trước
                </button>

                {visiblePages.map((pageStr) => (
                  <button
                    key={pageStr}
                    onClick={() => setCurrentPage(pageStr)}
                    className={`px-3 py-1 rounded-lg transition-colors ${currentPage === pageStr ? 'bg-cyan-500 text-white shadow-sm' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {pageStr}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="border border-slate-200 px-3 py-1 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-slate-600"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        {selectedStylist ? (
          <div className="col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
              <div className="h-20 bg-gradient-to-r from-cyan-600 to-blue-500"></div>
              <div className="px-6 pb-6 -mt-10 relative">
                <div className="flex items-start justify-between">
                  <div className="gap-4">
                    <img src={selectedStylist.Image ? (selectedStylist.Image.startsWith("http") ? selectedStylist.Image : `${API_BASE}${selectedStylist.Image}`) : "/no-image.png"} className="w-20 h-20 rounded-xl border-4 border-white shadow object-cover bg-white" alt="avatar" />
                    <div className="mb-1">
                      <p className="font-semibold text-lg text-slate-800">{selectedStylist.Name_user}</p>
                      <p className="text-sm text-cyan-600 font-medium">Thợ Chính</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-20">
                    <a href={`tel:${selectedStylist.Phone}`} className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition">
                      <i className="fa-solid fa-phone"></i>
                    </a>
                    <a href={`mailto:${selectedStylist.Email}`} className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition">
                      <i className="fa-regular fa-envelope"></i>
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-6 mt-5 text-sm">
                  <div>
                    <p className="text-slate-400">Chi nhánh</p>
                    <p className="font-bold text-slate-800">{selectedStylist.Name_store || "25Zone Q1"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Địa chỉ</p>
                    <p className="font-bold text-slate-800 line-clamp-2" title={selectedStylist.Address}>{selectedStylist.Address}</p>
                  </div>
                  {/* Default placeholders for visual consistency with the original design */}
                  <div><p className="text-slate-400">Kinh nghiệm</p><p className="font-bold text-slate-800">5 Năm</p></div>
                  <div><p className="text-slate-400">Số đơn hoàn thành</p><p className="font-bold text-slate-800">{selectedStylist.Total_completed_bookings || 0}</p></div>
                </div>
              </div>
            </div>
            {/* LỊCH LÀM VIỆC TUẦN NÀY/SAU */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <i className="fa-regular fa-calendar-days text-sm"></i>
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm uppercase">
                    {weekOffset === 0 ? "Lịch Tuần Này" : weekOffset === 1 ? "Lịch Tuần Sau" : weekOffset === -1 ? "Lịch Tuần Trước" : `Lịch Tuần ${weekOffset > 0 ? '+' : ''}${weekOffset}`}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                  <button onClick={() => setWeekOffset(w => w - 1)} className="w-6 h-6 flex items-center justify-center rounded bg-white shadow-sm text-slate-500 hover:text-indigo-600 transition" title="Tuần trước">
                    <i className="fa-solid fa-chevron-left text-[10px]"></i>
                  </button>
                  <button onClick={() => setWeekOffset(0)} className="px-2 text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition" title="Về tuần này">
                    <i className="fa-solid fa-rotate-right"></i>
                  </button>
                  <button onClick={() => setWeekOffset(w => w + 1)} className="w-6 h-6 flex items-center justify-center rounded bg-white shadow-sm text-slate-500 hover:text-indigo-600 transition" title="Tuần sau">
                    <i className="fa-solid fa-chevron-right text-[10px]"></i>
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                {thisWeekScheduleLoading ? (
                  <p className="text-sm text-slate-400 text-center py-4"><i className="fa-solid fa-spinner fa-spin mr-2"></i>Đang tải...</p>
                ) : thisWeekSchedule.length > 0 ? (
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-2">Giờ làm việc chung</p>
                    <div className="flex items-center justify-center gap-3">
                      <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-24">
                        <p className="text-xl font-bold text-slate-800">{thisWeekSchedule[0].Start_time.substring(0, 5)}</p>
                      </div>
                      <span className="text-slate-300 font-bold">-</span>
                      <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-24">
                        <p className="text-xl font-bold text-slate-800">{thisWeekSchedule[0].End_time.substring(0, 5)}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mt-4 mb-2">Ngày làm việc</p>
                    <div className="flex justify-center gap-1.5 flex-wrap">
                      {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((dayName, idx) => {
                        const dates = getDatesOfWeek(getTargetWeekDate());
                        const dateStr = dates[idx];
                        const isScheduled = thisWeekSchedule.some(s => s.Shift_date.startsWith(dateStr));
                        return (
                          <button
                            key={dayName}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openScheduleModal(selectedStylist, dateStr);
                            }}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all hover:scale-110 cursor-pointer ${isScheduled ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 hover:bg-slate-300 hover:text-slate-600'}`}
                            title={`Thiết lập/Sửa giờ ngày ${dateStr.split('-').reverse().join('/')}`}
                          >
                            {dayName}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => openScheduleModal(selectedStylist)}
                      className="mt-5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition flex items-center justify-center w-full"
                    >
                      <i className="fa-regular fa-pen-to-square mr-1"></i> Cập nhật lịch
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 py-4">
                    <i className="fa-regular fa-calendar-xmark text-2xl mb-2 opacity-40"></i>
                    <p className="text-sm text-slate-500">Tuần này chưa có lịch</p>
                    <button
                      onClick={() => openScheduleModal(selectedStylist, undefined, true)}
                      className="mt-3 text-xs font-semibold text-indigo-600 hover:text-white border border-indigo-500 hover:bg-indigo-500 px-4 py-1.5 rounded-lg transition"
                    >
                      Xếp lịch cả tuần
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* PERFORMANCE MOCK CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <i className="fa-solid fa-chart-line text-sm"></i>
                </div>
                <h3 className="font-semibold text-slate-800 text-sm uppercase">Hiệu suất làm việc</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-50 py-3 rounded-lg"><p className="text-xs text-slate-400 mb-1">Số khách</p><p className="font-bold text-xl text-slate-800">{selectedStylist.Total_Unique_Customers || 0}</p></div>
                <div className="bg-slate-50 py-3 rounded-lg"><p className="text-xs text-slate-400 mb-1">Đánh giá</p><p className="font-bold text-xl text-orange-500">4.9/5</p></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="col-span-4 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm flex flex-col items-center justify-center h-[600px] text-slate-400 p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-2">
              <i className="fa-regular fa-hand-pointer text-2xl text-slate-300"></i>
            </div>
            <p className="text-slate-500 font-medium text-lg">Chưa chọn nhân sự</p>
            <p className="text-sm">Vui lòng chọn một nhân sự từ danh sách bên trái hoặc nhấn Thêm mới để quản lý.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-4">
          <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
              <h2 className="text-lg font-bold text-[#0F172A]">
                {modalMode === "create" ? "Thêm thợ cắt mới" : "Cập nhật thợ cắt"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-[#64748B] hover:bg-[#F1F5F9]"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
              <label className="block space-y-1 text-sm text-[#334155]">
                <span className="font-semibold">Ảnh đại diện</span>
                <div className="flex items-center gap-4 mt-1">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-[#F8FAFC] border border-[#E2E8F0] shrink-0">
                    <img src={imagePreview ? (imagePreview.startsWith('blob:') || imagePreview.startsWith('http') ? imagePreview : `${API_BASE}${imagePreview}`) : "/no-image.png"} alt="preview" className="w-full h-full object-cover" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setImageFile(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="w-full text-sm text-[#64748B] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-[#D0D7E2] file:text-sm file:font-semibold file:bg-white file:text-[#334155] hover:file:bg-[#F8FAFC] transition cursor-pointer"
                  />
                </div>
              </label>

              <label className="block space-y-1 text-sm text-[#334155]">
                <span className="font-semibold">Họ tên *</span>
                <input type="text" name="Name_user" value={formData.Name_user} onChange={handleInputChange} className={`h-11 w-full rounded-xl border px-3 outline-none transition ${errors.Name_user ? 'border-red-500 focus:border-red-500' : 'border-[#D0D7E2] focus:border-[#0EA5E9]'}`} placeholder="Tên thợ cắt" />
                {errors.Name_user && <p className="text-red-500 text-xs mt-1">{errors.Name_user}</p>}
              </label>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="block space-y-1 text-sm text-[#334155]">
                  <span className="font-semibold">Điện thoại *</span>
                  <input type="text" name="Phone" value={formData.Phone} onChange={handleInputChange} className={`h-11 w-full rounded-xl border px-3 outline-none transition ${errors.Phone ? 'border-red-500 focus:border-red-500' : 'border-[#D0D7E2] focus:border-[#0EA5E9]'}`} placeholder="09xxxx" />
                  {errors.Phone && <p className="text-red-500 text-xs mt-1">{errors.Phone}</p>}
                </label>

                <label className="block space-y-1 text-sm text-[#334155]">
                  <span className="font-semibold">Email *</span>
                  <input type="email" name="Email" value={formData.Email} onChange={handleInputChange} className={`h-11 w-full rounded-xl border px-3 outline-none transition ${errors.Email ? 'border-red-500 focus:border-red-500' : 'border-[#D0D7E2] focus:border-[#0EA5E9]'}`} placeholder="email@example.com" />
                  {errors.Email && <p className="text-red-500 text-xs mt-1">{errors.Email}</p>}
                </label>
              </div>

              <div className="space-y-1 pb-1">
                <span className="font-semibold text-sm text-[#334155]">Địa chỉ *</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                  <select value={selectedProvinceId} onChange={(e) => { setSelectedProvinceId(e.target.value); setSelectedWardId(""); setErrors({ ...errors, Address: "" }); }} className={`h-11 w-full rounded-xl border px-3 outline-none text-sm transition ${errors.Address ? 'border-red-500 focus:border-red-500' : 'border-[#D0D7E2] focus:border-[#0EA5E9]'}`}>
                    <option value="">Tỉnh/Thành</option>
                    {provinces.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                  <select value={selectedWardId} onChange={(e) => { setSelectedWardId(e.target.value); setErrors({ ...errors, Address: "" }); }} className={`h-11 w-full rounded-xl border px-3 outline-none text-sm transition ${errors.Address ? 'border-red-500 focus:border-red-500' : 'border-[#D0D7E2] focus:border-[#0EA5E9]'}`} disabled={!selectedProvinceId}>
                    <option value="">Phường/Xã</option>
                    {wards.map((w: any) => <option key={w.id} value={w.id}>{w.full_name}</option>)}
                  </select>
                </div>
                <input type="text" value={addressDetail} onChange={(e) => { setAddressDetail(e.target.value); setErrors({ ...errors, Address: "" }); }} className={`h-11 w-full rounded-xl border px-3 outline-none mt-3 transition ${errors.Address ? 'border-red-500 focus:border-red-500' : 'border-[#D0D7E2] focus:border-[#0EA5E9]'}`} placeholder="Số nhà, đường, ngõ, xóm..." />
                {errors.Address && <p className="text-red-500 text-xs mt-1">{errors.Address}</p>}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="block space-y-1 text-sm text-[#334155]">
                  <span className="font-semibold">Mật khẩu <span className="text-xs font-normal text-[#94A3B8]">(Để trống nếu {modalMode === 'edit' ? 'giữ nguyên' : 'chưa cấp mã'})</span></span>
                  <input type={modalMode === "create" ? "text" : "password"} name="Pass_word" value={formData.Pass_word} onChange={handleInputChange} className={`h-11 w-full rounded-xl border px-3 outline-none transition ${errors.Pass_word ? 'border-red-500 focus:border-red-500' : 'border-[#D0D7E2] focus:border-[#0EA5E9]'}`} placeholder="Mật khẩu" />
                  {errors.Pass_word && <p className="text-red-500 text-xs mt-1">{errors.Pass_word}</p>}
                </label>

                <label className="block space-y-1 text-sm text-[#334155]">
                  <span className="font-semibold">Chi nhánh</span>
                  <select name="Id_store" value={formData.Id_store} onChange={handleInputChange} className="h-11 w-full rounded-xl border border-[#D0D7E2] px-3 outline-none focus:border-[#0EA5E9]">
                    {stores.map(s => (
                      <option key={s.Id_store} value={s.Id_store}>{s.Name_store}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#E2E8F0] pt-4 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-[#D0D7E2] px-4 py-2 text-sm font-semibold text-[#334155] hover:bg-[#F8FAFC]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0EA5E9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0284C7]"
                >
                  {modalMode === "create" ? "Tạo mới" : "Cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {isScheduleModalOpen && selectedStylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-opacity">
          <div className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white drop-shadow-2xl">
            <div className="flex flex-col bg-slate-50/50 rounded-t-2xl border-b border-slate-100">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800">
                  Sắp Xếp Lịch Làm Việc
                </h2>
                <button type="button" onClick={closeScheduleModal} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div className="px-6 py-4">
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <img src={selectedStylist.Image ? (selectedStylist.Image.startsWith("http") ? selectedStylist.Image : `${API_BASE}${selectedStylist.Image}`) : "/no-image.png"} className="w-12 h-12 rounded-lg object-cover ring-2 ring-indigo-50" alt="avatar" />
                  <div>
                    <p className="font-bold text-slate-800">{selectedStylist.Name_user}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Thợ Chính • ID: #{selectedStylist.Id_user}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {scheduleLoading ? (
                <div className="py-10 text-center text-slate-500"><i className="fa-solid fa-spinner fa-spin mr-2"></i>Đang tải dữ liệu...</div>
              ) : (
                <form onSubmit={handleSaveSchedule} className="space-y-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700">1. Chọn một ngày trong tuần cần xếp lịch</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={selectedDate < getLocalYYYYMMDD() ? selectedDate : getLocalYYYYMMDD()}
                      className="w-full h-11 text-sm border-slate-300 rounded-xl px-4 outline-none focus:border-indigo-500 border bg-white shadow-sm transition"
                    />
                    {isWeeklySchedule && (
                      <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-2.5 rounded-lg border border-emerald-100">
                        <i className="fa-solid fa-calendar-week text-emerald-500"></i>
                        {(() => {
                          const dates = getDatesOfWeek(selectedDate).filter(d => d >= selectedDate);
                          if (dates.length === 1) return `Sẽ áp dụng duy nhất cho ngày: ${dates[0].split('-').reverse().join('/')}`;
                          return `Sẽ áp dụng từ: ${dates[0].split('-').reverse().join('/')} đến ${dates[dates.length - 1].split('-').reverse().join('/')}`;
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700">2. Thiết lập giờ làm việc chung</label>
                    <div className="flex gap-4">
                      <div className="w-1/2 relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">TỪ</span>
                        <input required type="time" value={scheduleForm.Start_time} onChange={(e) => setScheduleForm({ ...scheduleForm, Start_time: e.target.value })} className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-3 outline-none focus:border-indigo-500 shadow-sm transition font-medium text-slate-700" />
                      </div>
                      <div className="w-1/2 relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">ĐẾN</span>
                        <input required type="time" value={scheduleForm.End_time} onChange={(e) => setScheduleForm({ ...scheduleForm, End_time: e.target.value })} className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-3 outline-none focus:border-indigo-500 shadow-sm transition font-medium text-slate-700" />
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition p-4 rounded-xl border border-indigo-200 group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" checked={isWeeklySchedule} onChange={(e) => setIsWeeklySchedule(e.target.checked)} className="peer appearance-none w-5 h-5 border-2 border-indigo-300 rounded-md checked:bg-indigo-600 checked:border-indigo-600 transition outline-none cursor-pointer bg-white" />
                      <i className="fa-solid fa-check absolute text-white text-[10px] opacity-0 peer-checked:opacity-100 pointer-events-none"></i>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-indigo-900 group-hover:text-indigo-700 transition">Thiết lập nhanh cho các ngày còn lại</span>
                      <span className="text-xs text-indigo-600/80 mt-0.5">Tự động sao chép giờ này đến cuối tuần (Chủ Nhật).</span>
                    </div>
                  </label>

                  <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
                    {scheduleData?.shift && !isWeeklySchedule && (
                      <button type="button" onClick={handleDeleteSchedule} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100 transition mr-auto">
                        <i className="fa-solid fa-trash mr-1.5"></i> Xóa lịch này
                      </button>
                    )}
                    <button type="button" onClick={closeScheduleModal} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition drop-shadow-sm bg-white">
                      Hủy
                    </button>
                    <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition shadow-md">
                      <i className="fa-regular fa-paper-plane mr-1.5"></i> Xem & Lưu
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
