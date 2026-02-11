import tensorflow as tf
import numpy as np
from PIL import Image
import io

# Load trained model
model = tf.keras.models.load_model("model/crop_disease_model.h5")

# IMPORTANT: class names must match folder order
CLASS_NAMES = [
    "Potato___Late_blight",
    "Potato___Healthy",
    "Tomato___Early_blight",
    "Tomato___Healthy"
]

def predict_image(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).resize((224, 224))
    img = np.array(img) / 255.0

    if img.shape[-1] == 4:  # RGBA to RGB
        img = img[..., :3]

    img = np.expand_dims(img, axis=0)

    preds = model.predict(img)
    idx = np.argmax(preds)

    return {
        "disease": CLASS_NAMES[idx],
        "confidence": float(preds[0][idx])
    }
