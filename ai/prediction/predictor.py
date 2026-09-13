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
        if isinstance(kwargs.get('dtype'), dict):
            kwargs.pop('dtype')
        super().__init__(*args, **kwargs)

    @classmethod
    def from_config(cls, config):
        config = config.copy()
        if 'batch_shape' in config and 'batch_input_shape' not in config:
            config['batch_input_shape'] = config.pop('batch_shape')
        config.pop('optional', None)
        if isinstance(config.get('dtype'), dict):
            config.pop('dtype')
        return super().from_config(config)

class FixedRescaling(tf.keras.layers.Rescaling):
    def __init__(self, scale, offset=0.0, **kwargs):
        if isinstance(kwargs.get('dtype'), dict):
            kwargs.pop('dtype')
        super().__init__(scale=scale, offset=offset, **kwargs)

    @classmethod
    def from_config(cls, config):
        config = config.copy()
        if isinstance(config.get('dtype'), dict):
            config.pop('dtype')
        return super().from_config(config)

class FixedRandomFlip(tf.keras.layers.RandomFlip):
    def __init__(self, mode='horizontal_and_vertical', seed=None, **kwargs):
        kwargs.pop('data_format', None)
        if isinstance(kwargs.get('dtype'), dict):
            kwargs.pop('dtype')
        super().__init__(mode=mode, seed=seed, **kwargs)

    @classmethod
    def from_config(cls, config):
        config = config.copy()
        config.pop('data_format', None)
        if isinstance(config.get('dtype'), dict):
            config.pop('dtype')
        return super().from_config(config)

class FixedRandomRotation(tf.keras.layers.RandomRotation):
    def __init__(self, factor, fill_mode='reflect', fill_value=0.0, interpolation='bilinear', seed=None, **kwargs):
        kwargs.pop('data_format', None)
        if isinstance(kwargs.get('dtype'), dict):
            kwargs.pop('dtype')
        super().__init__(factor=factor, fill_mode=fill_mode, fill_value=fill_value, interpolation=interpolation, seed=seed, **kwargs)

    @classmethod
    def from_config(cls, config):
        config = config.copy()
        config.pop('data_format', None)
        if isinstance(config.get('dtype'), dict):
            config.pop('dtype')
        return super().from_config(config)

class FixedGlorotUniform(tf.keras.initializers.GlorotUniform):
    def __init__(self, seed=None, **kwargs):
        kwargs.pop('input_axes', None)
        kwargs.pop('output_axes', None)
        super().__init__(seed=seed)

    @classmethod
    def from_config(cls, config):
        config = config.copy()
        config.pop('input_axes', None)
        config.pop('output_axes', None)
        return super().from_config(config)

class FixedZeros(tf.keras.initializers.Zeros):
    def __init__(self, **kwargs):
        kwargs.pop('input_axes', None)
        kwargs.pop('output_axes', None)
        super().__init__()

    @classmethod
    def from_config(cls, config):
        config = config.copy()
        config.pop('input_axes', None)
        config.pop('output_axes', None)
        return super().from_config(config)

class DTypePolicy:
    @classmethod
    def from_config(cls, config):
        name = config.get('name', 'float32') if isinstance(config, dict) else 'float32'
        return tf.keras.mixed_precision.Policy(name)

def _is_keras_deserialization_error(e):
    msg = str(e)
    signatures = [
        "InputLayer",
        "Rescaling",
        "RandomFlip",
        "RandomRotation",
        "GlorotUniform",
        "Conv2D",
        "batch_shape",
        "optional",
        "DTypePolicy",
        "data_format",
        "input_axes",
        "output_axes",
        "keras.src.models",
        "deserializ",
        "Unrecognized keyword argument",
        "Keyword argument not understood",
        "unexpected keyword argument"
    ]
    return any(sig in msg for sig in signatures)

# Load model (try .keras first, fallback to .h5 for TF 2.15 / Keras 2 compatibility)
try:
    model = tf.keras.models.load_model(str(MODEL_PATH))
except Exception as e:
    if _is_keras_deserialization_error(e) and H5_PATH.exists():
        custom_objs = {
            'InputLayer': FixedInputLayer,
            'Rescaling': FixedRescaling,
            'RandomFlip': FixedRandomFlip,
            'RandomRotation': FixedRandomRotation,
            'GlorotUniform': FixedGlorotUniform,
            'Zeros': FixedZeros,
            'DTypePolicy': DTypePolicy
        }
        model = tf.keras.models.load_model(str(H5_PATH), custom_objects=custom_objs)
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