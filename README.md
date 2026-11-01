# AIVA — Artificial Intelligence Virtual Assistant

> 🤖 AI-Powered Hostel Helpdesk Chatbot with Ollama, PostgreSQL, Google Auth & Telegram

[![Built with FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square)](https://fastapi.tiangolo.com/)
[![Built with Next.js](https://img.shields.io/badge/Frontend-Next.js-000000?style=flat-square)](https://nextjs.org/)
[![Database](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ECF8E?style=flat-square)](https://supabase.com/)
[![AI](https://img.shields.io/badge/AI-Ollama-white?style=flat-square)](https://ollama.ai/)

---

## 🎯 Overview

AIVA is a full-stack AI chatbot application designed for hostel helpdesk operations. It helps students register complaints, track issues, report lost items, and get answers to common hostel questions — through both a web dashboard and Telegram.

### Key Features

- **🤖 AI Chat** — Natural language conversations powered by Ollama (local LLM)
- **📋 Complaint System** — Register, track, and resolve hostel complaints
- **🔍 Lost & Found** — Report and search for lost/found items
- **🔐 Google Auth** — Secure authentication via Supabase
- **💬 Telegram Bot** — Full bot integration with webhook support
- **👨‍💼 Admin Dashboard** — Real-time analytics, complaint management, human handover
- **📊 Analytics** — Track usage, response times, and conversation progress
- **🧠 RAG** — Retrieval-Augmented Generation for hostel rules and FAQs

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js Web   │────▶│  FastAPI Backend  │────▶│    Supabase     │
│   (Frontend)    │     │   (Python API)    │     │  (PostgreSQL +  │
│                 │     │                   │     │   Auth + Storage)│
└─────────────────┘     └──────┬───────────┘     └─────────────────┘
                               │       │
                    ┌──────────┘       └──────────┐
                    ▼                              ▼
            ┌──────────────┐              ┌──────────────┐
            │   Ollama AI  │              │ Telegram Bot │
            │ (Local LLM)  │              │   (Webhook)  │
            └──────────────┘              └──────────────┘
```

---

## 📋 Prerequisites

| Tool | Minimum Version | Purpose |
|------|----------------|---------|
| Python | 3.10+ | Backend runtime |
| Node.js | 18+ | Frontend runtime |
| pnpm | 8+ | Frontend package manager |
| Git | 2.x | Version control |
| Ollama | 0.3+ | Local AI model serving |

### External Services (Free Tier)

| Service | Purpose | Sign Up |
|---------|---------|---------|
| Supabase | PostgreSQL, Auth, Storage | [supabase.com](https://supabase.com) |
| Google Cloud | OAuth credentials | [console.cloud.google.com](https://console.cloud.google.com) |
| Telegram | Bot API | [@BotFather](https://t.me/botfather) |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt

# Frontend
cd frontend
pnpm install
```

### 2. Environment Setup

```bash
# Copy example env files
copy .env.example .env                       # Root
copy backend\.env.example backend\.env       # Backend  
copy frontend\.env.example frontend\.env.local  # Frontend
```

Edit each `.env` file with your actual credentials. See [Setup Guide](docs/setup-guide.md) for details.

### 3. Database Setup

```bash
cd backend
alembic upgrade head
```

### 4. Start Ollama

```bash
ollama serve
ollama pull llama3.2    # Pull a model if needed
```

### 5. Run Development Servers

```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
pnpm dev
```

Visit **http://localhost:3000** 🎉

---

## 📁 Project Structure

```
AI_PROJECT/
├── backend/                    # Python FastAPI Backend
│   ├── app/
│   │   ├── api/routes/        # API endpoint handlers
│   │   ├── core/              # Config, database, security, logging
│   │   ├── models/            # SQLAlchemy database models
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── services/          # Business logic layer
│   │   └── integrations/      # Telegram, Supabase, external APIs
│   ├── alembic/               # Database migrations
│   ├── knowledge/             # RAG knowledge documents
│   ├── tests/                 # Automated tests
│   └── requirements.txt
│
├── frontend/                   # Next.js TypeScript Frontend
│   ├── src/
│   │   ├── app/               # Pages (App Router)
│   │   ├── components/        # Reusable UI components
│   │   ├── lib/               # Utilities, API client, Supabase
│   │   └── types/             # TypeScript interfaces
│   └── package.json
│
├── docs/                       # Documentation
├── .env.example                # Environment variable template
├── .gitignore
└── README.md
```

---

## 🔧 Configuration

### Required Environment Variables

See [`.env.example`](.env.example) for all variables with descriptions.

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key | Supabase Dashboard → Settings → API |
| `DATABASE_URL` | PostgreSQL connection string | Supabase Dashboard → Settings → Database |
| `OLLAMA_BASE_URL` | Ollama server URL | Default: `http://localhost:11434` |
| `OLLAMA_MODEL` | LLM model name | Run `ollama list` to see installed models |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | @BotFather on Telegram |
| `APP_SECRET_KEY` | Server signing key | Generate: `python -c "import secrets; print(secrets.token_hex(32))"` |

---

## 🧪 Testing

```bash
cd backend
pytest -v                    # Run all tests
pytest -v --cov=app          # With coverage
pytest tests/test_auth.py    # Specific test file
```

See [Testing Checklist](docs/testing-checklist.md) for manual E2E testing.

---

## 🌐 Deployment

| Component | Recommended Host | Alternatives |
|-----------|-----------------|--------------|
| Frontend | Vercel | Netlify, Cloudflare Pages |
| Backend | Railway / Render | Fly.io, DigitalOcean |
| Database | Supabase (managed) | — |
| Ollama | Self-hosted server | Cloud GPU instance |

> ⚠️ **Ollama Note**: If your backend is cloud-hosted, Ollama on your local PC won't be accessible. Options:
> 1. Host Ollama on a VPS/cloud server
> 2. Use ngrok to tunnel local Ollama (development only)
> 3. Use a cloud LLM API as fallback

---

## 📊 25-Conversation Requirement

The project tracks genuine user conversations for evaluation:

1. **Share the bot** with 25+ real users (classmates, hostel residents)
2. **Each conversation** must have at least 2 messages from a real user
3. **Admin dashboard** shows progress toward the 25-conversation goal
4. **CSV export** provides evidence of genuine interactions
5. **No fake data** — the system only counts real user interactions

---

## 📄 License

This project is built for educational purposes as part of a hostel helpdesk AI evaluation.

---

<p align="center">
  <b>AIVA</b> — Artificial Intelligence Virtual Assistant<br>
  Built with ❤️ for smarter hostel management
</p>
