"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DichVu } from "@/types"; 
import { API_BASE, authorizedAdminFetch, clearAdminSession } from "@/app/lib/admin-auth";

interface Category {
    Id_category_service: number;
    Name: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    onCreated: () => void | Promise<void>;
    initialData?: DichVu | null; // 🔥 hỗ trợ edit
}

interface FormState {
    Name: string;
    Id_category: string;
    Price: string;
    Sale_Price: string;
    Duration_time: string;
    Status: string;
    Description: string;
}

const defaultForm: FormState = {
    Name: "",
    Id_category: "",
    Price: "",
    Sale_Price: "",
    Duration_time: "",
    Status: "1",
    Description: "",
};

export default function DichVuForm({
    open,
    onClose,
    onCreated,
    initialData,
}: Props) {
    const router = useRouter();

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<File[]>([]);
    const [form, setForm] = useState<FormState>(defaultForm);
    const isEdit = Boolean(initialData);

    const handleUnauthorized = useCallback(() => {
        clearAdminSession();
        router.replace("/admin/login");
    }, [router]);

    const authorizedFetch = useCallback(
        (input: string, init: RequestInit = {}) =>
            authorizedAdminFetch(input, init, handleUnauthorized),
        [handleUnauthorized]
    );

    // Fetch danh mục
    useEffect(() => {
        if (open) {
            authorizedFetch(`${API_BASE}/api/danhmucdichvu`)
                .then((res) => res.json())
                .then((data: Category[]) => setCategories(data))
                .catch((err) => console.error("Lỗi load danh mục:", err));
        }
    }, [open, authorizedFetch]);

    // 🔥 Auto fill khi edit
    useEffect(() => {
        if (open && initialData) {
            setForm({
                Name: initialData.Name ?? "",
                Id_category: initialData.Id_category?.toString() ?? "",
                Price: initialData.Price?.toString() ?? "",
                Sale_Price: initialData.Sale_Price?.toString() ?? "0",
                Duration_time: initialData.Duration_time?.toString() ?? "",
                Status: initialData.Status?.toString() ?? "1",
                Description: initialData.Description ?? "",
            });
        }

        // Reset khi mở modal create
        if (open && !initialData) {
            setForm(defaultForm);
            setImages([]);
        }
    }, [open, initialData]);

    if (!open) return null;

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setImages(Array.from(e.target.files));
    };

    const handleClose = () => {
        setForm(defaultForm);
        setImages([]);
        onClose();
    };

const handleSubmit = async () => {
    try {
        setLoading(true);

        if (!form.Name || !form.Id_category || !form.Price || !form.Duration_time) {
            alert("Vui lòng nhập đầy đủ thông tin bắt buộc");
            return;
        }

        const payload = {
            Name: form.Name,
            Id_category: Number(form.Id_category),
            Price: Number(form.Price),
            Sale_Price: Number(form.Sale_Price || 0),
            Duration_time: Number(form.Duration_time),
            Status: Number(form.Status),
            Description: form.Description || null,
        };

        if (isEdit && initialData) {
            const res = await authorizedFetch(
                `${API_BASE}/api/dichvu/${initialData.Id_services}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Cập nhật dịch vụ thất bại");
            }

            // Upload ảnh khi edit
            if (images.length > 0) {
                const formData = new FormData();
                images.forEach((file) => formData.append("images", file));
                formData.append("Id_services", initialData.Id_services.toString());

                const uploadRes = await authorizedFetch(
                    `${API_BASE}/api/hinhanhdichvu`,
                    { method: "POST", body: formData }
                );

                if (!uploadRes.ok) {
                    const err = await uploadRes.json();
                    throw new Error(err.error || "Upload ảnh thất bại");
                }
            }

            alert("Cập nhật dịch vụ thành công!");
        } else {
            const res = await authorizedFetch(`${API_BASE}/api/dichvu`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Tạo dịch vụ thất bại");
            }

            const data = await res.json();
            console.log("CREATE RESPONSE:", data);

            const serviceId =
                data.Id_services ||
                data.insertId ||
                data.id ||
                data;

            if (!serviceId) {
                throw new Error("Không lấy được Id_services");
            }

            if (images.length > 0) {
                const formData = new FormData();
                images.forEach((file) => formData.append("images", file));
                formData.append("Id_services", serviceId.toString());

                const uploadRes = await authorizedFetch(
                    `${API_BASE}/api/hinhanhdichvu`,
                    { method: "POST", body: formData }
                );

                if (!uploadRes.ok) {
                    const err = await uploadRes.json();
                    throw new Error(err.error || "Upload ảnh thất bại");
                }
            }

            alert("Thêm dịch vụ thành công!");
        }

        await onCreated();
        handleClose();
    } catch (error) {
        console.error("Lỗi submit dịch vụ:", error);
        alert(error instanceof Error ? error.message : "Không thể lưu dịch vụ");
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-[650px] rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4 text-[#003366]">
                    {isEdit ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
                </h2>

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="text-sm font-medium">Tên dịch vụ *</label>
                        <input
                            name="Name"
                            value={form.Name}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="text-sm font-medium">Mô tả</label>
                        <textarea
                            name="Description"
                            value={form.Description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Danh mục *</label>
                        <select
                            name="Id_category"
                            value={form.Id_category}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                        >
                            <option value="">-- Chọn danh mục --</option>
                            {categories.map((cat) => (
                                <option key={cat.Id_category_service} value={cat.Id_category_service}>
                                    {cat.Name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Giá *</label>
                        <input
                            type="number"
                            name="Price"
                            value={form.Price}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Giảm giá (%)</label>
                        <input
                            type="number"
                            name="Sale_Price"
                            value={form.Sale_Price}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Thời lượng (phút) *</label>
                        <input
                            type="number"
                            name="Duration_time"
                            value={form.Duration_time}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">Trạng thái</label>
                        <select
                            name="Status"
                            value={form.Status}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-3 py-2"
                        >
                            <option value="1">Hoạt động</option>
                            <option value="0">Tạm ngưng</option>
                        </select>
                    </div>

                    <div className="col-span-2">
                        <label className="text-sm font-medium">
                            {isEdit ? "Upload ảnh mới (tuỳ chọn)" : "Hình ảnh dịch vụ"}
                        </label>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full border rounded-lg px-3 py-2"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={handleClose} className="px-4 py-2 border rounded-lg">
                        Huỷ
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 bg-[#0B3C6D] text-white rounded-lg"
                    >
                        {loading
                            ? "Đang lưu..."
                            : isEdit
                                ? "Cập nhật dịch vụ"
                                : "Lưu dịch vụ"}
                    </button>
                </div>
            </div>
        </div>
    );
}
