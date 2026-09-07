// Automated End-to-End Test Script for Track B (Selling Flow) & API verification
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const BASE_URL = 'http://127.0.0.1:3000';

async function runTests() {
  console.log('========================================================');
  console.log(' Starting Track B End-to-End Acceptance Tests...');
  console.log('========================================================\n');

  try {
    // 1. Session Test
    console.log('Test 1: Fetch Seller Session (Marathi / Ramesh)');
    const sessionRes = await axios.get(`${BASE_URL}/api/seller/session?artisanId=ARTISAN_001&lang=mr`);
    console.log('✔ Session Response:', {
      artisanName: sessionRes.data.artisan.name,
      craft: sessionRes.data.artisan.craft,
      verified: sessionRes.data.artisan.verified,
      language: sessionRes.data.language
    });
    if (sessionRes.data.language !== 'mr' || !sessionRes.data.artisan.verified) {
      throw new Error('Session test failed: Incorrect language or verification status');
    }

    // Spoken Number Normalization Test
    console.log('\nTest 1b: Spoken Indic Number Normalization ("दहा" and "दीडशे")');
    const norm1 = await axios.post(`${BASE_URL}/api/normalize-number`, { text: "दहा" });
    const norm2 = await axios.post(`${BASE_URL}/api/normalize-number`, { text: "दीडशे" });
    console.log('✔ Normalized "दहा":', norm1.data.numberVal, '| "दीडशे":', norm2.data.numberVal);
    if (norm1.data.numberVal !== 10 || norm2.data.numberVal !== 150) {
      throw new Error('Number normalizer test failed');
    }

    // 2. Classification Test
    console.log('\nTest 2: Classify Product "मिट्टी के दीये"');
    const classRes = await axios.post(`${BASE_URL}/api/classify-product`, { productAnswer: "मिट्टी के दीये" });
    console.log('✔ Classification Result:', {
      category: classRes.data.category,
      subcategory: classRes.data.subcategory,
      min: classRes.data.pricing.min,
      max: classRes.data.pricing.max,
      average: classRes.data.pricing.average,
      suggestedPrice: classRes.data.pricing.suggestedPrice
    });
    if (classRes.data.category !== 'Pottery & Ceramics' || classRes.data.subcategory !== 'Diyas') {
      throw new Error('Classification test failed: Incorrect category/subcategory assignment');
    }
    if (classRes.data.pricing.min !== 20 || classRes.data.pricing.max !== 500 || classRes.data.pricing.average !== 100) {
      throw new Error('Price engine test failed: Incorrect min/max/average dataset values');
    }

    // 3. Description Generation Test
    console.log('\nTest 3: Generate Marketplace Description');
    const descRes = await axios.post(`${BASE_URL}/api/generate-description`, {
      productName: "मिट्टी के दीये",
      category: "Pottery & Ceramics",
      subcategory: "Diyas",
      quantity: 10,
      originalDescription: "ये हाथ से बनाए हुए मिट्टी के दीये हैं और जयपुर में बनाए हैं।",
      craft: "Pottery",
      location: "Jaipur",
      language: "hi"
    });
    console.log('✔ Generated Description:', descRes.data);

    // 4. Image Upload Test
    console.log('\nTest 4: Image Upload & Processing');
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    const tempImagePath = path.join(__dirname, 'test_diya.png');
    fs.writeFileSync(tempImagePath, testImageBuffer);

    const formData = new FormData();
    formData.append('photo', fs.createReadStream(tempImagePath), 'test_diya.png');

    const uploadRes = await axios.post(`${BASE_URL}/api/upload`, formData, {
      headers: formData.getHeaders()
    });
    console.log('✔ Image Upload Result:', uploadRes.data);

    if (fs.existsSync(tempImagePath)) fs.unlinkSync(tempImagePath);

    const origPath = uploadRes.data.originalImage || uploadRes.data.originalPath;
    const enhPath = uploadRes.data.enhancedImage || uploadRes.data.enhancedPath;

    // 5. Listing Creation Test (Artisan sets final price = ₹150)
    console.log('\nTest 5: Create Listing Object');
    const listingPayload = {
      artisan: sessionRes.data.artisan,
      language: sessionRes.data.language,
      product: {
        name: "Handmade Clay Diyas",
        category: classRes.data.category,
        subcategory: classRes.data.subcategory,
        quantity: 10
      },
      description: {
        original: "ये हाथ से बनाए हुए मिट्टी के दीये हैं और जयपुर में बनाए हैं।",
        generatedEnglish: descRes.data.generatedEnglish,
        generatedLocal: descRes.data.generatedLocal
      },
      pricing: {
        min: classRes.data.pricing.min,
        max: classRes.data.pricing.max,
        average: classRes.data.pricing.average,
        suggestedPrice: classRes.data.pricing.suggestedPrice,
        finalPrice: 150
      },
      photo: {
        original: origPath,
        enhanced: enhPath
      },
      status: 'draft'
    };

    const listingRes = await axios.post(`${BASE_URL}/api/listing`, listingPayload);
    const createdListing = listingRes.data.listing;
    console.log('✔ Created Listing ID:', createdListing.id);
    console.log('✔ Preserved Prices - suggestedPrice:', createdListing.pricing.suggestedPrice, '| finalPrice:', createdListing.pricing.finalPrice);

    if (createdListing.pricing.suggestedPrice !== 100 || createdListing.pricing.finalPrice !== 150) {
      throw new Error('Price preservation failed: finalPrice did not preserve custom artisan value 150');
    }

    // 6. Edit Listing Test
    console.log('\nTest 6: Edit Listing (Change quantity to 12)');
    const editRes = await axios.put(`${BASE_URL}/api/listing/${createdListing.id}`, {
      product: { quantity: 12 }
    });
    console.log('✔ Updated Quantity:', editRes.data.listing.product.quantity);

    // 7. Publish Listing Test
    console.log('\nTest 7: Publish Listing');
    const pubRes = await axios.put(`${BASE_URL}/api/listing/${createdListing.id}`, {
      status: 'published'
    });
    console.log('✔ Status Updated:', pubRes.data.listing.status);

    // 8. Fetch Published Listings (Track C integration check)
    console.log('\nTest 8: Fetch Published Listings for Track C');
    const allPublished = await axios.get(`${BASE_URL}/api/listings`);
    console.log('✔ Total Published Listings:', allPublished.data.length);

    console.log('\n========================================================');
    console.log(' 🎉 ALL TRACK B ACCEPTANCE TESTS PASSED SUCCESSFULLY!');
    console.log('========================================================\n');
  } catch (err) {
    console.error('\n❌ Test execution failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

runTests();
