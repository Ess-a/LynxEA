const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const http = require("http");
const { Server } = require("socket.io");
const db = require("./db");
const connectedUsers = {};

const app = express();
const server = http.createServer(app);

// ✅ Correct frontend origin
const FRONTEND_ORIGIN = "https://ess-a.github.io"; // ✅ Use the base GitHub Pages URL

app.use(cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

// ✅ Handle OPTIONS preflight requests
app.options("*", (req, res) => {
    res.header("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    res.sendStatus(204);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ WebSocket Setup
const io = new Server(server, { 
    cors: { origin: FRONTEND_ORIGIN } 
});

io.on("connection", (socket) => {
    console.log("🟢 New WebSocket connection:", socket.id);

    socket.on("register", (student_id) => {
        if (student_id) {
            socket.student_id = student_id;
            connectedUsers[student_id] = socket.id;
            console.log(`✅ Student ${student_id} registered.`);
        } else {
            console.warn("⚠️ Invalid student_id during WebSocket registration.");
        }
    });

    socket.on("disconnect", () => {
        if (socket.student_id) {
            delete connectedUsers[socket.student_id];
            console.log(`🔴 Student ${socket.student_id} disconnected.`);
        }
    });
});

// ✅ Database Connection Check
db.query("SELECT 1", (err) => {
    if (err) {
        console.error("❌ Database connection error:", err);
    } else {
        console.log("✅ Database connected successfully.");
    }
});

// ✅ User Registration
app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "⚠️ Please provide name, email, and password." });
        }

        // Check if email already exists in the `students` table
        db.query("SELECT * FROM students WHERE email = ?", [email], async (err, existingStudent) => {
            if (err) {
                console.error("❌ Database error:", err);
                return res.status(500).json({ message: "Server error, please try again." });
            }

            if (existingStudent.length > 0) {
                return res.status(409).json({ message: "⚠️ Email already exists. Please use a different email." });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert student into database
            db.query(
                "INSERT INTO students (name, email, password) VALUES (?, ?, ?)",
                [name, email, hashedPassword],
                (err) => {
                    if (err) {
                        console.error("❌ Database error:", err);
                        return res.status(500).json({ message: "Server error, please try again." });
                    }
                    console.log(`✅ Student registered: ${email}`);
                    res.status(201).json({ message: "✅ Registration successful!" });
                }
            );
        });

    } catch (error) {
        console.error("❌ Server error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

    } catch (error) {
        console.error("❌ Server error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// ✅ User Login
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "⚠️ Email and password are required." });
    }

    db.query("SELECT * FROM students WHERE email = ?", [email], (err, results) => {
        if (err) {
            console.error("❌ Database error:", err);
            return res.status(500).json({ error: "Server error, please try again." });
        }

        if (results.length === 0) {
            console.warn("⚠️ No student found with this email.");
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const student = results[0];

        // ✅ Compare hashed password properly
        bcrypt.compare(password, student.password, (err, isPasswordValid) => {
            if (err) {
                console.error("❌ Error verifying password:", err);
                return res.status(500).json({ error: "Error verifying password." });
            }

            if (!isPasswordValid) {
                console.warn("⚠️ Incorrect password entered.");
                return res.status(401).json({ error: "Invalid email or password." });
            }

            console.log(`✅ Login successful for student_id: ${student.id}`);
            res.json({ message: "✅ Login successful!", student_id: student.id });
        });
    });
});

// ✅ Fetch All Schedules
app.get("/api/schedules", (req, res) => {
    db.query("SELECT * FROM schedules", (err, results) => {
        if (err) return res.status(500).json({ error: "Database error." });
        res.json(results);
    });
});

// ✅ Add New Schedule
app.post("/api/schedules", (req, res) => {
    const { activity, deadline, reminder_interval, student_id } = req.body;

    if (!activity || !deadline || !reminder_interval || !student_id) {
        return res.status(400).json({ error: "All fields are required." });
    }

    db.query(
        "INSERT INTO schedules (activity, deadline, reminder_interval, student_id) VALUES (?, ?, ?, ?)",
        [activity, deadline, reminder_interval, student_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: "Database error." });
            res.json({ message: "✅ Schedule added successfully!", id: result.insertId });
        }
    );
});

// ✅ Mark Schedule as Finished
app.put("/api/schedules/:scheduleId/finish", (req, res) => {
    const { scheduleId } = req.params;

    db.query("UPDATE schedules SET status = 'finished' WHERE id = ?", [scheduleId], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error." });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Schedule not found." });
        }

        res.json({ message: "✅ Schedule marked as finished!" });
    });
});

// ✅ Delete Schedule
app.delete("/api/schedules/:scheduleId", (req, res) => {
    const { scheduleId } = req.params;

    db.query("DELETE FROM schedules WHERE id = ?", [scheduleId], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error." });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Schedule not found." });
        }

        res.json({ message: "✅ Schedule deleted successfully!" });
    });
});

// ✅ Start Server
const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
