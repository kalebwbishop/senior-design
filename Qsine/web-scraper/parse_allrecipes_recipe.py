import requests
from bs4 import BeautifulSoup
import json

image_legend_file = 'scraped_data/image_legend.json'

def parse_allrecipes_recipe(url):
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to load page {url}")

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
        return


    # Extract primary image
    primary_image = soup.find('img', class_='primary-image__image')
    if primary_image:
        data_template['image_url'] = primary_image['src']
    else:
        return

    # Extract ingredients
    ingredients = []
    ingredient_names = soup.findAll('span', {'data-ingredient-name': 'true'})

    for ingredient in ingredient_names:
        ingredients.append(ingredient.get_text(strip=True))

    if not ingredients:
        return

    data_template['ingredients'] = ingredients

    with open(image_legend_file, 'r') as f:
        data = json.load(f)
        data.append(data_template)

    with open(image_legend_file, 'w') as f:
        f.write(json.dumps(data, indent=4))

if __name__ == '__main__':
    with open(image_legend_file, 'w') as f:
        f.write('[]')
        
    with open('allrecipes_links.json', 'r') as f:
        data = json.load(f)

    for url in data:
        print(f"Processing {url}")
        parse_allrecipes_recipe(url)
