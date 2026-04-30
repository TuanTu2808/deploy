import database from "./database.js";

async function run() {
  try {
    await database.query("ALTER TABLE booking_rating ADD COLUMN Description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL AFTER Rating");
    console.log("Success");
  } catch (err) {
    if (err.code === "ER_DUP_FIELDNAME") {
      console.log("Column already exists");
    } else {
      console.error(err);
    }
  } finally {
    process.exit();
  }
}

run();
