import requests
from bs4 import BeautifulSoup
import re

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
    ingredients_list_items = soup.find_all('li', class_='mm-recipes-structured-ingredients__list-item')
    print(list(ingredients_list_items[0].children))
    ingredients_list = [re.match(r"""<span data-ingredient-name="true">(.*?)</span>""", item) for item in ingredients_list_items]
    print(ingredients_list)

    for ingredient in ingredients_list:
        ingredients.append(ingredient.get_text(strip=True))

    data_template['ingredients'] = ingredients

    print(data_template)

# Example usage
url = 'https://www.allrecipes.com/recipe/274250/perfect-pumpkin-muffins/'
parse_allrecipes_recipe(url)