"use client";

import Link from "next/link";
import React from "react";

export type BookingAccountSection = "profile" | "history";

const NAV_ITEMS: Array<{
  key: BookingAccountSection;
  href: string;
  label: string;
  icon: string;
}> = [
  { key: "profile", href: "/taikhoan", label: "Thông tin tài khoản", icon: "fa-user" },
  { key: "history", href: "/lichsudatlich", label: "Lịch sử đặt lịch", icon: "fa-calendar-check" },
];

function MobileNav({ active }: { active: BookingAccountSection }) {
  return (
    <div className="lg:hidden mb-6">
      <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 text-white bg-[linear-gradient(90deg,#003366_0%,#0b3a66_50%,#33B1FA_130%)]">
          <p className="text-xs uppercase tracking-[0.1em] opacity-90 font-bold">
            Tài khoản của tôi
          </p>
          <p className="font-extrabold text-lg mt-1">Quản lý thông tin & lịch đặt</p>
        </div>

        <div className="px-3 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV_ITEMS.map((item) => {
              const isActive = active === item.key;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-extrabold transition " +
                    (isActive
                      ? "bg-[#003366] text-white border-[#003366] shadow"
                      : "bg-white text-[#003366] border-gray-200 hover:bg-gray-50")
                  }
                >
                  <i className={`fa-solid ${item.icon}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopSidebar({ active }: { active: BookingAccountSection }) {
  const itemClass = (isActive: boolean) =>
    isActive
      ? "flex items-center gap-3 px-4 py-3 rounded-xl bg-[#003366] text-white font-bold hover:bg-[#002244] transition"
      : "flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-white text-gray-700 font-semibold hover:bg-gray-50 hover:text-[#003366] transition";

  return (
    <aside className="hidden self-start lg:col-span-4 lg:block xl:col-span-3">
      <div className="sticky top-28 border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-[#003366] font-extrabold uppercase flex items-center gap-2">
            <i className="fa-solid fa-user-circle text-[#33B1FA]" />
            Tài khoản của tôi
          </h3>
          <p className="mt-2 text-sm text-gray-500">Quản lý hồ sơ và lịch sử đặt lịch.</p>
        </div>

        <ul className="p-3 space-y-2 text-sm">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link className={itemClass(active === item.key)} href={item.href}>
                <i className={`fa-solid ${item.icon}`} />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default function BookingAccountShell({
  active,
  children,
}: {
  active: BookingAccountSection;
  children: React.ReactNode;
}) {
  return (
    <>
      <MobileNav active={active} />
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <DesktopSidebar active={active} />
        <div className="min-w-0 self-start lg:col-span-8 xl:col-span-9">{children}</div>
      </div>
    </>
  );
}
