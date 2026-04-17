"use client";

import { useCallback, useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
    API_BASE,
    authorizedAdminFetch,
    clearAdminSession,
} from "@/app/lib/admin-auth";
import { ProductAPI } from "@/types";

/* ================= TYPES ================= */

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    product: ProductAPI | null;
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
    Price: number;
    Id_category_product: string;
    Id_brand: string;
}

/* ================= COMPONENT ================= */

export default function EditProductModal({
    open,
    onClose,
    onSuccess,
    product,
}: Props) {
    const router = useRouter();

    const [images, setImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);

    const [form, setForm] = useState<ProductForm>({
        Name_product: "",
        Quantity: 0,
        Price: 0,
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
        [handleUnauthorized],
    );

    /* ================= LOAD PRODUCT ================= */

    useEffect(() => {
        if (!product) return;

        const matchCat = categories.find((c) => c.Name_category === product.Category_Name);
        const matchBr = brands.find((b) => b.Name_brand === product.Brand_Name);

        setForm({
            Name_product: product.Name_product,
            Quantity: product.Quantity,
            Price: product.Price,
            Id_category_product: matchCat ? String(matchCat.Id_category_products) : "",
            Id_brand: matchBr ? String(matchBr.Id_brand) : "",
        });

        setImages([]);

        if (product.Thumbnail) {
            const imageUrl = product.Thumbnail.startsWith("http")
                ? product.Thumbnail
                : `${API_BASE}${product.Thumbnail}`;
            setPreviewUrls([imageUrl]);
        } else {
            setPreviewUrls([]);
        }
    }, [product, categories, brands]);

    /* ================= FETCH CATEGORY + BRAND ================= */

    useEffect(() => {
        if (!open) return;

        const fetchData = async () => {
            const [cateRes, brandRes] = await Promise.all([
                authorizedFetch(`${API_BASE}/api/danhmucsanpham`),
                authorizedFetch(`${API_BASE}/api/nhacungcap`),
            ]);

            setCategories(await cateRes.json());
            setBrands(await brandRes.json());
        };

        fetchData();
    }, [open, authorizedFetch]);

    /* ================= HANDLE CHANGE ================= */

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value, type } = e.target;
        setErrors((prev) => ({ ...prev, [name]: undefined }));

        setForm((prev) => ({
            ...prev,
            [name]: type === "number" ? Number(value) : value,
        }));
    };

    /* ================= IMAGE CHANGE ================= */

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        if (!files.length) return;

        const newImages = [...images, ...files];
        setImages(newImages);

        const newPreviews = [
            ...previewUrls,
            ...files.map((file) => URL.createObjectURL(file)),
        ];

        setPreviewUrls(newPreviews);
    };

    /* ================= SUBMIT ================= */

    const handleSubmit = async () => {
        if (!product) return;

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

            formData.append("Name_product", form.Name_product);
            formData.append("Quantity", String(form.Quantity));
            formData.append("Price", String(form.Price));
            formData.append("Id_category_product", form.Id_category_product);
            formData.append("Id_brand", form.Id_brand);

            images.forEach((img) => {
                formData.append("images", img);
            });

            const res = await authorizedFetch(
                `${API_BASE}/api/sanpham/${product.Id_product}`,
                {
                    method: "PUT",
                    body: formData,
                },
            );

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.error("Lỗi từ server:", errData);
                throw new Error("Lỗi gọi server");
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Sửa sản phẩm thất bại", error);
            alert("Lỗi không thể lưu thông tin! Vui lòng thử lại.");
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
            <div className="bg-white w-[600px] rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Sửa sản phẩm</h2>

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
                        label="Giá"
                        name="Price"
                        type="number"
                        value={form.Price}
                        onChange={handleChange}
                        error={errors.Price}
                    />

                    <Select
                        label="Danh mục"
                        name="Id_category_product"
                        value={form.Id_category_product}
                        data={categories}
                        valueKey="Id_category_products"
                        labelKey="Name_category"
                        onChange={handleChange}
                        error={errors.Id_category_product}
                    />

                    <Select
                        label="Thương hiệu"
                        name="Id_brand"
                        value={form.Id_brand}
                        data={brands}
                        valueKey="Id_brand"
                        labelKey="Name_brand"
                        onChange={handleChange}
                        error={errors.Id_brand}
                    />
                </div>

                {/* IMAGE */}

                <div className="mt-6">
                    <label className="text-sm font-semibold block mb-3">
                        Hình ảnh sản phẩm
                    </label>

                    <input
                        id="edit-product-images"
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                    />

                    <div className="grid grid-cols-4 gap-4">
                        {previewUrls.map((url, index) => (
                            <div
                                key={index}
                                className="relative w-full h-[140px] border rounded-lg overflow-hidden group"
                            >
                                <img src={url} className="w-full h-full object-cover" />

                                <button
                                    type="button"
                                    onClick={() => {
                                        const newImgs = images.filter((_, i) => i !== index);
                                        const newPre = previewUrls.filter((_, i) => i !== index);
                                        setImages(newImgs);
                                        setPreviewUrls(newPre);
                                    }}
                                    className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100"
                                >
                                    X
                                </button>
                            </div>
                        ))}

                        <label
                            htmlFor="edit-product-images"
                            className="w-full h-[140px] border-2 border-dashed rounded-lg
      flex flex-col items-center justify-center cursor-pointer
      hover:bg-gray-50"
                        >
                            <span className="text-3xl text-gray-400">＋</span>
                            <span className="text-xs text-gray-500 mt-1">Thêm ảnh</span>
                        </label>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 border rounded">
                        Huỷ
                    </button>

                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        Lưu
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ================= INPUT ================= */

function Input({ label, error, ...props }: any) {
    return (
        <div>
            <label className={`text-sm font-medium ${error ? 'text-red-500' : 'text-slate-700'}`}>{label}</label>
            <input {...props} className={`w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring-1 ${error ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-slate-300 focus:ring-blue-500'}`} />
            {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}
        </div>
    );
}

/* ================= SELECT ================= */

function Select({ label, data, valueKey, labelKey, error, ...props }: any) {
    return (
        <div>
            <label className={`text-sm font-medium ${error ? 'text-red-500' : 'text-slate-700'}`}>{label}</label>
            <select {...props} className={`w-full border rounded-lg p-2 mt-1 focus:outline-none focus:ring-1 ${error ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-slate-300 focus:ring-blue-500'}`}>
                <option value="">-- Chọn --</option>
                {data.map((item: any) => (
                    <option key={item[valueKey]} value={item[valueKey]}>
                        {item[labelKey]}
                    </option>
                ))}
            </select>
            {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}
        </div>
    );
}