import type { BookingService } from "@/lib/booking-services";
import type { BookingComboItem } from "@/lib/booking-combo";

const STYLIST_CATEGORIES = [1, 2, 3];

export function calculateBookingDurations(
  services: BookingService[],
  selectedServices: BookingService[],
  selectedCombos: BookingComboItem[]
) {
  const comboServices = selectedCombos.flatMap(combo =>
    combo.service_ids
      .map(id => services.find(s => s.id === id))
      .filter((s): s is BookingService => Boolean(s))
  );

  const allServices = [...selectedServices, ...comboServices];

  const uniqueServices = Array.from(
    new Map(allServices.map(s => [s.id, s])).values()
  );

  const totalCustomerDuration =
    uniqueServices.reduce((sum, s) => sum + (s.durationMin || 0), 0);

  const totalStylistDuration =
    uniqueServices
      .filter(s => STYLIST_CATEGORIES.includes(s.categoryId))
      .reduce((sum, s) => sum + (s.durationMin || 0), 0);

  return {
    totalCustomerDuration,
    totalStylistDuration,
  };
}