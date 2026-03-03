"""
evaluate_model.py  ─  Full Evaluation Suite
=============================================
CropShield AI | Per-class F1, Confusion Matrix, Recall, Overfitting check
"""

import os, json
import numpy as np
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
import tensorflow as tf
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import (
    classification_report, confusion_matrix,
    f1_score, recall_score
)

# ─── Config ──────────────────────────────────────────────────────────────────
IMG_SIZE   = 224
BATCH_SIZE = 32
VAL_DIR    = os.path.join("dataset_merged", "Validation")
MODEL_PATH = "model/crop_disease_model_fixed.h5"
INDEX_PATH = "model/class_indices.json"


def load_class_names():
    with open(INDEX_PATH) as f:
        d = json.load(f)
    names = [""] * len(d)
    for k, v in d.items():
        names[int(k)] = v
    return names


def build_val_gen():
    datagen = ImageDataGenerator(preprocessing_function=preprocess_input)
    return datagen.flow_from_directory(
        VAL_DIR, target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE, class_mode="categorical", shuffle=False
    )


def run_evaluation(model, gen, class_names):
    print("\nRunning inference on validation set...")
    preds  = model.predict(gen, verbose=1)
    y_pred = np.argmax(preds, axis=1)
    y_true = gen.classes

    # ── Summary metrics ──
    acc     = np.mean(y_pred == y_true)
    macro_f1 = f1_score(y_true, y_pred, average="macro")
    wtd_f1  = f1_score(y_true, y_pred, average="weighted")

    print(f"\n{'═'*60}")
    print(f"  EVALUATION RESULTS")
    print(f"{'═'*60}")
    print(f"  Accuracy:          {acc*100:.2f}%")
    print(f"  Macro F1:          {macro_f1*100:.2f}%")
    print(f"  Weighted F1:       {wtd_f1*100:.2f}%")

    # ── Per-class report ──
    print(f"\n{'Per-Class Classification Report':^60}")
    print(classification_report(y_true, y_pred, target_names=class_names, digits=3))

    # ── Confidence analysis ──
    max_probs = np.max(preds, axis=1)
    correct   = max_probs[y_pred == y_true]
    incorrect = max_probs[y_pred != y_true]
    print(f"  Mean confidence (correct):    {correct.mean()*100:.1f}%")
    print(f"  Mean confidence (incorrect):  {incorrect.mean()*100:.1f}%")

    # ── Overfitting detection ──
    try:
        import pandas as pd
        if os.path.exists("model/history_phase1.csv"):
            p1 = pd.read_csv("model/history_phase1.csv")
            p2 = pd.read_csv("model/history_phase2.csv") if os.path.exists("model/history_phase2.csv") else p1
            last_train = max(p2["accuracy"].iloc[-1], p1["accuracy"].iloc[-1])
            gap = last_train - acc
            if gap > 0.15:
                print(f"\n  ⚠️  Overfitting detected: Train {last_train*100:.1f}% vs Val {acc*100:.1f}% (gap={gap*100:.1f}%)")
            else:
                print(f"\n  ✅ Good generalization: Train/Val gap = {gap*100:.1f}%")
    except Exception:
        pass

    # ── Flag low-recall classes ──
    recalls = recall_score(y_true, y_pred, average=None)
    low = [(class_names[i], recalls[i]) for i in range(len(class_names)) if recalls[i] < 0.5]
    if low:
        print(f"\n  ⚠️  Classes with Recall < 50%:")
        for name, r in sorted(low, key=lambda x: x[1]):
            print(f"     {name:<35}  recall={r:.2f}")
    else:
        print("\n  ✅ All classes: Recall ≥ 50%")

    return y_true, y_pred, preds


def plot_confusion_matrix(y_true, y_pred, class_names):
    cm      = confusion_matrix(y_true, y_pred)
    cm_norm = cm.astype(float) / cm.sum(axis=1, keepdims=True)
    fig, ax = plt.subplots(figsize=(12, 10))
    import seaborn as sns
    sns.heatmap(cm_norm, annot=True, fmt=".2f", cmap="Blues",
                xticklabels=class_names, yticklabels=class_names, ax=ax)
    ax.set_xlabel("Predicted"); ax.set_ylabel("Actual")
    ax.set_title("Normalized Confusion Matrix")
    plt.xticks(rotation=45, ha="right", fontsize=9)
    plt.yticks(rotation=0, fontsize=9)
    plt.tight_layout()
    plt.savefig("model/confusion_matrix.png", dpi=150)
    print("✅ Confusion matrix → model/confusion_matrix.png")


def plot_per_class_f1(y_true, y_pred, class_names):
    f1s        = f1_score(y_true, y_pred, average=None)
    sorted_idx = np.argsort(f1s)
    colors     = ["#e74c3c" if f1s[i] < 0.5 else "#f39c12" if f1s[i] < 0.7 else "#27ae60" for i in sorted_idx]
    fig, ax    = plt.subplots(figsize=(8, 10))
    ax.barh([class_names[i] for i in sorted_idx], f1s[sorted_idx], color=colors)
    ax.axvline(0.5, color="red",    linestyle="--", label="F1=0.50")
    ax.axvline(0.7, color="orange", linestyle="--", label="F1=0.70")
    ax.set_xlabel("F1 Score"); ax.set_title("Per-Class F1 Score")
    ax.legend(); plt.tight_layout()
    plt.savefig("model/per_class_f1.png", dpi=150)
    print("✅ Per-class F1 chart → model/per_class_f1.png")


if __name__ == "__main__":
    try:
        import seaborn, pandas
    except ImportError:
        os.system("pip install seaborn pandas -q")

    print("Loading model...")
    model       = tf.keras.models.load_model(
        MODEL_PATH,
        compile=False   # Loss function is custom (focal), skip recompile
    )
    class_names = load_class_names()
    gen         = build_val_gen()

    y_true, y_pred, preds = run_evaluation(model, gen, class_names)
    plot_confusion_matrix(y_true, y_pred, class_names)
    plot_per_class_f1(y_true, y_pred, class_names)

    print("\n🎉 Evaluation complete! Check model/ folder.")
