"""Kaarigar Track A — Onboarding Microservice.

FastAPI server handling Twilio Voice IVR and WhatsApp webhooks for artisan
registration and Pahchan ID verification via pytesseract OCR.

This runs as a SEPARATE server from Track C's backend (which runs on :8000).
It calls the shared backend's REST API for artisan creation/verification.

Run:
    cd onboarding
    uvicorn app:app --reload --port 3001

Then expose via ngrok:
    ngrok http 3001

Configure Twilio webhooks to:
    Voice:    https://xxxx.ngrok-free.app/voice/incoming
    WhatsApp: https://xxxx.ngrok-free.app/whatsapp/incoming

Interactive docs: http://localhost:3001/docs
"""
import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from the onboarding directory (must run before any service imports)
load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from routes.voice import router as voice_router  # noqa: E402
from routes.whatsapp import router as whatsapp_router  # noqa: E402

app = FastAPI(
    title="Kaarigar Onboarding API (Track A)",
    version="1.0.0",
    description=(
        "IVR + WhatsApp + OCR pipeline for artisan registration.\n\n"
        "**Owner:** Ethan · Team Blackbox · SIH 2026\n\n"
        "Endpoints:\n"
        "- `/voice/*` — Twilio Voice IVR webhooks (return TwiML XML)\n"
        "- `/whatsapp/*` — Twilio WhatsApp message webhooks\n"
        "- `/health` — Service health check\n"
    ),
)

# Wide-open CORS — acceptable for a prototype demo.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount route modules
app.include_router(voice_router)
app.include_router(whatsapp_router)


@app.get("/health")
def health():
    """Quick health check — confirms the service is running and which
    backend it's configured to talk to."""
    return {
        "ok": True,
        "service": "onboarding",
        "track": "A",
        "backend_url": os.getenv("BACKEND_URL", "http://localhost:8000"),
    }


# ── Startup banner ──────────────────────────────────────────────────

@app.on_event("startup")
async def _startup():
    port = os.getenv("PORT", "3001")
    backend = os.getenv("BACKEND_URL", "http://localhost:8000")
    base = os.getenv("BASE_URL", "(not set -- run ngrok)")
    banner = "\n".join([
        "",
        "=" * 60,
        "  Kaarigar Track A -- Onboarding Server",
        "=" * 60,
        f"  Local:     http://localhost:{port}",
        f"  Docs:      http://localhost:{port}/docs",
        f"  Backend:   {backend}",
        f"  Ngrok URL: {base}",
        "",
        "  Twilio webhooks should point to:",
        f"    Voice:    {base}/voice/incoming",
        f"    WhatsApp: {base}/whatsapp/incoming",
        "=" * 60,
        "",
    ])
    print(banner)
