
const openAI = async (prompt) => {
    const apiKey = process.env.OPENAI_API_KEY; // Ensure you have your OpenAI API key
console.log(apiKey)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo", // Use GPT-3.5 Turbo (affordable and effective)
            messages: [
                { role: "system", content: `
                    You are an AI assistant that strictly returns responses in valid JSON format. Your response should never include Markdown formatting, explanations, or any additional text—only a valid JSON object. 

Ensure:
1. The response starts with { and ends with } (a valid JSON object).
2. No Markdown code blocks .
3. No extra text, comments, or explanations—only JSON.
4. The JSON should follow this exact structure:
{
  "days": [
    {
      "day": "Monday",
      "meals": {
        "breakfast": [
          {
            "item": "Food Name",
            "description": "Details about the meal, including portion size",
            "carbs": "Xg",
            "protein": "Xg",
            "fat": "Xg",
            "calories": "X"
          }
        ],
        "lunch": [...],
        "dinner": [...]
      }
    },
    ...
  ]
}
Return **exactly** in this format and nothing else.

                    ` }, // System message (optional)
                { role: "user", content: prompt } // User's input prompt
            ],
            max_tokens: 4096, // Adjust the token limit based on response length
            temperature: 0.7, // Adjust for creativity in the responses
        })
    });

    const data = await response.json();
    console.log(data)

    // Assuming the diet plan data comes in JSON format
    if (data.choices && data.choices[0].message) {
        const dietPlan = data.choices[0].message.content.trim();
        try {
            return JSON.parse(dietPlan); // Parse it to a JSON object if it's in valid format
        } catch (error) {
            console.error('Failed to parse response to JSON', error);
            return dietPlan; // Return raw string if not a valid JSON
        }
    } else {
        throw new Error('No valid response from GPT-4');
    }
    
    return dietPlan;
};

module.exports = { openAI };
