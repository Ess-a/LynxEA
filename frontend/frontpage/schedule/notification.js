function connectWebSocket() {
    let student_id = localStorage.getItem("student_id");

    if (!student_id) {
        console.warn("⚠️ User not logged in. Retrying in 3 seconds...");
        setTimeout(connectWebSocket, 3000); // Retry after 3 seconds
        return;
    }

    const socket = io("http://127.0.0.1:5002"); 

    socket.emit("register", student_id);

    socket.on("reminder", (data) => {
        alert(`🔔 Reminder: ${data.message}`);
    });

    console.log("✅ WebSocket connected for student:", student_id);
}

document.addEventListener("DOMContentLoaded", connectWebSocket);
