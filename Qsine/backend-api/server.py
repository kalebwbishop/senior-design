from flask import Flask, request, jsonify, abort
from werkzeug.utils import secure_filename
import os
import json
import requests
import re

from classify import classify_obj

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = "D:/qsine/uploads"

# Ensure the upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

classify = classify_obj()

# Define allowed IPs (whitelist)
WHITELISTED_IPS = {"3.129.111.220", "127.0.0.1"}

@app.before_request
def limit_remote_addr():
    print('Request received')
    client_ip = request.remote_addr
    if client_ip not in WHITELISTED_IPS:
        print(f"Unauthorized access from {client_ip}")
        abort(403)  # Forbidden access

@app.route('/upload-image', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image part in the request"}), 400

    file = request.files['image']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if 'metadata' not in request.form:
        return jsonify({"error": "No metadata"}), 400
    
    metadata = request.form['metadata']

    try:
        metadata = json.loads(metadata)
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid metadata format"}), 400
    
    if 'name' not in metadata:
        return jsonify({"error": "No name in metadata"}), 400
    
    # TODO: Downsize the image before saving it

    if file:
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        return jsonify({"message": "Image successfully uploaded", "filename": filename}), 200
    
@app.route('/classify-image', methods=['POST'])
def classify_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image part in the request"}), 400

    file = request.files['image']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # if file:
    #     file.save(os.path.join(app.config['UPLOAD_FOLDER'], 'photo.jpg'))

    classification = classify.classify(os.path.join(app.config['UPLOAD_FOLDER'], 'photo.jpg'))
    # classification = "I don't know"

    return jsonify({"message": "Image successfully classified", "class": classification}), 200

@app.route('/barcode/<barcode>', methods=['GET'])
def get_barcode_product(barcode):
    if not barcode:
        return jsonify({"message": "No barcode provided"}), 400

    if not barcode.isdigit():
        return jsonify({"message": "Invalid barcode type"}), 400

    if len(barcode) != 12:
        return jsonify({"message": "Invalid barcode length"}), 400

    barcode_data_path = 'barcode_data.json'

    with open(barcode_data_path) as f:
        data = json.load(f)

        product = data.get(barcode)
        if product:
            return jsonify(product)
        else:

            def attempt_to_find_product(barcode):
                fdc_id = None
                response = requests.get(f'https://api1.myfooddata.com/autocomplete/{barcode}')
                if response.status_code == 200:
                    search_data = response.json()
                    if 'hits' in search_data and len(search_data['hits']) > 0:
                        fdc_id = search_data['hits'][0]['document']['fdc_id']

                if fdc_id:
                    headers = {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                    }
                    
                    response = requests.get(f'https://tools.myfooddata.com/nutrition-facts/{fdc_id}/wt1/1', headers=headers)
                    if response.status_code == 200:
                        match_name = re.search(r'"name":"(.*?)"', response.text)
                        match_company = re.search(r'"brand_owner":"(.*?)"', response.text)
                        match_ingredients = re.search(r'"ingredients":"(.*?)"', response.text)
                        if match_name and match_company and match_ingredients:
                            product = {
                                "name": match_name.group(1),
                                "company": match_company.group(1),
                                "ingredients": match_ingredients.group(1).lower().split(', ')
                            }

                            with open(barcode_data_path) as f:
                                data = json.load(f)
                                data[barcode] = product

                            with open(barcode_data_path, 'w') as f:
                                json.dump(data, f, indent=4)

                            return product
                    
                    return None
            
            product = attempt_to_find_product(barcode)
            print(product)

            if product:
                return jsonify(product)

            return jsonify({"message": "Product not found"}), 404

@app.route('/barcode/<barcode>', methods=['POST'])
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

    required_fields = ['name', 'company', 'ingredients']
    if not all(field in new_data for field in required_fields):
        return jsonify({"message": f"Missing required fields: {required_fields}"}), 400

    # Define the file path
    barcode_data_path = 'barcode_data.json'

    # Load existing data
    if not os.path.exists(barcode_data_path):
        # Create file if it doesn't exist
        with open(barcode_data_path, 'w') as f:
            json.dump({}, f)

    try:
        with open(barcode_data_path, 'r') as f:
            data = json.load(f)
    except json.JSONDecodeError:
        return jsonify({"message": "Failed to parse JSON file"}), 500

    # Update the data
    data[barcode] = new_data

    # Save updated data back to the file
    try:
        with open(barcode_data_path, 'w') as f:
            json.dump(data, f, indent=4)
    except Exception as e:
        return jsonify({"message": f"Failed to save data: {str(e)}"}), 500

    return jsonify({"message": "Barcode data updated successfully"}), 200

@app.route('/recipe/<name>', methods=['POST'])
def post_recipe(name):
    if 'image' not in request.files:
        return jsonify({"error": "No image part in the request"}), 400

    file = request.files['image']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    print(request.form.to_dict()['data'])
    
    if file:
        file.save(os.path.join('D:/qsine/scraped_data/images', name + '.jpg'))

        try:
            with open('D:/qsine/scraped_data/data.json') as f:
                data = json.load(f)
        except json.JSONDecodeError:
            data = []

        with open('D:/qsine/scraped_data/data.json', 'w') as f:
            new_data = json.loads(request.form.to_dict()['data'])
            new_data['image_path'] = os.path.join('D:/qsine/scraped_data/images', name + '.jpg').replace('\\', '/')
            data.append(new_data)
            json.dump(data, f, indent=4)

        return jsonify({"message": "Image successfully uploaded", "filename": name}), 200



if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)