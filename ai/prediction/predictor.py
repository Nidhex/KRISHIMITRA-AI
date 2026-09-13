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

class FixedRandomFlip(keras.layers.RandomFlip):
    def __init__(self, mode='horizontal_and_vertical', seed=None, **kwargs):
        kwargs.pop('data_format', None)
        super().__init__(mode=mode, seed=seed, **kwargs)

class FixedRandomRotation(keras.layers.RandomRotation):
    def __init__(self, factor, fill_mode='reflect', fill_value=0.0, interpolation='bilinear', seed=None, **kwargs):
        kwargs.pop('data_format', None)
        super().__init__(factor=factor, fill_mode=fill_mode, fill_value=fill_value, interpolation=interpolation, seed=seed, **kwargs)

class FixedRandomZoom(keras.layers.RandomZoom):
    def __init__(self, height_factor, width_factor=None, fill_mode='reflect', fill_value=0.0, interpolation='bilinear', seed=None, **kwargs):
        kwargs.pop('data_format', None)
        super().__init__(height_factor=height_factor, width_factor=width_factor, fill_mode=fill_mode, fill_value=fill_value, interpolation=interpolation, seed=seed, **kwargs)

class FixedGlorotUniform(keras.initializers.GlorotUniform):
    def __init__(self, seed=None, **kwargs):
        kwargs.pop('input_axes', None)
        kwargs.pop('output_axes', None)
        super().__init__(seed=seed)

custom_objs = {
    'RandomFlip': FixedRandomFlip,
    'RandomRotation': FixedRandomRotation,
    'RandomZoom': FixedRandomZoom,
    'GlorotUniform': FixedGlorotUniform
}

# Load model using native Keras 3 (compile=False for inference)
try:
    model = keras.models.load_model(str(MODEL_PATH), custom_objects=custom_objs, compile=False)
except Exception as e:
    if H5_PATH.exists():
        model = keras.models.load_model(str(H5_PATH), custom_objects=custom_objs, compile=False)
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