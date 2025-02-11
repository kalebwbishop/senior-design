import requests
import json
import os
import time
import re

class AllrecipesParse():
    def __init__(self):
        self.data_file_path = "D:/qsine/scraped_data/new.json"
        self.parsed_images_path = "D:/qsine/scraped_data/images"
        
        self.load()

    def load(self):
        if os.path.exists(self.data_file_path):
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
    
    def save_page(self, page_data):
        with open('recipe.html', 'w', encoding='utf-8') as file:
            file.write(page_data)

    def parse(self):
        recipe_count = 0
        recipe_total = len(self.data.keys())
        counter = 0
        for key, value in self.data.items():
            try:
                recipe_count += 1

                if (
                    value.get('recipe_name') != "" and
                    value.get('image_url') != "" and
                    value.get('image_path') != "" and
                    len(value.get('ingredients')) != 0
                    ):
                    print(f"{key}: Already parsed")
                    continue

                if (
                    value.get('recipe_name') != "" and
                    value.get('image_url') != "" and
                    len(value.get('ingredients')) != 0
                    ):
                    # Download the image
                    image_path = self.download_image(value.get('image_url'), key)
                    if not image_path:
                        print(f"{key}: Image download failed")
                        break

                    value['image_path'] = image_path

                    print(f"{key}: Only needed image downloaded")
                    continue 

                print(f"{(recipe_count / recipe_total) * 100:.2f}% {key}: Parsing")

                url = value['recipe_url']
                headers = {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                    }
                                
                response = requests.get(url, headers=headers)

                if ("Signal - Not Acceptable" in response.text):
                    print("Resting for 2 hours")
                    time.sleep(300)

                with open('recipe.html', 'w', encoding='utf-8') as file:
                    file.write(response.text)

                # Match the recipe name
                title_match = re.search(r'<title>(.*?)</title>', response.text)
                if title_match:
                    recipe_name = title_match.group(1)
                else:
                    print(f"{key}: Recipe name not found")
                    raise ValueError("Recipe name not found")

                value['recipe_name'] = recipe_name

                # Match the ingredients
                ingredients_match = re.findall(r'<span data-ingredient-name="true">(.+?)</span>', response.text)
                if ingredients_match:
                    ingredients = ingredients_match
                else:
                    print(f"{key}: Ingredients not found")
                    raise ValueError("Ingredients not found")

                value['ingredients'] = ingredients

                # Match the image url
                image_url_match = re.search(r'srcset="(https://www\.allrecipes\.com/thmb/.+?\.jpg) ', response.text)
                if not image_url_match:
                    image_url_match = re.search(r'data-src="(https://.*?\.jpg.*?)"', response.text)


                if image_url_match:
                    image_url = image_url_match.group(1)
                else:
                    image_url_match = re.search(r'alt="Recipe Placeholder Image"', response.text)
                    if image_url_match:
                        print(f"{key}: Recipe has no image")
                        continue

                    print(f"{key}: Image url not found")
                    raise ValueError("Image url not found")

                value['image_url'] = image_url

                # Download the image
                image_path = self.download_image(image_url, key)
                if not image_path:
                    print(f"{key}: Image download failed")
                    raise ValueError("Image download failed")

                value['image_path'] = image_path

                counter -= 1
                if counter == 0:
                    print("Saving data")
                    with open(self.data_file_path, 'w') as file:
                        json.dump(self.data, file, indent=4)

                    counter = 30
            
            except KeyboardInterrupt:
                print("Saving data")
                with open(self.data_file_path, 'w') as file:
                    json.dump(self.data, file, indent=4)
                return
            except ValueError:
                open("failures.txt", 'a').write(f"{key}\n")

        self.save_page(response.text)
        with open(self.data_file_path, 'w') as file:
            print("Saving data")
            json.dump(self.data, file, indent=4)

        
if __name__ == '__main__':
    allrecipes_parse = AllrecipesParse()
    allrecipes_parse.parse()

    # print(len(allrecipes_parse.data.keys()))

    # keys_to_remove = []

    # for key, value in allrecipes_parse.data.items():
    #     if '/recipe/' in value.get('recipe_url'):
    #         continue

    #     if re.search(r'-recipe-[^\d]', value.get('recipe_url')):
    #         keys_to_remove.append(key)

    # print(len(keys_to_remove))

    # for key in keys_to_remove:
    #     allrecipes_parse.data.pop(key)

    # print(len(allrecipes_parse.data.keys()))

    # with open(allrecipes_parse.data_file_path, 'w') as file:
    #     json.dump(allrecipes_parse.data, file, indent=4)

