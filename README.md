# 🏺 Kaarigar — Handmade, Direct from the Artisan

> **SIH 2026 · Problem Statement SIH26090 · Team Blackbox**

A full-stack marketplace prototype that connects verified Indian artisans directly with buyers — no middlemen, no commission games. This project unifies the entire Kaarigar platform, bringing together the **Buyer Marketplace**, **Seller Tools**, and **Artisan Onboarding** under a cohesive architecture.

---

## 📋 Table of Contents

- [What It Does](#-what-it-does)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Features & Functionalities](#-features--functionalities)
  - [Buyer App](#-buyer-app)
  - [Seller App](#-seller-app)
  - [Onboarding & AI Backend](#-onboarding--ai-backend)
- [API Reference](#-api-reference)
- [How to Run Locally](#-how-to-run-locally)

---

## 🎯 What It Does

**Kaarigar** solves the economic exploitation of Indian artisans by removing middlemen and ensuring every rupee reaches the maker through a secure **escrow payment model**:

1. **Onboarding:** Artisans register by calling a phone number. They submit their government Pahchan ID via WhatsApp, which is automatically verified using OCR.
2. **Selling:** Verified artisans list their products by either answering simple AI-powered questions or using our streamlined Web App. AI automatically categorizes the product, suggests a fair market price, removes the photo background (via Photoroom API), and writes multilingual descriptions.
3. **Buying:** Buyers browse, add to cart, and pay via the Marketplace.
4. **Escrow:** Money is held in escrow until the buyer confirms receipt. On delivery confirmation, funds are released instantly and the artisan receives a WhatsApp notification.

---

## 🏗️ Architecture

The system features separated Frontends for Buyers and Sellers to ensure distinct logins and workflows, all powered by a **Unified Python FastAPI Backend**.

```
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
│            Buyer Web App             │     │            Seller Web App            │
│       frontend/buyer/index.html      │     │      frontend/seller/index.html      │
│     Vanilla JS + Localized UI        │     │     Vanilla JS + AI Integrations     │
└──────────────────┬───────────────────┘     └──────────────────┬───────────────────┘
                   │                                            │
                   ▼                                            ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           Unified FastAPI Backend                                  │
│             /buyer/* · /seller/* · /api/listings · /api/orders                     │
│               /api/classify-product · /api/upload · /api/price                     │
│                        /voice/* · /whatsapp/* (Webhooks)                           │
└─────────────────────────────────────┬─────────────────────────────────────────────┘
                                      │
                                      ▼
                      ┌──────────────────────────────┐
                      │    Supabase (PostgreSQL)     │
                      │     or Local SQLite DB       │
                      └──────────────────────────────┘
```

---

## 📁 Project Structure

```
SIH2k26/
├── README.md                        ← You are here
├── backend/                         ← Unified FastAPI Python backend
│   ├── main.py                      ← Core API routes, Static mounting
│   ├── models.py                    ← Pydantic request/response models
│   ├── payments.py                  ← Razorpay integration
│   ├── repository.py                ← Database implementation
│   ├── seed.py                      ← Demo data seeder
│   ├── services/                    ← Seller AI integrations
│   │   ├── ai_generator.py          ← OpenAI categorization & descriptions
│   │   ├── image_processor.py       ← Photoroom background removal
│   │   └── price_engine.py          ← Smart pricing logic
│   └── onboarding/                  ← Track A (Twilio Voice/WhatsApp & OCR)
│       ├── routes/                  
│       └── services/                
│
├── frontend/                        ← Separated Frontends
│   ├── buyer/                       ← Buyer Marketplace & Dashboard
│   │   ├── index.html               ← Catalog
│   │   ├── cart.html                ← Checkout
│   │   ├── dashboard.html           ← Artisan Dashboard
│   │   └── assets/                  ← Buyer JS and CSS
│   └── seller/                      ← Seller Listing Flow
│       ├── index.html               ← Seller Landing
│       ├── seller.html              ← AI-Assisted Listing form
│       └── view-listing.html        ← Listing Preview
```

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Frontends** | Vanilla HTML5, CSS3, JavaScript (ES2020) — no build step |
| **Backend** | Python 3.11+ · FastAPI 0.115 · Uvicorn |
| **AI Processing** | OpenAI (GPT-4o-mini) for Categorization & Descriptions |
| **Image Processing** | Photoroom API v2 for Background Removal |
| **Telephony/OCR** | Twilio Voice & WhatsApp Webhooks + pytesseract |
| **Database** | SQLite (local) / Supabase PostgreSQL (prod) |
| **Payments** | Razorpay (Test Mode) |

---

## ✨ Features & Functionalities

### 🛍️ Buyer App (`/buyer/`)
- **Product Catalog:** Responsive grid with category filtering, debounced search, and skeleton loading.
- **Cart & Checkout:** Persistent cart via `localStorage`, integrated with Razorpay (Test Mode).
- **Escrow Verification:** Real-time dashboard showing funds held in escrow, which are released manually via an admin dashboard.
- **Multilingual UI:** Instant switching between English, Hindi, and Marathi.

### 🏪 Seller App (`/seller/`)
- **AI-Assisted Listing Flow:** Sellers enter the name of the product and an original description. AI maps this to exact marketplace categories and provides dynamic price suggestions.
- **Image Enhancement:** Integrated with the Photoroom API to seamlessly remove clutter from product images and place them on a clean, professional background.
- **Number Normalization:** Normalizes spoken Hindi/Marathi numeric inputs to numbers (e.g., 'सौ' → 100).
- **Listing Preview:** Sellers review the polished generated description and AI-enhanced image before confirming.

### 📞 Onboarding & Backend APIs (`/voice/`, `/whatsapp/`)
- **Interactive Voice Response (IVR):** Fully localized Hindi Twilio Voice menu routing callers.
- **WhatsApp Webhooks:** Handles incoming ID card photos and extracts artisan data automatically using Tesseract OCR.
- **Pahchan ID Gate:** Artisans cannot list products on the Seller Web App until their OCR identity check passes.

---

## 📡 API Reference

The backend exposes a wide range of REST APIs over `http://localhost:8000/api/`. Interactive docs are automatically generated at `http://localhost:8000/docs`.

### Core Endpoints
- `GET /api/categories` - Fetch available product categories.
- `GET /api/listings` - Browse and search all public listings.
- `POST /api/orders` - Process carts and initiate Razorpay checkout.
- `POST /api/orders/{id}/verify` - Escrow logic holding funds.
- `POST /api/orders/{id}/deliver` - Releases escrow funds.

### Seller Integrations
- `POST /api/classify-product` - AI classification mapping free-form strings to taxonomies.
- `POST /api/generate-description` - Generates localized (EN/HI/MR/BN) product descriptions.
- `POST /api/upload` - Processes images through the Photoroom API.
- `POST /api/price` - Returns accurate `min`, `max`, and `average` suggested prices.

---

## 🚀 How to Run Locally

### Prerequisites
- Python 3.11+
- pip

### Step 1 — Install backend dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 2 — Configure environment
Copy `backend/.env.example` to `backend/.env`.
For the full AI features to work, ensure you populate:
- `OPENAI_API_KEY`
- `PHOTOROOM_API_KEY`
- `TWILIO_*` (If testing Onboarding)

*If left blank, the system gracefully falls back to local regex matching, templates, and mock payments!*

### Step 3 — Seed demo data
```bash
cd backend
python seed.py
```

### Step 4 — Start the server
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

### Step 5 — Open the app
- **Buyer Flow:** [http://localhost:8000/buyer/index.html](http://localhost:8000/buyer/index.html)
- **Seller Flow:** [http://localhost:8000/seller/index.html](http://localhost:8000/seller/index.html)
- **API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
