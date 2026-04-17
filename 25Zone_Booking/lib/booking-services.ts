import { apiUrl, toAbsoluteImageUrl } from "./api";

type RawBookingService = {
  Id_services?: number | string | null;
  Name?: string | null;
  Price?: number | string | null;
  Description?: string | null;
  Duration_time?: number | string | null;
  Sale_Price?: number | string | null;
  Status?: number | string | null;
  Id_category?: number | string | null;
  category_name?: string | null;
  Image_URL?: string | null;
};

export type BookingService = {
  id: number;
  title: string;
  subtitle: string;
  desc: string;
  duration: string;
  durationMin: number;
  badge: string;
  badgeTone: string;
  priceValue: number;
  originalPriceValue: number;
  salePriceValue: number;
  categoryId: number;
  categoryName: string;
  image: string | null;
  isActive: boolean;
};

export type BookingServiceAvailability = {
  id: number;
  exists: boolean;
  isActive: boolean;
};

const BADGE_TONES = [
  "bg-blue-600/10 text-blue-700",
  "bg-emerald-500/10 text-emerald-700",
  "bg-amber-500/10 text-amber-700",
  "bg-sky-500/10 text-sky-700",
  "bg-rose-500/10 text-rose-700",
  "bg-violet-500/10 text-violet-700",
  "bg-slate-900/10 text-slate-700",
] as const;

const cleanText = (value?: string | null) => String(value || "").trim();

const toNumber = (value?: number | string | null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getBadgeTone = (categoryId: number) => {
  if (categoryId <= 0) {
    return BADGE_TONES[0];
  }

  return BADGE_TONES[(categoryId - 1) % BADGE_TONES.length];
};

export const mapRawServiceToBookingService = (
  service: RawBookingService,
): BookingService => {
  const id = toNumber(service.Id_services);
  const originalPriceValue = toNumber(service.Price);
  const salePriceValue = toNumber(service.Sale_Price);
  const durationMin = toNumber(service.Duration_time);
  const categoryId = toNumber(service.Id_category);
  const categoryName = cleanText(service.category_name) || "Dịch vụ";
  const isActive = toNumber(service.Status || 1) === 1;
  const effectivePrice =
    salePriceValue > 0 && salePriceValue < originalPriceValue
      ? salePriceValue
      : originalPriceValue;

  return {
    id,
    title: cleanText(service.Name) || `Dịch vụ #${id || "--"}`,
    subtitle: categoryName,
    desc:
      cleanText(service.Description) ||
      "Dịch vụ đang được phục vụ tại salon 25ZONE.",
    duration: durationMin > 0 ? `${durationMin} phút` : "Chưa cập nhật",
    durationMin,
    badge: categoryName,
    badgeTone: getBadgeTone(categoryId),
    priceValue: effectivePrice,
    originalPriceValue,
    salePriceValue,
    categoryId,
    categoryName,
    image: toAbsoluteImageUrl(service.Image_URL),
    isActive,
  };
};

const readJson = async <T>(response: Response, fallback: T) =>
  response.json().catch(() => fallback) as Promise<T>;

export const fetchBookingServices = async (): Promise<BookingService[]> => {
  try {
    const response = await fetch(apiUrl("/api/dichvu?paginate=0&status=1"), {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Không thể tải danh sách dịch vụ.");
    }

    const payload = await readJson<RawBookingService[]>(response, []);
    if (!Array.isArray(payload)) {
      return [];
    }

    return payload
      .map(mapRawServiceToBookingService)
      .filter((service) => service.id > 0 && service.isActive);
  } catch (error) {
    console.error("Không thể tải dịch vụ từ database:", error);
    return [];
  }
};

export const fetchBookingServiceById = async (
  serviceId?: number | null,
): Promise<BookingService | null> => {
  if (!serviceId || !Number.isFinite(serviceId)) {
    return null;
  }

  try {
    const response = await fetch(apiUrl(`/api/dichvu/${serviceId}`), {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Không thể tải chi tiết dịch vụ.");
    }

    const payload = await readJson<RawBookingService | null>(response, null);
    if (!payload) {
      return null;
    }

    const service = mapRawServiceToBookingService(payload);
    return service.id > 0 && service.isActive ? service : null;
  } catch (error) {
    console.error(`Không thể tải dịch vụ #${serviceId}:`, error);
    return null;
  }
};

export const fetchBookingServicesByIds = async (
  serviceIds: Array<number | null | undefined>,
): Promise<BookingService[]> => {
  const normalizedIds = Array.from(
    new Set(
      serviceIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  );

  if (normalizedIds.length === 0) {
    return [];
  }

  const items = await Promise.all(
    normalizedIds.map((serviceId) => fetchBookingServiceById(serviceId)),
  );
  const mappedItems = new Map(
    items
      .filter((item): item is BookingService => Boolean(item))
      .map((item) => [item.id, item]),
  );

  return normalizedIds
    .map((serviceId) => mappedItems.get(serviceId) || null)
    .filter((item): item is BookingService => Boolean(item));
};

export const fetchBookingServiceAvailabilityByIds = async (
  serviceIds: Array<number | null | undefined>,
): Promise<BookingServiceAvailability[]> => {
  const normalizedIds = Array.from(
    new Set(
      serviceIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  );

  if (normalizedIds.length === 0) {
    return [];
  }

  return Promise.all(
    normalizedIds.map(async (serviceId) => {
      const response = await fetch(apiUrl(`/api/dichvu/${serviceId}`), {
        method: "GET",
        cache: "no-store",
      });

      if (response.status === 404) {
        return {
          id: serviceId,
          exists: false,
          isActive: false,
        };
      }

      if (!response.ok) {
        throw new Error(`Khong the kiem tra trang thai dich vu #${serviceId}.`);
      }

      const payload = await readJson<RawBookingService | null>(response, null);
      const isActive = Number(payload?.Status || 0) === 1;

      return {
        id: serviceId,
        exists: Boolean(payload),
        isActive,
      };
    }),
  );
};
