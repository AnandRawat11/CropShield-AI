"""
restructure_dataset.py  ─  Merge 46 Fine-Grained Classes → ~12 Superclasses
==============================================================================
CropShield AI | Run this ONCE before training to create a clean merged dataset.

WHY MERGE?
- 28 of 46 classes have <300 training images → model cannot learn them reliably
- Fine-grained classes (e.g., 8 separate Cotton pest types) waste model capacity
- Merging to biologically meaningful superclasses (Cotton_Pest, Wheat_Disease)
  improves generalization and gives every class sufficient data

Output: dataset_merged/Train/  and  dataset_merged/Validation/
        with ~12 balanced superclasses
"""

import os
import shutil

# ─── Superclass Mapping ───────────────────────────────────────────────────────
# Format: "original folder name": "superclass folder name"
# Classes NOT in this map with <100 images will be skipped (removed).

SUPERCLASS_MAP = {
    # ── Cotton Pests (merge all insect/pest subclasses → one class) ──
    "American Bollworm on Cotton":   "Cotton_Pest",
    "bollworm on Cotton":            "Cotton_Pest",
    "pink bollworm in cotton":       "Cotton_Pest",
    "Cotton Aphid":                  "Cotton_Pest",
    "cotton whitefly":               "Cotton_Pest",
    "cotton mealy bug":              "Cotton_Pest",
    "red cotton bug":                "Cotton_Pest",
    "thirps on  cotton":             "Cotton_Pest",

    # ── Cotton Diseases ──
    "Anthracnose on Cotton":         "Cotton_Disease",
    "bacterial_blight in Cotton":    "Cotton_Disease",
    "bollrot on Cotton":             "Cotton_Disease",   # only 2 images, merged
    "Leaf Curl":                     "Cotton_Disease",
    "Wilt":                          "Cotton_Disease",

    # ── Cotton Healthy ──
    "Healthy cotton":                "Cotton_Healthy",

    # ── Wheat Diseases (merge all wheat subclasses → one class) ──
    "Wheat Brown leaf Rust":         "Wheat_Disease",
    "Wheat black rust":              "Wheat_Disease",
    "Wheat___Yellow_Rust":           "Wheat_Disease",
    "Wheat powdery mildew":          "Wheat_Disease",
    "Wheat scab":                    "Wheat_Disease",
    "Wheat leaf blight":             "Wheat_Disease",
    "Flag Smut":                     "Wheat_Disease",
    "Wheat Stem fly":                "Wheat_Disease",   # insect, merged for data
    "Wheat aphid":                   "Wheat_Disease",   # insect, merged for data
    "Wheat mite":                    "Wheat_Disease",   # insect, merged for data

    # ── Wheat Healthy ──
    "Healthy Wheat":                 "Wheat_Healthy",

    # ── Rice Diseases ──
    "Becterial Blight in Rice":      "Rice_Disease",
    "Brownspot":                     "Rice_Disease",
    "Rice Blast":                    "Rice_Disease",
    "Leaf smut":                     "Rice_Disease",
    "Tungro":                        "Rice_Disease",

    # ── Maize Diseases & Pests ──
    "Common_Rust":                   "Maize_Disease",
    "Gray_Leaf_Spot":                "Maize_Disease",
    "maize ear rot":                 "Maize_Disease",
    "maize fall armyworm":           "Maize_Disease",
    "maize stem borer":              "Maize_Disease",
    "Army worm":                     "Maize_Disease",   # usually on maize

    # ── Maize Healthy ──
    "Healthy Maize":                 "Maize_Healthy",

    # ── Sugarcane Diseases ──
    "Mosaic sugarcane":              "Sugarcane_Disease",
    "RedRot sugarcane":              "Sugarcane_Disease",
    "RedRust sugarcane":             "Sugarcane_Disease",
    "Yellow Rust Sugarcane":         "Sugarcane_Disease",

    # ── Sugarcane Healthy ──
    "Sugarcane Healthy":             "Sugarcane_Healthy",

    # ── Tomato ──
    "Tomato___Early_blight":         "Tomato_Disease",
    "Tomato___Healthy":              "Tomato_Healthy",

    # ── Potato ──
    "Potato___Late_blight":          "Potato_Disease",
    "Potato___Healthy":              "Potato_Healthy",
}

SRC_TRAIN   = os.path.join("dataset", "Train")
SRC_VAL     = os.path.join("dataset", "Validation")
DST_TRAIN   = os.path.join("dataset_merged", "Train")
DST_VAL     = os.path.join("dataset_merged", "Validation")


def merge_split(src_dir: str, dst_dir: str, split_name: str):
    """Copy images from src_dir into merged superclass folders in dst_dir."""
    print(f"\n── Merging {split_name} split ──")
    os.makedirs(dst_dir, exist_ok=True)

    counts = {}
    skipped = []

    original_classes = [
        d for d in os.listdir(src_dir)
        if os.path.isdir(os.path.join(src_dir, d)) and not d.startswith(".")
    ]

    for cls in original_classes:
        if cls not in SUPERCLASS_MAP:
            skipped.append(cls)
            continue

        superclass = SUPERCLASS_MAP[cls]
        src_path   = os.path.join(src_dir, cls)
        dst_path   = os.path.join(dst_dir, superclass)
        os.makedirs(dst_path, exist_ok=True)

        IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"}
        images = [
            f for f in os.listdir(src_path)
            if not f.startswith(".")
            and os.path.isfile(os.path.join(src_path, f))
            and os.path.splitext(f.lower())[1] in IMAGE_EXTS
        ]
        copied = 0
        for img in images:
            # Prefix filename with original class to avoid overwriting
            safe_prefix    = cls.replace(" ", "_").replace("/", "-")
            new_name       = f"{safe_prefix}__{img}"
            src_img        = os.path.join(src_path, img)
            dst_img        = os.path.join(dst_path, new_name)
            if not os.path.exists(dst_img):   # skip if already exists (re-runs)
                shutil.copy2(src_img, dst_img)
            copied += 1

        counts[superclass] = counts.get(superclass, 0) + copied
        print(f"  {cls:<42} → {superclass:<25} ({copied} imgs)")

    return counts, skipped


def print_distribution(counts: dict, split_name: str):
    print(f"\n{'═'*55}")
    print(f"  {split_name.upper()} SUPERCLASS DISTRIBUTION")
    print(f"{'═'*55}")
    print(f"{'Superclass':<30} {'Images':>8}  {'Flag'}")
    print("─"*55)
    total = 0
    for cls in sorted(counts):
        flag = "⚠️  <300" if counts[cls] < 300 else ""
        print(f"{cls:<30} {counts[cls]:>8}  {flag}")
        total += counts[cls]
    print("─"*55)
    print(f"{'TOTAL':<30} {total:>8}")
    print(f"{'CLASSES':<30} {len(counts):>8}")
    print(f"{'═'*55}")


if __name__ == "__main__":
    print("CropShield AI — Dataset Restructuring Tool")
    print(f"Source: {SRC_TRAIN}  →  Destination: {DST_TRAIN}")
    print(f"Superclass mapping: {len(set(SUPERCLASS_MAP.values()))} superclasses\n")

    # Merge Train
    train_counts, train_skipped = merge_split(SRC_TRAIN, DST_TRAIN, "Train")
    print_distribution(train_counts, "Train")

    # Merge Validation
    val_counts, val_skipped = merge_split(SRC_VAL, DST_VAL, "Validation")
    print_distribution(val_counts, "Validation")

    if train_skipped:
        print(f"\n⚠️  Skipped (not in superclass map): {train_skipped}")

    print("\n✅ Dataset restructuring complete!")
    print(f"   Merged dataset written to: dataset_merged/")
    print(f"   Next step: Run  python train_model.py")
