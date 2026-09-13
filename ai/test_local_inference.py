import os
import sys

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

AI_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(AI_DIR)

if AI_DIR not in sys.path:
    sys.path.insert(0, AI_DIR)

from prediction.predictor import predict
from prediction.soil_predictor import predict_soil

def test_predictions():
    disease_img = os.path.join(ROOT_DIR, "sample_tomato_blight.jpg")
    soil_img = os.path.join(ROOT_DIR, "sample_dry_soil.jpg")

    print(f"Testing Disease Prediction on: {disease_img}")
    if os.path.exists(disease_img):
        disease, conf = predict(disease_img)
        print(f"DISEASE RESULT: {disease} (Confidence: {conf*100:.2f}%)")
    else:
        print("Disease image not found!")

    print(f"\nTesting Soil Prediction on: {soil_img}")
    if os.path.exists(soil_img):
        soil, conf_soil, probs = predict_soil(soil_img, verbose=False)
        print(f"SOIL RESULT: {soil} (Confidence: {conf_soil*100:.2f}%)")
        print(f"PROBABILITIES: {probs[:3]}")
    else:
        print("Soil image not found!")

if __name__ == "__main__":
    test_predictions()
