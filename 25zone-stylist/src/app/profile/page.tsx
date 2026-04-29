"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser, logoutStylist, getUserInitials,
  getAccessToken, updateCurrentUser, type StylistUser,
} from "@/lib/auth";
import { useToast, ToastContainer } from "@/components/Toast";

const API_BASE  = process.env.NEXT_PUBLIC_API_URL   || "http://localhost:5001/api";
const IMG_BASE  = process.env.NEXT_PUBLIC_IMAGE_URL || "http://localhost:5001";

/* ─── helpers ─── */
function authHeaders(extra: Record<string, string> = {}) {
  const token = getAccessToken();
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
}
function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch { return dateStr; }
}
function formatTime(startTime: string) {
  try {
    const d = new Date(startTime);
    return isNaN(d.getTime()) ? "--:--" : d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch { return "--:--"; }
}

/* ─── types ─── */
interface ResultImage { bookingId: number; date: string; startTime: string; customerName: string; images: string[]; }
type Tab = "info" | "gallery";

export default function Profile() {
  const router = useRouter();
  const toast  = useToast();
  const [user, setUser]           = useState<StylistUser | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("info");

  /* ── logout ── */
  const [loggingOut, setLoggingOut] = useState(false);
  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await logoutStylist(); } finally { router.push("/login"); }
  }, [loggingOut, router]);

  /* ── avatar ── */
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Vui lòng chọn file ảnh."); return; }
    if (file.size > 5 * 1024 * 1024)    { toast.error("Ảnh tối đa 5MB."); return; }
    setAvatarUploading(true);
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      const res  = await fetch(`${API_BASE}/users/me/avatar`, { method: "POST", headers: authHeaders(), body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi tải ảnh.");
      updateCurrentUser(data.user);
      setUser(data.user);
      window.dispatchEvent(new CustomEvent("avatar_updated"));
      toast.success("Cập nhật ảnh đại diện thành công!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Lỗi tải ảnh.");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  }, [toast]);

  /* ── edit info ── */
  const [editing, setEditing]     = useState(false);
  const [editName, setEditName]   = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNameErr, setEditNameErr]   = useState("");
  const [editPhoneErr, setEditPhoneErr] = useState("");
  const [saving, setSaving] = useState(false);

  const openEdit = useCallback(() => {
    if (!user) return;
    setEditName(user.Name_user);
    setEditPhone(user.Phone);
    setEditNameErr(""); setEditPhoneErr("");
    setEditing(true);
  }, [user]);

  const handleSave = useCallback(async () => {
    let hasErr = false;
    if (!editName.trim()) { setEditNameErr("Vui lòng nhập tên."); hasErr = true; } else setEditNameErr("");
    const digits = editPhone.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 11) { setEditPhoneErr("SĐT từ 9-11 số."); hasErr = true; } else setEditPhoneErr("");
    if (hasErr) return;
    setSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/users/me`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name: editName.trim(), phone: digits, email: user?.Email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi cập nhật.");
      updateCurrentUser(data.user);
      setUser(data.user);
      toast.success("Cập nhật thông tin thành công!");
      setEditing(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Lỗi server.");
    } finally {
      setSaving(false);
    }
  }, [editName, editPhone, user, toast]);

  /* ── gallery ── */
  const [gallery, setGallery]             = useState<ResultImage[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [lightboxSrc, setLightboxSrc]     = useState<string | null>(null);
  const galleryFetched                    = useRef(false); // prevent infinite refetch when empty

  const fetchGallery = useCallback(async (u: StylistUser) => {
    if (galleryFetched.current) return; // already fetched, don't repeat
    galleryFetched.current = true;
    setLoadingGallery(true);
    try {
      const res  = await fetch(`${API_BASE}/datlich?stylistId=${u.Id_user}&status=completed`);
      if (!res.ok) return;
      const bookings: Array<{ id: number; booking_date: string; start_time: string; customer_name: string; }> = await res.json();

      const results = await Promise.all(
        bookings.map(async (bk) => {
          try {
            const r = await fetch(`${API_BASE}/datlich/${bk.id}/results`);
            const d = await r.json();
            const imgs: string[] = d.images || [];
            if (!imgs.length) return null;
            return { bookingId: bk.id, date: bk.booking_date, startTime: bk.start_time, customerName: bk.customer_name, images: imgs } as ResultImage;
          } catch { return null; }
        })
      );

      const filtered = results.filter(Boolean) as ResultImage[];
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setGallery(filtered);
    } catch { /* ignore */ } finally {
      setLoadingGallery(false);
    }
  }, []);

  /* ── init ── */
  useEffect(() => { setUser(getCurrentUser()); }, []);
  useEffect(() => {
    if (user && activeTab === "gallery" && !galleryFetched.current && !loadingGallery) {
      fetchGallery(user);
    }
  }, [user, activeTab, loadingGallery, fetchGallery]);

  /* ── derived ── */
  const initials    = user ? getUserInitials(user.Name_user) : "?";
  const displayName = user?.Name_user || "Stylist";
  const displayRole = user?.role === "admin" ? "Admin Stylist" : "Stylist";
  const avatarUrl   = user?.Image ? `${IMG_BASE}${user.Image}` : null;

  return (
    <div className="w-full max-w-2xl mx-auto py-8">
      <ToastContainer toasts={toast.toasts} onClose={toast.close} />


      <div className="px-4 md:px-0 space-y-5">

        {/* ── Avatar + Name card ── */}
        <div className="bg-white dark:bg-primary-dark rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-primary/50 flex items-center gap-5">
          {/* Avatar – entire area is clickable */}
          <div className="relative shrink-0">
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="group relative w-24 h-24 rounded-[1.2rem] overflow-hidden bg-slate-100 dark:bg-primary border-2 border-slate-200 dark:border-primary-dark shadow-sm cursor-pointer disabled:cursor-not-allowed block"
            >
              {/* Avatar image or initials */}
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-black text-primary dark:text-accent-blue">
                  {initials}
                </div>
              )}

              {/* Hover / uploading overlay */}
              <div className={`absolute inset-0 flex flex-col items-center justify-center gap-1 transition-all duration-200 rounded-[1rem] ${
                avatarUploading
                  ? "bg-black/50"
                  : "bg-black/0 group-hover:bg-black/50"
              }`}>
                {avatarUploading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="opacity-0 group-hover:opacity-100 transition-opacity text-white" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-[9px] font-bold leading-tight text-center px-1">Đổi ảnh</span>
                  </>
                )}
              </div>
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>

          {/* Name / role + hint */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-primary dark:text-white truncate">{displayName}</h2>
            <p className="text-accent-blue font-bold text-sm">{displayRole}</p>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-accent-blue dark:hover:text-accent-blue transition-colors font-semibold cursor-pointer disabled:opacity-50"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Nhấn để thay ảnh đại diện
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 bg-slate-50 dark:bg-primary/20 rounded-2xl p-1.5 border border-slate-100 dark:border-primary/30">
          {(["info", "gallery"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab
                  ? "bg-white dark:bg-primary-dark text-primary dark:text-white shadow-sm"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              {tab === "info" ? "Thông tin" : "Ảnh đã đăng"}
            </button>
          ))}
        </div>

        {/* ── Tab: Info ── */}
        {activeTab === "info" && (
          <div className="bg-white dark:bg-primary-dark rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-primary/50 space-y-5 animate-in fade-in duration-200">
            {!editing ? (
              <>
                {/* Info display */}
                <div className="space-y-3">
                  {[
                    { label: "Họ và tên", value: user?.Name_user },
                    { label: "Số điện thoại", value: user?.Phone },
                    { label: "Email", value: user?.Email },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-primary/30">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
                        <p className="font-semibold text-primary dark:text-white truncate mt-0.5">{value || "—"}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={openEdit}
                  className="w-full py-3.5 rounded-2xl font-bold text-white bg-primary dark:bg-accent-blue hover:bg-primary-dark dark:hover:bg-blue-400 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Chỉnh sửa thông tin
                </button>
              </>
            ) : (
              <>
                {/* Edit form */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">Họ và tên</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => { setEditName(e.target.value); setEditNameErr(""); }}
                      className={`w-full h-12 px-4 rounded-xl outline-none border-2 font-semibold text-primary dark:text-white bg-slate-50 dark:bg-primary/30 transition-all ${editNameErr ? "border-red-400 bg-red-50 dark:bg-red-900/10" : "border-transparent focus:border-accent-blue"}`}
                      placeholder="Nhập tên..."
                    />
                    {editNameErr && <p className="text-xs text-red-500 font-semibold mt-1">{editNameErr}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">Số điện thoại</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => { setEditPhone(e.target.value); setEditPhoneErr(""); }}
                      className={`w-full h-12 px-4 rounded-xl outline-none border-2 font-semibold text-primary dark:text-white bg-slate-50 dark:bg-primary/30 transition-all ${editPhoneErr ? "border-red-400 bg-red-50 dark:bg-red-900/10" : "border-transparent focus:border-accent-blue"}`}
                      placeholder="Nhập số điện thoại..."
                    />
                    {editPhoneErr && <p className="text-xs text-red-500 font-semibold mt-1">{editPhoneErr}</p>}
                  </div>
                </div>


                <div className="flex gap-3">
                  <button
                    onClick={() => setEditing(false)}
                    className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-primary/30 hover:bg-slate-100 dark:hover:bg-primary/50 transition-colors border border-slate-200 dark:border-primary cursor-pointer"
                  >
                    Huỷ
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-primary dark:bg-accent-blue hover:bg-primary-dark dark:hover:bg-blue-400 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {saving ? (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                    ) : "Lưu"}
                  </button>
                </div>
              </>
            )}

            {/* Logout */}
            <div className="pt-4 border-t border-slate-100 dark:border-primary/50">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 transition-all border border-red-100 dark:border-red-900/30 disabled:opacity-50 cursor-pointer"
              >
                {loggingOut ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                )}
                {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
              </button>
            </div>
          </div>
        )}

        {/* ── Tab: Gallery ── */}
        {activeTab === "gallery" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {loadingGallery ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="relative">
                  <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 rounded-full" />
                  <div className="absolute top-0 left-0 w-10 h-10 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-slate-400 text-sm font-medium">Đang tải ảnh...</p>
              </div>
            ) : gallery.length === 0 ? (
              <div className="bg-white dark:bg-primary-dark rounded-[2rem] p-10 shadow-sm border border-slate-100 dark:border-primary/50 flex flex-col items-center text-center">
                <div className="w-20 h-20 mb-4 rounded-[1.2rem] bg-slate-50 dark:bg-primary/30 flex items-center justify-center border border-slate-200 dark:border-primary">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-primary dark:text-white mb-1">Chưa có ảnh nào</h3>
                <p className="text-slate-400 text-sm font-medium">Các ảnh kết quả bạn đã tải lên sẽ xuất hiện ở đây.</p>
              </div>
            ) : (
              gallery.map((item) => (
                <div key={item.bookingId} className="bg-white dark:bg-primary-dark rounded-[2rem] p-5 shadow-sm border border-slate-100 dark:border-primary/50">
                  {/* Booking header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-accent-blue/10 dark:bg-accent-blue/20 flex items-center justify-center shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#33B1FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-primary dark:text-white truncate">{item.customerName || "Khách hàng"}</p>
                      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                        {formatTime(item.startTime)} • {formatDate(item.date)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-accent-blue bg-accent-blue/10 px-2.5 py-1 rounded-full border border-accent-blue/20">
                      {item.images.length} ảnh
                    </span>
                  </div>

                  {/* Image grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {item.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setLightboxSrc(`${IMG_BASE}${img}`)}
                        className="aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-primary/50 hover:scale-[1.03] hover:shadow-md transition-all cursor-pointer"
                      >
                        <img src={`${IMG_BASE}${img}`} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={() => setLightboxSrc(null)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
          <img
            src={lightboxSrc}
            alt="Xem ảnh"
            className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
