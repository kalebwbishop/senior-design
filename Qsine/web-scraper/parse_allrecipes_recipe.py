import requests
from bs4 import BeautifulSoup
import json
import time

links_file_path = 'allrecipes_links.json'
paresed_data_file_path = 'parsed_data.json'
data = []
parsed_data = []
already_parsed = set()

def parse_allrecipes_recipe(idx ,url):
    if url in already_parsed:
        print(f"Already parsed {url}")
        return True

    print(f"{len(data) - idx}: Processing {url}")

    response = requests.get(url)
    if response.status_code != 200:
        return False

    soup = BeautifulSoup(response.content, 'html.parser')

    data_template = {
        "recipe_url": "",
        "recipe_name": "",
        "image_url": "",
        "ingredients": []
    }

    # Insert recipe URL
    data_template['recipe_url'] = url

    # Extract recipe name
    recipe_name = soup.find('h1', class_='article-heading type--lion')
    if recipe_name:
        data_template['recipe_name'] = recipe_name.get_text(strip=True)
    else:
        return False


    # Extract primary image
    primary_image = soup.find('img', class_='primary-image__image')
    if primary_image:
        data_template['image_url'] = primary_image['src']
    else:
        return False

    # Extract ingredients
    ingredients = []
    ingredient_names = soup.findAll('span', {'data-ingredient-name': 'true'})

    for ingredient in ingredient_names:
        ingredients.append(ingredient.get_text(strip=True))

    if not ingredients:
        return False

    data_template['ingredients'] = ingredients

    parsed_data.append(data_template)

    return True

if __name__ == '__main__':
    with open(paresed_data_file_path, 'r') as f:
        parsed_data = json.load(f)
        already_parsed = set([recipe['recipe_url'] for recipe in parsed_data])
        print(f"Already parsed {len(already_parsed)} recipes")

    with open(links_file_path, 'r') as f:
        data = json.load(f)

    def save_data():
        with open(links_file_path, 'w') as f:
            f.write(json.dumps(data, indent=4))

        with open(paresed_data_file_path, 'w') as f:
            f.write(json.dumps(parsed_data, indent=4))

    try:
        for idx, url in enumerate(data):
            isRecipe = parse_allrecipes_recipe(idx, url)

            time.sleep(0.25)

            if not isRecipe:
                data.remove(url)


    except KeyboardInterrupt:
        pass

    print("Saving data and exiting")    
    save_data()
