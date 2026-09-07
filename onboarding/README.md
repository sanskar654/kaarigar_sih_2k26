# /onboarding — Track A (Ethan)

IVR call flow, WhatsApp verification, Pahchan ID OCR.
See Section 2.1 and 5.1 of `Kaarigar_Prototype_Master_Document.docx`.

## What This Does

An artisan calls a phone number → hears a voice menu → registers → gets a
WhatsApp message asking for their Pahchan ID photo → OCR reads it → the
artisan confirms → their account is marked verified in the shared database.

```
Phone Call                           WhatsApp
─────────                           ────────
Language menu (1=Hindi)
  ↓
Main menu (1=Register, 2=Sell, 3=Help)
  ↓
"Do you have Pahchan ID?"
  ↓ Yes                              ← "Send photo of your ID"
Goodbye + Hangup                       Artisan sends photo
                                       ↓
                                     OCR extracts Name, Village, Craft
                                       ↓
                                     "Naam: X, Gaon: Y, Shilp: Z — YES?"
                                       ↓ YES
                                     Account created + verified ✅
```

## Architecture

This is a **separate FastAPI server** (port 3001) that talks to Track C's
shared backend (port 8000) over HTTP. It never touches the shared database
directly — it calls `POST /api/artisans` and `POST /api/artisans/{id}/verify`.

```
onboarding/
├── app.py                  ← FastAPI entry point (uvicorn app:app)
├── routes/
│   ├── voice.py            ← Twilio Voice webhooks (TwiML generation)
│   └── whatsapp.py         ← Twilio WhatsApp incoming messages
├── services/
│   ├── ocr.py              ← pytesseract wrapper (eng+hin)
│   ├── session.py          ← In-memory session store (phone → state)
│   ├── twilio_client.py    ← Send WhatsApp messages + download media
│   └── backend_api.py      ← HTTP client to shared FastAPI backend
├── requirements.txt
├── .env.example            ← Credential template
└── README.md               ← You are here
```

## Prerequisites

### 1. Python 3.11+

### 2. Tesseract OCR Binary

Download and install from: https://github.com/UB-Mannheim/tesseract/wiki

**During installation:**
- ✅ Check **"Additional language data"**
- ✅ Select **Hindi** (for `eng+hin` OCR support)

If Tesseract is NOT in your system `PATH`, set the path in your `.env`:
```env
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

### 3. Twilio Account (Free Trial)

1. Sign up at https://www.twilio.com/try-twilio
2. Get a phone number (Console → Phone Numbers → Buy a Number)
3. Verify your personal phone number (Console → Phone Numbers → Verified Caller IDs)
4. Enable the WhatsApp Sandbox (Console → Messaging → Try it out → Send a WhatsApp message)
5. Join the sandbox by sending the join code from your phone

### 4. ngrok

Download from https://ngrok.com/download — used to give Twilio a public URL
to reach your local server.

## Setup

### Step 1 — Install dependencies

```bash
cd onboarding
pip install -r requirements.txt
```

### Step 2 — Configure environment

```bash
cp .env.example .env
# Edit .env with your Twilio credentials
```

### Step 3 — Make sure the shared backend is running

```bash
cd ../backend
uvicorn main:app --reload --port 8000
```

### Step 4 — Start the onboarding server

```bash
cd ../onboarding
uvicorn app:app --reload --port 3001
```

### Step 5 — Start ngrok

```bash
ngrok http 3001
```

Copy the `https://xxxx.ngrok-free.app` URL.

### Step 6 — Configure Twilio webhooks

**Voice (phone number):**
1. Go to Twilio Console → Phone Numbers → your number → Configure
2. Under "A Call Comes In", set:
   - Webhook: `https://xxxx.ngrok-free.app/voice/incoming`
   - Method: HTTP POST

**WhatsApp (sandbox):**
1. Go to Twilio Console → Messaging → Settings → WhatsApp Sandbox Settings
2. Under "When a message comes in", set:
   - Webhook: `https://xxxx.ngrok-free.app/whatsapp/incoming`
   - Method: HTTP POST

### Step 7 — Test!

1. Call your Twilio number from a verified phone
2. Press 1 (Hindi) → 1 (Register) → 1 (Yes, have Pahchan ID)
3. Check WhatsApp for the photo request message
4. Send a photo of a Pahchan ID card
5. Confirm with "YES"
6. Verify at `http://localhost:8000/api/artisans` — your artisan should show `verified: true`

## Edge Cases Handled

| Scenario | Behaviour |
|---|---|
| No keypress (timeout) | Prompt repeats once, then hangs up with polite message |
| No Pahchan ID (press 2) | Rejection message citing government rules, then hangup |
| Already registered | "You're already registered", then hangup |
| Blurry photo / OCR fails | Asks to resend, up to 3 times |
| 3 failed photo attempts | "Please call back and try again", session cleared |
| User sends text not photo | Asks specifically for a photo |
| Non-YES confirmation reply | Re-sends the readback for re-confirmation |
| Backend API failure | Error message, session kept so user can retry YES |

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/voice/incoming` | Language selection (first webhook) |
| `POST` | `/voice/language-selected` | Main menu after language choice |
| `POST` | `/voice/main-menu` | Route by digit (register/sell/help) |
| `POST` | `/voice/registration` | Phone check + Pahchan ID question |
| `POST` | `/voice/pahchan-check` | Yes/No → WhatsApp handoff or rejection |
| `POST` | `/whatsapp/incoming` | All incoming WhatsApp messages |
| `GET`  | `/health` | Service health check |

Interactive API docs: http://localhost:3001/docs

## What Track C Already Built For You

The shared backend (`/backend`) exposes the endpoints this service calls:

| Call | When we use it |
|---|---|
| `POST /api/artisans` | After OCR extracts name/village/craft from the Pahchan ID |
| `POST /api/artisans/{id}/verify` | Once the artisan replies YES to the readback |
| `GET /api/artisans` | To check if a phone number is already registered |
