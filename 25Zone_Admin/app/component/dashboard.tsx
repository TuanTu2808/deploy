"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import Link from "next/link";

export default function Dashboard() {
  const revenueRef = useRef<HTMLCanvasElement>(null);
  const soldRef = useRef<HTMLCanvasElement>(null);
  const promoRef = useRef<HTMLCanvasElement>(null);
  const weeklyRef = useRef<HTMLCanvasElement>(null);
  const trendRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const charts: Chart[] = [];

    /* ================= DOANH THU ================= */
    if (revenueRef.current) {
      charts.push(
        new Chart(revenueRef.current, {
          type: "line",
          data: {
            labels: ["01/10", "07/10", "14/10", "21/10", "28/10", "31/10"],
            datasets: [
              {
                data: [10, 35, 28, 55, 40, 75],
                borderColor: "#2D9CDB",
                backgroundColor: "rgba(45,156,219,0.15)",
                fill: true,
                tension: 0.45,
                pointRadius: 0,
              },
            ],
          },

          options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
              legend: { display: false },
            },

            scales: {
              x: {
                grid: { display: false },
                ticks: {
                  color: "#94A3B8", // màu ngày
                  font: { size: 12 },
                },
              },

              y: {
                grid: {
                  color: "#E5EEF5",
                },
                ticks: {
                  color: "#94A3B8",
                  font: { size: 12 },
                },
              },
            },
          },
        }),
      );
    }

    /* ================= SẢN PHẨM ================= */
    if (soldRef.current) {
      charts.push(
        new Chart(soldRef.current, {
          type: "bar",

          data: {
            labels: ["T1", "T2", "T3", "T4", "T5"],

            datasets: [
              {
                data: [40, 70, 110, 60, 80],

                backgroundColor: [
                  "#E5E7EB",
                  "#E5E7EB",
                  "#2D9CDB",
                  "#E5E7EB",
                  "#E5E7EB",
                ],

                borderRadius: 6,
              },
            ],
          },

          options: {
            maintainAspectRatio: false,

            plugins: { legend: { display: false } },

            scales: {
              x: { display: false },
              y: { display: false },
            },
          },
        }),
      );
    }

    /* ================= PROMO ================= */
    if (promoRef.current) {
      charts.push(
        new Chart(promoRef.current, {
          type: "doughnut",

          data: {
            datasets: [
              {
                data: [65, 35],
                backgroundColor: ["#2D9CDB", "#E5EAF0"],
                borderWidth: 0,
              },
            ],
          },

          options: {
            responsive: false, // QUAN TRỌNG: không auto resize
            maintainAspectRatio: false,

            rotation: -90, // bắt đầu từ bên trái
            circumference: 180, // nửa vòng tròn

            cutout: "75%", // độ dày vòng

            plugins: {
              legend: { display: false },
              tooltip: { enabled: false },
            },
          },
        }),
      );
    }

    /* ================= TUẦN ================= */
    if (weeklyRef.current) {
      charts.push(
        new Chart(weeklyRef.current, {
          type: "bar",

          data: {
            labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],

            datasets: [
              {
                data: [20, 30, 25, 40, 50, 55, 60],

                backgroundColor: [
                  "#BFDBFE",
                  "#93C5FD",
                  "#BFDBFE",
                  "#60A5FA",
                  "#3B82F6",
                  "#2563EB",
                  "#0B3C6D",
                ],

                borderRadius: 6,
              },
            ],
          },

          options: {
            maintainAspectRatio: false,

            plugins: { legend: { display: false } },

            scales: {
              x: { grid: { display: false } },
              y: { display: false },
            },
          },
        }),
      );
    }

    /* ================= TREND ================= */
    if (trendRef.current) {
      charts.push(
        new Chart(trendRef.current, {
          type: "line",

          data: {
            labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],

            datasets: [
              {
                data: [10, 20, 18, 30, 15, 40, 28],

                borderColor: "#8B5CF6",
                backgroundColor: "rgba(139,92,246,0.15)",

                fill: true,
                tension: 0.45,
                pointRadius: 0,
              },
            ],
          },

          options: {
            maintainAspectRatio: false,

            plugins: { legend: { display: false } },

            scales: {
              x: { display: false },
              y: { display: false },
            },
          },
        }),
      );
    }

    /* CLEANUP */
    return () => charts.forEach((c) => c.destroy());
  }, []);

  return (
    <main className="flex-1 bg-[#F8FAFC] py-8 px-[100px]">
      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0F172A]">
          Tổng Quan Hoạt Động
        </h2>

        <p className="text-sm text-[#64748B] mt-1">
          Chào buổi sáng! Tổng hợp số liệu vận hành và kinh doanh mới nhất.
        </p>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
        <button className="pb-3 text-sm font-medium border-b-2 border-[#0B3C6D] text-[#0B3C6D]">
          Thống kê sản phẩm
        </button>

        <Link href="/admin/dashboard">
          <button className="pb-3 text-sm text-[#94A3B8] hover:text-[#0B3C6D]">
            Thống kê dịch vụ
          </button>
        </Link>
      </div>

      {/* GRID TOP */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* DOANH THU */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-semibold text-[#0F172A]">
                Tổng doanh thu sản phẩm
              </p>

              <p className="text-xs text-[#94A3B8]">
                Biến động doanh thu qua các tuần trong tháng
              </p>
            </div>

            <div className="text-right">
              <p className="text-xl font-bold text-[#0B3C6D]">128,450,000 đ</p>

              <p className="text-xs text-green-500">+15.2%</p>
            </div>
          </div>

          <div className="h-[260px]">
            <canvas ref={revenueRef} />
          </div>
        </div>

        {/* SOLD */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="font-semibold text-[#0F172A]">
            Số lượng sản phẩm đã bán
          </p>

          <p className="text-xs text-[#94A3B8] mb-4">
            Thống kê theo tuần (Đơn vị: Sản phẩm)
          </p>

          <div className="h-[260px]">
            <canvas ref={soldRef} />
          </div>
        </div>
      </div>

      {/* GRID MIDDLE */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* PROMO */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="font-semibold text-[#0F172A] mb-1">
            Thống kê Khuyến mãi
          </p>

          <p className="text-xs text-[#94A3B8] mb-6">
            Tỷ lệ sản phẩm đang chạy chương trình khuyến mãi
          </p>

          <div className="flex items-center gap-6">
            <div className="relative w-[260px] h-[260px] shrink-0 ">
              <canvas
                ref={promoRef}
                width={260}
                height={260}
                style={{
                  width: "260px",
                  height: "260px",
                }}
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                <p className="text-4xl font-bold text-[#2D9CDB]">65%</p>
                <p className="text-xs text-gray-500 tracking-wide">
                  ĐANG KHUYẾN MÃI
                </p>
              </div>
            </div>

            {/* BOX BÊN PHẢI */}
            <div className="flex-1 space-y-3">
              {/* ĐANG KHUYẾN MÃI */}
              <div className="w-[252px] h-[81px] bg-[#F1F5F9] rounded-lg px-4 py-3 flex flex-col justify-center">
                <p className="text-xs text-gray-400">ĐANG KHUYẾN MÃI</p>

                <p className="text-base font-bold text-[#0B3C6D]">552 SP</p>
              </div>

              {/* GIÁ GỐC */}
              <div className="w-[252px] h-[81px] bg-[#F1F5F9] rounded-lg px-4 py-3 flex flex-col justify-center">
                <p className="text-xs text-gray-400">GIÁ GỐC</p>

                <p className="text-base font-bold text-[#0B3C6D]">298 SP</p>
              </div>
            </div>
          </div>
        </div>

        {/* CƠ CẤU */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="font-semibold text-[#0F172A] mb-1">
            Cơ cấu Tổng sản phẩm
          </p>

          <p className="text-xs text-[#94A3B8] mb-6">
            Tỷ lệ số lượng sản phẩm theo danh mục chính
          </p>

          <div className="flex items-center justify-center gap-6">
            <div className="w-40 h-40 rounded-full border-[12px] border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-black">850</p>

                <p className="text-xs text-gray-400">Tổng SKU</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#0B3C6D] rounded-full" />
                Sáp vuốt tóc
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#2D9CDB] rounded-full" />
                Dầu gội & Xả
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-gray-300 rounded-full" />
                Skin-care
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GRID BOTTOM */}
      {/* <div className="grid grid-cols-2 gap-6 mb-6"> */}
        {/* WEEKLY */}
        {/* <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-[#0F172A]">Doanh thu tuần</p>

            <span className="text-xs text-green-500 font-medium">+12%</span>
          </div>

          <div className="h-[200px]">
            <canvas ref={weeklyRef} />
          </div>
        </div> */}

        {/* TREND */}
        {/* <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="font-semibold text-[#0F172A] mb-4">Xu hướng sản phẩm</p>

          <div className="h-[200px]">
            <canvas ref={trendRef} />
          </div>

          <div className="flex justify-between text-xs text-gray-400 mt-3">
            <span>Tuần này</span>

            <span className="font-semibold text-[#0F172A]">142 Đơn</span>
          </div>
        </div>
      </div> */}

      {/* ALERT */}
      <div className="grid grid-cols-2 gap-6">
        {/* WARNING */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="font-semibold text-[#0F172A] mb-3">⚠️ Cảnh báo kho</p>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-[#0F172A]">Sắp hết hàng</p>

              <p className="text-sm text-gray-400">Sáp Matte Clay (2)</p>

              <p className="text-sm text-gray-400">Dầu dưỡng râu (1)</p>
            </div>

            <span className="text-red-500 font-semibold">4 SP</span>
          </div>
        </div>

        {/* NOTICE */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="font-semibold text-[#0F172A] mb-3">🔔 Thông báo</p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-[#92400E] font-bold">
            Bảo trì hệ thống <br />
            <span className="text-gray-400 font-medium">
              02:00 AM ngày mai (25/10)
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
