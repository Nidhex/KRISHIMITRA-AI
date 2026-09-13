import os
import sys
import json
import gc
import numpy as np
from pathlib import Path

os.environ.setdefault("KERAS_BACKEND", "tensorflow")
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["TF_NUM_INTRAOP_THREADS"] = "1"
os.environ["TF_NUM_INTEROP_THREADS"] = "1"

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

# Load labels
with open(LABELS_PATH, "r", encoding="utf-8-sig") as file:
    class_labels = json.load(file)

_model = None

def get_model():
    global _model
    if _model is None:
        _model = keras.models.load_model(str(MODEL_PATH), compile=False)
        gc.collect()
    return _model

def predict(image_path):
    processed_image = preprocess_image(image_path)
    model_instance = get_model()

    prediction = model_instance.predict(processed_image, verbose=0)

    predicted_index = np.argmax(prediction)
    confidence = float(np.max(prediction))

    predicted_class = class_labels[str(predicted_index)]

    del processed_image, prediction
    gc.collect()

    return predicted_class, confidence