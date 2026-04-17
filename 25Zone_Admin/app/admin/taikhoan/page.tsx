"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { API_BASE, authorizedAdminFetch, clearAdminSession } from "@/app/lib/admin-auth";
import { pushAdminNotification } from "@/app/lib/admin-notifications";

const PAGE_SIZE = 5;
const LOCKED_USERS_KEY = "25zone_admin_locked_users";

const PROVINCES = [
  "TP. Hồ Chí Minh",
  "Hà Nội",
  "Đà Nẵng",
  "Cần Thơ",
  "Bình Dương",
  "Đồng Nai",
  "Khánh Hòa",
  "Lâm Đồng",
];

const WARDS_BY_PROVINCE: Record<string, string[]> = {
  "TP. Hồ Chí Minh": ["Phường Bến Nghé", "Phường Bến Thành", "Phường 14", "Phường Linh Trung"],
  "Hà Nội": ["Phường Cửa Nam", "Phường Đống Đa", "Phường Dịch Vọng", "Phường Mỹ Đình"],
  "Đà Nẵng": ["Phường Hải Châu", "Phường Thanh Khê", "Phường Hòa Cường", "Phường An Hải"],
  "Cần Thơ": ["Phường Ninh Kiều", "Phường Cái Khế", "Phường Hưng Lợi", "Phường An Bình"],
  "Bình Dương": ["Phường Phú Cường", "Phường Chánh Nghĩa", "Phường An Phú", "Phường Tân Đông Hiệp"],
  "Đồng Nai": ["Phường Trấn Biên", "Phường Tân Hiệp", "Phường Hố Nai", "Phường Long Bình"],
  "Khánh Hòa": ["Phường Tân Lập", "Phường Phước Long", "Phường Vĩnh Hải", "Phường Cam Nghĩa"],
  "Lâm Đồng": ["Phường 1", "Phường 3", "Phường 8", "Phường Lộc Sơn"],
};

type UserRole = "user" | "stylist" | "admin" | "staff";
type UserStatus = "active" | "locked";
type NoticeType = "success" | "error" | "info";
type ActivityTone = "blue" | "green" | "orange" | "purple";

type AdminUser = {
  Id_user: number;
  Name_user: string;
  Phone: string;
  Email: string;
  Address: string;
  Image: string | null;
  role: UserRole;
  Id_store: number;
  Name_store?: string | null;
  Total_addresses?: number;
  Total_orders?: number;
};

type StoreItem = {
  Id_store: number;
  Name_store: string;
  Status?: number;
};

type UserForm = {
  Name_user: string;
  Phone: string;
  Email: string;
  Address: string;
  role: UserRole;
  Id_store: number;
  Pass_word: string;
};

type AddressItem = {
  Id_address_ship: number;
  Receiver_name: string;
  Phone: string;
  Province: string;
  Ward: string;
  Address_detail: string;
  Is_default: number;
};

type AddressForm = {
  Receiver_name: string;
  Phone: string;
  Province: string;
  Ward: string;
  Address_detail: string;
  Is_default: boolean;
};

type Notice = {
  type: NoticeType;
  text: string;
};

type ActivityItem = {
  id: string;
  message: string;
  createdAt: number;
  icon: string;
  tone: ActivityTone;
};

const ROLE_OPTIONS: UserRole[] = ["user", "stylist", "staff", "admin"];

const initialUserForm: UserForm = {
  Name_user: "",
  Phone: "",
  Email: "",
  Address: "",
  role: "user",
  Id_store: 1,
  Pass_word: "",
};

const initialAddressForm: AddressForm = {
  Receiver_name: "",
  Phone: "",
  Province: "",
  Ward: "",
  Address_detail: "",
  Is_default: false,
};

const roleMeta: Record<UserRole, { label: string; badgeClass: string }> = {
  admin: {
    label: "Quản trị viên",
    badgeClass: "bg-[#EEF2FF] text-[#4F46E5] border-[#DDE3FF]",
  },
  stylist: {
    label: "Thợ chính",
    badgeClass: "bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]",
  },
  staff: {
    label: "Nhân viên",
    badgeClass: "bg-[#FDF2F8] text-[#DB2777] border-[#FCE7F3]",
  },
  user: {
    label: "Khách hàng",
    badgeClass: "bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]",
  },
};

const statusMeta: Record<UserStatus, { label: string; badgeClass: string; dotClass: string }> = {
  active: {
    label: "Hoạt động",
    badgeClass: "bg-[#ECFDF5] text-[#047857]",
    dotClass: "bg-[#10B981]",
  },
  locked: {
    label: "Tạm khóa",
    badgeClass: "bg-[#FFF7ED] text-[#C2410C]",
    dotClass: "bg-[#FB923C]",
  },
};

const noticeClass: Record<NoticeType, string> = {
  success: "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]",
  error: "border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]",
  info: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
};

const activityToneClass: Record<ActivityTone, { bg: string; icon: string }> = {
  blue: { bg: "bg-[#EFF6FF]", icon: "text-[#2563EB]" },
  green: { bg: "bg-[#ECFDF5]", icon: "text-[#059669]" },
  orange: { bg: "bg-[#FFF7ED]", icon: "text-[#EA580C]" },
  purple: { bg: "bg-[#F5F3FF]", icon: "text-[#7C3AED]" },
};

const formatNumber = (value: number) => new Intl.NumberFormat("vi-VN").format(value);

const formatActivityTime = (timestamp: number) => {
  const current = new Date();
  const target = new Date(timestamp);
  const sameDate =
    current.getDate() === target.getDate() &&
    current.getMonth() === target.getMonth() &&
    current.getFullYear() === target.getFullYear();

  const yesterday = new Date(current);
  yesterday.setDate(current.getDate() - 1);

  const isYesterday =
    yesterday.getDate() === target.getDate() &&
    yesterday.getMonth() === target.getMonth() &&
    yesterday.getFullYear() === target.getFullYear();

  if (sameDate) {
    return `Hôm nay, ${target.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  }

  if (isYesterday) {
    return `Hôm qua, ${target.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  }

  return target.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (name: string) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
};

const normalizePhone = (phone: string) => phone.replace(/[^\d]/g, "");

const parseJsonSafe = async <T,>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const getMessage = (payload: unknown, fallback: string) => {
  if (payload && typeof payload === "object" && "message" in payload) {
    const value = (payload as { message?: unknown }).message;
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return fallback;
};

const avatarStyle = (name: string): CSSProperties => {
  const seed = Array.from(name || "").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = seed % 360;
  return {
    background: `linear-gradient(135deg, hsl(${hue} 34% 84%), hsl(${(hue + 38) % 360} 30% 70%))`,
  };
};

const toAbsoluteImageUrl = (path?: string | null) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
};

export default function QuanLyTaiKhoanPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");
  const [storeFilter, setStoreFilter] = useState("");
  const [page, setPage] = useState(1);

  const [lockedUserIds, setLockedUserIds] = useState<number[]>([]);

  const [notice, setNotice] = useState<Notice | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const [isOpenUserModal, setIsOpenUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userForm, setUserForm] = useState<UserForm>(initialUserForm);
  const [savingUser, setSavingUser] = useState(false);

  const [isOpenDetailModal, setIsOpenDetailModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [addressForm, setAddressForm] = useState<AddressForm>(initialAddressForm);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);

  const handleUnauthorized = useCallback(() => {
    clearAdminSession();
    if (typeof window !== "undefined") {
      window.location.href = "/admin/login";
    }
  }, []);

  const authorizedFetch = useCallback(
    async (input: string, init: RequestInit = {}) =>
      authorizedAdminFetch(input, init, handleUnauthorized),
    [handleUnauthorized]
  );

  const selectedUser = useMemo(
    () => users.find((user) => user.Id_user === selectedUserId) || null,
    [users, selectedUserId]
  );

  const lockedSet = useMemo(() => new Set(lockedUserIds), [lockedUserIds]);

  const provinces = useMemo(() => {
    if (!addressForm.Province || PROVINCES.includes(addressForm.Province)) {
      return PROVINCES;
    }
    return [addressForm.Province, ...PROVINCES];
  }, [addressForm.Province]);

  const wards = useMemo(() => {
    const list = WARDS_BY_PROVINCE[addressForm.Province] || [];
    if (addressForm.Ward && !list.includes(addressForm.Ward)) {
      return [addressForm.Ward, ...list];
    }
    return list;
  }, [addressForm.Province, addressForm.Ward]);

  const getDefaultStoreId = useCallback(() => stores[0]?.Id_store || 1, [stores]);

  const pushActivity = useCallback((message: string, icon: string, tone: ActivityTone) => {
    setActivities((prev) => {
      const next: ActivityItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        message,
        icon,
        tone,
        createdAt: Date.now(),
      };
      return [next, ...prev].slice(0, 8);
    });
  }, []);

  const getUserStatus = useCallback(
    (userId: number): UserStatus => (lockedSet.has(userId) ? "locked" : "active"),
    [lockedSet]
  );

  const loadUsers = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError("");
      const response = await authorizedFetch(`${API_BASE}/api/admin/users`);
      const payload = await parseJsonSafe<AdminUser[] | { message?: string }>(response);

      if (!response.ok) {
        throw new Error(getMessage(payload, "Không thể tải danh sách tài khoản."));
      }

      const rows = Array.isArray(payload) ? payload : [];
      setUsers(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  const loadStores = useCallback(async () => {
    try {
      const response = await authorizedFetch(`${API_BASE}/api/chinhanh`);
      const payload = await parseJsonSafe<StoreItem[] | { message?: string }>(response);

      if (!response.ok) {
        throw new Error(getMessage(payload, "Không thể tải danh sách chi nhánh."));
      }

      setStores(Array.isArray(payload) ? payload : []);
    } catch {
      setStores([]);
    }
  }, []);

  const loadAddresses = useCallback(async (userId: number) => {
    try {
      setAddressLoading(true);
      setAddressError("");
      const response = await authorizedFetch(`${API_BASE}/api/admin/users/${userId}/addresses`);
      const payload = await parseJsonSafe<AddressItem[] | { message?: string }>(response);

      if (!response.ok) {
        throw new Error(getMessage(payload, "Không thể tải danh sách địa chỉ."));
      }

      setAddresses(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    } finally {
      setAddressLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadStores();
  }, [loadUsers, loadStores]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadUsers(true);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [loadUsers]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(LOCKED_USERS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setLockedUserIds(parsed.map((item) => Number(item)).filter((item) => Number.isInteger(item)));
      }
    } catch {
      // ignore local storage parse errors
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LOCKED_USERS_KEY, JSON.stringify(lockedUserIds));
  }, [lockedUserIds]);

  useEffect(() => {
    if (activities.length > 0 || users.length === 0) return;

    const seedActivities = users.slice(0, 3).map((user, index) => ({
      id: `seed-${user.Id_user}`,
      message: `${user.Name_user} vừa được đồng bộ trong danh sách quản lý`,
      icon: "fa-user-check",
      tone: index % 2 === 0 ? "blue" : "green",
      createdAt: Date.now() - (index + 1) * 3600_000,
    })) as ActivityItem[];

    setActivities(seedActivities);
  }, [activities.length, users]);

  useEffect(() => {
    if (!selectedUserId) return;
    if (!users.some((item) => item.Id_user === selectedUserId)) {
      setSelectedUserId(null);
      setIsOpenDetailModal(false);
      setAddresses([]);
      setEditingAddressId(null);
      setAddressForm(initialAddressForm);
    }
  }, [users, selectedUserId]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter, storeFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const workforce = users.filter((user) => user.role === "stylist" || user.role === "staff").length;
    const customers = users.filter((user) => user.role === "user").length;
    const highestId = users.reduce((max, user) => Math.max(max, user.Id_user), 0);
    const recentThreshold = Math.max(1, highestId - 30);
    const monthNew = users.filter((user) => user.Id_user >= recentThreshold).length;

    return { total, workforce, customers, monthNew };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.Name_user.toLowerCase().includes(query) ||
        user.Email.toLowerCase().includes(query) ||
        String(user.Phone || "").includes(query);

      const matchesRole = !roleFilter || user.role === roleFilter;
      const matchesStore = !storeFilter || String(user.Id_store) === storeFilter;
      const matchesStatus = !statusFilter || getUserStatus(user.Id_user) === statusFilter;

      return matchesSearch && matchesRole && matchesStore && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter, storeFilter, getUserStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, page]);

  const visiblePages = useMemo(() => {
    const delta = 2;
    const pages: number[] = [];
    const start = Math.max(1, page - delta);
    const end = Math.min(totalPages, page + delta);

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    if (pages[0] !== 1) {
      pages.unshift(1);
    }

    if (pages[pages.length - 1] !== totalPages) {
      pages.push(totalPages);
    }

    return Array.from(new Set(pages));
  }, [page, totalPages]);

  const openCreateUserModal = () => {
    setEditingUser(null);
    setUserForm({ ...initialUserForm, Id_store: getDefaultStoreId() });
    setIsOpenUserModal(true);
  };

  const openEditUserModal = (user: AdminUser) => {
    setEditingUser(user);
    setUserForm({
      Name_user: user.Name_user || "",
      Phone: user.Phone || "",
      Email: user.Email || "",
      Address: user.Address || "",
      role: user.role,
      Id_store: Number(user.Id_store) || getDefaultStoreId(),
      Pass_word: "",
    });
    setIsOpenUserModal(true);
  };

  const closeUserModal = () => {
    setIsOpenUserModal(false);
    setEditingUser(null);
    setUserForm({ ...initialUserForm, Id_store: getDefaultStoreId() });
  };

  const openDetailModal = async (userId: number) => {
    setSelectedUserId(userId);
    setAddressForm(initialAddressForm);
    setEditingAddressId(null);
    setIsOpenDetailModal(true);
    await loadAddresses(userId);
  };

  const closeDetailModal = () => {
    setIsOpenDetailModal(false);
    setSelectedUserId(null);
    setAddresses([]);
    setAddressError("");
    setAddressForm(initialAddressForm);
    setEditingAddressId(null);
  };

  const resetAddressForm = () => {
    setAddressForm(initialAddressForm);
    setEditingAddressId(null);
  };

  const onToggleStatus = (user: AdminUser) => {
    const nextStatus = lockedSet.has(user.Id_user) ? "active" : "locked";
    setLockedUserIds((prev) =>
      prev.includes(user.Id_user) ? prev.filter((id) => id !== user.Id_user) : [...prev, user.Id_user]
    );
    setNotice({
      type: "success",
      text: `Đã chuyển trạng thái tài khoản ${user.Name_user} sang ${nextStatus === "active" ? "Hoạt động" : "Tạm khóa"}.`,
    });
    pushActivity(
      `${user.Name_user} được cập nhật trạng thái: ${nextStatus === "active" ? "Hoạt động" : "Tạm khóa"}`,
      nextStatus === "active" ? "fa-unlock" : "fa-lock",
      nextStatus === "active" ? "green" : "orange"
    );

    pushAdminNotification({
      title: "Điều chỉnh trạng thái tài khoản",
      message: `${user.Name_user}: ${nextStatus === "active" ? "Hoạt động" : "Tạm khóa"}.`,
      type: "warning",
    });
  };

  const onDeleteUser = async (user: AdminUser) => {
    const accepted = window.confirm(`Bạn có chắc muốn xóa tài khoản ${user.Name_user}?`);
    if (!accepted) return;

    try {
      const response = await authorizedFetch(`${API_BASE}/api/admin/users/${user.Id_user}`, {
        method: "DELETE",
      });
      const payload = await parseJsonSafe<{ message?: string }>(response);

      if (!response.ok) {
        throw new Error(getMessage(payload, "Không thể xóa tài khoản."));
      }

      await loadUsers();
      setLockedUserIds((prev) => prev.filter((id) => id !== user.Id_user));
      setNotice({ type: "success", text: getMessage(payload, "Xóa tài khoản thành công.") });
      pushActivity(`${user.Name_user} đã bị xóa khỏi hệ thống`, "fa-user-xmark", "orange");
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Có lỗi xảy ra." });
    }
  };

  const onSubmitUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = userForm.Name_user.trim();
    const phone = normalizePhone(userForm.Phone);
    const email = userForm.Email.trim();
    const address = userForm.Address.trim() || "Chưa cập nhật";

    if (!name || !phone || !email) {
      setNotice({ type: "error", text: "Vui lòng nhập đầy đủ họ tên, email và số điện thoại." });
      return;
    }

    if (!editingUser && userForm.Pass_word.trim().length < 6) {
      setNotice({ type: "error", text: "Mật khẩu tài khoản mới phải tối thiểu 6 ký tự." });
      return;
    }

    if (editingUser && userForm.Pass_word.trim().length > 0 && userForm.Pass_word.trim().length < 6) {
      setNotice({ type: "error", text: "Mật khẩu mới phải tối thiểu 6 ký tự." });
      return;
    }

    try {
      setSavingUser(true);

      const body: UserForm = {
        Name_user: name,
        Phone: phone,
        Email: email,
        Address: address,
        role: userForm.role,
        Id_store: Number(userForm.Id_store) || getDefaultStoreId(),
        Pass_word: userForm.Pass_word.trim(),
      };

      const endpoint = editingUser
        ? `${API_BASE}/api/admin/users/${editingUser.Id_user}`
        : `${API_BASE}/api/admin/users`;

      const response = await authorizedFetch(endpoint, {
        method: editingUser ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = await parseJsonSafe<{ message?: string }>(response);
      if (!response.ok) {
        throw new Error(getMessage(payload, editingUser ? "Không thể cập nhật tài khoản." : "Không thể tạo tài khoản."));
      }

      await loadUsers();
      closeUserModal();
      setNotice({
        type: "success",
        text: getMessage(payload, editingUser ? "Cập nhật tài khoản thành công." : "Tạo tài khoản mới thành công."),
      });

      pushActivity(
        editingUser ? `${name} vừa được cập nhật thông tin` : `${name} vừa được tạo tài khoản mới`,
        editingUser ? "fa-user-pen" : "fa-user-plus",
        editingUser ? "blue" : "green"
      );
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Có lỗi xảy ra." });
    } finally {
      setSavingUser(false);
    }
  };
  const onSubmitAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedUserId) {
      setNotice({ type: "error", text: "Vui lòng chọn tài khoản trước khi lưu địa chỉ." });
      return;
    }

    const receiver = addressForm.Receiver_name.trim();
    const phone = normalizePhone(addressForm.Phone);
    const province = addressForm.Province.trim();
    const ward = addressForm.Ward.trim();
    const detail = addressForm.Address_detail.trim();

    if (!receiver || !phone || !province || !ward || !detail) {
      setNotice({ type: "error", text: "Vui lòng nhập đầy đủ thông tin địa chỉ giao hàng." });
      return;
    }

    try {
      setSavingAddress(true);

      const response = await authorizedFetch(
        editingAddressId
          ? `${API_BASE}/api/admin/users/${selectedUserId}/addresses/${editingAddressId}`
          : `${API_BASE}/api/admin/users/${selectedUserId}/addresses`,
        {
          method: editingAddressId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Receiver_name: receiver,
            Phone: phone,
            Province: province,
            Ward: ward,
            Address_detail: detail,
            Is_default: addressForm.Is_default,
          }),
        }
      );

      const payload = await parseJsonSafe<{ message?: string }>(response);

      if (!response.ok) {
        throw new Error(getMessage(payload, "Không thể lưu địa chỉ."));
      }

      await loadAddresses(selectedUserId);
      await loadUsers();
      setNotice({ type: "success", text: getMessage(payload, "Lưu địa chỉ thành công.") });
      pushActivity(
        `${selectedUser?.Name_user || "Tài khoản"} ${editingAddressId ? "đã cập nhật" : "đã thêm"} địa chỉ giao hàng`,
        "fa-location-dot",
        "purple"
      );
      resetAddressForm();
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Có lỗi xảy ra." });
    } finally {
      setSavingAddress(false);
    }
  };

  const onEditAddress = (address: AddressItem) => {
    setEditingAddressId(address.Id_address_ship);
    setAddressForm({
      Receiver_name: address.Receiver_name,
      Phone: address.Phone,
      Province: address.Province,
      Ward: address.Ward,
      Address_detail: address.Address_detail,
      Is_default: Number(address.Is_default) === 1,
    });
  };

  const onSetDefaultAddress = async (address: AddressItem) => {
    if (!selectedUserId) return;

    try {
      const response = await authorizedFetch(
        `${API_BASE}/api/admin/users/${selectedUserId}/addresses/${address.Id_address_ship}/default`,
        {
          method: "PATCH",
        }
      );
      const payload = await parseJsonSafe<{ message?: string }>(response);
      if (!response.ok) {
        throw new Error(getMessage(payload, "Không thể đặt địa chỉ mặc định."));
      }

      await loadAddresses(selectedUserId);
      await loadUsers();
      setNotice({ type: "success", text: getMessage(payload, "Đã đặt địa chỉ mặc định thành công.") });
      pushActivity(`${selectedUser?.Name_user || "Tài khoản"} vừa đổi địa chỉ mặc định`, "fa-house-circle-check", "green");
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Có lỗi xảy ra." });
    }
  };

  const onDeleteAddress = async (address: AddressItem) => {
    if (!selectedUserId) return;

    const accepted = window.confirm(`Bạn có chắc muốn xóa địa chỉ của ${address.Receiver_name}?`);
    if (!accepted) return;

    try {
      const response = await authorizedFetch(
        `${API_BASE}/api/admin/users/${selectedUserId}/addresses/${address.Id_address_ship}`,
        {
          method: "DELETE",
        }
      );
      const payload = await parseJsonSafe<{ message?: string }>(response);

      if (!response.ok) {
        throw new Error(getMessage(payload, "Không thể xóa địa chỉ."));
      }

      await loadAddresses(selectedUserId);
      await loadUsers();
      setNotice({ type: "success", text: getMessage(payload, "Xóa địa chỉ thành công.") });
      pushActivity(`${selectedUser?.Name_user || "Tài khoản"} vừa xóa một địa chỉ`, "fa-trash-can", "orange");

      if (editingAddressId === address.Id_address_ship) {
        resetAddressForm();
      }
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Có lỗi xảy ra." });
    }
  };

  const startIndex = (page - 1) * PAGE_SIZE;
  const visibleFrom = filteredUsers.length ? startIndex + 1 : 0;
  const visibleTo = Math.min(startIndex + PAGE_SIZE, filteredUsers.length);

  return (
    <main className="min-h-screen bg-[#F4F7FB] p-6">
      <div className="mx-auto w-full max-w-[1500px] space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[30px] font-bold leading-tight text-[#0F172A]">Quản lý tài khoản</h1>
            <p className="mt-1 text-sm text-[#64748B]">Quản lý người dùng, phân quyền và trạng thái hoạt động.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setNotice({ type: "info", text: "Chức năng quản lý vai trò & quyền hạn sẽ được mở rộng ở bước tiếp theo." })}
              className="inline-flex items-center gap-2 rounded-xl border border-[#D9E2EC] bg-white px-4 py-2 text-sm font-semibold text-[#334155] hover:bg-[#F8FAFC]"
            >
              <i className="fa-regular fa-shield-halved text-xs"></i>
              Quản lý vai trò & quyền hạn
            </button>

            <button
              type="button"
              onClick={openCreateUserModal}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0EA5E9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0284C7]"
            >
              <i className="fa-solid fa-user-plus text-xs"></i>
              Thêm tài khoản mới
            </button>
          </div>
        </div>

        {notice && (
          <div className={`flex items-start justify-between rounded-xl border px-4 py-3 text-sm ${noticeClass[notice.type]}`}>
            <p>{notice.text}</p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="ml-4 rounded-md px-2 py-1 text-xs font-semibold hover:bg-black/5"
            >
              Đóng
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Tổng tài khoản</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-3xl font-bold text-[#0F172A]">{formatNumber(stats.total)}</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#2563EB]">
                <i className="fa-solid fa-users"></i>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Nhân sự (Thợ/NV)</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-3xl font-bold text-[#0F172A]">{formatNumber(stats.workforce)}</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5F3FF] text-[#7C3AED]">
                <i className="fa-solid fa-id-badge"></i>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Khách hàng</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-3xl font-bold text-[#0F172A]">{formatNumber(stats.customers)}</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ECFDF5] text-[#059669]">
                <i className="fa-solid fa-face-smile"></i>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">Tài khoản mới (tháng)</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-3xl font-bold text-[#0F172A]">+{formatNumber(stats.monthNew)}</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF7ED] text-[#EA580C]">
                <i className="fa-solid fa-user-plus"></i>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
            <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] p-4">
              <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-[#64748B]">
                <i className="fa-solid fa-magnifying-glass text-xs"></i>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  type="text"
                  placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#94A3B8]"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="min-w-[150px] rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#334155] outline-none"
              >
                <option value="">Tất cả vai trò</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {roleMeta[role].label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as UserStatus | "")}
                className="min-w-[130px] rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#334155] outline-none"
              >
                <option value="">Trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="locked">Tạm khóa</option>
              </select>

              <select
                value={storeFilter}
                onChange={(event) => setStoreFilter(event.target.value)}
                className="min-w-[160px] rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#334155] outline-none"
              >
                <option value="">Chi nhánh</option>
                {stores.map((store) => (
                  <option key={store.Id_store} value={store.Id_store}>
                    {store.Name_store}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#64748B]">
                  <tr>
                    <th className="px-4 py-3 text-left">Tài khoản</th>
                    <th className="px-4 py-3 text-left">Liên hệ</th>
                    <th className="px-4 py-3 text-left">Vai trò</th>
                    <th className="px-4 py-3 text-left">Chi nhánh</th>
                    <th className="px-4 py-3 text-left">Trạng thái</th>
                    <th className="px-4 py-3 text-left">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-[#64748B]">
                        Đang tải danh sách tài khoản...
                      </td>
                    </tr>
                  )}

                  {!loading && error && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-red-500">
                        {error}
                      </td>
                    </tr>
                  )}

                  {!loading && !error && pagedUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-[#64748B]">
                        Không tìm thấy tài khoản phù hợp với điều kiện lọc.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    !error &&
                    pagedUsers.map((user) => {
                      const status = getUserStatus(user.Id_user);
                      return (
                        <tr key={user.Id_user} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC]">
                          <td className="px-4 py-3 align-top">
                            <div className="flex items-center gap-3">
                              {toAbsoluteImageUrl(user.Image) ? (
                                <img
                                  src={toAbsoluteImageUrl(user.Image)}
                                  alt={user.Name_user}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div
                                  style={avatarStyle(user.Name_user)}
                                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                                >
                                  {getInitials(user.Name_user)}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-[#0F172A]">{user.Name_user}</p>
                                <p className="text-xs text-[#94A3B8]">ID: #{user.Id_user}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 align-top text-[#475569]">
                            <p className="flex items-center gap-2 text-sm">
                              <i className="fa-regular fa-envelope text-xs text-[#94A3B8]"></i>
                              {user.Email || "Chưa cập nhật"}
                            </p>
                            <p className="mt-1 flex items-center gap-2 text-sm">
                              <i className="fa-solid fa-phone text-[11px] text-[#94A3B8]"></i>
                              {user.Phone || "Chưa cập nhật"}
                            </p>
                          </td>

                          <td className="px-4 py-3 align-top">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${roleMeta[user.role].badgeClass}`}>
                              {roleMeta[user.role].label}
                            </span>
                          </td>

                          <td className="px-4 py-3 align-top text-sm text-[#475569]">
                            {user.Name_store || `Chi nhánh #${user.Id_store}`}
                          </td>

                          <td className="px-4 py-3 align-top">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta[status].badgeClass}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${statusMeta[status].dotClass}`}></span>
                              {statusMeta[status].label}
                            </span>
                          </td>

                          <td className="px-4 py-3 align-top">
                            <div className="flex items-center gap-3 text-sm">
                              <button
                                type="button"
                                onClick={() => openDetailModal(user.Id_user)}
                                className="text-[#64748B] hover:text-[#0EA5E9]"
                                title="Xem chi tiết tài khoản"
                              >
                                <i className="fa-solid fa-link"></i>
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditUserModal(user)}
                                className="text-[#2563EB] hover:text-[#1D4ED8]"
                                title="Sửa tài khoản"
                              >
                                <i className="fa-solid fa-pen"></i>
                              </button>

                              <button
                                type="button"
                                onClick={() => onToggleStatus(user)}
                                className={`${status === "active" ? "text-[#EA580C] hover:text-[#C2410C]" : "text-[#059669] hover:text-[#047857]"}`}
                                title={status === "active" ? "Tạm khóa tài khoản" : "Mở khóa tài khoản"}
                              >
                                <i className={`fa-solid ${status === "active" ? "fa-lock" : "fa-lock-open"}`}></i>
                              </button>

                              <button
                                type="button"
                                onClick={() => onDeleteUser(user)}
                                className="text-[#DC2626] hover:text-[#B91C1C]"
                                title="Xóa tài khoản"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] px-4 py-3 text-sm text-[#64748B]">
              <p>
                Hiển thị {visibleFrom}-{visibleTo} trên {formatNumber(filteredUsers.length)} tài khoản
              </p>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs font-semibold text-[#64748B] disabled:opacity-50"
                >
                  Trước
                </button>

                {visiblePages.map((pageNumber, index) => {
                  const prev = visiblePages[index - 1];
                  const needGap = prev !== undefined && pageNumber - prev > 1;

                  return (
                    <span key={pageNumber} className="flex items-center gap-1">
                      {needGap && <span className="px-1 text-[#94A3B8]">...</span>}
                      <button
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        className={`h-8 min-w-8 rounded-md px-2 text-xs font-semibold ${
                          page === pageNumber
                            ? "bg-[#0EA5E9] text-white"
                            : "border border-[#E2E8F0] text-[#64748B]"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    </span>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs font-semibold text-[#64748B] disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>

          <aside className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0F172A]">Nhật ký hoạt động</h2>
              <button
                type="button"
                onClick={() => setActivities((prev) => prev.slice(0, 5))}
                className="text-xs font-semibold text-[#0EA5E9] hover:text-[#0284C7]"
              >
                Xem tất cả
              </button>
            </div>

            <ul className="space-y-3">
              {activities.length === 0 && (
                <li className="rounded-xl border border-dashed border-[#CBD5E1] px-3 py-5 text-center text-sm text-[#64748B]">
                  Chưa có hoạt động nào.
                </li>
              )}

              {activities.map((item) => {
                const tone = activityToneClass[item.tone];
                return (
                  <li key={item.id} className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg ${tone.bg}`}>
                      <i className={`fa-solid ${item.icon} text-xs ${tone.icon}`}></i>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm leading-5 text-[#334155]">{item.message}</p>
                      <p className="mt-1 text-xs text-[#94A3B8]">{formatActivityTime(item.createdAt)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </aside>
        </section>
      </div>

      {isOpenUserModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">
                  {editingUser ? "Cập nhật tài khoản" : "Thêm tài khoản mới"}
                </h3>
                <p className="mt-1 text-sm text-[#64748B]">
                  {editingUser
                    ? "Chỉnh sửa thông tin người dùng và quyền truy cập."
                    : "Tạo tài khoản mới để quản lý trên hệ thống."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeUserModal}
                className="rounded-lg p-2 text-[#64748B] hover:bg-[#F1F5F9]"
                aria-label="Đóng"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={onSubmitUser} className="space-y-4 px-5 py-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="space-y-1 text-sm text-[#334155]">
                  <span className="font-semibold">Họ và tên</span>
                  <input
                    value={userForm.Name_user}
                    onChange={(event) => setUserForm((prev) => ({ ...prev, Name_user: event.target.value }))}
                    type="text"
                    className="w-full rounded-xl border border-[#D0D7E2] px-3 py-2.5 outline-none focus:border-[#0EA5E9]"
                    required
                  />
                </label>

                <label className="space-y-1 text-sm text-[#334155]">
                  <span className="font-semibold">Số điện thoại</span>
                  <input
                    value={userForm.Phone}
                    onChange={(event) => setUserForm((prev) => ({ ...prev, Phone: event.target.value }))}
                    type="text"
                    className="w-full rounded-xl border border-[#D0D7E2] px-3 py-2.5 outline-none focus:border-[#0EA5E9]"
                    required
                  />
                </label>

                <label className="space-y-1 text-sm text-[#334155]">
                  <span className="font-semibold">Email</span>
                  <input
                    value={userForm.Email}
                    onChange={(event) => setUserForm((prev) => ({ ...prev, Email: event.target.value }))}
                    type="email"
                    className="w-full rounded-xl border border-[#D0D7E2] px-3 py-2.5 outline-none focus:border-[#0EA5E9]"
                    required
                  />
                </label>

                <label className="space-y-1 text-sm text-[#334155]">
                  <span className="font-semibold">Mật khẩu {editingUser ? "(để trống nếu không đổi)" : ""}</span>
                  <input
                    value={userForm.Pass_word}
                    onChange={(event) => setUserForm((prev) => ({ ...prev, Pass_word: event.target.value }))}
                    type="password"
                    className="w-full rounded-xl border border-[#D0D7E2] px-3 py-2.5 outline-none focus:border-[#0EA5E9]"
                    required={!editingUser}
                  />
                </label>

                <label className="space-y-1 text-sm text-[#334155]">
                  <span className="font-semibold">Vai trò</span>
                  <select
                    value={userForm.role}
                    onChange={(event) => setUserForm((prev) => ({ ...prev, role: event.target.value as UserRole }))}
                    className="w-full rounded-xl border border-[#D0D7E2] px-3 py-2.5 outline-none focus:border-[#0EA5E9]"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {roleMeta[role].label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm text-[#334155]">
                  <span className="font-semibold">Chi nhánh</span>
                  <select
                    value={userForm.Id_store}
                    onChange={(event) => setUserForm((prev) => ({ ...prev, Id_store: Number(event.target.value) || getDefaultStoreId() }))}
                    className="w-full rounded-xl border border-[#D0D7E2] px-3 py-2.5 outline-none focus:border-[#0EA5E9]"
                  >
                    {stores.length === 0 && <option value={getDefaultStoreId()}>Chi nhánh mặc định</option>}
                    {stores.map((store) => (
                      <option key={store.Id_store} value={store.Id_store}>
                        {store.Name_store}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="space-y-1 text-sm text-[#334155] block">
                <span className="font-semibold">Địa chỉ</span>
                <input
                  value={userForm.Address}
                  onChange={(event) => setUserForm((prev) => ({ ...prev, Address: event.target.value }))}
                  type="text"
                  className="w-full rounded-xl border border-[#D0D7E2] px-3 py-2.5 outline-none focus:border-[#0EA5E9]"
                />
              </label>

              <div className="flex justify-end gap-2 border-t border-[#E2E8F0] pt-4">
                <button
                  type="button"
                  onClick={closeUserModal}
                  className="rounded-xl border border-[#D0D7E2] px-4 py-2 text-sm font-semibold text-[#334155] hover:bg-[#F8FAFC]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="rounded-xl bg-[#0EA5E9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0284C7] disabled:opacity-60"
                >
                  {savingUser ? "Đang lưu..." : editingUser ? "Cập nhật" : "Tạo tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isOpenDetailModal && selectedUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-4">
          <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A]">Chi tiết tài khoản</h3>
                <p className="mt-1 text-sm text-[#64748B]">Theo dõi thông tin và quản lý địa chỉ giao hàng của người dùng.</p>
              </div>

              <button
                type="button"
                onClick={closeDetailModal}
                className="rounded-lg p-2 text-[#64748B] hover:bg-[#F1F5F9]"
                aria-label="Đóng"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-[300px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div className="flex items-center gap-3">
                  {toAbsoluteImageUrl(selectedUser.Image) ? (
                    <img
                      src={toAbsoluteImageUrl(selectedUser.Image)}
                      alt={selectedUser.Name_user}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      style={avatarStyle(selectedUser.Name_user)}
                      className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white"
                    >
                      {getInitials(selectedUser.Name_user)}
                    </div>
                  )}
                  <div>
                    <p className="text-base font-bold text-[#0F172A]">{selectedUser.Name_user}</p>
                    <p className="text-xs text-[#64748B]">ID tài khoản #{selectedUser.Id_user}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-[#334155]">
                  <p className="flex items-start gap-2">
                    <i className="fa-regular fa-envelope mt-0.5 text-xs text-[#64748B]"></i>
                    <span>{selectedUser.Email || "Chưa cập nhật"}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <i className="fa-solid fa-phone mt-0.5 text-xs text-[#64748B]"></i>
                    <span>{selectedUser.Phone || "Chưa cập nhật"}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <i className="fa-solid fa-location-dot mt-0.5 text-xs text-[#64748B]"></i>
                    <span>{selectedUser.Address || "Chưa cập nhật"}</span>
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${roleMeta[selectedUser.role].badgeClass}`}>
                    {roleMeta[selectedUser.role].label}
                  </span>

                  <span className="inline-flex items-center rounded-full border border-[#E2E8F0] bg-white px-2.5 py-1 text-xs font-semibold text-[#475569]">
                    {selectedUser.Name_store || `Chi nhánh #${selectedUser.Id_store}`}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-base font-bold text-[#0F172A]">Địa chỉ giao hàng</h4>
                    <span className="text-xs text-[#64748B]">Tổng: {addresses.length}</span>
                  </div>

                  {addressLoading && <p className="text-sm text-[#64748B]">Đang tải địa chỉ...</p>}
                  {!addressLoading && addressError && <p className="text-sm text-red-500">{addressError}</p>}

                  {!addressLoading && !addressError && addresses.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[#CBD5E1] px-3 py-6 text-center text-sm text-[#64748B]">
                      Tài khoản này chưa có địa chỉ giao hàng.
                    </div>
                  )}

                  {!addressLoading && !addressError && addresses.length > 0 && (
                    <div className="space-y-3">
                      {addresses.map((address) => {
                        const isDefault = Number(address.Is_default) === 1;
                        return (
                          <div key={address.Id_address_ship} className="rounded-xl border border-[#E2E8F0] p-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-[#0F172A]">{address.Receiver_name}</p>
                                <p className="text-xs text-[#64748B]">{address.Phone}</p>
                              </div>

                              <div className="flex items-center gap-2">
                                {isDefault && (
                                  <span className="rounded-full bg-[#ECFDF5] px-2 py-0.5 text-xs font-semibold text-[#047857]">
                                    Mặc định
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => onEditAddress(address)}
                                  className="text-[#2563EB] hover:text-[#1D4ED8]"
                                  title="Sửa địa chỉ"
                                >
                                  <i className="fa-solid fa-pen"></i>
                                </button>

                                {!isDefault && (
                                  <button
                                    type="button"
                                    onClick={() => onSetDefaultAddress(address)}
                                    className="text-[#059669] hover:text-[#047857]"
                                    title="Đặt mặc định"
                                  >
                                    <i className="fa-solid fa-check"></i>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => onDeleteAddress(address)}
                                  className="text-[#DC2626] hover:text-[#B91C1C]"
                                  title="Xóa địa chỉ"
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              </div>
                            </div>

                            <p className="mt-2 text-sm text-[#334155]">
                              {address.Address_detail}, {address.Ward}, {address.Province}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-base font-bold text-[#0F172A]">
                      {editingAddressId ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}
                    </h4>
                    {editingAddressId && (
                      <button
                        type="button"
                        onClick={resetAddressForm}
                        className="text-xs font-semibold text-[#0EA5E9] hover:text-[#0284C7]"
                      >
                        Hủy chỉnh sửa
                      </button>
                    )}
                  </div>

                  <form onSubmit={onSubmitAddress} className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <label className="space-y-1 text-sm text-[#334155]">
                        <span className="font-semibold">Họ và tên</span>
                        <input
                          value={addressForm.Receiver_name}
                          onChange={(event) => setAddressForm((prev) => ({ ...prev, Receiver_name: event.target.value }))}
                          type="text"
                          className="w-full rounded-xl border border-[#D0D7E2] px-3 py-2.5 outline-none focus:border-[#0EA5E9]"
                          required
                        />
                      </label>

                      <label className="space-y-1 text-sm text-[#334155]">
                        <span className="font-semibold">Số điện thoại</span>
                        <input
                          value={addressForm.Phone}
                          onChange={(event) => setAddressForm((prev) => ({ ...prev, Phone: event.target.value }))}
                          type="text"
                          className="w-full rounded-xl border border-[#D0D7E2] px-3 py-2.5 outline-none focus:border-[#0EA5E9]"
                          required
                        />
                      </label>

                      <label className="space-y-1 text-sm text-[#334155]">
                        <span className="font-semibold">Tỉnh / Thành phố</span>
                        <select
                          value={addressForm.Province}
                          onChange={(event) =>
                            setAddressForm((prev) => ({
                              ...prev,
                              Province: event.target.value,
                              Ward: "",
                            }))
                          }
                          className="w-full rounded-xl border border-[#D0D7E2] px-3 py-2.5 outline-none focus:border-[#0EA5E9]"
                          required
                        >
                          <option value="">Chọn tỉnh / thành phố</option>
                          {provinces.map((province) => (
                            <option key={province} value={province}>
                              {province}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1 text-sm text-[#334155]">
                        <span className="font-semibold">Phường / Xã</span>
                        <select
                          value={addressForm.Ward}
                          onChange={(event) => setAddressForm((prev) => ({ ...prev, Ward: event.target.value }))}
                          className="w-full rounded-xl border border-[#D0D7E2] px-3 py-2.5 outline-none focus:border-[#0EA5E9]"
                          required
                          disabled={!addressForm.Province}
                        >
                          <option value="">Chọn phường / xã</option>
                          {wards.map((ward) => (
                            <option key={ward} value={ward}>
                              {ward}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label className="space-y-1 text-sm text-[#334155] block">
                      <span className="font-semibold">Địa chỉ chi tiết</span>
                      <input
                        value={addressForm.Address_detail}
                        onChange={(event) => setAddressForm((prev) => ({ ...prev, Address_detail: event.target.value }))}
                        type="text"
                        className="w-full rounded-xl border border-[#D0D7E2] px-3 py-2.5 outline-none focus:border-[#0EA5E9]"
                        required
                      />
                    </label>

                    <label className="flex items-center gap-2 text-sm text-[#334155]">
                      <input
                        type="checkbox"
                        checked={addressForm.Is_default}
                        onChange={(event) => setAddressForm((prev) => ({ ...prev, Is_default: event.target.checked }))}
                        className="h-4 w-4 rounded border-[#CBD5E1]"
                      />
                      Đặt làm địa chỉ mặc định
                    </label>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={resetAddressForm}
                        className="rounded-xl border border-[#D0D7E2] px-4 py-2 text-sm font-semibold text-[#334155] hover:bg-[#F8FAFC]"
                      >
                        Làm mới
                      </button>
                      <button
                        type="submit"
                        disabled={savingAddress}
                        className="rounded-xl bg-[#0EA5E9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0284C7] disabled:opacity-60"
                      >
                        {savingAddress ? "Đang lưu..." : "Lưu địa chỉ"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
