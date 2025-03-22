document.addEventListener("DOMContentLoaded", () => {
    const addScheduleBtn = document.getElementById("addScheduleBtn");

    if (addScheduleBtn) {
        addScheduleBtn.addEventListener("click", () => {
            window.location.href = "add.html"; // ✅ Redirect to add schedule page
        });
    } else {
        console.error("❌ Add Schedule button not found.");
    }
});

async function markAsFinished(scheduleId) {
    try {
        const response = await fetch(`http://localhost:5002/api/schedules/${scheduleId}/finish`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" }
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "❌ Error marking as finished.");
        }

        alert("✅ Schedule marked as finished!");
        document.getElementById(`status-${scheduleId}`).textContent = "✔ Finished";

        // Remove the "Finish" button after marking
        document.querySelector(`button[onclick="markAsFinished(${scheduleId})"]`).remove();
    } catch (error) {
        console.error("❌ Error:", error);
        alert("⚠️ " + error.message);
    }
}

async function fetchSchedules() {
    try {
        const response = await fetch("http://localhost:5002/api/schedules");

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Schedules fetched:", data);

        const scheduleTable = document.getElementById("scheduleTableBody");
        scheduleTable.innerHTML = "";

        if (data.length === 0) {
            scheduleTable.innerHTML = `<tr><td colspan="4">🚫 No schedules found.</td></tr>`;
            return;
        }

        data.forEach(schedule => {
            scheduleTable.innerHTML += `
                <tr>
                    <td>${schedule.activity}</td>
                    <td>${schedule.deadline}</td>
                    <td id="status-${schedule.id}">${schedule.status || "Pending"}</td>
                    <td>
                        ${schedule.status === "finished" ? "✔ Finished" : `
                            <button onclick="markAsFinished(${schedule.id})">✔ Finish</button>
                            <button onclick="deleteSchedule(${schedule.id})">🗑 Delete</button>
                        `}
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("❌ Error fetching schedules:", error);
        document.getElementById("scheduleTableBody").innerHTML = `<tr><td colspan="4">⚠️ Error loading schedules.</td></tr>`;
    }
}

// Ensure the function runs only when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", fetchSchedules);

async function deleteSchedule(scheduleId) {
    if (!confirm("🗑 Are you sure you want to delete this schedule?")) return;

    try {
        const response = await fetch(`http://localhost:5002/api/schedules/${scheduleId}`, {
            method: "DELETE"
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "❌ Error deleting schedule.");
        }

        alert("✅ Schedule deleted!");
        const studentId = localStorage.getItem("student_id") || 1; // Ensure correct ID
        fetchSchedules(studentId); // Refresh schedule list
    } catch (error) {
        console.error("❌ Error deleting schedule:", error);
        alert("⚠️ " + error.message);
    }
}

// ✅ Ensure the script runs AFTER the page loads
document.addEventListener("DOMContentLoaded", () => {
    const studentId = localStorage.getItem("student_id") || 1; // Change this based on login
    fetchSchedules(studentId);
});
