"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { getCurrentUser, logoutStylist, getUserInitials, type StylistUser } from "@/lib/auth";

const IMG_BASE = process.env.NEXT_PUBLIC_IMAGE_URL || "http://localhost:5001";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<StylistUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
  }, [pathname]);

  // Refresh user when avatar is updated from profile page
  useEffect(() => {
    const refresh = () => setUser(getCurrentUser());
    window.addEventListener("avatar_updated", refresh);
    return () => window.removeEventListener("avatar_updated", refresh);
  }, []);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutStylist();
      router.push("/login");
    } catch {
      router.push("/login");
    }
  }, [isLoggingOut, router]);

  if (pathname === "/login") return null;

  const initials = user ? getUserInitials(user.Name_user) : "??";
  const displayName = user?.Name_user || "Stylist";

  const PAGE_TITLES: Record<string, string> = {
    "/": "Ca hôm nay",
    "/schedule": "Lịch làm việc",
    "/upload": "Tải ảnh kết quả",
    "/profile": "Tài khoản",
  };
  const pageTitle = PAGE_TITLES[pathname] || "25Zone Stylist";

  // Main nav items (sidebar + bottom bar)
  const navItems = [
    {
      name: "Ca hôm nay",
      path: "/",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></svg>
    },
    {
      name: "Lịch làm việc",
      path: "/schedule",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>
    },
    {
      name: "Tải ảnh",
      path: "/upload",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
    },
    {
      name: "Tài khoản",
      path: "/profile",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    },
  ];

  // Sidebar-only items (excludes profile — handled by bottom user card)
  const sidebarItems = navItems.filter(i => i.path !== "/profile");

  return (
    <>
      {/* ═══════════════════════════════════ MOBILE ═══════════════════════════════════ */}
      <div className="md:hidden">
        {/* Mobile Top Header */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-primary-dark/95 backdrop-blur-xl border-b border-slate-100 dark:border-primary/40 shadow-sm">
          <div className="flex items-center justify-between h-16 px-5">
            {/* Page title */}
            <h1 className="text-xl font-black text-primary dark:text-white tracking-tight">{pageTitle}</h1>
            {/* Logo on the right */}
            <img src="/logo.jpg" alt="Logo" className="h-16 w-auto object-contain" />
          </div>
        </header>

        {/* Mobile Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
          <div className="mx-3 mb-3">
            <div className="bg-white/95 dark:bg-primary-dark/95 backdrop-blur-xl border border-slate-100 dark:border-primary rounded-[1.6rem] shadow-[0_8px_30px_rgb(0,51,102,0.15)] overflow-hidden">
              <div className="flex justify-around items-center h-[64px] px-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className="relative flex flex-col items-center justify-center flex-1 h-full gap-1 z-10"
                    >
                      <div className={`transition-all duration-200 ${isActive ? 'text-primary dark:text-accent-blue scale-110' : 'text-slate-400 dark:text-slate-500'}`}>
                        {item.icon}
                      </div>
                      <span className={`text-[9px] font-bold transition-all duration-200 ${isActive ? 'text-primary dark:text-accent-blue' : 'text-slate-300 dark:text-slate-600'}`}>
                        {item.name}
                      </span>
                      {isActive && (
                        <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary dark:bg-accent-blue" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════ DESKTOP SIDEBAR ═══════════════════════════════════ */}
      <aside className="hidden md:flex flex-col w-64 fixed top-0 left-0 h-screen bg-white dark:bg-primary-dark border-r border-slate-100 dark:border-primary/50 z-50 shadow-sm">
        {/* Logo */}
        <div className="px-8 py-6 border-b border-slate-50 dark:border-primary/30">
          <img src="/logo.jpg" alt="25Zone Logo" className="h-auto w-[140px] object-contain" />
          <p className="text-xs text-gray-500 dark:text-slate-400 w-[140px] text-right font-bold">STYLIST PANEL</p>
        </div>

        {/* Nav links */}
        <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                  ? 'bg-primary dark:bg-accent-blue/20 text-white dark:text-accent-blue font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-white font-semibold'
                  }`}
              >
                <div className={isActive ? 'opacity-100' : 'opacity-60'}>{item.icon}</div>
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Bottom user card */}
        <div className="p-4 border-t border-slate-100 dark:border-primary/50 space-y-1">
          <Link
            href="/profile"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${pathname === '/profile'
              ? 'bg-primary/8 dark:bg-accent-blue/10 border border-primary/10 dark:border-accent-blue/20'
              : 'hover:bg-slate-50 dark:hover:bg-primary/20'
              }`}
          >
            <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 dark:bg-primary flex items-center justify-center text-primary dark:text-accent-blue font-black text-sm border border-slate-200 dark:border-primary-dark shrink-0">
              {user?.Image ? (
                <img src={`${IMG_BASE}${user.Image}`} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-primary dark:text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                Online
              </p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-600 shrink-0">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-semibold text-sm disabled:opacity-50 cursor-pointer"
          >
            {isLoggingOut ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
            )}
            {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
          </button>
        </div>
      </aside>
    </>
  );
}
