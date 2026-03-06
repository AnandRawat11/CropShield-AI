from fastapi import FastAPI, UploadFile, File
from predict import predict_image

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Real AI Model API running"}

@app.get("/health")
def health():
    return {"status": "ML service running"}

@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    image_bytes = await image.read()
    result = predict_image(image_bytes)

    return {
        "disease": result["disease"],
        "confidence": round(result["confidence"], 3),
        "severity": "Medium"
    }
