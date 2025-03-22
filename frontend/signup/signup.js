document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");

    if (!signupForm) {
        console.error("❌ Error: signupForm not found!");
        return;
    }

    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("name")?.value.trim();
        const email = document.getElementById("email")?.value.trim();
        const password = document.getElementById("password")?.value.trim();

        if (!name || !email || !password) {
            alert("⚠️ Please fill in all fields.");
            return;
        }

        try {
            const response = await fetch("http://localhost:5002/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, email, password })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Registration failed.");
            }

            alert("✅ Registration successful!");
            window.location.href = "https://ess-a.github.io/LynxEA/frontend/frontpage/frontpage.html";
        } catch (error) {
            console.error("❌ Registration error:", error);
            alert("❌ Registration failed: " + error.message);
        }
    });
});
