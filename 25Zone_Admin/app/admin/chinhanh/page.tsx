"use client";

import { toast } from "../../component/Toast";
import React, { useState, useEffect } from "react";
import { API_BASE, authorizedAdminFetch } from "@/app/lib/admin-auth";

export default function ChiNhanhPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [stylists, setStylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<any>(null);

  // Pagination states for stores
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterProvince, setFilterProvince] = useState<string>("all");
  const [filterSearch, setFilterSearch] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    Name_store: "",
    Address: "",
    Province: "",
    Ward: "",
    Email: "",
    Phone: "",
    Opening_time: "08:00",
    Closing_time: "21:00",
    Status: 1,
    Image: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Location APIs
  const [provinces, setProvinces] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedWardId, setSelectedWardId] = useState("");
  const [addressDetail, setAddressDetail] = useState("");

  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/chinhanh`);
      if (res.ok) {
        const data = await res.json();
        setStores(data);
        if (data.length > 0 && !selectedStore) {
          setSelectedStore(data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStylists = async () => {
    try {
      const res = await authorizedAdminFetch(`${API_BASE}/api/admin/users?role=stylist`);
      if (res.ok) {
        const data = await res.json();
        setStylists(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchStores();
    fetchStylists();
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<string>("add");
  const [errors, setErrors] = useState<any>({});
  const [storeStylists, setStoreStylists] = useState<any[]>([]);

  const openModal = (mode: string, store: any = null) => {
    setModalMode(mode);
    setErrors({});
    if (mode === "edit" && store) {
      setFormData({
        Name_store: store.Name_store || "",
        Email: store.Email || "",
        Phone: store.Phone || "",
        Opening_time: store.Opening_time?.substring(0, 5) || "08:00",
        Closing_time: store.Closing_time?.substring(0, 5) || "21:00",
        Status: store.Status ?? 1,
        Address: store.Address || "",
        Province: store.Province || "",
        Ward: store.Ward || "",
        Image: store.Image || "",
      });
      setSelectedStore(store);
      setImageFile(null);
      setImagePreview(store.Image ? (store.Image.startsWith("http") ? store.Image : `${API_BASE}${store.Image}`) : null);

      // Attempt parsing address detail
      const rawAddress = store.Address || "";
      const pId = provinces.find(p => p.full_name === store.Province || p.name === store.Province)?.id || "";
      setSelectedProvinceId(pId ? String(pId) : "");

      // Setting detail to full address to be safe
      setAddressDetail(rawAddress);
      setSelectedWardId("");
      
    } else {
      setFormData({
        Name_store: "",
        Email: "",
        Phone: "",
        Opening_time: "08:00",
        Closing_time: "21:00",
        Status: 1,
        Address: "",
        Province: "",
        Ward: "",
        Image: "",
      });
      setSelectedProvinceId("");
      setSelectedWardId("");
      setAddressDetail("");
      setImageFile(null);
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const validateForm = () => {
    const newErrors: any = {};
    if (!formData.Name_store.trim()) newErrors.Name_store = "Vui lòng nhập tên chi nhánh.";
    if (!formData.Phone.trim() || formData.Phone.length < 9) newErrors.Phone = "Số điện thoại không hợp lệ.";
    if (!addressDetail.trim() && modalMode === 'create') newErrors.Address = "Vui lòng nhập địa chỉ.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: any) => {
    setErrors({ ...errors, [e.target.name]: "" });
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFormData({ ...formData, Image: "" });
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validateForm()) return;

    let finalAddress = formData.Address;
    let finalProvince = formData.Province;
    let finalWard = formData.Ward;

    // If they changed the province dropdown, we build a new address string
    if (selectedProvinceId) {
      const p = provinces.find((x) => String(x.id) === String(selectedProvinceId))?.full_name || "";
      const w = wards.find((x: any) => String(x.id) === String(selectedWardId))?.full_name || "";
      finalProvince = p;
      finalWard = w;
      finalAddress = `${addressDetail.trim()}, ${w}, ${p}`;
    } else if (modalMode === "create") {
       finalAddress = addressDetail; 
    }

    const payload = new FormData();
    payload.append("Name_store", formData.Name_store);
    payload.append("Address", finalAddress);
    payload.append("Province", finalProvince);
    payload.append("Ward", finalWard);
    payload.append("Email", formData.Email);
    payload.append("Phone", formData.Phone);
    payload.append("Opening_time", formData.Opening_time);
    payload.append("Closing_time", formData.Closing_time);
    payload.append("Status", formData.Status.toString());
    
    if (imageFile) {
      payload.append("Image", imageFile);
    } else if (formData.Image) {
      payload.append("Image", formData.Image);
    }

    const url = modalMode === "create" 
      ? `${API_BASE}/api/chinhanh` 
      : `${API_BASE}/api/chinhanh/${selectedStore?.Id_store}`;

    try {
      const res = await authorizedAdminFetch(url, {
        method: modalMode === "create" ? "POST" : "PUT",
        body: payload,
      });

      if (res.ok) {
        closeModal();
        fetchStores();
      } else {
         toast.error("Có lỗi xảy ra, vui lòng thử lại.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Status Toggle
  const toggleStatus = async (store: any) => {
    if (!confirm(`Bạn muốn ${store.Status === 1 ? 'Vô hiệu hóa' : 'Kích hoạt'} chi nhánh này?`)) return;
    try {
      const newStatus = store.Status === 1 ? 0 : 1;
      const res = await authorizedAdminFetch(`${API_BASE}/api/chinhanh/${store.Id_store}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Status: newStatus }),
      });
      if (res.ok) {
        fetchStores();
      }
    } catch (error) {
       console.error(error);
    }
  };



  // Compute available provinces that have at least one store
  const availableProvinces = React.useMemo(() => {
    const provs = new Set(stores.map(s => s.Province).filter(Boolean));
    return Array.from(provs).sort();
  }, [stores]);

  // Filters
  const filteredStores = React.useMemo(() => {
    let result = stores;
    if (filterSearch.trim()) {
      result = result.filter(s => s.Name_store?.toLowerCase().includes(filterSearch.toLowerCase()));
    }
    if (filterStatus !== "all") {
      result = result.filter(s => String(s.Status) === filterStatus);
    }
    if (filterProvince !== "all") {
      result = result.filter(s => s.Province === filterProvince);
    }
    return result;
  }, [stores, filterStatus, filterProvince, filterSearch]);

  const totalPages = Math.ceil(filteredStores.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentStores = filteredStores.slice(startIndex, startIndex + itemsPerPage);

  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  const visiblePages = Array.from({ length: endPage - startPage + 1 }).map((_, i) => startPage + i);



  return (
    <main className="flex-1 bg-[#F8FAFC] px-8 py-6 relative">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản Lý Chi Nhánh</h1>
          <p className="text-sm text-slate-500">Quản lý hoạt động mạng lưới cửa hàng 25Zone.</p>
        </div>
        <div className="flex gap-3">
           <button onClick={() => openModal("create")} className="bg-[#0077B6] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#023E8A] transition shadow-sm">
            <i className="fa-solid fa-plus mr-2"></i>Thêm chi nhánh mới
           </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* LEFT: TABLE OF STORES */}
        <div className="col-span-12 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-store-alt text-cyan-500 text-lg"></i>
              <h2 className="font-semibold text-slate-800">Danh sách các cơ sở</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 border border-slate-200 rounded-lg bg-white px-2 py-1.5 transition-all duration-300 ${isSearchExpanded ? 'w-64' : 'w-[38px] cursor-pointer'}`} onClick={() => !isSearchExpanded && setIsSearchExpanded(true)}>
                <button type="button" onClick={(e) => { e.stopPropagation(); setIsSearchExpanded(!isSearchExpanded); if(isSearchExpanded) setFilterSearch(''); }} className="text-slate-400 hover:text-cyan-500 flex-shrink-0 w-5 h-5 flex items-center justify-center outline-none transition-colors">
                   <i className={`fa-solid ${isSearchExpanded ? 'fa-xmark' : 'fa-magnifying-glass'} text-sm`}></i>
                </button>
                <input 
                  type="text"
                  placeholder="Tìm tên chi nhánh..."
                  value={filterSearch}
                  onChange={(e) => { setFilterSearch(e.target.value); setCurrentPage(1); }}
                  className={`text-sm outline-none transition-all w-full bg-transparent text-slate-700 ${isSearchExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}
                />
              </div>
              <select 
                value={filterProvince}
                onChange={(e) => { setFilterProvince(e.target.value); setCurrentPage(1); }}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-cyan-500 bg-white"
              >
                <option value="all">Tất cả Tỉnh/Thành</option>
                {availableProvinces.map((pName) => <option key={pName as string} value={pName as string}>{pName as string}</option>)}
              </select>
              <select 
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-cyan-500 bg-white"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="1">Hoạt động</option>
                <option value="0">Bảo trì</option>
              </select>
            </div>
          </div>
          <div className="px-5 overflow-x-auto flex-1">
            {loading ? <div className="py-10 text-center text-slate-500">Đang tải dữ liệu...</div> : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100">
                    <th className="py-4 font-medium pl-2 w-16 text-center">HÌNH ẢNH</th>
                    <th className="py-4 font-medium pl-2">CHI NHÁNH</th>
                    <th className="font-medium">LIÊN HỆ</th>
                    <th className="font-medium text-center">TRẠNG THÁI</th>
                    <th className="font-medium text-center">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStores.map((item) => (
                    <tr 
                      key={item.Id_store} 
                      onClick={() => { setSelectedStore(item); setIsDetailModalOpen(true); }}
                      className={`border-b border-slate-100 last:border-none hover:bg-slate-50 transition cursor-pointer`}
                    >
                      <td className="py-4 pl-2 flex justify-center">
                        {item.Image ? (
                          <img src={item.Image.startsWith("http") ? item.Image : `${API_BASE}${item.Image}`} alt="Store" className="w-10 h-10 object-cover rounded-md border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center text-slate-400">
                            <i className="fa-solid fa-store"></i>
                          </div>
                        )}
                      </td>
                      <td className="py-4 pl-2">
                         <p className="font-bold text-slate-700">{item.Name_store}</p>
                         <p className="text-xs text-slate-500 line-clamp-1 truncate w-48 mt-1" title={item.Address}>{item.Address}</p>
                      </td>
                      <td>
                         <p className="font-medium text-slate-600">{item.Phone}</p>
                         <p className="text-xs text-slate-400 mt-0.5">{item.Opening_time?.substring(0,5)} - {item.Closing_time?.substring(0,5)}</p>
                      </td>
                      <td className="text-center">
                         {item.Status === 1 ? (
                            <span className="inline-flex items-center bg-emerald-50 text-emerald-600 px-2 py-1.5 rounded-md text-xs font-semibold">
                               Hoạt động
                            </span>
                         ) : (
                            <span className="inline-flex items-center bg-rose-50 text-rose-600 px-2 py-1.5 rounded-md text-xs font-semibold">
                               Bảo trì
                            </span>
                         )}
                      </td>
                      <td>
                        <div className="flex justify-center gap-2">
                           <button onClick={(e) => { e.stopPropagation(); openModal('edit', item) }} className="w-8 h-8 rounded hover:bg-slate-200 text-slate-500 flex items-center justify-center">
                              <i className="fa-regular fa-pen-to-square"></i>
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); toggleStatus(item) }} className="w-8 h-8 rounded hover:bg-slate-200 text-slate-500 flex items-center justify-center" title={item.Status === 1 ? "Khóa chi nhánh" : "Mở cửa chi nhánh"}>
                              <i className={`fa-solid ${item.Status === 1 ? 'fa-lock' : 'fa-lock-open'}`}></i>
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {stores.length === 0 && (
                     <tr><td colSpan={4} className="py-8 text-center text-slate-400">Không có dữ liệu.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          {/* FOOTER PAGINATION */}
          {!loading && filteredStores.length > 0 && (
            <div className="flex items-center justify-between px-5 py-4 text-sm border-t border-slate-100">
              <p className="text-slate-400">Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredStores.length)}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="border border-slate-200 px-3 py-1 rounded-lg hover:bg-slate-50 disabled:opacity-50">Trước</button>
                 {visiblePages.map((pageStr) => (
                  <button key={pageStr} onClick={() => setCurrentPage(pageStr)} className={`px-3 py-1 rounded-lg transition-colors ${currentPage === pageStr ? 'bg-cyan-500 text-white shadow-sm' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{pageStr}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="border border-slate-200 px-3 py-1 rounded-lg hover:bg-slate-50 disabled:opacity-50">Sau</button>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* MAIN FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-opacity">
          <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white drop-shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-800">
                {modalMode === "create" ? "Thêm chi nhánh mới" : "Cập nhật chi nhánh"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              
              <div className="flex gap-4 items-center mb-4">
                <div className="shrink-0 relative group">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-xl object-cover border border-slate-200 shadow-sm" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center text-slate-400">
                      <i className="fa-solid fa-image text-2xl"></i>
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center cursor-pointer transition-opacity">
                    <i className="fa-solid fa-camera"></i>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">Hình ảnh chi nhánh</p>
                  <p className="text-xs text-slate-500 mt-1 mb-2">Tải lên hoặc nhập link hình ảnh trực tiếp.</p>
                  <input type="text" name="Image" value={formData.Image} onChange={(e) => { handleInputChange(e); if (!imageFile) setImagePreview(e.target.value.startsWith('http') ? e.target.value : (e.target.value ? `${API_BASE}${e.target.value}` : null)); }} className="h-9 w-full rounded-lg border border-slate-300 px-3 outline-none text-sm focus:border-cyan-500" placeholder="Hoặc nhập link ảnh (http://...)" />
                </div>
              </div>

              <label className="block space-y-1.5 text-sm text-slate-700">
                <span className="font-semibold">Tên chi nhánh *</span>
                <input required type="text" name="Name_store" value={formData.Name_store} onChange={handleInputChange} className={`h-11 w-full rounded-xl border px-3 outline-none transition ${errors.Name_store ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-slate-300 focus:border-cyan-500'}`} placeholder="VD: 25Zone Cầu Giấy" />
                {errors.Name_store && <p className="text-red-500 text-xs mt-1">{errors.Name_store}</p>}
              </label>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block space-y-1.5 text-sm text-slate-700">
                  <span className="font-semibold">Điện thoại Hotline *</span>
                  <input required type="text" name="Phone" value={formData.Phone} onChange={handleInputChange} className={`h-11 w-full rounded-xl border px-3 outline-none transition ${errors.Phone ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-slate-300 focus:border-cyan-500'}`} placeholder="09xxxx" />
                  {errors.Phone && <p className="text-red-500 text-xs mt-1">{errors.Phone}</p>}
                </label>

                <label className="block space-y-1.5 text-sm text-slate-700">
                  <span className="font-semibold">Email hỗ trợ</span>
                  <input type="email" name="Email" value={formData.Email} onChange={handleInputChange} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-cyan-500" placeholder="hotro@25zone.vn" />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block space-y-1.5 text-sm text-slate-700">
                  <span className="font-semibold">Giờ mở cửa</span>
                  <input required type="time" name="Opening_time" value={formData.Opening_time} onChange={handleInputChange} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-cyan-500" />
                </label>
                <label className="block space-y-1.5 text-sm text-slate-700">
                  <span className="font-semibold">Giờ đóng cửa</span>
                  <input required type="time" name="Closing_time" value={formData.Closing_time} onChange={handleInputChange} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-cyan-500" />
                </label>
              </div>

              <div className="space-y-1.5 mt-2">
                <span className="font-semibold text-sm text-slate-700">Địa chỉ khu vực *</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select value={selectedProvinceId} onChange={(e) => { setSelectedProvinceId(e.target.value); setSelectedWardId(""); }} className="h-11 w-full rounded-xl border border-slate-300 px-3 outline-none text-sm focus:border-cyan-500 bg-white">
                    <option value="">Tỉnh/Thành</option>
                    {provinces.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                  <select value={selectedWardId} onChange={(e) => setSelectedWardId(e.target.value)} className="h-11 w-full rounded-xl border border-slate-300 px-3 outline-none text-sm focus:border-cyan-500 bg-white" disabled={!selectedProvinceId}>
                    <option value="">Phường/Xã</option>
                    {wards.map((w: any) => <option key={w.id} value={w.id}>{w.full_name}</option>)}
                  </select>
                </div>
                <input type="text" value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} className={`h-11 w-full rounded-xl border px-3 outline-none mt-3 transition ${errors.Address ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-slate-300 focus:border-cyan-500'}`} placeholder="Số nhà, đuờng, tòa nhà cụ thể" />
                {errors.Address && <p className="text-red-500 text-xs mt-1">{errors.Address}</p>}
              </div>

              <label className="block space-y-1.5 text-sm text-slate-700 mt-2 border-t border-slate-100 pt-3">
                 <span className="font-semibold">Trạng thái hoạt động</span>
                 <select name="Status" value={formData.Status} onChange={handleInputChange} className="h-11 w-full md:w-1/2 rounded-xl border border-slate-300 px-3 outline-none bg-white block">
                    <option value={1}>Mở cửa kinh doanh</option>
                    <option value={0}>Tạm ngưng / Bảo trì</option>
                 </select>
              </label>

                <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
                  <button type="button" onClick={closeModal} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">Hủy</button>
                  <button type="submit" className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-cyan-700 transition shadow-md">
                    {modalMode === "create" ? "Tạo chi nhánh" : "Lưu thay đổi"}
                  </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {isDetailModalOpen && selectedStore && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 transition-opacity">
          <div className="w-full max-w-md bg-white rounded-2xl drop-shadow-2xl overflow-hidden shadow-2xl relative">
             <div className="relative p-7 bg-slate-50 overflow-hidden border-b border-slate-200">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-100 rounded-bl-full -z-0 opacity-50"></div>
                
                <button onClick={() => setIsDetailModalOpen(false)} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition z-10 bg-white shadow-sm border border-slate-200">
                   <i className="fa-solid fa-xmark"></i>
                </button>

                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 relative z-10 pr-10">
                   <i className="fa-solid fa-map-location-dot text-cyan-500"></i> {selectedStore.Name_store}
                </h3>
             </div>
             
             <div className="p-7 space-y-6 text-sm bg-white">
                <div className="flex items-start gap-4">
                   <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0"><i className="fa-solid fa-phone text-lg"></i></div>
                   <div className="flex-1 mt-0.5">
                      <p className="font-bold text-slate-800 text-base">{selectedStore.Phone || "Đang cập nhật"}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Hotline cửa hàng</p>
                   </div>
                </div>
                <div className="flex items-start gap-4">
                   <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0"><i className="fa-solid fa-clock text-lg"></i></div>
                   <div className="flex-1 mt-0.5">
                      <p className="font-bold text-slate-800 text-base">{selectedStore.Opening_time?.substring(0,5)} - {selectedStore.Closing_time?.substring(0,5)}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Giờ mở cửa (T2 - CN)</p>
                   </div>
                </div>
                <div className="flex items-start gap-4">
                   <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0"><i className="fa-solid fa-location-dot text-lg"></i></div>
                   <div className="flex-1 mt-0.5">
                      <p className="font-bold text-slate-800 leading-snug">{selectedStore.Address}</p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">{selectedStore.Ward ? `${selectedStore.Ward}, ${selectedStore.Province}` : selectedStore.Province}</p>
                   </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                   <button onClick={() => setIsDetailModalOpen(false)} className="bg-slate-100 font-bold text-slate-600 px-6 py-2.5 rounded-xl hover:bg-slate-200 transition">Đóng</button>
                </div>
             </div>
          </div>
        </div>
      )}


    </main>
  );
}
