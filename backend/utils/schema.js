import database from "../database.js";

const tableExists = async (tableName) => {
  const [rows] = await database.query("SHOW TABLES LIKE ?", [tableName]);
  return rows.length > 0;
};

const columnExists = async (tableName, columnName) => {
  const [rows] = await database.query(`SHOW COLUMNS FROM ${tableName} LIKE ?`, [
    columnName,
  ]);
  return rows.length > 0;
};

export const ensureAuthSchema = async () => {
  const hasUsers = await tableExists("Users");
  if (!hasUsers) return;

  await database.query("ALTER TABLE Users MODIFY COLUMN Pass_word VARCHAR(255) NOT NULL");

  if (!(await columnExists("Users", "Reset_otp"))) {
    await database.query("ALTER TABLE Users ADD COLUMN Reset_otp VARCHAR(10) NULL");
  }

  if (!(await columnExists("Users", "Reset_otp_expired"))) {
    await database.query(
      "ALTER TABLE Users ADD COLUMN Reset_otp_expired DATETIME NULL"
    );
  }

  if (!(await columnExists("Users", "Refresh_token_hash"))) {
    await database.query(
      "ALTER TABLE Users ADD COLUMN Refresh_token_hash VARCHAR(255) NULL"
    );
  }

  if (!(await columnExists("Users", "Refresh_token_expired"))) {
    await database.query(
      "ALTER TABLE Users ADD COLUMN Refresh_token_expired DATETIME NULL"
    );
  }

  const hasAddressShip = await tableExists("Address_Ship");
  if (!hasAddressShip) return;

  if (!(await columnExists("Address_Ship", "Is_default"))) {
    await database.query(
      "ALTER TABLE Address_Ship ADD COLUMN Is_default TINYINT(1) NOT NULL DEFAULT 0"
    );
  }

  // Nếu chưa có địa chỉ mặc định thì tự set bản ghi đầu tiên của mỗi user.
  const [users] = await database.query(
    `
      SELECT DISTINCT Id_user
      FROM Address_Ship
      ORDER BY Id_user ASC
    `
  );

  for (const user of users) {
    const [rows] = await database.query(
      `
        SELECT Id_address_ship, Is_default
        FROM Address_Ship
        WHERE Id_user = ?
        ORDER BY Id_address_ship ASC
      `,
      [user.Id_user]
    );

    if (!rows.length) continue;

    const hasDefault = rows.some((row) => Number(row.Is_default) === 1);
    if (hasDefault) continue;

    const defaultId = rows[0].Id_address_ship;
    await database.query(
      `
        UPDATE Address_Ship
        SET Is_default = CASE WHEN Id_address_ship = ? THEN 1 ELSE 0 END
        WHERE Id_user = ?
      `,
      [defaultId, user.Id_user]
    );
  }
};

export const ensureComboSchema = async () => {
  const hasCombos = await tableExists("Combos");
  if (!hasCombos) return;

  if (!(await columnExists("Combos", "Image_URL"))) {
    await database.query("ALTER TABLE Combos ADD COLUMN Image_URL TEXT NULL");
  }
};