import os
import httpx
import pathlib
import time
import base64
import io
from PIL import Image

UPLOADS_DIR = pathlib.Path(__file__).parent.parent / "uploads"
ORIGINAL_DIR = UPLOADS_DIR / "original"
ENHANCED_DIR = UPLOADS_DIR / "enhanced"

ORIGINAL_DIR.mkdir(parents=True, exist_ok=True)
ENHANCED_DIR.mkdir(parents=True, exist_ok=True)

def _bytes_to_data_url(data: bytes, mime: str = "image/jpeg", max_size: int = 800) -> str:
    """Convert raw image bytes to an optimized, resized base64 data URL for persistent storage."""
    try:
        im = Image.open(io.BytesIO(data))
        if im.mode in ("RGBA", "P"):
            im = im.convert("RGB")
        im.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        out = io.BytesIO()
        im.save(out, format="JPEG", quality=82, optimize=True)
        b64 = base64.b64encode(out.getvalue()).decode("utf-8")
        return f"data:image/jpeg;base64,{b64}"
    except Exception as e:
        print(f"[WARN] Failed to convert image to compressed data URL ({e}). Using raw b64.")
        b64 = base64.b64encode(data).decode("utf-8")
        return f"data:{mime};base64,{b64}"

def build_product_image_prompt(category: str, product_name: str, description: str) -> str:
    cat = (category or "").lower()
    name = (product_name or "").lower()
    desc = (description or "").lower()
    
    is_diya = 'diya' in name or 'lamp' in name or 'terracotta diya' in name
    if is_diya:
        return "Create a realistic professional e-commerce photograph of this exact handmade clay diya. Keep the diya completely unchanged, including its exact shape, color, wick, oil, texture and flame. Remove the original outdoor background and place the diya on a beautiful natural wooden tabletop in a warm traditional Indian festive setting. Add only a few subtle jasmine or marigold flowers, minimal brass decorative elements and soft green leaves in the background. Use warm golden ambient lighting, realistic soft shadows and shallow depth of field. Keep the diya centered and sharply focused. The background must remain subtle and must not compete with the diya. Do not use fabric, bedsheets, curtains or unrelated objects. Do not add decorations to the diya itself."

    environment = f"highly cohesive environment that naturally complements a {name or 'handmade item'}, using appropriate surfaces, natural lighting, soft realistic shadows, and 1-3 subtle, relevant complementary props"
    
    return f"Create a realistic professional e-commerce photograph of this exact product. Keep the product completely unchanged, including its exact shape, size, proportions, color, pattern, design, engraving, artwork, texture, material, decorations, and handmade details. Remove the original background and place the product in/on a {environment}. The product must be clearly visible, sharp, dominant, and professionally composed using realistic depth of field. Negative constraints: Do not use generic studio backdrops. Do not change or redesign the original product. Do not add decorations to the product. Do not add text, logos, or watermarks. Do not use unrelated objects. Do not use fabric unless the product naturally calls for it. Do not overcrowd the scene or let the background overpower the product."

async def process_image(file_path: str, filename: str, mime_type: str, product_context: dict) -> dict:
    original_url = f"/uploads/original/{filename}"
    enhanced_filename = f"enhanced_{int(time.time())}_{filename.split('.')[0]}.png"
    enhanced_file_path = ENHANCED_DIR / enhanced_filename
    enhanced_url = f"/uploads/enhanced/{enhanced_filename}"

    with open(file_path, "rb") as f:
        raw_bytes = f.read()

    original_data_url = _bytes_to_data_url(raw_bytes, mime_type)

    photoroom_key = os.getenv("PHOTOROOM_API_KEY")
    is_key_configured = bool(photoroom_key and photoroom_key.strip() != "" and photoroom_key != "your_photoroom_api_key_here")

    if is_key_configured:
        cat = product_context.get("category", "product")
        name = product_context.get("productName", "item")
        desc = product_context.get("description", "")
        bg_prompt = build_product_image_prompt(cat, name, desc)

        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                files = {
                    "imageFile": (filename, raw_bytes, mime_type)
                }
                data = {
                    "padding": "0.15",
                    "shadow.mode": "ai.soft",
                    "background.prompt": bg_prompt,
                    "background.model": "background-studio-beta-2025-03-17"
                }
                headers = {
                    "x-api-key": photoroom_key,
                    "Accept": "image/png, application/json"
                }
                response = await client.post("https://image-api.photoroom.com/v2/edit", data=data, files=files, headers=headers)
                
                if response.status_code >= 400:
                    # Retry without beta model
                    data.pop("background.model", None)
                    response = await client.post("https://image-api.photoroom.com/v2/edit", data=data, files=files, headers=headers)
                
                if response.status_code == 200 and 'image' in response.headers.get('content-type', ''):
                    with open(enhanced_file_path, "wb") as out_f:
                        out_f.write(response.content)
                    enhanced_data_url = _bytes_to_data_url(response.content, "image/png")
                    return {
                        "success": True,
                        "processed": True,
                        "mode": "photoroom",
                        "originalImage": original_data_url,
                        "enhancedImage": enhanced_data_url,
                        "originalPath": original_url,
                        "enhancedPath": enhanced_url
                    }
                else:
                    return {
                        "success": True,
                        "processed": False,
                        "mode": "photoroom-error",
                        "error": f"HTTP {response.status_code}",
                        "originalImage": original_data_url,
                        "enhancedImage": original_data_url,
                        "originalPath": original_url,
                        "enhancedPath": original_url
                    }
            except Exception as e:
                return {
                    "success": True,
                    "processed": False,
                    "mode": "photoroom-error",
                    "error": str(e),
                    "originalImage": original_data_url,
                    "enhancedImage": original_data_url,
                    "originalPath": original_url,
                    "enhancedPath": original_url
                }
    else:
        return {
            "success": True,
            "processed": False,
            "mode": "photoroom-not-configured",
            "originalImage": original_data_url,
            "enhancedImage": original_data_url,
            "originalPath": original_url,
            "enhancedPath": original_url
        }
