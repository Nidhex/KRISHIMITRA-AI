import os
import json
import shutil
import tensorflow as tf
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
OUTPUT_DIR = BASE_DIR / "browser-models"

os.makedirs(OUTPUT_DIR / "disease", exist_ok=True)
os.makedirs(OUTPUT_DIR / "soil", exist_ok=True)

print("--- KRISHIMITRA MODEL CONVERTER ---")

# 1. Disease Model
disease_path = MODELS_DIR / "plant_disease_model.keras"
print(f"Loading Disease Model from {disease_path}...")
model_d = tf.keras.models.load_model(str(disease_path))

# Save H5 temporary copy
h5_d = MODELS_DIR / "plant_disease_model.h5"
print("Saving temporary H5 model...")
model_d.save(str(h5_d))

# Copy labels
shutil.copy(MODELS_DIR / "labels.json", OUTPUT_DIR / "disease" / "labels.json")

# 2. Soil Model
soil_path = MODELS_DIR / "soil_classifier_v4.keras"
print(f"Loading Soil Model from {soil_path}...")
model_s = tf.keras.models.load_model(str(soil_path))

# Save H5 temporary copy
h5_s = MODELS_DIR / "soil_classifier_v4.h5"
print("Saving temporary H5 model...")
model_s.save(str(h5_s))

# Copy labels
shutil.copy(MODELS_DIR / "soil_labels_v4.json", OUTPUT_DIR / "soil" / "soil_labels_v4.json")

print("H5 Models saved successfully!")
