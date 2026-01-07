
// User Data for Registration
const userData = {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7InVzZXJJZCI6IjY3YTg0ZmM3ODdiOGNmNTYyYjU1NDkxOSIsImVtYWlsIjoiam9obmRvZUBleGFtcGxlLmNvbSJ9LCJnZW5lcmF0ZWRUaW1lIjoxNzM5MDgzNzI5ODUwLCJpYXQiOjE3MzkwODM3Mjl9.zH8PXJw30GCbtW12b9rkrQKcyHnNy1COe4esnQrlVzc",
updateMeal: "lunch",
status: "completed",
totalCalories: 600,
totalCarbs: 75,
totalFats: 20,
totalProteins: 30
};

// Function to Register User
const registerUser = async () => {
    try {
        const response = await fetch("http://localhost:4000/api/progress/get-progress", { 
            method: "POST",
            headers: {"Content-Type": "application/json"            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ Registration Successful:", data);
        } else {
            console.log("❌ Registration Failed:", data.message);
        }

    } catch (error) {
        console.error("🚨 Error:", error);
    }
};

// Call the Function
registerUser();
