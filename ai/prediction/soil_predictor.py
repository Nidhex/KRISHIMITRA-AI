# Soil Predictor for Soil Classification using Native Keras 3

import os
os.environ.setdefault("KERAS_BACKEND", "tensorflow")

import sys
import json
import numpy as np
from pathlib import Path
import keras
import tensorflow as tf

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
MODEL_PATH = BASE_DIR / "models" / "soil_classifier_v4.keras"
LABELS_PATH = BASE_DIR / "models" / "soil_labels_v4.json"

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Soil model not found at: {MODEL_PATH.resolve()}")
if not LABELS_PATH.exists():
    raise FileNotFoundError(f"Labels file not found at: {LABELS_PATH.resolve()}")

def load_labels():
    with open(LABELS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def preprocess_image(image_path):
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at: {image_path}")
    
    img = keras.utils.load_img(
        image_path,
        target_size=(224, 224),
        color_mode="rgb"
    )
    
    img_array = keras.utils.img_to_array(img)
    img_array = img_array.astype("float32")
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array

# Load model natively using Keras 3
model = keras.models.load_model(str(MODEL_PATH), compile=False)
labels_dict = load_labels()

def predict_soil(image_path, verbose=False):
    img_array = preprocess_image(image_path)
    preds = model.predict(img_array, verbose=0)[0]
    
    class_probs = []
    for idx, prob in enumerate(preds):
        class_name = labels_dict[str(idx)]
        class_probs.append((class_name, float(prob)))
    
    class_probs.sort(key=lambda x: x[1], reverse=True)
    best_class, best_prob = class_probs[0]
    
    if verbose:
        print(f"Predicted Soil: {best_class}")
        print(f"Confidence: {best_prob * 100:.2f}%\n")
        print("Class Probabilities:")
        for class_name, prob in class_probs:
            print(f"  {class_name:<20} {prob * 100:>6.2f}%")
        
    return best_class, best_prob, class_probs

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python soil_predictor.py <path_to_image>")
        sys.exit(1)
        
    img_path = sys.argv[1]
    try:
        predict_soil(img_path, verbose=True)
    except Exception as e:
        print(f"Error during prediction: {e}")
        sys.exit(1)
