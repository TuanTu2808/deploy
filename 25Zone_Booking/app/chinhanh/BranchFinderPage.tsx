"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiUrl, toAbsoluteImageUrl } from "@/lib/api";
import {
  buildBookingFlowHref,
  readStoredBookingFlowSelection,
  selectSalonInBookingSelection,
  writeStoredBookingFlowSelection,
} from "@/lib/booking-flow-selection";

type BranchFinderPageProps = {
  initialQuery: string;
  initialCity: string;
  initialWard: string;
  initialSort: string;
  initialPage: number;
};

type BranchRecord = {
  Id_store: number;
  Name_store: string;
  Image: string | null;
  Address: string;
  Province: string;
  Ward: string;
  Email: string | null;
  Phone: string | null;
  Opening_time: string | null;
  Closing_time: string | null;
  Status: number;
};

type BranchCard = BranchRecord & {
  imageUrl: string;
  cityParam: string;
  searchableText: string;
};

type WardSummary = {
  ward: string;
  total: number;
};

type ProvinceSummary = {
  province: string;
  cityParam: string;
  total: number;
  wards: WardSummary[];
};

type LocationLookupState = {
  type: "idle" | "loading" | "success" | "error";
  message: string;
};

type ReverseGeocodeResponse = {
  address?: Record<string, string | undefined>;
};

const FALLBACK_STORE_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDUXiSNzlwAo9d1_w2JR8Xo-BIXfKruaI-z73tX96mAK26RIL2hHANl1k49rXSn0Hk1mQ2MOHCtMPLu9M-yY1j_ko7uk3fv66MLpf5jrCnfbKighzt3I1U2St4MxP5pbPG-OwxWQcT4GC_07qqn8lXDVbmjNB4DS1JkOqF88gKjAw5xo2r49_sFP6X4gm8cEixYR5lSGRXWIXrw0PVIbwtSbT_wIc2giQ3h4PFzu8n_J7ZRz0sQwxHXUpkCUIHvs3BzyoeHLnX81ZA";

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "name_asc", label: "Tên A - Z" },
  { value: "name_desc", label: "Tên Z - A" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];
type PaginationItem = number | "...";

const PAGE_SIZE = 9;

const normalizeText = (value: string | null | undefined) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const toCityParam = (value: string) => normalizeText(value).replace(/\s+/g, "-");

const normalizeSort = (value: string): SortOption => {
  if (SORT_OPTIONS.some((option) => option.value === value)) {
    return value as SortOption;
  }
  return "newest";
};

const normalizePage = (value: number) =>
  Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;

const buildPaginationItems = (
  totalPages: number,
  currentPage: number
): PaginationItem[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: PaginationItem[] = [1];
  let start = Math.max(2, currentPage - 1);
  let end = Math.min(totalPages - 1, currentPage + 1);

  if (currentPage <= 3) {
    start = 2;
    end = 4;
  }

  if (currentPage >= totalPages - 2) {
    start = totalPages - 3;
    end = totalPages - 1;
  }

  if (start > 2) {
    items.push("...");
  }

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (end < totalPages - 1) {
    items.push("...");
  }

  items.push(totalPages);
  return items;
};

const stripProvincePrefix = (value: string) =>
  normalizeText(value).replace(/^(thanh pho|tp|tinh)\s+/, "").trim();

const stripWardPrefix = (value: string) =>
  normalizeText(value)
    .replace(/^(quan|q|huyen|h|phuong|p|xa|thi tran|thi xa)\s+/, "")
    .trim();

const isAreaMatched = (left: string, right: string) =>
  left === right || left.includes(right) || right.includes(left);

const getGeoErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error && "code" in error) {
    const code = Number((error as { code?: number }).code);
    if (code === 1) return "Bạn đã từ chối quyền truy cập vị trí.";
    if (code === 2) return "Không lấy được vị trí hiện tại.";
    if (code === 3) return "Hết thời gian định vị. Vui lòng thử lại.";
  }

  return "Không thể lấy vị trí hiện tại của bạn.";
};

const formatTime = (value: string | null | undefined) => {
  if (!value) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (raw.includes(":")) {
    const [hours = "", minutes = ""] = raw.split(":");
    if (hours.length === 0 || minutes.length === 0) return raw;
    return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
  }
  return raw;
};

const formatSchedule = (opening: string | null, closing: string | null) => {
  const from = formatTime(opening);
  const to = formatTime(closing);
  if (!from || !to) return "Đang cập nhật";
  return `${from} - ${to}`;
};

const formatAddress = (branch: BranchRecord) =>
  [branch.Address, branch.Ward, branch.Province]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join(", ");

const isOpenBranch = (status: number) => Number(status) === 1;

const compareByVietnameseText = (a: string, b: string) =>
  a.localeCompare(b, "vi", { sensitivity: "base" });

export default function BranchFinderPage({
  initialQuery,
  initialCity,
  initialWard,
  initialSort,
  initialPage,
}: BranchFinderPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const didMountRef = useRef(false);
  const branchListAnchorRef = useRef<HTMLDivElement | null>(null);

  const [branches, setBranches] = useState<BranchCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity);
  const [ward, setWard] = useState(initialWard);
  const [sort, setSort] = useState<SortOption>(normalizeSort(initialSort));
  const [page, setPage] = useState<number>(normalizePage(initialPage));
  const [locationLookup, setLocationLookup] = useState<LocationLookupState>({
    type: "idle",
    message: "",
  });

  useEffect(() => {
    let isMounted = true;

    const loadBranches = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const response = await fetch(apiUrl("/api/chinhanh"), {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Không thể tải dữ liệu salon.");
        }

        const payload = (await response.json().catch(() => [])) as BranchRecord[];
        if (!isMounted) return;

        const normalized = (Array.isArray(payload) ? payload : []).map((item) => {
          const province = String(item.Province || "").trim();
          const wardValue = String(item.Ward || "").trim();
          const searchableText = normalizeText(
            [
              item.Name_store,
              item.Address,
              province,
              wardValue,
              item.Phone || "",
              item.Email || "",
            ].join(" ")
          );

          return {
            ...item,
            Status: Number(item.Status || 0),
            cityParam: toCityParam(province),
            imageUrl: toAbsoluteImageUrl(item.Image) || FALLBACK_STORE_IMAGE,
            searchableText,
          };
        });

        setBranches(normalized);
      } catch (error) {
        if (!isMounted) return;
        setBranches([]);
        setLoadError(
          error instanceof Error ? error.message : "Không thể tải dữ liệu salon."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadBranches();

    return () => {
      isMounted = false;
    };
  }, []);

  const provinceSummaries = useMemo<ProvinceSummary[]>(() => {
    const provinceMap = new Map<
      string,
      {
        province: string;
        cityParam: string;
        total: number;
        wardMap: Map<string, WardSummary>;
      }
    >();

    for (const branch of branches) {
      const provinceName = String(branch.Province || "").trim();
      if (!provinceName) continue;

      const cityParam = branch.cityParam;
      if (!provinceMap.has(cityParam)) {
        provinceMap.set(cityParam, {
          province: provinceName,
          cityParam,
          total: 0,
          wardMap: new Map<string, WardSummary>(),
        });
      }

      const province = provinceMap.get(cityParam);
      if (!province) continue;
      province.total += 1;

      const wardName = String(branch.Ward || "").trim();
      if (!wardName) continue;

      const wardKey = normalizeText(wardName);
      if (!province.wardMap.has(wardKey)) {
        province.wardMap.set(wardKey, {
          ward: wardName,
          total: 0,
        });
      }

      const currentWard = province.wardMap.get(wardKey);
      if (currentWard) {
        currentWard.total += 1;
      }
    }

    return Array.from(provinceMap.values())
      .map((item) => ({
        province: item.province,
        cityParam: item.cityParam,
        total: item.total,
        wards: Array.from(item.wardMap.values()).sort((a, b) => {
          if (b.total !== a.total) return b.total - a.total;
          return compareByVietnameseText(a.ward, b.ward);
        }),
      }))
      .sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total;
        return compareByVietnameseText(a.province, b.province);
      });
  }, [branches]);

  const provinceMapByCity = useMemo(() => {
    return new Map(provinceSummaries.map((item) => [item.cityParam, item]));
  }, [provinceSummaries]);

  const selectedProvince = city ? provinceMapByCity.get(city) : undefined;

  useEffect(() => {
    if (!city) return;

    if (!selectedProvince) {
      setCity("");
      setWard("");
      return;
    }

    if (!ward) return;

    const hasWard = selectedProvince.wards.some(
      (item) => normalizeText(item.ward) === normalizeText(ward)
    );

    if (!hasWard) {
      setWard("");
    }
  }, [city, ward, selectedProvince]);

  const wardOptions = useMemo<WardSummary[]>(() => {
    if (selectedProvince) return selectedProvince.wards;

    const wardMap = new Map<string, WardSummary>();
    for (const branch of branches) {
      const wardName = String(branch.Ward || "").trim();
      if (!wardName) continue;

      const key = normalizeText(wardName);
      if (!wardMap.has(key)) {
        wardMap.set(key, { ward: wardName, total: 0 });
      }

      const current = wardMap.get(key);
      if (current) {
        current.total += 1;
      }
    }

    return Array.from(wardMap.values()).sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return compareByVietnameseText(a.ward, b.ward);
    });
  }, [branches, selectedProvince]);

  const filteredBranches = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    const normalizedWard = normalizeText(ward);

    let result = branches.filter((item) => {
      if (city && item.cityParam !== city) {
        return false;
      }

      if (normalizedWard && normalizeText(item.Ward) !== normalizedWard) {
        return false;
      }

      if (normalizedQuery && !item.searchableText.includes(normalizedQuery)) {
        return false;
      }

      return true;
    });

    if (sort === "name_asc") {
      result = result.sort((a, b) =>
        compareByVietnameseText(a.Name_store, b.Name_store)
      );
    } else if (sort === "name_desc") {
      result = result.sort((a, b) =>
        compareByVietnameseText(b.Name_store, a.Name_store)
      );
    } else {
      result = result.sort((a, b) => Number(b.Id_store) - Number(a.Id_store));
    }

    return result;
  }, [branches, city, ward, query, sort]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredBranches.length / PAGE_SIZE)),
    [filteredBranches.length]
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
      return;
    }

    if (page < 1) {
      setPage(1);
    }
  }, [page, totalPages]);

  const currentPage = Math.min(Math.max(1, page), totalPages);

  const pagedBranches = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredBranches.slice(start, start + PAGE_SIZE);
  }, [filteredBranches, currentPage]);

  const paginationItems = useMemo(
    () => buildPaginationItems(totalPages, currentPage),
    [totalPages, currentPage]
  );

  const activeAreaLabel = useMemo(() => {
    if (ward) return ward;
    if (selectedProvince) return selectedProvince.province;
    return "Toàn quốc";
  }, [selectedProvince, ward]);

  const openCount = useMemo(
    () => filteredBranches.filter((item) => isOpenBranch(item.Status)).length,
    [filteredBranches]
  );

  const hasFilter = Boolean(query || city || ward || sort !== "newest");

  useEffect(() => {
    if (!pathname) return;

    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (city) params.set("city", city);
    if (ward.trim()) params.set("ward", ward.trim());
    if (sort !== "newest") params.set("sort", sort);
    if (currentPage > 1) params.set("page", String(currentPage));

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [query, city, ward, sort, currentPage, pathname, router]);

  const handleSelectCity = (nextCity: string) => {
    setCity(nextCity);
    setWard("");
    setPage(1);
  };

  const handleSelectWard = (nextWard: string) => {
    setWard(nextWard);
    setPage(1);
  };

  const scrollToBranchList = () => {
    branchListAnchorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleChangePage = (nextPage: number) => {
    const normalized = Math.min(totalPages, Math.max(1, nextPage));
    if (normalized === currentPage) return;
    setPage(normalized);
    scrollToBranchList();
  };

  const handleResetFilters = () => {
    setQuery("");
    setCity("");
    setWard("");
    setSort("newest");
    setPage(1);
    setLocationLookup({ type: "idle", message: "" });
  };

  const handleStartBookingAtSalon = (salonId: number) => {
    const currentSelection = readStoredBookingFlowSelection();
    const result = selectSalonInBookingSelection(currentSelection, salonId);
    const nextSelection = result.selection;

    writeStoredBookingFlowSelection(nextSelection);
    router.push(
      buildBookingFlowHref(1, nextSelection, {
        notice:
          result.status === "duplicate"
            ? "salon_duplicate"
            : result.status === "updated"
              ? "salon_updated"
              : result.status === "added"
                ? "salon_selected"
                : undefined,
      }),
    );
  };

  const handleFindByCurrentLocation = async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationLookup({
        type: "error",
        message: "Trình duyệt hiện tại không hỗ trợ định vị.",
      });
      return;
    }

    if (provinceSummaries.length === 0) {
      setLocationLookup({
        type: "error",
        message: "Chưa có dữ liệu khu vực salon để đối chiếu.",
      });
      return;
    }

    setLocationLookup({
      type: "loading",
      message: "Đang xác định vị trí của bạn...",
    });

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 60000,
        });
      });

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      const reverseResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=vi`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!reverseResponse.ok) {
        throw new Error("Không thể phân tích vị trí hiện tại.");
      }

      const reversePayload = (await reverseResponse.json().catch(() => ({}))) as ReverseGeocodeResponse;
      const address = reversePayload.address || {};

      const provinceCandidates = Array.from(
        new Set(
          [
            address.state,
            address.province,
            address.city,
            address.state_district,
            address.region,
          ]
            .map((item) => stripProvincePrefix(String(item || "")))
            .filter(Boolean)
        )
      );

      const wardCandidates = Array.from(
        new Set(
          [
            address.city_district,
            address.county,
            address.district,
            address.suburb,
            address.borough,
            address.quarter,
            address.municipality,
            address.town,
            address.village,
          ]
            .map((item) => stripWardPrefix(String(item || "")))
            .filter(Boolean)
        )
      );

      const matchedProvince = provinceSummaries.find((item) => {
        const provinceKey = stripProvincePrefix(item.province);
        return provinceCandidates.some((candidate) =>
          isAreaMatched(candidate, provinceKey)
        );
      });

      if (!matchedProvince) {
        setLocationLookup({
          type: "error",
          message:
            "Vị trí hiện tại của bạn chưa có salon trong hệ thống dữ liệu.",
        });
        return;
      }

      const matchedWard = matchedProvince.wards.find((item) => {
        const wardKey = stripWardPrefix(item.ward);
        return wardCandidates.some((candidate) => isAreaMatched(candidate, wardKey));
      });

      setCity(matchedProvince.cityParam);
      setWard(matchedWard?.ward || "");
      setQuery("");
      setPage(1);

      setLocationLookup({
        type: "success",
        message: matchedWard
          ? `Đã lọc theo vị trí gần bạn: ${matchedWard.ward}, ${matchedProvince.province}.`
          : `Đã lọc theo vị trí gần bạn: ${matchedProvince.province}.`,
      });
    } catch (error) {
      setLocationLookup({
        type: "error",
        message: getGeoErrorMessage(error),
      });
    }
  };

  return (
    <main className="w-full">
      <section className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-12 pt-8 pb-6 sm:pt-10 sm:pb-8 lg:pt-12 lg:pb-10">
          <h1 className="text-navy text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-tight mb-5 sm:mb-7">
            Hệ thống salon toàn quốc
          </h1>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6 items-end">
              <div className="md:col-span-2 lg:col-span-5">
                <label className="block text-[11px] sm:text-sm font-semibold text-slate-600 mb-1.5 sm:mb-2 uppercase tracking-[0.18em]">
                  Tìm kiếm nhanh
                </label>
                <div className="flex items-center w-full h-12 sm:h-14 rounded-xl overflow-hidden bg-navy/95 shadow-[0_12px_30px_rgba(0,51,102,0.18)] ring-1 ring-navy/40 focus-within:ring-2 focus-within:ring-accent-blue/80 transition-all pr-1">
                  <div className="flex items-center justify-center pl-4 pr-2 text-accent-blue">
                    <span className="material-symbols-outlined text-[24px] sm:text-[28px]">
                      search
                    </span>
                  </div>
                  <input
                    className="w-full h-full bg-transparent border-none text-white placeholder-slate-200 focus:ring-0 text-sm sm:text-base font-semibold tracking-[0.02em]"
                    placeholder="Nhập tên salon, đường, quận, huyện..."
                    type="text"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setPage(1);
                    }}
                  />
                  <button
                    type="button"
                    className="flex items-center justify-center text-accent-blue hover:text-white hover:bg-white/10 h-9 w-9 sm:h-10 sm:w-10 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    title="Tìm salon theo vị trí hiện tại"
                    aria-label="Tìm salon theo vị trí hiện tại"
                    onClick={handleFindByCurrentLocation}
                    disabled={locationLookup.type === "loading" || isLoading}
                  >
                    <span className="material-symbols-outlined text-[22px] sm:text-[24px]">
                      {locationLookup.type === "loading" ? "sync" : "my_location"}
                    </span>
                  </button>
                </div>
                {locationLookup.message ? (
                  <p
                    className={`mt-2 text-xs sm:text-sm font-semibold ${
                      locationLookup.type === "error"
                        ? "text-red-600"
                        : locationLookup.type === "success"
                        ? "text-emerald-600"
                        : "text-slate-500"
                    }`}
                    role="status"
                    aria-live="polite"
                  >
                    {locationLookup.message}
                  </p>
                ) : null}
              </div>

              <div className="md:col-span-1 lg:col-span-3">
                <label className="block text-[11px] sm:text-sm font-semibold text-slate-600 mb-1.5 sm:mb-2 uppercase tracking-[0.18em]">
                  Tỉnh/Thành phố
                </label>
                <div className="relative">
                  <select
                    className="w-full h-12 sm:h-14 pl-3 sm:pl-4 pr-9 sm:pr-10 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm sm:text-base font-semibold focus:border-accent-blue focus:ring-accent-blue appearance-none cursor-pointer shadow-sm"
                    value={city}
                    onChange={(event) => handleSelectCity(event.target.value)}
                  >
                    <option value="">Tất cả tỉnh/thành phố</option>
                    {provinceSummaries.map((item) => (
                      <option key={item.cityParam} value={item.cityParam}>
                        {item.province} ({item.total})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                    <span className="material-symbols-outlined text-[20px]">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-1 lg:col-span-2">
                <label className="block text-[11px] sm:text-sm font-semibold text-slate-600 mb-1.5 sm:mb-2 uppercase tracking-[0.18em]">
                  Quận/Huyện
                </label>
                <div className="relative">
                  <select
                    className="w-full h-12 sm:h-14 pl-3 sm:pl-4 pr-9 sm:pr-10 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm sm:text-base font-semibold focus:border-accent-blue focus:ring-accent-blue appearance-none cursor-pointer shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
                    value={ward}
                    onChange={(event) => handleSelectWard(event.target.value)}
                    disabled={wardOptions.length === 0}
                  >
                    <option value="">
                      {selectedProvince
                        ? "Tất cả quận/huyện"
                        : "Chọn tỉnh/thành để lọc"}
                    </option>
                    {wardOptions.map((item) => (
                      <option key={`${item.ward}-${item.total}`} value={item.ward}>
                        {item.ward} ({item.total})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                    <span className="material-symbols-outlined text-[20px]">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 lg:col-span-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full h-12 sm:h-14 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm sm:text-base font-extrabold uppercase tracking-wide hover:border-accent-blue hover:text-accent-blue transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={!hasFilter}
                >
                  Xóa lọc
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background-alt">
        <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-12 pt-2 pb-8 sm:py-10 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            <aside className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden h-auto lg:h-[700px] flex flex-col">
                <div className="p-4 sm:p-5 border-b border-gray-100 bg-white">
                  <h3 className="text-sm sm:text-base font-extrabold text-navy flex items-center gap-2">
                    <span className="material-symbols-outlined text-accent-blue">
                      list_alt
                    </span>
                    Danh sách khu vực
                  </h3>
                </div>

                <div
                  className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 overscroll-contain"
                  data-lenis-prevent
                  data-lenis-prevent-wheel
                >
                  <button
                    type="button"
                    onClick={() => handleSelectCity("")}
                    className={`w-full text-left rounded-lg px-3 py-3 text-sm font-bold transition-colors ${
                      city
                        ? "text-slate-700 hover:bg-slate-50"
                        : "text-accent-blue bg-[#F0F9FF] border border-accent-blue/30"
                    }`}
                  >
                    Toàn quốc ({branches.length})
                  </button>

                  {provinceSummaries.map((item) => {
                    const isActiveProvince = city === item.cityParam;
                    return (
                      <div key={item.cityParam} className="rounded-lg border border-transparent">
                        <button
                          type="button"
                          onClick={() => handleSelectCity(item.cityParam)}
                          className={`w-full text-left px-3 py-3 rounded-lg text-sm font-extrabold transition-colors flex items-center justify-between ${
                            isActiveProvince
                              ? "text-accent-blue bg-[#F0F9FF] border border-accent-blue/30"
                              : "text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          <span>
                            {item.province} ({item.total})
                          </span>
                          <span className="material-symbols-outlined text-base text-slate-400">
                            chevron_right
                          </span>
                        </button>

                        {isActiveProvince && item.wards.length > 0 ? (
                          <div className="mt-2 px-2 pb-2 ml-2 border-l-2 border-slate-100 space-y-1">
                            <button
                              type="button"
                              onClick={() => handleSelectWard("")}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                ward
                                  ? "text-slate-600 hover:bg-slate-50"
                                  : "font-extrabold text-accent-blue bg-[#F0F9FF]"
                              }`}
                            >
                              Tất cả quận/huyện
                            </button>
                            {item.wards.map((wardItem) => {
                              const isActiveWard =
                                normalizeText(ward) === normalizeText(wardItem.ward);
                              return (
                                <button
                                  key={`${item.cityParam}-${wardItem.ward}`}
                                  type="button"
                                  onClick={() => handleSelectWard(wardItem.ward)}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                    isActiveWard
                                      ? "font-extrabold text-accent-blue bg-[#F0F9FF] border border-accent-blue/30"
                                      : "text-slate-600 hover:text-accent-blue hover:bg-white"
                                  }`}
                                >
                                  {wardItem.ward} ({wardItem.total})
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}

                  {!isLoading && provinceSummaries.length === 0 ? (
                    <div className="px-3 py-6 text-sm text-slate-500 text-center">
                      Chưa có dữ liệu chi nhánh.
                    </div>
                  ) : null}
                </div>
              </div>
            </aside>

            <div className="lg:col-span-9">
              <div
                className="flex flex-col gap-4 sm:gap-6 lg:h-[700px] lg:overflow-y-auto custom-scrollbar lg:pr-1 overscroll-contain"
                data-lenis-prevent
                data-lenis-prevent-wheel
              >
                <div ref={branchListAnchorRef} />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 pb-3 border-b border-gray-200 lg:sticky lg:top-0 lg:z-10 lg:bg-background-alt lg:pt-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-extrabold text-navy">
                    Khu vực: {activeAreaLabel}
                  </h3>
                  <span className="bg-accent-blue/10 text-accent-blue text-[11px] sm:text-xs font-extrabold px-2 py-1 rounded-full">
                    {filteredBranches.length} salon
                  </span>
                  <span className="bg-emerald-100 text-emerald-700 text-[11px] sm:text-xs font-extrabold px-2 py-1 rounded-full">
                    {openCount} đang mở
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-slate-500 flex items-center gap-2">
                  <span>Sắp xếp:</span>
                  <select
                    className="border border-slate-200 rounded-lg bg-white text-slate-700 font-semibold focus:ring-accent-blue focus:border-accent-blue text-xs sm:text-sm px-2 py-1 cursor-pointer"
                    value={sort}
                    onChange={(event) => {
                      setSort(normalizeSort(event.target.value));
                      setPage(1);
                    }}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                </div>

              {loadError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-semibold">
                  {loadError}
                </div>
              ) : null}

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={`branch-skeleton-${index}`}
                      className="animate-pulse bg-white rounded-xl border border-gray-100 overflow-hidden"
                    >
                      <div className="h-44 bg-slate-200" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-slate-200 rounded" />
                        <div className="h-3 bg-slate-100 rounded" />
                        <div className="h-10 bg-slate-200 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {!isLoading && filteredBranches.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                  <p className="text-slate-600 font-semibold">
                    Không tìm thấy salon phù hợp với bộ lọc hiện tại.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="mt-4 inline-flex items-center justify-center h-11 px-5 rounded-xl bg-navy text-white font-extrabold uppercase tracking-wide hover:bg-accent-blue transition-colors"
                  >
                    Đặt lại bộ lọc
                  </button>
                </div>
              ) : null}

              {!isLoading && filteredBranches.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {pagedBranches.map((branch) => {
                      const isOpen = isOpenBranch(branch.Status);
                      const scheduleText = formatSchedule(
                        branch.Opening_time,
                        branch.Closing_time
                      );

                      return (
                        <div
                          key={branch.Id_store}
                          className="group bg-white rounded-xl shadow-soft border border-gray-100 hover:shadow-card transition-all duration-300 flex flex-col overflow-hidden"
                        >
                          <div className="h-44 overflow-hidden relative">
                            <img
                              alt={branch.Name_store}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              src={branch.imageUrl}
                            />
                            <div
                              className={`absolute top-3 right-3 text-white text-[10px] font-extrabold px-2 py-1 rounded shadow-sm uppercase flex items-center gap-1 ${
                                isOpen ? "bg-[#38B44A]" : "bg-[#D63031]"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px] font-bold">
                                {isOpen ? "check_circle" : "cancel"}
                              </span>
                              {isOpen ? "Mở cửa" : "Tạm đóng"}
                            </div>
                          </div>

                          <div className="p-4 sm:p-5 flex flex-col flex-1">
                            <h4 className="text-sm sm:text-base font-extrabold text-navy mb-1 group-hover:text-accent-blue transition-colors">
                              {branch.Name_store}
                            </h4>

                            <div className="flex items-start gap-2 mb-3">
                              <span className="material-symbols-outlined text-slate-400 text-lg mt-0.5">
                                location_on
                              </span>
                              <p className="text-[13px] sm:text-sm text-slate-600 leading-relaxed">
                                {formatAddress(branch)}
                              </p>
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-3">
                              <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 gap-2">
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-base">
                                    schedule
                                  </span>
                                  {scheduleText}
                                </span>

                                {branch.Phone ? (
                                  <a
                                    href={`tel:${branch.Phone}`}
                                    className="flex items-center gap-1 hover:text-accent-blue transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-base">
                                      call
                                    </span>
                                    {branch.Phone}
                                  </a>
                                ) : (
                                  <span className="text-slate-400">Đang cập nhật</span>
                                )}
                              </div>

                              {isOpen ? (
                                <button
                                  type="button"
                                  onClick={() => handleStartBookingAtSalon(branch.Id_store)}
                                  className="w-full h-11 sm:h-12 rounded-lg bg-navy text-white text-xs sm:text-sm font-extrabold uppercase tracking-wide transition-all duration-300 shadow-md hover:bg-accent-blue hover:shadow-lg flex items-center justify-center gap-2"
                                >
                                  <span className="material-symbols-outlined text-xl">
                                    calendar_month
                                  </span>
                                  Đặt lịch ngay
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="w-full h-11 sm:h-12 rounded-lg bg-slate-200 text-slate-500 text-xs sm:text-sm font-extrabold uppercase tracking-wide cursor-not-allowed"
                                  disabled
                                >
                                  Salon đang tạm đóng
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-600 font-semibold">
                      Trang {currentPage}/{totalPages} - Hiển thị {pagedBranches.length}/
                      {filteredBranches.length} salon
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleChangePage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="h-9 px-3 rounded-lg border border-slate-200 text-slate-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:border-accent-blue hover:text-accent-blue"
                      >
                        Trước
                      </button>

                      {paginationItems.map((item, index) =>
                        item === "..." ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="h-9 w-9 inline-flex items-center justify-center text-slate-400"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            type="button"
                            key={`page-${item}`}
                            onClick={() => handleChangePage(item)}
                            className={`h-9 min-w-9 px-3 rounded-lg border font-bold transition-colors ${
                              item === currentPage
                                ? "border-accent-blue bg-accent-blue text-white"
                                : "border-slate-200 text-slate-700 hover:border-accent-blue hover:text-accent-blue"
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )}

                      <button
                        type="button"
                        onClick={() => handleChangePage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="h-9 px-3 rounded-lg border border-slate-200 text-slate-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:border-accent-blue hover:text-accent-blue"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
