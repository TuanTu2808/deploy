"use client";

import { toast } from "./Toast";
import { useCallback, useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { API_BASE, authorizedAdminFetch, clearAdminSession } from "@/app/lib/admin-auth";

/* ================= TYPES ================= */

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Category {
    Id_category_products: number;
    Name_category: string;
}

interface Brand {
    Id_brand: number;
    Name_brand: string;
}

interface ProductForm {
    Name_product: string;
    Quantity: number;
    Size: string;
    Price: number;
    Sale_Price: string;
    Description: string;
    Usage_Instructions: string;
    Ingredients: string;
    Id_category_product: string;
    Id_brand: string;
}

/* ================= COMPONENT ================= */

export default function AddProductModal({
    open,
    onClose,
    onSuccess,
}: Props) {
    const router = useRouter();
    const [images, setImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);

    const [form, setForm] = useState<ProductForm>({
        Name_product: "",
        Quantity: 0,
        Size: "",
        Price: 0,
        Sale_Price: "",
        Description: "",
        Usage_Instructions: "",
        Ingredients: "",
        Id_category_product: "",
        Id_brand: "",
    });
    
    const [errors, setErrors] = useState<Partial<Record<keyof ProductForm, string>>>({});

    const handleUnauthorized = useCallback(() => {
        clearAdminSession();
        router.replace("/admin/login");
    }, [router]);

    const authorizedFetch = useCallback(
        (input: string, init: RequestInit = {}) =>
            authorizedAdminFetch(input, init, handleUnauthorized),
        [handleUnauthorized]
    );

    /* ================= FETCH DATA ================= */
    useEffect(() => {
        if (!open) return;

        const fetchData = async () => {
            try {
                const [cateRes, brandRes] = await Promise.all([
                    authorizedFetch(`${API_BASE}/api/danhmucsanpham`),
                    authorizedFetch(`${API_BASE}/api/nhacungcap`),
                ]);

                const cateData: Category[] = await cateRes.json();
                const brandData: Brand[] = await brandRes.json();

                setCategories(cateData);
                setBrands(brandData);
            } catch (err) {
                console.error("Lỗi load category/brand:", err);
            }
        };

        fetchData();
    }, [open, authorizedFetch]);

    /* ================= HANDLE CHANGE ================= */
    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        setErrors((prev) => ({ ...prev, [name]: undefined }));

        // Nếu là number thì ép kiểu
        if (type === "number") {
            setForm((prev) => ({
                ...prev,
                [name]: Number(value),
            }));
            return;
        }

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    /* ================= SUBMIT ================= */
const handleSubmit = async () => {
  const newErrors: Partial<Record<keyof ProductForm, string>> = {};
  if (!form.Name_product.trim()) newErrors.Name_product = "Vui lòng nhập tên sản phẩm";
  if (form.Quantity < 0 || String(form.Quantity).trim() === '') newErrors.Quantity = "Số lượng không hợp lệ";
  if (form.Price <= 0 || String(form.Price).trim() === '') newErrors.Price = "Giá sản phẩm phải lớn hơn 0";
  if (!form.Id_category_product) newErrors.Id_category_product = "Vui lòng chọn danh mục";
  if (!form.Id_brand) newErrors.Id_brand = "Vui lòng chọn thương hiệu";

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    
    setTimeout(() => {
        const firstInvalid = Object.keys(newErrors)[0];
        const el = document.getElementsByName(firstInvalid)[0];
        if (el) el.focus();
    }, 0);
    return;
  }

  try {
    const formData = new FormData();

    // append dữ liệu text
    formData.append("Name_product", form.Name_product);
    formData.append("Quantity", String(form.Quantity));
    formData.append("Size", form.Size || "");
    formData.append("Price", String(form.Price));
    formData.append("Sale_Price", form.Sale_Price || "");
    formData.append("Description", form.Description);
    formData.append("Usage_Instructions", form.Usage_Instructions);
    formData.append("Ingredients", form.Ingredients);
    formData.append("Id_category_product", form.Id_category_product);
    formData.append("Id_brand", form.Id_brand);
    formData.append("Status", "1");

    // append nhiều ảnh
    images.forEach((img) => {
      formData.append("images", img);
    });

    const res = await authorizedFetch(`${API_BASE}/api/sanpham`, {
      method: "POST",
      body: formData, // ❗ KHÔNG set Content-Type
    });

    if (!res.ok) throw new Error("Thêm sản phẩm thất bại");

    onSuccess();
    onClose();
  } catch (error) {
    console.error(error);
    toast.error("Lỗi thêm sản phẩm");
  }
};

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
            <div className="bg-white w-[900px] max-h-[90vh] overflow-y-auto rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Thêm sản phẩm mới</h2>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Tên sản phẩm"
                        name="Name_product"
                        value={form.Name_product}
                        onChange={handleChange}
                        error={errors.Name_product}
                    />

                    <Input
                        label="Số lượng"
                        name="Quantity"
                        type="number"
                        value={form.Quantity}
                        onChange={handleChange}
                        error={errors.Quantity}
                    />

                    <Input
                        label="Size (có thể null)"
                        name="Size"
                        value={form.Size}
                        onChange={handleChange}
                    />

                    <Input
                        label="Giá"
                        name="Price"
                        type="number"
                        value={form.Price}
                        onChange={handleChange}
                        error={errors.Price}
                    />

                    <Input
                        label="Giá khuyến mãi"
                        name="Sale_Price"
                        type="number"
                        value={form.Sale_Price}
                        onChange={handleChange}
                    />

                    {/* CATEGORY SELECT */}
                    <Select<Category>
                        label="Danh mục"
                        name="Id_category_product"
                        data={categories}
                        valueKey="Id_category_products"
                        labelKey="Name_category"
                        value={form.Id_category_product}
                        onChange={handleChange}
                        error={errors.Id_category_product}
                    />

                    {/* BRAND SELECT */}
                    <Select<Brand>
                        label="Thương hiệu"
                        name="Id_brand"
                        data={brands}
                        valueKey="Id_brand"
                        labelKey="Name_brand"
                        value={form.Id_brand}
                        onChange={handleChange}
                        error={errors.Id_brand}
                    />
                </div>
{/* ================= IMAGE UPLOAD (GALLERY STYLE) ================= */}
<div className="mt-6">
  <label className="text-sm font-semibold block mb-3">
    Hình ảnh sản phẩm
  </label>

  {/* Hidden input */}
  <input
    id="product-images"
    type="file"
    multiple
    accept="image/*"
    className="hidden"
    onChange={(e) => {
      const files = Array.from(e.target.files || []);

      // Gộp ảnh mới + ảnh cũ (cho phép add nhiều lần)
      const newImages = [...images, ...files];
      setImages(newImages);

      const newPreviews = [
        ...previewUrls,
        ...files.map((file) => URL.createObjectURL(file)),
      ];
      setPreviewUrls(newPreviews);
    }}
  />

  {/* GRID 4 CỘT GIỐNG UI MẪU */}
  <div className="grid grid-cols-4 gap-4">
    {/* Ô preview ảnh */}
    {previewUrls.map((url, index) => (
      <div
        key={index}
        className="relative w-full h-[140px] border rounded-lg overflow-hidden group"
      >
        <img
          src={url}
          alt={`preview-${index}`}
          className="w-full h-full object-cover"
        />

        {/* Nút xoá ảnh */}
        <button
          type="button"
          onClick={() => {
            const newImgs = images.filter((_, i) => i !== index);
            const newPre = previewUrls.filter((_, i) => i !== index);
            setImages(newImgs);
            setPreviewUrls(newPre);
          }}
          className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition"
        >
          X
        </button>
      </div>
    ))}

    {/* Ô thêm ảnh (placeholder giống hình mẫu) */}
    <label
      htmlFor="product-images"
      className="w-full h-[140px] border-2 border-dashed rounded-lg
      flex flex-col items-center justify-center cursor-pointer
      hover:bg-gray-50 transition"
    >
      <span className="text-3xl text-gray-400">＋</span>
      <span className="text-xs text-gray-500 mt-1">
        Thêm ảnh
      </span>
    </label>
  </div>

  <p className="text-xs text-gray-400 mt-2">
    Có thể chọn 1 hoặc nhiều hình ảnh (PNG, JPG)
  </p>
</div>
                <Textarea
                    label="Mô tả (text + hình HTML)"
                    name="Description"
                    value={form.Description}
                    onChange={handleChange}
                />

                <Textarea
                    label="Hướng dẫn sử dụng"
                    name="Usage_Instructions"
                    value={form.Usage_Instructions}
                    onChange={handleChange}
                />

                <Textarea
                    label="Thành phần"
                    name="Ingredients"
                    value={form.Ingredients}
                    onChange={handleChange}
                />

                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg">
                        Huỷ
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Thêm sản phẩm
                    </button>
                </div>

            </div>
        </div>
    );
}

/* ================= SUB COMPONENT ================= */

interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

function Input({ label, error, ...props }: InputProps) {
    return (
        <div>
            <label className={`text-sm font-medium ${error ? 'text-red-500' : 'text-slate-700'}`}>{label}</label>
            <input
                {...props}
                className={`w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring-1 ${error ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-slate-300 focus:ring-blue-500'}`}
            />
            {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}
        </div>
    );
}

interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
}

function Textarea({ label, ...props }: TextareaProps) {
    return (
        <div className="mt-4">
            <label className="text-sm font-medium">{label}</label>
            <textarea
                {...props}
                rows={4}
                className="w-full border rounded-lg p-2 mt-1"
                placeholder="Có thể nhập HTML: text + <img src='...'>"
            />
        </div>
    );
}

interface SelectProps<T> {
    label: string;
    name: string;
    data: T[];
    valueKey: keyof T;
    labelKey: keyof T;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    error?: string;
}

function Select<T extends object>({
    label,
    data,
    valueKey,
    labelKey,
    value,
    onChange,
    name,
    error,
}: SelectProps<T>) {
    return (
        <div>
            <label className={`text-sm font-medium ${error ? 'text-red-500' : 'text-slate-700'}`}>{label}</label>
            <select
                name={name}
                value={value}
                onChange={onChange}
                className={`w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring-1 ${error ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-slate-300 focus:ring-blue-500'}`}
            >
                <option value="">-- Chọn --</option>
                {data.map((item) => (
                    <option
                        key={String(item[valueKey])}
                        value={String(item[valueKey])}
                    >
                        {String(item[labelKey])}
                    </option>
                ))}
            </select>
            {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}
        </div>
    );
}
