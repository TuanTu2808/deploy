import express from "express";
import database from "../database.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await database.query(`
      SELECT 
        bri.Id_Collection_hair,
        bri.Image,
        bri.Id_booking,
        b.Start_time,
        st.Name_user AS Stylist_name,
        GROUP_CONCAT(sv.Name SEPARATOR ' + ') AS Service_names
      FROM booking_result_images bri
      LEFT JOIN bookings b ON bri.Id_booking = b.Id_booking
      LEFT JOIN users st ON b.Id_stylist = st.Id_user
      LEFT JOIN booking_detail bd ON b.Id_booking = bd.Id_booking
      LEFT JOIN services sv ON bd.Id_services = sv.Id_services
      GROUP BY bri.Id_Collection_hair
      ORDER BY bri.Id_Collection_hair DESC
    `);
    
    const data = rows.map(r => ({
      title: r.Service_names || 'Kiểu tóc 25ZONE',
      desc: r.Stylist_name 
        ? `Thực hiện bởi: ${r.Stylist_name} (${new Date(r.Start_time).toLocaleDateString("vi-VN")})` 
        : 'Sản phẩm tại 25ZONE',
      tag: 'Trending',
      image: r.Image
    }));

    res.json(data);
  } catch (error) {
    console.error("Lỗi lấy bộ sưu tập:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;
