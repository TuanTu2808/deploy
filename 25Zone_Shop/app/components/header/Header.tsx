"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "./NavLink";
import { SearchDropdownDesktop } from "./search/SearchDropdownDesktop";
import { SearchOverlayMobile } from "./search/SearchOverlayMobile";
import AuthModal from "../auth/AuthModal"; // ✅ thêm

const nav = [
    { href: "/", label: "25Zone Shop" },
    { href: "#", label: "Trang chủ" },
    { href: "#", label: "Danh mục" },
    { href: "/products", label: "Sản phẩm" },
    { href: "/promotions", label: "Khuyến mãi" },
    { href: "/news", label: "Tin tức" },
];

export default function Header() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    // ✅ auth modal state
    const [authOpen, setAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState<"login" | "register">("login");

    const pathname = usePathname();
    const router = useRouter();
    const searchBtnRef = useRef<HTMLButtonElement | null>(null);

    const openLogin = () => {
        setAuthMode("login");
        setAuthOpen(true);
        setDrawerOpen(false);
        setSearchOpen(false);
    };

    const openRegister = () => {
        setAuthMode("register");
        setAuthOpen(true);
        setDrawerOpen(false);
        setSearchOpen(false);
    };

    useEffect(() => {
        const mq = window.matchMedia("(min-width: 1024px)");
        const sync = () => setIsDesktop(mq.matches);
        sync();

        mq.addEventListener?.("change", sync);
        return () => mq.removeEventListener?.("change", sync);
    }, []);

    useEffect(() => {
        setDrawerOpen(false);
        setSearchOpen(false);
        setAuthOpen(false); // ✅ thêm
    }, [pathname]);

    const lockScroll = useMemo(
        () => drawerOpen || (searchOpen && !isDesktop) || authOpen, // ✅ thêm authOpen
        [drawerOpen, searchOpen, isDesktop, authOpen]
    );

    useEffect(() => {
        if (!lockScroll) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [lockScroll]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;

            if (authOpen) setAuthOpen(false); // ✅ ưu tiên đóng auth
            else if (searchOpen) setSearchOpen(false);
            else if (drawerOpen) setDrawerOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [drawerOpen, searchOpen, authOpen]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() !== "k") return;
            if (!(e.ctrlKey || e.metaKey)) return;
            e.preventDefault();
            setDrawerOpen(false);
            setAuthOpen(false);
            setSearchOpen(true);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    useEffect(() => {
        if (searchOpen) return;
        const t = window.setTimeout(() => searchBtnRef.current?.focus(), 0);
        return () => window.clearTimeout(t);
    }, [searchOpen]);

    const submitSearch = (raw: string) => {
        const q = raw.trim();
        if (!q) return;
        setSearchOpen(false);
        router.push(`/products?search=${encodeURIComponent(q)}`);
    };

    const iconBtnClass =
        "p-2 rounded-xl text-[#003366] transition-colors duration-200 hover:text-[#33B1FA] active:scale-95 " +
        "outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0";

    return (
        <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm font-sans">
            <div className="mx-auto flex h-[85px] max-w-[1920px] items-center justify-between px-4 sm:px-6">
                <div className="flex items-center">
                    <Link href="/" className="flex items-center">
                        <img
                            src="/img/image%202.png"
                            alt="25Zone Logo"
                            className="h-12 sm:h-16 lg:h-40 w-auto lg:w-[180px] object-contain"
                        />
                    </Link>
                </div>

                <nav className="hidden lg:flex items-center gap-9">
                    {nav.map((n) => (
                        <NavLink key={n.label} href={n.href} label={n.label} pathname={pathname} />
                    ))}
                </nav>

                <div className="flex items-center gap-3 sm:gap-5 text-[#003366]">
                    {/* Search */}
                    <button
                        ref={searchBtnRef}
                        className={iconBtnClass}
                        aria-label="Search"
                        aria-expanded={searchOpen}
                        type="button"
                        onClick={() => {
                            setDrawerOpen(false);
                            setAuthOpen(false);
                            setSearchOpen((v) => !v);
                        }}
                    >
                        <i className="fa-solid fa-magnifying-glass text-[20px]" />
                    </button>

                    {/* Cart */}
                    <Link
                        href="/cart"
                        className={iconBtnClass}
                        aria-label="Cart"
                        onClick={() => setAuthOpen(false)}
                    >
                        <i className="fa-solid fa-cart-shopping text-[20px]" />
                    </Link>

                    {/* ✅ Login button (desktop) */}
                    <button
                        className="hidden md:flex h-[50px] w-[185px] items-center justify-center
              shrink-0 whitespace-nowrap leading-none
              rounded-full border-2 border-[#003366] text-[#003366] px-6
              text-[20px] font-extrabold uppercase tracking-wider
              transition-all duration-300 transform-gpu
              hover:bg-[#33B1FA] hover:border-[#33B1FA] hover:text-white active:scale-95"
                        type="button"
                        onClick={openLogin}
                    >
                        Đăng nhập
                    </button>

                    {/* Menu mobile */}
                    <button
                        className={iconBtnClass + " flex lg:hidden ml-1"}
                        type="button"
                        aria-label="Open menu"
                        aria-expanded={drawerOpen}
                        onClick={() => {
                            setSearchOpen(false);
                            setAuthOpen(false);
                            setDrawerOpen(true);
                        }}
                    >
                        <span className="material-symbols-outlined text-3xl">menu</span>
                    </button>
                </div>
            </div>

            <SearchDropdownDesktop
                open={searchOpen && isDesktop}
                anchorRef={searchBtnRef}
                onClose={() => setSearchOpen(false)}
                onSubmit={submitSearch}
            />

            <SearchOverlayMobile
                open={searchOpen && !isDesktop}
                onClose={() => setSearchOpen(false)}
                onSubmit={submitSearch}
            />

            {/* Drawer */}
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
                        "absolute right-0 top-0 h-full w-[86%] max-w-[380px] bg-white shadow-2xl " +
                        "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] " +
                        (drawerOpen ? "translate-x-0" : "translate-x-full")
                    }
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="flex items-center justify-between border-b px-4 py-4">
                        <span className="font-extrabold uppercase tracking-wider text-[#003366]">
                            Menu
                        </span>
                        <button
                            type="button"
                            aria-label="Close menu"
                            className={iconBtnClass}
                            onClick={() => setDrawerOpen(false)}
                        >
                            <span className="material-symbols-outlined text-[26px]">close</span>
                        </button>
                    </div>

                    <div className="p-4">
                        <div className="flex flex-col gap-2">
                            {nav.map((n) => (
                                <div key={n.label} className="border border-gray-100 rounded-xl">
                                    <NavLink
                                        href={n.href}
                                        label={n.label}
                                        drawer
                                        pathname={pathname}
                                        onClick={() => setDrawerOpen(false)}
                                    />
                                </div>
                            ))}
                        </div>

                        {/*  Login button (mobile) */}
                        <div className="mt-6 border-t pt-4 md:hidden">
                            <button
                                className="w-full h-11 rounded-xl border-2 border-[#003366] text-[#003366]
                  font-extrabold uppercase tracking-wider hover:bg-[#33B1FA]
                  hover:border-[#33B1FA] hover:text-white transition active:scale-95"
                                type="button"
                                onClick={() => {
                                    setDrawerOpen(false);
                                    openLogin();
                                }}
                            >
                                Đăng nhập
                            </button>

                            {/* (Tuỳ chọn) thêm nút đăng ký */}
                            <button
                                className="w-full mt-3 h-11 rounded-xl border border-gray-200 text-[#003366]
                  font-extrabold uppercase tracking-wider hover:bg-gray-50 transition active:scale-95"
                                type="button"
                                onClick={() => {
                                    setDrawerOpen(false);
                                    openRegister();
                                }}
                            >
                                Đăng ký
                            </button>
                        </div>
                    </div>
                </aside>
            </div>

            {/* ✅ Auth popup */}
            <AuthModal
                open={authOpen}
                mode={authMode}
                onClose={() => setAuthOpen(false)}
                onModeChange={(next) => setAuthMode(next)}
                logoSrc="/img/image%202.png" 
            />
        </header>
    );
}
