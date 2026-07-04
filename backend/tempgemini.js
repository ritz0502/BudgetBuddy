require("dotenv").config({
    path: "../.env",
});
console.log("KEY =", process.env.GEMINI_API_KEY);

const { GoogleGenAI } = require("@google/genai");

async function testGemini() {
    try {
        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Give one investing tip for students",
        });

        console.log(response.text);
    } catch (err) {
        console.error("Error:", err);
    }
}

testGemini();