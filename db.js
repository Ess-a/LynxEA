const mysql = require("mysql");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "mysql01",
    database: "LinkEA"
});

db.connect((err) => {
    if (err) {
        console.error("❌ Database connection failed:", err);
    } else {
        console.log("✅ Connected to the database.");
    }
});

module.exports = db;  // ✅ Export the database connection
