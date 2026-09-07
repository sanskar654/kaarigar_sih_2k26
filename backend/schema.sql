-- Kaarigar shared database schema (Supabase / PostgreSQL)
-- Track C (Sanskar) owns this shared setup. Track A writes artisans + verified
-- status; Track B writes listings; Track C reads everything + writes orders.
-- Run this in the Supabase SQL editor once when creating the project.

create table if not exists artisans (
    id           text primary key,
    name         text not null,
    phone        text unique,
    password     text,
    village      text,
    craft_type   text,
    story        text,
    verified     boolean not null default false,
    created_at   timestamptz not null default now()
);

create table if not exists listings (
    id                 text primary key,
    artisan_id         text references artisans(id) on delete cascade,
    title              text not null,
    description        text,
    description_local  text,
    category           text,
    price              numeric not null default 0,
    quantity           integer not null default 1,
    image_url          text,
    authenticity_score integer not null default 90,
    status             text not null default 'active',
    created_at         timestamptz not null default now()
);

-- status flow: created -> paid_held (money in escrow) -> released (delivery confirmed)
--                                                     \-> failed
create table if not exists orders (
    id                 text primary key,
    buyer_name         text,
    buyer_phone        text,
    buyer_city         text,
    items              jsonb not null default '[]'::jsonb,
    amount             numeric not null default 0,
    razorpay_order_id  text,
    razorpay_payment_id text,
    status             text not null default 'created',
    created_at         timestamptz not null default now(),
    delivered_at       timestamptz
);

create table if not exists buyers (
    id           text primary key,
    name         text not null,
    phone        text unique not null,
    city         text,
    password     text not null,
    created_at   timestamptz not null default now()
);

create index if not exists idx_listings_artisan on listings(artisan_id);
create index if not exists idx_listings_status  on listings(status);
create index if not exists idx_orders_status    on orders(status);
