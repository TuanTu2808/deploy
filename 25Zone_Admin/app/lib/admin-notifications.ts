export type AdminNotificationType = "success" | "error" | "info" | "warning";

export type AdminNotification = {
  id: string;
  title: string;
  message: string;
  type: AdminNotificationType;
  createdAt: number;
  read: boolean;
};

export type NewAdminNotification = {
  title: string;
  message: string;
  type?: AdminNotificationType;
};

const STORAGE_KEY = "25zone_admin_notifications";
const EVENT_NAME = "25zone_admin_notifications_updated";
const CHANNEL_NAME = "25zone_admin_notifications_channel";
const MAX_ITEMS = 80;

const isClient = () => typeof window !== "undefined";

const toSafeArray = (value: unknown): AdminNotification[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const row = item as Partial<AdminNotification>;
      if (!row.id || !row.title || !row.message || !row.createdAt) return null;

      return {
        id: String(row.id),
        title: String(row.title),
        message: String(row.message),
        type: (row.type as AdminNotificationType) || "info",
        createdAt: Number(row.createdAt),
        read: Boolean(row.read),
      } satisfies AdminNotification;
    })
    .filter((item): item is AdminNotification => item !== null);
};

const readStore = (): AdminNotification[] => {
  if (!isClient()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return toSafeArray(JSON.parse(raw));
  } catch {
    return [];
  }
};

const writeStore = (items: AdminNotification[]) => {
  if (!isClient()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // ignore write errors
  }
};

const emitChanges = () => {
  if (!isClient()) return;
  window.dispatchEvent(new Event(EVENT_NAME));
  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "sync" });
    channel.close();
  }
};

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

export const getAdminNotifications = () => readStore();

export const pushAdminNotification = (payload: NewAdminNotification) => {
  if (!isClient()) return;

  const current = readStore();
  const item: AdminNotification = {
    id: createId(),
    title: payload.title,
    message: payload.message,
    type: payload.type || "info",
    createdAt: Date.now(),
    read: false,
  };

  writeStore([item, ...current]);
  emitChanges();
};

export const markAdminNotificationAsRead = (id: string) => {
  if (!isClient()) return;
  const next = readStore().map((item) => (item.id === id ? { ...item, read: true } : item));
  writeStore(next);
  emitChanges();
};

export const markAllAdminNotificationsRead = () => {
  if (!isClient()) return;
  const next = readStore().map((item) => ({ ...item, read: true }));
  writeStore(next);
  emitChanges();
};

export const clearAdminNotifications = () => {
  if (!isClient()) return;
  writeStore([]);
  emitChanges();
};

export const subscribeAdminNotifications = (callback: (items: AdminNotification[]) => void) => {
  if (!isClient()) return () => {};

  const sync = () => callback(readStore());

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      sync();
    }
  };

  window.addEventListener(EVENT_NAME, sync);
  window.addEventListener("storage", handleStorage);

  let channel: BroadcastChannel | null = null;
  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = sync;
  }

  sync();

  return () => {
    window.removeEventListener(EVENT_NAME, sync);
    window.removeEventListener("storage", handleStorage);
    if (channel) {
      channel.close();
    }
  };
};
