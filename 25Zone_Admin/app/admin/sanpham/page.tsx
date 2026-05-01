"use client";

import { toast } from "../../component/Toast";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductAPI, Stat } from "@/types/index";
import AddProductModal from "../../component/SanPhamForm";
import EditProductModal from "../../component/EditSanPhamForm";
import {
  API_BASE,
  authorizedAdminFetch,
  clearAdminSession,
} from "@/app/lib/admin-auth";

type ProductStatus = "active" | "low" | "out" | "paused";

const formatPrice = (price: number) => {
  if (!price) return "0 VNĐ";
  return `${price.toLocaleString("vi-VN")} VNĐ`;
};

const mapStatus = (item: ProductAPI): ProductStatus => {
  if (item.Status === 0) return "paused";
  if (item.Quantity === 0) return "out";
  if (item.Quantity < 10) return "low";
  return "active";
};

export default function ProductManagement() {
  const [editingProduct, setEditingProduct] = useState<ProductAPI | null>(null);
  const router = useRouter();
  const [products, setProducts] = useState<ProductAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stat[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | ProductStatus>(
    "all",
  );
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const handleUnauthorized = useCallback(() => {
    clearAdminSession();
    router.replace("/admin/login");
  }, [router]);

  const authorizedFetch = useCallback(
    (input: string, init: RequestInit = {}) =>
      authorizedAdminFetch(input, init, handleUnauthorized),
    [handleUnauthorized],
  );

  const categories = useMemo(() => {
    const unique = new Set(
      products.map((item) => item.Category_Name || "Chưa phân loại"),
    );
    return ["all", ...Array.from(unique)];
  }, [products]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authorizedFetch(`${API_BASE}/api/sanpham`);
      if (!res.ok) {
        throw new Error("Không thể tải danh sách sản phẩm.");
      }

      const data = (await res.json()) as ProductAPI[];
      setProducts(Array.isArray(data) ? data : []);

      const activeProducts = (Array.isArray(data) ? data : []).filter(
        (p) => p.Status === 1,
      );
      const totalProducts = activeProducts.length;
      const lowStock = activeProducts.filter(
        (p) => p.Quantity > 0 && p.Quantity < 10,
      ).length;
      const outOfStock = activeProducts.filter((p) => p.Quantity === 0).length;
      const saleProducts = activeProducts.filter(
        (p) => Number(p.Sale_Price || 0) > 0,
      ).length;

      setStats([
        {
          title: "TỔNG SẢN PHẨM",
          value: totalProducts,
          sub: `${totalProducts} sản phẩm đang bán`,
          color: "green",
          icon: "SP",
        },
        {
          title: "TỒN KHO THẤP",
          value: lowStock,
          sub: "Cần nhập hàng",
          color: "orange",
          icon: "!",
        },
        {
          title: "HẾT HÀNG",
          value: outOfStock,
          sub: "Sản phẩm tạm hết",
          color: "red",
          icon: "X",
        },
        {
          title: "ĐANG KHUYẾN MÃI",
          value: saleProducts,
          sub: "Đang giảm giá",
          color: "green",
          icon: "%",
        },
      ]);
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch]);

  const toggleProductStatus = useCallback(
    async (product: ProductAPI) => {
      try {
        const newStatus = product.Status === 1 ? 0 : 1;

        const res = await authorizedFetch(
          `${API_BASE}/api/sanpham/${product.Id_product}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ Status: newStatus }),
          },
        );

        if (!res.ok) {
          throw new Error("Cập nhật trạng thái thất bại");
        }

        setProducts((prev) =>
          prev.map((p) =>
            p.Id_product === product.Id_product
              ? { ...p, Status: newStatus }
              : p,
          ),
        );
      } catch (error) {
        console.error("Lỗi đổi trạng thái:", error);
        toast.error("Không thể cập nhật trạng thái sản phẩm");
      }
    },
    [authorizedFetch],
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchesSearch =
        item.Name_product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `SP-${item.Id_product}`.includes(searchTerm);

      const itemCategory = item.Category_Name || "Chưa phân loại";
      const matchesCategory =
        selectedCategory === "all" || itemCategory === selectedCategory;

      const status = mapStatus(item);
      const matchesStatus =
        selectedStatus === "all" || status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, selectedCategory, selectedStatus]);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, currentPage]);

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };
  return (
    <main className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Quản Lý Sản Phẩm
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý kho hàng, danh mục sản phẩm và nhà cung cấp.
          </p>
        </div>

        <div className="flex gap-2">
          <HeaderBtn text="Nhập/Xuất kho" />
          <HeaderBtn text="Quản lý danh mục" />
          <HeaderBtn text="Nhà cung cấp" />
          <button
            onClick={() => setOpenAddModal(true)}
            className="rounded-lg bg-[#0077B6] px-4 py-2 text-sm text-white hover:opacity-90"
          >
            + Thêm sản phẩm mới
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-4 gap-4">
        {stats.map((item, index) => (
          <StatCard key={index} data={item} />
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex gap-6 border-b border-slate-200 text-sm">
          <button className="border-b-2 border-blue-600 pb-3 font-medium text-blue-600">
            Danh sách sản phẩm
          </button>
        </div>

        <div className="mb-5 flex justify-between">
          <div className="relative w-[384px]">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-[42px] w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Tìm tên, mã SKU..."
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <i className="fa-solid fa-magnifying-glass"></i>
            </span>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "Tất cả danh mục" : cat}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(e.target.value as "all" | ProductStatus)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang bán</option>
              <option value="low">Sắp hết</option>
              <option value="out">Hết hàng</option>
              <option value="paused">Ngừng bán</option>
            </select>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3 text-center">
                <input type="checkbox" />
              </th>
              <th className="p-3 text-left">SẢN PHẨM</th>
              <th className="p-3 text-center">DANH MỤC</th>
              <th className="p-3 text-center">GIÁ BÁN</th>
              <th className="p-3 text-center">TỒN KHO</th>
              <th className="p-3 text-center">KHUYẾN MÃI</th>
              <th className="p-3 text-center">TRẠNG THÁI</th>
              <th className="p-3 text-center">THAO TÁC</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-400">
                  Đang tải sản phẩm...
                </td>
              </tr>
            ) : (
              paginatedProducts.map((item) => (
                <ProductRow
                  key={item.Id_product}
                  data={item}
                  onToggleStatus={toggleProductStatus}
                  onEdit={(product) => {
                    setEditingProduct(product);
                    setOpenEditModal(true);
                  }}
                />
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-end border-t border-slate-200 px-6 py-4 gap-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className="rounded-lg border border-slate-200 px-4 py-2 disabled:opacity-50 text-sm hover:bg-slate-50 transition"
          >
            Trước
          </button>

          <div className="flex items-center gap-2">
            {getVisiblePages().map((page, i) => (
              page === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-slate-400">...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page as number)}
                  className={`h-9 w-9 rounded-lg text-sm transition ${
                    currentPage === page ? "bg-[#0B3C6D] text-white shadow-sm" : "border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              )
            ))}
          </div>

          <button
            disabled={totalPages === 0 || currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            className="rounded-lg border border-slate-200 px-4 py-2 disabled:opacity-50 text-sm hover:bg-slate-50 transition"
          >
            Sau
          </button>
        </div>
      </div>

      <AddProductModal
        open={openAddModal}
        onClose={() => {
          setOpenAddModal(false);
        }}
        onSuccess={() => {
          setOpenAddModal(false);
          fetchProducts();
        }}
      />
      <EditProductModal
        open={openEditModal}
        product={editingProduct}
        onClose={() => {
          setOpenEditModal(false);
          setEditingProduct(null);
        }}
        onSuccess={() => {
          setOpenEditModal(false);
          setEditingProduct(null);
          fetchProducts();
        }}
      />
    </main>
  );
}

function HeaderBtn({ text }: { text: string }) {
  return (
    <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50">
      {text}
    </button>
  );
}

function StatCard({ data }: { data: Stat }) {
  const map: Record<string, string> = {
    green: "text-green-600",
    orange: "text-orange-500",
    red: "text-red-500",
  };

  return (
    <div className="flex justify-between rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <p className="text-xs font-semibold text-slate-500">{data.title}</p>
        <h2 className="mt-2 text-2xl font-bold">{data.value}</h2>
        <p className={`mt-2 text-xs ${map[data.color] || ""}`}>{data.sub}</p>
      </div>
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold ${map[data.color] || ""}`}
      >
        {data.icon}
      </div>
    </div>
  );
}

function ProductRow({
  data,
  onToggleStatus,
  onEdit,
}: {
  data: ProductAPI;
  onToggleStatus: (product: ProductAPI) => void;
  onEdit: (product: ProductAPI) => void;
}) {
  const imageUrl = data.Thumbnail
    ? `${API_BASE}${data.Thumbnail}`
    : "/no-image.png";
  const status = mapStatus(data);

  return (
    <tr className="hover:bg-slate-50">
      <td className="p-3 text-center">
        <input type="checkbox" />
      </td>

      <td className="flex items-center gap-3 p-3">
        <img
          src={imageUrl}
          alt={data.Name_product}
          className="h-10 w-10 rounded-lg border bg-slate-200 object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/no-image.png";
          }}
        />
        <div>
          <p className="font-medium">{data.Name_product}</p>
          <p className="text-xs text-slate-400">SKU: SP-{data.Id_product}</p>
        </div>
      </td>

      <td className="p-3 text-center text-slate-600">
        {data.Category_Name || "Chưa phân loại"}
      </td>
      <td className="p-3 text-center font-medium">{formatPrice(data.Price)}</td>

      <td className="p-3 text-center">
        <b>{data.Quantity}</b>
        <div className="mx-auto mt-1 h-1 w-14 rounded bg-slate-200">
          <div
            className={`h-1 rounded ${data.Quantity === 0
              ? "bg-red-500"
              : data.Quantity < 10
                ? "bg-orange-500"
                : "bg-green-500"
              }`}
            style={{ width: `${Math.min(data.Quantity * 2, 100)}%` }}
          />
        </div>
      </td>

      <td className="p-3 text-center text-red-500">
        {Number(data.Sale_Price || 0) > 0
          ? formatPrice(Number(data.Sale_Price || 0))
          : "Không có"}
      </td>

      <td className="p-3 text-center">
        <StatusBadge status={status} />
      </td>

      <td className="p-3 text-center">
        <div className="flex justify-center gap-2">
          <ActionBtn
            iconClass="fa-regular fa-pen-to-square"
            title="Sua san pham"
            color="blue"
            onClick={() => onEdit(data)}
          />
          <ActionBtn
            iconClass={
              data.Status === 1
                ? "fa-regular fa-eye-slash"
                : "fa-regular fa-eye"
            }
            title={data.Status === 1 ? "An san pham" : "Hien san pham"}
            color="gray"
            onClick={() => onToggleStatus(data)}
          />
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: ProductStatus }) {
  const map: Record<ProductStatus, string> = {
    active: "border border-[#A7F3D0] bg-green-100 text-green-700",
    low: "border border-[#FDE68A] bg-yellow-100 text-yellow-700",
    out: "border border-[#FECACA] bg-red-100 text-red-600",
    paused: "border border-red-200 bg-red-50 text-red-600",
  };

  const text: Record<ProductStatus, string> = {
    active: "Đang bán",
    low: "Sắp hết",
    out: "Hết hàng",
    paused: "Ngừng bán",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${map[status]}`}
    >
      {text[status]}
    </span>
  );
}

function ActionBtn({
  iconClass,
  title,
  color,
  onClick,
}: {
  iconClass: string;
  title: string;
  color: "blue" | "gray";
  onClick?: () => void;
}) {
  const map: Record<"blue" | "gray", string> = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    gray: "bg-slate-100 text-slate-600 hover:bg-slate-200",
  };

  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`rounded-lg px-3 py-1.5 text-sm ${map[color]}`}
    >
      <i className={iconClass}></i>
    </button>
  );
}