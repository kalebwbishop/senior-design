from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import json

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

@app.route('/barcode/<barcode>', methods=['GET'])
def get_barcode_product(barcode):

    if not barcode:
        return jsonify({"error": "No barcode provided"}), 400

    if not barcode.isdigit():
        return jsonify({"error": "Invalid barcode type"}), 400

    if len(barcode) != 12:
        return jsonify({"error": "Invalid barcode length"}), 400

    with open('data.json') as f:
        data = json.load(f)

        product = data.get(barcode)
        if product:
            return jsonify(product)
        else:
            return jsonify({"error": "Product not found"}), 404

if __name__ == '__main__':
    app.run(debug=True, host='192.168.5.69')