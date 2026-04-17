import express from "express";
import database from "../database.js";

const router = express.Router();

const normalizeText = (value) => String(value ?? "").trim();
const toOrderCode = (id) => `ORD-${String(id).padStart(6, "0")}`;
const parseOrderId = (raw) => Number(String(raw ?? "").replace(/[^\d]/g, ""));

const ALLOWED_STATUS = ["pending", "confirmed", "processing", "completed", "cancelled"];

const getOrderById = async (orderId) => {
  const [rows] = await database.query(
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
        o.Id_user,
        o.Id_payment,
        o.Id_voucher,
        u.Name_user,
        u.Email,
        pm.Name AS Payment_method_name
      FROM Orders o
      LEFT JOIN Users u ON u.Id_user = o.Id_user
      LEFT JOIN Payment_Method pm ON pm.Id_payment_method = o.Id_payment
      WHERE o.Id_order = ?
      LIMIT 1
    `,
    [orderId]
  );

  return rows[0] || null;
};

router.get("/", async (req, res) => {
  try {
    const search = normalizeText(req.query.search);
    const status = normalizeText(req.query.status).toLowerCase();
    const paymentStatus = normalizeText(req.query.paymentStatus);

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
        o.Id_user,
        o.Id_payment,
        o.Id_voucher,
        u.Name_user,
        u.Email,
        pm.Name AS Payment_method_name,
        COUNT(od.Id_product) AS Total_line_items
      FROM Orders o
      LEFT JOIN Users u ON u.Id_user = o.Id_user
      LEFT JOIN Payment_Method pm ON pm.Id_payment_method = o.Id_payment
      LEFT JOIN Order_detail od ON od.Id_order = o.Id_order
    `;

    const where = [];
    const params = [];

    if (search) {
      const orderId = parseOrderId(search);
      where.push(
        "(o.Id_order = ? OR u.Name_user LIKE ? OR u.Email LIKE ? OR o.Phone LIKE ? OR o.Receiver_name LIKE ?)"
      );
      params.push(Number.isFinite(orderId) ? orderId : 0);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status && ALLOWED_STATUS.includes(status)) {
      where.push("o.Status = ?");
      params.push(status);
    }

    if (paymentStatus === "0" || paymentStatus === "1") {
      where.push("o.Status_payment = ?");
      params.push(Number(paymentStatus));
    }

    if (where.length) {
      query += ` WHERE ${where.join(" AND ")}`;
    }

    query += `
      GROUP BY
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
        o.Id_user,
        o.Id_payment,
        o.Id_voucher,
        u.Name_user,
        u.Email,
        pm.Name
      ORDER BY o.Created_order DESC, o.Id_order DESC
    `;

    const [rows] = await database.query(query, params);
    const data = rows.map((row) => ({
      ...row,
      Order_code: toOrderCode(row.Id_order),
    }));

    return res.json(data);
  } catch (error) {
    console.error("Lỗi lấy danh sách đơn hàng admin:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const orderId = parseOrderId(req.params.id);
    if (!orderId) {
      return res.status(400).json({ message: "Id đơn hàng không hợp lệ." });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }

    const [items] = await database.query(
      `
        SELECT
          od.Id_order,
          od.Id_product,
          od.Price,
          od.Quantity,
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
      `,
      [orderId]
    );

    return res.json({
      ...order,
      Order_code: toOrderCode(order.Id_order),
      items,
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết đơn hàng admin:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
});

router.post("/", async (req, res) => {
  const connection = await database.getConnection();

  try {
    const idUser = Number(req.body?.Id_user);
    const receiverName = normalizeText(req.body?.Receiver_name);
    const phone = normalizeText(req.body?.Phone);
    const province = normalizeText(req.body?.Province);
    const ward = normalizeText(req.body?.Ward);
    const addressDetail = normalizeText(req.body?.Address_detail);
    const status = normalizeText(req.body?.Status || "pending").toLowerCase();
    const statusPayment = Number(req.body?.Status_payment || 0) === 1 ? 1 : 0;
    const idPayment = Number(req.body?.Id_payment || 1);
    const idVoucher = req.body?.Id_voucher ? Number(req.body.Id_voucher) : null;

    const items = Array.isArray(req.body?.items)
      ? req.body.items
          .map((item) => ({
            Id_product: Number(item?.Id_product),
            Quantity: Number(item?.Quantity || 0),
            Price: item?.Price !== undefined ? Number(item.Price) : null,
          }))
          .filter((item) => item.Id_product > 0 && item.Quantity > 0)
      : [];

    if (!idUser || !receiverName || !phone || !province || !ward || !addressDetail) {
      return res.status(400).json({ message: "Thiếu thông tin đơn hàng bắt buộc." });
    }
    if (!items.length) {
      return res.status(400).json({ message: "Đơn hàng phải có ít nhất 1 sản phẩm." });
    }
    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ message: "Trạng thái đơn không hợp lệ." });
    }

    await connection.beginTransaction();

    const [userRows] = await connection.query(
      "SELECT Id_user FROM Users WHERE Id_user = ? LIMIT 1",
      [idUser]
    );
    if (!userRows.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    const [paymentRows] = await connection.query(
      "SELECT Id_payment_method FROM Payment_Method WHERE Id_payment_method = ? LIMIT 1",
      [idPayment]
    );
    if (!paymentRows.length) {
      await connection.rollback();
      return res.status(400).json({ message: "Phương thức thanh toán không hợp lệ." });
    }

    const productIds = items.map((item) => item.Id_product);
    const [productRows] = await connection.query(
      `
        SELECT Id_product, Price, Sale_Price
        FROM Products
        WHERE Id_product IN (?)
      `,
      [productIds]
    );
    if (productRows.length !== productIds.length) {
      await connection.rollback();
      return res.status(400).json({ message: "Có sản phẩm không tồn tại." });
    }

    const productMap = new Map(productRows.map((row) => [row.Id_product, row]));

    let totalAmount = 0;
    const detailValues = items.map((item) => {
      const product = productMap.get(item.Id_product);
      const priceFromProduct =
        Number(product?.Sale_Price || 0) > 0 ? Number(product?.Sale_Price) : Number(product?.Price || 0);
      const price = Number.isFinite(item.Price) && item.Price > 0 ? item.Price : priceFromProduct;
      totalAmount += price * item.Quantity;
      return [item.Id_product, price, item.Quantity];
    });

    const discountAmount = Number(req.body?.Discount_amount || 0);
    const finalAmountRaw =
      req.body?.Final_amount !== undefined ? Number(req.body.Final_amount) : totalAmount - discountAmount;
    const finalAmount = finalAmountRaw < 0 ? 0 : finalAmountRaw;

    const [orderResult] = await connection.query(
      `
        INSERT INTO Orders
          (
            Total_amount,
            Discount_amount,
            Final_amount,
            Status,
            Status_payment,
            Receiver_name,
            Phone,
            Province,
            Ward,
            Address_detail,
            Id_user,
            Id_payment,
            Id_voucher
          )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        totalAmount,
        discountAmount,
        finalAmount,
        status,
        statusPayment,
        receiverName,
        phone,
        province,
        ward,
        addressDetail,
        idUser,
        idPayment,
        idVoucher,
      ]
    );

    const orderId = orderResult.insertId;
    await connection.query(
      `
        INSERT INTO Order_detail
          (Id_product, Id_order, Price, Quantity)
        VALUES ?
      `,
      [detailValues.map((item) => [item[0], orderId, item[1], item[2]])]
    );

    await connection.commit();

    return res.status(201).json({
      message: "Tạo đơn hàng thành công.",
      Id_order: orderId,
      Order_code: toOrderCode(orderId),
    });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi tạo đơn hàng admin:", error);
    return res.status(500).json({ message: "Lỗi server." });
  } finally {
    connection.release();
  }
});

router.put("/:id", async (req, res) => {
  const connection = await database.getConnection();

  try {
    const orderId = parseOrderId(req.params.id);
    if (!orderId) {
      return res.status(400).json({ message: "Id đơn hàng không hợp lệ." });
    }

    const current = await getOrderById(orderId);
    if (!current) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }

    const receiverName = normalizeText(req.body?.Receiver_name) || current.Receiver_name;
    const phone = normalizeText(req.body?.Phone) || current.Phone;
    const province = normalizeText(req.body?.Province) || current.Province;
    const ward = normalizeText(req.body?.Ward) || current.Ward;
    const addressDetail = normalizeText(req.body?.Address_detail) || current.Address_detail;
    const status = normalizeText(req.body?.Status || current.Status).toLowerCase();
    const statusPayment =
      req.body?.Status_payment !== undefined ? (Number(req.body.Status_payment) === 1 ? 1 : 0) : current.Status_payment;
    const idPayment = Number(req.body?.Id_payment || current.Id_payment || 1);
    const discountAmount =
      req.body?.Discount_amount !== undefined ? Number(req.body.Discount_amount) : Number(current.Discount_amount || 0);

    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ message: "Trạng thái đơn không hợp lệ." });
    }

    const items = Array.isArray(req.body?.items)
      ? req.body.items
          .map((item) => ({
            Id_product: Number(item?.Id_product),
            Quantity: Number(item?.Quantity || 0),
            Price: item?.Price !== undefined ? Number(item.Price) : null,
          }))
          .filter((item) => item.Id_product > 0 && item.Quantity > 0)
      : null;

    await connection.beginTransaction();

    let totalAmount = Number(current.Total_amount || 0);
    let finalAmount = Number(current.Final_amount || 0);

    if (items && items.length) {
      const productIds = items.map((item) => item.Id_product);
      const [productRows] = await connection.query(
        `
          SELECT Id_product, Price, Sale_Price
          FROM Products
          WHERE Id_product IN (?)
        `,
        [productIds]
      );
      if (productRows.length !== productIds.length) {
        await connection.rollback();
        return res.status(400).json({ message: "Có sản phẩm không tồn tại." });
      }

      const productMap = new Map(productRows.map((row) => [row.Id_product, row]));
      const detailValues = items.map((item) => {
        const product = productMap.get(item.Id_product);
        const fallbackPrice =
          Number(product?.Sale_Price || 0) > 0 ? Number(product?.Sale_Price) : Number(product?.Price || 0);
        const price = Number.isFinite(item.Price) && item.Price > 0 ? item.Price : fallbackPrice;
        return [item.Id_product, orderId, price, item.Quantity];
      });

      totalAmount = detailValues.reduce((sum, detail) => sum + Number(detail[2]) * Number(detail[3]), 0);
      finalAmount = Math.max(0, totalAmount - discountAmount);

      await connection.query("DELETE FROM Order_detail WHERE Id_order = ?", [orderId]);
      await connection.query(
        `
          INSERT INTO Order_detail (Id_product, Id_order, Price, Quantity)
          VALUES ?
        `,
        [detailValues]
      );
    } else {
      finalAmount =
        req.body?.Final_amount !== undefined
          ? Math.max(0, Number(req.body.Final_amount))
          : Math.max(0, totalAmount - discountAmount);
    }

    await connection.query(
      `
        UPDATE Orders
        SET
          Total_amount = ?,
          Discount_amount = ?,
          Final_amount = ?,
          Status = ?,
          Status_payment = ?,
          Receiver_name = ?,
          Phone = ?,
          Province = ?,
          Ward = ?,
          Address_detail = ?,
          Id_payment = ?
        WHERE Id_order = ?
      `,
      [
        totalAmount,
        discountAmount,
        finalAmount,
        status,
        statusPayment,
        receiverName,
        phone,
        province,
        ward,
        addressDetail,
        idPayment,
        orderId,
      ]
    );

    await connection.commit();

    return res.json({ message: "Cập nhật đơn hàng thành công." });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi cập nhật đơn hàng admin:", error);
    return res.status(500).json({ message: "Lỗi server." });
  } finally {
    connection.release();
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const orderId = parseOrderId(req.params.id);
    if (!orderId) {
      return res.status(400).json({ message: "Id đơn hàng không hợp lệ." });
    }

    const status = normalizeText(req.body?.Status).toLowerCase();
    const statusPayment = req.body?.Status_payment;

    if (!status && statusPayment === undefined) {
      return res.status(400).json({ message: "Thiếu dữ liệu cập nhật trạng thái." });
    }
    if (status && !ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ message: "Trạng thái đơn không hợp lệ." });
    }

    const sets = [];
    const params = [];

    if (status) {
      sets.push("Status = ?");
      params.push(status);
    }
    if (statusPayment !== undefined) {
      sets.push("Status_payment = ?");
      params.push(Number(statusPayment) === 1 ? 1 : 0);
    }

    const [result] = await database.query(
      `UPDATE Orders SET ${sets.join(", ")} WHERE Id_order = ?`,
      [...params, orderId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }

    return res.json({ message: "Cập nhật trạng thái đơn hàng thành công." });
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái đơn hàng:", error);
    return res.status(500).json({ message: "Lỗi server." });
  }
});

router.delete("/:id", async (req, res) => {
  const connection = await database.getConnection();

  try {
    const orderId = parseOrderId(req.params.id);
    if (!orderId) {
      return res.status(400).json({ message: "Id đơn hàng không hợp lệ." });
    }

    await connection.beginTransaction();

    await connection.query("DELETE FROM Order_detail WHERE Id_order = ?", [orderId]);
    const [result] = await connection.query("DELETE FROM Orders WHERE Id_order = ?", [orderId]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
    }

    await connection.commit();
    return res.json({ message: "Xóa đơn hàng thành công." });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi xóa đơn hàng admin:", error);
    return res.status(500).json({ message: "Lỗi server." });
  } finally {
    connection.release();
  }
});

export default router;

