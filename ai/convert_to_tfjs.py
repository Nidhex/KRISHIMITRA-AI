import os
import sys
import json
import shutil
import tensorflow as tf
from pathlib import Path

import numpy as np
if not hasattr(np, 'object'):
    np.object = object
if not hasattr(np, 'bool'):
    np.bool = bool

try:
    import tensorflow_estimator as estimator
    sys.modules['tensorflow.compat.v1'].estimator = estimator
    tf.compat.v1.estimator = estimator
    tf.estimator = estimator
except Exception as e:
    print("Estimator patch notice:", e)

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
OUTPUT_DIR = BASE_DIR / "browser-models"

disease_keras = MODELS_DIR / "plant_disease_model.keras"
disease_h5 = MODELS_DIR / "plant_disease_model.h5"
disease_out = OUTPUT_DIR / "disease"

soil_keras = MODELS_DIR / "soil_classifier_v4.keras"
soil_h5 = MODELS_DIR / "soil_classifier_v4.h5"
soil_out = OUTPUT_DIR / "soil"

os.makedirs(disease_out, exist_ok=True)
os.makedirs(soil_out, exist_ok=True)

print("Starting TensorFlow.js Model Conversion...")

try:
    import tensorflowjs as tfjs
    
    print("\n1. Converting Plant Disease Model...")
    src_d = str(disease_h5) if disease_h5.exists() else str(disease_keras)
    model_disease = tf.keras.models.load_model(src_d)
    tfjs.converters.save_keras_model(model_disease, str(disease_out))
    shutil.copy(MODELS_DIR / "labels.json", disease_out / "labels.json")
    print("   ✓ Plant Disease Model Converted Successfully to:", disease_out)

    print("\n2. Converting Soil Classifier Model v4...")
    src_s = str(soil_h5) if soil_h5.exists() else str(soil_keras)
    model_soil = tf.keras.models.load_model(src_s)
    tfjs.converters.save_keras_model(model_soil, str(soil_out))
    shutil.copy(MODELS_DIR / "soil_labels_v4.json", soil_out / "soil_labels_v4.json")
    print("   ✓ Soil Classifier Model Converted Successfully to:", soil_out)
    
except Exception as e:
    import traceback
    print("\nError during TFJS conversion:", e)
    traceback.print_exc()
