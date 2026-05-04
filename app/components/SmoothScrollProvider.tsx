"use client";

import { ReactNode, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type LenisInstance = {
    raf: (time: number) => void;
    destroy: () => void;
    scrollTo: (target: number, options?: { immediate?: boolean }) => void;
};

export default function SmoothScrollProvider({
    children,
}: {
    children: ReactNode;
}) {
    const lenisRef = useRef<LenisInstance | null>(null);
    const lastContentPathRef = useRef<string | null>(null);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const search = searchParams.toString();

    useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (media.matches) return;
        let rafId = 0;
        let mounted = true;

        const setup = async () => {
            try {
                const module = await import("lenis");
                if (!mounted) return;

                const Lenis = module.default;
                const lenis = new Lenis({
                    duration: 1.5,
                    smoothWheel: true,
                    wheelMultiplier: 1,
                    touchMultiplier: 1.2,
                });

                lenisRef.current = lenis;

                const raf = (time: number) => {
                    lenis.raf(time);
                    rafId = requestAnimationFrame(raf);
                };
                rafId = requestAnimationFrame(raf);
            } catch {
                // Ignore runtime import errors in development and keep native scroll.
            }
        };

        setup();

        return () => {
            mounted = false;
            cancelAnimationFrame(rafId);
            const lenis = lenisRef.current;
            if (!lenis) return;
            lenis.destroy();
            lenisRef.current = null;
        };
    }, []);

    useEffect(() => {
        const lenis = lenisRef.current;
        if (!lenis) return;

        const isModalRoute = pathname === "/login" || pathname === "/register";
        if (isModalRoute) return;

        if (lastContentPathRef.current !== pathname) {
            lenis.scrollTo(0, { immediate: true });
            lastContentPathRef.current = pathname;
        }
    }, [pathname]);

    useEffect(() => {
        if (pathname === "/login" || pathname === "/register") return;
        const params = new URLSearchParams(search);
        params.delete("auth");
        const qs = params.toString();
        const path = qs ? `${pathname}?${qs}` : pathname;
        localStorage.setItem("last_path", path);
    }, [pathname, search]);

    return <>{children}</>;
}
