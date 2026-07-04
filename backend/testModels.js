const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ path: '../.env' });

async function run() {
  const modelsToTest = [
    'gemini-1.5-flash-8b',
    'gemini-1.5-flash-8b-latest',
    'models/gemini-1.5-flash-8b',
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash',
    'gemini-1.5-pro-latest',
    'gemini-1.0-pro-vision-latest',
    'gemini-1.0-pro-001'
  ];
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  for (const model of modelsToTest) {
    try {
      console.log("Testing:", model);
      const res = await ai.models.generateContent({
        model: model,
        contents: "Hi"
      });
      console.log("SUCCESS:", model);
      break;
    } catch (err) {
      console.log("FAILED:", model, err.message);
    }
  }
}
run();
