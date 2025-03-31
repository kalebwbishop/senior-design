import json
from PIL import Image

if __name__ == '__main__':
    vectors = []

    with open('./data/allrecipes/data.json', 'r') as file:
        data = json.load(file)

    for recipe in data:

        with Image.open(recipe["image_path"]) as img:
            # Convert the image to RGB mode if not already
            img = img.convert("RGB")
            # Get the width and height of the image
            width, height = img.size
            print(f"Image size: {width} x {height}")
            # Create an array of hex values for the entire image
            hex_array = [
                ['#{:02x}{:02x}{:02x}'.format(*img.getpixel((x, y))) for x in range(width)]
                for y in range(height)
            ]

        recipe_vector = {
            'key': recipe['key'],
            'url': recipe['url'],
            'vector': hex_array,
        }

        vectors.append(recipe_vector)

        break
