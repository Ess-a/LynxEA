document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("⚠️ Please enter both email and password.");
        return;
    }

    try {
        console.log("🔍 Sending login request to:", "https://lynxea.onrender.com/api/login");

        const response = await fetch("https://lynxea.onrender.com/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // ✅ Enable CORS credentials
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert("❌ Login failed: " + errorData.error);
            return;
        }

        const data = await response.json();
        localStorage.setItem("user_id", data.user_id); // ✅ Store user ID
        alert("✅ Login successful!");

        window.location.href = "/frontend/frontpage/frontpage.html";

    } catch (error) {
        console.error("❌ Network error:", error);
        alert("❌ Network error, please try again.");
    }
});
