🌾 CropShield AI – Crop Disease Detection System

AI-powered web application that detects crop diseases from leaf images and provides treatment recommendations using deep learning.

⸻

🔍 Overview

CropShield AI is a full-stack AI system built to assist farmers and agricultural stakeholders in early disease detection. The platform classifies leaf images into 17 disease/healthy categories across 5 major crops and returns actionable treatment suggestions.

⸻

🧠 Key Highlights
	•	17-class image classification model
	•	Supports Corn, Potato, Rice, Wheat, Sugarcane
	•	Deep learning-based prediction with confidence score
	•	REST API architecture
	•	Secure user authentication (JWT)
	•	Cloud-ready deployment structure

⸻

🛠 Tech Stack

Frontend: React, Vite, Tailwind CSS
Backend: Node.js, Express.js, MongoDB
AI Service: Python, FastAPI, TensorFlow

⸻

📊 Dataset

Trained on labeled RGB leaf images across:
	•	Corn (Rust, Leaf Spot, Blight, Healthy)
	•	Potato (Early/Late Blight, Healthy)
	•	Rice (Brown Spot, Blast variants, Healthy)
	•	Wheat (Rust variants, Healthy)
	•	Sugarcane (Red Rot, Bacterial Blight, Healthy)

Total Classes: 17

⸻

🚀 How It Works
	1.	User uploads leaf image
	2.	Image sent to AI microservice
	3.	Model predicts disease class
	4.	Backend returns diagnosis + treatment recommendation

⸻

📌 Future Scope
	•	Mobile application
	•	Real-time field integration
	•	Model retraining with live agricultural data
	•	Multi-language support

⸻
Guide to run this application locally
Step-by-Step Windows Setup
Prerequisites — Install these first
Node.js 20+ — download the Windows installer
Python 3.11 — ✅ check "Add to PATH" during install
MongoDB Community — install and start the service
Git for Windows (optional but helpful)
Step 1 — Extract the ZIP
Extract it anywhere, e.g. C:\CropShield-AI\

Step 2 — Create the .env file
Inside C:\CropShield-AI\server\ create a new file called .env (no extension):

```env
MONGO_URI=mongodb://127.0.0.1:27017/cropshield
JWT_SECRET=your_random_jwt_secret_here
PORT=5001
CLOUDINARY_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GEMINI_API_KEY=your_gemini_api_key
```

> 💡 Get your keys from:
> - **Cloudinary:** [cloudinary.com](https://cloudinary.com) → Dashboard
> - **Gemini:** [aistudio.google.com](https://aistudio.google.com) → Get API Key

Step 3 — Copy the Model File
Copy crop_disease_model_fixed.h5 and class_indices.json from your Mac to the Windows laptop into:

C:\CropShield-AI\ai-api\model\
You can transfer via USB drive, Google Drive, or AirDrop to an Android phone then to PC.

Step 4 — Install Node.js dependencies
Open Command Prompt or PowerShell:

cmd
cd C:\CropShield-AI\server
npm install
cd C:\CropShield-AI\client
npm install
Step 5 — Set up Python virtual environment
cmd
cd C:\CropShield-AI\ai-api
python -m venv venv
venv\Scripts\activate
pip install tensorflow fastapi uvicorn python-multipart pillow
Step 6 — Run all 3 services (open 3 separate terminal windows)
Terminal 1 — Python ML API:

cmd
cd C:\CropShield-AI\ai-api
venv\Scripts\activate
uvicorn app:app --reload --port 8000
Terminal 2 — Node.js Backend:

cmd
cd C:\CropShield-AI\server
node server.js
Terminal 3 — React Frontend:

cmd
cd C:\CropShield-AI\client
npm run dev
Step 7 — Open the App
Go to http://localhost:5173 in your browser.

⚠️ Note: start_all.sh is a Mac/Linux bash script and won't work on Windows. Use the 3 separate terminal commands above instead. If you want a Windows equivalent, I can create a start_all.bat batch file for you.

create a start_all.bat batch file

Created
+53
-0
Done! Created 

start_all.bat
 at the root of the project. Here's what it does:

✅ Auto-starts MongoDB — checks if it's running, starts it if not
✅ Opens 3 separate named terminal windows — one for each service, so you can see logs independently
✅ Uses %~dp0 — works from any folder path, no hardcoded C:\ needed
✅ Shows a summary with all URLs after launching
How to use on Windows:

Double-click start_all.bat
Wait ~10 seconds for all services to boot
Open http://localhost:5173
👨‍💻 Author

Anand Rawat
B.Tech CSE (AI & Data Science)
