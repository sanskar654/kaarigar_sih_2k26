import os
from twilio.rest import Client
from dotenv import load_dotenv

# Load credentials from .env
load_dotenv()

account_sid = os.getenv("TWILIO_ACCOUNT_SID")
auth_token = os.getenv("TWILIO_AUTH_TOKEN")

# Remove "whatsapp:" if it's there
from_phone = os.getenv("TWILIO_PHONE_NUMBER", "").replace("whatsapp:", "")
to_phone = "+917499019651"

# The webhook URL that Twilio will fetch when you pick up the phone
url = "https://kaarigar-sih-2k26.onrender.com/voice/incoming"

client = Client(account_sid, auth_token)

print(f"Initiating call to {to_phone} from {from_phone}...")

call = client.calls.create(
    to=to_phone,
    from_=from_phone,
    url=url,
    method="POST"
)

print(f"Call initiated successfully! SID: {call.sid}")
print("Please keep your phone nearby and answer it!")
