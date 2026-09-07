# /selling — Track B (Shrushti/Shravani)

Sell-a-product flow, price suggestion, photo-match check, listing generation.
See Sections 2.2, 2.3 and 5.2 of `docs/Kaarigar_Prototype_Master_Document.docx`.

This folder is owned by Track B — Track C only left this placeholder so the repo
structure from Section 6 exists from day one.

## What Track C already built for you

`POST /api/listings` publishes a listing that appears in the buyer catalog
immediately. Body:

```json
{
  "artisan_id": "art_ramesh",
  "title": "Handmade Terracotta Diyas (Set of 3)",
  "description": "Hand-thrown clay diyas in red and white.",
  "description_local": "हाथ से बने मिट्टी के दीये।",
  "category": "Pottery",
  "price": 100,
  "quantity": 3,
  "image_url": "https://…/diya.jpg",
  "authenticity_score": 94
}
```

Notes:

- `artisan_id` must belong to a **verified** artisan or you get HTTP 403 — that is
  the Pahchan gate from Section 2.1, enforced server-side.
- Omit `authenticity_score` and the backend fills in the 82–96 placeholder from
  Section 3.3, so you don't have to duplicate that logic.
- `category` should be one of the values from `GET /api/categories` so the catalog
  filter chips match.
- Upload the enhanced (rembg'd) photo wherever you like — Supabase Storage, or any
  public URL — and pass the URL as `image_url`.

Base URL locally: `http://localhost:8000`
