export interface Stat {
    title: string;
    value: number;
    sub: string;
    color: string;
    icon: string;
}

export interface ProductAPI {
    Id_product: number;
    Name_product: string;
    Quantity: number;
    Size: string;
    Price: number;
    Sale_Price: number | null;
    Description: string;
    Status: number;
    Category_Name: string;
    Brand_Name: string;
    Thumbnail?: string; // <<< BẮT BUỘC thêm
}

export interface ProductRowData {
    name: string;
    sku: string;
    category: string;
    price: string;
    sale: string;
    stock: number;
    status: "active" | "low" | "out" | "expire";
    thumbnail?: string;
}