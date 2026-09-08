import httpx
import asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')

async def run():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            'https://kaarigar-sih-2k26.onrender.com/voice/pahchan-check?lang=hi',
            data={'Digits': '1', 'From': '+917499019651', 'To': '+17372508034', 'Direction': 'inbound'}
        )
        print(response.status_code)
        print(response.text)

asyncio.run(run())
