import os
import json
import urllib.request
import numpy as np
import tensorflow as tf
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
SOIL_TEST_DIR = BASE_DIR / "Dataset" / "soil_classification" / "test"
UPLOADS_DIR = BASE_DIR.parent / "backend" / "uploads"
TEMP_DIR = BASE_DIR / "temp_test_images"

# Map models to label files
MODEL_CONFIG = {
    "plant_disease_model.keras": {
        "labels": "labels.json",
        "normalize": True
    },
    "soil_classifier.keras": {
        "labels": "soil_labels.json",
        "normalize": False
    },
    "soil_classifier_v2.keras": {
        "labels": "soil_labels_v2.json",
        "normalize": False
    },
    "soil_classifier_v3.keras": {
        "labels": "soil_labels_v3.json",
        "normalize": False
    },
    "soil_classifier_v4.keras": {
        "labels": "soil_labels_v4.json",
        "normalize": False
    }
}

# Unsplash fallback images of leaves to test plant disease model if no uploads exist
PLANT_IMAGE_URLS = {
    "pepper_leaf.jpg": "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=400",
    "tomato_leaf.jpg": "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=400",
    "potato_leaf.jpg": "https://images.unsplash.com/photo-1598902108854-10e335adac99?auto=format&fit=crop&q=80&w=400"
}

def get_plant_test_images():
    print("\n--- Identifying Plant Disease Test Images ---")
    plant_paths = []
    
    # 1. First look in backend/uploads
    if UPLOADS_DIR.exists():
        uploads = [
            f for f in UPLOADS_DIR.iterdir() 
            if f.is_file() and f.suffix.lower() in ['.jpg', '.jpeg', '.png']
        ]
        if uploads:
            # Pick up to 4 images
            # Sort by name or size to be deterministic
            uploads.sort(key=lambda x: x.name)
            selected = uploads[:4]
            for img in selected:
                plant_paths.append(img)
                print(f"Selected upload image for testing: backend/uploads/{img.name}")
            
    # 2. If no uploads exist, download fallbacks with a strict timeout
    if not plant_paths:
        TEMP_DIR.mkdir(exist_ok=True)
        print("No uploaded images found in backend/uploads. Downloading fallback images...")
        for name, url in PLANT_IMAGE_URLS.items():
            dest = TEMP_DIR / name
            if not dest.exists():
                try:
                    print(f"Downloading {name} (timeout 5s)...")
                    with urllib.request.urlopen(url, timeout=5) as conn:
                        with open(dest, 'wb') as f:
                            f.write(conn.read())
                    print(f"Saved to {dest}")
                except Exception as e:
                    print(f"Failed to download {name}: {e}")
            else:
                print(f"Using cached plant test image: {name}")
                
            if dest.exists():
                plant_paths.append(dest)
                
    return plant_paths

def get_soil_test_images():
    soil_paths = []
    if not SOIL_TEST_DIR.exists():
        print(f"\n[Warning] Soil test directory not found at: {SOIL_TEST_DIR.resolve()}")
        return soil_paths
        
    print("\n--- Identifying Soil Test Images ---")
    subdirs = sorted([d for d in SOIL_TEST_DIR.iterdir() if d.is_dir()])
    
    # Select 1 image from 3 different soil types
    count = 0
    for subdir in subdirs:
        images = sorted([f for f in subdir.iterdir() if f.is_file() and f.suffix.lower() in ['.jpg', '.jpeg', '.png']])
        if images:
            img_path = images[0]
            soil_paths.append(img_path)
            print(f"Selected soil test image: {subdir.name}/{img_path.name}")
            count += 1
            if count >= 3:
                break
                
    return soil_paths

def validate_labels(label_file, expected_classes):
    label_path = MODELS_DIR / label_file
    if not label_path.exists():
        return False, f"Labels file missing at {label_path.resolve()}"
        
    try:
        with open(label_path, "r", encoding="utf-8-sig") as f:
            labels_dict = json.load(f)
            
        # Check type
        if not isinstance(labels_dict, dict):
            return False, "Labels JSON root is not a dictionary"
            
        num_labels = len(labels_dict)
        
        # Verify classes matches output shape
        if num_labels != expected_classes:
            return False, f"Number of labels ({num_labels}) does not match model output classes ({expected_classes})"
            
        # Verify indices (e.g. "0" to "num_labels - 1")
        indices = sorted([int(k) for k in labels_dict.keys()])
        expected_indices = list(range(num_labels))
        if indices != expected_indices:
            return False, f"Label indices are not consecutive integers starting from 0. Found: {list(labels_dict.keys())}"
            
        # Check for empty/missing labels
        for idx in expected_indices:
            if not labels_dict[str(idx)]:
                return False, f"Label index {idx} has an empty or null value"
                
        return True, labels_dict
        
    except Exception as e:
        return False, f"Failed to parse labels file: {e}"

def load_and_preprocess(image_path, target_size=(224, 224), normalize=False):
    # Use tf.keras.utils to load and preprocess
    img = tf.keras.utils.load_img(str(image_path), target_size=target_size, color_mode="rgb")
    img_array = tf.keras.utils.img_to_array(img)
    img_array = img_array.astype("float32")
    if normalize:
        img_array /= 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

def run_validation():
    print("==================================================================")
    print("TF/KERAS VIRTUAL ENVIRONMENT CHECK")
    print("==================================================================")
    print(f"TensorFlow Version: {tf.__version__}")
    print(f"Keras Version: {tf.keras.__version__ if hasattr(tf.keras, '__version__') else 'Embedded in TF'}")
    print(f"GPU Available: {len(tf.config.list_physical_devices('GPU')) > 0}")
    print("==================================================================\n")
    
    # 1. Models and Labels Verification
    loaded_models = {}
    
    print("==================================================================")
    print("MODEL & LABELS VALIDATION SUMMARY")
    print("==================================================================")
    
    for model_name, cfg in MODEL_CONFIG.items():
        model_path = MODELS_DIR / model_name
        label_file = cfg["labels"]
        
        print(f"MODEL NAME: {model_name}")
        
        if not model_path.exists():
            print(f"STATUS: FAILED (Model file not found at {model_path.resolve()})")
            print("-" * 66)
            continue
            
        try:
            # Load Keras Model
            print(f"Loading {model_name}...")
            model = tf.keras.models.load_model(str(model_path))
            
            # Inspect properties
            input_shape = model.input_shape
            output_shape = model.output_shape
            num_classes = output_shape[-1]
            
            # Verify Labels
            labels_ok, labels_res = validate_labels(label_file, num_classes)
            
            print(f"INPUT SHAPE: {input_shape}")
            print(f"OUTPUT SHAPE: {output_shape}")
            print(f"NUMBER OF CLASSES: {num_classes}")
            print(f"LABEL FILE: {label_file}")
            
            if labels_ok:
                print(f"NUMBER OF LABELS: {len(labels_res)}")
                print("STATUS: SUCCESS")
                loaded_models[model_name] = {
                    "model": model,
                    "labels": labels_res,
                    "normalize": cfg["normalize"],
                    "input_size": (input_shape[1], input_shape[2]) if len(input_shape) >= 3 else (224, 224)
                }
            else:
                print(f"NUMBER OF LABELS: Error ({labels_res})")
                print("STATUS: LABELS_VALIDATION_FAILED")
                
        except Exception as e:
            print(f"STATUS: FAILED_TO_LOAD (Error: {e})")
            
        print("-" * 66)
        
    # 2. Prepare images
    plant_images = get_plant_test_images()
    soil_images = get_soil_test_images()
    
    # 3. Predictions
    print("\n==================================================================")
    print("RUNNING MODEL TEST PREDICTIONS")
    print("==================================================================")
    
    # Test plant model
    plant_model_name = "plant_disease_model.keras"
    if plant_model_name in loaded_models:
        print(f"\n--- Testing Plant Disease Model ({plant_model_name}) ---")
        model_data = loaded_models[plant_model_name]
        model = model_data["model"]
        labels = model_data["labels"]
        normalize = model_data["normalize"]
        size = model_data["input_size"]
        
        for img_path in plant_images:
            try:
                img_array = load_and_preprocess(img_path, target_size=size, normalize=normalize)
                preds = model.predict(img_array, verbose=0)[0]
                
                # Get top 3 predictions
                top_indices = np.argsort(preds)[::-1][:3]
                
                print(f"\nImage: {img_path.name}")
                for idx, class_idx in enumerate(top_indices):
                    class_name = labels[str(class_idx)]
                    confidence = preds[class_idx] * 100
                    print(f"{idx+1}. {class_name.replace('___', ' - ').replace('_', ' ')} - {confidence:.2f}%")
            except Exception as e:
                print(f"Error predicting image {img_path.name}: {e}")
                
    # Test soil models
    soil_models = ["soil_classifier.keras", "soil_classifier_v2.keras", "soil_classifier_v3.keras", "soil_classifier_v4.keras"]
    for soil_model_name in soil_models:
        if soil_model_name in loaded_models:
            print(f"\n--- Testing Soil Model ({soil_model_name}) ---")
            model_data = loaded_models[soil_model_name]
            model = model_data["model"]
            labels = model_data["labels"]
            normalize = model_data["normalize"]
            size = model_data["input_size"]
            
            for img_path in soil_images:
                try:
                    img_array = load_and_preprocess(img_path, target_size=size, normalize=normalize)
                    preds = model.predict(img_array, verbose=0)[0]
                    
                    # Get top 3 predictions
                    top_indices = np.argsort(preds)[::-1][:3]
                    
                    print(f"\nImage: {img_path.parent.name}/{img_path.name}")
                    for idx, class_idx in enumerate(top_indices):
                        class_name = labels[str(class_idx)]
                        confidence = preds[class_idx] * 100
                        print(f"{idx+1}. {class_name.replace('_', ' ')} - {confidence:.2f}%")
                except Exception as e:
                    print(f"Error predicting image {img_path.name}: {e}")

if __name__ == "__main__":
    run_validation()
