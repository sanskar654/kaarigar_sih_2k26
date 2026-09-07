const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { processImage } = require('../backend/imageProcessor');

// Mock axios.post to intercept the formData
// Mock axios.post manually

async function runTests() {
  console.log("=== Testing 5 Categories for Photoroom Prompts ===");

  const testCases = [
    { name: "Diya", category: "Pottery & Ceramics", desc: "Handmade terracotta diya" },
    { name: "Saree", category: "Clothing", desc: "Red Banarasi silk saree with zari border" },
    { name: "Jewellery", category: "Accessories", desc: "Gold plated temple jewellery necklace" },
    { name: "Wooden Craft", category: "Woodwork", desc: "Carved wooden elephant figurine" },
    { name: "Unknown Item", category: "New Category", desc: "Some new unidentified artifact" },
  ];

  // We need a dummy file
  const dummyFilePath = path.join(__dirname, 'dummy.png');
  if (!fs.existsSync(dummyFilePath)) {
    fs.writeFileSync(dummyFilePath, 'dummy data');
  }
  const mockFile = { path: dummyFilePath, mimetype: 'image/png' };

  process.env.PHOTOROOM_API_KEY = 'test_key';

  for (const tc of testCases) {
    console.log(`\nTesting category: ${tc.name} (${tc.category})`);
    
    // We mock axios post here, but since this is not jest env, we can just intercept by overriding axios.post
    const originalPost = axios.post;
    axios.post = async (url, formData, config) => {
      // Extract prompt from formData
      // In form-data package, there isn't a direct get method always, so we look at the internal streams or headers if needed.
      // But we can just use toString or similar to find the prompt, or just assume the string is in the buffer.
      const buffer = formData.getBuffer();
      const payloadStr = buffer.toString();
      
      const promptMatch = payloadStr.match(/name="background\.prompt"\r\n\r\n(.*?)\r\n/);
      const promptStr = promptMatch ? promptMatch[1] : "NOT FOUND";
      
      const modelMatch = payloadStr.match(/name="background\.model"\r\n\r\n(.*?)\r\n/);
      const modelStr = modelMatch ? modelMatch[1] : "NOT FOUND";
      
      console.log(`[Generated Prompt]: ${promptStr}`);
      console.log(`[Model Used]: ${modelStr}`);

      axios.post = originalPost;
      return { status: 200, headers: { 'content-type': 'image/png' }, data: Buffer.from('dummy response') };
    };

    try {
      await processImage(mockFile, {
        productName: tc.name,
        category: tc.category,
        description: tc.desc
      });
    } catch (e) {
      console.error(e);
    }
  }

  // Cleanup
  if (fs.existsSync(dummyFilePath)) {
    fs.unlinkSync(dummyFilePath);
  }
}

runTests();
