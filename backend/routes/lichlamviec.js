import express from "express";
import database from "../database.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { userId, date } = req.query;

    if (!userId || !date) {
      return res.status(400).json({
        message: "Thiếu userId hoặc date",
      });
    }

    const query = `
      SELECT 
        ws.Id_work_shifts,
        ws.Shift_date,
        ws.Start_time,
        ws.End_time,
        wsh.Id_work_shifts_hour,
        wsh.Hours,
        wsh.Status
      FROM Work_shifts ws
      LEFT JOIN Work_shifts_hours wsh 
        ON ws.Id_work_shifts = wsh.Id_work_shifts
      WHERE ws.Id_user = ?
        AND ws.Shift_date = ?
      ORDER BY wsh.Hours ASC
    `;

    const [rows] = await database.query(query, [userId, date]);

    if (rows.length === 0) {
      return res.json(null);
    }

    // Lấy thông tin ca làm việc (chỉ 1)
    const shift = {
      Id_work_shifts: rows[0].Id_work_shifts,
      Shift_date: rows[0].Shift_date,
      Start_time: rows[0].Start_time,
      End_time: rows[0].End_time,
    };

    // Lấy danh sách giờ (lọc null)
    const hours = rows
      .filter((r) => r.Id_work_shifts_hour !== null)
      .map((r) => ({
        Id_work_shifts_hour: r.Id_work_shifts_hour,
        Hours: r.Hours,
        Status: r.Status,
      }));

    res.json({
      shift,
      hours,
    });
  } catch (error) {
    console.error("WORKSHIFT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/danhsachkhunggiolamviec", async (req, res) => {
  try {
    const { storeId, date } = req.query;

    if (!storeId || !date) {
      return res.status(400).json({
        message: "Thiếu storeId hoặc date",
      });
    }

    const query = `
      SELECT 
        u.Id_user,
        u.Name_user,
        u.Image,
        ws.Id_work_shifts,
        ws.Shift_date,
        ws.Start_time,
        ws.End_time,
        wsh.Id_work_shifts_hour,
        wsh.Hours,
        wsh.Status
      FROM Users u
      INNER JOIN Work_shifts ws 
        ON u.Id_user = ws.Id_user
      LEFT JOIN Work_shifts_hours wsh
        ON ws.Id_work_shifts = wsh.Id_work_shifts
      WHERE u.Id_store = ?
        AND ws.Shift_date = ?
        AND u.role = 'stylist'
      ORDER BY u.Id_user, wsh.Hours ASC
    `;

    const [rows] = await database.query(query, [storeId, date]);

    if (rows.length === 0) {
      return res.json([]);
    }

    // 🔥 GROUP DATA: gom theo stylist
    const resultMap = new Map();

    for (const r of rows) {
      if (!resultMap.has(r.Id_user)) {
        resultMap.set(r.Id_user, {
          Id_user: r.Id_user,
          Name_user: r.Name_user,
          Image: r.Image,
          shift: {
            Id_work_shifts: r.Id_work_shifts,
            Shift_date: r.Shift_date,
            Start_time: r.Start_time,
            End_time: r.End_time,
          },
          hours: [],
        });
      }

      // push slot nếu có
      if (r.Id_work_shifts_hour) {
        resultMap.get(r.Id_user).hours.push({
          Id_work_shifts_hour: r.Id_work_shifts_hour,
          Hours: r.Hours,
          Status: r.Status,
        });
      }
    }

    res.json(Array.from(resultMap.values()));
  } catch (error) {
    console.error("STYLIST WITH SLOTS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// Lấy lịch làm việc của nhiều nhân viên trong một khoảng thời gian (1 tuần)
router.get("/week", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Thiếu startDate hoặc endDate" });
    }

    // Chúng ta trả về danh sách lịch để màng hình frontend map vào
    // Bạn có thể thêm userId vào query để lấy cho 1 nhân sự
    let query = `
      SELECT Id_work_shifts, Id_user, Shift_date, Start_time, End_time
      FROM Work_shifts
      WHERE Shift_date BETWEEN ? AND ?
    `;
    const params = [startDate, endDate];
    if (req.query.userId) {
      query += ` AND Id_user = ?`;
      params.push(req.query.userId);
    }
    query += ` ORDER BY Shift_date ASC`;

    const [rows] = await database.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("WORKSHIFT GET WEEK ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// Hàm hỗ trợ tạo các khung giờ (ví dụ mỗi 30 phút hoặc 1 tiếng)
function generateTimeSlots(startTime, endTime) {
  try {
    const slots = [];
    // Chuẩn hóa định dạng HH:mm:ss
    const normalizeTime = (t) => {
      if (!t) return "00:00:00";
      const parts = t.split(':');
      if (parts.length === 2) return `${t}:00`;
      return t;
    };

    const sTime = normalizeTime(startTime);
    const eTime = normalizeTime(endTime);

    const start = new Date(`1970-01-01T${sTime}`);
    const end = new Date(`1970-01-01T${eTime}`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error("Invalid Date from:", startTime, endTime);
      return [];
    }

    const slotDurationMillis = 30 * 60000;

    let current = start;
    while (current < end) {
      const hh = String(current.getHours()).padStart(2, "0");
      const mm = String(current.getMinutes()).padStart(2, "0");
      const ss = "00";
      slots.push(`${hh}:${mm}:${ss}`);
      current = new Date(current.getTime() + slotDurationMillis);
    }
    return slots;
  } catch (e) {
    console.error("generateTimeSlots error:", e);
    return [];
  }
}

// Thêm lịch làm việc mới cho 1 nhân sự
router.post("/", async (req, res) => {
  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    const { Id_user, Shift_date, Start_time, End_time } = req.body;

    if (!Id_user || !Shift_date || !Start_time || !End_time) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    // Kiểm tra xem ngày đó nhân sự đã có lịch chưa
    const [existing] = await connection.query(
      "SELECT Id_work_shifts FROM Work_shifts WHERE Id_user = ? AND Shift_date = ?",
      [Id_user, Shift_date]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Lịch làm việc cho ngày này đã tồn tại" });
    }

    // Thêm vào Work_shifts
    const insertShiftQuery = `
      INSERT INTO Work_shifts (Id_user, Shift_date, Start_time, End_time)
      VALUES (?, ?, ?, ?)
    `;
    const [shiftResult] = await connection.query(insertShiftQuery, [Id_user, Shift_date, Start_time, End_time]);
    const insertId = shiftResult.insertId;

    if (!insertId) {
      throw new Error("Failed to capture insertId from Work_shifts");
    }

    // Tạo các slot giờ vào Work_shifts_hours
    const slots = generateTimeSlots(Start_time, End_time);
    if (slots.length > 0) {
      console.log("Creating slots for shift ID:", insertId);
      const hoursData = slots.map(slot => [insertId, slot, 1]); // 1 = Trống (Available)
      const insertHoursQuery = `
        INSERT INTO Work_shifts_hours (Id_work_shifts, Hours, Status)
        VALUES ?
      `;
      await connection.query(insertHoursQuery, [hoursData]);
    }

    await connection.commit();
    res.status(201).json({ message: "Tạo lịch thành công", Id_work_shifts: insertId });
  } catch (error) {
    await connection.rollback();
    console.error("WORKSHIFT POST ERROR:", error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Thêm/Cập nhật lịch làm việc cho nhiều ngày (Batch / Weekly)
router.post("/batch", async (req, res) => {
  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    const { Id_user, dates, Start_time, End_time } = req.body;

    if (!Id_user || !dates || !Array.isArray(dates) || dates.length === 0 || !Start_time || !End_time) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const slots = generateTimeSlots(Start_time, End_time);

    for (const Shift_date of dates) {
      const [existing] = await connection.query(
        "SELECT Id_work_shifts FROM Work_shifts WHERE Id_user = ? AND Shift_date = ?",
        [Id_user, Shift_date]
      );

      let insertId;
      if (existing.length > 0) {
        insertId = existing[0].Id_work_shifts;
        // Update Shift
        await connection.query("UPDATE Work_shifts SET Start_time = ?, End_time = ? WHERE Id_work_shifts = ?", [Start_time, End_time, insertId]);

        // Dọn dẹp: Xóa TẤT CẢ các slot KHÔNG PHẢI là ĐÃ ĐẶT (Status != 0)
        await connection.query("DELETE FROM Work_shifts_hours WHERE Id_work_shifts = ? AND Status != 0", [insertId]);

        // Lấy danh sách giờ đã được giữ lại (đã đặt)
        const [bookedSlots] = await connection.query("SELECT Hours FROM Work_shifts_hours WHERE Id_work_shifts = ? AND Status = 0", [insertId]);
        const bookedHoursSet = new Set(bookedSlots.map(s => String(s.Hours).substring(0, 8)));
        const newSlots = slots.filter(s => !bookedHoursSet.has(s.substring(0, 8)));

        if (newSlots.length > 0) {
          console.log(`Updating batch: Adding ${newSlots.length} slots for shift ${insertId}`);
          const hoursData = newSlots.map(slot => [insertId, slot, 1]);
          await connection.query("INSERT INTO Work_shifts_hours (Id_work_shifts, Hours, Status) VALUES ?", [hoursData]);
        }
      } else {
        // Create new
        const [shiftResult] = await connection.query(
          "INSERT INTO Work_shifts (Id_user, Shift_date, Start_time, End_time) VALUES (?, ?, ?, ?)",
          [Id_user, Shift_date, Start_time, End_time]
        );
        insertId = shiftResult.insertId;

        if (!insertId) {
          throw new Error(`Failed to capture insertId for date ${Shift_date}`);
        }

        if (slots.length > 0) {
          const hoursData = slots.map(slot => [insertId, slot, 1]);
          await connection.query("INSERT INTO Work_shifts_hours (Id_work_shifts, Hours, Status) VALUES ?", [hoursData]);
        }
      }
    }

    await connection.commit();
    res.status(201).json({ message: "Tạo lịch hàng loạt thành công" });
  } catch (error) {
    await connection.rollback();
    console.error("WORKSHIFT BATCH ERROR:", error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Update trạng thái slot giờ (book hoặc mở lại)
router.put("/hour", async (req, res) => {
  try {
    const { Id_work_shifts_hour, Status } = req.body;

    if (!Id_work_shifts_hour || Status === undefined) {
      return res.status(400).json({
        message: "Thiếu Id_work_shifts_hour hoặc Status",
      });
    }

    const query = `
      UPDATE Work_shifts_hours
      SET Status = ?
      WHERE Id_work_shifts_hour = ?
    `;

    const [result] = await database.query(query, [
      Status,
      Id_work_shifts_hour,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Không tìm thấy slot giờ",
      });
    }

    res.json({
      message: "Cập nhật slot thành công",
      Id_work_shifts_hour,
      Status,
    });
  } catch (error) {
    console.error("UPDATE SLOT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// Chỉnh sửa lịch làm việc
router.put("/:id", async (req, res) => {
  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { Start_time, End_time } = req.body;

    if (!Start_time || !End_time) {
      return res.status(400).json({ message: "Cần Start_time và End_time" });
    }

    // Cập nhật thông tin ca làm
    const updateQuery = "UPDATE Work_shifts SET Start_time = ?, End_time = ? WHERE Id_work_shifts = ?";
    await connection.query(updateQuery, [Start_time, End_time, id]);

    // Xóa slot cũ (Chỉ khi slot đó chưa được book, giả sử Status = 0)
    // Để an toàn, có thể báo lỗi nếu có slot trạng thái khác 0 đang tồn tại ngoài giờ mới cập nhật.
    // Ở đây ta đơn giản hóa thành xóa hết slot trống dư thừa và tạo slot mới.

    // Dọn dẹp: Xóa TẤT CẢ các slot KHÔNG PHẢI là ĐÃ ĐẶT (Status != 0)
    await connection.query(
      "DELETE FROM Work_shifts_hours WHERE Id_work_shifts = ? AND Status != 0",
      [id]
    );

    // Kiểm tra những slot đã còn lại (đã đặt)
    const [bookedSlots] = await connection.query(
      "SELECT Hours FROM Work_shifts_hours WHERE Id_work_shifts = ? AND Status = 0",
      [id]
    );
    const bookedHoursSet = new Set(bookedSlots.map(s => String(s.Hours).substring(0, 8)));

    // Tạo slots mới nếu chưa nằm trong bookedHoursSet
    const slots = generateTimeSlots(Start_time, End_time);
    const newSlots = slots.filter(s => !bookedHoursSet.has(s.substring(0, 8)));

    if (newSlots.length > 0) {
      console.log(`Updating single PUT: Adding ${newSlots.length} slots for shift ${id}`);
      const hoursData = newSlots.map(slot => [id, slot, 1]);
      const insertHoursQuery = `
        INSERT INTO Work_shifts_hours (Id_work_shifts, Hours, Status)
        VALUES ?
      `;
      await connection.query(insertHoursQuery, [hoursData]);
    }

    await connection.commit();
    res.json({ message: "Cập nhật thành công" });
  } catch (error) {
    await connection.rollback();
    console.error("WORKSHIFT PUT ERROR:", error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Xóa lịch làm việc
router.delete("/:id", async (req, res) => {
  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;

    // Kiểm tra xem có đơn book trong giờ này không (Status = 0)
    const [bookedSlots] = await connection.query(
      "SELECT Id_work_shifts_hour FROM Work_shifts_hours WHERE Id_work_shifts = ? AND Status = 0",
      [id]
    );

    if (bookedSlots.length > 0) {
      return res.status(400).json({ message: "Không thể xóa lịch đã có lịch đặt hoặc đang hoạt động" });
    }

    // Cấp phát tầng foreign key cascade delete nếu có trong DB, nếu không thì tự xóa Work_shifts_hours trước
    await connection.query("DELETE FROM Work_shifts_hours WHERE Id_work_shifts = ?", [id]);
    await connection.query("DELETE FROM Work_shifts WHERE Id_work_shifts = ?", [id]);

    await connection.commit();
    res.json({ message: "Xóa thành công" });
  } catch (error) {
    await connection.rollback();
    console.error("WORKSHIFT DELETE ERROR:", error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

export default router;