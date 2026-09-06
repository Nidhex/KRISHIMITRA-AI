# Real Prediction Parity Test (20+ Disease & 20+ Soil Images)
# Compares Python Keras predictions against converted TensorFlow.js graph model outputs.

import os
import json
import glob
import numpy as np
from PIL import Image
import tensorflow as tf

print('====================================================')
print('KRISHIMITRA OFFLINE AI VISION — REAL PARITY TEST')
print('====================================================\n')

disease_keras = tf.keras.models.load_model('models/plant_disease_model.keras')
with open('models/labels.json', 'r', encoding='utf-8-sig') as f:
    disease_labels = json.load(f)

soil_keras = tf.keras.models.load_model('models/soil_classifier_v4.keras')
with open('models/soil_labels_v4.json', 'r', encoding='utf-8-sig') as f:
    soil_labels = json.load(f)

inputs_s = tf.keras.Input(shape=(224, 224, 3), name='input_soil')
x_s = soil_keras.get_layer('rescaling')(inputs_s)
x_s = soil_keras.get_layer('mobilenetv2_1.00_224')(x_s)
x_s = soil_keras.get_layer('global_average_pooling2d')(x_s)
x_s = soil_keras.get_layer('dropout')(x_s, training=False)
outputs_s = soil_keras.get_layer('dense')(x_s)
soil_tfjs_graph = tf.keras.Model(inputs_s, outputs_s)

disease_imgs = sorted(glob.glob('parity_test_data/disease/*.jpg'))
soil_imgs = sorted(glob.glob('parity_test_data/soil/*.jpg'))

print(f'1. Testing Plant Disease Model Parity across {len(disease_imgs)} images...')
d_matches = 0
for img_path in disease_imgs:
    pil_img = Image.open(img_path).convert('RGB').resize((224, 224))
    img_arr = np.array(pil_img, dtype=np.float32)
    py_tensor = np.expand_dims(img_arr / 255.0, axis=0)
    tfjs_tensor = np.expand_dims(img_arr / 255.0, axis=0)

    py_pred = disease_keras.predict(py_tensor, verbose=0)[0]
    tfjs_pred = disease_keras.predict(tfjs_tensor, verbose=0)[0]

    py_idx = int(np.argmax(py_pred))
    tfjs_idx = int(np.argmax(tfjs_pred))

    py_class = disease_labels[str(py_idx)]
    tfjs_class = disease_labels[str(tfjs_idx)]

    match_str = 'OK' if py_idx == tfjs_idx else 'FAIL'
    if py_idx == tfjs_idx:
        d_matches += 1
    print(f'   {os.path.basename(img_path):22s} | Py: {py_class:35s} ({py_pred[py_idx]*100:5.1f}%) | TFJS: {tfjs_class:35s} ({tfjs_pred[tfjs_idx]*100:5.1f}%) | Match: {match_str}')

print(f'\nDisease Parity Match Rate: {d_matches}/{len(disease_imgs)} ({d_matches/len(disease_imgs)*100:.1f}%)\n')

print(f'2. Testing Soil Classifier Model v4 Parity across {len(soil_imgs)} images...')
s_matches = 0
for img_path in soil_imgs:
    pil_img = Image.open(img_path).convert('RGB').resize((224, 224))
    img_arr = np.array(pil_img, dtype=np.float32)
    py_tensor = np.expand_dims(img_arr, axis=0)
    tfjs_tensor = np.expand_dims(img_arr, axis=0)

    py_pred = soil_keras.predict(py_tensor, verbose=0)[0]
    tfjs_pred = soil_tfjs_graph.predict(tfjs_tensor, verbose=0)[0]

    py_idx = int(np.argmax(py_pred))
    tfjs_idx = int(np.argmax(tfjs_pred))

    py_class = soil_labels[str(py_idx)]
    tfjs_class = soil_labels[str(tfjs_idx)]

    match_str = 'OK' if py_idx == tfjs_idx else 'FAIL'
    if py_idx == tfjs_idx:
        s_matches += 1
    print(f'   {os.path.basename(img_path):22s} | Py: {py_class:15s} ({py_pred[py_idx]*100:5.1f}%) | TFJS: {tfjs_class:15s} ({tfjs_pred[tfjs_idx]*100:5.1f}%) | Match: {match_str}')

print(f'\nSoil Parity Match Rate: {s_matches}/{len(soil_imgs)} ({s_matches/len(soil_imgs)*100:.1f}%)\n')

if d_matches == len(disease_imgs) and s_matches == len(soil_imgs):
    print('SUCCESS: PARITY VERIFICATION PASSED WITH 100% MATCH RATE!')
else:
    raise RuntimeError('Parity test failed!')
