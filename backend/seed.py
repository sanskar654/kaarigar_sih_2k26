"""Seed demo artisans + listings so the catalog is populated for the demo.

    python seed.py

Idempotent: existing rows (matched by id) are left in place. Works against
whichever backend is configured (SQLite by default, Supabase if env is set).
"""
from dotenv import load_dotenv

load_dotenv()

from repository import backend_name, get_repo  # noqa: E402

ARTISANS = [
    {
        "id": "art_ramesh", "name": "Ramesh Kumar", "phone": "+919000000001", "password": "password123",
        "village": "Jaipur, Rajasthan", "craft_type": "Pottery", "verified": True,
        "story": ("Ramesh has shaped clay in Jaipur for over 20 years, learning the "
                  "craft from his father. Every diya is thrown by hand on a traditional "
                  "wheel, sun-dried, then fired in a wood kiln."),
    },
    {
        "id": "art_meena", "name": "Meena Devi", "phone": "+919000000002", "password": "password123",
        "village": "Bhuj, Kutch", "craft_type": "Textiles", "verified": True,
        "story": ("Meena is a third-generation Ajrakh block-printer. She carves her own "
                  "wooden blocks and dyes every piece with natural indigo and madder."),
    },
    {
        "id": "art_arjun", "name": "Arjun Singh", "phone": "+919000000003", "password": "password123",
        "village": "Moradabad, Uttar Pradesh", "craft_type": "Metalwork", "verified": True,
        "story": ("Arjun hand-beats and engraves brass and copper in Moradabad, the city "
                  "of brass, using tools passed down through four generations."),
    },
]

LISTINGS = [
    {
        "id": "lst_diya", "artisan_id": "art_ramesh",
        "title": "Handmade Terracotta Diyas (Set of 3)",
        "description": "Hand-thrown clay diyas in red and white, perfect for festivals.",
        "description_local": "हाथ से बने मिट्टी के दीये, लाल और सफेद रंग के (3 का सेट)।",
        "category": "Pottery", "price": 100, "quantity": 3,
        "image_url": "https://picsum.photos/seed/kaarigar-diya/800/800", "authenticity_score": 94,
    },
    {
        "id": "lst_vase", "artisan_id": "art_ramesh", "title": "Jaipur Blue Pottery Vase",
        "description": "Iconic blue-glazed decorative vase, hand-painted with floral motifs.",
        "description_local": "जयपुर की नीली मिट्टी का हस्तनिर्मित फूलदान।",
        "category": "Pottery", "price": 650, "quantity": 5,
        "image_url": "https://picsum.photos/seed/kaarigar-vase/800/800", "authenticity_score": 88,
    },
    {
        "id": "lst_dupatta", "artisan_id": "art_meena", "title": "Ajrakh Block-Print Dupatta",
        "description": "Natural-dyed cotton dupatta with traditional Ajrakh geometry.",
        "description_local": "प्राकृतिक रंगों से रंगी अजरख छपाई की सूती दुपट्टा।",
        "category": "Textiles", "price": 1200, "quantity": 8,
        "image_url": "https://picsum.photos/seed/kaarigar-dupatta/800/800", "authenticity_score": 92,
    },
    {
        "id": "lst_runner", "artisan_id": "art_meena", "title": "Bagru Cotton Table Runner",
        "description": "Hand block-printed cotton runner with a floral border.",
        "description_local": "हाथ से छपा हुआ बागरू सूती टेबल रनर।",
        "category": "Textiles", "price": 850, "quantity": 6,
        "image_url": "https://picsum.photos/seed/kaarigar-runner/800/800", "authenticity_score": 90,
    },
    {
        "id": "lst_stand", "artisan_id": "art_arjun", "title": "Engraved Brass Diya Stand",
        "description": "Hand-engraved brass stand, a centrepiece for any pooja room.",
        "description_local": "हाथ से नक्काशी किया हुआ पीतल का दीया स्टैंड।",
        "category": "Metalwork", "price": 1500, "quantity": 4,
        "image_url": "https://picsum.photos/seed/kaarigar-brass/800/800", "authenticity_score": 86,
    },
    {
        "id": "lst_bowl", "artisan_id": "art_arjun", "title": "Hand-Beaten Copper Bowl",
        "description": "Pure copper bowl with a hammered finish, ideal for serving or decor.",
        "description_local": "हाथ से पीटा हुआ शुद्ध तांबे का कटोरा।",
        "category": "Metalwork", "price": 900, "quantity": 7,
        "image_url": "https://picsum.photos/seed/kaarigar-copper/800/800", "authenticity_score": 91,
    },
]


def run():
    repo = get_repo()
    for a in ARTISANS:
        if not repo.get_artisan(a["id"]):
            repo.create_artisan(a)
    for l in LISTINGS:
        if not repo.get_listing(l["id"]):
            repo.create_listing(l)
    print(f"[seed] backend={backend_name()} "
          f"artisans={len(repo.list_artisans())} listings={len(repo.list_listings())}")


if __name__ == "__main__":
    run()
