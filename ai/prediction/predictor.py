# Predictor class for Plant Disease Identification using Native Keras 3

import os
os.environ.setdefault("KERAS_BACKEND", "tensorflow")

import json
import numpy as np
import keras
import tensorflow as tf
from pathlib import Path

from prediction.image_utils import preprocess_image

# Sanitize legacy/tf.keras metadata keys from saved .keras model config
def _sanitize_dict(d):
    if not isinstance(d, dict):
        return d
    cleaned = {}
    for k, v in d.items():
        if k in ('input_axes', 'output_axes', 'renorm', 'renorm_clipping', 'renorm_momentum', 'optional', 'quantization_config'):
            continue
        if isinstance(v, dict):
            cleaned[k] = _sanitize_dict(v)
        elif isinstance(v, list):
            cleaned[k] = [_sanitize_dict(item) if isinstance(item, dict) else item for item in v]
        else:
            cleaned[k] = v
    return cleaned

_orig_deserialize = keras.src.saving.serialization_lib.deserialize_keras_object
def _deserializer_patch(config, *args, **kwargs):
    config = _sanitize_dict(config)
    return _orig_deserialize(config, *args, **kwargs)

keras.saving.deserialize_keras_object = _deserializer_patch
keras.src.saving.serialization_lib.deserialize_keras_object = _deserializer_patch

# Determine paths relative to this script
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "plant_disease_model.keras"
LABELS_PATH = BASE_DIR / "models" / "labels.json"

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Plant disease model file not found at: {MODEL_PATH.resolve()}")
if not LABELS_PATH.exists():
    raise FileNotFoundError(f"Labels file not found at: {LABELS_PATH.resolve()}")

# Load model using native Keras 3
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