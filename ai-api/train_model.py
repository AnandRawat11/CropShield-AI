"""
train_model.py  ─  EfficientNetB0 + Focal Loss Production Pipeline
====================================================================
CropShield AI  |  Superclass crop disease classifier (8-12 classes)
"""

import os, json, numpy as np, tensorflow as tf
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from tensorflow.keras import layers, models, callbacks, optimizers
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.utils.class_weight import compute_class_weight

# ─── Config ─────────────────────────────────────────────────────────────────
IMG_SIZE        = 224          # EfficientNetB0 optimal input
BATCH_SIZE      = 32
PHASE1_EPOCHS   = 10           # Head training (base frozen)
PHASE2_EPOCHS   = 20           # Fine-tuning (top layers unfrozen)
UNFREEZE_PCT    = 0.30         # Unfreeze top 30% of base layers
PHASE1_LR       = 1e-3
PHASE2_LR       = 1e-5
TRAIN_DIR       = os.path.join("dataset_merged", "Train")
VAL_DIR         = os.path.join("dataset_merged", "Validation")
MODEL_PATH      = "model/crop_disease_model_fixed.h5"
INDEX_PATH      = "model/class_indices.json"


# ─── 1. Focal Loss ──────────────────────────────────────────────────────────
# WHY: Standard CrossEntropy treats all prediction errors equally.
# With class imbalance, the model gets flooded with easy examples from
# dominant classes. Focal Loss down-weights easy examples (where the model
# is already confident) and forces the model to focus on hard, rare classes.
# gamma=2.0 is standard; alpha balances foreground vs background.

def focal_loss(gamma: float = 2.0, alpha: float = 0.25):
    """
    Multi-class Focal Loss.
    gamma: focusing parameter. Higher = more focus on hard examples.
    alpha: class balance weight scalar.
    """
    def focal_loss_fn(y_true, y_pred):
        # Clip predictions to avoid log(0)
        y_pred = tf.clip_by_value(y_pred, 1e-8, 1.0)
        # Standard cross-entropy term
        ce     = -y_true * tf.math.log(y_pred)
        # Focal weight: down-weight easy examples
        weight = alpha * y_true * tf.pow(1.0 - y_pred, gamma)
        loss   = weight * ce
        return tf.reduce_mean(tf.reduce_sum(loss, axis=-1))
    return focal_loss_fn


# ─── 2. Augmentation (Biologically Realistic) ─────────────────────────────
# WHY: Leaf disease classification depends on TEXTURE and COLOR of lesions.
# Heavy shear/zoom/distortion destroys these fine-grained features.
# We apply only transformations that simulate natural image variation:
#   - Small rotation   → leaf orientation on stem
#   - Horizontal flip  → leaves are laterally symmetric
#   - Small zoom       → camera distance variation
#   - Brightness shift → lighting / time of day

train_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    rotation_range=15,
    width_shift_range=0.08,
    height_shift_range=0.08,
    zoom_range=0.08,
    horizontal_flip=True,
    brightness_range=[0.85, 1.15],
    fill_mode="reflect"
)

val_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input
)


# ─── 3. Data Generators ──────────────────────────────────────────────────────
def build_generators(train_dir, val_dir, img_size, batch_size):
    train_gen = train_datagen.flow_from_directory(
        train_dir,
        target_size=(img_size, img_size),
        batch_size=batch_size,
        class_mode="categorical",
        shuffle=True
    )
    val_gen = val_datagen.flow_from_directory(
        val_dir,
        target_size=(img_size, img_size),
        batch_size=batch_size,
        class_mode="categorical",
        shuffle=False   # Keep order for evaluation
    )
    # Verify class consistency
    assert train_gen.class_indices == val_gen.class_indices, \
        "❌ Class mismatch between Train and Validation generators!"
    print(f"✅ Generators ready. Classes: {list(train_gen.class_indices.keys())}")
    return train_gen, val_gen


# ─── 4. Class Weights ─────────────────────────────────────────────────────────
def compute_weights(train_gen):
    labels        = train_gen.classes
    weights_array = compute_class_weight("balanced", classes=np.unique(labels), y=labels)
    weight_dict   = dict(enumerate(weights_array))
    print(f"\n✅ Class weights:")
    class_names = {v: k for k, v in train_gen.class_indices.items()}
    for idx, w in weight_dict.items():
        print(f"   [{idx}] {class_names[idx]:<30} weight={w:.3f}")
    return weight_dict


# ─── 5. Model Architecture ──────────────────────────────────────────────────
# WHY EfficientNetB0:
# - Smaller than B3 → trains faster, less overfitting on limited data
# - Still achieves excellent accuracy for leaf disease tasks
# - 5.3M params vs B3's 10.7M — better for <5000 samples per class

def build_model(num_classes: int):
    # Load pretrained ImageNet backbone
    base = EfficientNetB0(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights="imagenet"
    )
    base.trainable = False  # Freeze for Phase 1

    inputs = base.input
    x      = base.output
    x      = layers.GlobalAveragePooling2D(name="gap")(x)
    x      = layers.BatchNormalization(name="head_bn")(x)
    x      = layers.Dense(
                 256, activation="relu",
                 kernel_regularizer=tf.keras.regularizers.l2(1e-4),
                 name="head_dense1"
             )(x)
    x      = layers.Dropout(0.4, name="head_drop1")(x)
    x      = layers.Dense(
                 128, activation="relu",
                 kernel_regularizer=tf.keras.regularizers.l2(1e-4),
                 name="head_dense2"
             )(x)
    x      = layers.Dropout(0.3, name="head_drop2")(x)
    outputs = layers.Dense(num_classes, activation="softmax", name="output")(x)

    model = models.Model(inputs, outputs, name="CropShield_EfficientNetB0")
    return model, base


# ─── 6. Callbacks ─────────────────────────────────────────────────────────────
def get_callbacks(phase: int) -> list:
    os.makedirs("model", exist_ok=True)
    return [
        callbacks.EarlyStopping(
            monitor="val_loss",
            patience=5,
            restore_best_weights=True,  # Roll back to best epoch automatically
            verbose=1
        ),
        callbacks.ModelCheckpoint(
            filepath="model/best_model.keras",
            monitor="val_accuracy",
            save_best_only=True,
            verbose=1
        ),
        callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=3,
            min_lr=1e-8,
            verbose=1
        ),
        callbacks.CSVLogger(f"model/history_phase{phase}.csv", append=True)
    ]


# ─── 7. Training Loop ─────────────────────────────────────────────────────────
def train(model, base, train_gen, val_gen, class_weights):
    os.makedirs("model", exist_ok=True)

    # ── Phase 1: Head Only ──
    print("\n" + "═"*60)
    print(" PHASE 1: Train classifier head (base FROZEN)")
    print(f" LR: {PHASE1_LR}  |  Max Epochs: {PHASE1_EPOCHS}")
    print("═"*60)
    model.compile(
        optimizer=optimizers.Adam(learning_rate=PHASE1_LR),
        loss=focal_loss(gamma=2.0),
        metrics=["accuracy"]
    )
    h1 = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=PHASE1_EPOCHS,
        class_weight=class_weights,
        callbacks=get_callbacks(phase=1)
    )
    best_p1_val = max(h1.history["val_accuracy"])
    print(f"\n✅ Phase 1 Best Val Accuracy: {best_p1_val*100:.2f}%")

    # ── Phase 2: Fine-Tune Top Layers ──
    total_layers = len(base.layers)
    unfreeze_from = int(total_layers * (1 - UNFREEZE_PCT))
    print(f"\n{'═'*60}")
    print(f" PHASE 2: Fine-tune top {UNFREEZE_PCT*100:.0f}% of base layers")
    print(f" Layers {unfreeze_from}–{total_layers} unfrozen")
    print(f" LR: {PHASE2_LR}  |  Max Epochs: {PHASE2_EPOCHS}")
    print("═"*60)
    for layer in base.layers[unfreeze_from:]:
        # Keep BatchNorm frozen to preserve pretrained statistics
        if not isinstance(layer, layers.BatchNormalization):
            layer.trainable = True

    trainable = sum([tf.size(v).numpy() for v in model.trainable_variables])
    print(f" Trainable params: {trainable:,}")

    # AdamW applies weight decay directly (L2 regularization built into optimizer)
    model.compile(
        optimizer=optimizers.AdamW(learning_rate=PHASE2_LR, weight_decay=1e-5),
        loss=focal_loss(gamma=2.0),
        metrics=["accuracy"]
    )
    h2 = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=PHASE2_EPOCHS,
        class_weight=class_weights,
        callbacks=get_callbacks(phase=2)
    )
    best_p2_val = max(h2.history["val_accuracy"])
    print(f"\n✅ Phase 2 Best Val Accuracy: {best_p2_val*100:.2f}%")
    return h1, h2


# ─── 8. Save ─────────────────────────────────────────────────────────────────
def save_artifacts(model, train_gen):
    model.save(MODEL_PATH)
    class_dict = {str(v): k for k, v in train_gen.class_indices.items()}
    with open(INDEX_PATH, "w") as f:
        json.dump(class_dict, f, indent=4)
    print(f"\n✅ Model saved → {MODEL_PATH}")
    print(f"✅ Labels saved → {INDEX_PATH}")


# ─── 9. Plot Curves ──────────────────────────────────────────────────────────
def plot_history(h1, h2):
    acc   = h1.history["accuracy"]     + h2.history["accuracy"]
    vacc  = h1.history["val_accuracy"] + h2.history["val_accuracy"]
    loss  = h1.history["loss"]         + h2.history["loss"]
    vloss = h1.history["val_loss"]     + h2.history["val_loss"]
    ep    = range(1, len(acc) + 1)
    boundary = len(h1.history["accuracy"])

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    ax1.plot(ep, acc,  color="green", label="Train Acc")
    ax1.plot(ep, vacc, color="blue",  label="Val Acc")
    ax1.axvline(boundary, color="red", linestyle="--", label="Phase 2 start")
    ax1.set_title("Accuracy"); ax1.legend()

    ax2.plot(ep, loss,  color="green", label="Train Loss (Focal)")
    ax2.plot(ep, vloss, color="blue",  label="Val Loss (Focal)")
    ax2.axvline(boundary, color="red", linestyle="--", label="Phase 2 start")
    ax2.set_title("Focal Loss"); ax2.legend()

    plt.tight_layout()
    plt.savefig("model/training_curves.png", dpi=120)
    print("✅ Training curves → model/training_curves.png")


# ─── Main ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if not os.path.isdir(TRAIN_DIR):
        print("❌ dataset_merged/ not found. Run:  python restructure_dataset.py  first.")
        exit(1)

    train_gen, val_gen = build_generators(TRAIN_DIR, VAL_DIR, IMG_SIZE, BATCH_SIZE)
    class_weights      = compute_weights(train_gen)
    model, base        = build_model(num_classes=train_gen.num_classes)
    model.summary(line_length=100, print_fn=lambda x: print(x) if "Total" in x or "Trainable" in x else None)

    h1, h2 = train(model, base, train_gen, val_gen, class_weights)
    save_artifacts(model, train_gen)
    plot_history(h1, h2)

    print("\n🎉 Training pipeline complete!")
    print("   Next: python evaluate_model.py")
