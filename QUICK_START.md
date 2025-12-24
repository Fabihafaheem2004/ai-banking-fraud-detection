# Quick Start Guide

## Local Development (5 minutes)

### 1. Start Flask API
```bash
cd H:\Development\bankingfraud\Model
pip install -r requirements.txt
python api.py
```
✅ API runs on `http://localhost:5000`

### 2. Start Next.js Frontend
```bash
cd H:\Development\bankingfraud\Frontend
npm install
npm run dev
```
✅ Frontend runs on `http://localhost:3000`

### 3. Test It
1. Open http://localhost:3000/upload
2. Upload a CSV or Excel file with transaction data
3. See predictions instantly!

---

## Production Deployment (30 minutes)

### Backend (Flask API)

**Option A: Render (Recommended)**
1. Push Model folder to GitHub
2. Go to https://render.com → New Web Service
3. Connect GitHub repo
4. Set Start Command: `python api.py`
5. Deploy! Get URL like: `https://your-app.onrender.com`

**Option B: Railway**
1. Push Model folder to GitHub
2. Go to https://railway.app → New Project
3. Connect GitHub repo
4. Railway auto-detects and deploys
5. Get URL from Railway dashboard

### Frontend (Next.js)

1. Update `Frontend/.env.local`:
```env
NEXT_PUBLIC_STREAMLIT_URL=https://your-api.onrender.com
```

2. Push Frontend folder to GitHub

3. Go to https://vercel.com → Add Project
4. Import GitHub repo
5. Add environment variable: `NEXT_PUBLIC_STREAMLIT_URL`
6. Deploy! Get URL like: `https://your-app.vercel.app`

---

## File Structure

```
bankingfraud/
├── Model/
│   ├── model.pkl              # Your trained model
│   ├── api.py                 # Flask API (NEW!)
│   ├── app.py                 # Streamlit UI
│   ├── requirements.txt        # Dependencies
│   └── README.md
│
├── Frontend/
│   ├── app/
│   │   ├── upload/page.tsx    # Upload page (UPDATED!)
│   │   └── api/predict/route.ts  # API route (NEW!)
│   ├── .env.local             # Config (NEW!)
│   ├── package.json
│   └── ...
│
├── DEPLOYMENT_GUIDE.md        # Detailed guide
└── QUICK_START.md             # This file
```

---

## API Endpoints

### Health Check
```bash
curl http://localhost:5000/health
```

### Upload & Predict
```bash
curl -X POST -F "file=@data.csv" http://localhost:5000/api/v1/predict
```

### Batch Predict
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"data": [{"col1": 1, "col2": 2}]}' \
  http://localhost:5000/api/v1/predict/batch
```

---

## What's New?

✅ **Flask API** (`api.py`) - Exposes your model via REST endpoints
✅ **Next.js API Route** (`app/api/predict/route.ts`) - Proxies requests to Flask
✅ **Updated Upload Page** - Now actually processes files and shows predictions
✅ **Environment Config** - `.env.local` for API URL configuration
✅ **Deployment Guides** - Complete instructions for production

---

## Expected Flow

1. User uploads CSV/Excel on Next.js frontend
2. Frontend sends file to Next.js API route
3. Next.js API route forwards to Flask backend
4. Flask loads model and makes predictions
5. Results returned to frontend
6. User sees predictions and can download CSV

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot POST /api/predict" | Make sure Flask is running on port 5000 |
| "Failed to connect" | Check `.env.local` has correct API URL |
| "Model not found" | Ensure `model.pkl` is in Model directory |
| "File format error" | Upload CSV or Excel only |

---

## Next: See DEPLOYMENT_GUIDE.md for detailed production setup
