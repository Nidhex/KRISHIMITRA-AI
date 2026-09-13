# Predictor class

import os
import json
import numpy as np
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

class FixedInputLayer(tf.keras.layers.InputLayer):
    def __init__(self, *args, **kwargs):
        if 'batch_shape' in kwargs and 'batch_input_shape' not in kwargs:
            kwargs['batch_input_shape'] = kwargs.pop('batch_shape')
        kwargs.pop('optional', None)
        super().__init__(*args, **kwargs)

    @classmethod
    def from_config(cls, config):
        config = config.copy()
        if 'batch_shape' in config and 'batch_input_shape' not in config:
            config['batch_input_shape'] = config.pop('batch_shape')
        config.pop('optional', None)
        return super().from_config(config)

def _is_keras_deserialization_error(e):
    msg = str(e)
    signatures = [
        "InputLayer",
        "batch_shape",
        "optional",
        "keras.src.models",
        "deserializ",
        "Unrecognized keyword arguments"
    ]
    return any(sig in msg for sig in signatures)

# Load model (try .keras first, fallback to .h5 for TF 2.15 / Keras 2 compatibility)
try:
    model = tf.keras.models.load_model(str(MODEL_PATH))
except Exception as e:
    if _is_keras_deserialization_error(e) and H5_PATH.exists():
        model = tf.keras.models.load_model(str(H5_PATH), custom_objects={'InputLayer': FixedInputLayer})
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