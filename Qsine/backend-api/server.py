from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import json
import requests
import re

from classify import classify

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads/'

# Ensure the upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

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

    if file:
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], 'temp.jpg'))

    classification = classify()

    return jsonify({"message": "Image successfully classified", "class": classification}), 200

@app.route('/barcode/<barcode>', methods=['GET'])
def get_barcode_product(barcode):

    if not barcode:
        return jsonify({"message": "No barcode provided"}), 400

    if not barcode.isdigit():
        return jsonify({"message": "Invalid barcode type"}), 400

    if len(barcode) != 12:
        return jsonify({"message": "Invalid barcode length"}), 400

    with open('data.json') as f:
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

                            with open('data.json') as f:
                                data = json.load(f)
                                data[barcode] = product

                            with open('data.json', 'w') as f:
                                json.dump(data, f, indent=4)

                            return product
                    
                    return None
            
            product = attempt_to_find_product(barcode)
            print(product)

            if product:
                return jsonify(product)

            return jsonify({"message": "Product not found"}), 404

if __name__ == '__main__':
    app.run(debug=True, host='192.168.5.63', port=5000)