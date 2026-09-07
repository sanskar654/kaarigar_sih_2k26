# Kaarigar Track B (Selling Flow) Documentation

## Overview
Track B is the conversational selling workflow for the Kaarigar marketplace prototype. It empowers artisans to easily list handmade products by answering simple natural-language questions, avoiding complicated e-commerce forms. 

The website maintains the authentic Kaarigar visual identity (dark brown header `#4A2E1B`, orange border accent `#D96B27`, cream background `#FDFBF7`, brown section headers `#5C3A21`, thin borders `#D3C7B5`, and simple rectangular input fields).

---

## 1. Track B Architecture

```
Track A (Artisan Verification & Language Selection)
         ↓ { artisanId, artisanName, craft, location, verified, language }
Track B Conversational Web Engine (seller.html / seller.js)
         ↓
 1. Product Question (Product Name)
 2. Quantity Question
 3. Description Question
         ↓
 AI Product Understanding & Classification (backend/aiListingGenerator.js)
         ↓ Categories & Subcategories
 Predefined Price Engine (backend/priceEngine.js) → { min, max, average, suggestedPrice }
         ↓
 4. Price Suggestion & Final Price Selection (Artisan decides finalPrice)
         ↓
 5. Product Photo Upload
         ↓ Photoroom API / Dev Fallback (backend/imageProcessor.js)
 Background Removal & Enhancement
         ↓
 AI Marketplace Description Generator (English + Local Language)
         ↓
 Listing Preview (Kaarigar Reference Design) → Edit / Save → Publish
         ↓ status = "published"
 Track C Marketplace Catalog Integration (GET /api/listings)
```

---

## 2. Conversation Flow & State Machine

Track B operates on a 14-state sequential machine:
1. `START`: Initialized via `/api/seller/session?artisanId=ARTISAN_001&lang=hi`.
2. `ASK_PRODUCT` (Step 1): "What product would you like to sell?"
3. `ASK_QUANTITY` (Step 2): "How many do you have?"
4. `ASK_DESCRIPTION` (Step 3): "Tell me something about your product."
5. `CLASSIFY_PRODUCT` & `GENERATE_DESCRIPTION` (Step 4): Maps product to category/subcategory and generates polished marketplace descriptions.
6. `SHOW_PRICE` & `ASK_FINAL_PRICE` (Step 4): Displays price range (`min`-`max`) and `suggestedPrice`. Prompts artisan for final selling price.
7. `UPLOAD_PHOTO` & `PROCESS_PHOTO` (Step 5): Artisan uploads photo, processed via Photoroom API.
8. `GENERATE_LISTING`: Builds final listing object.
9. `PREVIEW`: Shows full preview with "✓ Verified Artisan" badge.
10. `EDIT` & `SAVE`: Enables editing fields without overwriting artisan's final price.
11. `PUBLISHED`: Updates status to `published` and displays success view with `[ View Listing ]` button.

---

## 3. Supported Languages

Track B supports EXACTLY 4 languages:
- **English (`en`)**
- **Hindi (`hi`)**
- **Marathi (`mr`)**
- **Bengali (`bn`)**

Language configuration dictionary resides in `config/languages.js`. Language is passed from Track A and is **never** re-prompted to the artisan.

---

## 4. Category Dataset & Price Engine

Dataset location: `data/product_categories.js`
- 12 Main Categories
- 58 Subcategories
- Prototype seed values for `min`, `max`, and `average`.

**Price Engine Rules**:
- `suggestedPrice` equals `average`.
- The artisan's `finalPrice` is completely user-controlled.
- `suggestedPrice` and `finalPrice` are stored separately in the listing object.
- Soft warnings are displayed if `finalPrice` is outside `min`-`max`, but the artisan's choice is always respected.

---

## 5. Image Processing (Photoroom API)

Location: `backend/imageProcessor.js`
- Original photos stored in `backend/uploads/original/`.
- Processed photos stored in `backend/uploads/enhanced/`.
- Primary processor: Photoroom API (`PHOTOROOM_API_KEY`).
- Development Fallback: If API key is absent/invalid, copies image to `enhanced/` and sets `mode: "development-fallback"` to ensure end-to-end flow testability without false enhancement claims.

---

## 6. Listing Object Schema

```json
{
  "id": "LISTING_1725600000_123",
  "artisan": {
    "id": "ARTISAN_001",
    "name": "Ramesh",
    "craft": "Pottery",
    "location": "Jaipur",
    "verified": true
  },
  "language": "hi",
  "product": {
    "name": "Handmade Clay Diyas",
    "category": "Pottery & Ceramics",
    "subcategory": "Diyas",
    "quantity": 10
  },
  "description": {
    "original": "ये हाथ से बनाए हुए मिट्टी के दीये हैं और जयपुर में बनाए हैं।",
    "generatedEnglish": "Authentic handmade diyas carefully crafted by Pottery artisan from Jaipur.",
    "generatedLocal": "हस्तनिर्मित सुंदर diyas। Jaipur के कुशल कारीगर द्वारा तैयार किया गया।"
  },
  "pricing": {
    "min": 20,
    "max": 500,
    "average": 100,
    "suggestedPrice": 100,
    "finalPrice": 150
  },
  "photo": {
    "original": "/uploads/original/abc.jpg",
    "enhanced": "/uploads/enhanced/abc.png"
  },
  "status": "published",
  "createdAt": "2026-09-06T12:00:00.000Z"
}
```

---

## 7. API Endpoints

- `GET /api/seller/session?artisanId=...&lang=...` - Returns seller session & language prompts.
- `POST /api/classify-product` - Maps user text to category & subcategory dataset.
- `POST /api/generate-description` - Generates polished truthful marketplace description.
- `POST /api/price` - Returns pricing bounds for category/subcategory.
- `POST /api/upload` - Handles file upload and Photoroom processing.
- `POST /api/listing` - Creates listing draft.
- `GET /api/listings` - Returns published listings for Track C.
- `GET /api/listing/:id` - Returns single listing by ID.
- `PUT /api/listing/:id` - Updates listing details or status.

---

## 8. Track A & Track C Integration Points

- **Track A Integration**: Track A passes artisan identity and selected language via URL parameters or session lookup (`/api/seller/session?artisanId=ARTISAN_001&lang=hi`).
- **Track C Integration**: Track C consumes published listings via `GET /api/listings`. Individual product viewing is accessible via `/view-listing.html?id=LISTING_ID` or `GET /api/listing/:id`.

---

## 9. How to Run & Environment Variables

### Environment Variables (`.env`)
```env
PORT=3000
OPENAI_API_KEY=your_openai_api_key_here
PHOTOROOM_API_KEY=your_photoroom_api_key_here
```

### Server Command
```bash
node backend/server.js
```

### Browser Demo URLs
- Hindi Demo: `http://localhost:3000/seller.html?artisanId=ARTISAN_001&lang=hi`
- English Demo: `http://localhost:3000/seller.html?artisanId=ARTISAN_002&lang=en`
- Marathi Demo: `http://localhost:3000/seller.html?artisanId=ARTISAN_003&lang=mr`
- Bengali Demo: `http://localhost:3000/seller.html?artisanId=ARTISAN_004&lang=bn`

### Run Automated Tests
```bash
npm test
```
