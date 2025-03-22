document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("⚠️ Please enter both email and password.");
        return;
    }

    console.log("🔍 Sending login request to:", "https://lynxea.onrender.com/api/login"); // ✅ Logs backend URL

    try {
        const response = await fetch("https://lynxea.onrender.com/api/login", { // ✅ Use Render backend URL
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            console.warn("⚠️ Login failed:", data.error);
            alert("❌ Login failed: " + data.error);
            return;
        }

        console.log("✅ Login successful!", data);
        localStorage.setItem("student_id", data.student_id); // ✅ Store student_id
        alert("✅ Login successful!");

        window.location.href = "/frontend/frontpage/frontpage.html"; 

    } catch (error) {
        console.error("❌ Network error:", error);
        alert("❌ Network error, please try again.");
    }
});
