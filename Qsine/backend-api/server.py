from flask import Flask, request, jsonify, abort
from werkzeug.utils import secure_filename
import os
import json
import requests
import re


from classify2 import classify_obj
from PIL import Image
import base64
import sys
from dotenv import load_dotenv

load_dotenv()

sys.path.append("../custom_model")

from classify import infer_image

sys.path.append("../allergen-detector")

from test_model import ProcessRecipe, GetAllergenData

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = "D:/qsine/uploads"

# Ensure the upload folder exists
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

classify = classify_obj()

# Define allowed IPs (whitelist)
WHITELISTED_IPS = {"3.129.111.220", "127.0.0.1"}


@app.before_request
def limit_remote_addr():
    print("Request received")
    client_ip = request.remote_addr
    # if client_ip not in WHITELISTED_IPS:
    #     print(f"Unauthorized access from {client_ip}")
    #     abort(403)  # Forbidden access


@app.route("/classify-image", methods=["POST"])
def classify_image():
    if "image" not in request.files:
        return jsonify({"error": "No image part in the request"}), 400

    file = request.files["image"]

    file_path = os.path.join(app.config["UPLOAD_FOLDER"], "temp_classify.jpg")

    if file:
        file.save(file_path)

    # Open the saved image
    with Image.open(file_path) as img:
        # Convert the image to RGB mode if not already
        img = img.convert("RGB")
        # Get the width and height of the image
        width, height = img.size
        # Create an array of hex values for the entire image
        hex_array = [
            ["#{:02x}{:02x}{:02x}".format(*img.getpixel((x, y))) for x in range(width)]
            for y in range(height)
        ]
        print(f"Hex array: {hex_array}")

    # classification = classify.classify(file_path)
    # print(classification)

    return jsonify({"message": "Image successfully classified", "data": hex_array}), 200


@app.route("/barcode/<barcode>", methods=["GET"])
def get_barcode_product(barcode):
    edit = request.args.get("edit", default="false").lower() == "true"

    if not barcode:
        return jsonify({"message": "No barcode provided"}), 400

    if not barcode.isdigit():
        return jsonify({"message": "Invalid barcode type"}), 400

    if len(barcode) != 12:
        return jsonify({"message": "Invalid barcode length"}), 400

    barcode_data_path = "barcode_data.json"

    with open(barcode_data_path) as f:
        data = json.load(f)

        product = data.get(barcode)
        if not product:

            def attempt_to_find_product(barcode):
                fdc_id = None
                response = requests.get(
                    f"https://api1.myfooddata.com/autocomplete/{barcode}"
                )
                if response.status_code == 200:
                    search_data = response.json()
                    if "hits" in search_data and len(search_data["hits"]) > 0:
                        fdc_id = search_data["hits"][0]["document"]["fdc_id"]

                if fdc_id:
                    headers = {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                    }

                    response = requests.get(
                        f"https://tools.myfooddata.com/nutrition-facts/{fdc_id}/wt1/1",
                        headers=headers,
                    )
                    if response.status_code == 200:
                        match_name = re.search(r'"name":"(.*?)"', response.text)
                        match_company = re.search(
                            r'"brand_owner":"(.*?)"', response.text
                        )
                        match_ingredients = re.search(
                            r'"ingredients":"(.*?)"', response.text
                        )
                        if match_name and match_company and match_ingredients:
                            product = {
                                "name": match_name.group(1),
                                "company": match_company.group(1),
                                "ingredients": match_ingredients.group(1)
                                .lower()
                                .split(", "),
                            }

                            with open(barcode_data_path) as f:
                                data = json.load(f)
                                data[barcode] = product

                            with open(barcode_data_path, "w") as f:
                                json.dump(data, f, indent=4)

                            return product

                    return None

            product = attempt_to_find_product(barcode)
            print(product)

        if not product:
            return jsonify({"message": "Product not found"}), 404

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

    # Define the file path
    barcode_data_path = "barcode_data.json"

    # Load existing data
    if not os.path.exists(barcode_data_path):
        # Create file if it doesn't exist
        with open(barcode_data_path, "w") as f:
            json.dump({}, f)

    try:
        with open(barcode_data_path, "r") as f:
            data = json.load(f)
    except json.JSONDecodeError:
        return jsonify({"message": "Failed to parse JSON file"}), 500

    # Update the data
    data[barcode] = new_data

    # Save updated data back to the file
    try:
        with open(barcode_data_path, "w") as f:
            json.dump(data, f, indent=4)
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

    def clean_text(text):
        # Remove unwanted characters and newlines
        text = re.sub(r"[^\w\s,.]", "", text)
        text = re.sub(r"\s+", " ", text)

        text = text.strip()

        return text

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


@app.route("/upload-image", methods=["POST"])
def upload_image():
    if "image" not in request.files:
        return jsonify({"error": "No image part in the request"}), 400

    file = request.files["image"]

    # Save the uploaded image to a temporary file
    file_path = os.path.join(
        app.config["UPLOAD_FOLDER"], secure_filename(file.filename)
    )

    # Ensure the upload folder exists
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # Save the file
    file.save(file_path)

    classification = infer_image(file_path)

    print(f"Classification: {classification}")

    return (
        jsonify(
            {"message": "Image successfully uploaded", "classification": classification}
        ),
        200,
    )


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
