const fs = require('fs');

const code = fs.readFileSync('routes/datlich.js', 'utf8');

const regex = /router\.patch\("\/:id", async \(req, res\) => \{[\s\S]*?\}\);/m;

const newPatch = `router.patch("/:id", async (req, res) => {
  const bookingId = Number(req.params.id);
  if (!bookingId) {
    return res.status(400).json({ message: "Id lịch hẹn không hợp lệ." });
  }

  const { status, stylistId, date, time, note, description_cancel, serviceIds, comboIds } = req.body;
  const updates = [];
  const params = [];
  const allowedStatuses = [
    "pending",
    "confirmed",
    "processing",
    "completed",
    "cancelled",
  ];

  if (status) {
    if (!allowedStatuses.includes(String(status))) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ." });
    }
    updates.push("Status = ?");
    params.push(String(status));
  }

  if (description_cancel !== undefined) {
    updates.push("Description_cancel = ?");
    params.push(String(description_cancel || ""));
  }

  if (stylistId) {
    updates.push("Id_stylist = ?");
    params.push(Number(stylistId));
  }

  if (note !== undefined) {
    updates.push("Note = ?");
    params.push(String(note ?? ""));
  }

  if (date && time) {
    const timeValue = String(time).length === 5 ? \`\${time}:00\` : String(time);
    const startTime = \`\${date} \${timeValue}\`;
    updates.push("Start_time = ?");
    params.push(startTime);
    updates.push("Booking_date = ?");
    params.push(String(date));
  } else if (date) {
    updates.push("Booking_date = ?");
    params.push(String(date));
  }

  const hasServiceChanges = Array.isArray(serviceIds) || Array.isArray(comboIds);

  if (updates.length === 0 && !hasServiceChanges) {
    return res.status(400).json({ message: "Không có dữ liệu để cập nhật." });
  }

  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Lấy thông tin lịch hẹn hiện tại (để biết slots cũ)
    const [b] = await connection.query(
      "SELECT Id_stylist, Booking_date, Start_time, Total_price, Discount_amount, Final_price FROM Bookings WHERE Id_booking = ?",
      [bookingId]
    );
    
    if (b.length === 0) {
      throw createError("Không tìm thấy lịch hẹn.", 404);
    }
    const currentBooking = b[0];

    // Lấy details cũ để tính thời lượng cũ
    const [oldDetails] = await connection.query(
      "SELECT Duration_time FROM Booking_detail WHERE Id_booking = ?",
      [bookingId]
    );
    let oldTotalDurationMin = oldDetails.reduce((sum, item) => sum + toMinutes(item.Duration_time), 0);

    // Function giải phóng slot cũ
    const releaseOldSlots = async () => {
      const { Id_stylist, Booking_date, Start_time } = currentBooking;
      if (!Id_stylist) return;

      const [shiftRows] = await connection.query(
        "SELECT Id_work_shifts FROM Work_shifts WHERE Id_user = ? AND Shift_date = ?",
        [Id_stylist, Booking_date]
      );
      if (shiftRows.length > 0) {
        let timeOnly = "";
        if (Start_time instanceof Date) {
          timeOnly = Start_time.toTimeString().split(" ")[0];
        } else {
          const parts = String(Start_time).split(" ");
          timeOnly = parts.length > 1 ? parts[1] : parts[0];
          if (timeOnly.length === 5) timeOnly += ":00";
        }
        
        const numSlotsToUpdate = Math.max(1, Math.ceil(oldTotalDurationMin / 30));
        const [allSlots] = await connection.query(
          "SELECT Id_work_shifts_hour, Hours, Status FROM Work_shifts_hours WHERE Id_work_shifts = ? ORDER BY Hours ASC",
          [shiftRows[0].Id_work_shifts]
        );
        const startIndex = allSlots.findIndex(s => String(s.Hours).substring(0, 5) === timeOnly.substring(0, 5));
        if (startIndex !== -1) {
          const slotsToUpdate = allSlots.slice(startIndex, startIndex + numSlotsToUpdate);
          const slotIds = slotsToUpdate.map(s => s.Id_work_shifts_hour);
          if (slotIds.length > 0) {
            await connection.query(
              "UPDATE Work_shifts_hours SET Status = 1 WHERE Id_work_shifts_hour IN (?)",
              [slotIds]
            );
          }
        }
      }
    };

    let newTotalDurationMin = oldTotalDurationMin;

    // 2. Nếu có thay đổi dịch vụ
    if (hasServiceChanges) {
      let serviceRows = [];
      const safeServiceIds = Array.isArray(serviceIds) ? Array.from(new Set(serviceIds.map(Number).filter(id => id > 0))).slice(0, 3) : [];
      if (safeServiceIds.length > 0) {
        const [rows] = await connection.query(
          "SELECT Id_services, Price, Sale_Price, Duration_time FROM Services WHERE Id_services IN (?)",
          [safeServiceIds]
        );
        if (rows.length !== safeServiceIds.length) throw createError("Dịch vụ không hợp lệ.");
        serviceRows = rows;
      }

      let comboRows = [];
      const safeComboIds = Array.isArray(comboIds) ? Array.from(new Set(comboIds.map(Number).filter(id => id > 0))) : [];
      if (safeComboIds.length > 0) {
        const [rows] = await connection.query(
          "SELECT Id_combo, Price, Duration_time FROM Combos WHERE Id_combo IN (?)",
          [safeComboIds]
        );
        if (rows.length !== safeComboIds.length) throw createError("Combo không hợp lệ.");
        comboRows = rows;
      }

      if (safeServiceIds.length === 0 && safeComboIds.length === 0) {
        throw createError("Chưa chọn dịch vụ hoặc combo.");
      }

      const totalService = serviceRows.reduce((sum, item) => {
        const price = Number(item.Sale_Price) > 0 ? Number(item.Sale_Price) : Number(item.Price);
        return sum + (Number.isFinite(price) ? price : 0);
      }, 0);

      const totalCombo = comboRows.reduce((sum, item) => {
        const price = Number(item.Price);
        return sum + (Number.isFinite(price) ? price : 0);
      }, 0);

      const newTotal = totalService + totalCombo;
      const discountAmount = Number(currentBooking.Discount_amount || 0);
      const newFinalPrice = Math.max(0, newTotal - discountAmount);

      updates.push("Total_price = ?");
      params.push(newTotal);
      updates.push("Final_price = ?");
      params.push(newFinalPrice);

      newTotalDurationMin = 
        serviceRows.reduce((sum, s) => sum + toMinutes(s.Duration_time), 0) +
        comboRows.reduce((sum, c) => sum + toMinutes(c.Duration_time), 0);

      // Xoá details cũ và thêm details mới
      await connection.query("DELETE FROM Booking_detail WHERE Id_booking = ?", [bookingId]);

      const serviceDetails = serviceRows.map((service) => {
        const price = Number(service.Sale_Price) > 0 ? Number(service.Sale_Price) : Number(service.Price);
        const duration = String(service.Duration_time ?? "");
        const durationTime = duration.includes(":") ? duration : toTimeString(duration);
        return [price, durationTime, bookingId, service.Id_services, null];
      });

      const comboDetails = comboRows.map((combo) => {
        const price = Number(combo.Price);
        const duration = String(combo.Duration_time ?? "");
        const durationTime = duration.includes(":") ? duration : toTimeString(duration);
        return [price, durationTime, bookingId, null, combo.Id_combo];
      });

      const detailValues = [...serviceDetails, ...comboDetails];
      if (detailValues.length > 0) {
        await connection.query(
          "INSERT INTO Booking_detail (Price_at_booking, Duration_time, Id_booking, Id_services, Id_combo) VALUES ?",
          [detailValues]
        );
      }
    }

    // 3. Thực hiện update bảng Bookings
    if (updates.length > 0) {
      await connection.query(
        \`UPDATE Bookings SET \${updates.join(", ")} WHERE Id_booking = ?\`,
        [...params, bookingId]
      );
    }

    // 4. Quản lý Slot (Khung giờ làm việc)
    // Cần thay đổi slot nếu: status đổi thành cancelled (giải phóng), 
    // hoặc có đổi stylistId, hoặc có đổi service (thời lượng thay đổi), hoặc đổi thời gian/ngày.
    // Đơn giản nhất: Nếu huỷ -> giải phóng. Nếu confirm/processing/pending mà có update liên quan tới slot -> giải phóng cũ, khoá mới.
    const isCancelled = status === "cancelled";
    const slotRelevantChanges = stylistId || date || time || hasServiceChanges;
    
    // Nếu status là cancelled -> chỉ cần giải phóng slot cũ (nếu có)
    if (isCancelled) {
      await releaseOldSlots();
    } else if (slotRelevantChanges) {
      // Giải phóng slot cũ
      await releaseOldSlots();

      // Tính slot mới cần khoá
      const targetStylistId = stylistId || currentBooking.Id_stylist;
      const targetDate = date || currentBooking.Booking_date;
      const targetStartRaw = time ? (time.length === 5 ? \`\${time}:00\` : time) : currentBooking.Start_time;
      let targetTimeOnly = "";
      if (targetStartRaw instanceof Date) {
        targetTimeOnly = targetStartRaw.toTimeString().split(" ")[0];
      } else {
        const parts = String(targetStartRaw).split(" ");
        targetTimeOnly = parts.length > 1 ? parts[1] : parts[0];
        if (targetTimeOnly.length === 5) targetTimeOnly += ":00";
      }

      if (targetStylistId && targetDate && targetTimeOnly) {
        const [shiftRows] = await connection.query(
          "SELECT Id_work_shifts FROM Work_shifts WHERE Id_user = ? AND Shift_date = ?",
          [targetStylistId, targetDate]
        );

        if (shiftRows.length > 0) {
          const shiftId = shiftRows[0].Id_work_shifts;
          const numSlotsToLock = Math.ceil(newTotalDurationMin / 30);

          const [allSlots] = await connection.query(
            "SELECT Id_work_shifts_hour, Hours, Status FROM Work_shifts_hours WHERE Id_work_shifts = ? ORDER BY Hours ASC",
            [shiftId]
          );

          const startIndex = allSlots.findIndex(s => String(s.Hours).substring(0, 5) === targetTimeOnly.substring(0, 5));

          if (startIndex !== -1) {
            const slotsToLock = allSlots.slice(startIndex, startIndex + numSlotsToLock);
            
            // Kiểm tra xem đủ slot không và các slot có trống không (Status == 1)
            if (slotsToLock.length < numSlotsToLock) {
              throw createError("Thợ không đủ thời gian cho dịch vụ này.");
            }
            
            const conflictSlots = slotsToLock.filter(s => s.Status === 0);
            if (conflictSlots.length > 0) {
              throw createError("Khung giờ này của thợ đã bị trùng lịch.");
            }

            const slotIds = slotsToLock.map(s => s.Id_work_shifts_hour);
            if (slotIds.length > 0) {
              await connection.query(
                "UPDATE Work_shifts_hours SET Status = 0 WHERE Id_work_shifts_hour IN (?)",
                [slotIds]
              );
            }
          } else {
             throw createError("Không tìm thấy khung giờ phù hợp của thợ.");
          }
        } else {
           throw createError("Thợ không có ca làm việc trong ngày này.");
        }
      }
    }

    await connection.commit();
    res.json({ message: "Cập nhật thành công." });
  } catch (error) {
    await connection.rollback();
    console.error("Lỗi cập nhật lịch hẹn stateful:", error);
    const statusCode = typeof error.status === "number" ? error.status : 500;
    res.status(statusCode).json({ message: error.message || "Lỗi server." });
  } finally {
    connection.release();
  }
});`;

fs.writeFileSync('routes/datlich.js', code.replace(regex, newPatch));
console.log("Replaced successfully!");
