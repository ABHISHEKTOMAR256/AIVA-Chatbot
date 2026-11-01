# AIVA Setup Guide

Complete step-by-step instructions for setting up every external service.

---

## 1. Supabase Project Setup

### Step 1: Create Account & Project
1. Go to [https://supabase.com](https://supabase.com)
2. Click **Start your project** → Sign in with GitHub
3. Click **New Project**
4. Fill in:
   - **Project name**: `aiva-hostel`
   - **Database Password**: Generate a strong password → **SAVE THIS PASSWORD**
   - **Region**: Choose the closest to your location
5. Click **Create new project** (takes ~2 minutes)

### Step 2: Get API Keys
1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → This is your `SUPABASE_URL`
   - **anon public** key → This is your `SUPABASE_ANON_KEY`
   - **service_role** key → This is your `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Get Database Connection String
1. Go to **Settings** → **Database**
2. Under **Connection string**, select **URI** tab
3. Select **Transaction** mode (important for connection pooling)
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your database password
6. Change the prefix from `postgresql://` to `postgresql+asyncpg://`
7. This is your `DATABASE_URL`

Example:
```
postgresql+asyncpg://postgres.abcdef:YourPassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Step 4: Enable pgvector Extension
1. Go to **Database** → **Extensions**
2. Search for `vector`
3. Enable the **vector** extension

### Step 5: Create Storage Bucket
1. Go to **Storage**
2. Click **New Bucket**
3. Name: `aiva-media`
4. Toggle **Private bucket** ON
5. Click **Create bucket**

---

## 2. Google OAuth Setup

### Step 1: Create Google Cloud Project
1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown → **New Project**
3. Name: `AIVA Hostel` → **Create**
4. Select the new project

### Step 2: Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** → **Create**
3. Fill in:
   - **App name**: AIVA Hostel Helpdesk
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Click **Save and Continue**
5. **Scopes**: Click **Add or remove scopes**
   - Select `email`, `profile`, `openid`
   - Click **Update** → **Save and Continue**
6. **Test users**: Add your email → **Save and Continue**
7. Click **Back to Dashboard**

### Step 3: Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `AIVA Web Client`
5. **Authorized redirect URIs**: Add:
   ```
   https://YOUR-SUPABASE-PROJECT-ID.supabase.co/auth/v1/callback
   ```
   (Replace YOUR-SUPABASE-PROJECT-ID with your actual Supabase project ref)
6. Click **Create**
7. **SAVE** the Client ID and Client Secret

### Step 4: Configure in Supabase
1. In Supabase Dashboard → **Authentication** → **Providers**
2. Click **Google**
3. Toggle **Enable Google provider** ON
4. Paste your **Client ID** and **Client Secret**
5. Click **Save**

### Step 5: Configure Redirect URLs in Supabase
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:3000` (development) or your production URL
3. Add **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   https://your-production-domain.vercel.app/auth/callback
   ```

---

## 3. Telegram Bot Setup

### Step 1: Create Bot
1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Choose a name: `AIVA Hostel Helpdesk`
4. Choose a username: `aiva_hostel_bot` (must end in `bot`)
5. BotFather will give you a **token** like: `7123456789:AAH...`
6. This is your `TELEGRAM_BOT_TOKEN`

### Step 2: Configure Bot
Send these commands to @BotFather:
```
/setdescription
# Select your bot, then send:
AIVA - AI-Powered Hostel Helpdesk Assistant. File complaints, track issues, report lost items, and get instant answers.

/setcommands
# Select your bot, then send:
start - Start the bot
help - Show available commands
complaint - File a new complaint
status - Check complaint status
lost - Report a lost item
human - Request human assistance
cancel - Cancel current operation
link - Link to your web account
```

### Step 3: Set Webhook (after deployment)
```bash
# Generate a random webhook secret
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Save this as TELEGRAM_WEBHOOK_SECRET

# Register webhook (replace with your actual values)
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-backend-domain.com/webhooks/telegram",
    "secret_token": "your-webhook-secret",
    "allowed_updates": ["message", "callback_query"]
  }'
```

---

## 4. Ollama Setup

### Already Installed?
```bash
ollama --version
```

### Install (if needed)
Download from [https://ollama.ai](https://ollama.ai) and run the installer.

### Start Ollama
```bash
ollama serve
```
Or launch from the Start Menu (runs in system tray).

### Pull a Model
```bash
# Recommended for most PCs (2GB):
ollama pull llama3.2

# Better quality, needs more RAM (4.7GB):
ollama pull llama3.1

# Image understanding (4.7GB):
ollama pull llava
```

### Verify
```bash
ollama list                    # See installed models
curl http://localhost:11434    # Should return "Ollama is running"
```

---

## 5. Generate Secret Key

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Use the output as your `APP_SECRET_KEY`.

---

## 6. Final .env Configuration

After completing all steps above, your `backend/.env` should look like:

```env
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
DATABASE_URL=postgresql+asyncpg://postgres.abcdefgh:MyPassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
TELEGRAM_BOT_TOKEN=7123456789:AAH...
TELEGRAM_WEBHOOK_SECRET=random-generated-secret
APP_SECRET_KEY=your-64-char-hex-key
CORS_ORIGINS=http://localhost:3000
```

And `frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=aiva_hostel_bot
```
