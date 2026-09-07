"""Razorpay Test Mode wrapper with a keyless mock fallback.

With RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET set, this creates real (test-mode)
Razorpay orders and verifies payment signatures. With no keys, it runs in mock
mode: it fabricates an order id and treats every payment as valid, so the whole
checkout flow can be demoed without any account or real money.
"""
import hashlib
import hmac
import os
import uuid

KEY_ID = os.getenv("RAZORPAY_KEY_ID", "").strip()
KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "").strip()
LIVE = bool(KEY_ID and KEY_SECRET)


def create_order(amount_rupees: float) -> dict:
    """Return {razorpay_order_id, amount (paise), key_id, mock}."""
    amount_paise = int(round(float(amount_rupees) * 100))
    if LIVE:
        import razorpay  # imported lazily so the mock path needs no dependency

        client = razorpay.Client(auth=(KEY_ID, KEY_SECRET))
        rp = client.order.create(
            {"amount": amount_paise, "currency": "INR", "payment_capture": 1}
        )
        return {"razorpay_order_id": rp["id"], "amount": amount_paise, "key_id": KEY_ID, "mock": False}
    return {
        "razorpay_order_id": "order_mock_" + uuid.uuid4().hex[:12],
        "amount": amount_paise,
        "key_id": "",
        "mock": True,
    }


def verify_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Verify a Razorpay payment signature. Always True in mock mode."""
    if not LIVE:
        return True
    body = f"{order_id}|{payment_id}".encode()
    expected = hmac.new(KEY_SECRET.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature or "")
