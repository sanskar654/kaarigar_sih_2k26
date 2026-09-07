# 🏺 Kaarigar — Handmade, Direct from the Artisan

> **SIH 2026 · Problem Statement SIH26090 · Team Blackbox · Track C (Sanskar)**

A full-stack marketplace prototype that connects verified Indian artisans directly with buyers — no middlemen, no commission games. Built for **Smart India Hackathon 2026**.

---

## 📋 Table of Contents

- [What It Does](#-what-it-does)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Features & Functionalities](#-features--functionalities)
- [Multilingual Support](#-multilingual-support)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [How to Run Locally](#-how-to-run-locally)
- [Environment Variables](#-environment-variables)
- [Deployment (Render + Supabase)](#-deployment-render--supabase)
- [Payment Flow — Escrow Model](#-payment-flow--escrow-model)
- [Track Integration](#-track-integration)

---

## 🎯 What It Does

**Kaarigar** solves the economic exploitation of Indian artisans by removing middlemen and ensuring every rupee reaches the maker through a secure **escrow payment model**:

1. A verified artisan lists a handmade product (via phone call, WhatsApp, or app — Track A/B)
2. A buyer browses, adds to cart, and pays
3. **Money is held in escrow** — never released to the artisan until the buyer confirms receipt
4. On delivery confirmation, funds are released instantly with a WhatsApp notification to the artisan

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                       Browser (Buyer)                     │
│  index.html · product.html · cart.html · dashboard.html  │
│  Vanilla JS (catalog.js, cart.js, product.js, dash.js)   │
│  Multilingual: locales.js + lang-switcher.js              │
└───────────────────────┬──────────────────────────────────┘
                        │  REST API (JSON)
                        ▼
┌──────────────────────────────────────────────────────────┐
│              FastAPI Backend  (backend/main.py)           │
│  /api/listings  /api/orders  /api/artisans  /api/health  │
└──────┬─────────────────────────────────┬─────────────────┘
       │                                 │
       ▼                                 ▼
┌─────────────┐                ┌─────────────────────┐
│  SQLite DB  │ ←── local ──   │  Supabase (Postgres) │ ← production
│ kaarigar.db │    fallback     │   (shared w/ A & B)  │
└─────────────┘                └─────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │  Razorpay API    │
              │  (Test Mode)     │
              └──────────────────┘
```

**Track Integration:**
- **Track A** (Onboarding) → creates artisans, verifies Pahchan ID via `POST /api/artisans` & `POST /api/artisans/{id}/verify`
- **Track B** (Selling / WhatsApp AI) → publishes listings via `POST /api/listings` (only for verified artisans)
- **Track C** (This repo) → buyer-facing marketplace, checkout, escrow, dashboard

---

## 📁 Project Structure

```
SIH2k26/
├── README.md                        ← You are here
├── render.yaml                      ← One-click Render deployment config
├── generate_report.py               ← PDF report generator
│
├── backend/                         ← FastAPI Python backend
│   ├── main.py                      ← All API routes (catalog, orders, artisans)
│   ├── models.py                    ← Pydantic request/response models
│   ├── payments.py                  ← Razorpay integration + mock fallback
│   ├── repository.py                ← Repository selector (SQLite vs Supabase)
│   ├── repo_sqlite.py               ← SQLite implementation (local dev)
│   ├── repo_supabase.py             ← Supabase/PostgreSQL implementation (prod)
│   ├── dbutil.py                    ← SQLite helpers
│   ├── schema.sql                   ← Database schema (run in Supabase SQL editor)
│   ├── seed.py                      ← Demo data seeder (10 artisans + products)
│   ├── requirements.txt             ← Core dependencies
│   ├── requirements-optional.txt    ← Supabase + Razorpay (optional)
│   ├── .env.example                 ← Config template
│   ├── Procfile                     ← Heroku/Render process file
│   └── kaarigar.db                  ← Auto-created SQLite file (local only)
│
├── buyer/                           ← Frontend (Vanilla HTML/CSS/JS)
│   ├── index.html                   ← Catalog / home page
│   ├── product.html                 ← Product detail page
│   ├── cart.html                    ← Cart + checkout
│   ├── dashboard.html               ← Artisan earnings dashboard
│   └── assets/
│       ├── style.css                ← Design system (glassmorphism + animations)
│       ├── api.js                   ← API client + cart (localStorage) + K global
│       ├── locales.js               ← 🌐 Multilingual dictionary (EN · हिन्दी · मराठी)
│       ├── lang-switcher.js         ← Language switcher dropdown controller
│       ├── catalog.js               ← Home page: chips, search, product grid
│       ├── product.js               ← Product detail: qty, add-to-cart, story
│       ├── cart.js                  ← Cart + Razorpay checkout + order success
│       └── dashboard.js             ← Artisan dashboard: stats, orders, listings
│
├── onboarding/                      ← Track A (artisan ID verification)
│   └── README.md
│
├── selling/                         ← Track B (WhatsApp AI listing)
│   └── README.md
│
└── docs/                            ← Project documentation
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES2020) — no build step |
| **Styling** | Custom CSS design system (Outfit font, glassmorphism, CSS animations) |
| **Backend** | Python 3.11+ · FastAPI 0.115 · Uvicorn |
| **Database (local)** | SQLite (auto-created, zero config) |
| **Database (prod)** | Supabase (PostgreSQL) |
| **Payments** | Razorpay (Test Mode) with built-in mock fallback |
| **Deployment** | Render (backend) + static file serving via FastAPI |
| **i18n** | Custom client-side localization engine (no dependencies) |

---

## ✨ Features & Functionalities

### 🛍️ Buyer-Facing (Frontend)

#### Product Catalog (`index.html`)
- Responsive **product grid** with card hover animations
- **Category chips** — filter by Pottery, Textiles, Metalwork, Woodwork, Handicraft
- **Live debounced search** (280ms) — searches title, description, artisan name
- **Skeleton loading states** for cards while API loads
- **Authenticity score badge** (e.g. "92% handmade") on every product
- **Verified artisan badge** (Pahchan ID confirmed)
- Add to cart directly from the grid — green "Added ✓" animation

#### Product Detail (`product.html`)
- Full product image, bilingual description (English + local script)
- **Quantity selector** with max-stock enforcement
- Add to cart + Buy Now buttons
- **Artisan story panel** — name, craft type, village, personal story
- Escrow safety notice personalized with artisan's first name

#### Cart & Checkout (`cart.html`)
- Persistent cart via `localStorage` — survives page refresh and navigation
- Quantity edit (±1) and item removal inline
- **Delivery details form** (name, phone, city)
- Live total calculation (subtotal + free delivery)
- **Razorpay integration** (Test Mode) — or seamless mock payment if no keys configured
- **Order success screen** with item table, status badge, and "simulate courier" button

#### Artisan Dashboard (`dashboard.html`)
- View any artisan's earnings in real-time (demo: select from dropdown)
- **Stat cards**: Total earned · Released to you · Held in escrow · Orders · Live listings
- **Orders table**: buyer info, item list, status badge, per-artisan amount
- **Confirm delivery button** — releases held payment to artisan (admin demo action)
- **Listings table**: product, category, price, qty, handmade score

### ⚙️ Backend API (FastAPI)

- **Catalog endpoint** with category filtering + full-text search
- **Order creation** — prices loaded server-side (client sends only IDs + qty), prevents price tampering
- **Payment verification** — Razorpay HMAC signature check
- **Escrow model** — money held after payment, released only on delivery confirmation
- **Artisan dashboard** endpoint — per-artisan earnings computed from orders
- **Shared write endpoints** for Track A (artisan creation/verification) and Track B (listing publication)
- **Pahchan ID gate** — `POST /api/listings` returns HTTP 403 if artisan is not verified
- Auto-generated **interactive API docs** at `/docs` (Swagger UI)
- **Dual database backend** — SQLite for zero-config local dev, Supabase for production

### 🎨 Design System

- **Glassmorphism header** — `backdrop-filter: blur(20px)` sticky nav
- **Animated hero section** — 3 floating radial gradient shapes (CSS-only)
- **Micro-animations** — card hover lift, button pop, skeleton shimmer, success fade-in
- **Premium typography** — Outfit 900 weight headlines, fluid `clamp()` sizing
- **Responsive layout** — mobile-first, tested down to 360px
- **Devanagari optimization** — `:lang(hi)` / `:lang(mr)` CSS for Hindi/Marathi text

---

## 🌐 Multilingual Support

The buyer app supports **3 languages** with instant in-page switching — no page reload needed.

| Language | Code | Script |
|---|---|---|
| English | `en` | Latin |
| Hindi | `hi` | देवनागरी |
| Marathi | `mr` | देवनागरी |

### How to Switch Language
Click the **🇬🇧 EN** button in the top-right of the header → select your language from the dropdown.

### How It Works (Technical)
```
locales.js          → Full dictionary (~60 keys × 3 languages)
api.js              → K.t(), K.setLang(), K.applyLang() on global K object
lang-switcher.js    → Dropdown UI (open/close, ARIA, active state)
HTML pages          → data-i18n="key" for static text
JS page scripts     → K.t("key") for dynamically rendered content
```

1. `K.setLang("hi")` → saves to `localStorage`, updates `<html lang>` attribute
2. `K.applyLang()` → scans all `[data-i18n]` elements and updates text
3. Fires `kaarigar:langchange` custom DOM event
4. Each page script listens and **re-renders its dynamic HTML** in the new language
5. Language choice persists across all pages via `localStorage`

---

## 📡 API Reference

All endpoints are available at `http://localhost:8000/api/`. Interactive docs: `http://localhost:8000/docs`.

### Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns backend type + payment mode |

### Catalog
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/categories` | Returns list of product categories |
| `GET` | `/api/listings?category=&q=` | List/search products |
| `GET` | `/api/listings/{id}` | Single product detail |
| `POST` | `/api/listings` | Create listing (Track B, verified artisans only) |

### Artisans
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/artisans` | List all artisans |
| `POST` | `/api/artisans` | Create artisan (Track A) |
| `POST` | `/api/artisans/{id}/verify` | Mark Pahchan ID verified (Track A) |
| `GET` | `/api/artisans/{id}/dashboard` | Artisan earnings + orders + listings |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/orders` | List all orders |
| `GET` | `/api/orders/{id}` | Get single order |
| `POST` | `/api/orders` | Create order + Razorpay order |
| `POST` | `/api/orders/{id}/verify` | Verify payment + hold in escrow |
| `POST` | `/api/orders/{id}/deliver` | Confirm delivery + release escrow |

### Order Status Flow
```
created  →  paid_held  →  released
              (escrow)    (artisan paid)
                ↓
              failed
```

---

## 🗄️ Database Schema

Three tables shared across all tracks:

```sql
artisans  (id, name, phone, village, craft_type, story, verified, created_at)
listings  (id, artisan_id, title, description, description_local, category,
           price, quantity, image_url, authenticity_score, status, created_at)
orders    (id, buyer_name, buyer_phone, buyer_city, items[JSON], amount,
           razorpay_order_id, razorpay_payment_id, status, created_at, delivered_at)
```

---

## 🚀 How to Run Locally

### Prerequisites
- Python 3.11+
- pip

### Step 1 — Clone the repository
```bash
git clone https://github.com/sanskar654/sih_mypart.git
cd sih_mypart
```

### Step 2 — Install backend dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 3 — (Optional) Configure environment
```bash
cp .env.example .env
# Edit .env to add Razorpay keys or Supabase URL
# Leave blank to use SQLite + mock payments (works perfectly for demo)
```

### Step 4 — Seed demo data
```bash
python seed.py
```
This creates 10 sample artisans (all verified) and ~20 handmade product listings with realistic data, images, and authenticity scores.

### Step 5 — Start the server
```bash
uvicorn main:app --reload --port 8000
```

### Step 6 — Open the app
| URL | Description |
|---|---|
| http://localhost:8000/ | Buyer-facing catalog |
| http://localhost:8000/product.html | Product detail |
| http://localhost:8000/cart.html | Cart & checkout |
| http://localhost:8000/dashboard.html | Artisan dashboard |
| http://localhost:8000/docs | Interactive API docs (Swagger) |

> **No separate frontend server needed.** FastAPI serves the `buyer/` folder as static files at `/`.

### Using the Frontend Directly (file://)
You can also open `buyer/index.html` directly in a browser. The JS auto-detects `file://` and points the API to `http://localhost:8000`.

---

## 🔐 Environment Variables

Create a `.env` file in the `backend/` folder (copy from `.env.example`):

```env
# Supabase (leave blank → uses local SQLite)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Razorpay Test Mode (leave blank → uses built-in mock payments)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your-secret

# Local SQLite file path (default: kaarigar.db in backend/)
KAARIGAR_DB=kaarigar.db
```

> With **no `.env` at all**, everything still works: SQLite is used as the database and payments are simulated. Perfect for running the demo offline.

### Test Payment Card (Razorpay Test Mode)
```
Card:    4111 1111 1111 1111
Expiry:  Any future date
CVV:     Any 3 digits
```

---

## ☁️ Deployment (Render + Supabase)

### One-click deploy on Render
The `render.yaml` in the root is pre-configured:
```yaml
# render.yaml
services:
  - type: web
    name: kaarigar-api
    runtime: python
    rootDir: backend
    buildCommand: pip install -r requirements.txt -r requirements-optional.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /api/health
```

**Steps:**
1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Blueprint → connect repo
3. Set env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) in the Render dashboard
4. Deploy → frontend available at `https://kaarigar-api.onrender.com/`

### Supabase Setup
1. Create a new Supabase project
2. Run `backend/schema.sql` in the Supabase SQL editor
3. Copy Project URL + service role key into Render env vars

### Frontend on Vercel (optional)
If you want to host the frontend separately:
1. Deploy `buyer/` to Vercel as a static site
2. Open `https://your-vercel-app.vercel.app/?api=https://kaarigar-api.onrender.com`
3. The `?api=` param is remembered in `localStorage` for all subsequent requests

---

## 💳 Payment Flow — Escrow Model

```
Buyer adds to cart
       ↓
POST /api/orders  ← prices fetched server-side (tamper-proof)
       ↓
Razorpay payment window opens (or mock in demo mode)
       ↓
POST /api/orders/{id}/verify  ← HMAC signature verified
       ↓
Status: paid_held  ← money held in escrow
       ↓
[Courier delivers the package]
       ↓
POST /api/orders/{id}/deliver  ← admin / demo button
       ↓
Status: released  ← artisan is paid
       ↓
WhatsApp message sent to artisan (Track A integration)
"नमस्ते Rekha! आपका ऑर्डर पहुँच गया है। ₹750 आपके खाते में भेज दिए गए हैं।"
```

**Key security property:** Prices are **never read from the client**. The `POST /api/orders` endpoint looks up prices from the database using the listing IDs sent by the browser, preventing price manipulation.

---

## 🤝 Track Integration

| Track | Role | API endpoints used |
|---|---|---|
| **Track A** (Onboarding) | Creates artisans, runs Pahchan ID OCR, marks verified | `POST /api/artisans`, `POST /api/artisans/{id}/verify` |
| **Track B** (WhatsApp AI) | Guides artisans to list products, uploads image, calls publish | `POST /api/listings` (blocked until artisan is verified) |
| **Track C** (This) | Buyer catalog, cart, checkout, escrow, dashboard | All `/api/*` endpoints |

**The Pahchan ID Gate** ensures Track B cannot publish a listing until Track A has verified the artisan's identity — enforced at the API level (`HTTP 403`).

---

## 👨‍💻 Author

**Sanskar** · Track C · Team Blackbox · SIH 2026

> *"Every product here was listed by a verified artisan — no middlemen, no commission games."*
