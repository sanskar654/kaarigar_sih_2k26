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

from services import backend_api
from services.ocr import extract_id_data
from services.session import (
    clear_session,
    get_session,
    normalize_phone,
    update_session,
)
from services.twilio_client import download_media, send_whatsapp

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
        "✅ आपका अकाउंट तैयार है! अब आप कारीगर पर बेच सकते हैं।\n\n"
        "Your account is ready! You can now sell on Kaarigar. 🎉"
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


def _empty_twiml() -> Response:
    """Return an empty TwiML response (Twilio expects valid XML back)."""
    return Response(content="<Response/>", media_type="application/xml")


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

    # ── No active session — user hasn't gone through the call flow ──
    if not session:
        send_whatsapp(From, MESSAGES["no_session"])
        return _empty_twiml()

    state = session.get("state")

    if state == "awaiting_photo":
        await _handle_photo(From, phone, session, NumMedia, MediaUrl0)

    elif state == "awaiting_confirmation":
        await _handle_confirmation(From, phone, session, Body)

    return _empty_twiml()


# ── Photo Upload Handler ────────────────────────────────────────────

async def _handle_photo(
    wa_from: str,
    phone: str,
    session: dict,
    num_media: int,
    media_url: str,
):
    """Download the photo, run OCR, send readback or ask for retry."""

    # User sent text instead of a photo
    if num_media == 0 or not media_url:
        send_whatsapp(wa_from, MESSAGES["send_photo_not_text"])
        return

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

            # Send readback for user to confirm
            readback = MESSAGES["readback"].format(
                name=name, village=village, craft=craft,
            )
            send_whatsapp(wa_from, readback)

        else:
            # OCR ran but found no labelled fields
            print(f"[INFO] OCR found no fields for {phone}. "
                  f"Raw text: {result['raw_text'][:200]}")
            _handle_ocr_failure(wa_from, phone, retry_count)

    except Exception as e:
        print(f"[ERROR] OCR processing failed for {phone}: {e}")
        _handle_ocr_failure(wa_from, phone, retry_count)


# ── OCR Failure & Retry Logic ────────────────────────────────────────

def _handle_ocr_failure(wa_from: str, phone: str, retry_count: int):
    """Increment the retry counter and either ask for a new photo or
    give up after 3 failed attempts (per Section 2.1 edge cases)."""
    retry_count += 1

    if retry_count >= 3:
        # Max retries reached — ask user to call back and restart
        send_whatsapp(wa_from, MESSAGES["max_retries"])
        clear_session(phone)
    else:
        # Ask for a clearer photo
        update_session(phone, retry_count=retry_count)
        send_whatsapp(
            wa_from,
            MESSAGES["retry_photo"].format(count=retry_count),
        )


# ── Confirmation Handler ────────────────────────────────────────────

async def _handle_confirmation(
    wa_from: str,
    phone: str,
    session: dict,
    body: str,
):
    """Handle the YES/NO reply to the OCR readback.

    YES → create artisan in the shared backend, verify, send success.
    Anything else → re-send the readback prompt.
    """
    if body.strip().upper() == "YES":
        data = session.get("extracted_data", {})

        try:
            # ── Create artisan via shared backend ──
            artisan = await backend_api.create_artisan({
                "name": data.get("name", "Unknown"),
                "phone": phone,
                "village": data.get("village", ""),
                "craft_type": data.get("craft", ""),
                "story": "",
                "verified": False,
            })

            # ── Verify (flip verified=true) ──
            artisan_id = artisan.get("id")
            if artisan_id:
                await backend_api.verify_artisan(artisan_id)

            # ── Success! ──
            send_whatsapp(wa_from, MESSAGES["success"])

        except Exception as e:
            print(f"[ERROR] Backend call failed for {phone}: {e}")
            send_whatsapp(
                wa_from,
                "⚠️ कुछ गड़बड़ हुई। कृपया दोबारा YES भेजें।\n"
                "Something went wrong. Please try sending YES again.",
            )
            return  # don't clear session — let them retry

        # Clean up
        clear_session(phone)

    else:
        # Re-send the readback so the user knows what to confirm
        data = session.get("extracted_data", {})
        readback = MESSAGES["readback"].format(
            name=data.get("name", "—"),
            village=data.get("village", "—"),
            craft=data.get("craft", "—"),
        )
        send_whatsapp(wa_from, readback)
