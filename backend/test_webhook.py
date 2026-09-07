import asyncio
from main import app
from fastapi.testclient import TestClient
from onboarding.services.session import set_session, get_session
import sqlite3

client = TestClient(app)

phone = "+915555555555"

# 1. Manually set the session state to 'awaiting_confirmation'
set_session(phone, {
    "state": "awaiting_confirmation",
    "language": "hi",
    "retry_count": 0,
    "extracted_data": {
        "name": "Test Artisan",
        "village": "Test Village",
        "craft": "Pottery"
    }
})

print("Session set:", get_session(phone))

# 2. Simulate the WhatsApp incoming webhook with "YES"
response = client.post(
    "/whatsapp/incoming",
    data={
        "From": f"whatsapp:{phone}",
        "Body": "YES",
        "NumMedia": "0",
        "MediaUrl0": "",
        "MediaContentType0": ""
    }
)

print("Webhook response status:", response.status_code)

# 3. Check SQLite DB for the new artisan
conn = sqlite3.connect('kaarigar.db')
cursor = conn.cursor()
cursor.execute("SELECT id, name, phone, password, verified FROM artisans WHERE phone=?", (phone,))
artisan = cursor.fetchone()
print("Artisan in DB:", artisan)
