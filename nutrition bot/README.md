# 🥦 NutriBot — AI Nutrition Agent

**Powered by IBM Watsonx.ai · IBM Granite LLM · Flask · Bootstrap 5**

An AI-powered nutrition assistant with a beautiful responsive chat UI,
personalized meal planning, BMI calculator, calorie analyser, and family
diet support — all driven by IBM Granite large language models.

---

## ✨ Features

| Feature | Description |
|---|---|
| 💬 AI Chat | Free-form nutrition Q&A powered by IBM Granite |
| 📅 7-Day Meal Plans | Personalized plans based on your profile & goals |
| 🔥 Calorie Analyser | Instant macro & calorie breakdown for any meal |
| ❤️ BMI Calculator | BMI + AI health advice |
| 👨‍👩‍👧‍👦 Family Planner | Shared meal plans for all family members |
| 🌙 Dark Mode | System-aware dark/light theme |
| 🇮🇳 Indian Cuisine | Deep Indian food knowledge (dal, roti, idli, millet…) |

---

## 🚀 Quick Start

### 1. Clone / Download the project

```bash
git clone <your-repo-url>
cd my-nutrition-agent
```

### 2. Create a virtual environment & install dependencies

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configure IBM Watsonx.ai credentials

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
IBM_API_KEY=your_ibm_cloud_api_key
IBM_WATSONX_URL=https://us-south.ml.cloud.ibm.com
IBM_PROJECT_ID=your_watsonx_project_id
WATSONX_MODEL_ID=ibm/granite-3-3-8b-instruct
FLASK_SECRET_KEY=your-random-secret-string
```

#### How to get IBM Watsonx.ai credentials

1. Sign up at [IBM Cloud](https://cloud.ibm.com/registration)
2. Create a **Watsonx.ai** project at [watsonx.ai](https://dataplatform.cloud.ibm.com/wx/home)
3. Copy your **Project ID** from the project settings
4. Create an **IBM Cloud API Key**: Cloud → Manage → Access (IAM) → API Keys → Create
5. Note your regional URL (default: `https://us-south.ml.cloud.ibm.com`)

### 4. Run the app

```bash
python app.py
```

Open your browser at **http://localhost:5000**

---

## 🎛️ Customising Agent Behaviour

Open `app.py` and find the `AGENT_INSTRUCTIONS` block near the top.
Edit it to change:

- **Persona & tone** — friendly, clinical, strict, motivational
- **Diet specialisations** — add Ayurvedic, gluten-free, etc.
- **Indian food preferences** — add regional cuisines
- **Safety rules** — tighten or relax constraints
- **Response format** — length, use of tables, bullet style

```python
AGENT_INSTRUCTIONS = """
You are NutriBot, a warm, knowledgeable...
# ← Edit anything in here
"""
```

---

## 📁 Project Structure

```
├── app.py                  # Flask backend + agent logic + AGENT_INSTRUCTIONS
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable template
├── .env                    # Your real credentials (never commit this!)
├── templates/
│   └── index.html          # Single-page frontend
└── static/
    ├── css/
    │   └── style.css       # Custom styles (dark mode, animations)
    └── js/
        └── app.js          # All frontend interactivity
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Serve the web app |
| GET | `/api/health` | Check Watsonx.ai config status |
| POST | `/api/chat` | General AI nutrition chat |
| POST | `/api/nutrition-plan` | Generate a 7-day meal plan |
| POST | `/api/bmi` | Calculate BMI + AI advice |
| POST | `/api/meal-suggestion` | Quick single-meal suggestion |
| POST | `/api/family-plan` | Multi-member family nutrition plan |
| POST | `/api/calorie-analysis` | Analyse calorie & macros for a meal |
| POST | `/api/clear-history` | Clear chat session history |

---

## ☁️ Deployment

### Option A — Gunicorn (Linux/macOS production)

```bash
gunicorn -w 4 -b 0.0.0.0:8080 app:app
```

### Option B — IBM Code Engine / Cloud Run

1. Create a `Procfile`:
   ```
   web: gunicorn -w 2 -b 0.0.0.0:$PORT app:app
   ```
2. Set environment variables in your cloud platform's secrets/env config
   (do **not** upload your `.env` file)
3. Deploy with your platform CLI

### Option C — Docker

Create `Dockerfile`:

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5000", "app:app"]
```

Build & run:
```bash
docker build -t nutribot .
docker run -p 5000:5000 --env-file .env nutribot
```

---

## 🔒 Security Notes

- Your `.env` file contains secrets — it is listed in `.gitignore` and must **never** be committed
- The `FLASK_SECRET_KEY` protects session data — use a long random string in production
- The app never logs or stores API keys

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| `⚠️ IBM Watsonx.ai is not configured` | Check `.env` has `IBM_API_KEY` and `IBM_PROJECT_ID` |
| `HTTP 401 Unauthorized` | API key expired or incorrect — regenerate on IBM Cloud |
| `HTTP 403 Forbidden` | Project ID mismatch or user lacks Watsonx.ai role |
| Model not found | Check `WATSONX_MODEL_ID` in `.env` — use `ibm/granite-3-3-8b-instruct` |
| Port already in use | Change `FLASK_PORT=5001` in `.env` |

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `flask` | Web framework |
| `python-dotenv` | Load `.env` variables |
| `ibm-watsonx-ai` | Official IBM Watsonx.ai SDK |
| `gunicorn` | Production WSGI server |

---

## 📄 License

MIT — feel free to use, modify, and distribute.

---

*Made with ❤️ using IBM Watsonx.ai · Granite LLM · Flask · Bootstrap 5*
