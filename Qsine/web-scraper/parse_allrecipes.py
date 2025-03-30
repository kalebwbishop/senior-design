import requests
import json
import os
import time
import hashlib
from bs4 import BeautifulSoup


class AllrecipesParse():
    def __init__(self):
        self.data_file_path = "./data/allrecipes/data.json"
        self.parsed_images_path = "./data/allrecipes/images/"
        self.links_file_path = "./data/allrecipes/links.json"
        
        self.load()

    def load(self):
        if os.path.exists(self.links_file_path):
            with open(self.links_file_path, 'r') as file:
                data = json.load(file)

            self.urls = data.get('to_check_urls', []) + data.get('checked_urls', [])

            with open(self.data_file_path, 'r') as file:
                self.data = json.load(file)

        else:
            raise FileNotFoundError("Data file not found")
    
    def download_image(self, image_url, key):
        image_name = key + '.jpg'
        image_path = os.path.join(self.parsed_images_path, image_name).replace('\\', '/')
    
        if os.path.exists(image_path):
            print(f"{key}: Image already exists")
            return image_path

        response = requests.get(image_url)

        if response.status_code != 200:
            return None

        with open(image_path, 'wb') as file:
            file.write(response.content)

        return image_path

    def parse(self):
        save_counter = 0
        for url in self.urls:
            try:
                temp_recipe = {}
                key = hashlib.md5(url.encode('utf-8')).hexdigest()

                print(f"Parsing {url}")
                temp_recipe['url'] = url
                temp_recipe['key'] = key

                if any(recipe['url'] == url for recipe in self.data):
                    print(f"{key}: URL already exists")
                    continue

                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                }
                
                response = requests.get(url, headers=headers)
                if "Signal - Not Acceptable" in response.text:
                    print("Resting for 2 hours")
                    time.sleep(300)
                    continue

                soup = BeautifulSoup(response.text, 'html.parser')

                # Extract recipe name
                title_tag = soup.find('title')
                temp_recipe['recipe_name'] = title_tag.text.strip() if title_tag else "Unknown"

                # Extract ingredients
                ingredients = [tag.text.strip() for tag in soup.select('[data-ingredient-name="true"]')]
                if not ingredients:
                    raise ValueError("Ingredients not found")
                temp_recipe['ingredients'] = ingredients

                # Extract image URL
                image_tag = soup.find('img', {'srcset': True}) or soup.find('img', {'data-src': True})
                if image_tag:
                    image_url = image_tag['srcset'].split()[0] if 'srcset' in image_tag.attrs else image_tag['data-src']
                    temp_recipe['image_url'] = image_url
                else:
                    raise ValueError("Image URL not found")

                # Extract recipe description
                description_tag = soup.select_one('.article-subheading.text-body-100')
                temp_recipe['recipe_description'] = description_tag.text.strip() if description_tag else "No description"

                # Extract details (label-value pairs)
                details = {}
                for detail in soup.select('.mm-recipes-details__label'):
                    label = detail.text.strip()
                    value_tag = detail.find_next_sibling(class_='mm-recipes-details__value')
                    if value_tag:
                        details[label] = value_tag.text.strip()
                temp_recipe['details'] = details

                # Extract steps
                steps = [step.text.strip() for step in soup.select('.mntl-sc-block-html')]
                temp_recipe['steps'] = steps

                # Extract breadcrumbs
                breadcrumbs = [breadcrumb.text.strip() for breadcrumb in soup.select('.mntl-breadcrumbs__item .link__wrapper')]
                temp_recipe['breadcrumbs'] = breadcrumbs

                # Download the image
                image_path = self.download_image(temp_recipe['image_url'], key)
                if not image_path:
                    raise ValueError("Image download failed")
                temp_recipe['image_path'] = image_path

                self.data.append(temp_recipe)
                save_counter += 1
                if save_counter >= 30:
                    print("Saving data")
                    with open(self.data_file_path, 'w') as file:
                        json.dump(self.data, file, indent=4)
                    save_counter = 0
                
            except KeyboardInterrupt:
                print("Saving data")
                with open(self.data_file_path, 'w') as file:
                    json.dump(self.data, file, indent=4)
                return
            
            except ValueError as e:
                print(f"Error parsing {url}: {e}")
                continue

        with open(self.data_file_path, 'w') as file:
            print("Saving data")
            json.dump(self.data, file, indent=4)

        
if __name__ == '__main__':
    allrecipes_parse = AllrecipesParse()
    allrecipes_parse.parse()