"use client";

import { usePathname } from "next/navigation";

export default function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (pathname === "/login") {
    return <main className="flex-1 w-full">{children}</main>;
  }

  return (
    <main className="flex-1 pt-16 pb-24 md:pt-0 md:pb-8 md:ml-64 relative min-h-screen bg-gray-50 dark:bg-slate-900 overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto w-full px-4 md:px-8">
        {children}
      </div>
    </main>
  );
}
