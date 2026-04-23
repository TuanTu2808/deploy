"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildBookingFlowHref,
  normalizeBookingFlowSelection,
  writeStoredBookingFlowSelection,
} from "@/lib/booking-flow-selection";

type Props = {
  phone: string;
  salonId: number;
  stylistId: number;
  date: string;
  time: string;
  serviceIds: number[];
  comboIds?: number[];
  duration?: number;
};

export default function ConfirmBookingButton({
  phone,
  salonId,
  stylistId,
  date,
  time,
  serviceIds = [],
  comboIds = [],
  duration,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:5001";

  const canSubmit =
    Boolean(phone) &&
    Boolean(salonId) &&
    Boolean(stylistId) &&
    Boolean(date) &&
    Boolean(time) &&
    ((Array.isArray(serviceIds) && serviceIds.length > 0) || comboIds.length > 0);

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${apiBase}/api/datlich`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          storeId: salonId,
          stylistId,
          date,
          time,
          serviceIds,
          comboIds,
          duration
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || JSON.stringify(data));
      }

      // ===== Lấy lịch làm việc của stylist =====
      const shiftRes = await fetch(
        `${apiBase}/api/lichlamviec?userId=${stylistId}&date=${date}`
      );

      const shiftData = await shiftRes.json();
      const hours = shiftData.hours || [];

      // ===== tìm slot bắt đầu =====
const startIndex = hours.findIndex(
  (h: any) => h.Hours.slice(0, 5) === time
);

      if (startIndex === -1) {
        throw new Error("Không tìm thấy slot giờ.");
      }

      // ===== tính số slot cần chiếm =====
      const slotCount = Math.ceil((duration || 30) / 30);

      // ===== lấy slot cần update =====
      const slotsToUpdate = hours.slice(startIndex, startIndex + slotCount);
// ✅ LOG PHẢI ĐẶT Ở ĐÂY
console.log("hours.length:", hours.length);
console.log("startIndex:", startIndex);
console.log("duration used:", duration);
console.log("expected slotCount:", slotCount);
console.log("time:", time);
console.log("hours sample:", hours.slice(0, 5));
console.log("actual slots:", slotsToUpdate.length);
console.log("slotsToUpdate:", slotsToUpdate);
      // ===== update các slot =====
      await Promise.all(
        slotsToUpdate.map(async (slot: any) => {
          console.log("Updating slot:", slot);

          const res = await fetch(`${apiBase}/api/lichlamviec/hour`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              Id_work_shifts_hour: slot.Id_work_shifts_hour,
              Status: 0,
            }),
          });

          const result = await res.json().catch(() => null);

          console.log("API response:", result);

          if (!res.ok) {
            console.error("Update slot failed:", result);
          }
        })
      );

      writeStoredBookingFlowSelection(
        normalizeBookingFlowSelection({
          phone,
        }),
      );

      router.push(
        buildBookingFlowHref(
          1,
          normalizeBookingFlowSelection({
            phone,
            salonId,
            serviceIds,
            comboIds,
          }),
          {
            step: "success",
            bookingId: String(data?.bookingId ?? ""),
            stylistId,
            date,
            time,
          },
        ).replace("/chonsalon?", "/datlichthanhcong?"),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi đặt lịch.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full sm:w-[420px]">
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit || loading}
        className={
          canSubmit
            ? "w-full h-11 sm:h-14 lg:h-16 bg-blue-900 text-white rounded-full font-semibold text-[13px] sm:text-base hover:bg-blue-800 flex items-center justify-center transition-all duration-300 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            : "w-full h-11 sm:h-14 lg:h-16 rounded-full font-semibold text-[13px] sm:text-base flex items-center justify-center bg-slate-200 text-slate-500"
        }
        aria-busy={loading}
      >
        {loading ? "ĐANG XÁC NHẬN..." : "XÁC NHẬN ĐẶT LỊCH"}
      </button>
      
      {/* ERROR POPUP */}
      {error ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[24px] p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 relative">
            <div className="text-center">
              <div className="mx-auto flex flex-col items-center justify-center h-16 w-16 rounded-full bg-red-50 text-red-500 mb-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <i className="fa-solid fa-circle-exclamation text-3xl"></i>
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Không thể đặt lịch</h3>
              <p className="text-[13.5px] text-slate-600 mb-6 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                {error}
              </p>
              <div className="flex gap-3">
                 <button
                  onClick={() => setError("")}
                  className="flex-1 bg-slate-100 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-200 transition-colors shadow-sm active:scale-95"
                 >
                   Đóng lại
                 </button>
                 <button
                  onClick={() => {
                     setError("");
                     router.push("/taikhoan/lichhen");
                  }}
                  className="flex-1 bg-blue-900 text-white font-semibold py-3 rounded-xl hover:bg-blue-800 transition-colors shadow-md shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-2"
                 >
                   Xem lịch cũ <i className="fa-solid fa-arrow-right"></i>
                 </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
