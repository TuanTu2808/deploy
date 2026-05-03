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
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.id;
    const {
      items,
      receiver_name,
      phone,
      province,
      ward,
      address_detail,
      id_payment,
      total_amount,
      discount_amount,
      final_amount,
    } = req.body;

    if (!receiver_name || !phone || !province || !ward || !address_detail) {
      return res.status(400).json({
        message: "Thiếu thông tin địa chỉ nhận hàng",
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "Giỏ hàng trống",
      });
    }
    const [result] = await database.query(
      `
  INSERT INTO Orders
  (Id_user, Created_order, Total_amount, Discount_amount, Final_amount,
   Status, Status_payment, Receiver_name, Phone,
   Province, Ward, Address_detail, Id_payment)
  VALUES (?, NOW(), ?, ?, ?, 'pending', 0, ?, ?, ?, ?, ?, ?)
  `,
      [
        userId,
        total_amount,
        discount_amount,
        final_amount,
        receiver_name,
        phone,
        province,
        ward,
        address_detail,
        id_payment,
      ],
    );

    const orderId = result.insertId;

    for (const item of items) {
      const [productRows] = await database.query(
        "SELECT Quantity FROM Products WHERE Id_product = ?",
        [item.Id_product],
      );

      const product = productRows[0];

      // nếu sản phẩm không tồn tại
      if (!product) {
        return res.status(404).json({
          message: "Sản phẩm không tồn tại",
        });
      }

      // nếu hết hàng
      if (product.Quantity === 0) {
        return res.status(400).json({
          message: "Sản phẩm này đã hết hàng",
        });
      }

      // nếu số lượng mua lớn hơn tồn kho
      if (product.Quantity < item.Quantity) {
        return res.status(400).json({
          message: "Số lượng sản phẩm trong kho không đủ",
        });
      }

      // lưu order detail
      await database.query(
        `
    INSERT INTO Order_detail (Id_order, Id_product, Quantity, Price)
    VALUES (?, ?, ?, ?)
    `,
        [orderId, item.Id_product, item.Quantity, item.Price],
      );

      // trừ tồn kho
      await database.query(
        `
    UPDATE Products
    SET Quantity = Quantity - ?
    WHERE Id_product = ?
    `,
        [item.Quantity, item.Id_product],
      );
    }

    return res.status(201).json({
      message: "Tạo đơn thành công",
      orderId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.id;
    const status = String(req.query.status ?? "")
      .trim()
      .toLowerCase();
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
      query += " AND LOWER(o.Status) = ?";
      params.push(status);
    }

    if (search) {
      const maybeOrderId = parseOrderId(search);
      query +=
        " AND (o.Id_order = ? OR o.Receiver_name LIKE ? OR o.Phone LIKE ?)";
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
      [orderIds],
    );

    const itemMap = new Map();
    for (const item of itemRows) {
      const list = itemMap.get(item.Id_order) || [];
      list.push(item);
      itemMap.set(item.Id_order, list);
    }

    const orders = orderRows.map((order) => {
      const items = itemMap.get(order.Id_order) || [];
      const totalItems = items.reduce(
        (sum, item) => sum + Number(item.Quantity || 0),
        0,
      );
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
      [orderId, userId],
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
      [orderId],
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
router.get("/", async (req, res) => {
  try {
    const [orders] = await database.query(`
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
        pm.Name AS Payment_method_name
      FROM Orders o
      LEFT JOIN Payment_Method pm 
      ON o.Id_payment = pm.Id_payment_method
      ORDER BY o.Created_order DESC
    `);

    const data = orders.map((o) => ({
      ...o,
      Order_code: toOrderCode(o.Id_order),
    }));

    res.json({ orders: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});
router.put("/:id/status", async (req, res) => {
  const { status } = req.body;
  const id = req.params.id;

  try {
    let payment = 0;

    if (status === "completed") payment = 1;
    if (status === "cancelled") payment = 0;

    // Lấy trạng thái hiện tại của đơn hàng để tránh hoàn số lượng nhiều lần
    const [currentOrder] = await database.query(
      `SELECT Status FROM Orders WHERE Id_order = ?`,
      [id]
    );

    if (currentOrder.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    const currentStatus = currentOrder[0].Status;

    // Nếu đơn hàng chuyển sang trạng thái cancelled và trước đó chưa cancelled
    if (status === "cancelled" && currentStatus !== "cancelled") {
      const [details] = await database.query(
        `SELECT Id_product, Quantity FROM Order_detail WHERE Id_order = ?`,
        [id]
      );
      
      for (const item of details) {
        await database.query(
          `UPDATE Products SET Quantity = Quantity + ? WHERE Id_product = ?`,
          [item.Quantity, item.Id_product]
        );
      }
    }

    await database.query(
      `UPDATE Orders 
       SET Status = ?, Status_payment = ?
       WHERE Id_order = ?`,
      [status, payment, id],
    );

    res.json({ message: "Cập nhật thành công" });
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái đơn hàng:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

router.put("/:id/payment", async (req, res) => {
  const id = req.params.id;
  try {
    await database.query(
      `UPDATE Orders SET Status_payment = 1 WHERE Id_order = ?`,
      [id]
    );
    res.json({ message: "Thanh toán thành công" });
  } catch (error) {
    console.error("Lỗi cập nhật thanh toán:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;
