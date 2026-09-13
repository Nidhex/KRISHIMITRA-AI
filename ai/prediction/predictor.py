# Predictor class

import os
import json
import numpy as np

os.environ.setdefault("KERAS_BACKEND", "tensorflow")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("TF_NUM_INTRAOP_THREADS", "1")
os.environ.setdefault("TF_NUM_INTEROP_THREADS", "1")

import keras
import tensorflow as tf

try:
    tf.config.set_inter_op_parallelism_threads(1)
    tf.config.set_intra_op_parallelism_threads(1)
except Exception:
    pass

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
model = keras.models.load_model(str(MODEL_PATH), compile=False)

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