const vision = require("@google-cloud/vision");

async function test() {
    const client = new vision.ImageAnnotatorClient();
    console.log("Vision client initialized successfully");
}

test().catch(console.error);