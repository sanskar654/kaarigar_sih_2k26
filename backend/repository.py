"""Repository factory. Picks Supabase when configured, else local SQLite.

Both repositories expose the same methods, so the rest of the app never needs
to know which backing store is live.
"""
import os

_repo = None


def _use_supabase() -> bool:
    return bool(os.getenv("SUPABASE_URL", "").strip()
                and os.getenv("SUPABASE_SERVICE_KEY", "").strip())


def get_repo():
    global _repo
    if _repo is None:
        if _use_supabase():
            from repo_supabase import SupabaseRepository

            _repo = SupabaseRepository()
        else:
            from repo_sqlite import SQLiteRepository

            _repo = SQLiteRepository()
    return _repo


def backend_name() -> str:
    return "supabase" if _use_supabase() else "sqlite"
