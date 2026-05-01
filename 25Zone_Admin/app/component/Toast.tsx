"use client";
import { useEffect, useState } from "react";

type ToastType = "success" | "error";

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

export const toast = {
  success: (message: string) => {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("add-toast", {
        detail: { message, type: "success" },
      });
      window.dispatchEvent(event);
    }
  },
  error: (message: string) => {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("add-toast", {
        detail: { message, type: "error" },
      });
      window.dispatchEvent(event);
    }
  },
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleAddToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { message, type } = customEvent.detail;
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };

    window.addEventListener("add-toast", handleAddToast);
    return () => window.removeEventListener("add-toast", handleAddToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center justify-between w-[350px] p-4 rounded-xl shadow-lg border transition-all duration-300 animate-in fade-in slide-in-from-top-5 ${
            t.type === "success"
              ? "bg-[#F2FCF5] border-[#23A24D]"
              : "bg-[#FEF2F2] border-[#EF4444]"
          }`}
        >
          <div className="flex items-center gap-3">
            {t.type === "success" ? (
              <svg
                className="w-6 h-6 text-[#23A24D]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 text-[#EF4444]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <span
              className={`font-medium ${
                t.type === "success" ? "text-[#23A24D]" : "text-[#EF4444]"
              }`}
            >
              {t.message}
            </span>
          </div>
          <button
            onClick={() =>
              setToasts((prev) => prev.filter((toast) => toast.id !== t.id))
            }
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
