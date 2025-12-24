# Banking Fraud Detection - Deployment Guide

## Architecture Overview

Your application uses a **two-tier deployment strategy**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel (Next.js Frontend)                │
│  https://your-app.vercel.app                                │
│  - React UI for file upload                                 │
│  - File upload interface                                    │
│  - Results display & download                               │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP Requests
                       │
┌──────────────────────▼──────────────────────────────────────┐
│         Streamlit Cloud (Python Backend)                    │
│  https://your-app.streamlit.app                             │
│  - Flask API (port 5000)                                    │
│  - Model predictions                                        │
│  - File processing                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 1: Deploy Flask API to Streamlit Cloud

### Step 1: Prepare Your Model Directory

Your `H:\Development\bankingfraud\Model\` directory should contain:
```
Model/
├── model.pkl              # Your trained model
├── api.py                 # Flask API (NEW)
├── app.py                 # Streamlit UI (optional)
├── requirements.txt       # Dependencies
└── README.md              # Documentation
```

### Step 2: Create a Procfile (for Streamlit Cloud)

Create a file named `Procfile` in your Model directory:

```
web: python api.py
```

This tells Streamlit Cloud to run your Flask API instead of the Streamlit app.

### Step 3: Push to GitHub

1. Initialize git in your Model directory:
```bash
cd H:\Development\bankingfraud\Model
git init
git add .
git commit -m "Initial commit: Banking fraud model API"
```

2. Create a new repository on GitHub
3. Push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/banking-fraud-model.git
git branch -M main
git push -u origin main
```

### Step 4: Deploy to Render or Railway

Since Streamlit Cloud is primarily for Streamlit apps, use **Render** or **Railway** for Flask:

**Using Render:**
1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Set:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python api.py`
   - **Environment:** Python 3.9
5. Click "Create Web Service"
6. Your API will be available at: `https://your-app.onrender.com`

**Using Railway:**
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Railway auto-detects Python and runs `python api.py`
5. Your API will be available at the Railway URL

---

## Part 2: Deploy Next.js Frontend to Vercel

### Step 1: Update Environment Variables

In your `Frontend/.env.local`, update the API URL:

```env
# Production - replace with your deployed API URL
NEXT_PUBLIC_STREAMLIT_URL=https://your-api.onrender.com
```

### Step 2: Push Frontend to GitHub

```bash
cd H:\Development\bankingfraud\Frontend
git init
git add .
git commit -m "Initial commit: Banking fraud detection UI"
git remote add origin https://github.com/YOUR_USERNAME/banking-fraud-frontend.git
git push -u origin main
```

### Step 3: Deploy to Vercel

1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Set environment variables:
   - **NEXT_PUBLIC_STREAMLIT_URL:** `https://your-api.onrender.com`
5. Click "Deploy"
6. Your frontend will be available at: `https://your-app.vercel.app`

---

## Part 3: Local Development

### Run Everything Locally

**Terminal 1 - Flask API:**
```bash
cd H:\Development\bankingfraud\Model
pip install -r requirements.txt
python api.py
# API runs on http://localhost:5000
```

**Terminal 2 - Next.js Frontend:**
```bash
cd H:\Development\bankingfraud\Frontend
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

**Terminal 3 (Optional) - Streamlit UI:**
```bash
cd H:\Development\bankingfraud\Model
streamlit run app.py
# Streamlit runs on http://localhost:8501
```

---

## API Endpoints

### 1. Health Check
```
GET /health
Response: {"status": "ok", "message": "..."}
```

### 2. File Upload Prediction
```
POST /api/v1/predict
Content-Type: multipart/form-data

Request:
- file: (CSV or Excel file)

Response:
{
  "success": true,
  "data": [
    {
      "column1": value,
      "column2": value,
      "Fraud_Prediction": 0 or 1,
      "Prediction_Label": "Legitimate" or "Fraudulent"
    }
  ],
  "statistics": {
    "total_records": 100,
    "fraudulent_count": 5,
    "legitimate_count": 95,
    "fraud_percentage": 5.0
  }
}
```

### 3. Batch Prediction (JSON)
```
POST /api/v1/predict/batch
Content-Type: application/json

Request:
{
  "data": [
    {"feature1": value, "feature2": value, ...},
    {"feature1": value, "feature2": value, ...}
  ]
}

Response: Same as file upload
```

---

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_STREAMLIT_URL=https://your-api.onrender.com
```

### Backend (Render/Railway)
No special environment variables needed unless your model requires them.

---

## Troubleshooting

### "Failed to connect to prediction service"
- Check if Flask API is running
- Verify the API URL in `.env.local`
- Check CORS settings in `api.py`

### "Error making predictions"
- Ensure your CSV/Excel has the correct columns
- Check model.pkl is in the correct directory
- Verify model compatibility with your Python version

### "File upload fails"
- Check file size (max 100MB)
- Verify file format (CSV or Excel only)
- Check API logs for detailed error

---

## Monitoring & Logs

**Render:**
- Go to your service dashboard
- Click "Logs" tab to see real-time logs

**Railway:**
- Click your project
- View logs in the "Deployments" tab

**Vercel:**
- Go to your project dashboard
- Click "Deployments" → "View Logs"

---

## Cost Estimates

| Service | Free Tier | Cost |
|---------|-----------|------|
| Render | 750 hours/month | $7/month after |
| Railway | $5 credit/month | Pay-as-you-go |
| Vercel | Unlimited | Free for hobby |
| Streamlit Cloud | Unlimited | Free |

---

## Next Steps

1. ✅ Create GitHub repositories for both Model and Frontend
2. ✅ Deploy Flask API to Render/Railway
3. ✅ Update `.env.local` with deployed API URL
4. ✅ Deploy Next.js to Vercel
5. ✅ Test the complete flow end-to-end
6. ✅ Monitor logs and performance

---

## Support

For issues:
- Check API logs on Render/Railway
- Check frontend logs on Vercel
- Test API directly: `curl https://your-api.onrender.com/health`
- Test file upload: Use Postman or curl with multipart form data
