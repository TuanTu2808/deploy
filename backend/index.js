import "dotenv/config";
import express from "express";
import path from "path";
import cors from "cors";
import dichVuRoutes from "./routes/dichvu.js";
import combodichvuRoutes from "./routes/combodichvu.js";
import danhMucDichVuRoutes from "./routes/danhmucdichvu.js";
import hinhAnhDichVuRoutes from "./routes/hinhanhdichvu.js";
import thocatRoutes from "./routes/thocat.js";
import lichlamviecRoutes from "./routes/lichlamviec.js";
import productRoutes from "./routes/sanpham.js";
import DanhMucSanPhamRoutes from "./routes/danhmucsanpham.js";
import NhaCungCapRoutes from "./routes/nhacungcap.js";
import HinhAnhSanPhamRoutes from "./routes/hinhanhsanpham.js";
import chinhanhRouter from "./routes/chinhanh.js";
import datlichRoutes from "./routes/datlich.js";
import datlichnhanhRoutes from "./routes/datlichnhanh.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import orderRoutes from "./routes/orders.js";
import voucherBookingRoutes from "./routes/voucherBooking.js";
import adminUsersRoutes from "./routes/adminUsers.js";
import adminOrdersRoutes from "./routes/adminOrders.js";
import voucherRoutes from "./routes/voucher.js";
import adminDashboardRoutes from "./routes/adminDashboard.js";
import adminReviewsRoutes from "./routes/adminReviews.js";
import newsRoutes from "./routes/news.js";
import adminNewsRoutes from "./routes/adminNews.js";
import adminNewsCategoriesRoutes from "./routes/adminNewsCategories.js";
import bookingHomeRoutes from "./routes/bookingHome.js";
import realtimeRoutes from "./routes/realtime.js";
import bosuutapRoutes from "./routes/bosuutap.js";
import productCommentsRoutes from "./routes/productComments.js";
import { requireAdminAuth } from "./middleware/auth.js";
import { ensureAuthSchema, ensureComboSchema } from "./utils/schema.js";
import database from "./database.js";
import { startBookingContentWatcher } from "./utils/realtime.js";
import { startAutoCancelCron } from "./utils/cron.js";
import OTPRoutes from "./routes/otp.js"

const app = express();
const port = Number(process.env.PORT || 5001);

app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api/dichvu", dichVuRoutes);
app.use("/api/combodichvu", combodichvuRoutes);
app.use("/api/danhmucdichvu", danhMucDichVuRoutes);
app.use("/api/hinhanhdichvu", hinhAnhDichVuRoutes);
app.use("/api/thocat", thocatRoutes);
app.use("/api/lichlamviec", lichlamviecRoutes);
app.use("/api/sanpham", productRoutes);
app.use("/api/danhmucsanpham", DanhMucSanPhamRoutes);
app.use("/api/nhacungcap", NhaCungCapRoutes);
app.use("/api/hinhanhsanpham", HinhAnhSanPhamRoutes);
app.use("/api/chinhanh", chinhanhRouter);
app.use("/api/datlich", datlichRoutes);
app.use("/api/datlichnhanh", datlichnhanhRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/product-comments", productCommentsRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/booking/home", bookingHomeRoutes);
app.use("/api/realtime", realtimeRoutes);
app.use("/api/bosuutap", bosuutapRoutes);
app.use("/api/admin/users", requireAdminAuth, adminUsersRoutes);
app.use("/api/admin/orders", requireAdminAuth, adminOrdersRoutes);
app.use("/api/admin/dashboard", requireAdminAuth, adminDashboardRoutes);
app.use("/api/admin/reviews", requireAdminAuth, adminReviewsRoutes);
app.use("/api/admin/news", requireAdminAuth, adminNewsRoutes);
app.use("/api/admin/news-categories", requireAdminAuth, adminNewsCategoriesRoutes);
app.use("/api/voucher", voucherRoutes);
app.use("/api/voucherbooking", voucherBookingRoutes);
app.use("/api/OTP", OTPRoutes);

app.use("/image", express.static(path.join(process.cwd(), "public", "image")));

const startServer = async () => {
  try {
    await ensureAuthSchema();
    await ensureComboSchema();
    startBookingContentWatcher(database);
    startAutoCancelCron();
    app.listen(port, () => {
      console.log(`Backend chạy tại http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Không thể khởi động backend:", error);
    process.exit(1);
  }
};

startServer();
