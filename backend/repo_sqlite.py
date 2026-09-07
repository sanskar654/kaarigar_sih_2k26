"""Local SQLite repository — the zero-config default backing store.

Used automatically whenever SUPABASE_URL is not set, so the whole app runs and
demos with no external services. Mirrors SupabaseRepository method-for-method.
"""
import json
import os
import random
import sqlite3

from dbutil import now_iso, uid

SCHEMA = """
create table if not exists artisans (
    id text primary key, name text not null, phone text unique, password text, village text,
    craft_type text, story text, verified integer not null default 0,
    created_at text
);
create table if not exists listings (
    id text primary key, artisan_id text, title text not null, description text,
    description_local text, category text, price real not null default 0,
    quantity integer not null default 1, image_url text,
    authenticity_score integer not null default 90, status text not null default 'active',
    created_at text
);
create table if not exists orders (
    id text primary key, buyer_name text, buyer_phone text, buyer_city text,
    items text not null default '[]', amount real not null default 0,
    razorpay_order_id text, razorpay_payment_id text,
    status text not null default 'created', created_at text, delivered_at text
);
create table if not exists buyers (
    id text primary key, name text not null, phone text unique not null,
    city text, password text not null, created_at text
);
"""

_LISTING_JOIN = (
    "select l.*, a.name as artisan_name, a.village as artisan_village, "
    "a.craft_type as artisan_craft, a.story as artisan_story, "
    "a.verified as artisan_verified from listings l "
    "left join artisans a on a.id = l.artisan_id"
)


class SQLiteRepository:
    def __init__(self, path=None):
        self.path = path or os.getenv("KAARIGAR_DB", "kaarigar.db")
        with self._conn() as c:
            c.executescript(SCHEMA)

    def _conn(self):
        c = sqlite3.connect(self.path)
        c.row_factory = sqlite3.Row
        return c

    # ---- artisans ----
    def create_artisan(self, d):
        aid = d.get("id") or uid("art")
        with self._conn() as c:
            c.execute(
                "insert or replace into artisans"
                "(id,name,phone,password,village,craft_type,story,verified,created_at)"
                " values(?,?,?,?,?,?,?,?,?)",
                (aid, d["name"], d.get("phone", ""), d.get("password", ""), d.get("village", ""),
                 d.get("craft_type", ""), d.get("story", ""),
                 1 if d.get("verified") else 0, now_iso()),
            )
        return self.get_artisan(aid)

    def get_artisan(self, aid):
        with self._conn() as c:
            r = c.execute("select * from artisans where id=?", (aid,)).fetchone()
        return _artisan(r) if r else None

    def get_artisan_by_phone(self, phone):
        with self._conn() as c:
            r = c.execute("select * from artisans where phone=?", (phone,)).fetchone()
        return _artisan(r) if r else None

    def list_artisans(self):
        with self._conn() as c:
            rows = c.execute("select * from artisans order by name").fetchall()
        return [_artisan(r) for r in rows]

    def verify_artisan(self, aid):
        with self._conn() as c:
            c.execute("update artisans set verified=1 where id=?", (aid,))
        return self.get_artisan(aid)

    # ---- listings ----
    def create_listing(self, d):
        lid = d.get("id") or uid("lst")
        score = d.get("authenticity_score") or random.randint(82, 96)
        with self._conn() as c:
            c.execute(
                "insert or replace into listings(id,artisan_id,title,description,"
                "description_local,category,price,quantity,image_url,"
                "authenticity_score,status,created_at) values(?,?,?,?,?,?,?,?,?,?,?,?)",
                (lid, d.get("artisan_id"), d["title"], d.get("description", ""),
                 d.get("description_local", ""), d.get("category", "Handicraft"),
                 float(d.get("price", 0)), int(d.get("quantity", 1)),
                 d.get("image_url", ""), int(score), d.get("status", "active"), now_iso()),
            )
        return self.get_listing(lid)

    def get_listing(self, lid):
        with self._conn() as c:
            r = c.execute(_LISTING_JOIN + " where l.id=?", (lid,)).fetchone()
        return _listing(r) if r else None

    def list_listings(self, category=None):
        q = _LISTING_JOIN + " where l.status='active'"
        args = []
        if category and category != "All":
            q += " and l.category=?"
            args.append(category)
        with self._conn() as c:
            rows = c.execute(q + " order by l.created_at desc", args).fetchall()
        return [_listing(r) for r in rows]

    # ---- orders ----
    def create_order(self, d):
        oid = uid("ord")
        with self._conn() as c:
            c.execute(
                "insert into orders(id,buyer_name,buyer_phone,buyer_city,items,amount,"
                "razorpay_order_id,razorpay_payment_id,status,created_at,delivered_at)"
                " values(?,?,?,?,?,?,?,?,?,?,?)",
                (oid, d.get("buyer_name", ""), d.get("buyer_phone", ""),
                 d.get("buyer_city", ""), json.dumps(d.get("items", [])),
                 float(d.get("amount", 0)), d.get("razorpay_order_id"), None,
                 d.get("status", "created"), now_iso(), None),
            )
        return self.get_order(oid)

    def get_order(self, oid):
        with self._conn() as c:
            r = c.execute("select * from orders where id=?", (oid,)).fetchone()
        return _order(r) if r else None

    def list_orders(self):
        with self._conn() as c:
            rows = c.execute("select * from orders order by created_at desc").fetchall()
        return [_order(r) for r in rows]

    def set_order_payment(self, oid, rp_order_id, payment_id, status):
        with self._conn() as c:
            c.execute(
                "update orders set razorpay_order_id=?, razorpay_payment_id=?, status=? where id=?",
                (rp_order_id, payment_id, status, oid),
            )
        return self.get_order(oid)

    def confirm_delivery(self, oid):
        with self._conn() as c:
            c.execute(
                "update orders set status='released', delivered_at=? "
                "where id=? and status='paid_held'",
                (now_iso(), oid),
            )
        return self.get_order(oid)

    # ---- buyers ----
    def create_buyer(self, d):
        bid = uid("buy")
        with self._conn() as c:
            c.execute(
                "insert into buyers(id,name,phone,city,password,created_at) "
                "values(?,?,?,?,?,?)",
                (bid, d["name"], d["phone"], d.get("city", ""), d["password"], now_iso())
            )
        return self.get_buyer(bid)

    def get_buyer(self, bid):
        with self._conn() as c:
            r = c.execute("select * from buyers where id=?", (bid,)).fetchone()
        return dict(r) if r else None

    def get_buyer_by_phone(self, phone):
        with self._conn() as c:
            r = c.execute("select * from buyers where phone=?", (phone,)).fetchone()
        return dict(r) if r else None


def _artisan(r):
    d = dict(r)
    d["verified"] = bool(d.get("verified"))
    return d


def _listing(r):
    d = dict(r)
    d["artisan_verified"] = bool(d.get("artisan_verified"))
    return d


def _order(r):
    d = dict(r)
    d["items"] = json.loads(d.get("items") or "[]")
    return d
