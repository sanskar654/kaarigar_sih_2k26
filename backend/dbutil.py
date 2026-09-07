"""Small helpers shared by the SQLite and Supabase repositories."""
import uuid
from datetime import datetime, timezone


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


def flatten_listing(row: dict) -> dict:
    """Lift a nested Supabase `artisans` join onto artisan_* keys so the API
    shape matches the SQLite repository (which aliases the same columns)."""
    a = row.pop("artisans", None) or {}
    row["artisan_name"] = a.get("name")
    row["artisan_village"] = a.get("village")
    row["artisan_craft"] = a.get("craft_type")
    row["artisan_story"] = a.get("story")
    row["artisan_verified"] = a.get("verified")
    return row
