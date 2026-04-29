"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getCurrentUser, type StylistUser } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL || "http://localhost:5001";

/* ─── Types ─── */
interface CompletedBooking {
  id: number;
  booking_date: string;
  start_time: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  service_names: string | null;
  combo_names: string | null;
  total_duration_minutes: number;
}

interface PreviewFile {
  file: File;
  preview: string;
}

/* ─── Helpers ─── */
function formatBookingTime(startTime: string): string {
  try {
    const d = new Date(startTime);
    if (isNaN(d.getTime())) return "--:--";
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return "--:--";
  }
}

function formatBookingDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function getServicePreview(bk: CompletedBooking): string {
  const parts: string[] = [];
  if (bk.service_names) parts.push(bk.service_names);
  if (bk.combo_names) parts.push(bk.combo_names);
  return parts.join(", ") || "Dịch vụ";
}

export default function Upload() {
  const [user, setUser] = useState<StylistUser | null>(null);

  // Bookings list
  const [bookings, setBookings] = useState<CompletedBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Selected booking
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Existing uploaded images for selected booking
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // New files to upload
  const [newFiles, setNewFiles] = useState<PreviewFile[]>([]);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [uploadError, setUploadError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Init user
  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  // Fetch completed bookings for this stylist (recent ones, not just today)
  const fetchCompletedBookings = useCallback(async (u: StylistUser) => {
    setLoadingBookings(true);
    try {
      const res = await fetch(`${API_BASE}/datlich?stylistId=${u.Id_user}&status=completed`);
      if (!res.ok) throw new Error();
      const data: CompletedBooking[] = await res.json();
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchCompletedBookings(user);
  }, [user, fetchCompletedBookings]);

  // Fetch existing result images when a booking is selected
  const fetchExistingImages = useCallback(async (bookingId: number) => {
    setLoadingExisting(true);
    setExistingImages([]);
    try {
      const res = await fetch(`${API_BASE}/datlich/${bookingId}/results`);
      if (res.ok) {
        const data = await res.json();
        setExistingImages(data.images || []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingExisting(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchExistingImages(selectedId);
      setNewFiles([]);
      setUploadSuccess("");
      setUploadError("");
    } else {
      setExistingImages([]);
    }
  }, [selectedId, fetchExistingImages]);

  // Handle file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList) return;

    const totalAllowed = 5 - existingImages.length - newFiles.length;
    if (totalAllowed <= 0) {
      setUploadError("Tối đa 5 hình ảnh cho mỗi lịch hẹn.");
      return;
    }

    const validFiles: PreviewFile[] = [];
    for (let i = 0; i < Math.min(filesList.length, totalAllowed); i++) {
      const file = filesList[i];
      // Validate type
      if (!file.type.startsWith("image/")) continue;
      // Validate size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`"${file.name}" vượt quá 5MB.`);
        continue;
      }
      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }

    if (validFiles.length > 0) {
      setNewFiles((prev) => [...prev, ...validFiles]);
      setUploadError("");
    }

    // Reset input so same file can be selected again
    e.target.value = "";
  }, [existingImages.length, newFiles.length]);

  // Remove preview file
  const removeNewFile = useCallback((index: number) => {
    setNewFiles((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Upload
  const handleUpload = useCallback(async () => {
    if (!selectedId || newFiles.length === 0) return;

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const formData = new FormData();
      newFiles.forEach((f) => formData.append("images", f.file));

      const res = await fetch(`${API_BASE}/datlich/${selectedId}/results`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Tải lên thất bại.");
      }

      // Clean up preview URLs
      newFiles.forEach((f) => URL.revokeObjectURL(f.preview));
      setNewFiles([]);
      setExistingImages(data.images || []);
      setUploadSuccess(`Đã tải lên thành công ${data.uploadedCount || newFiles.length} ảnh!`);

      // Clear success message after 4 seconds
      setTimeout(() => setUploadSuccess(""), 4000);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải ảnh.");
    } finally {
      setUploading(false);
    }
  }, [selectedId, newFiles]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      newFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedBooking = bookings.find((b) => b.id === selectedId) || null;
  const canUploadMore = existingImages.length + newFiles.length < 5;
  const totalImages = existingImages.length + newFiles.length;

  return (
    <div className="w-full max-w-3xl mx-auto pt-4 pb-8 md:py-8">

      <div className="bg-white dark:bg-primary-dark rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-slate-100 dark:border-primary/50 space-y-8">

        {/* ─── 1. Select Booking ─── */}
        <div>
          <label className="block text-primary dark:text-slate-200 font-bold mb-3">Chọn ca đã hoàn thành</label>

          {loadingBookings ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-6 h-6 border-3 border-slate-200 dark:border-slate-700 border-t-accent-blue rounded-full animate-spin"></div>
              <span className="ml-3 text-sm text-slate-400 font-medium">Đang tải danh sách...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-slate-50 dark:bg-primary/20 rounded-2xl p-6 text-center border border-slate-200 dark:border-primary/50">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-primary/30 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                </svg>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">Chưa có ca hoàn thành nào.</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Hoàn thành ít nhất một ca để có thể tải ảnh kết quả.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bookings.map((bk) => {
                const isSelected = selectedId === bk.id;
                return (
                  <button
                    key={bk.id}
                    onClick={() => setSelectedId(isSelected ? null : bk.id)}
                    className={`w-full text-left rounded-2xl p-4 transition-all duration-300 border-2 cursor-pointer ${
                      isSelected
                        ? "bg-primary/5 dark:bg-accent-blue/10 border-primary dark:border-accent-blue shadow-sm"
                        : "bg-slate-50/50 dark:bg-primary/10 border-slate-100 dark:border-primary/30 hover:border-slate-200 dark:hover:border-primary/50 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Radio indicator */}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? "border-primary dark:border-accent-blue" : "border-slate-300 dark:border-slate-600"
                      }`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary dark:bg-accent-blue"></div>}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-primary dark:text-white truncate">
                            {bk.customer_name || "Khách hàng"}
                          </h4>
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 shrink-0">
                            {formatBookingDate(bk.booking_date)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                          {formatBookingTime(bk.start_time)} • {getServicePreview(bk)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── 2. Selected Booking Detail ─── */}
        {selectedBooking && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-accent-blue/5 dark:bg-accent-blue/10 rounded-2xl p-4 border border-accent-blue/20 dark:border-accent-blue/20 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-blue/10 dark:bg-accent-blue/20 flex items-center justify-center shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#33B1FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-primary dark:text-white truncate">{selectedBooking.customer_name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">
                  {formatBookingTime(selectedBooking.start_time)} - {formatBookingDate(selectedBooking.booking_date)} • {getServicePreview(selectedBooking)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── 3. Existing Images ─── */}
        {selectedId && (
          <div className="animate-in fade-in duration-300">
            {loadingExisting ? (
              <div className="flex items-center gap-3 py-4">
                <div className="w-5 h-5 border-2 border-slate-200 border-t-accent-blue rounded-full animate-spin"></div>
                <span className="text-sm text-slate-400 font-medium">Đang tải ảnh đã lưu...</span>
              </div>
            ) : existingImages.length > 0 ? (
              <div>
                <h3 className="text-primary dark:text-slate-200 font-bold mb-3 flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                  Ảnh đã tải lên ({existingImages.length}/5)
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {existingImages.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-primary/50 shadow-sm">
                      <img
                        src={`${IMAGE_BASE}${img}`}
                        alt={`Kết quả ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ─── 4. Upload Area ─── */}
        {selectedId && canUploadMore && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <label className="block text-primary dark:text-slate-200 font-bold mb-3">
              Thêm hình ảnh {totalImages > 0 && <span className="text-slate-400 font-medium">({totalImages}/5)</span>}
            </label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 dark:border-primary/50 hover:border-accent-blue dark:hover:border-accent-blue hover:bg-accent-blue/5 dark:hover:bg-accent-blue/10 bg-slate-50/50 dark:bg-primary/20 rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all group"
            >
              <div className="w-16 h-16 bg-white dark:bg-primary shadow-sm border border-slate-100 dark:border-primary-dark group-hover:scale-110 group-hover:shadow-md group-hover:border-accent-blue transition-all rounded-full flex items-center justify-center mb-4 text-accent-blue dark:text-accent-blue">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
                </svg>
              </div>
              <p className="text-lg font-bold text-primary dark:text-white mb-1">Chạm để chọn ảnh</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                JPG, PNG, WebP • Tối đa 5MB / ảnh • Còn {5 - totalImages} ảnh
              </p>
            </div>
          </div>
        )}

        {/* ─── 5. New Files Preview ─── */}
        {newFiles.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-primary dark:text-slate-200 font-bold mb-3">
              Ảnh mới chọn ({newFiles.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {newFiles.map((pf, idx) => (
                <div key={idx} className="aspect-square rounded-2xl overflow-hidden relative group border border-slate-200 dark:border-primary/50 shadow-sm">
                  <img src={pf.preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeNewFile(idx); }}
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/50 text-white rounded-full hover:bg-red-500 backdrop-blur-sm transition-colors cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                    </svg>
                  </button>
                  {/* File size */}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 text-white text-[10px] font-bold rounded-md backdrop-blur-sm">
                    {(pf.file.size / 1024 / 1024).toFixed(1)}MB
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Messages ─── */}
        {uploadSuccess && (
          <div className="flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p className="text-sm font-bold text-green-600 dark:text-green-400">{uploadSuccess}</p>
          </div>
        )}

        {uploadError && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            <p className="text-sm font-bold text-red-600 dark:text-red-400">{uploadError}</p>
          </div>
        )}

        {/* ─── 6. Submit Button ─── */}
        {selectedId && (
          <div className="pt-4 border-t border-slate-100 dark:border-primary/50">
            <button
              onClick={handleUpload}
              disabled={newFiles.length === 0 || uploading}
              className={`w-full py-4.5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                newFiles.length > 0 && !uploading
                  ? "bg-primary dark:bg-accent-blue text-white hover:bg-primary-dark dark:hover:bg-blue-400 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
                  : "bg-slate-100 dark:bg-primary/50 text-slate-400 dark:text-slate-500 cursor-not-allowed"
              }`}
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang tải lên...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
                  </svg>
                  Tải lên {newFiles.length} ảnh
                </>
              )}
            </button>
          </div>
        )}

        {/* ─── No booking selected hint ─── */}
        {!selectedId && bookings.length > 0 && (
          <div className="text-center py-4">
            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">
              Chọn một ca đã hoàn thành ở trên để bắt đầu tải ảnh kết quả.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
