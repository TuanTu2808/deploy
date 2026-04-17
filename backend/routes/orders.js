import express from "express";
import database from "../database.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const ALLOWED_STATUS = ["pending", "confirmed", "processing", "completed", "cancelled"];

const toOrderCode = (id) => `ODR-${String(id).padStart(6, "0")}`;
const parseOrderId = (raw) => {
  const digits = String(raw ?? "").replace(/[^\d]/g, "");
  return Number(digits);
};

router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.id;
    const status = String(req.query.status ?? "").trim().toLowerCase();
    const search = String(req.query.search ?? "").trim();

    let query = `
      SELECT
        o.Id_order,
        o.Created_order,
        o.Total_amount,
        o.Discount_amount,
        o.Final_amount,
        o.Status,
        o.Status_payment,
        o.Receiver_name,
        o.Phone,
        o.Province,
        o.Ward,
        o.Address_detail,
        o.Id_payment,
        pm.Name AS Payment_method_name
      FROM Orders o
      LEFT JOIN Payment_Method pm ON o.Id_payment = pm.Id_payment_method
      WHERE o.Id_user = ?
    `;
    const params = [userId];

    if (status && ALLOWED_STATUS.includes(status)) {
      query += " AND o.Status = ?";
      params.push(status);
    }

    if (search) {
      const maybeOrderId = parseOrderId(search);
      query += " AND (o.Id_order = ? OR o.Receiver_name LIKE ? OR o.Phone LIKE ?)";
      params.push(Number.isFinite(maybeOrderId) ? maybeOrderId : 0);
      params.push(`%${search}%`);
      params.push(`%${search}%`);
    }

    query += " ORDER BY o.Created_order DESC, o.Id_order DESC";

    const [orderRows] = await database.query(query, params);
    if (!orderRows.length) {
      return res.json({ orders: [] });
    }

    const orderIds = orderRows.map((row) => row.Id_order);
    const [itemRows] = await database.query(
      `
        SELECT
          od.Id_order,
          od.Id_product,
          od.Quantity,
          od.Price,
          p.Name_product,
          (
            SELECT Image_url
            FROM Image_products ip
            WHERE ip.Id_product = od.Id_product
            LIMIT 1
          ) AS Image_url
        FROM Order_detail od
        LEFT JOIN Products p ON p.Id_product = od.Id_product
        WHERE od.Id_order IN (?)
      `,
      [orderIds]
    );

    const itemMap = new Map();
    for (const item of itemRows) {
      const list = itemMap.get(item.Id_order) || [];
      list.push(item);
      itemMap.set(item.Id_order, list);
    }

    const orders = orderRows.map((order) => {
      const items = itemMap.get(order.Id_order) || [];
      const totalItems = items.reduce((sum, item) => sum + Number(item.Quantity || 0), 0);
      const firstItem = items[0];

      return {
        ...order,
        Order_code: toOrderCode(order.Id_order),
        Total_items: totalItems,
        First_product_name: firstItem?.Name_product || "",
        First_product_image: firstItem?.Image_url || null,
      };
    });

    return res.json({ orders });
  } catch (error) {
    console.error("Lỗi lấy lịch sử đơn hàng:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
});

router.get("/me/:orderId", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.id;
    const orderId = parseOrderId(req.params.orderId);

    if (!orderId) {
      return res.status(400).json({ message: "Mã đơn hàng không hợp lệ." });
    }

    const [orderRows] = await database.query(
      `
        SELECT
          o.Id_order,
          o.Created_order,
          o.Total_amount,
          o.Discount_amount,
          o.Final_amount,
          o.Status,
          o.Status_payment,
          o.Receiver_name,
          o.Phone,
          o.Province,
          o.Ward,
          o.Address_detail,
          o.Id_payment,
          pm.Name AS Payment_method_name
        FROM Orders o
        LEFT JOIN Payment_Method pm ON o.Id_payment = pm.Id_payment_method
        WHERE o.Id_order = ? AND o.Id_user = ?
        LIMIT 1
      `,
      [orderId, userId]
    );

    const order = orderRows[0];
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }

    const [items] = await database.query(
      `
        SELECT
          od.Id_order,
          od.Id_product,
          od.Quantity,
          od.Price,
          p.Name_product,
          p.Size,
          (
            SELECT Image_url
            FROM Image_products ip
            WHERE ip.Id_product = od.Id_product
            LIMIT 1
          ) AS Image_url
        FROM Order_detail od
        LEFT JOIN Products p ON p.Id_product = od.Id_product
        WHERE od.Id_order = ?
        ORDER BY od.Id_product ASC
      `,
      [orderId]
    );

    return res.json({
      order: {
        ...order,
        Order_code: toOrderCode(order.Id_order),
        items,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết đơn hàng:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
});

export default router;

