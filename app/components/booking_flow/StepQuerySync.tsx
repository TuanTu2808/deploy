"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import {
  applyBookingFlowSelectionToSearchParams,
  parseBookingFlowSelection,
  resolveClientBookingFlowSelection,
  writeStoredBookingFlowSelection,
} from "@/lib/booking-flow-selection";
import { useAuth } from "../auth/AuthProvider";
type Props = {
  step: number;
};

export default function StepQuerySync({ step }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, bootstrapped } = useAuth();
  const lastRefreshRef = useRef(0);

  // =========================
  // 🔥 SYNC QUERY + STORAGE
  // =========================
  useEffect(() => {
  // ⏳ chờ load auth xong
  if (!bootstrapped) return;

  // ❌ chưa login → chặn
  if (!user) {
      console.log("🚨 chưa login → redirect");
    router.replace("/?auth=login"); // hoặc login page
    return;
  }
    const currentQuery = searchParams.toString();
    const currentParams = new URLSearchParams(currentQuery);


  // =========================
  // ✅ FIX: AUTO ADD PHONE
  // =========================
  const hasPhone = currentParams.get("phone");
  const userPhone = user?.Phone; // hoặc user?.phone nếu đã normalize

if (!hasPhone) {
  if (!userPhone) {
    // ❌ không có phone → không cho đi tiếp flow
    router.replace("/?auth=login");
    return;
  }

  currentParams.set("phone", userPhone);

  router.replace(`${pathname}?${currentParams.toString()}`, {
    scroll: false,
  });
  return;
}

    const resolvedSelection = resolveClientBookingFlowSelection(
      parseBookingFlowSelection(currentParams),
    );

    writeStoredBookingFlowSelection(resolvedSelection);

    const nextParams = applyBookingFlowSelectionToSearchParams(
      currentParams,
      resolvedSelection,
      { step },
    );

    const nextQuery = nextParams.toString();

    // ✅ FIX QUAN TRỌNG: chặn loop
    if (nextQuery === currentQuery) return;
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
    
    // Yêu cầu NextJS bỏ qua RSC Cache và fetch lại data dựa theo query mới
    router.refresh();
  }, [pathname, router, searchParams, step]);

  // =========================
  // 🔥 REALTIME + REFRESH
  // =========================
  useEffect(() => {
    if (typeof window === "undefined" || step < 1 || step > 4) {
      return;
    }

    // ✅ throttle refresh
    const refreshPage = () => {
      const now = Date.now();

      // chặn spam refresh (5s)
      if (now - lastRefreshRef.current < 5000) return;

      lastRefreshRef.current = now;
      router.refresh();
    };

    const source = new EventSource(
      `${API_BASE_URL}/api/realtime/booking-updates`,
    );

    source.addEventListener("booking-content", refreshPage);
    source.onerror = () => {};

    const interval = window.setInterval(refreshPage, 15000);
    window.addEventListener("focus", refreshPage);

    return () => {
      source.removeEventListener("booking-content", refreshPage);
      source.close();
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshPage);
    };
  }, [router, step]);

  return null;
}

