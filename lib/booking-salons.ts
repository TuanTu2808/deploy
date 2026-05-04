import { SALONS as FALLBACK_SALONS } from "@/app/components/booking_flow/bookingData";
import { apiUrl, toAbsoluteImageUrl } from "./api";

export type BookingSalon = {
  id: number;
  name: string;
  address: string;
  status: string;
  statusTone: string;
  hours: string;
  phone: string;
  distance: string;
  image: string;
  province: string;
  ward: string;
  email: string | null;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  distanceValue?: number; // calculated distance in km
};

type RawStore = {
  Id_store?: number | string | null;
  Name_store?: string | null;
  Image?: string | null;
  Address?: string | null;
  Province?: string | null;
  Ward?: string | null;
  Email?: string | null;
  Phone?: string | null;
  Opening_time?: string | null;
  Closing_time?: string | null;
  Status?: number | string | null;
};

const FALLBACK_SALON_IMAGE = "/salon.png";
const SHOULD_USE_FALLBACK = process.env.NODE_ENV !== "production";

const cleanText = (value?: string | null) => String(value || "").trim();

const formatTime = (value?: string | null) => {
  const raw = cleanText(value);
  if (!raw) return "";

  const [hour = "", minute = ""] = raw.split(":");
  if (!hour || !minute) return raw;
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
};

const formatHours = (openingTime?: string | null, closingTime?: string | null) => {
  const opening = formatTime(openingTime);
  const closing = formatTime(closingTime);

  if (opening && closing) {
    return `${opening} - ${closing}`;
  }

  return opening || closing || "Chưa cập nhật";
};

const formatAddress = (
  address?: string | null,
  ward?: string | null,
  province?: string | null,
) => {
  const parts = [cleanText(address), cleanText(ward), cleanText(province)].filter(Boolean);
  return parts.join(", ") || "Chưa cập nhật";
};

const formatLocationLabel = (ward?: string | null, province?: string | null) =>
  cleanText(ward) || cleanText(province) || "25ZONE";

const normalizeFallbackSalon = (salon: (typeof FALLBACK_SALONS)[number]): BookingSalon => ({
  ...salon,
  image: cleanText(salon.image) || FALLBACK_SALON_IMAGE,
  province: "",
  ward: "",
  email: null,
  isActive: true,
});

export const fallbackBookingSalons: BookingSalon[] =
  FALLBACK_SALONS.map(normalizeFallbackSalon);

// Mock coordinates for different provinces
const getMockCoordinates = (province: string, id: number) => {
  const p = province.toLowerCase();
  
  let baseLat = 10.762622; // Default HCMC
  let baseLng = 106.660172;
  
  if (p.includes("hà nội") || p.includes("ha noi")) {
    baseLat = 21.028511;
    baseLng = 105.804817;
  } else if (p.includes("đà nẵng") || p.includes("da nang")) {
    baseLat = 16.054407;
    baseLng = 108.202167;
  } else if (p.includes("cần thơ") || p.includes("can tho")) {
    baseLat = 10.045162;
    baseLng = 105.746854;
  } else if (p.includes("hải phòng") || p.includes("hai phong")) {
    baseLat = 20.844912;
    baseLng = 106.688084;
  } else if (p.includes("đắk lắk") || p.includes("dak lak")) {
    baseLat = 12.6761;
    baseLng = 108.0383; // Buôn Ma Thuột
  } else if (p.includes("đồng nai") || p.includes("dong nai")) {
    baseLat = 10.9458;
    baseLng = 106.8242; // Biên Hòa
  } else if (p.includes("bình dương") || p.includes("binh duong")) {
    baseLat = 10.9804;
    baseLng = 106.6519; // Thủ Dầu Một
  }

  // Add a small pseudo-random offset based on ID so they don't all stack up
  return {
    latitude: baseLat + (id % 10) * 0.01 - 0.05,
    longitude: baseLng + (id % 10) * 0.01 - 0.05,
  };
};

export const mapRawStoreToBookingSalon = (store: RawStore): BookingSalon => {
  const id = Number(store.Id_store || 0);
  const isActive = Number(store.Status ?? 1) === 1;
  const province = cleanText(store.Province);
  const ward = cleanText(store.Ward);
  const coords = getMockCoordinates(province, id);

  return {
    id,
    name: cleanText(store.Name_store) || `25ZONE #${id || "--"}`,
    address: formatAddress(store.Address, ward, province),
    status: isActive ? "Mở cửa" : "Tạm ngưng",
    statusTone: isActive
      ? "bg-emerald-500/10 text-emerald-700"
      : "bg-slate-500/10 text-slate-700",
    hours: formatHours(store.Opening_time, store.Closing_time),
    phone: cleanText(store.Phone) || "Chưa cập nhật",
    distance: formatLocationLabel(ward, province),
    image: toAbsoluteImageUrl(store.Image) || FALLBACK_SALON_IMAGE,
    province,
    ward,
    email: cleanText(store.Email) || null,
    isActive,
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
};

const readJson = async <T>(response: Response, fallback: T) =>
  response.json().catch(() => fallback) as Promise<T>;

export const fetchBookingSalons = async (): Promise<BookingSalon[]> => {
  try {
    const response = await fetch(apiUrl("/api/chinhanh?status=1"), {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Không thể tải danh sách salon.");
    }

    const payload = await readJson<RawStore[]>(response, []);
    if (!Array.isArray(payload)) {
      return SHOULD_USE_FALLBACK ? fallbackBookingSalons : [];
    }

    const salons = payload
      .map(mapRawStoreToBookingSalon)
      .filter((salon) => salon.id > 0);

    if (salons.length) {
      return salons;
    }

    return SHOULD_USE_FALLBACK ? fallbackBookingSalons : [];
  } catch (error) {
    console.error("Không thể tải salon từ database:", error);
    return SHOULD_USE_FALLBACK ? fallbackBookingSalons : [];
  }
};

export const fetchBookingSalonById = async (
  salonId?: number | null,
): Promise<BookingSalon | null> => {
  if (!salonId || !Number.isFinite(salonId)) {
    return null;
  }

  try {
    const response = await fetch(apiUrl(`/api/chinhanh/${salonId}`), {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Không thể tải chi tiết salon.");
    }

    const payload = await readJson<RawStore | null>(response, null);
    if (!payload) {
      return SHOULD_USE_FALLBACK
        ? fallbackBookingSalons.find((salon) => salon.id === salonId) || null
        : null;
    }

    const salon = mapRawStoreToBookingSalon(payload);
    return salon.id > 0
      ? salon
      : SHOULD_USE_FALLBACK
        ? fallbackBookingSalons.find((item) => item.id === salonId) || null
        : null;
  } catch (error) {
    console.error(`Không thể tải salon #${salonId}:`, error);
    return SHOULD_USE_FALLBACK
      ? fallbackBookingSalons.find((salon) => salon.id === salonId) || null
      : null;
  }
};
