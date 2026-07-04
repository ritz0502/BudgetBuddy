const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../.env' });

async function test() {
  try {
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = ai.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent("Hello! What is your name?");
    console.log("SUCCESS:");
    console.log(result.response.text());
  } catch (err) {
    console.error("FAILED:");
    console.error(err);
  }
}
test();
