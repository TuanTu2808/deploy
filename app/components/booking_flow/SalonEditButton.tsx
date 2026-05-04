"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildBookingFlowHref,
  normalizeBookingFlowSelection,
  writeStoredBookingFlowSelection,
  parseBookingFlowSelection,
} from "@/lib/booking-flow-selection";
import SalonSelectionModal from "./SalonSelectionModal";

type Props = {
  salonId?: number | null;
  currentSearchParams: Record<string, string | string[] | undefined>;
};

export default function SalonEditButton({ salonId, currentSearchParams }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-blue-600 bg-white px-4 py-2 text-[11px] font-semibold text-blue-600 hover:border-blue-700 hover:text-blue-700 mb-2 sm:mb-0"
      >
        Đổi chi nhánh
      </button>

      <SalonSelectionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentSalonId={salonId}
        onSelect={(newSalonId) => {
          const selection = parseBookingFlowSelection(currentSearchParams);
          const nextSelection = normalizeBookingFlowSelection({
            ...selection,
            salonId: newSalonId,
          });
          writeStoredBookingFlowSelection(nextSelection);
          
          // Lấy lại các params khác từ URL (như stylistId, date, time) nếu có
          const stylistId = currentSearchParams.stylistId;
          const date = currentSearchParams.date;
          const time = currentSearchParams.time;

          const overrides: any = {};
          if (stylistId) overrides.stylistId = typeof stylistId === 'object' ? stylistId[0] : stylistId;
          if (date) overrides.date = typeof date === 'object' ? date[0] : date;
          if (time) overrides.time = typeof time === 'object' ? time[0] : time;

          router.replace(buildBookingFlowHref(4, nextSelection, overrides));
          setIsOpen(false);
        }}
      />
    </>
  );
}
