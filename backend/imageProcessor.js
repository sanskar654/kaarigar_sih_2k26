// Photoroom Image Processor Module for Kaarigar Track B (v2 Image Editing API)
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const ORIGINAL_DIR = path.join(UPLOADS_DIR, 'original');
const ENHANCED_DIR = path.join(UPLOADS_DIR, 'enhanced');

// Ensure upload directories exist
[UPLOADS_DIR, ORIGINAL_DIR, ENHANCED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

function buildProductImagePrompt(category, productName, description) {
  const cat = (category || '').toLowerCase();
  const name = (productName || '').toLowerCase();
  const desc = (description || '').toLowerCase();
  
  const isDiya = name.includes('diya') || name.includes('lamp') || name.includes('terracotta diya');
  
  if (isDiya) {
    return "Create a realistic professional e-commerce photograph of this exact handmade clay diya. Keep the diya completely unchanged, including its exact shape, color, wick, oil, texture and flame. Remove the original outdoor background and place the diya on a beautiful natural wooden tabletop in a warm traditional Indian festive setting. Add only a few subtle jasmine or marigold flowers, minimal brass decorative elements and soft green leaves in the background. Use warm golden ambient lighting, realistic soft shadows and shallow depth of field. Keep the diya centered and sharply focused. The background must remain subtle and must not compete with the diya. Do not use fabric, bedsheets, curtains or unrelated objects. Do not add decorations to the diya itself.";
  }

  const isPottery = cat.includes('pottery') || cat.includes('clay') || cat.includes('ceramic');
  const isSaree = name.includes('saree') || name.includes('sari');
  const isTextile = cat.includes('textile') || cat.includes('handloom') || cat.includes('fabric') || cat.includes('clothing');
  const isJewellery = cat.includes('jewellery') || cat.includes('jewelry') || cat.includes('accessories');
  const isWoodenCraft = cat.includes('wood') || name.includes('wood');
  const isMetal = cat.includes('metal') || cat.includes('brass') || cat.includes('copper');
  const isArtwork = cat.includes('painting') || cat.includes('art');
  const isHomeDecor = cat.includes('decor') || cat.includes('home');
  const isBasket = cat.includes('basket') || cat.includes('fibre') || cat.includes('bamboo');

  let environment = "";
  
  if (isPottery) {
    if (name.includes('flower pot') || name.includes('planter')) {
      environment = "natural home or garden-inspired setting with soft natural daylight, a wooden tabletop, and subtle greenery";
    } else if (name.includes('cooking') || name.includes('cookware')) {
      environment = "tasteful rustic kitchen or cooking environment with warm lighting, a wooden surface, and subtle natural ingredients";
    } else {
      environment = "rustic artisan setting on a wooden or terracotta surface with warm lighting, subtle realistic shadows, and minimal natural props like leaves";
    }
  } else if (isSaree || isTextile) {
    if (name.includes('table runner') || name.includes('tablecloth')) {
      environment = "tasteful dining or table setting with soft natural lighting and subtle tableware";
    } else {
      environment = "elegant textile and fashion presentation on a complementary premium fabric or wooden surface, placed in a traditional Indian interior with soft natural lighting";
    }
  } else if (isJewellery) {
    environment = "premium jewellery display on a neutral velvet or elegant soft surface, with subtle flowers and warm controlled studio lighting. Do not use large distracting household objects or outdoor backgrounds";
  } else if (isWoodenCraft) {
    if (name.includes('spoon') || name.includes('kitchen')) {
      environment = "tasteful kitchen setting on a natural wooden surface with soft natural light";
    } else {
      environment = "natural wooden artisan décor setting on a wooden surface with warm natural light, subtle greenery, and tasteful home décor elements. Avoid excessive fabric";
    }
  } else if (isMetal) {
    environment = "traditional Indian interior on a wooden surface with subtle brass décor, warm golden lighting, and realistic reflections. Do not use textile-heavy or outdoor dirt surfaces";
  } else if (isArtwork) {
    environment = "elegant wall in a tasteful gallery-style home interior with wooden furniture, subtle plants, and natural lighting";
  } else if (isBasket) {
    environment = "rustic and earthy natural home setting on a wooden surface with plants, leaves, and natural daylight. Do not use luxury or jewelry-style backgrounds";
  } else if (isHomeDecor) {
    environment = "realistic tasteful home interior on a wooden table or shelf with subtle plants, books, and warm natural lighting, demonstrating how it looks in a home";
  } else {
    environment = `highly cohesive environment that naturally complements a ${name || 'handmade item'}, using appropriate surfaces, natural lighting, soft realistic shadows, and 1-3 subtle, relevant complementary props`;
  }

  return `Create a realistic professional e-commerce photograph of this exact product. Keep the product completely unchanged, including its exact shape, size, proportions, color, pattern, design, engraving, artwork, texture, material, decorations, and handmade details. Remove the original background and place the product in/on a ${environment}. The product must be clearly visible, sharp, dominant, and professionally composed using realistic depth of field. Negative constraints: Do not use generic studio backdrops. Do not change or redesign the original product. Do not add decorations to the product. Do not add text, logos, or watermarks. Do not use unrelated objects. Do not use fabric unless the product naturally calls for it. Do not overcrowd the scene or let the background overpower the product.`;
}

async function processImage(file, productContext = {}) {
  if (!file || !file.path || !fs.existsSync(file.path)) {
    throw new Error('Uploaded file does not exist on disk.');
  }

  const originalFileName = path.basename(file.path);
  const fsStats = fs.statSync(file.path);
  
  console.log(`[IMAGE] ===== IMAGE PROCESSING START =====`);
  console.log(`[IMAGE] Original upload received: ${originalFileName}`);
  console.log(`[IMAGE] Input file: ${file.path}`);
  console.log(`[IMAGE] Input size: ${fsStats.size}`);
  console.log(`[IMAGE] Input MIME type: ${file.mimetype}`);

  const enhancedFileName = `enhanced_${Date.now()}_${originalFileName.replace(/\.[^/.]+$/, "")}.png`;
  const enhancedFilePath = path.join(ENHANCED_DIR, enhancedFileName);

  const originalUrl = `/uploads/original/${originalFileName}`;
  const enhancedUrl = `/uploads/enhanced/${enhancedFileName}`;

  const photoroomKey = process.env.PHOTOROOM_API_KEY;
  const isKeyConfigured = !!(photoroomKey && photoroomKey.trim() !== "" && photoroomKey !== "your_photoroom_api_key_here");
  console.log(`[IMAGE] PHOTOROOM_API_KEY configured: ${isKeyConfigured}`);

  if (isKeyConfigured) {
    const cat = productContext.category || 'product';
    const name = productContext.productName || 'item';
    const desc = productContext.description || '';
    
    const bgPrompt = buildProductImagePrompt(cat, name, desc);

    const tryPhotoroom = async (useBetaModel) => {
      const FormData = require('form-data');
      const formData = new FormData();
      const imageBuffer = fs.readFileSync(file.path);
      
      formData.append('imageFile', imageBuffer, { 
        filename: originalFileName,
        contentType: file.mimetype
      });
      formData.append('padding', '0.15');
      formData.append('shadow.mode', 'ai.soft');
      formData.append('background.prompt', bgPrompt);
      
      if (useBetaModel) {
        // We're appending model just in case it's 'model' or 'background.model'. Wait, let's use 'background.model'. Or actually just 'background.model' according to standard naming convention if background.color is used. But Photoroom API v2/edit docs typically use something else? 
        // We don't have exact API docs. Let's just pass 'model': 'background-studio-beta-2025-03-17' as well as 'background.model' to be safe, or just what's likely.
        formData.append('background.model', 'background-studio-beta-2025-03-17');
      }

      console.log(`[IMAGE] Calling Photoroom API (Beta Model: ${useBetaModel})...`);
      console.log(`[IMAGE] Prompt: ${bgPrompt}`);
      
      return await axios.post('https://image-api.photoroom.com/v2/edit', formData, {
        headers: {
          ...formData.getHeaders(),
          'x-api-key': photoroomKey,
          'Accept': 'image/png, application/json'
        },
        responseType: 'arraybuffer',
        timeout: 120000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        validateStatus: () => true
      });
    };

    try {
      // First attempt with the beta model
      let response = await tryPhotoroom(true);

      // If beta model is unsupported, it often returns 400 Bad Request
      if (response.status >= 400 && response.status < 500) {
        let errMessage = response.data ? response.data.toString() : '';
        console.log(`[IMAGE] Beta model attempt failed with ${response.status}: ${errMessage}. Retrying with stable config...`);
        // Retry without beta model
        response = await tryPhotoroom(false);
      }

      console.log(`[IMAGE] Photoroom HTTP status: ${response.status}`);
      console.log(`[IMAGE] Photoroom content-type: ${response.headers['content-type']}`);
      console.log(`[IMAGE] Photoroom response size: ${response.data.length}`);

      if (response.status === 200 && response.headers['content-type'] && response.headers['content-type'].includes('image')) {
        fs.writeFileSync(enhancedFilePath, response.data);
        console.log(`[IMAGE] Photoroom processing successful`);
        console.log(`[IMAGE] Enhanced image saved: ${enhancedFilePath}`);
        console.log(`[IMAGE] Enhanced image URL returned: ${enhancedUrl}`);
        console.log(`[IMAGE] ===== IMAGE PROCESSING COMPLETE =====`);

        return {
          success: true,
          processed: true,
          mode: 'photoroom',
          originalImage: originalUrl,
          enhancedImage: enhancedUrl
        };
      } else {
        const errMessage = response.data ? response.data.toString() : 'Unknown error';
        console.log(`[IMAGE] Photoroom processing failed: HTTP ${response.status}`);
        console.log(`[IMAGE] Response: ${errMessage}`);
        console.log(`[IMAGE] ===== IMAGE PROCESSING COMPLETE =====`);
        
        // DO NOT fake enhancement with a white background. Return processed: false.
        return {
          success: false,
          processed: false,
          mode: 'photoroom-error',
          error: `HTTP ${response.status} - ${errMessage}`,
          originalImage: originalUrl,
          enhancedImage: null
        };
      }
    } catch (error) {
      const errorDetail = error.response ? `HTTP ${error.response.status} - ${error.response.statusText}` : error.message;
      console.log(`[IMAGE] Photoroom HTTP status: ${error.response ? error.response.status : 'Unknown'}`);
      console.log(`[IMAGE] Photoroom error: ${errorDetail}`);
      if (error.response && error.response.data) {
        console.log(`[IMAGE] Photoroom response: ${error.response.data.toString()}`);
      }
      console.log(`[IMAGE] ===== IMAGE PROCESSING COMPLETE =====`);
      
      return {
        success: false,
        processed: false,
        mode: 'photoroom-error',
        error: errorDetail,
        originalImage: originalUrl,
        enhancedImage: null
      };
    }
  } else {
    console.log(`[IMAGE] ===== IMAGE PROCESSING COMPLETE =====`);
    
    return {
      success: false,
      processed: false,
      mode: "photoroom-not-configured",
      error: "PHOTOROOM_API_KEY is missing",
      originalImage: originalUrl,
      enhancedImage: null
    };
  }
}

module.exports = {
  processImage,
  ORIGINAL_DIR,
  ENHANCED_DIR
};
