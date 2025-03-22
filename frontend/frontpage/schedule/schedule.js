document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ schedule.js loaded!");

    async function loadSchedules() {
        const student_id = localStorage.getItem("student_id");

        if (!student_id) {
            console.warn("⚠️ No student_id found in localStorage.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:5002/api/schedules/list/${student_id}`);
            if (!response.ok) throw new Error(`Server error: ${response.status}`);

            const data = await response.json();
            console.log("📢 Fetched schedules:", data);

            const scheduleTable = document.getElementById("scheduleTableBody");
            if (!scheduleTable) {
                console.error("❌ scheduleTableBody not found in the HTML.");
                return;
            }

            scheduleTable.innerHTML = ""; // Clear previous rows

            if (!Array.isArray(data) || data.length === 0) {
                scheduleTable.innerHTML = "<tr><td colspan='4'>No schedules found.</td></tr>";
                return;
            }

            data.forEach(schedule => {
                const status = schedule.status === "finished" ? "✔ Finished" : "⏳ Ongoing";
                const row = `
                    <tr>
                        <td>${schedule.activity}</td>
                        <td>${new Date(schedule.deadline).toLocaleString()}</td>
                        <td id="status-${schedule.id}">${status}</td>
                        <td>
                            ${schedule.status === "ongoing" 
                                ? `<button onclick="markAsFinished(${schedule.id})">✔ Finish</button>` 
                                : ""}
                        </td>
                    </tr>
                `;
                scheduleTable.insertAdjacentHTML("beforeend", row);
            });
        } catch (error) {
            console.error("❌ Error loading schedules:", error);
        }
    }

    async function addSchedule() {
        const activityElement = document.getElementById("activity");
        const deadlineElement = document.getElementById("deadline");
        const reminderElement = document.getElementById("reminder_interval");

        if (!activityElement || !deadlineElement || !reminderElement) {
            console.error("❌ Missing input fields.");
            alert("❌ Error: Some input fields are missing.");
            return;
        }

        const activity = activityElement.value.trim();
        const deadline = deadlineElement.value;
        const reminderInterval = reminderElement.value;
        const student_id = localStorage.getItem("student_id");

        if (!student_id) {
            alert("⚠️ User not logged in. Please log in first.");
            window.location.href = "login.html";
            return;
        }

        if (!activity || !deadline || !reminderInterval) {
            alert("⚠️ All fields are required!");
            return;
        }

        const deadlineDate = new Date(deadline);
        if (deadlineDate <= new Date()) {
            alert("⚠️ Deadline must be in the future.");
            return;
        }

        const scheduleData = {
            activity,
            deadline,
            reminder_interval: reminderInterval,
            student_id
        };

        console.log("📤 Sending schedule data:", scheduleData);

        try {
            const response = await fetch("http://localhost:5002/api/schedules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(scheduleData),
            });

            const data = await response.json();
            if (data.error) {
                console.error("❌ Error adding schedule:", data.error);
                alert("❌ Error: " + data.error);
            } else {
                console.log("✅ Schedule added:", data);
                alert("✅ Schedule added successfully!");

                // Clear inputs
                activityElement.value = "";
                deadlineElement.value = "";
                reminderElement.value = "";

                loadSchedules(); // Refresh list
            }
        } catch (error) {
            console.error("❌ Network Error:", error);
            alert("❌ Network error. Check console for details.");
        }
    }

    async function markAsFinished(scheduleId) {
        console.log("📢 Marking schedule as finished:", scheduleId);

        try {
            const response = await fetch(`http://localhost:5002/api/schedules/${scheduleId}/finish`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" }
            });

            const data = await response.json();
            if (data.error) {
                console.error("❌ Error marking as finished:", data.error);
                alert("❌ Error: " + data.error);
            } else {
                console.log("✅ Schedule marked as finished:", data);
                alert("✅ Schedule marked as finished!");

                document.getElementById(`status-${scheduleId}`).textContent = "✔ Finished";

                const finishButton = document.querySelector(`button[onclick="markAsFinished(${scheduleId})"]`);
                if (finishButton) finishButton.remove();
            }
        } catch (error) {
            console.error("❌ Network error:", error);
            alert("❌ Network error. Check console for details.");
        }
    }

    const addScheduleBtn = document.getElementById("addScheduleBtn");
    if (addScheduleBtn) {
        addScheduleBtn.addEventListener("click", addSchedule);
    } else {
        console.error("❌ addScheduleBtn not found.");
    }

    loadSchedules(); // ✅ Load schedules on page load
});

async function deleteSchedule(scheduleId) {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    try {
        const response = await fetch(`http://localhost:5002/api/schedules/${scheduleId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to delete schedule.");
        }

        alert("✅ Schedule deleted successfully!");
        location.reload(); // Refresh page after delete
    } catch (error) {
        console.error("❌ Error deleting schedule:", error);
        alert("⚠️ Failed to delete schedule.");
    }
}
