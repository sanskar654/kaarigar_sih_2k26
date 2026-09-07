"""Kaarigar backend — FastAPI (Unified Service)

Serves the buyer catalog, cart/checkout (Razorpay Test Mode), the artisan dashboard,
seller tools (pricing, image processing, AI), and Twilio onboarding routes.
"""
import os
import time
from pathlib import Path
from typing import Dict, Any

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

import payments
from models import CreateArtisan, CreateListing, CreateOrder, VerifyPayment, CreateBuyer, LoginRequest
from repository import backend_name, get_repo
import seed as seed_module

from services.price_engine import get_suggested_price, parse_spoken_number
from services.ai_generator import classify_product, generate_description
from services.image_processor import process_image
from services.prompts import prompts

from onboarding.routes.voice import router as voice_router
from onboarding.routes.whatsapp import router as whatsapp_router

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
BUYER_DIR = FRONTEND_DIR / "buyer"
SELLER_DIR = FRONTEND_DIR / "seller"
UPLOADS_DIR = Path(__file__).resolve().parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Kaarigar Unified API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(voice_router)
app.include_router(whatsapp_router)

@app.on_event("startup")
def seed_if_empty():
    repo = get_repo()
    if len(repo.list_artisans()) == 0 and len(repo.list_listings()) == 0:
        seed_module.run()

CATEGORIES = ["All", "Pottery", "Textiles", "Metalwork", "Woodwork", "Handicraft"]

@app.get("/api/health")
def health():
    return {
        "ok": True,
        "backend": backend_name(),
        "payments": "razorpay_test" if payments.LIVE else "mock",
    }

@app.get("/api/categories")
def categories():
    return {"categories": CATEGORIES}

# ── Catalog (buyer side) ─────────────────────────────────────────
@app.get("/api/listings")
def listings(category: str = "All", q: str = ""):
    rows = get_repo().list_listings(category)
    if q:
        needle = q.strip().lower()
        rows = [
            r for r in rows
            if needle in (r.get("title") or "").lower()
            or needle in (r.get("description") or "").lower()
            or needle in (r.get("artisan_name") or "").lower()
        ]
    return {"listings": rows, "count": len(rows)}

@app.get("/api/listings/{listing_id}")
def listing_detail(listing_id: str):
    row = get_repo().get_listing(listing_id)
    if not row:
        raise HTTPException(404, "Listing not found")
    return row

# ── Shared writes (Tracks A and B call these) ────────────────────
@app.post("/api/artisans")
def create_artisan(body: CreateArtisan):
    repo = get_repo()
    existing = repo.get_artisan_by_phone(body.phone)
    if existing:
        raise HTTPException(400, "Phone number already registered")
    
    # Auto-verify for web demo purposes
    data = body.model_dump()
    data["verified"] = True
    return repo.create_artisan(data)

@app.post("/api/artisans/login")
def login_artisan(body: LoginRequest):
    repo = get_repo()
    artisan = repo.get_artisan_by_phone(body.phone)
    if not artisan or artisan.get("password") != body.password:
        raise HTTPException(401, "Invalid phone or password")
    return {"message": "Login successful", "artisan": artisan}

@app.get("/api/artisans")
def list_artisans():
    return {"artisans": get_repo().list_artisans()}

@app.post("/api/artisans/{artisan_id}/verify")
def verify_artisan(artisan_id: str):
    row = get_repo().verify_artisan(artisan_id)
    if not row:
        raise HTTPException(404, "Artisan not found")
    return row

# ── Buyer Auth ──────────────────────────────────────────────
@app.post("/api/buyers/register")
def register_buyer(body: CreateBuyer):
    repo = get_repo()
    existing = repo.get_buyer_by_phone(body.phone)
    if existing:
        raise HTTPException(400, "Phone number already registered")
    buyer = repo.create_buyer(body.model_dump())
    return {"message": "Registration successful", "buyer": buyer}

@app.post("/api/buyers/login")
def login_buyer(body: LoginRequest):
    repo = get_repo()
    buyer = repo.get_buyer_by_phone(body.phone)
    if not buyer or buyer.get("password") != body.password:
        raise HTTPException(401, "Invalid phone or password")
    return {"message": "Login successful", "buyer": buyer}

@app.post("/api/listings")
def create_listing(body: CreateListing):
    repo = get_repo()
    artisan = repo.get_artisan(body.artisan_id)
    if not artisan:
        raise HTTPException(404, "Artisan not found")
    if not artisan.get("verified"):
        raise HTTPException(403, "Artisan is not verified — cannot publish a listing")
    
    # We return success: True for frontend compatibility
    listing = repo.create_listing(body.model_dump())
    return {"success": True, "listing": listing}

# ── Cart / checkout ──────────────────────────────────────────────
@app.post("/api/orders")
def create_order(body: CreateOrder):
    if not body.items:
        raise HTTPException(400, "Cart is empty")
    repo = get_repo()
    items, total = [], 0.0
    for it in body.items:
        listing = repo.get_listing(it.listing_id)
        if not listing:
            raise HTTPException(404, f"Unknown listing: {it.listing_id}")
        qty = max(1, int(it.qty))
        line_total = round(float(listing["price"]) * qty, 2)
        total += line_total
        items.append({
            "listing_id": listing["id"],
            "title": listing["title"],
            "artisan_id": listing.get("artisan_id"),
            "artisan_name": listing.get("artisan_name"),
            "image_url": listing.get("image_url"),
            "price": float(listing["price"]),
            "qty": qty,
            "line_total": line_total,
        })
    total = round(total, 2)
    rp = payments.create_order(total)
    order = repo.create_order({
        "buyer_name": body.buyer_name,
        "buyer_phone": body.buyer_phone,
        "buyer_city": body.buyer_city,
        "items": items,
        "amount": total,
        "razorpay_order_id": rp["razorpay_order_id"],
        "status": "created",
    })
    return {"order": order, "payment": rp}

@app.post("/api/orders/{order_id}/verify")
def verify_order_payment(order_id: str, body: VerifyPayment):
    repo = get_repo()
    order = repo.get_order(order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    rp_order_id = body.razorpay_order_id or order.get("razorpay_order_id") or ""
    payment_id = body.razorpay_payment_id or "pay_mock_" + order_id[-8:]
    ok = payments.verify_signature(rp_order_id, payment_id, body.razorpay_signature or "")
    updated = repo.set_order_payment(
        order_id, rp_order_id, payment_id if ok else None,
        "paid_held" if ok else "failed",
    )
    return {
        "ok": ok,
        "order": updated,
        "message": "Payment received and held safely." if ok else "Payment could not be verified.",
    }

@app.post("/api/orders/{order_id}/deliver")
def confirm_delivery(order_id: str):
    repo = get_repo()
    order = repo.get_order(order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    if order["status"] == "released":
        return {"order": order, "whatsapp": None, "note": "Already released."}
    if order["status"] != "paid_held":
        raise HTTPException(409, f"Order is '{order['status']}' — only a held order can be released")
    updated = repo.confirm_delivery(order_id)
    names = sorted({i.get("artisan_name") or "Artisan" for i in updated["items"]})
    return {
        "order": updated,
        "whatsapp": (f"नमस्ते {names[0]}! आपका ऑर्डर पहुँच गया है। "
                     f"₹{updated['amount']:.0f} आपके खाते में भेज दिए गए हैं। धन्यवाद!"),
    }

@app.get("/api/orders")
def list_orders():
    return {"orders": get_repo().list_orders()}

@app.get("/api/orders/{order_id}")
def get_order(order_id: str):
    order = get_repo().get_order(order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    return order

# ── Artisan dashboard ────────────────────────────────────────────
@app.get("/api/artisans/{artisan_id}/dashboard")
def dashboard(artisan_id: str):
    repo = get_repo()
    artisan = repo.get_artisan(artisan_id)
    if not artisan:
        raise HTTPException(404, "Artisan not found")

    my_listings = [l for l in repo.list_listings() if l.get("artisan_id") == artisan_id]
    rows, held, released = [], 0.0, 0.0
    for o in repo.list_orders():
        mine = [i for i in o["items"] if i.get("artisan_id") == artisan_id]
        if not mine:
            continue
        amount = round(sum(float(i["line_total"]) for i in mine), 2)
        if o["status"] == "paid_held":
            held += amount
        elif o["status"] == "released":
            released += amount
        rows.append({
            "order_id": o["id"],
            "buyer_name": o.get("buyer_name"),
            "buyer_city": o.get("buyer_city"),
            "status": o["status"],
            "created_at": o.get("created_at"),
            "my_amount": amount,
            "items": mine,
        })

    return {
        "artisan": artisan,
        "listings": my_listings,
        "orders": rows,
        "earnings": {
            "held": round(held, 2),
            "released": round(released, 2),
            "total": round(held + released, 2),
            "order_count": len(rows),
            "listing_count": len(my_listings),
        },
    }

# === Seller Tools ===
class NumberText(BaseModel):
    text: str

@app.post("/api/normalize-number")
def normalize_number(body: NumberText):
    num = parse_spoken_number(body.text)
    return {"text": body.text, "numberVal": num}

@app.get("/api/seller/session")
def seller_session(artisanId: str, lang: str = "hi"):
    repo = get_repo()
    artisan = repo.get_artisan(artisanId)
    if not artisan:
        raise HTTPException(404, "Artisan not found. Please log in.")
    
    return {
        "sessionId": f"SESS_{int(time.time())}_{artisanId}",
        "artisan": artisan,
        "language": lang or artisan.get("language", "hi"),
        "prompts": prompts.get(lang or artisan.get("language", "hi")) or prompts.get("en"),
        "status": "collecting"
    }

class ClassifyRequest(BaseModel):
    productAnswer: str

@app.post("/api/classify-product")
async def classify_prod(body: ClassifyRequest):
    if not body.productAnswer:
        raise HTTPException(400, "Product answer required")
    res = await classify_product(body.productAnswer)
    res["pricing"] = get_suggested_price(res["category"], res["subcategory"])
    return res

class PriceRequest(BaseModel):
    category: str
    subcategory: str

@app.post("/api/price")
def price_endpoint(body: PriceRequest):
    return get_suggested_price(body.category, body.subcategory)

@app.post("/api/generate-description")
async def gen_description(body: Dict[str, Any]):
    return await generate_description(body)

@app.post("/api/upload")
async def upload_image(
    photo: UploadFile = File(...),
    productName: str = Form(""),
    category: str = Form(""),
    description: str = Form("")
):
    original_dir = UPLOADS_DIR / "original"
    original_dir.mkdir(parents=True, exist_ok=True)
    filename = f"original-{int(time.time())}-{photo.filename}"
    filepath = original_dir / filename
    
    with open(filepath, "wb") as f:
        f.write(await photo.read())
        
    context = {"productName": productName, "category": category, "description": description}
    result = await process_image(str(filepath), filename, photo.content_type, context)
    return result

@app.post("/api/listing")
def create_listing_alias(body: Dict[str, Any]):
    # Map the nested JSON from seller flow to the flat CreateListing model
    artisan_id = body.get("artisan", {}).get("id", "art_ramesh")
    product = body.get("product", {})
    description = body.get("description", {})
    pricing = body.get("pricing", {})
    photo = body.get("photo", {})
    
    import random
    mapped = CreateListing(
        artisan_id=artisan_id,
        title=product.get("name", "Untitled"),
        description=description.get("generatedEnglish") or description.get("original", ""),
        description_local=description.get("generatedLocal") or "",
        category=product.get("category", "Handicraft"),
        price=float(pricing.get("finalPrice", 0)),
        quantity=int(product.get("quantity", 1)),
        image_url=photo.get("enhanced") or photo.get("original") or "",
        authenticity_score=random.randint(85, 98)
    )
    return create_listing(mapped)

# Static file serving
if BUYER_DIR.is_dir():
    app.mount("/buyer", StaticFiles(directory=str(BUYER_DIR), html=True), name="buyer")
if SELLER_DIR.is_dir():
    app.mount("/seller", StaticFiles(directory=str(SELLER_DIR), html=True), name="seller")

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

@app.get("/")
def root():
    return RedirectResponse(url="/seller/index.html")
