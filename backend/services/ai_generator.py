import os
import json
from typing import Dict, Any

def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key.strip() == "" or api_key == "your_openai_api_key_here":
        return None
    try:
        from openai import AsyncOpenAI
        return AsyncOpenAI(api_key=api_key)
    except ImportError:
        return None

# We can mock product_categories for now if not available, but let's assume it's just the fallback for now or we load it from data
# The JS file used require('../data/product_categories')
# We'll put the keyword map and logic here

keyword_map = [
  { 'keywords': ['diya', 'diyas', 'दीप', 'दीया', 'दीये', 'दीवा', 'প্রদীপ'], 'category': 'Pottery & Ceramics', 'subcategory': 'Diyas' },
  { 'keywords': ['pot', 'pots', 'मटका', 'घड़ा', 'मातीचे भांडे'], 'category': 'Pottery & Ceramics', 'subcategory': 'Decorative Pots' },
  { 'keywords': ['planter', 'planters', 'गमला'], 'category': 'Pottery & Ceramics', 'subcategory': 'Planters' },
  { 'keywords': ['terracotta', 'figurine', 'मूर्ति', 'मूर्ती'], 'category': 'Pottery & Ceramics', 'subcategory': 'Terracotta Figurines' },
  { 'keywords': ['saree', 'sari', 'साड़ी', 'साडी', 'শাড়ি'], 'category': 'Textiles & Weaving', 'subcategory': 'Handwoven Sarees' },
  { 'keywords': ['dupatta', 'चुनरी', 'ओढ़नी'], 'category': 'Textiles & Weaving', 'subcategory': 'Handloom Dupattas' },
  { 'keywords': ['stole', 'stoles'], 'category': 'Textiles & Weaving', 'subcategory': 'Stoles' },
  { 'keywords': ['shawl', 'shawls', 'शॉल'], 'category': 'Textiles & Weaving', 'subcategory': 'Shawls' },
  { 'keywords': ['scarf', 'scarves', 'स्कार्फ'], 'category': 'Textiles & Weaving', 'subcategory': 'Handwoven Scarves' },
  { 'keywords': ['bag', 'bags', 'थैला', 'झोला', 'ব্যাগ'], 'category': 'Embroidery & Needlework', 'subcategory': 'Embroidered Bags' },
  { 'keywords': ['cushion', 'cushions', 'तकिया'], 'category': 'Embroidery & Needlework', 'subcategory': 'Cushion Covers' },
  { 'keywords': ['toy', 'toys', 'खिलौना', 'खेळणी', 'খেলনা'], 'category': 'Wood Craft', 'subcategory': 'Wooden Toys' },
  { 'keywords': ['box', 'boxes', 'डिब्बा', 'खोका'], 'category': 'Wood Craft', 'subcategory': 'Wooden Boxes' },
  { 'keywords': ['basket', 'baskets', 'टोकरी', 'टोपली', 'ঝুড়ি'], 'category': 'Bamboo & Cane', 'subcategory': 'Baskets' },
  { 'keywords': ['tray', 'trays', 'ट्रे'], 'category': 'Bamboo & Cane', 'subcategory': 'Trays' },
  { 'keywords': ['lampshade', 'lamp', 'दीपक', 'दिवा', 'বাতি'], 'category': 'Bamboo & Cane', 'subcategory': 'Lampshades' },
  { 'keywords': ['brass', 'पीतल', 'पितळ', 'পিতল'], 'category': 'Metal Craft', 'subcategory': 'Brass Diyas' },
  { 'keywords': ['earring', 'earrings', 'झुमका', 'बाली', 'দুল'], 'category': 'Jewellery', 'subcategory': 'Handcrafted Earrings' },
  { 'keywords': ['necklace', 'necklaces', 'हार', 'माला'], 'category': 'Jewellery', 'subcategory': 'Necklaces' },
  { 'keywords': ['bangle', 'bangles', 'चूड़ी', 'बांगडी', 'চুড়ি'], 'category': 'Jewellery', 'subcategory': 'Bangles' },
  { 'keywords': ['wallet', 'wallets', 'पर्स', 'पाकिट'], 'category': 'Leather Craft', 'subcategory': 'Wallets' },
  { 'keywords': ['belt', 'belts', 'बेल्ट'], 'category': 'Leather Craft', 'subcategory': 'Belts' },
  { 'keywords': ['madhubani', 'मधुबनी'], 'category': 'Paintings & Art', 'subcategory': 'Madhubani Paintings' },
  { 'keywords': ['warli', 'वारली'], 'category': 'Paintings & Art', 'subcategory': 'Warli Paintings' },
  { 'keywords': ['gond', 'गोंड'], 'category': 'Paintings & Art', 'subcategory': 'Gond Paintings' },
  { 'keywords': ['doll', 'dolls', 'गुड़िया', 'बाहुली', 'পুতুল'], 'category': 'Toys & Dolls', 'subcategory': 'Cloth Dolls' },
  { 'keywords': ['puppet', 'puppets', 'कठपुतली'], 'category': 'Toys & Dolls', 'subcategory': 'Puppets' },
  { 'keywords': ['candle', 'candles', 'मोमबत्ती'], 'category': 'Home & Decorative Crafts', 'subcategory': 'Candles' }
]

async def classify_product(user_text: str) -> Dict[str, Any]:
    client = get_openai_client()
    text = (user_text or '').lower()

    if client:
        try:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert Indian handicraft product classifier. Map the artisan input to ONE category and ONE subcategory. Return valid JSON strictly matching: { \"category\": \"Category Name\", \"subcategory\": \"Subcategory Name\", \"confidence\": \"high\" | \"low\", \"clarificationQuestion\": \"If confidence is low, ask a respectful clarification question, else empty string.\" }"
                    },
                    {
                        "role": "user",
                        "content": user_text
                    }
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            parsed = json.loads(response.choices[0].message.content)
            if parsed.get("category") and parsed.get("subcategory"):
                return {
                    "category": parsed["category"],
                    "subcategory": parsed["subcategory"],
                    "confidence": parsed.get("confidence", "high"),
                    "clarificationQuestion": parsed.get("clarificationQuestion", ""),
                    "provider": "openai"
                }
        except Exception as err:
            print("OpenAI classification failed, falling back to local classifier:", err)

    # Local Keyword Fallback
    for item in keyword_map:
        if any(kw in text for kw in item['keywords']):
            return {
                "category": item["category"],
                "subcategory": item["subcategory"],
                "confidence": "high",
                "clarificationQuestion": "",
                "provider": "fallback"
            }

    # Default fallback
    return {
        "category": "Pottery & Ceramics",
        "subcategory": "Diyas",
        "confidence": "high",
        "clarificationQuestion": "",
        "provider": "fallback"
    }

async def generate_description(data: Dict[str, Any]) -> Dict[str, Any]:
    client = get_openai_client()
    product_name = data.get("productName", "")
    category = data.get("category", "")
    subcategory = data.get("subcategory", "")
    quantity = data.get("quantity", "")
    original_description = data.get("originalDescription", "")
    craft = data.get("craft", "")
    location = data.get("location", "")
    language = data.get("language", "hi")

    if client:
        try:
            prompt = f"""Artisan Details: Craft={craft}, Location={location}
Product Details: Name={product_name}, Category={category}, Subcategory={subcategory}, Quantity={quantity}
Original Description: {original_description}
Target Language Code: {language}

Generate a concise, truthful marketplace description.
CRITICAL RULE: DO NOT INVENT ANY UNSUPPORTED FACTS.

Return JSON strictly formatted as:
{{
  "generatedEnglish": "Polished English marketplace description",
  "generatedLocal": "Polished marketplace description in target language"
}}"""
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an authentic Indian craft copywriter."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            result = json.loads(response.choices[0].message.content)
            return {
                "generatedEnglish": result.get("generatedEnglish", original_description),
                "generatedLocal": result.get("generatedLocal", original_description),
                "provider": "openai"
            }
        except Exception as err:
            print("OpenAI description generation failed, falling back to template description:", err)

    # Fallback
    eng_desc = f"Authentic handmade {subcategory.lower()} carefully crafted by {craft or 'artisan'} from {location or 'India'}. {original_description}"
    local_desc = eng_desc
    if language == 'hi':
        local_desc = f"हस्तनिर्मित सुंदर {subcategory.lower()}। {location or 'जयपुर'} के कुशल कारीगर द्वारा तैयार किया गया। {original_description}"
    elif language == 'mr':
        local_desc = f"हस्तनिर्मित सुंदर {subcategory.lower()}। {location or 'महाराष्ट्र'} मधील कुशल कारागिराने बनवलेले. {original_description}"
    elif language == 'bn':
        local_desc = f"হস্তনির্মিত চমৎকার {subcategory.lower()}। {location or 'ভারত'}-এর দক্ষ কারিগর দ্বারা নির্মিত। {original_description}"

    return {
        "generatedEnglish": eng_desc,
        "generatedLocal": local_desc,
        "provider": "fallback"
    }
