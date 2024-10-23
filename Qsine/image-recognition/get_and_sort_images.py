import os
import requests
from urllib.parse import urlparse
import json
from pydantic import BaseModel
from openai import OpenAI

client = OpenAI()

def categorize_images(data):
    parsed_data = {
        "recipe_url": data["recipe_url"],
        "recipe_name": data["recipe_name"],
        "ingredients": data["ingredients"],
    }

    class RecipeClassification(BaseModel):
        category: str

    completion = client.beta.chat.completions.parse(
        model="gpt-4o-2024-08-06",
        messages=[
            {"role": "system", "content": "Classify this recipe into a category that can be used for image classification. Such as waffles, lasagna, or cheesecake."},
            {"role": "user", "content": json.dumps(parsed_data)},
        ],
        response_format=RecipeClassification,
    )

    event = completion.choices[0].message.parsed

    return event.category.lower()

def download_image(index, url, category, save_folder='data/images/'):
    # Parse the URL to get the image name
    parsed_url = urlparse(url)
    image_name = os.path.basename(parsed_url.path)
    
    # Get the image file type from the URL
    file_type = os.path.splitext(image_name)[1]

    # Create the save folder if it doesn't exist
    save_folder = os.path.join(save_folder, category)

    if not os.path.exists(save_folder):
        os.makedirs(save_folder)

    # Full path to save the image
    save_path = os.path.join(save_folder, str(index) + file_type)

    # Download the image
    response = requests.get(url)
    if response.status_code == 200:
        with open(save_path, 'wb') as file:
            file.write(response.content)
        print(f"Image successfully downloaded: {save_path}")
    else:
        print(f"Failed to download image. Status code: {response.status_code}")

if __name__ == '__main__':
    with open('../web-scraper/parsed_data.json', 'r') as file:
        data = json.load(file)

    for index, recipe in enumerate(data):
        category = categorize_images(recipe)
        print(f"Category for recipe {index}: {category}")   
        download_image(index, recipe['image_url'], category)
        break
