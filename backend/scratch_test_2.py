import httpx
import asyncio
import sys

# Ensure stdout can print UTF-8 on Windows
sys.stdout.reconfigure(encoding='utf-8')

async def run():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            'https://kaarigar-sih-2k26.onrender.com/voice/main-menu?lang=hi',
            data={'Digits': '1', 'From': '+917499019651', 'To': '+17372508034', 'Direction': 'inbound'}
        )
        print(response.status_code)
        print(response.text)

asyncio.run(run())
