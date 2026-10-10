# Deployment Guide — HerGuardian AI

This document explains how to deploy the HerGuardian AI project to production:
- Frontend: Vercel (React + Vite)
- Backend: Render (Node.js + Express + MongoDB)
- Nutrition Bot: Render (Flask + IBM Watsonx.ai)

---

## Overview

| Service | Platform | Location |
|---------|----------|----------|
| Frontend | Vercel | `frontend/` |
| Backend API | Render | `backend/` |
| Nutrition Bot | Render | `nutrition bot/` |

---

## Frontend Deployment (Vercel)

### Step 1: Import Project to Vercel

1. Go to [Vercel](https://vercel.com) and sign in with GitHub
2. Click **Add New...** → **Project**
3. Select your GitHub repository
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### Step 2: Set Environment Variables

Add these in Vercel Project Settings → Environment Variables (Production):

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL (must end in `/api`) | `https://herguardian-backend.onrender.com/api` |
| `VITE_NUTRIBOT_API_BASE_URL` | Nutrition Bot service URL | `https://herguardian-nutrition.onrender.com` |

**Important:** `VITE_` variables are embedded at build time. Set them before deploying.

### Step 3: Deploy

Click **Deploy**. Vercel will build and host your frontend at `https://your-project.vercel.app`.

---

## Backend Deployment (Render)

### Step 1: MongoDB Atlas Setup

1. Create a free MongoDB Atlas cluster
2. Create a database user with read/write permissions
3. **Important:** Configure IP access:
   - Go to Network Access → IP Access List
   - Add `0.0.0.0/0` to allow all IPs (required for Render free tier)
4. Get your connection string with credentials

### Step 2: Deploy via Blueprint (Recommended)

1. Go to [Render](https://render.com) and sign in with GitHub
2. Click **New** → **Blueprint**
3. Connect your GitHub repository
4. Render will read `render.yaml` and configure both services automatically
5. Set environment variables (see table below)

### Step 3: Manual Setup (Alternative)

For the **Backend Service**:
- **Type:** Web Service
- **Root Directory:** `backend`
- **Runtime:** Node
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Health Check Path:** `/api/health`

For the **Nutrition Bot Service**:
- **Type:** Web Service
- **Root Directory:** `nutrition bot`
- **Runtime:** Python
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT`
- **Health Check Path:** `/api/health`

### Step 4: Backend Environment Variables

Set these in the Render service environment:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Strong secret for JWT tokens |
| `GEMINI_API_KEY` | Yes | Google Gemini AI API key |
| `FRONTEND_URL` | Yes | Your Vercel frontend URL (for CORS) |
| `SMTP_HOST` | Yes | SMTP server host (e.g., `smtp.gmail.com`) |
| `SMTP_PORT` | Yes | SMTP port (e.g., `587`) |
| `SMTP_USER` | Yes | SMTP username |
| `SMTP_PASS` | Yes | SMTP password/app password |
| `SMTP_SECURE` | Yes | `true` or `false` |
| `FROM_NAME` | Yes | Email sender name (e.g., `HerGuardian AI`) |
| `FROM_EMAIL` | Yes | Email sender address |
| `ADZUNA_APP_ID` | Optional | Adzuna API ID for job listings |
| `ADZUNA_APP_KEY` | Optional | Adzuna API key |
| `JOOBLE_API_KEY` | Optional | Jooble API key |
| `RAPIDAPI_KEY` | Optional | RapidAPI JSearch key |
| `CRON_SECRET` | Yes | Secret for cron-job.org authentication |

### Step 5: Nutrition Bot Environment Variables

Set these in the Nutrition Bot service environment:

| Variable | Required | Description |
|----------|----------|-------------|
| `IBM_API_KEY` | Yes | IBM Cloud API key |
| `IBM_PROJECT_ID` | Yes | IBM Watsonx.ai project ID |
| `IBM_WATSONX_URL` | Yes | Watsonx.ai URL (e.g., `https://us-south.ml.cloud.ibm.com`) |
| `WATSONX_MODEL_ID` | Yes | Model ID (e.g., `meta-llama/llama-3-3-70b-instruct`) |
| `FLASK_SECRET_KEY` | Yes | Flask secret key |
| `CORS_ORIGINS` | Yes | Comma-separated frontend origins (e.g., `https://your-site.vercel.app`) |

---

## Cron Job Setup (Opportunity Refresh)

The backend needs periodic refreshes of job opportunity listings. On Render Free, the in-process scheduler is disabled. Use cron-job.org:

1. Go to [cron-job.org](https://cron-job.org) and create an account
2. Create a new cron job:
   - **URL:** `https://herguardian-backend.onrender.com/api/opportunities/refresh`
   - **Method:** POST
   - **Headers:** Add `x-cron-secret` with your `CRON_SECRET` value
   - **Schedule:** Every 4 hours
3. Save and activate the job

---

## Post-Deployment Checklist

### Frontend
- [ ] Visit the Vercel URL and verify the app loads
- [ ] Check browser console for no `http://localhost` API calls
- [ ] Test navigation to all pages (SPA routing should work on refresh)

### Backend
- [ ] Check Render logs: confirm MongoDB connection successful
- [ ] Visit `/api/health` endpoint (should return 200)
- [ ] Test user registration and login
- [ ] Test password reset flow (requires SMTP configured)

### Nutrition Bot
- [ ] Check Render logs: confirm service started
- [ ] Visit `/api/health` endpoint (should return 200)
- [ ] Test Nutrition AI feature in Wellness Hub

### Integration
- [ ] Test cross-service calls (frontend → backend, frontend → nutrition bot)
- [ ] Verify CORS is working correctly
- [ ] Test all main user flows

---

## Important Notes

### Render Free Tier
- Free services sleep after 15 minutes of inactivity
- First request after sleep may take 30-60 seconds to cold-start
- This is normal behavior on the free tier

### Security
- Never commit `.env` files or API keys
- Use strong, unique secrets for `JWT_SECRET`, `FLASK_SECRET_KEY`, and `CRON_SECRET`
- Rotate credentials periodically
- Enable MongoDB Atlas IP whitelisting (use `0.0.0.0/0` for Render free)

### Troubleshooting

**Frontend shows localhost API calls:**
- Re-deploy Vercel with correct `VITE_API_BASE_URL` set before build

**Backend cannot connect to MongoDB:**
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP access list includes `0.0.0.0/0`

**Email sending fails:**
- Test SMTP credentials locally first
- For Gmail, use an App Password (not your regular password)
- Verify `SMTP_SECURE` matches your port (`true` for 465, `false` for 587)

**CORS errors:**
- Verify `FRONTEND_URL` in backend matches your Vercel URL
- Verify `CORS_ORIGINS` in nutrition bot includes your Vercel URL

---

## Local Development

```bash
# Frontend
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173

# Backend
cd backend
npm install
npm start  # Runs on http://localhost:5000

# Nutrition Bot
cd "nutrition bot"
pip install -r requirements.txt
python app.py  # Runs on http://localhost:5001
```

Use the `.env.example` files in each directory as templates for local environment variables.
