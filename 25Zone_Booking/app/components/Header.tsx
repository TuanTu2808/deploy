"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { toAbsoluteImageUrl } from "@/lib/api";

type NavItem = { label: string; href: string };
type AuthMode = "login" | "register";

const NAV: NavItem[] = [
  { label: "Trang chủ", href: "/" },
  { label: "Về 25Zone", href: "/gioithieu" },
  { label: "25Zone Shop", href: "http://localhost:3000" },
  { label: "Tìm Salon", href: "/chinhanh" },
  { label: "Nhượng quyền", href: "/nhuongquyen" },
  { label: "Đối tác", href: "/doitac" },
  { label: "Nụ cười dịch vụ", href: "/tintuc" },
];

const MEMBER_MENU = [
  {
    label: "Thông tin tài khoản",
    href: "/taikhoan",
    icon: "fa-solid fa-user-gear",
  },
  {
    label: "Bí kíp chăm sóc tóc",
    href: "/bikipchamsoctoc",
    icon: "fa-solid fa-book-open",
  },
];

const isActive = (pathname: string, href: string) => {
  if (!href.startsWith("/")) return false;
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
};

const buildAuthHref = (pathname: string, search: string, mode: AuthMode) => {
  const params = new URLSearchParams(search);
  params.set("auth", mode);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const closeAccountMenuTimerRef = useRef<number | null>(null);
  const { user, signOut, bootstrapped } = useAuth();

  const loginHref = useMemo(
    () => buildAuthHref(pathname, search, "login"),
    [pathname, search]
  );

  const registerHref = useMemo(
    () => buildAuthHref(pathname, search, "register"),
    [pathname, search]
  );

  const logoSrc = "/image 2.png";
  const displayName = user?.Name_user?.trim() || "Tài khoản";
  const avatar = toAbsoluteImageUrl(user?.Image) || "/image/avatar.png";
  const authReady = hydrated && bootstrapped;
  const isAuthenticated = authReady && Boolean(user);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    setAccountMenuOpen(false);
  }, [pathname, search]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    return () => {
      if (closeAccountMenuTimerRef.current) {
        window.clearTimeout(closeAccountMenuTimerRef.current);
      }
    };
  }, []);

  const handleLogout = () => {
    signOut();
    setDrawerOpen(false);
    setAccountMenuOpen(false);
    router.push("/");
  };

  const openAccountMenu = () => {
    if (closeAccountMenuTimerRef.current) {
      window.clearTimeout(closeAccountMenuTimerRef.current);
      closeAccountMenuTimerRef.current = null;
    }
    setAccountMenuOpen(true);
  };

  const closeAccountMenu = () => {
    if (closeAccountMenuTimerRef.current) {
      window.clearTimeout(closeAccountMenuTimerRef.current);
    }
    closeAccountMenuTimerRef.current = window.setTimeout(() => {
      setAccountMenuOpen(false);
      closeAccountMenuTimerRef.current = null;
    }, 140);
  };

  const baseLink =
    "group relative py-1 text-[20px] font-bold uppercase tracking-tight transition-all duration-200";
  const activeCls = "text-[#33B1FA]";
  const inactiveCls = "text-[#003366] hover:text-[#33B1FA]";
  const underline =
    "absolute bottom-0.5 left-0 h-[3px] bg-[#33B1FA] transition-all duration-300";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white font-sans shadow-sm">
      <div className="mx-auto flex h-[85px] max-w-[1920px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center">
          <Link href="/">
            <img
              alt="25Zone Logo"
              className="h-12 w-auto object-contain sm:h-16 lg:h-40 lg:w-[180px]"
              src={logoSrc}
            />
          </Link>
        </div>

        <nav className="hidden items-center gap-9 lg:flex">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);

            if (!item.href.startsWith("/")) {
              return (
                <a
                  key={item.label}
                  className={`${baseLink} ${inactiveCls}`}
                  href={item.href}
                >
                  {item.label}
                  <span className={`${underline} w-0 group-hover:w-full`} />
                </a>
              );
            }

            return (
              <Link
                key={item.label}
                className={`${baseLink} ${active ? activeCls : inactiveCls}`}
                href={item.href}
              >
                {item.label}
                <span className={`${underline} ${active ? "w-full" : "w-0 group-hover:w-full"}`} />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 text-[#003366] sm:gap-5">
          {!authReady ? (
            <div className="hidden h-[50px] w-[185px] shrink-0 rounded-full border-2 border-gray-100 md:block" />
          ) : !isAuthenticated ? (
            <Link
              href={loginHref}
              className="hidden h-[50px] w-[185px] shrink-0 items-center justify-center whitespace-nowrap rounded-full border-2 border-[#003366] px-6 text-[20px] font-extrabold uppercase leading-none tracking-wider text-[#003366] transition-all duration-300 hover:border-[#33B1FA] hover:bg-[#33B1FA] hover:text-white active:scale-95 md:flex"
            >
              ĐĂNG NHẬP
            </Link>
          ) : (
            <div
              className="relative hidden md:block"
              onMouseEnter={openAccountMenu}
              onMouseLeave={closeAccountMenu}
            >
              <button
                type="button"
                aria-expanded={accountMenuOpen}
                className="flex h-[50px] items-center gap-3 rounded-full border border-gray-200 px-3 pr-4 transition hover:border-[#33B1FA] hover:bg-sky-50"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
              >
                <img src={avatar} alt={displayName} className="h-9 w-9 rounded-full object-cover" />
                <span className="max-w-[160px] truncate text-sm font-extrabold">{displayName}</span>
                <i className="fa-solid fa-chevron-down text-xs text-gray-500" />
              </button>

              <div
                className={
                  "absolute right-0 top-full z-30 w-56 pt-2 transition-all " +
                  (accountMenuOpen
                    ? "pointer-events-auto visible opacity-100"
                    : "pointer-events-none invisible opacity-0")
                }
              >
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  {MEMBER_MENU.map((item, index) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setAccountMenuOpen(false)}
                      className={
                        "block px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 " +
                        (index < MEMBER_MENU.length - 1 ? "border-b border-gray-100 " : "")
                      }
                    >
                      {item.label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full border-t border-gray-100 px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white text-navy shadow-sm transition-all duration-200 hover:border-gray-200 hover:text-primary hover:shadow-md active:scale-95 lg:hidden"
            type="button"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <span className="material-symbols-outlined text-3xl">menu</span>
          </button>
        </div>
      </div>

      <div
        className={
          "fixed inset-0 z-[60] lg:hidden " +
          (drawerOpen ? "pointer-events-auto" : "pointer-events-none")
        }
        aria-hidden={!drawerOpen}
      >
        <div
          className={
            "absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] " +
            (drawerOpen ? "opacity-100" : "opacity-0")
          }
          onClick={() => setDrawerOpen(false)}
        />

        <aside
          className={
            "absolute right-0 top-0 h-full w-[86%] max-w-[380px] rounded-l-2xl bg-white shadow-2xl " +
            "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] " +
            (drawerOpen ? "translate-x-0" : "translate-x-full")
          }
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between border-b px-4 py-4">
            <span className="font-extrabold uppercase tracking-wider text-navy">Menu</span>
            <button
              type="button"
              aria-label="Close menu"
              className="h-9 w-9 rounded-full border border-gray-100 text-navy transition-colors duration-200 hover:border-gray-200 hover:text-primary active:scale-95"
              onClick={() => setDrawerOpen(false)}
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          <div className="p-4">
            <div className="flex flex-col gap-2">
              {NAV.map((item) => {
                const active = isActive(pathname, item.href);
                const itemCls =
                  "block w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-left text-[16px] font-extrabold uppercase tracking-wider transition-all duration-200 " +
                  (active
                    ? "border-blue-100 bg-blue-50/70 text-[#33B1FA]"
                    : "text-[#003366] hover:bg-gray-50 hover:text-[#33B1FA]");

                if (!item.href.startsWith("/")) {
                  return (
                    <a key={item.label} href={item.href} className={itemCls}>
                      {item.label}
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={itemCls}
                    onClick={() => setDrawerOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {!authReady ? (
              <div className="mt-6 border-t pt-4">
                <div className="h-11 w-full rounded-xl border border-gray-100" />
              </div>
            ) : !isAuthenticated ? (
              <div className="mt-6 border-t pt-4">
                <Link
                  href={loginHref}
                  onClick={() => setDrawerOpen(false)}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border-2 border-[#003366] font-extrabold uppercase tracking-wider text-[#003366] transition hover:border-[#33B1FA] hover:bg-[#33B1FA] hover:text-white active:scale-95"
                >
                  Đăng nhập
                </Link>

                <Link
                  href={registerHref}
                  onClick={() => setDrawerOpen(false)}
                  className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-gray-200 font-extrabold uppercase tracking-wider text-[#003366] transition hover:bg-gray-50 active:scale-95"
                >
                  Đăng ký
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-3 border-t pt-4">
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
                  <img src={avatar} alt={displayName} className="h-10 w-10 rounded-full object-cover" />
                  <div>
                    <p className="font-extrabold text-[#003366]">{displayName}</p>
                    <p className="text-xs text-gray-500">Đã đăng nhập</p>
                  </div>
                </div>

                {MEMBER_MENU.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className="inline-flex w-full items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 font-bold text-gray-700"
                  >
                    <i className={`${item.icon} text-[#003366]`} />
                    {item.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex w-full items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-extrabold text-red-600"
                >
                  <i className="fa-solid fa-right-from-bracket" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </header>
  );
}
