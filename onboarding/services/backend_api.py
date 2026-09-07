"""HTTP client for the shared Kaarigar FastAPI backend (Track C — Sanskar).

All artisan data lives in the shared backend. Track A creates and verifies
artisans by calling these REST endpoints over HTTP.

Endpoints used:
    GET  /api/artisans              — list all (filter by phone client-side)
    POST /api/artisans              — create a new artisan
    POST /api/artisans/{id}/verify  — flip verified = true

The base URL defaults to http://localhost:8000 and can be overridden via
the BACKEND_URL environment variable.
"""
import os

import httpx


def _base_url() -> str:
    return os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")


async def find_artisan_by_phone(phone: str) -> dict | None:
    """Search for an artisan whose phone matches the given E.164 number.

    The shared backend doesn't have a phone-based lookup endpoint, so we
    fetch all artisans and filter client-side. Fine for a prototype demo.
    """
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(f"{_base_url()}/api/artisans")
        resp.raise_for_status()
        artisans = resp.json().get("artisans", [])
        for a in artisans:
            if a.get("phone") == phone:
                return a
    return None


async def create_artisan(data: dict) -> dict:
    """Create a new artisan record.

    Args:
        data: dict with keys: name, phone, village, craft_type, story, verified
    Returns:
        The created artisan dict (includes the generated 'id').
    """
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(f"{_base_url()}/api/artisans", json=data)
        resp.raise_for_status()
        return resp.json()


async def verify_artisan(artisan_id: str) -> dict:
    """Mark an artisan as Pahchan-ID verified (sets verified=true)."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(f"{_base_url()}/api/artisans/{artisan_id}/verify")
        resp.raise_for_status()
        return resp.json()
