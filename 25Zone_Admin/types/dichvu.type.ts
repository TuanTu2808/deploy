export interface DichVu {
  Id_services: number;
  Name: string;
  Price: number;
  Sale_Price: number;
  Duration_time: number;
  Description: string | null;
  Status: number;
  Id_category: number;
  category_name: string;
  Image_URL: string | null; // 🔥 thêm dòng này
}