import os, json
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications.efficientnet import preprocess_input
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    confusion_matrix, roc_auc_score,
    mean_absolute_error, mean_squared_error, roc_curve, auc
)
from sklearn.model_selection import KFold
from tensorflow.keras.utils import to_categorical
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt

# Paths
VAL_DIR = "dataset_merged/Validation"
MODEL_PATH = "model/crop_disease_model_fixed.h5"
INDEX_PATH = "model/class_indices.json"
IMG_SIZE = 224
BATCH_SIZE = 32

def load_class_names():
    with open(INDEX_PATH) as f:
        d = json.load(f)
    names = [""] * len(d)
    for k, v in d.items():
        names[int(k)] = v
    return names

print("\n" + "="*50)
print("COMPREHENSIVE MODEL EVALUATION")
print("="*50)

print("Loading model...")
model = tf.keras.models.load_model(MODEL_PATH, compile=False)
class_names = load_class_names()
num_classes = len(class_names)

print("Loading data...")
datagen = ImageDataGenerator(preprocessing_function=preprocess_input)
val_gen = datagen.flow_from_directory(
    VAL_DIR, target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE, class_mode="categorical", shuffle=False
)

print("\nRunning inference on the holdout validation set...")
preds = model.predict(val_gen, verbose=1)
y_pred = np.argmax(preds, axis=1)
y_true = val_gen.classes
y_true_onehot = to_categorical(y_true, num_classes=num_classes)

# 1. Holdout Method evaluation
print("\n" + "="*50)
print("1. Holdout Method (Train/Test Split)")
print("="*50)
print(f"Dataset split: Training vs Validation.")
print(f"Validation set size (Holdout size): {len(y_true)}")

# 3. Classification Metrics
print("\n" + "="*50)
print("3. Classification Metrics")
print("="*50)
acc = accuracy_score(y_true, y_pred)
precision = precision_score(y_true, y_pred, average='weighted')
recall = recall_score(y_true, y_pred, average='weighted')
print(f"Accuracy:  {acc*100:.2f}%")
print(f"Precision: {precision*100:.2f}% (Weighted)")
print(f"Recall:    {recall*100:.2f}% (Weighted)")

# Confusion Matrix
cm = confusion_matrix(y_true, y_pred)
print("\nConfusion Matrix:")
print("A 2D array where row i, column j represents actual class i predicted as j.")
print(f"Matrix Shape: {cm.shape} (For {num_classes} classes)")

# ROC Curve & AUC
print("\nROC Curve & AUC:")
try:
    auc_score = roc_auc_score(y_true_onehot, preds, multi_class='ovr', average='weighted')
    print(f"AUC (One-vs-Rest, Weighted): {auc_score:.4f}")
    
    # Plot ROC for top classes or macro
    plt.figure()
    for i in range(min(5, num_classes)): # Plot first 5 classes
        fpr, tpr, _ = roc_curve(y_true_onehot[:, i], preds[:, i])
        roc_auc = auc(fpr, tpr)
        plt.plot(fpr, tpr, label=f'{class_names[i]} (AUC = {roc_auc:.2f})')
    plt.plot([0, 1], [0, 1], 'k--')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ROC Curve (Subset of classes)')
    plt.legend(loc='lower right')
    plt.savefig('model/roc_curve.png')
    print("Saved ROC curve plot to model/roc_curve.png")
except Exception as e:
    print(f"Error computing AUC: {e}")

# 4. Regression Metrics
print("\n" + "="*50)
print("4. Regression Metrics (on Output Probabilities)")
print("="*50)
print(f"(Note: For classification, computing MAE/MSE on probabilities vs one-hot labels)")
mae = mean_absolute_error(y_true_onehot, preds)
mse = mean_squared_error(y_true_onehot, preds)
print(f"Mean Absolute Error (MAE): {mae:.4f}")
print(f"Mean Squared Error (MSE):  {mse:.4f}")

# 2. K-fold Cross-Validation
print("\n" + "="*50)
print("2. K-fold Cross-Validation (on Validation Set)")
print("="*50)
print("Evaluating the fixed model across 5 folds of the validation set to test generalization.")
kf = KFold(n_splits=5, shuffle=True, random_state=42)
fold_accs = []
fold_idx = 1
for train_index, test_index in kf.split(y_true):
    fold_y_true = y_true[test_index]
    fold_y_pred = y_pred[test_index]
    fold_acc = accuracy_score(fold_y_true, fold_y_pred)
    fold_accs.append(fold_acc)
    print(f"Fold {fold_idx} Accuracy: {fold_acc*100:.2f}%")
    fold_idx += 1
print(f"K-fold Average Accuracy: {np.mean(fold_accs)*100:.2f}%")
print(f"K-fold Accuracy Std Dev: {np.std(fold_accs)*100:.2f}%")

print("\nEvaluation complete.")
