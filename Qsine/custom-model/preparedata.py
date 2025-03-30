import json
import os
import shutil

with open(r'D:\qsine\scraped_data\new.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    
for key, value in data.items():
    print(value['recipe_name'])

    # Create a directory based on the recipe name
    recipe_name = value['recipe_name'].replace(" ", "_").replace("/", "_").replace("\\", "_").replace(":", "_").replace("*", "_").replace("?", "_").replace("\"", "_").replace("<", "_").replace(">", "_").replace("|", "_").replace("®", "_")
    directory_name = os.path.join('./dataset/all_data', recipe_name)

    if not os.path.exists(directory_name):
        # Create the directory if it doesn't exist
        os.makedirs(directory_name, exist_ok=True)

    image_path = value['image_path']

    if os.path.exists(image_path):
        new_image_path = os.path.join(directory_name, os.path.basename(image_path))
        if not os.path.exists(new_image_path):
            shutil.move(image_path, new_image_path)  # Move file across different drives
            print(f"Moved {image_path} to {new_image_path}")
        else:
            print(f"Image already exists: {new_image_path}")
    else:
        print(f"Image not found: {image_path}")

