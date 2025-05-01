# Configure Cloudinary


from flask import Flask, jsonify, request
from flask_cors import CORS
from cloudinary.utils import api_sign_request
import time
from dotenv import load_dotenv
import os


load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/generate-signature": {"origins": "http://127.0.0.1:5500"}})  # Allow only Live Server origin

# Configure Cloudinary
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")  # Replace with your Cloud Name
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")  # Replace with your API Key
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")  # Replace with your API Secret

@app.route("/generate-signature", methods=["POST"])
def generate_signature():
    # Get user data from request
    data = request.get_json()
    user_uid = data.get("user_uid", "")
    user_name = data.get("user_name", "")

    timestamp = int(time.time())
    params_to_sign = {
        "timestamp": timestamp,
        "upload_preset": "signed_upload",
        "context": f"user_uid={user_uid}|user_name={user_name}"
    }
    signature = api_sign_request(params_to_sign, CLOUDINARY_API_SECRET)
    return jsonify({
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": CLOUDINARY_CLOUD_NAME,
        "api_key": CLOUDINARY_API_KEY,
        "user_uid": user_uid,
        "user_name": user_name
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)