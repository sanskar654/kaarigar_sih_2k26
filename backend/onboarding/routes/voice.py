"""Twilio Voice IVR webhook handlers — generates TwiML for the call flow.

This module is PURELY TwiML generation. It returns XML responses that Twilio
interprets to play prompts and gather keypad input. No WhatsApp logic here.

Call Flow:
    incoming → language-selected → main-menu → registration → pahchan-check

Timeout Strategy:
    Every <Gather> gets one retry on timeout. If the retry also times out,
    the call plays "Hum aapka jawab nahi sun paye..." and hangs up.
    Implemented via a ?retry= query parameter on the redirect URL.
"""
from fastapi import APIRouter, Form, Query
from fastapi.responses import Response
from twilio.twiml.voice_response import VoiceResponse

from onboarding.services.session import normalize_phone, set_session
from onboarding.services.twilio_client import send_whatsapp

router = APIRouter(prefix="/voice", tags=["Voice IVR"])


# ── Voice Prompts (Hindi — Devanagari for Twilio's hi-IN TTS) ────────
# Each prompt is written in Devanagari so Twilio's Polly.Aditi voice
# reads them naturally. The "language_menu" prompt is always Hindi
# regardless of what the user eventually selects.

PROMPTS = {
    "hi": {
        "language_menu": (
            "कारीगर में आपका स्वागत है। "
            "हिंदी के लिए 1 दबाएं।"
        ),
        "main_menu": (
            "रजिस्ट्रेशन के लिए 1 दबाएं। "
            "बेचने के लिए 2 दबाएं। "
            "सहायता के लिए 3 दबाएं।"
        ),
        "pahchan_ask": (
            "क्या आपके पास पहचान आईडी है? "
            "हाँ के लिए 1 दबाएं। "
            "नहीं के लिए 2 दबाएं।"
        ),
        "goodbye_whatsapp": (
            "धन्यवाद! हमने आपके व्हाट्सएप पर एक संदेश भेजा है। "
            "कृपया अपनी पहचान आईडी की फोटो भेजें। नमस्ते!"
        ),
        "no_id_rejection": (
            "भारत सरकार के नियमों के अनुसार, "
            "पहचान आईडी के बिना खाता नहीं बना सकते। "
            "धन्यवाद।"
        ),
        "already_registered": (
            "आप पहले से रजिस्टर्ड हैं। धन्यवाद।"
        ),
        "no_input": (
            "हम आपका जवाब नहीं सुन पाए। "
            "कृपया दोबारा कॉल करें।"
        ),
        "selling_placeholder": (
            "बेचने की सुविधा जल्द आ रही है। "
            "कृपया बाद में कॉल करें।"
        ),
        "help_placeholder": (
            "सहायता के लिए कृपया हमें व्हाट्सएप पर संदेश भेजें।"
        ),
    },
}

# Digit → language code. Expand as needed: "2": "bn", "3": "ta", etc.
LANG_MAP = {"1": "hi"}
DEFAULT_LANG = "hi"

# This message is sent on WhatsApp when the call ends and we hand off.
WHATSAPP_PHOTO_REQUEST = (
    "🙏 कृपया अपनी पहचान (Pahchan) आर्टिसन आईडी की फोटो भेजें।\n\n"
    "Please send a photo of your Pahchan artisan ID."
)


# ── Helpers ──────────────────────────────────────────────────────────

def _twiml(response: VoiceResponse) -> Response:
    """Wrap a VoiceResponse as a FastAPI XML response."""
    return Response(content=str(response), media_type="application/xml")


def _say(response, text: str, lang: str = "hi"):
    """Append a <Say> verb with the right TTS voice for the language."""
    # Polly.Aditi is Amazon's Hindi female voice, available on Twilio
    tts_lang = "hi-IN" if lang == "hi" else "en-IN"
    voice = "Polly.Aditi" if lang == "hi" else "Polly.Raveena"
    response.say(text, language=tts_lang, voice=voice)


def _prompt(lang: str, key: str) -> str:
    """Look up a prompt string by language and key."""
    return PROMPTS.get(lang, PROMPTS[DEFAULT_LANG]).get(key, "")


# ── 1. Incoming Call — Language Selection ────────────────────────────

@router.post("/incoming")
async def incoming_call(
    retry: int = Query(0),
    From: str = Form(""),
):
    """First webhook hit when a call comes in. Plays the language menu.

    Twilio config: set your phone number's "A Call Comes In" webhook to
    POST {BASE_URL}/voice/incoming
    """
    response = VoiceResponse()

    gather = response.gather(
        num_digits=1,
        action="/voice/language-selected",
        timeout=8,
        method="POST",
    )
    # The language menu is always in Hindi (the primary audience)
    gather.say(
        _prompt(DEFAULT_LANG, "language_menu"),
        language="hi-IN",
        voice="Polly.Aditi",
    )

    # ── Timeout fallthrough ──
    if retry >= 1:
        # Second timeout → give up
        _say(response, _prompt(DEFAULT_LANG, "no_input"))
        response.hangup()
    else:
        # First timeout → repeat the prompt once
        response.redirect("/voice/incoming?retry=1", method="POST")

    return _twiml(response)


# ── 2. Language Selected — Play Main Menu ────────────────────────────

@router.post("/language-selected")
async def language_selected(
    Digits: str = Form(""),
    retry: int = Query(0),
    lang: str = Query(""),
    From: str = Form(""),
):
    """Receives the language digit, plays the main menu.

    On a retry (timeout of the main-menu Gather), lang is passed via
    query param so we don't lose the language choice.
    """
    # First call: Digits has the language digit. Retry: lang comes from query.
    if Digits:
        lang = LANG_MAP.get(Digits, DEFAULT_LANG)
    elif not lang:
        lang = DEFAULT_LANG

    response = VoiceResponse()

    gather = response.gather(
        num_digits=1,
        action=f"/voice/main-menu?lang={lang}",
        timeout=8,
        method="POST",
    )
    gather.say(
        _prompt(lang, "main_menu"),
        language="hi-IN",
        voice="Polly.Aditi",
    )

    # ── Timeout fallthrough ──
    if retry >= 1:
        _say(response, _prompt(lang, "no_input"), lang)
        response.hangup()
    else:
        response.redirect(
            f"/voice/language-selected?retry=1&lang={lang}",
            method="POST",
        )

    return _twiml(response)


# ── 3. Main Menu — Route by Digit ───────────────────────────────────

@router.post("/main-menu")
async def main_menu(
    Digits: str = Form(""),
    lang: str = Query("hi"),
    From: str = Form(""),
):
    """Routes the user based on their main-menu selection:
        1 → Registration
        2 → Selling (placeholder — Track B)
        3 → Help (placeholder)
    """
    response = VoiceResponse()

    if Digits == "1":
        # Registration branch
        response.redirect(f"/voice/registration?lang={lang}", method="POST")

    elif Digits == "2":
        # Selling — Track B will implement this
        _say(response, _prompt(lang, "selling_placeholder"), lang)
        response.hangup()

    elif Digits == "3":
        # Help
        _say(response, _prompt(lang, "help_placeholder"), lang)
        response.hangup()

    else:
        # Unrecognised digit
        _say(response, _prompt(lang, "no_input"), lang)
        response.hangup()

    return _twiml(response)


# ── 4. Registration — Check Phone, Ask About Pahchan ID ─────────────

@router.post("/registration")
async def registration(
    lang: str = Query("hi"),
    retry: int = Query(0),
    From: str = Form(""),
):
    """Checks if the caller's phone is already registered. If new, asks
    whether they have a Pahchan ID."""
    from onboarding.services.backend_api import find_artisan_by_phone

    phone = normalize_phone(From)
    response = VoiceResponse()

    # ── Already registered? ──
    existing = await find_artisan_by_phone(phone)
    if existing:
        _say(response, _prompt(lang, "already_registered"), lang)
        response.hangup()
        return _twiml(response)

    # ── New user — ask about Pahchan ID ──
    gather = response.gather(
        num_digits=1,
        action=f"/voice/pahchan-check?lang={lang}",
        timeout=8,
        method="POST",
    )
    gather.say(
        _prompt(lang, "pahchan_ask"),
        language="hi-IN",
        voice="Polly.Aditi",
    )

    # ── Timeout fallthrough ──
    if retry >= 1:
        _say(response, _prompt(lang, "no_input"), lang)
        response.hangup()
    else:
        response.redirect(
            f"/voice/registration?lang={lang}&retry=1",
            method="POST",
        )

    return _twiml(response)


# ── 5. Pahchan Check — Yes → WhatsApp Handoff, No → Rejection ───────

@router.post("/pahchan-check")
async def pahchan_check(
    Digits: str = Form(""),
    lang: str = Query("hi"),
    From: str = Form(""),
):
    """Handles the Pahchan ID yes/no response.

    Digit 1 (Yes):
        - Create a session for WhatsApp handoff
        - Send a WhatsApp message asking for the ID photo
        - Play a goodbye message and hang up

    Digit 2 (No):
        - Play the rejection message (government regulation) and hang up
    """
    phone = normalize_phone(From)
    response = VoiceResponse()

    if Digits == "1":
        # ── YES — has Pahchan ID ──

        # Create session so the WhatsApp handler knows this user
        set_session(phone, {
            "state": "awaiting_photo",
            "language": lang,
            "retry_count": 0,
            "extracted_data": None,
        })

        # Send the WhatsApp photo-request message immediately
        try:
            send_whatsapp(phone, WHATSAPP_PHOTO_REQUEST)
        except Exception as e:
            # Log but don't block the call — the user can still get the
            # message when WhatsApp reconnects
            print(f"[WARN] Failed to send WhatsApp to {phone}: {e}")

        # Play goodbye and hang up
        _say(response, _prompt(lang, "goodbye_whatsapp"), lang)
        response.hangup()

    elif Digits == "2":
        # ── NO — doesn't have Pahchan ID ──
        _say(response, _prompt(lang, "no_id_rejection"), lang)
        response.hangup()

    else:
        # Unrecognised digit
        _say(response, _prompt(lang, "no_input"), lang)
        response.hangup()

    return _twiml(response)
