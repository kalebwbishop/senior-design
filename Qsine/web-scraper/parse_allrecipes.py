import requests
from bs4 import BeautifulSoup
import json
import os
from urllib.parse import urlparse
from PIL import Image
from io import BytesIO
import hashlib
import time
import random
from flask import Flask, request, jsonify, abort

app = Flask(__name__)

class AllrecipesParse():
    def __init__(self):
        self.links_file_path = 'links.json'
        self.paresed_data_file_path = 'data.json'
        
        self.load()

    def load(self):
        try:
            response = requests.get('http://senior-design-jhmb.onrender.com/recipes')

            if response.status_code != 200:
                raise FileNotFoundError
            
            self.parsed_data = response.json()

            self.parsed_urls = set([recipe['recipe_url'] for recipe in self.parsed_data])

        except FileNotFoundError:
            self.parsed_data = []
            self.parsed_urls = set()

        with open(self.links_file_path, 'r') as file:
            data = json.load(file)

        urls = set(data['checked_urls'] + data['to_check_urls'])

        self.to_parse_urls = [url for url in urls if url not in self.parsed_urls]
        self.to_parse_urls = random.sample(self.to_parse_urls, len(self.to_parse_urls))

        print(f"Loaded {len(self.to_parse_urls)} URLs to parse")

    def download_image(self, name, url, save_folder='D:/qsine/scraped_data/images', data=None):
        # Parse the URL to get the image name
        parsed_url = urlparse(url)
        image_name = os.path.basename(parsed_url.path)
        
        # Get the image file type from the URL
        file_type = os.path.splitext(image_name)[1]

        # Create the save folder if it doesn't exist
        if not os.path.exists(save_folder):
            os.makedirs(save_folder)

        # Full path to save the image
        save_path = os.path.join(save_folder, str(name) + file_type).replace('\\', '/')

        # Check if the image already exists
        if os.path.exists(save_path):
            print(f"Image already exists: {save_path}")
            return save_path

        # Download the image
        response = requests.get(url)
        if response.status_code == 200:
            # Send the image to my api
            requests.post(
                'http://senior-design-jhmb.onrender.com/recipe/' + name,
                files={'image': ('image.jpg', BytesIO(response.content), 'image/jpeg')},
                data={'data': json.dumps(data)}
            )

            print(f"Image successfully downloaded: {save_path}")
            return save_path
        else:
            print(f"Failed to download image. Status code: {response.status_code}")
            return ""

    def parse(self, download_images=False):
        count = 100

        while len(self.to_parse_urls) > 0:
            curr_url = self.to_parse_urls.pop()
            print(curr_url)

            if not ("/recipe/" in curr_url or "-recipe-" in curr_url):
                print('Not a recipe')
                continue

            response = requests.get(curr_url)
            if response.status_code != 200:
                print('Bad response')
                continue

            soup = BeautifulSoup(response.content, 'html.parser')

            data_template = {
                "recipe_url": "",
                "recipe_name": "",
                "image_path": "",
                "image_url": "",
                "ingredients": []
            }

            # Insert recipe URL
            data_template['recipe_url'] = curr_url

            # Extract recipe name
            recipe_name = soup.find('h1', class_='article-heading text-headline-400')
            if recipe_name:
                data_template['recipe_name'] = recipe_name.get_text(strip=True)
                print(data_template['recipe_name'])
            else:
                print('No recipe name')
                continue


            # Extract primary image
            primary_image = soup.find('img', class_='primary-image__image')
            if primary_image:
                data_template['image_url'] = primary_image['src']
            else:
                continue

            # Extract ingredients
            ingredients = []
            ingredient_names = soup.findAll('span', {'data-ingredient-name': 'true'})

            for ingredient in ingredient_names:
                ingredients.append(ingredient.get_text(strip=True))

            if not ingredients:
                continue

            data_template['ingredients'] = ingredients

            if download_images:
                image_path = self.download_image(hashlib.md5(curr_url.encode()).hexdigest(), data_template['image_url'], data=data_template)
                data_template['image_path'] = image_path
                time.sleep(1)

            self.parsed_data.append(data_template)

            print(len(self.to_parse_urls))

            count -= 1

            if count == 0:
                count = 100
                self.load()

@app.route('/parse', methods=['GET'])
def parse():
    allrecipes_parse = AllrecipesParse()
    allrecipes_parse.parse(True)

    return jsonify({'message': 'Parsing complete'})


if __name__ == '__main__':
    # If local, run the parser
    local = False
    if (local):
        allrecipes_parse = AllrecipesParse()
        allrecipes_parse.parse(True)
    else:
        port = int(os.environ.get('PORT', 5001))
        app.run(debug=True, host='0.0.0.0', port=port)