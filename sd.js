async function createDietPlan() {
  try {
    const response = await fetch("http://localhost:4000/api/diet/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7InVzZXJJZCI6IjY4NzI1NWVjOTU0NjgzZTZiYmRkYjFkYSIsImVtYWlsIjoic2FpZmljaGVlbWE2NzNAZ21haWwuY29tIn0sImdlbmVyYXRlZFRpbWUiOjE3NTMxNjE5ODEwNjUsImlhdCI6MTc1MzE2MTk4MX0.Ug3cnlwsMe1snaT47n4qX2G3_QAQXcASQxqOWkLTgHg",
        gender: "Female",
        age: 25.0,
        height: 123.0,
        weight: 64.0,
        activityLevel: "Light (House Work)",
        dailySleep: "7 - 8 hours",
        stressLevel: "Moderate (Occasional Stress)",
        budgetPreference: "10000",
        targetWeight: 61.20440439672124,
        healthGoals: "Stay Healthy",
        dietaryPreference: "Pescatarian, Halal",
        foodAllergies: "Tree Nuts, Wheat",
        medicalCondition: "Thyroid Disorder, High Blood Pressure"
      })
    });

    const result = await response.json();
    console.log("Response:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

createDietPlan();
