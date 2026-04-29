"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

/* ─── Types ─── */
export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

/* ─── Single Toast ─── */
function ToastCard({ item, onClose }: { item: ToastItem; onClose: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose(item.id), 300);
    }, 3000);
    return () => clearTimeout(t);
  }, [item.id, onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(item.id), 300);
  };

  const styles: Record<ToastType, { bg: string; border: string; iconColor: string; textColor: string; icon: JSX.Element }> = {
    success: {
      bg: "bg-[#F4FCF6]",
      border: "border-[#27AE60]",
      iconColor: "#27AE60",
      textColor: "text-[#27AE60]",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-400",
      iconColor: "#ef4444",
      textColor: "text-red-700",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
      ),
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-400",
      iconColor: "#f59e0b",
      textColor: "text-amber-700",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
      ),
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-400",
      iconColor: "#33B1FA",
      textColor: "text-blue-700",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#33B1FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
        </svg>
      ),
    },
  };

  const s = styles[item.type];

  return (
    <div
      className={`pointer-events-auto ${s.bg} border ${s.border} rounded-xl shadow-lg px-5 py-3.5 flex items-center gap-4 min-w-[300px] max-w-[400px] w-full transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      <div className="flex-shrink-0">{s.icon}</div>
      <p className={`flex-grow ${s.textColor} font-bold text-[15px]`}>{item.message}</p>
      <button onClick={handleClose} className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
}

/* ─── Toast Container (portal to body) ─── */
export function ToastContainer({ toasts, onClose }: { toasts: ToastItem[]; onClose: (id: string) => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed top-20 md:top-10 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none px-4">
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} onClose={onClose} />
      ))}
    </div>,
    document.body
  );
}

/* ─── useToast hook ─── */
let _counter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, type: ToastType = "info") => {
    const id = `toast_${++_counter}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const close = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg: string) => show(msg, "success"), [show]);
  const error   = useCallback((msg: string) => show(msg, "error"),   [show]);
  const warning = useCallback((msg: string) => show(msg, "warning"), [show]);
  const info    = useCallback((msg: string) => show(msg, "info"),    [show]);

  return { toasts, close, show, success, error, warning, info };
}
