import os
import sys

# Suppress TensorFlow logging and reduce memory footprint
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("TF_NUM_INTRAOP_THREADS", "1")
os.environ.setdefault("TF_NUM_INTEROP_THREADS", "1")

import json

# Set up paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)

if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

def main():
    try:
        if len(sys.argv) < 2:
            print(json.dumps({
                "success": False,
                "error": "No image path provided."
            }))
            return

        image_path = sys.argv[1]
        
        mode = "disease"
        if len(sys.argv) > 2:
            mode = sys.argv[2]
        
        if not os.path.exists(image_path):
            print(json.dumps({
                "success": False,
                "error": "Image file not found."
            }))
            return
            
        if mode == "soil":
            # Call the soil predictor (lazy import to save RAM)
            from prediction.soil_predictor import predict_soil
            soil, confidence, class_probs = predict_soil(image_path, verbose=False)
            
            # Build probabilities dictionary with numeric percentages
            probabilities_dict = {
                cls_name: round(float(prob) * 100, 2)
                for cls_name, prob in class_probs
            }
            
            result = {
                "success": True,
                "disease": soil, # keeping "disease" for backwards compatibility
                "soil": soil,
                "confidence": round(float(confidence) * 100, 2),
                "probabilities": probabilities_dict
            }
        else:
            # Call the plant disease predictor (lazy import to save RAM)
            from prediction.predictor import predict
            disease, confidence = predict(image_path)
            
            result = {
                "success": True,
                "disease": disease,
                "confidence": round(float(confidence) * 100, 2)
            }
        
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))

if __name__ == "__main__":
    main()