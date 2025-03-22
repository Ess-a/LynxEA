module.exports = (io) => {
    const express = require("express");
    const router = express.Router();
    const db = require("../db");

    // ✅ Add a new schedule (POST) - student_id is now optional
    router.post("/", (req, res) => {
        const { activity, deadline, reminder_interval, student_id } = req.body;
        console.log("Received Data:", req.body);

        // 🛠 Validate required fields (student_id is optional)
        if (!activity || !deadline || reminder_interval === undefined) {
            return res.status(400).json({ error: "Activity, deadline, and reminder_interval are required!" });
        }

        // ✅ Convert deadline to MySQL DATETIME format
        const formattedDeadline = new Date(deadline).toISOString().slice(0, 19).replace("T", " ");

        // Dynamic SQL query based on the presence of student_id
        const sql = student_id
            ? `INSERT INTO schedules (activity, deadline, reminder_interval, student_id, status) VALUES (?, ?, ?, ?, 'ongoing')`
            : `INSERT INTO schedules (activity, deadline, reminder_interval, status) VALUES (?, ?, ?, 'ongoing')`;

        const values = student_id
            ? [activity, formattedDeadline, reminder_interval, student_id]
            : [activity, formattedDeadline, reminder_interval];

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error("❌ Database insert error:", err.sqlMessage || err);
                return res.status(500).json({ error: "Database insert error." });
            }
            res.json({ message: "✅ Schedule added successfully!", id: result.insertId });
        });
    });

    // ✅ Get all schedules (GET)
    router.get("/", (req, res) => {
        db.query("SELECT * FROM schedules", (err, results) => {
            if (err) return res.status(500).json({ error: "Database error." });
            res.json(results);
        });
    });

    // ✅ Get schedules for a specific student (GET)
    router.get("/list/:student_id", (req, res) => {
        const { student_id } = req.params;

        if (!student_id) {
            return res.status(400).json({ error: "Missing student_id parameter!" });
        }

        db.query("SELECT * FROM schedules WHERE student_id = ?", [student_id], (err, results) => {
            if (err) {
                console.error("❌ Database error:", err.sqlMessage || err);
                return res.status(500).json({ error: "Database error" });
            }
            res.json(results);
        });
    });

    // ✅ Mark schedule as finished (PUT)
    router.put("/:id/finish", (req, res) => {
        const scheduleId = req.params.id;

        db.query("UPDATE schedules SET status = 'finished' WHERE id = ?", [scheduleId], (err, result) => {
            if (err) {
                console.error("❌ Database error:", err.sqlMessage || err);
                return res.status(500).json({ error: "Error updating schedule." });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Schedule not found!" });
            }

            // 📢 Notify via WebSocket
            io.emit("scheduleUpdated", { id: scheduleId, status: "finished" });

            res.json({ message: "✅ Schedule marked as finished!" });
        });
    });

    // ✅ Update schedule details (PUT)
    router.put("/:id", (req, res) => {
        const { id } = req.params;
        const { activity, deadline, reminder_interval, status } = req.body;

        if (!activity || !deadline || reminder_interval === undefined || !status) {
            return res.status(400).json({ error: "Activity, deadline, reminder_interval, and status are required!" });
        }

        const formattedDeadline = new Date(deadline).toISOString().slice(0, 19).replace("T", " ");

        db.query(
            "UPDATE schedules SET activity = ?, deadline = ?, reminder_interval = ?, status = ? WHERE id = ?",
            [activity, formattedDeadline, reminder_interval, status, id],
            (err, result) => {
                if (err) {
                    console.error("❌ Database error:", err);
                    return res.status(500).json({ error: "Failed to update schedule." });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: "Schedule not found!" });
                }

                res.json({ message: "✅ Schedule updated successfully!" });
            }
        );
    });

    return router;
};