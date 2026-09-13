import os
import sys
import json
import numpy as np
from pathlib import Path

os.environ.setdefault("KERAS_BACKEND", "tensorflow")
import keras
import tensorflow as tf

# pyrefly: ignore [missing-import]
from tensorflow.keras.preprocessing import image

# Determine paths relative to this script
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "soil_classifier_v4.keras"
H5_PATH = BASE_DIR / "models" / "soil_classifier_v4.h5"
LABELS_PATH = BASE_DIR / "models" / "soil_labels_v4.json"

def load_labels():
    if not LABELS_PATH.exists():
        raise FileNotFoundError(f"Labels file not found at: {LABELS_PATH.resolve()}")
    with open(LABELS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def preprocess_image(image_path):
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at: {image_path}")
    
    # Load image and force RGB
    img = image.load_img(
        image_path,
        target_size=(224, 224),
        color_mode="rgb"
    )
    
    # Convert to numpy array [0.0, 255.0]
    img_array = image.img_to_array(img)
    img_array = img_array.astype("float32")
    
    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array

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

if not MODEL_PATH.exists() and not H5_PATH.exists():
    raise FileNotFoundError(f"Trained model not found at: {MODEL_PATH.resolve()}")

# Load model using native Keras 3 (compile=False for inference)
try:
    model = keras.models.load_model(str(MODEL_PATH), custom_objects=custom_objs, compile=False)
except Exception as e:
    if H5_PATH.exists():
        model = keras.models.load_model(str(H5_PATH), custom_objects=custom_objs, compile=False)
    else:
        raise e

labels_dict = load_labels()

def predict_soil(image_path, verbose=False):
    # Preprocess
    img_array = preprocess_image(image_path)
    
    # Predict
    preds = model.predict(img_array, verbose=0)[0]
    
    # Sort classes by probability descending
    class_probs = []
    for idx, prob in enumerate(preds):
        class_name = labels_dict[str(idx)]
        class_probs.append((class_name, prob))
    
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
