const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const http = require("http");
const { Server } = require("socket.io");
const db = require("./db");
const connectedUsers = {}; // ✅ Ensure it's always an object

const app = express();
const server = http.createServer(app);

// ✅ Define allowed frontend origins
const FRONTEND_ORIGINS = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:3000",
    "https://ess-a.github.io" // ✅ Ensure GitHub Pages access
];

// ✅ CORS Configuration
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || FRONTEND_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("CORS not allowed"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ WebSocket Setup
const io = new Server(server, { cors: { origin: FRONTEND_ORIGINS } });

io.on("connection", (socket) => {
    console.log("🟢 New WebSocket connection:", socket.id);

    socket.on("register", (student_id) => {
        if (student_id) {
            socket.student_id = student_id; // ✅ Store the ID in socket
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

        // Check if email already exists
        db.query("SELECT * FROM users WHERE email = ?", [email], async (err, existingUser) => {
            if (err) {
                console.error("❌ Database error:", err);
                return res.status(500).json({ message: "Server error, please try again." });
            }

            if (existingUser.length > 0) {
                return res.status(409).json({ message: "⚠️ Email already exists. Please use a different email." });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user into database
            db.query(
                "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
                [name, email, hashedPassword],
                (err) => {
                    if (err) {
                        console.error("❌ Database error:", err);
                        return res.status(500).json({ message: "Server error, please try again." });
                    }
                    console.log(`✅ User registered: ${email}`);
                    res.status(201).json({ message: "✅ Registration successful!" });
                }
            );
        });

    } catch (error) {
        console.error("❌ Server error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// ✅ FIXED: User Login (Changed `students` to `users`)
app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error." });

        if (results.length === 0) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, isPasswordValid) => {
            if (err) return res.status(500).json({ error: "Error verifying password." });

            if (!isPasswordValid) {
                return res.status(401).json({ error: "Invalid email or password." });
            }

            res.json({ message: "✅ Login successful!", user_id: user.id });
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
