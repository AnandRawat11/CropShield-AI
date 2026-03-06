"""
predict.py  ─  Production Inference API
=========================================
CropShield AI | EfficientNetB3 46-class crop disease classifier
"""

import tensorflow as tf
import numpy as np
from PIL import Image, ImageEnhance
import io
import json
import os
from tensorflow.keras.applications.efficientnet import preprocess_input

# ─── Config ──────────────────────────────────────────────────────────────────
IMG_SIZE           = 224     # EfficientNetB0 trained at 224x224
MODEL_PATH         = "model/crop_disease_model_fixed.h5"
INDEX_PATH         = "model/class_indices.json"

# Confidence threshold: if the model's top prediction is below this,
# we return "Unknown / Unclear" instead of a potentially wrong label.
#
# WHY we removed MobileNetV2 is_plant() gate:
# ─────────────────────────────────────────────
# 1. A diseased leaf can look NOTHING like a clean fruit/vegetable.
#    MobileNetV2 trained on ImageNet would often reject valid diseased
#    leaves as "not a plant", blocking correct disease diagnosis.
# 2. The softmax probability distribution of our 46-class model is
#    already a reliable proxy for "is this a recognizable crop image?"
#    If the model has <30% confidence in ANY of its 46 classes, the
#    image is likely not a crop leaf.
# 3. This removes a full 224x224 MobileNetV2 forward pass on every
#    inference, cutting latency roughly in half.
CONFIDENCE_THRESHOLD = 0.15  # Lowered from 0.30 to reduce false rejections

# ─── Load Model & Class Names ─────────────────────────────────────────────────
print("Loading EfficientNetB0 disease model...")
model = tf.keras.models.load_model(MODEL_PATH, compile=False)


def load_class_names():
    try:
        with open(INDEX_PATH, "r") as f:
            class_dict = json.load(f)
        num_classes = len(class_dict)
        class_names = [""] * num_classes
        for idx_str, name in class_dict.items():
            class_names[int(idx_str)] = name
        print(f"✅ Loaded {num_classes} class names from {INDEX_PATH}")
        return class_names
    except Exception as e:
        print(f"❌ Error loading class_indices.json: {e}")
        raise

CLASS_NAMES = load_class_names()

# ─── Preprocessing ────────────────────────────────────────────────────────────
def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Preprocess raw image bytes for EfficientNetB3 inference.
    Applies the same preprocessing as training (preprocess_input),
    NOT simple /255 rescaling.
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Auto-enhance contrast slightly for low-quality farm photos
    # This helps when farmers upload phone photos with poor exposure
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.2)

    img = img.resize((IMG_SIZE, IMG_SIZE), Image.LANCZOS)
    arr = np.array(img, dtype=np.float32)
    arr = preprocess_input(arr)          # EfficientNet normalization
    return np.expand_dims(arr, axis=0)   # (1, 300, 300, 3)

# ─── Inference ────────────────────────────────────────────────────────────────
def predict_image(image_bytes: bytes) -> dict:
    """
    Run disease classification on raw image bytes.

    Returns a dict with:
        disease    (str)  - predicted class name, or "Unknown / Unclear"
        confidence (float) - max softmax probability
        is_plant   (bool)  - True if above confidence threshold
        top5       (list)  - top 5 (class, confidence) pairs for debugging
    """
    try:
        img_tensor = preprocess_image(image_bytes)
    except Exception as e:
        print(f"❌ Image preprocessing failed: {e}")
        return {
            "disease":    "Image Processing Error",
            "confidence": 0.0,
            "is_plant":   False,
            "top5":       []
        }

    # Run the EfficientNetB3 model
    preds      = model.predict(img_tensor, verbose=0)
    probs      = preds[0]                          # shape: (num_classes,)
    top5_idx   = np.argsort(probs)[::-1][:5]
    confidence = float(probs[top5_idx[0]])
    top5       = [(CLASS_NAMES[i], float(probs[i])) for i in top5_idx]

    print(f"Top 5 predictions: {[(name, f'{conf:.3f}') for name, conf in top5]}")
    print(f"Top prediction: {CLASS_NAMES[top5_idx[0]]} ({confidence:.3f})")

    # ── Confidence gate (replaces MobileNetV2 plant detector) ──
    if confidence < CONFIDENCE_THRESHOLD:
        print(f"⚠️  Low confidence ({confidence:.3f} < {CONFIDENCE_THRESHOLD}) → Unknown")
        return {
            "disease":    "Unknown / Unclear",
            "confidence": confidence,
            "is_plant":   False,
            "top5":       top5
        }

    disease_name = CLASS_NAMES[top5_idx[0]]

    # Determine severity from disease name keywords
    severity = classify_severity(disease_name)

    return {
        "disease":    disease_name,
        "confidence": confidence,
        "is_plant":   True,
        "severity":   severity,
        "top5":       top5
    }

# ─── Severity Helper ─────────────────────────────────────────────────────────
def classify_severity(disease_name: str) -> str:
    """
    Heuristic severity classification based on disease name keywords.
    The Gemini AI layer provides full treatment; this is just for the UI badge.
    """
    name_lower = disease_name.lower()

    if any(word in name_lower for word in ["healthy"]):
        return "None"

    high_severity_keywords = [
        "blight", "rot", "rust", "smut", "wilt", "blast",
        "bollworm", "armyworm", "borer", "mosaic", "tungro"
    ]
    if any(word in name_lower for word in high_severity_keywords):
        return "High"

    return "Medium"
