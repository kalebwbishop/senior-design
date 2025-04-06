from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import requests
from pymongo import MongoClient
from PIL import Image
import sys
from dotenv import load_dotenv

load_dotenv()

sys.path.append("../custom_model")

from classify import infer_image

sys.path.append("../allergen-detector")

from test_model import ProcessRecipe, GetAllergenData
from helpers import attempt_to_find_product, clean_text

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = "./temp"

# Ensure the upload folder exists
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

# MongoDB setup
client = MongoClient(os.getenv('MONGODB_URI'))
db = client.get_database()
barcode_collection = db.barcodes

@app.route("/classify-image", methods=["POST"])
def classify_image():
    if "image" not in request.files:
        return jsonify({"error": "No image part in the request"}), 400

    file = request.files["image"]

    file_path = os.path.join(app.config["UPLOAD_FOLDER"], "temp_classify.jpg")

    if file:
        file.save(file_path)

    classification = infer_image(file_path)

    return jsonify({"message": "Image successfully classified", "data": classification}), 200


@app.route("/barcode/<barcode>", methods=["GET"])
def get_barcode_product(barcode):
    edit = request.args.get("edit", default="false").lower() == "true"

    if not barcode:
        return jsonify({"message": "No barcode provided"}), 400

    if not barcode.isdigit():
        return jsonify({"message": "Invalid barcode type"}), 400

    if len(barcode) != 12:
        return jsonify({"message": "Invalid barcode length"}), 400

    # Get product from MongoDB
    product = barcode_collection.find_one({"_id": barcode})
    
    if not product:
        product = attempt_to_find_product(barcode)

    if not product:
        return jsonify({"message": "Product not found"}), 404
    
    # If the product is found, add the product to the database
    barcode_collection.update_one(
        {"_id": barcode},
        {"$set": product},
        upsert=True
    )

    if not edit:
        allergens = ProcessRecipe(
            {"ingredients": product["ingredients"], "recipe_name": product["name"]}
        )
        print(allergens)
    else:
        allergens = None

    return jsonify({"product": product, "allergens": allergens}), 200


@app.route("/barcode/<barcode>", methods=["PUT"])
def update_barcode_product(barcode):
    # Validate barcode
    if not barcode:
        return jsonify({"message": "No barcode provided"}), 400

    if not barcode.isdigit():
        return jsonify({"message": "Invalid barcode type"}), 400

    if len(barcode) != 12:
        return jsonify({"message": "Invalid barcode length"}), 400

    # Validate request data
    new_data = request.get_json()
    if not new_data:
        return jsonify({"message": "No data provided"}), 400

    new_data = new_data.get("product")

    required_fields = ["name", "company", "ingredients"]
    if not all(field in new_data for field in required_fields):
        return jsonify({"message": f"Missing required fields: {required_fields}"}), 400

    try:
        # Update or insert the document in MongoDB
        barcode_collection.update_one(
            {"_id": barcode},
            {"$set": new_data},
            upsert=True
        )
    except Exception as e:
        return jsonify({"message": f"Failed to save data: {str(e)}"}), 500

    return jsonify({"message": "Barcode data updated successfully"}), 200


@app.route("/upload-text-image/<lang>", methods=["POST"])
def upload_text_image(lang):
    OCR_API_URL = "https://api.ocr.space/parse/image"
    OCR_API_KEY = os.environ.get("OCR_API_KEY")
    if "image" not in request.files:
        return jsonify({"error": "No image part in the request"}), 400

    file = request.files["image"]

    # Save the uploaded image to a temporary file
    file_path = os.path.join("temp", secure_filename(file.filename))

    # Ensure the temp directory exists
    os.makedirs("temp", exist_ok=True)

    # Check the file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)

    # If the file size exceeds 1 MB, resize the image
    if file_size > 1 * 1024 * 1024:  # 1 MB in bytes
        with Image.open(file) as img:
            img = img.convert("RGB")  # Ensure the image is in RGB mode
            img.thumbnail((1024, 1024))  # Resize the image to a maximum of 1024x1024
            img.save(file_path, format="JPEG", quality=85)  # Save with reduced quality
    else:
        file.save(file_path)

    filename = file_path

    # Prepare the image for the OCR API
    payload = {
        "isOverlayRequired": False,
        "apikey": OCR_API_KEY,
        "language": lang,
    }

    # Send image to OCR API
    with open(filename, "rb") as f:
        response = requests.post(OCR_API_URL, files={filename: f}, data=payload)

    if response.status_code == 200:
        print(f"Response: {response.json()}")
        cleaned_text = clean_text(
            response.json().get("ParsedResults", [{}])[0].get("ParsedText", "None")
        )
        print(f"Cleaned text: {cleaned_text}")
        return (
            jsonify({"message": "Image successfully processed", "text": cleaned_text}),
            200,
        )
    else:
        return (
            jsonify({"error": "Failed to process image", "details": response.text}),
            response.status_code,
        )
    
@app.route("/classify-text", methods=["POST"])
def classify_text():
    text = request.get_json().get("text")
    classification = infer_text(text)
    return jsonify({"message": "Text successfully classified", "classification": classification}), 200


@app.route("/get-allergens", methods=["GET"])
def get_allergens():
    allergens = GetAllergenData()

    allergen_list = [
        {"name": allergen, "id": allergen.lower().replace(" ", "_").replace("-", "_")}
        for allergen in allergens
        if allergen != "None"
    ]

    return jsonify(allergen_list), 200


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
