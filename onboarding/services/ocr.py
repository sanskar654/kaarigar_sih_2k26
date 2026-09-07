"""Pytesseract OCR wrapper for reading Pahchan artisan ID cards.

Extracts Name, Village, and Craft fields from an ID card photo using
Tesseract OCR with English + Hindi language support.

Requirements:
    1. Install Tesseract binary:
       Windows → https://github.com/UB-Mannheim/tesseract/wiki
       During install, check "Additional language data" and select Hindi.

    2. If Tesseract is NOT in your system PATH, set the TESSERACT_CMD
       environment variable (see .env.example).

    3. pip install pytesseract Pillow
"""
import io
import os
import re
import tempfile
from pathlib import Path

import pytesseract
from PIL import Image

# ── Configure Tesseract binary path ──────────────────────────────────
_tesseract_cmd = os.getenv("TESSERACT_CMD")
if _tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = _tesseract_cmd


def extract_id_data(image_bytes: bytes) -> dict:
    """Run OCR on a Pahchan ID card image and extract structured fields.

    Args:
        image_bytes: Raw bytes of the image file (JPEG, PNG, etc.).

    Returns:
        {
            "name":     str | None,
            "village":  str | None,
            "craft":    str | None,
            "raw_text": str,          # full OCR output for debugging
            "success":  bool,         # True if at least one field was found
        }
    """
    # Save to a temp file (pytesseract needs a file path or PIL Image)
    suffix = ".jpg"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(image_bytes)
        temp_path = f.name

    try:
        img = Image.open(temp_path)

        # Determine available languages — use eng+hin if Hindi data is installed
        ocr_lang = _detect_languages()

        raw_text = pytesseract.image_to_string(img, lang=ocr_lang)
    finally:
        Path(temp_path).unlink(missing_ok=True)

    # Extract labeled fields with flexible regex patterns
    name = _extract_field(raw_text, [
        r"(?:Name|naam|नाम)\s*[:：\-—=]\s*(.+)",
    ])
    village = _extract_field(raw_text, [
        r"(?:Village|gaon|गाँव|गांव|Address|पता|District|जिला)\s*[:：\-—=]\s*(.+)",
    ])
    craft = _extract_field(raw_text, [
        r"(?:Craft|shilp|शिल्प|Craft\s*Type|शिल्प\s*प्रकार|Occupation|व्यवसाय)\s*[:：\-—=]\s*(.+)",
    ])

    success = bool(name or village or craft)

    return {
        "name": _clean(name),
        "village": _clean(village),
        "craft": _clean(craft),
        "raw_text": raw_text.strip(),
        "success": success,
    }


def _detect_languages() -> str:
    """Check which Tesseract language packs are available and return the
    best combination. Falls back to 'eng' if Hindi data is missing."""
    try:
        available = pytesseract.get_languages()
        if "hin" in available and "eng" in available:
            return "eng+hin"
        elif "hin" in available:
            return "hin"
        else:
            return "eng"
    except Exception:
        # If we can't detect languages, assume English-only
        return "eng"


def _extract_field(text: str, patterns: list[str]) -> str | None:
    """Try each regex pattern against the OCR text, return first match."""
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if match:
            return match.group(1).strip()
    return None


def _clean(value: str | None) -> str | None:
    """Remove trailing punctuation, extra whitespace from extracted values."""
    if not value:
        return None
    # Strip trailing periods, commas, colons, pipes
    value = re.sub(r"[.,;:|]+$", "", value).strip()
    # Collapse multiple spaces
    value = re.sub(r"\s+", " ", value)
    return value if value else None
