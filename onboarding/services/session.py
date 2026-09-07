"""In-memory session store keyed by phone number (E.164 format).

Sessions are deliberately ephemeral — per Section 2.1 of the master document,
a reconnecting user starts completely fresh. No database persistence needed.

Each session dict looks like:
{
    "state":          "awaiting_photo" | "awaiting_confirmation",
    "language":       "hi",
    "retry_count":    0,       # OCR failure counter (max 3)
    "extracted_data": {        # filled after successful OCR
        "name": "Ramesh Kumar",
        "village": "Jaipur",
        "craft": "Mitti ke bartan",
    },
}
"""

_sessions: dict[str, dict] = {}


def normalize_phone(phone: str) -> str:
    """Strip the 'whatsapp:' prefix so call and WhatsApp numbers match.

    Twilio voice sends:    +919876543210
    Twilio WhatsApp sends: whatsapp:+919876543210
    We store sessions keyed by: +919876543210
    """
    return phone.replace("whatsapp:", "").strip()


def get_session(phone: str) -> dict | None:
    """Retrieve the session for a phone number, or None if absent."""
    return _sessions.get(normalize_phone(phone))


def set_session(phone: str, data: dict) -> None:
    """Create or overwrite the session for a phone number."""
    _sessions[normalize_phone(phone)] = data


def update_session(phone: str, **kwargs) -> None:
    """Merge key=value updates into an existing session."""
    key = normalize_phone(phone)
    if key in _sessions:
        _sessions[key].update(kwargs)


def clear_session(phone: str) -> None:
    """Remove the session for a phone number."""
    _sessions.pop(normalize_phone(phone), None)
