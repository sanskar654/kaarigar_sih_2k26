"""Supabase-backed repository — used when SUPABASE_URL + SUPABASE_SERVICE_KEY
are set. Same method surface as SQLiteRepository so the API code is agnostic.
`supabase` is imported lazily so the SQLite demo path needs no dependency.
"""
import json
import os
import random

from dbutil import flatten_listing, uid


class SupabaseRepository:
    def __init__(self):
        from supabase import create_client

        self.sb = create_client(
            os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"]
        )

    # ---- artisans ----
    def create_artisan(self, d):
        row = {
            "id": d.get("id") or uid("art"), "name": d["name"],
            "phone": d.get("phone", ""), "password": d.get("password", ""), 
            "village": d.get("village", ""),
            "craft_type": d.get("craft_type", ""), "story": d.get("story", ""),
            "verified": bool(d.get("verified")),
        }
        self.sb.table("artisans").upsert(row).execute()
        return self.get_artisan(row["id"])

    def get_artisan(self, aid):
        r = self.sb.table("artisans").select("*").eq("id", aid).limit(1).execute()
        return r.data[0] if r.data else None

    def get_artisan_by_phone(self, phone):
        r = self.sb.table("artisans").select("*").eq("phone", phone).limit(1).execute()
        return r.data[0] if r.data else None

    def list_artisans(self):
        return self.sb.table("artisans").select("*").order("name").execute().data

    def verify_artisan(self, aid):
        self.sb.table("artisans").update({"verified": True}).eq("id", aid).execute()
        return self.get_artisan(aid)

    # ---- listings ----
    def create_listing(self, d):
        row = {
            "id": d.get("id") or uid("lst"), "artisan_id": d.get("artisan_id"),
            "title": d["title"], "description": d.get("description", ""),
            "description_local": d.get("description_local", ""),
            "category": d.get("category", "Handicraft"), "price": float(d.get("price", 0)),
            "quantity": int(d.get("quantity", 1)), "image_url": d.get("image_url", ""),
            "authenticity_score": int(d.get("authenticity_score") or random.randint(82, 96)),
            "status": d.get("status", "active"),
        }
        self.sb.table("listings").upsert(row).execute()
        return self.get_listing(row["id"])

    def get_listing(self, lid):
        r = (self.sb.table("listings")
             .select("*, artisans(name,village,craft_type,story,verified)")
             .eq("id", lid).limit(1).execute())
        return flatten_listing(r.data[0]) if r.data else None

    def list_listings(self, category=None):
        q = (self.sb.table("listings")
             .select("*, artisans(name,village,craft_type,story,verified)")
             .eq("status", "active"))
        if category and category != "All":
            q = q.eq("category", category)
        rows = q.order("created_at", desc=True).execute().data
        return [flatten_listing(x) for x in rows]

    # ---- orders ----
    def create_order(self, d):
        row = {
            "id": uid("ord"), "buyer_name": d.get("buyer_name", ""),
            "buyer_phone": d.get("buyer_phone", ""), "buyer_city": d.get("buyer_city", ""),
            "items": d.get("items", []), "amount": float(d.get("amount", 0)),
            "razorpay_order_id": d.get("razorpay_order_id"),
            "status": d.get("status", "created"),
        }
        self.sb.table("orders").insert(row).execute()
        return self.get_order(row["id"])

    def get_order(self, oid):
        r = self.sb.table("orders").select("*").eq("id", oid).limit(1).execute()
        return _norm(r.data[0]) if r.data else None

    def list_orders(self):
        rows = self.sb.table("orders").select("*").order("created_at", desc=True).execute().data
        return [_norm(x) for x in rows]

    def set_order_payment(self, oid, rp_order_id, payment_id, status):
        self.sb.table("orders").update({
            "razorpay_order_id": rp_order_id, "razorpay_payment_id": payment_id,
            "status": status,
        }).eq("id", oid).execute()
        return self.get_order(oid)

    def confirm_delivery(self, oid):
        from dbutil import now_iso

        self.sb.table("orders").update({
            "status": "released", "delivered_at": now_iso(),
        }).eq("id", oid).eq("status", "paid_held").execute()
        return self.get_order(oid)


    # ---- buyers ----
    def create_buyer(self, d):
        from dbutil import now_iso
        row = {
            "id": uid("buy"), "name": d["name"], "phone": d["phone"],
            "city": d.get("city", ""), "password": d["password"],
            "created_at": now_iso()
        }
        self.sb.table("buyers").insert(row).execute()
        return self.get_buyer(row["id"])

    def get_buyer(self, bid):
        r = self.sb.table("buyers").select("*").eq("id", bid).limit(1).execute()
        return r.data[0] if r.data else None

    def get_buyer_by_phone(self, phone):
        r = self.sb.table("buyers").select("*").eq("phone", phone).limit(1).execute()
        return r.data[0] if r.data else None


def _norm(row):
    """jsonb `items` may arrive as a list already or as a JSON string."""
    items = row.get("items")
    if isinstance(items, str):
        row["items"] = json.loads(items or "[]")
    elif items is None:
        row["items"] = []
    return row
