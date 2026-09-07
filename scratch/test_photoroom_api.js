const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testPhotoroomAPI() {
  const apiKey = process.env.PHOTOROOM_API_KEY;
  if (!apiKey || apiKey === "your_photoroom_api_key_here") {
    console.log("No valid API key found. Using mock simulation for testing.");
    return;
  }

  // Create a simple dummy image
  const dummyImgPath = path.join(__dirname, 'dummy_test.png');
  // Wait, I need a valid image to test with Photoroom API, not just text data.
  // The API will reject an invalid image. Let's see if there is any image in frontend/assets or backend/uploads.
  const originalDir = path.join(__dirname, '../backend/uploads/original');
  let validImagePath = null;
  if (fs.existsSync(originalDir)) {
    const files = fs.readdirSync(originalDir);
    if (files.length > 0) {
      validImagePath = path.join(originalDir, files[0]);
    }
  }

  if (!validImagePath) {
    console.log("No valid image found to test API. Skipping actual API test.");
    return;
  }

  console.log("Testing with image:", validImagePath);

  const testParams = [
    { name: "Upscale Fast", params: { 'upscale.mode': 'ai.fast' } },
    { name: "Lighting Correct", params: { 'lighting.mode': 'ai.preserve-hue-and-saturation' } },
    { name: "Beautify Enhance", params: { 'beautify.mode': 'enhance' } },
    { name: "All Together", params: { 'upscale.mode': 'ai.fast', 'lighting.mode': 'ai.preserve-hue-and-saturation', 'beautify.mode': 'enhance' } }
  ];

  for (const tc of testParams) {
    console.log(`\n--- Testing ${tc.name} ---`);
    const formData = new FormData();
    const imgBuffer = fs.readFileSync(validImagePath);
    formData.append('imageFile', imgBuffer, { filename: 'test.png', contentType: 'image/png' });
    formData.append('background.color', 'FFFFFF'); // simple background

    for (const [k, v] of Object.entries(tc.params)) {
      formData.append(k, v);
    }

    try {
      const response = await axios.post('https://image-api.photoroom.com/v2/edit', formData, {
        headers: {
          ...formData.getHeaders(),
          'x-api-key': apiKey
        },
        responseType: 'arraybuffer',
        validateStatus: () => true
      });

      console.log(`Status: ${response.status}`);
      if (response.status !== 200) {
        console.log(`Error: ${response.data.toString()}`);
      } else {
        console.log(`Success! Image size: ${response.data.length}`);
      }
    } catch (e) {
      console.log("Exception:", e.message);
    }
  }
}

testPhotoroomAPI();
