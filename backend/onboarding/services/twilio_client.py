"""Twilio REST API wrapper for sending WhatsApp messages and downloading media.

Uses the Twilio Python SDK for outbound messaging and httpx for authenticated
media downloads (Twilio-hosted images require Basic Auth).

Credentials come from environment variables:
    TWILIO_ACCOUNT_SID
    TWILIO_AUTH_TOKEN
    TWILIO_WHATSAPP_FROM  (e.g. whatsapp:+14155238886)
"""
import os

import httpx
from twilio.rest import Client

_client: Client | None = None


def _get_client() -> Client:
    """Lazy-initialise the Twilio REST client."""
    global _client
    if _client is None:
        _client = Client(
            os.environ["TWILIO_ACCOUNT_SID"],
            os.environ["TWILIO_AUTH_TOKEN"],
        )
    return _client


def send_whatsapp(to: str, body: str, content_sid: str = None) -> str:
    """Send a WhatsApp message via Twilio.

    If the account is in trial mode and Twilio rejects free-form body with
    error 21654 (ContentSid Required), automatically falls back to sending
    via pre-approved ContentSid.

    Args:
        to:          Recipient phone in E.164 (+919...) or whatsapp:+919... format.
        body:        Message text.
        content_sid: Optional pre-approved template ContentSid (starts with HX).

    Returns:
        The Twilio Message SID.
    """
    client = _get_client()
    from_number = os.environ.get("TWILIO_WHATSAPP_FROM", os.environ.get("TWILIO_PHONE_NUMBER", ""))

    # Ensure whatsapp: prefix on both sides
    if not to.startswith("whatsapp:"):
        to = f"whatsapp:{to}"
    if not from_number.startswith("whatsapp:"):
        from_number = f"whatsapp:{from_number}"

    template_sid = content_sid or os.environ.get("TWILIO_CONTENT_SID", "HXfe5ab5f00277942d4d4200328b4d403c")

    try:
        message = client.messages.create(
            body=body,
            from_=from_number,
            to=to,
        )
        return message.sid
    except Exception as e:
        if "ContentSid" in str(e) and template_sid:
            print(f"[INFO] Free-form WhatsApp rejected ({e}); falling back to ContentSid: {template_sid}")
            message = client.messages.create(
                content_sid=template_sid,
                from_=from_number,
                to=to,
            )
            return message.sid
        raise e


async def download_media(media_url: str) -> bytes:
    """Download a media file from Twilio (requires Basic Auth).

    Twilio's MediaUrl values look like:
    https://api.twilio.com/2010-04-01/Accounts/.../Messages/.../Media/...

    They require HTTP Basic Auth with Account SID : Auth Token.
    """
    auth = (
        os.environ["TWILIO_ACCOUNT_SID"],
        os.environ["TWILIO_AUTH_TOKEN"],
    )
    async with httpx.AsyncClient(follow_redirects=True) as client:
        response = await client.get(media_url, auth=auth)
        response.raise_for_status()
        return response.content
