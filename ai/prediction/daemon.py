# Warm Python HTTP Daemon Server for KrishiMitra AI Disease & Soil Vision Models

import os
import sys

# Force UTF-8 encoding for stdout on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.environ.setdefault("KERAS_BACKEND", "tensorflow")
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

# Setup paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)

if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

# Pre-load predictors once into RAM
print("[Python Vision Daemon] Initializing TensorFlow model predictors into memory...", flush=True)

from prediction.predictor import predict as predict_disease
from prediction.soil_predictor import predict_soil

print("[Python Vision Daemon] [OK] Models loaded into memory and ready for warm inference.", flush=True)


PORT = int(os.environ.get("VISION_DAEMON_PORT", 5005))


class VisionRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "ready": True}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == '/predict':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                payload = json.loads(post_data.decode('utf-8'))
                image_path = payload.get('image_path')
                mode = payload.get('mode', 'disease')

                if not image_path or not os.path.exists(image_path):
                    self._send_json({"success": False, "error": "Image file not found."}, status=400)
                    return

                if mode == "soil":
                    soil, confidence, class_probs = predict_soil(image_path, verbose=False)
                    probabilities_dict = {
                        cls_name: round(float(prob) * 100, 2)
                        for cls_name, prob in class_probs
                    }
                    result = {
                        "success": True,
                        "disease": soil,
                        "soil": soil,
                        "confidence": round(float(confidence) * 100, 2),
                        "probabilities": probabilities_dict
                    }
                else:
                    disease, confidence = predict_disease(image_path)
                    result = {
                        "success": True,
                        "disease": disease,
                        "confidence": round(float(confidence) * 100, 2)
                    }

                self._send_json(result)

            except Exception as e:
                self._send_json({"success": False, "error": str(e)}, status=500)
        else:
            self.send_response(404)
            self.end_headers()

    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def log_message(self, format, *args):
        # Suppress standard HTTP access logging to keep console output clean
        pass

def run():
    server_address = ('127.0.0.1', PORT)
    httpd = HTTPServer(server_address, VisionRequestHandler)
    print(f"[Python Vision Daemon] Server running on http://127.0.0.1:{PORT}", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Python Vision Daemon] Shutting down...", flush=True)
        httpd.server_close()


if __name__ == "__main__":
    run()
