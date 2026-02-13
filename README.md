# Meeedl.Eng mini app MVP

MVP for selling access to a closed Telegram channel via Tribute:

- Telegram bot with 3 tariff buttons
- Telegram mini app with selected tariff and CTA `Перейти к оплате`
- Tribute payment links per tariff (configured in `.env`)
- Bot onboarding flow with short conversion-focused messages

## Stack

- Backend: Python, FastAPI, aiogram
- Frontend: Vite + React

## Current flow

1. User opens bot and sends `/start`
2. Bot sends one short entry message with button `Открыть Meeedl.Pack`
3. Mini app opens as a compact landing page with value block and all tariffs
4. User taps `Перейти к оплате` on selected tariff
5. Mini app opens Tribute payment link for that tariff
6. Tribute handles payment and access automation

## Quick start (local)

1) Create and fill `.env`:

```bash
copy .env.example .env
```

2) Install backend deps:

```bash
pip install -r requirements.txt
```

3) Install and build frontend:

```bash
cd frontend
npm install
npm run build
cd ..
```

4) Run app:

```bash
python main.py
```

Backend + bot start together. API defaults to `http://localhost:8000`.

## Telegram mini app in local environment

Telegram mini app requires a public HTTPS URL.

Use one of these tunnels:

```bash
cloudflared tunnel --url http://127.0.0.1:8000 --protocol http2
```

or

```bash
ngrok http 8000
```

Then put tunnel URL into `.env` as `APP_BASE_URL`, restart `python main.py`, and call `/start` in bot.

## Important env variables

- `BOT_TOKEN` - Telegram bot token
- `OWNER_CHAT_ID` - chat id for owner notifications
- `APP_BASE_URL` - public HTTPS base URL
- `SUPPORT_USERNAME` - username shown in bot and mini app support blocks
- `TRIBUTE_URL_LITE` - payment link for 1 month tariff
- `TRIBUTE_URL_PLUS` - payment link for 3 months tariff
- `TRIBUTE_URL_PRO` - payment link for 6 months tariff
- `TRIBUTE_URL_DEFAULT` - fallback payment link

## Notes

- Tribute links are opened from mini app; payment confirmation is handled on Tribute side.
- Legal pages (offer/privacy) are intentionally postponed for this MVP.
