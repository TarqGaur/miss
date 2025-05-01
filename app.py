# app.py

from flask import Flask, jsonify, request
from flask_cors import CORS
from cloudinary.utils import api_sign_request
import time
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Fix CORS: allow all routes from specific origin
CORS(app, supports_credentials=True, origins=["https://tarqgaur.github.io"])

# Cloudinary credentials from .env file
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

@app.route("/generate-signature", methods=["POST"])
def generate_signature():
    try:
        # Get JSON data from request
        data = request.get_json()
        user_uid = data.get("user_uid", "")
        user_name = data.get("user_name", "")

        # Create signature
        timestamp = int(time.time())
        params_to_sign = {
            "timestamp": timestamp,
            "upload_preset": "signed_upload",
            "context": f"user_uid={user_uid}|user_name={user_name}"
        }

        signature = api_sign_request(params_to_sign, CLOUDINARY_API_SECRET)

        # Return response
        return jsonify({
            "signature": signature,
            "timestamp": timestamp,
            "cloud_name": CLOUDINARY_CLOUD_NAME,
            "api_key": CLOUDINARY_API_KEY,
            "user_uid": user_uid,
            "user_name": user_name
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Run app locally (disable when deployed on Render or similar)
if __name__ == "__main__":
    app.run(debug=True, port=5000)
