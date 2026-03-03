# 🌾 CropShield AI — Crop Disease Detection System

> An AI-powered web application that detects crop diseases from leaf images and provides actionable treatment recommendations using deep learning.

![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20Python%20%7C%20TensorFlow-green)
![Model](https://img.shields.io/badge/Model-EfficientNetB0%20%7C%2096.77%25%20Accuracy-blue)
![Classes](https://img.shields.io/badge/Classes-14%20Superclasses-orange)

---

## 📖 Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Model Performance](#model-performance)
- [Project Structure](#project-structure)
- [Local Setup (Windows)](#local-setup-windows)
- [Local Setup (Mac/Linux)](#local-setup-maclinux)
- [Environment Variables](#environment-variables)
- [Dataset](#dataset)
- [Future Scope](#future-scope)

---

## 🔍 Overview

CropShield AI uses a two-layer AI pipeline:

1. **EfficientNetB0 ML Model** — classifies the leaf image into one of 14 crop disease superclasses with 96.77% validation accuracy
2. **Google Gemini Vision** — verifies the ML result visually and generates a detailed treatment plan (organic, chemical, prevention)

**Supported Crops:** Cotton · Wheat · Rice · Maize · Sugarcane · Tomato · Potato

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express.js, MongoDB, JWT Auth |
| **ML API** | Python, FastAPI, TensorFlow / Keras |
| **AI** | Google Gemini 2.5 Flash (Vision) |
| **Storage** | Cloudinary (image uploads) |

---

## 📊 Model Performance

| Metric | Score |
|---|---|
| Validation Accuracy | **96.77%** |
| Macro F1 Score | **91.80%** |
| Weighted F1 Score | **96.73%** |

**Architecture:** EfficientNetB0 (pretrained ImageNet) + custom classification head  
**Training:** 2-phase fine-tuning with Focal Loss, AdamW, EarlyStopping, and balanced class weights  
**Dataset:** 19,000+ images merged into 14 biological superclasses

---

## � Project Structure

```
CropShield-AI/
├── client/          # React frontend (Vite)
├── server/          # Node.js + Express backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── services/    # Gemini AI integration
├── ai-api/          # Python FastAPI ML microservice
│   ├── app.py
│   ├── predict.py
│   ├── train_model.py
│   ├── evaluate_model.py
│   ├── restructure_dataset.py
│   └── model/       # .h5 model + class_indices.json
├── start_all.bat    # Windows launcher
└── start_all.sh     # Mac/Linux launcher
```

---

## 💻 Local Setup (Windows)

### Prerequisites
- [Node.js 20+](https://nodejs.org)
- [Python 3.11](https://python.org/downloads) — check ✅ **"Add to PATH"**
- [MongoDB Community](https://www.mongodb.com/try/download/community)

### Steps

**1. Extract the project ZIP** anywhere, e.g. `C:\CropShield-AI\`

**2. Create `server/.env`** — see [Environment Variables](#environment-variables)

**3. Copy the model files** into `ai-api/model/`:
- `crop_disease_model_fixed.h5`
- `class_indices.json`

**4. Install dependencies**
```cmd
cd C:\CropShield-AI\server && npm install
cd C:\CropShield-AI\client && npm install
```

**5. Set up Python environment**
```cmd
cd C:\CropShield-AI\ai-api
python -m venv venv
venv\Scripts\activate
pip install tensorflow fastapi uvicorn python-multipart pillow
```

**6. Launch everything**

Double-click `start_all.bat` — it opens 3 terminal windows automatically.

Or manually in 3 separate terminals:
```cmd
# Terminal 1 – ML API
cd ai-api && venv\Scripts\activate && uvicorn app:app --reload --port 8000

# Terminal 2 – Backend
cd server && node server.js

# Terminal 3 – Frontend
cd client && npm run dev
```

**7. Open** → [http://localhost:5173](http://localhost:5173)

---

## 🍎 Local Setup (Mac/Linux)

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Python setup
cd ../ai-api
python3 -m venv venv
source venv/bin/activate
pip install tensorflow fastapi uvicorn python-multipart pillow

# Start everything
cd ..
chmod +x start_all.sh && ./start_all.sh
```

---

## 🔑 Environment Variables

Create a file at `server/.env`:

```env
# Database
MONGO_URI=mongodb://127.0.0.1:27017/cropshield

# Auth
JWT_SECRET=your_random_jwt_secret_here
PORT=5001

# Cloudinary (image storage) — get from cloudinary.com/console
CLOUDINARY_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google Gemini AI — get from aistudio.google.com
GEMINI_API_KEY=your_gemini_api_key
```

> ⚠️ Never commit real API keys to GitHub. The `.env` file is in `.gitignore`.

---

## 📦 Dataset

The dataset is **not included** in this repository (too large for GitHub).

- 19,000+ labeled leaf images
- 46 original classes merged into **14 biological superclasses**

> 📥 Download link will be added soon (Kaggle).

To retrain the model yourself:
```bash
cd ai-api
python restructure_dataset.py   # Merge 46 → 14 superclasses
python train_model.py           # Train EfficientNetB0
python evaluate_model.py        # Evaluate + generate charts
```

---

## 🔮 Future Scope

- 📱 Mobile application (React Native)
- 🌦️ Disease spread prediction using weather APIs
- 🗺️ Region-wise outbreak heatmap
- 💰 Cost-to-treat vs crop loss prediction
- 🌍 Multi-language support for rural farmers

---

## 👨‍💻 Author

**Anand Rawat**  
B.Tech CSE (AI & Data Science)

[![GitHub](https://img.shields.io/badge/GitHub-AnandRawat11-black?logo=github)](https://github.com/AnandRawat11)
