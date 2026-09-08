import httpx
import asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')

async def run():
    async with httpx.AsyncClient() as client:
        # Simulate Twilio Gather webhook WITHOUT To and Direction
        response = await client.post(
            'https://kaarigar-sih-2k26.onrender.com/voice/language-selected',
            data={'Digits': '1', 'From': '+917499019651'}
        )
        print(response.status_code)
        print(response.text)

asyncio.run(run())
