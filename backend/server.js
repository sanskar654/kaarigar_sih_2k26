// Express Server for Kaarigar Track B (Selling Flow) & Track C Integration
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const { getProductPricing, getSuggestedPrice } = require('./priceEngine');
const { createListing, getListings, getListing, updateListing } = require('./listingData');
const { processImage, ORIGINAL_DIR, ENHANCED_DIR } = require('./imageProcessor');
const { classifyProduct, generateDescription } = require('./aiListingGenerator');
const { parseSpokenNumber } = require('./numberNormalizer');
const prompts = require('../config/languages');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Explicitly route root to the landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, ORIGINAL_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'original-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only clear image files (JPG, PNG, WEBP) are supported.'));
  }
});

// Demo Artisans store (simulating Track A output)
const demoArtisans = {
  "ARTISAN_001": {
    id: "ARTISAN_001",
    name: "Ramesh",
    craft: "Pottery",
    location: "Jaipur",
    verified: true,
    language: "hi"
  },
  "ARTISAN_002": {
    id: "ARTISAN_002",
    name: "Sunita",
    craft: "Weaving",
    location: "Varanasi",
    verified: true,
    language: "en"
  },
  "ARTISAN_003": {
    id: "ARTISAN_003",
    name: "Aniket",
    craft: "Wood Craft",
    location: "Kolhapur",
    verified: true,
    language: "mr"
  },
  "ARTISAN_004": {
    id: "ARTISAN_004",
    name: "Debjani",
    craft: "Embroidery",
    location: "Shantiniketan",
    verified: true,
    language: "bn"
  }
};

// 1. Session Endpoint (Track A integration point)
app.post('/api/normalize-number', (req, res) => {
  try {
    const { text } = req.body;
    const numberVal = parseSpokenNumber(text);
    res.json({ text, numberVal });
  } catch (err) {
    res.status(500).json({ error: "Number normalization failed", details: err.message });
  }
});

app.get('/api/seller/session', (req, res) => {
  try {
    const artisanId = req.query.artisanId || "ARTISAN_001";
    const reqLang = req.query.lang || req.query.language;

    const baseArtisan = demoArtisans[artisanId] || demoArtisans["ARTISAN_001"];
    const language = (reqLang && ['en', 'hi', 'mr', 'bn'].includes(reqLang.toLowerCase()))
      ? reqLang.toLowerCase()
      : baseArtisan.language;

    const session = {
      sessionId: `SESS_${Date.now()}_${artisanId}`,
      artisan: {
        id: baseArtisan.id,
        name: baseArtisan.name,
        craft: baseArtisan.craft,
        location: baseArtisan.location,
        verified: baseArtisan.verified
      },
      language: language,
      prompts: prompts[language] || prompts['en'],
      status: "collecting"
    };

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: "Failed to initialize seller session", details: err.message });
  }
});

// 2. Classify Product Endpoint
app.post('/api/classify-product', async (req, res) => {
  try {
    const { productAnswer } = req.body;
    if (!productAnswer || productAnswer.trim() === "") {
      return res.status(400).json({ error: "Product answer is required" });
    }

    const classification = await classifyProduct(productAnswer);
    const pricing = getSuggestedPrice(classification.category, classification.subcategory);

    res.json({
      ...classification,
      pricing
    });
  } catch (err) {
    res.status(500).json({ error: "Product classification failed", details: err.message });
  }
});

// 3. Price Lookup Endpoint
app.post('/api/price', (req, res) => {
  try {
    const { category, subcategory } = req.body;
    if (!category || !subcategory) {
      return res.status(400).json({ error: "Category and subcategory are required" });
    }
    const pricing = getSuggestedPrice(category, subcategory);
    res.json(pricing);
  } catch (err) {
    res.status(500).json({ error: "Price lookup failed", details: err.message });
  }
});

// 4. Generate Description Endpoint
app.post('/api/generate-description', async (req, res) => {
  try {
    const { productName, category, subcategory, quantity, originalDescription, craft, location, language } = req.body;
    if (!originalDescription) {
      return res.status(400).json({ error: "Original description is required" });
    }

    const result = await generateDescription({
      productName,
      category,
      subcategory,
      quantity,
      originalDescription,
      craft,
      location,
      language: language || 'hi'
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Description generation failed", details: err.message });
  }
});

// 5. Image Upload & Photoroom Processing Endpoint
app.post('/api/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    const { productName, category, description } = req.body;
    const productContext = { productName, category, description };

    const processed = await processImage(req.file, productContext);
    res.json(processed);
  } catch (err) {
    res.status(500).json({ error: "Image processing failed", details: err.message });
  }
});

// 6. Create Listing Endpoint
app.post('/api/listing', (req, res) => {
  try {
    const listing = createListing(req.body);
    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ error: "Failed to create listing", details: err.message });
  }
});

// 7. Get Published Listings (Track C integration endpoint)
app.get('/api/listings', (req, res) => {
  try {
    const showAll = req.query.all === 'true';
    const listings = getListings(!showAll);
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch listings", details: err.message });
  }
});

// 8. Get Single Listing Endpoint
app.get('/api/listing/:id', (req, res) => {
  try {
    const listing = getListing(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }
    res.json(listing);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch listing", details: err.message });
  }
});

// 9. Update Listing Endpoint (for Edit Listing workflow)
app.put('/api/listing/:id', (req, res) => {
  try {
    const updated = updateListing(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Listing not found" });
    }
    res.json({ success: true, listing: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update listing", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(` Kaarigar Track B Selling Flow Server running at:`);
  console.log(` http://localhost:${PORT}`);
  console.log(` Demo URL: http://localhost:${PORT}/seller.html?artisanId=ARTISAN_001&lang=hi`);
  console.log(`========================================================`);
});
