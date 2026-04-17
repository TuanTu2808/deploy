"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

type Props = {
  children: ReactNode;
};

export default function AdminShell({ children }: Props) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        {children}
      </div>
    </>
  );
}
