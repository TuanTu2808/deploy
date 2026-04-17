import type { BookingService } from "@/lib/booking-services"
import type { BookingComboItem } from "@/lib/booking-combo";
export const MAX_BOOKING_SERVICES = 3;
const STORAGE_KEY = "booking_flow_selection_v1";
export const BOOKING_FLOW_QUERY_KEYS = [
  "phone",
  "salonId",
  "serviceIds",
  "serviceId",
  "comboId",
  "step",
] as const;

export type BookingFlowSelection = {
  phone?: string;
  salonId: number | null;
  serviceIds: number[];
  comboIds: number[];
};

type ComboSelectionResult =
  | {
    selection: BookingFlowSelection;
    status: "added" | "removed" | "invalid" | "duplicate";
  }
  | {
    selection: BookingFlowSelection;
    status: "conflict";
    conflictServiceIds: number[];
    comboId: number;
  };

type BookingFlowAvailabilityInput = {
  activeServiceIds?: Iterable<number | string> | null | undefined;
  activeComboIds?: Iterable<number | string> | null | undefined;
};

type BookingFlowSelectionInput = Partial<{
  phone: string | null | undefined;
  salonId: number | string | null | undefined;
  serviceIds: Iterable<number | string> | null | undefined;
  comboIds: Iterable<number | string> | null | undefined;
}>;

export type BookingFlowMutationStatus =
  | "added"
  | "duplicate"
  | "invalid"
  | "limit"
  | "removed"
  | "replaced"
  | "updated";

type QueryValue = string | string[] | undefined;

const toPositiveInt = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.floor(parsed);
};

export const normalizeServiceIds = (value: Iterable<number | string>) => {
  const uniqueIds = new Set<number>();

  for (const item of value) {
    const normalized = toPositiveInt(item);
    if (!normalized) continue;
    uniqueIds.add(normalized);
  }

  return Array.from(uniqueIds);
};

export const normalizeBookingFlowSelection = (
  value: BookingFlowSelectionInput = {},
): BookingFlowSelection => ({
  phone:   typeof value.phone === "string" && value.phone.trim() !== ""
    ? value.phone.trim()
    : undefined,
  salonId: toPositiveInt(value.salonId) ?? null,
  serviceIds: normalizeServiceIds(value.serviceIds || []),
  comboIds: normalizeServiceIds(value.comboIds || []), // 👈 NEW
});

export const parseServiceIdsParam = (value?: QueryValue) => {
  if (!value) return [];

  const raw = Array.isArray(value) ? value.join(",") : value;
  return normalizeServiceIds(
    String(raw)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
};

export const parseBookingFlowSelection = (
  source:
    | URLSearchParams
    | Record<string, QueryValue>,
): BookingFlowSelection => {
  const readValue = (key: string): QueryValue =>
    source instanceof URLSearchParams ? source.get(key) || undefined : source[key];
  const readSingleValue = (key: string) => {
    const value = readValue(key);
    return Array.isArray(value) ? value[0] : value;
  };

  const serviceIds = parseServiceIdsParam(readValue("serviceIds"));
  const legacyServiceId = toPositiveInt(readSingleValue("serviceId"));
  const comboIds = parseServiceIdsParam(readValue("comboIds"));
  const legacyComboId = toPositiveInt(readSingleValue("comboId"));
  return normalizeBookingFlowSelection({
    phone: readSingleValue("phone"),
    salonId: readSingleValue("salonId"),
    serviceIds:
      serviceIds.length > 0
        ? serviceIds
        : legacyServiceId
          ? [legacyServiceId]
          : [],
    comboIds:
      comboIds.length > 0
        ? comboIds
        : legacyComboId
          ? [legacyComboId]
          : [],
  });
};

export const buildBookingFlowSearchParams = (
  selection: BookingFlowSelection,
  extras?: Record<string, string | number | null | undefined>,
) => {
  const params = new URLSearchParams();
  const normalized = normalizeBookingFlowSelection(selection);

  if (normalized.phone) params.set("phone", normalized.phone);
  if (normalized.salonId) params.set("salonId", String(normalized.salonId));
  if (normalized.serviceIds.length > 0) {
    params.set("serviceIds", normalized.serviceIds.join(","));
  }
  if (normalized.comboIds.length > 0) {
    params.set("comboIds", normalized.comboIds.join(","));
  }

  Object.entries(extras || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });

  return params;
};

export const applyBookingFlowSelectionToSearchParams = (
  currentParams: URLSearchParams,
  selection: Partial<BookingFlowSelection>,
  extras?: Record<string, string | number | null | undefined>,
) => {
  const params = new URLSearchParams(currentParams.toString());
  const normalized = normalizeBookingFlowSelection(selection);

  params.delete("serviceId");

  if (normalized.phone) {
    params.set("phone", normalized.phone);
  } else {
    params.delete("phone");
  }

  if (normalized.salonId) {
    params.set("salonId", String(normalized.salonId));
  } else {
    params.delete("salonId");
  }

  if (normalized.serviceIds.length > 0) {
    params.set("serviceIds", normalized.serviceIds.join(","));
  } else {
    params.delete("serviceIds");
  }

  if (normalized.comboIds.length > 0) {
    params.set("comboIds", normalized.comboIds.join(","));
  } else {
    params.delete("comboIds");
  }

  Object.entries(extras || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      params.delete(key);
      return;
    }

    params.set(key, String(value));
  });

  return params;
};

export const getBookingFlowPath = (step: number) => {
  if (step === 2) return "/chondichvu";
  if (step === 3) return "/chontho";
  if (step === 4) return "/xacnhan";
  return "/chonsalon";
};

export const buildBookingFlowHref = (
  step: number,
  selection: BookingFlowSelection,
  extras?: Record<string, string | number | null | undefined>,
) => {
  const params = buildBookingFlowSearchParams(selection, {
    step,
    ...extras,
  });

  return `${getBookingFlowPath(step)}?${params.toString()}`;
};

export const hasSelectedBookingItems = (selection: Partial<BookingFlowSelection>) => {
  const normalized = normalizeBookingFlowSelection(selection);
  return normalized.serviceIds.length > 0 || normalized.comboIds.length > 0;
};

export const addServiceToBookingSelection = (
  selection: BookingFlowSelection,
  serviceId: number,
) => {
  const normalized = normalizeBookingFlowSelection(selection);
  const nextId = toPositiveInt(serviceId);

  if (!nextId) {
    return { selection: normalized, status: "invalid" as const };
  }

  if (normalized.serviceIds.includes(nextId)) {
    return { selection: normalized, status: "duplicate" as const };
  }

  if (normalized.serviceIds.length >= MAX_BOOKING_SERVICES) {
    return { selection: normalized, status: "limit" as const };
  }

  return {
    selection: {
      ...normalized,
      serviceIds: [...normalized.serviceIds, nextId],
    },
    status: "added" as const,
  };
};

export const toggleServiceInBookingSelection = (
  selection: BookingFlowSelection,
  serviceId: number,
  services: BookingService[],
  combos: BookingComboItem[], // 🔥 thêm
): {
  selection: BookingFlowSelection;
  status: "added" | "removed" | "replaced" | "invalid" | "conflict";
  conflictComboId?: number;
} => {
  if (!serviceId || serviceId <= 0) {
    return { selection, status: "invalid" };
  }

  const exists = selection.serviceIds.includes(serviceId);

  // ❌ Nếu đã có → remove
  if (exists) {
    return {
      selection: {
        ...selection,
        serviceIds: selection.serviceIds.filter((id) => id !== serviceId),
      },
      status: "removed",
    };
  }

  const targetService = services.find((s) => s.id === serviceId);
  if (!targetService) {
    return { selection, status: "invalid" };
  }

  const categoryId = targetService.categoryId;

  // 🎯 các category chỉ chọn 1
  const SINGLE_SELECT_CATEGORY_IDS = [1, 2, 3];

  // =========================
  // 🔥 CHECK CONFLICT VỚI COMBO
  // =========================
  if (SINGLE_SELECT_CATEGORY_IDS.includes(categoryId)) {
    const conflictCombo = selection.comboIds.find((comboId) => {
      const combo = combos.find((c) => c.Id_combo === comboId);
      if (!combo) return false;

      return combo.service_ids.some((id) => {
        const s = services.find((sv) => sv.id === id);
        return s?.categoryId === categoryId;
      });
    });

    if (conflictCombo) {
      return {
        selection,
        status: "conflict",
        conflictComboId: conflictCombo,
      };
    }
  }

  // =========================
  // 🔥 HANDLE SERVICE (CÙNG CATEGORY)
  // =========================
  if (SINGLE_SELECT_CATEGORY_IDS.includes(categoryId)) {
    const filteredIds = selection.serviceIds.filter((id) => {
      const s = services.find((sv) => sv.id === id);
      return s?.categoryId !== categoryId;
    });

    return {
      selection: {
        ...selection,
        serviceIds: [...filteredIds, serviceId],
      },
      status: filteredIds.length !== selection.serviceIds.length
        ? "replaced"
        : "added",
    };
  }

  // ✅ category bình thường
  return {
    selection: {
      ...selection,
      serviceIds: [...selection.serviceIds, serviceId],
    },
    status: "added",
  };
};

export const setSalonInBookingSelection = (
  selection: BookingFlowSelection,
  salonId: number | null,
) => ({
  ...normalizeBookingFlowSelection(selection),
  salonId: toPositiveInt(salonId) ?? null,
});

export const selectSalonInBookingSelection = (
  selection: BookingFlowSelection,
  salonId: number | null,
) => {
  const normalized = normalizeBookingFlowSelection(selection);
  const nextSalonId = toPositiveInt(salonId);

  if (!nextSalonId) {
    return { selection: normalized, status: "invalid" as const };
  }

  if (normalized.salonId === nextSalonId) {
    return { selection: normalized, status: "duplicate" as const };
  }

  return {
    selection: {
      ...normalized,
      salonId: nextSalonId,
    },
    status: normalized.salonId ? ("updated" as const) : ("added" as const),
  };
};

export const setComboInBookingSelection = (
  selection: BookingFlowSelection,
  comboIds: number[],
) => ({
  ...normalizeBookingFlowSelection(selection),
  comboIds: normalizeServiceIds(comboIds),
});

export const selectComboInBookingSelection = (
  selection: BookingFlowSelection,
  comboId: number,
  combos: BookingComboItem[],
): {
  selection: BookingFlowSelection;
  status: "added" | "removed" | "invalid" | "duplicate" | "conflict";
  conflictServiceIds?: number[];
  comboId?: number;
} => {
  const normalized = normalizeBookingFlowSelection(selection);
  const id = toPositiveInt(comboId);

  if (!id) {
    return { selection: normalized, status: "invalid" };
  }

  // ❌ đã chọn → remove
  if (normalized.comboIds.includes(id)) {
    return {
      selection: {
        ...normalized,
        comboIds: normalized.comboIds.filter((c) => c !== id),
      },
      status: "removed",
    };
  }

  const newCombo = combos.find((c) => c.Id_combo === id);
  if (!newCombo) {
    return { selection: normalized, status: "invalid" };
  }

  const selectedCombos = combos.filter((c) =>
    normalized.comboIds.includes(c.Id_combo)
  );

  // =========================
  // 🚨 COMBO vs COMBO
  // =========================
  for (const existing of selectedCombos) {
    const overlap = existing.service_ids.filter((sid) =>
      newCombo.service_ids.includes(sid)
    );

    if (overlap.length > 0) {
      return {
        selection: normalized,
        status: "conflict",
        conflictServiceIds: overlap,
        comboId: id,
      };
    }
  }

  // =========================
  // 🚨 COMBO vs SERVICE
  // =========================
  const serviceConflicts = newCombo.service_ids.filter((sid) =>
    normalized.serviceIds.includes(sid)
  );

  if (serviceConflicts.length > 0) {
    return {
      selection: normalized,
      status: "conflict",
      conflictServiceIds: serviceConflicts,
      comboId: id,
    };
  }

  // =========================
  // ✅ ADD MULTI COMBO OK
  // =========================
  return {
    selection: {
      ...normalized,
      comboIds: [...normalized.comboIds, id], // ✅ KHÔNG replace
    },
    status: "added",
  };
};
export const pruneInactiveBookingFlowSelection = (
  selection: BookingFlowSelection,
  availability: BookingFlowAvailabilityInput = {},
) => {
  const normalized = normalizeBookingFlowSelection(selection);
  const shouldValidateServices = availability.activeServiceIds !== undefined;
  const shouldValidateCombo = availability.activeComboIds !== undefined;
  const activeServiceSet = shouldValidateServices
    ? new Set(normalizeServiceIds(availability.activeServiceIds || []))
    : null;

  const removedServiceIds = shouldValidateServices
    ? normalized.serviceIds.filter((serviceId) => !activeServiceSet?.has(serviceId))
    : [];
  const activeComboSet = shouldValidateCombo
    ? new Set(normalizeServiceIds(availability.activeComboIds || []))
    : null;

  const removedComboIds = shouldValidateCombo
    ? normalized.comboIds.filter((id) => !activeComboSet?.has(id))
    : [];

  const nextSelection = normalizeBookingFlowSelection({
    ...normalized,
    serviceIds: shouldValidateServices
      ? normalized.serviceIds.filter((id) => activeServiceSet?.has(id))
      : normalized.serviceIds,
    comboIds: shouldValidateCombo
      ? normalized.comboIds.filter((id) => activeComboSet?.has(id))
      : normalized.comboIds,
  });
  return {
    selection: nextSelection,
    removedServiceIds,
    removedComboIds,
    hasChanges:
      removedServiceIds.length > 0 || removedComboIds.length > 0,
  };
};

const readStoredSelection = (storage: Storage | null) => {
  if (!storage) return null;

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeBookingFlowSelection(JSON.parse(raw) as Partial<BookingFlowSelection>);
  } catch {
    return null;
  }
};

export const readStoredBookingFlowSelection = () => {
  if (typeof window === "undefined") {
    return normalizeBookingFlowSelection();
  }

  try {
    // Cleanup legacy persisted state so booking flow no longer survives closing the tab.
    window.localStorage.removeItem(STORAGE_KEY);
  } catch { }

  return readStoredSelection(window.sessionStorage) || normalizeBookingFlowSelection();
};

export const writeStoredBookingFlowSelection = (
  selection: Partial<BookingFlowSelection>,
) => {
  if (typeof window === "undefined") return;

  const normalized = normalizeBookingFlowSelection(selection);
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  window.localStorage.removeItem(STORAGE_KEY);
};

export const clearStoredBookingFlowSelection = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(STORAGE_KEY);
};

export const resolveClientBookingFlowSelection = (
  initial: Partial<BookingFlowSelection> = {},
) => {
  const normalizedInitial = normalizeBookingFlowSelection(initial);
  const stored = readStoredBookingFlowSelection();

  return normalizeBookingFlowSelection({
    phone: stored.phone || normalizedInitial.phone,
    salonId: stored.salonId ?? normalizedInitial.salonId,
    comboIds:
      stored.comboIds !== undefined
        ? stored.comboIds
        : normalizedInitial.comboIds,
    serviceIds:
      stored.serviceIds.length > 0
        ? stored.serviceIds
        : normalizedInitial.serviceIds,
  });
};
