import { redirect } from "next/navigation";
import StepQuerySync from "@/app/components/booking_flow/StepQuerySync";
import SalonSelectionView from "@/app/components/booking_flow/SalonSelectionView";
import {
  INACTIVE_BOOKING_SELECTION_NOTICE,
  validateBookingFlowSelectionAvailability,
} from "@/lib/booking-flow-availability";
import {
  buildBookingFlowHref,
  parseBookingFlowSelection,
  type BookingFlowSelection,
} from "@/lib/booking-flow-selection";
import {
  fetchBookingSalonById,
  fetchBookingSalons,
} from "@/lib/booking-salons";

export const metadata = {
  title: "Chon Salon",
};

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type PageProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const selection = parseBookingFlowSelection(params);
  const validationResult = await validateBookingFlowSelectionAvailability(selection);

  if (validationResult.hasChanges) {
    redirect(
      buildBookingFlowHref(1, validationResult.selection, {
        step: 1,
        notice: INACTIVE_BOOKING_SELECTION_NOTICE,
      }),
    );
  }

  const initialNotice = Array.isArray(params.notice) ? params.notice[0] : params.notice;
  const safeSelection = validationResult.selection as BookingFlowSelection;
  const selectedSalonId = safeSelection.salonId ?? undefined;

  const salons = await fetchBookingSalons();
  const selectedSalon = await fetchBookingSalonById(selectedSalonId);
  const mergedSalons =
    selectedSalon && !salons.some((salon) => salon.id === selectedSalon.id)
      ? [selectedSalon, ...salons]
      : salons;

  return (
    <main className="bg-slate-50">
      <StepQuerySync step={1} />
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-6xl space-y-5 sm:space-y-8">
          <SalonSelectionView
            salons={mergedSalons}
            initialSelection={safeSelection}
            initialNotice={initialNotice}
          />
        </div>
      </div>
    </main>
  );
}
