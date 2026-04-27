"use client";

import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/components/auth/AuthProvider";
import Link from "next/link";

export default function VietQRPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const amount = searchParams.get("amount") || "0";
  const { bootstrapped, user, token } = useAuth();
  
  const [timeLeft, setTimeLeft] = useState(600); // 10 phút

  useEffect(() => {
    if (bootstrapped && !user) {
      router.push("/login");
    }
  }, [bootstrapped, user, router]);

  useEffect(() => {
    if (timeLeft <= 0) {
      alert("Thời gian thanh toán đã hết, giao dịch sẽ bị hủy!");
      fetch(`http://localhost:5001/api/orders/${params.orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: "cancelled" }),
      }).then(() => {
        router.push("/");
      }).catch(console.error);
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, router]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handlePaymentSuccess = () => {
    // Giả lập thanh toán thành công
    alert("Thanh toán thành công! Đang chuyển hướng...");
    router.push(`/checkout/success/${params.orderId}`);
  };

  const handleCancel = async () => {
    if (!confirm("Bạn có chắc chắn muốn hủy giao dịch này không?")) return;

    try {
      const res = await fetch(`http://localhost:5001/api/orders/${params.orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (res.ok) {
        alert("Giao dịch đã được hủy!");
        router.push("/");
      } else {
        alert("Có lỗi xảy ra khi hủy giao dịch.");
      }
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi hủy giao dịch.");
    }
  };

  if (!bootstrapped || !user) return null;

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#003366] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-xl">
            <i className="fa-solid fa-qrcode text-2xl"></i>
            VietQR
          </div>
          <div className="text-white text-right">
            <p className="text-sm opacity-80">Thời gian giao dịch</p>
            <p className="text-xl font-bold font-mono">{formatTime(timeLeft)}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col items-center text-center space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Thanh toán qua mã VietQR
          </h2>
          <p className="text-gray-600 text-sm">
            Mở ứng dụng ngân hàng hoặc ví điện tử (MoMo, ZaloPay...) hỗ trợ quét VietQR để thanh toán cho đơn hàng{" "}
            <span className="font-semibold text-gray-900">#{params.orderId}</span>
          </p>

          <div className="p-4 bg-gray-50 border-2 border-dashed border-[#003366]/30 rounded-2xl">
            <img
              src={`https://img.vietqr.io/image/mbbank-0969919191-compact2.png?amount=${amount}&addInfo=Thanh toan don hang ${params.orderId}&accountName=25Zone%20Shop`}
              alt="Mã VietQR"
              className="w-56 h-56 object-contain"
            />
          </div>

          <div className="w-full bg-gray-50 rounded-xl p-4 flex justify-between items-center">
            <span className="text-gray-600 font-medium">Số tiền thanh toán:</span>
            <span className="text-2xl font-extrabold text-[#003366]">
              {Number(amount).toLocaleString()}đ
            </span>
          </div>

          <div className="w-full space-y-3 pt-4">
            <button
              onClick={handlePaymentSuccess}
              className="w-full bg-[#003366] hover:bg-[#002244] text-white py-3.5 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-[#003366]/30 flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-check-circle"></i>
              Mô phỏng thanh toán xong
            </button>
            <button
              onClick={handleCancel}
              className="block w-full py-3.5 text-center text-gray-600 font-semibold hover:bg-gray-50 rounded-xl transition-colors"
            >
              Hủy giao dịch
            </button>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-sm text-gray-500">
        © 2026 25Zone Shop. Mọi quyền được bảo lưu.
      </p>
    </div>
  );
}
