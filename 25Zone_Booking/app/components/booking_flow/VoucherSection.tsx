"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/app/components/booking_flow/bookingData";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  buildBookingFlowHref,
} from "@/lib/booking-flow-selection";
import { useAuth } from "../auth/AuthProvider";

const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  "http://localhost:5001";
type SelectedItem = {
  key: string;
  title: string;
  price: number;
  tone?: "amber" | "default" | "slate";
};
type Props = {
  total: number;
  selectedItems: SelectedItem[];
  safeSelection: any;
  selectedSalon: any;
  selectedStylist: any;
  selectedStylistId: number;
  selectedDate: string;
  selectedTime: string;
  totalStylistDuration: number;
};

export default function VoucherSection({
  total,
  selectedItems,
  safeSelection,
  selectedSalon,
  selectedStylist,
  selectedStylistId,
  selectedDate,
  selectedTime,
  totalStylistDuration,
}: Props) {
  const router = useRouter();
  const { user } = useAuth();

  const [voucherCode, setVoucherCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [maxDiscount, setMaxDiscount] = useState(0);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const res = await fetch(
          `${apiBase}/api/voucherbooking/available?total=${total}`
        );
        const data = await res.json();
        setVouchers(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchVouchers();
  }, [total]);

  const payable = total - discount;

  // APPLY VOUCHER
  const handleApplyVoucher = async () => {
    setError("");

    if (!voucherCode.trim()) {
      setError("Vui lòng nhập mã voucher");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${apiBase}/api/voucherbooking/check?code=${encodeURIComponent(voucherCode.trim())}&total=${total}`
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setDiscount(data.discount);
      setMaxDiscount(data.voucher?.maxDiscountAmount || 0);
    } catch (err: any) {
      setMaxDiscount(0);
      setDiscount(0);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleApplyVoucherFromList = async (voucher: any) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `${apiBase}/api/voucherbooking/check?code=${voucher.code}&total=${total}`
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setDiscount(data.discount);
      setMaxDiscount(data.voucher?.maxDiscountAmount || 0);
      setVoucherCode(voucher.code);
      setSelectedVoucher(voucher);
    } catch (err: any) {
      setDiscount(0);
      setMaxDiscount(0);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // CONFIRM
  const handleConfirm = async () => {
    setConfirming(true);

    try {
      const res = await fetch(`${apiBase}/api/datlich`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: safeSelection.phone,
          storeId: safeSelection.salonId,
          stylistId: selectedStylistId,
          date: selectedDate,
          time: selectedTime,
          serviceIds: safeSelection.serviceIds,
          comboIds: safeSelection.comboIds,
          duration: totalStylistDuration,
          voucherCode: voucherCode || undefined,
          discountAmount: discount || 0,
          finalPrice: payable, // total - discount
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      const url = buildBookingFlowHref(4, safeSelection, {
        bookingId: data.bookingId,
        stylistId: selectedStylistId,
        date: selectedDate,
        time: selectedTime,
      }).replace("/xacnhan", "/datlichthanhcong");

      router.push(url);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
      <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 sm:gap-6">
        <div className="rounded-3xl bg-white border border-gray-100 p-3 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-slate-900">
                Mục đã chọn
              </h2>
              <p className="text-[11px] sm:text-sm text-slate-500">
                Kiểm tra lại dịch vụ và mã giảm giá.
              </p>
            </div>
            <Link
              href={buildBookingFlowHref(2, safeSelection)}
              className="text-[12px] sm:text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Đổi dịch vụ
            </Link>
          </div>

          <div className="space-y-3">
            {selectedItems.map((item) => (
              <div
                key={item.key}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${item.tone === "amber"
                  ? "border-amber-200 bg-amber-50"
                  : "border-slate-100 bg-slate-50"
                  }`}
              >
                <span className="text-[12px] sm:text-sm font-semibold text-slate-700">
                  {item.title}
                </span>
                <span className="text-[12px] sm:text-sm font-bold text-slate-900">
                  {formatCurrency(item.price)}
                </span>
              </div>
            ))}
            {selectedItems.length === 0 ? (
              <div className="text-[12px] sm:text-sm text-slate-500">
                Chưa chọn dịch vụ hoặc combo.
              </div>
            ) : null}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
              Thông tin khách
            </p>
            <div className="mt-3 flex items-center gap-3">
              <img
                src={
                  user?.Image
                    ? user.Image.startsWith("http")
                      ? user.Image
                      : `${apiBase}/image/${user.Image}`
                    : "/image/avatar.png"
                }
                alt="User Avatar"
                className="h-12 w-12 rounded-2xl object-cover"
              />
              <div>
                <p className="text-[13px] sm:text-base font-semibold text-slate-900">
                  {user?.Name_user || "Khách đặt lịch"}
                </p>
                <p className="text-[11px] sm:text-sm text-slate-500">
                  {user?.Phone || safeSelection.phone || "Chưa có số điện thoại"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4">
            <label className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
              Mã voucher
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="bookingVoucherCode"
                type="text"
                placeholder="Nhập mã"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[12px] text-slate-700 focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleApplyVoucher}
                disabled={loading || !voucherCode.trim()}
                className="px-4 rounded-xl bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? "Đang kiểm tra..." : "Áp dụng"}
              </button>
            </div>
            {error ? (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            ) : null}

            {!error && discount > 0 ? (
              <>
                <p className="mt-3 text-sm text-green-600">
                  Mã voucher đã áp dụng: giảm {formatCurrency(discount)}
                </p>

                {maxDiscount > 0 && (
                  <p className="text-xs text-slate-500">
                    Giảm tối đa: {formatCurrency(maxDiscount)}
                  </p>
                )}
              </>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-gray-100 p-3 sm:p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-base sm:text-xl font-bold text-slate-900">
              Thanh toán
            </h2>
            <p className="text-[11px] sm:text-sm text-slate-500">
              Tất cả giá đã bao gồm VAT
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between text-[12px] sm:text-sm">
              <span className="text-slate-500">Tổng cộng</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(total)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px] sm:text-sm">
              <span className="text-slate-500">Giảm giá</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(discount)}
              </span>
            </div>
            <div className="h-px bg-slate-200" />
            <div className="flex items-center justify-between text-[13px] sm:text-base font-bold text-slate-900">
              <span>Thanh toán</span>
              <span>{formatCurrency(payable)}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-center mt-5">
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="bg-blue-900 text-white px-20 py-4 rounded-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {confirming ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐẶT LỊCH"}
        </button>
      </div>
    </>
  );
}