"""Twilio WhatsApp incoming-message webhook handler.

Handles the second half of the registration flow — after the voice call
hands off to WhatsApp. Manages:
    1. Photo upload  → pytesseract OCR → extract Name/Village/Craft
    2. Readback      → "Hamein mila — Naam: X, Gaon: Y, Shilp: Z. YES?"
    3. Confirmation  → create artisan in backend + verify → success message

Error handling:
    - OCR fails (blurry photo): retry up to 3 times, then ask to call back
    - No session found: ask user to call first
    - Non-YES reply: re-send readback prompt
"""
from fastapi import APIRouter, Form
from fastapi.responses import Response

from onboarding.services import backend_api
from onboarding.services.ocr import extract_id_data
from onboarding.services.session import (
    clear_session,
    get_session,
    normalize_phone,
    set_session,
    update_session,
)
from onboarding.services.twilio_client import download_media, send_whatsapp

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])


# ── WhatsApp Message Templates ───────────────────────────────────────
# Bilingual (Hindi + English) for maximum clarity.

MESSAGES = {
    "photo_request": (
        "🙏 कृपया अपनी पहचान (Pahchan) आर्टिसन आईडी की फोटो भेजें।\n\n"
        "Please send a photo of your Pahchan artisan ID."
    ),
    "readback": (
        "हमें मिला —\n"
        "📛 नाम: {name}\n"
        "🏘️ गाँव: {village}\n"
        "🎨 शिल्प: {craft}\n\n"
        "सही है? YES भेजें।\n"
        "Is this correct? Reply YES to confirm."
    ),
    "success": (
        "✅ आपका अकाउंट तैयार है! अब आप कारीगर पर बेच सकते हैं।\n"
        "आपका लॉगिन पिन (PIN) है: *{pin}*\n\n"
        "Your account is ready! You can now sell on Kaarigar. 🎉\n"
        "Your login PIN is: *{pin}*"
    ),
    "retry_photo": (
        "❌ फोटो से जानकारी पढ़ नहीं पाए। कृपया दोबारा साफ फोटो भेजें। "
        "({count}/3 प्रयास)\n\n"
        "We couldn't read the photo. Please send a clearer photo. "
        "({count}/3 attempts)"
    ),
    "max_retries": (
        "😔 माफ कीजिए, हम फोटो से जानकारी नहीं पढ़ पा रहे।\n"
        "कृपया दोबारा कॉल करें और नई फोटो से शुरू करें।\n\n"
        "Sorry, we couldn't read the photo after 3 attempts. "
        "Please call back and try again with a new photo."
    ),
    "no_session": (
        "🙏 कृपया पहले हमारे नंबर पर कॉल करके रजिस्ट्रेशन शुरू करें।\n\n"
        "Please call our number first to start registration."
    ),
    "send_photo_not_text": (
        "📸 कृपया टेक्स्ट नहीं, अपनी पहचान आईडी की फोटो भेजें।\n\n"
        "Please send a photo of your Pahchan ID, not a text message."
    ),
}


from twilio.twiml.messaging_response import MessagingResponse

def _twiml_response(body_text: str = None) -> Response:
    """Return a TwiML XML response. If body_text is provided, Twilio delivers it directly."""
    resp = MessagingResponse()
    if body_text:
        resp.message(body_text)
    return Response(content=str(resp), media_type="text/xml")


# ── Main Webhook ─────────────────────────────────────────────────────

@router.post("/incoming")
async def incoming_message(
    From: str = Form(""),
    Body: str = Form(""),
    NumMedia: int = Form(0),
    MediaUrl0: str = Form(""),
    MediaContentType0: str = Form(""),
):
    """Handle all incoming WhatsApp messages.

    Twilio config: set your WhatsApp Sandbox's "When a message comes in"
    webhook to POST {BASE_URL}/whatsapp/incoming

    Twilio POSTs form data including:
        From:               whatsapp:+919876543210
        Body:               message text
        NumMedia:           number of media attachments
        MediaUrl0:          URL of first attachment (if any)
        MediaContentType0:  MIME type of first attachment
    """
    phone = normalize_phone(From)
    session = get_session(phone)

    # ── Handle sessions and onboarding ──
    if not session:
        # If user directly uploads an ID photo, start session and process it right away!
        if NumMedia > 0 and MediaUrl0:
            set_session(phone, {
                "state": "awaiting_photo",
                "language": "hi",
                "retry_count": 0,
                "extracted_data": None,
            })
            session = get_session(phone)
            reply = await _handle_photo(From, phone, session, NumMedia, MediaUrl0)
            return _twiml_response(reply)

        # Check if already registered in the system
        try:
            existing = await backend_api.find_artisan_by_phone(phone)
            if existing:
                return _twiml_response(
                    f"🙏 नमस्ते {existing.get('name', '')}! आप कारीगर पर पहले से रजिस्टर्ड हैं।\n\n"
                    f"🏘️ गाँव: {existing.get('village', '—')}\n"
                    f"🎨 शिल्प: {existing.get('craft_type', '—')}\n\n"
                    f"कारीगर सेलर पोर्टल पर लॉगिन करें:\n"
                    f"https://kaarigar-sih-2k26.onrender.com/seller/login.html\n\n"
                    f"(नया पहचान पत्र भेजकर आप अपनी जानकारी अपडेट कर सकते हैं।)"
                )
        except Exception as e:
            print(f"[WARN] Error looking up artisan: {e}")

        # If user sent text ("Hi", "नमस्ते", etc.), welcome them and ask for ID photo
        set_session(phone, {
            "state": "awaiting_photo",
            "language": "hi",
            "retry_count": 0,
            "extracted_data": None,
        })
        return _twiml_response(MESSAGES["photo_request"])

    state = session.get("state")

    if state == "awaiting_photo":
        reply = await _handle_photo(From, phone, session, NumMedia, MediaUrl0)
        return _twiml_response(reply)

    elif state == "awaiting_confirmation":
        reply = await _handle_confirmation(From, phone, session, Body)
        return _twiml_response(reply)

    return _twiml_response()


# ── Photo Upload Handler ────────────────────────────────────────────

async def _handle_photo(
    wa_from: str,
    phone: str,
    session: dict,
    num_media: int,
    media_url: str,
) -> str:
    """Download the photo, run OCR, send readback or ask for retry."""

    # User sent text instead of a photo
    if num_media == 0 or not media_url:
        return MESSAGES["send_photo_not_text"]

    retry_count = session.get("retry_count", 0)

    try:
        # Download image from Twilio's media storage (requires auth)
        image_bytes = await download_media(media_url)

        # Run pytesseract OCR
        result = extract_id_data(image_bytes)

        if result["success"]:
            name = result["name"] or "—"
            village = result["village"] or "—"
            craft = result["craft"] or "—"

            # Store extracted data in session for the confirmation step
            update_session(
                phone,
                state="awaiting_confirmation",
                extracted_data={
                    "name": name,
                    "village": village,
                    "craft": craft,
                },
            )

            # Return readback for user to confirm
            return MESSAGES["readback"].format(
                name=name, village=village, craft=craft,
            )

        else:
            # OCR ran but found no labelled fields
            print(f"[INFO] OCR found no fields for {phone}. "
                  f"Raw text: {result['raw_text'][:200]}")
            return _handle_ocr_failure(wa_from, phone, retry_count)

    except Exception as e:
        print(f"[ERROR] OCR processing failed for {phone}: {e}")
        return _handle_ocr_failure(wa_from, phone, retry_count)


# ── OCR Failure & Retry Logic ────────────────────────────────────────

def _handle_ocr_failure(wa_from: str, phone: str, retry_count: int) -> str:
    """Increment the retry counter and either ask for a new photo or
    give up after 3 failed attempts (per Section 2.1 edge cases)."""
    retry_count += 1

    if retry_count >= 3:
        clear_session(phone)
        return MESSAGES["max_retries"]
    else:
        update_session(phone, retry_count=retry_count)
        return MESSAGES["retry_photo"].format(count=retry_count)


# ── Confirmation Handler ────────────────────────────────────────────

import random

async def _handle_confirmation(
    wa_from: str,
    phone: str,
    session: dict,
    body: str,
) -> str:
    """Handle the YES/NO reply to the OCR readback.

    YES → create artisan in the shared backend with a generated PIN, verify, send success.
    Anything else → re-send the readback prompt.
    """
    clean_body = body.strip().upper()
    if clean_body in ["YES", "Y", "HAAN", "HA", "1", "हाँ", "हां", "OK"]:
        data = session.get("extracted_data", {})
        
        # Generate a 4-digit PIN for web app login
        pin = str(random.randint(1000, 9999))

        try:
            # ── Create artisan via shared backend ──
            artisan = await backend_api.create_artisan({
                "name": data.get("name", "Unknown"),
                "phone": phone,
                "password": pin,
                "village": data.get("village", ""),
                "craft_type": data.get("craft", ""),
                "story": "",
                "verified": False,
            })

            # ── Verify (flip verified=true) ──
            artisan_id = artisan.get("id")
            if artisan_id:
                await backend_api.verify_artisan(artisan_id)

            clear_session(phone)
            return MESSAGES["success"].format(pin=pin)

        except Exception as e:
            print(f"[ERROR] Backend call failed for {phone}: {e}")
            return (
                "⚠️ कुछ गड़बड़ हुई। कृपया दोबारा YES भेजें।\n"
                "Something went wrong. Please try sending YES again."
            )

    else:
        # Re-send the readback so the user knows what to confirm
        data = session.get("extracted_data", {})
        return MESSAGES["readback"].format(
            name=data.get("name", "—"),
            village=data.get("village", "—"),
            craft=data.get("craft", "—"),
        )
