document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("⚠️ Please enter both email and password.");
        return;
    }

    try {
        const API_URL = "http://localhost:5002/api/login"; // Change if deploying
        console.log(`🔍 Sending login request to: ${API_URL}`);

        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // ✅ Only needed if using cookies
            body: JSON.stringify({ email, password })
        });

        // ✅ Handle response status
        if (!response.ok) {
            let errorMessage = "❌ Login failed.";
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (err) {
                console.warn("⚠️ Error parsing JSON:", err);
            }
            alert(errorMessage);
            return;
        }

        // ✅ Parse and store student ID
        const data = await response.json();
        console.log("✅ Login success:", data);
        localStorage.setItem("student_id", data.student_id);

        alert("✅ Login successful!");
        window.location.href = "/frontend/frontpage/frontpage.html"; 

    } catch (error) {
        console.error("❌ Network error:", error);
        alert("❌ Network error, please check your internet or backend server.");
    }
});
