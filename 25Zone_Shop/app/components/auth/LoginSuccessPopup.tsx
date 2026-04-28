"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

export function LoginSuccessPopup({ returnTo = "/" }: { returnTo?: string }) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation after mount
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      if (returnTo === "RELOAD") {
        window.location.reload();
      } else {
        router.replace(returnTo);
      }
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, router, returnTo]);

  const navigate = () => {
    if (returnTo === "RELOAD") {
      window.location.reload();
    } else {
      router.replace(returnTo);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={
          "absolute inset-0 bg-black/45 transition-opacity duration-200 " +
          (visible ? "opacity-100" : "opacity-0")
        }
      />

      {/* Card */}
      <div
        className={
          "relative bg-white rounded-3xl shadow-2xl px-8 py-10 sm:px-10 sm:py-12 flex flex-col items-center gap-6 max-w-[380px] w-full transition-all duration-200 " +
          (visible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-[.98] translate-y-2")
        }
      >
        {/* Icon circle */}
        <div className="w-[72px] h-[72px] rounded-full bg-accent-blue flex items-center justify-center shadow-[0_0_20px_rgba(51,177,250,.35)]">
          <i className="fa-solid fa-check text-white text-[28px]" />
        </div>

        {/* Text */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#003366]">
            Đăng nhập thành công
          </h2>
        </div>

        {/* Progress bar */}
        <div className="w-full flex flex-col items-center gap-2.5">
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-blue rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${((3 - countdown) / 3) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-400">
            Tự động chuyển hướng sau{" "}
            <span className="text-[#003366] font-semibold">{countdown}s</span>
          </p>
        </div>

        {/* Button */}
        <button
          onClick={navigate}
          className="w-full h-[48px] bg-accent-blue text-white font-extrabold
                     rounded-full uppercase tracking-wider
                     hover:shadow-[0_0_15px_rgba(51,177,250,.55)]
                     hover:bg-sky-500
                     transition-all duration-300 active:scale-95 text-sm"
        >
          Tiếp tục
        </button>
      </div>
    </div>,
    document.body
  );
}
