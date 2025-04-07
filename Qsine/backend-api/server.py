from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import requests
from pymongo import MongoClient
from PIL import Image
import sys
import logging
import time
from logging.handlers import RotatingFileHandler
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        RotatingFileHandler(
            "app.log", maxBytes=10485760, backupCount=10
        ),  # 10MB per file, keep 10 backup files
        logging.StreamHandler(),  # Also log to console
    ],
)
logger = logging.getLogger(__name__)

sys.path.append("../custom_model")

from classify import infer_image

sys.path.append("../allergen-detector")

from test_model import ProcessRecipe, GetAllergenData

sys.path.append("../data")

from get_ingredients import get_ingredients_by_category


from helpers import attempt_to_find_product, clean_text

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = "./temp"

# Ensure the upload folder exists
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

# MongoDB setup
client = MongoClient(os.getenv("MONGODB_URI"))
db = client.get_database()
barcode_collection = db.barcodes


# Request logging middleware
@app.before_request
def log_request_info():
    logger.info(f"Request: {request.method} {request.url}")
    if request.is_json and request.get_data():
        try:
            logger.debug(f"Request JSON: {request.get_json()}")
        except Exception as e:
            logger.debug(f"Could not parse JSON: {str(e)}")
    elif request.files:
        logger.debug(f"Request files: {request.files}")
    elif request.form:
        logger.debug(f"Request form: {request.form}")


@app.after_request
def log_response_info(response):
    logger.info(f"Response: {response.status_code}")
    return response


@app.errorhandler(Exception)
def handle_exception(e):
    logger.error(f"Unhandled exception: {str(e)}", exc_info=True)
    return jsonify({"error": "An unexpected error occurred"}), 500


@app.route("/classify-image", methods=["POST"])
def classify_image():
    start_time = time.time()
    logger.info("Starting image classification")

    if "image" not in request.files:
        logger.warning("No image part in the request")
        return jsonify({"error": "No image part in the request"}), 400

    file = request.files["image"]
    logger.info(f"Received image: {file.filename}")

    file_path = os.path.join(app.config["UPLOAD_FOLDER"], "temp_classify.jpg")

    if file:
        file.save(file_path)
        logger.debug(f"Image saved to {file_path}")

    try:
        confidences, classifications = infer_image(file_path)
        classification = classifications[0]
        logger.info(f"Image classified as: {classification}")

        ingredients, _ = get_ingredients_by_category(classification)
        logger.info(f"Retrieved ingredients: {ingredients}")

        if not ingredients:
            logger.warning("No ingredients found for the classification")
            return (
                jsonify({"error": "No ingredients found for the classification"}),
                404,
            )

        allergens = ProcessRecipe(
            {"ingredients": ingredients[:20], "recipe_name": classification}
        )
        logger.info(f"Allergens detected: {allergens}")

        elapsed_time = time.time() - start_time
        logger.info(f"Image classification completed in {elapsed_time:.2f} seconds")

        return_item = {
            "classifications": classifications,
            "confidences": confidences,
            "ingredients": ingredients[:20],
            "allergens": allergens,
        }

        logger.info(f"Returning classification result: {return_item}")

        return (
            jsonify({"message": "Image successfully classified", "data": return_item}),
            200,
        )
    except Exception as e:
        logger.error(f"Error during image classification: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to classify image"}), 500


@app.route("/get-classification/<classification>", methods=["GET"])
def get_classification(classification):
    ingredients, _ = get_ingredients_by_category(classification)
    logger.info(f"Retrieved ingredients: {ingredients}")

    if not ingredients:
        logger.warning("No ingredients found for the classification")
        return (
            jsonify({"error": "No ingredients found for the classification"}),
            404,
        )

    allergens = ProcessRecipe(
        {"ingredients": ingredients[:20], "recipe_name": classification}
    )
    logger.info(f"Allergens detected: {allergens}")

    return_item = {
        "classification": classification,
        "ingredients": ingredients[:20],
        "allergens": allergens,
    }

    logger.info(f"Returning classification result: {return_item}")

    return (
        jsonify({"message": "Image successfully classified", "data": return_item}),
        200,
    )


@app.route("/barcode/<barcode>", methods=["GET"])
def get_barcode_product(barcode):
    logger.info(f"Looking up barcode: {barcode}")
    edit = request.args.get("edit", default="false").lower() == "true"

    if not barcode:
        logger.warning("No barcode provided")
        return jsonify({"message": "No barcode provided"}), 400

    if not barcode.isdigit():
        logger.warning(f"Invalid barcode type: {barcode}")
        return jsonify({"message": "Invalid barcode type"}), 400

    if len(barcode) != 12:
        logger.warning(f"Invalid barcode length: {barcode}")
        return jsonify({"message": "Invalid barcode length"}), 400

    # Get product from MongoDB
    product = barcode_collection.find_one({"_id": barcode})

    if not product:
        logger.info(
            f"Product not found in database for barcode: {barcode}, attempting external lookup"
        )
        product = attempt_to_find_product(barcode)

    if not product:
        logger.warning(f"Product not found for barcode: {barcode}")
        return jsonify({"message": "Product not found"}), 404

    # If the product is found, add the product to the database
    barcode_collection.update_one({"_id": barcode}, {"$set": product}, upsert=True)
    logger.info(f"Product saved/updated in database for barcode: {barcode}")

    if not edit:
        logger.info(f"Processing allergens for product: {product['name']}")
        allergens = ProcessRecipe(
            {"ingredients": product["ingredients"], "recipe_name": product["name"]}
        )
        logger.info(f"Allergens detected: {allergens}")
    else:
        allergens = None
        logger.info("Edit mode, skipping allergen processing")

    return jsonify({"product": product, "allergens": allergens}), 200


@app.route("/barcode/<barcode>", methods=["PUT"])
def update_barcode_product(barcode):
    logger.info(f"Updating barcode product: {barcode}")

    # Validate barcode
    if not barcode:
        logger.warning("No barcode provided for update")
        return jsonify({"message": "No barcode provided"}), 400

    if not barcode.isdigit():
        logger.warning(f"Invalid barcode type for update: {barcode}")
        return jsonify({"message": "Invalid barcode type"}), 400

    if len(barcode) != 12:
        logger.warning(f"Invalid barcode length for update: {barcode}")
        return jsonify({"message": "Invalid barcode length"}), 400

    # Validate request data
    new_data = request.get_json()
    if not new_data:
        logger.warning("No data provided for update")
        return jsonify({"message": "No data provided"}), 400

    new_data = new_data.get("product")

    required_fields = ["name", "company", "ingredients"]
    if not all(field in new_data for field in required_fields):
        logger.warning(
            f"Missing required fields for update: {[f for f in required_fields if f not in new_data]}"
        )
        return jsonify({"message": f"Missing required fields: {required_fields}"}), 400

    try:
        # Update or insert the document in MongoDB
        barcode_collection.update_one({"_id": barcode}, {"$set": new_data}, upsert=True)
        logger.info(f"Successfully updated product for barcode: {barcode}")
    except Exception as e:
        logger.error(
            f"Failed to save data for barcode {barcode}: {str(e)}", exc_info=True
        )
        return jsonify({"message": f"Failed to save data: {str(e)}"}), 500

    return jsonify({"message": "Barcode data updated successfully"}), 200


@app.route("/upload-text-image/<lang>", methods=["POST"])
def upload_text_image(lang):
    logger.info(f"Processing text image with language: {lang}")
    OCR_API_URL = "https://api.ocr.space/parse/image"
    OCR_API_KEY = os.environ.get("OCR_API_KEY")

    if "image" not in request.files:
        logger.warning("No image part in the request for text extraction")
        return jsonify({"error": "No image part in the request"}), 400

    file = request.files["image"]
    logger.info(f"Received image for text extraction: {file.filename}")

    # Save the uploaded image to a temporary file
    file_path = os.path.join("temp", secure_filename(file.filename))

    # Ensure the temp directory exists
    os.makedirs("temp", exist_ok=True)

    # Check the file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)

    logger.debug(f"Image file size: {file_size} bytes")

    # If the file size exceeds 1 MB, resize the image
    if file_size > 1 * 1024 * 1024:  # 1 MB in bytes
        logger.info("Image exceeds 1MB, resizing")
        with Image.open(file) as img:
            img = img.convert("RGB")  # Ensure the image is in RGB mode
            img.thumbnail((1024, 1024))  # Resize the image to a maximum of 1024x1024
            img.save(file_path, format="JPEG", quality=85)  # Save with reduced quality
    else:
        file.save(file_path)
        logger.debug(f"Image saved to {file_path}")

    filename = file_path

    # Prepare the image for the OCR API
    payload = {
        "isOverlayRequired": False,
        "apikey": OCR_API_KEY,
        "language": lang,
    }

    # Send image to OCR API
    try:
        with open(filename, "rb") as f:
            logger.info("Sending image to OCR API")
            response = requests.post(OCR_API_URL, files={filename: f}, data=payload)

        if response.status_code == 200:
            logger.info("OCR API request successful")
            result = response.json()
            logger.debug(f"OCR API response: {result}")
            cleaned_text = clean_text(
                result.get("ParsedResults", [{}])[0].get("ParsedText", "None")
            )
            logger.info(f"Cleaned text extracted: {cleaned_text[:100]}...")
            return (
                jsonify(
                    {"message": "Image successfully processed", "text": cleaned_text}
                ),
                200,
            )
        else:
            logger.error(
                f"OCR API request failed with status code: {response.status_code}"
            )
            return (
                jsonify({"error": "Failed to process image", "details": response.text}),
                response.status_code,
            )
    except Exception as e:
        logger.error(f"Error during OCR processing: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to process image"}), 500


@app.route("/classify-text", methods=["POST"])
def classify_text():
    logger.info("Starting text classification")
    text = request.get_json().get("text")
    logger.debug(f"Received text for classification: {text[:100]}...")

    # classification = infer_text(text)
    classification = "cookies"
    logger.info(f"Text classified as: {classification}")

    ingredients, _ = get_ingredients_by_category(classification)

    logger.debug(f"Retrieved ingredients: {ingredients}")

    allergens = ProcessRecipe(
        {"ingredients": ingredients[:20], "recipe_name": classification}
    )
    logger.info(f"Allergens detected: {allergens}")

    return_item = {
        "classifications": [classification],
        "ingredients": ingredients[:20],
        "allergens": allergens,
    }

    return (
        jsonify({"message": "Text successfully classified", "data": return_item}),
        200,
    )


@app.route("/get-allergens", methods=["GET"])
def get_allergens():
    logger.info("Retrieving allergen list")
    allergens = GetAllergenData()
    logger.debug(f"Retrieved allergens: {allergens}")

    allergen_list = [
        {"name": allergen, "id": allergen.lower().replace(" ", "_").replace("-", "_")}
        for allergen in allergens
        if allergen != "None"
    ]
    logger.info(f"Returning {len(allergen_list)} allergens")

    return jsonify(allergen_list), 200


if __name__ == "__main__":
    logger.info("Starting Flask application")
    app.run(debug=True, host="0.0.0.0", port=5001)
