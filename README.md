# HerGuardian AI

A comprehensive women's safety and wellness platform providing AI-powered support for health, nutrition, mental well-being, legal rights, career opportunities, and emergency assistance.

## Features

### Core Modules
- **Wellness Hub** - Personal wellness tracker with daily check-ins, nutrition AI (powered by IBM Watsonx.ai), cycle tracking, fitness guidance, and mental wellness resources
- **Community & Rights** - Rights assistant, complaint builder, document decoder, eligibility navigator, trusted resources directory, and conversation helper
- **Digital Safety Analyzer** - AI-powered analysis of digital messages and screenshots for safety concerns
- **Footprint Scanner** - Analyze screenshots of digital footprints for potential risks
- **Career & Grants Opportunities** - Search for jobs, scholarships, and grants with personalized recommendations
- **Financial Coach** - Budget tracking, transaction management, and financial analytics
- **Emergency SOS** - Quick access to emergency contacts and safety resources
- **Health Reminders** - Set and manage health-related reminders

## Tech Stack

### Frontend
- React 18
- Vite
- React Router
- Framer Motion
- Recharts (data visualization)
- Lucide React (icons)
- React Hot Toast (notifications)
- Tesseract.js (OCR for screenshot analysis)

### Backend
- Node.js
- Express
- MongoDB (with Mongoose)
- JWT authentication
- Google Gemini AI (for AI features)
- IBM Watsonx.ai (via Nutrition Bot service)
- Nodemailer (email)

### Nutrition Bot (Flask)
- Flask
- IBM Watsonx.ai SDK
- Gunicorn (production WSGI server)

## Project Structure

```
HerGuardian Ai/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── layouts/        # Layout components
│   │   ├── services/       # API service layer
│   │   ├── data/           # Static data
│   │   └── routes/         # React Router configuration
│   ├── package.json
│   └── vercel.json
├── backend/                 # Node.js + Express backend
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── scripts/        # Utility scripts
│   │   ├── app.js          # Express app setup
│   │   └── server.js       # Server entry point
│   ├── package.json
│   └── .env.example
├── nutrition bot/           # Flask Nutrition AI service
│   ├── app.py             # Flask application
│   ├── requirements.txt
│   └── .env.example
├── docs/                   # Documentation
│   └── archive/           # Archived reports
├── render.yaml             # Render deployment config
├── DEPLOYMENT.md           # Deployment guide
└── README.md
```

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.8+
- MongoDB (local or Atlas)

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env  # Configure if needed
npm run dev
```

Frontend runs on `http://localhost:5173`

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env  # Configure with your values
npm start
```

Backend runs on `http://localhost:5000`

### Nutrition Bot Setup

```bash
cd "nutrition bot"
pip install -r requirements.txt
cp .env.example .env  # Configure with IBM credentials
python app.py
```

Nutrition Bot runs on `http://localhost:5001`

## Environment Variables

### Backend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for JWT token signing |
| `GEMINI_API_KEY` | Yes | Google Gemini AI API key |
| `FRONTEND_URL` | Yes | Frontend URL for CORS |
| `SMTP_HOST` | Yes | SMTP server host |
| `SMTP_PORT` | Yes | SMTP server port |
| `SMTP_USER` | Yes | SMTP username |
| `SMTP_PASS` | Yes | SMTP password |
| `SMTP_SECURE` | Yes | SMTP secure flag (`true`/`false`) |
| `FROM_NAME` | Yes | Email sender name |
| `FROM_EMAIL` | Yes | Email sender address |
| `ADZUNA_APP_ID` | No | Adzuna API ID |
| `ADZUNA_APP_KEY` | No | Adzuna API key |
| `JOOBLE_API_KEY` | No | Jooble API key |
| `RAPIDAPI_KEY` | No | RapidAPI key |
| `CRON_SECRET` | Yes | Secret for cron job authentication |

### Frontend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Backend API URL (e.g., `http://localhost:5000/api`) |
| `VITE_NUTRIBOT_API_BASE_URL` | No | Nutrition Bot URL (default: `http://localhost:5001`) |

### Nutrition Bot (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `IBM_API_KEY` | Yes | IBM Cloud API key |
| `IBM_WATSONX_URL` | Yes | Watsonx.ai URL |
| `IBM_PROJECT_ID` | Yes | IBM project ID |
| `WATSONX_MODEL_ID` | Yes | Model ID |
| `FLASK_SECRET_KEY` | Yes | Flask secret key |
| `FLASK_PORT` | No | Flask port (default: 5001) |
| `CORS_ORIGINS` | Yes | Comma-separated allowed origins |

## Deployment

### Frontend (Vercel)
- Build output: `dist/`
- SPA routing: All routes rewrite to `index.html`
- See `DEPLOYMENT.md` for detailed instructions

### Backend (Render)
- Runtime: Node.js
- Health check: `/api/health`
- See `DEPLOYMENT.md` for detailed instructions

### Nutrition Bot (Render)
- Runtime: Python
- Start command: `gunicorn app:app --bind 0.0.0.0:$PORT`
- Health check: `/api/health`
- See `DEPLOYMENT.md` for detailed instructions

## Important Notes

### Security
- Never commit `.env` files to version control
- Use strong, unique secrets for all sensitive variables
- Rotate credentials periodically
- Enable MongoDB Atlas IP whitelisting in production

### Performance
- Render free tier services sleep after inactivity (first request may be slow)
- The backend uses rate limiting (100 req/15min in production)

### Disclaimer

**The information provided by HerGuardian AI is for informational purposes only and is not intended as a substitute for professional medical, legal, or financial advice. Always seek the advice of qualified professionals regarding health, legal, or financial matters.**

- Legal content is based on publicly available information and may not reflect the latest legal developments
- Health and nutrition information is general and should not replace professional medical consultation
- Emergency services should be contacted directly in life-threatening situations

## License

To be determined.

## Contributing

This project is currently under active development. Contributions will be accepted after the initial release.

## Support

For deployment issues, see `DEPLOYMENT.md`. For bugs or feature requests, please open an issue in the repository.
