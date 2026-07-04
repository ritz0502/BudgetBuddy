const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ path: '../.env' });

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const models = await ai.models.list();
    console.log("SUCCESS: Models available");
    for (const model of models) {
      console.log(model.name);
    }
  } catch (err) {
    console.error("FAILED:");
    console.error(err);
  }
}
test();
