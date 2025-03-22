document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("⚠️ Please enter both email and password.");
        return;
    }

    try {
        const backendURL = "https://lynxea.onrender.com/api/login"; // ✅ Correct Backend URL
        console.log("🔍 Sending login request to:", backendURL);

        const response = await fetch(backendURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }) // 🔹 Removed `credentials: "include"`
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert("❌ Login failed: " + errorData.error);
            return;
        }

        const data = await response.json();
        localStorage.setItem("user_id", data.user_id); // ✅ Store user ID
        alert("✅ Login successful!");

        window.location.href = "/frontend/frontpage/frontpage.html"; // ✅ Redirect to dashboard

    } catch (error) {
        console.error("❌ Network error:", error);
        alert("❌ Network error, please try again.");
    }
});
