import os
import sys
import shutil
import types
from pathlib import Path

# Force pure Python implementation for protobuf to prevent C++ descriptor errors
os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

# Monkeypatch NumPy 1.24+ / 2.0+ deprecated types for tfjs compatibility
import numpy as np
if not hasattr(np, 'object'):
    np.object = object
if not hasattr(np, 'bool'):
    np.bool = bool
if not hasattr(np, 'typeDict'):
    np.typeDict = np.sctypeDict

import tensorflow as tf

# Patch TF 2.16+ module location moves for tensorflow_hub compatibility
import tensorflow.python.trackable as trackable
import tensorflow.python.trackable.data_structures as ds

tracking_stub = types.ModuleType('tracking')
tracking_stub.data_structures = ds
sys.modules['tensorflow.python.training.tracking'] = tracking_stub

# Stub tensorflow_hub.estimator module in sys.modules
estimator_stub = types.ModuleType('estimator')
class DummyExporter:
    pass
def dummy_func(*args, **kwargs):
    pass

estimator_stub.Exporter = DummyExporter
estimator_stub.LatestModuleExporter = DummyExporter
estimator_stub.register_module_for_export = dummy_func

sys.modules['tensorflow.compat.v1.estimator'] = estimator_stub
sys.modules['tensorflow_hub.estimator'] = estimator_stub
tf.compat.v1.estimator = estimator_stub

import tensorflowjs as tfjs

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
OUTPUT_DIR = BASE_DIR / "browser-models"

disease_keras = MODELS_DIR / "plant_disease_model.keras"
disease_out = OUTPUT_DIR / "disease"

soil_keras = MODELS_DIR / "soil_classifier_v4.keras"
soil_out = OUTPUT_DIR / "soil"

os.makedirs(disease_out, exist_ok=True)
os.makedirs(soil_out, exist_ok=True)

print("Starting TensorFlow.js Model Conversion...")

# 1. Disease Model Conversion
print("\n1. Converting Plant Disease Model...")
model_d = tf.keras.models.load_model(str(disease_keras))
temp_sm_d = BASE_DIR / "temp_sm_disease"
tf.saved_model.save(model_d, str(temp_sm_d))
tfjs.converters.convert_tf_saved_model(str(temp_sm_d), str(disease_out))
# Clean labels JSON files to ensure no UTF-8 BOM is written
with open(MODELS_DIR / "labels.json", "r", encoding="utf-8-sig") as f:
    d_labels = json.load(f)
with open(disease_out / "labels.json", "w", encoding="utf-8") as f:
    json.dump(d_labels, f, indent=2)

if temp_sm_d.exists():
    shutil.rmtree(temp_sm_d)
print("   [OK] Plant Disease Model Converted Successfully to:", disease_out)

# 2. Soil Model Conversion
print("\n2. Converting Soil Classifier Model v4...")
model_s = tf.keras.models.load_model(str(soil_keras))

# Create clean inference model without training-only data augmentation layers
inputs_s = tf.keras.Input(shape=(224, 224, 3), name="input_soil")
x_s = model_s.get_layer("rescaling")(inputs_s)
x_s = model_s.get_layer("mobilenetv2_1.00_224")(x_s)
x_s = model_s.get_layer("global_average_pooling2d")(x_s)
x_s = model_s.get_layer("dropout")(x_s, training=False)
outputs_s = model_s.get_layer("dense")(x_s)

inf_model_s = tf.keras.Model(inputs_s, outputs_s)
temp_sm_s = BASE_DIR / "temp_clean_sm_soil"
tf.saved_model.save(inf_model_s, str(temp_sm_s))
tfjs.converters.convert_tf_saved_model(str(temp_sm_s), str(soil_out))

with open(MODELS_DIR / "soil_labels_v4.json", "r", encoding="utf-8-sig") as f:
    s_labels = json.load(f)
with open(soil_out / "soil_labels_v4.json", "w", encoding="utf-8") as f:
    json.dump(s_labels, f, indent=2)

if temp_sm_s.exists():
    shutil.rmtree(temp_sm_s)
print("   [OK] Soil Classifier Model Converted Successfully to:", soil_out)


print("\nSUCCESS: ALL MODELS CONVERTED TO TENSORFLOW.JS FORMAT SUCCESSFULLY!")




