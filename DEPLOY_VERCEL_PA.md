# Vercel + PythonAnywhere Deployment Guide

## Architecture
- **Frontend**: Vercel (React app) - https://your-app.vercel.app
- **Backend**: PythonAnywhere (FastAPI + aiogram bot) - https://yourusername.pythonanywhere.com

## Step 1: Deploy Backend to PythonAnywhere

1. Go to https://www.pythonanywhere.com and create account
2. Open **Bash console** and run:
```bash
git clone https://github.com/igorkoval11/Meeedl.eng.git
cd Meeedl.eng
pip install -r requirements.txt
```

3. Create `.env` file:
```bash
nano .env
```

Add your variables:
```
BOT_TOKEN=your_bot_token
OWNER_CHAT_ID=your_chat_id
APP_BASE_URL=https://your-app.vercel.app  # <-- Will update after Vercel deploy
API_HOST=0.0.0.0
API_PORT=8080
TRIBUTE_URL_LITE=https://t.me/tribute/app?startapp=...
TRIBUTE_URL_PLUS=https://t.me/tribute/app?startapp=...
TRIBUTE_URL_PRO=https://t.me/tribute/app?startapp=...
TRIBUTE_URL_DEFAULT=https://t.me/tribute
SUPPORT_USERNAME=@youdaew
```

4. Go to **Web** tab, click **Add a new web app**
   - Choose **Manual configuration**
   - Python 3.11
   - Set path: `/home/yourusername/Meeedl.eng`
   - WSGI file content:
```python
import sys
sys.path.insert(0, '/home/yourusername/Meeedl.eng')

from backend.config import get_settings
from backend.api import create_api_app

settings = get_settings()
application = create_api_app(settings)
```

5. **Important**: Update "Virtualenv" path if you use one

6. **Reload** the web app

7. Test: Visit `https://yourusername.pythonanywhere.com/health`

## Step 2: Deploy Frontend to Vercel

1. Update `frontend/src/App.jsx`:
```javascript
const API_BASE_URL = "https://yourusername.pythonanywhere.com";  // <-- Your PythonAnywhere URL
```

2. Build frontend locally:
```bash
cd frontend
npm install
npm run build
```

3. Install Vercel CLI:
```bash
npm install -g vercel
```

4. Deploy:
```bash
cd frontend
vercel
```
   - Login with Vercel account
   - Confirm settings
   - Get URL like `https://meeedl-eng.vercel.app`

5. **Copy this URL** for next step

## Step 3: Update PythonAnywhere

1. Update `.env` on PythonAnywhere:
```
APP_BASE_URL=https://meeedl-eng.vercel.app  # <-- Your Vercel URL
```

2. Reload web app on PythonAnywhere

3. Update **BotFather**:
   - Send `/setmenubutton` to @BotFather
   - Choose your bot
   - Set URL: `https://meeedl-eng.vercel.app`

## Step 4: Start Bot

On PythonAnywhere, go to **Tasks** tab:
- Create **Always-on task** (paid) or **Scheduled task** (free, runs every hour)
- Command: `cd /home/yourusername/Meeedl.eng && python main.py`

Or use **Web** tab for webhook mode (better):
- Add webhook endpoint to `backend/api.py` (see below)

## Webhook Mode (Recommended for PythonAnywhere)

Instead of polling, use webhooks (bot sleeps until message arrives):

1. Add to `backend/api.py`:
```python
from aiogram import Bot
from backend.bot_handlers import create_router

@app.post("/webhook")
async def webhook(update: dict):
    bot = Bot(token=settings.bot_token)
    dispatcher = Dispatcher()
    dispatcher.include_router(create_router(settings))
    
    from aiogram.types import Update
    telegram_update = Update(**update)
    await dispatcher.feed_update(bot, telegram_update)
    return {"ok": True}
```

2. Set webhook URL via BotFather or API:
```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://yourusername.pythonanywhere.com/webhook
```

## Troubleshooting

### CORS errors
- Check CORS middleware is added in `backend/api.py`
- Verify `allow_origins` includes your Vercel domain

### Bot not responding
- Check PythonAnywhere web app is **Reloaded** after env changes
- Verify `BOT_TOKEN` is correct
- Check logs in PythonAnywhere **Web** tab → **Log files**

### Mini App not opening
- Verify `APP_BASE_URL` matches Vercel URL exactly
- Check BotFather has correct Mini App URL

## Cost
- **PythonAnywhere**: Free tier (sleep mode, manual reload every 3 months) or $5/month
- **Vercel**: Free tier (very generous limits)
- **Total**: $0-5/month
