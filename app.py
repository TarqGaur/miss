from flask import Flask, jsonify, request
from flask_cors import CORS
from cloudinary.utils import api_sign_request
import time
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure CORS for GitHub Pages domain
allowed_origins = ["https://tarqgaur.github.io"]
# You can add more origins if needed, like localhost for development
# allowed_origins.append("http://localhost:5000")

cors_config = {
    "origins": allowed_origins,
    "methods": ["GET", "POST", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}
CORS(app, resources={r"/*": cors_config})

# Configure Cloudinary
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

@app.route("/generate-signature", methods=["POST", "OPTIONS"])
def generate_signature():
    # Handle OPTIONS request for preflight
    if request.method == "OPTIONS":
        return "", 200
        
    # Get user data from request
    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400
        
    user_uid = data.get("user_uid", "")
    user_name = data.get("user_name", "")
    
    # Validate required fields
    if not user_uid:
        return jsonify({"error": "user_uid is required"}), 400
    
    timestamp = int(time.time())
    params_to_sign = {
        "timestamp": timestamp,
        "upload_preset": "signed_upload",
        "context": f"user_uid={user_uid}|user_name={user_name}"
    }
    
    # Make sure we have the Cloudinary secret
    if not CLOUDINARY_API_SECRET:
        return jsonify({"error": "Cloudinary API Secret is not configured"}), 500
        
    signature = api_sign_request(params_to_sign, CLOUDINARY_API_SECRET)
    
    return jsonify({
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": CLOUDINARY_CLOUD_NAME,
        "api_key": CLOUDINARY_API_KEY,
        "user_uid": user_uid,
        "user_name": user_name
    })

# Add a simple health check endpoint
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", debug=False, port=port)