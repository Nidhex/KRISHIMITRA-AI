# Predictor class

import os
import json
import numpy as np

os.environ.setdefault("KERAS_BACKEND", "tensorflow")
import keras
import tensorflow as tf

from prediction.image_utils import preprocess_image
from pathlib import Path

# Determine paths relative to this script
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "plant_disease_model.keras"
H5_PATH = BASE_DIR / "models" / "plant_disease_model.h5"
LABELS_PATH = BASE_DIR / "models" / "labels.json"

if not MODEL_PATH.exists() and not H5_PATH.exists():
    raise FileNotFoundError(f"Plant disease model file not found at: {MODEL_PATH.resolve()}")
if not LABELS_PATH.exists():
    raise FileNotFoundError(f"Labels file not found at: {LABELS_PATH.resolve()}")

# Load model using native Keras 3 (compile=False for inference)
try:
    model = keras.models.load_model(str(MODEL_PATH), compile=False)
except Exception as e:
    if H5_PATH.exists():
        model = keras.models.load_model(str(H5_PATH), compile=False)
    else:
        raise e

# Load labels
with open(LABELS_PATH, "r", encoding="utf-8-sig") as file:
    class_labels = json.load(file)

def predict(image_path):
    processed_image = preprocess_image(image_path)

    prediction = model.predict(processed_image, verbose=0)

    predicted_index = np.argmax(prediction)
    confidence = float(np.max(prediction))

    predicted_class = class_labels[str(predicted_index)]

    return predicted_class, confidence