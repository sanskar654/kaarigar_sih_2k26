"""Kaarigar backend — FastAPI (Track C, Sanskar).

Serves the buyer catalog, cart/checkout (Razorpay Test Mode), the artisan
dashboard, and the shared write endpoints Tracks A and B call into.

Run:  uvicorn main:app --reload --port 8000
Docs: http://localhost:8000/docs
"""
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()  # must run before repository/payments read their env vars

from fastapi import FastAPI, HTTPException  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402

import payments  # noqa: E402
from models import CreateArtisan, CreateListing, CreateOrder, VerifyPayment  # noqa: E402
from repository import backend_name, get_repo  # noqa: E402

BUYER_DIR = Path(__file__).resolve().parent.parent / "buyer"

app = FastAPI(title="Kaarigar API", version="1.0.0")

# NOTE: wide-open CORS and no auth on the write endpoints — anyone who knows the
# URL can create a listing or flip an order to delivered. Acceptable for a
# prototype demo (frontend on Vercel, API on Render, no real money, no real PII).
# Lock down before any real launch: origin allowlist + a service key on writes.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    return get_repo().create_artisan(body.model_dump())


@app.get("/api/artisans")
def list_artisans():
    return {"artisans": get_repo().list_artisans()}


@app.post("/api/artisans/{artisan_id}/verify")
def verify_artisan(artisan_id: str):
    """Track A calls this once the Pahchan ID OCR is confirmed."""
    row = get_repo().verify_artisan(artisan_id)
    if not row:
        raise HTTPException(404, "Artisan not found")
    return row

@app.post("/api/listings")
def create_listing(body: CreateListing):
    """Track B calls this on Publish. Refuses unverified artisans, matching the
    hard Pahchan-ID gate from Section 2.1."""
    repo = get_repo()
    artisan = repo.get_artisan(body.artisan_id)
    if not artisan:
        raise HTTPException(404, "Artisan not found")
    if not artisan.get("verified"):
        raise HTTPException(403, "Artisan is not verified — cannot publish a listing")
    return repo.create_listing(body.model_dump())


# ── Cart / checkout ──────────────────────────────────────────────
@app.post("/api/orders")
def create_order(body: CreateOrder):
    """Prices come from the database, never from the client — the browser only
    sends listing ids and quantities."""
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
    """Money is HELD after a successful payment, not paid out. Release happens
    only on delivery confirmation (Section 2.4)."""
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
        "message": ("Payment received and held safely. It is released to the artisan "
                    "once delivery is confirmed.") if ok
        else "Payment could not be verified.",
    }


@app.post("/api/orders/{order_id}/deliver")
def confirm_delivery(order_id: str):
    """The demo stand-in for a courier confirming drop-off — an admin button.
    Releases the held payment to the artisan."""
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
        # Track A owns real WhatsApp sending; Track C returns the text to send.
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


# Static frontend LAST so every /api route is matched first.
if BUYER_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(BUYER_DIR), html=True), name="buyer")
