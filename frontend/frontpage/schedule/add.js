document.getElementById("scheduleForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // ✅ Prevents page reload

    const activity = document.getElementById("activity").value.trim();
    const deadline = document.getElementById("deadline").value;
    const reminder_interval = document.getElementById("reminder_interval").value;
    const student_id = localStorage.getItem("student_id"); // ✅ Get student_id

    if (!student_id) {
        alert("⚠️ User not logged in. Please log in first.");
        window.location.href = "login.html";
        return;
    }

    if (!activity || !deadline || !reminder_interval) {
        alert("⚠️ Please fill in all fields.");
        return;
    }

    const scheduleData = { activity, deadline, reminder_interval, student_id, status: "ongoing" };

    // 🔄 Dynamic backend URL (change if deploying)
    const BASE_URL = "http://localhost:5002"; // Local backend
    const API_URL = `${BASE_URL}/api/schedules`;        

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(scheduleData),
        });

        // ✅ Safely parse JSON, even if response is an error page
        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            throw new Error("⚠️ Server returned invalid response.");
        }

        if (!response.ok) {
            throw new Error(result.error || "❌ Failed to add schedule.");
        }

        alert("✅ Schedule added successfully!");
        window.location.href = "lists.html"; // ✅ Redirect after success
    } catch (error) {
        console.error("❌ Error adding schedule:", error);
        alert("⚠️ " + error.message);
    }
});
