import json
import os
import shutil
from dotenv import load_dotenv
from pymongo import MongoClient
import requests
import zlib
import base64
import re
import time
from requests.exceptions import ConnectionError, Timeout

load_dotenv()


# Function to sanitize directory names
def sanitize_directory_name(name):
    # Remove invalid characters for Windows paths
    # Invalid characters: < > : " / \ | ? *
    return re.sub(r'[<>:"/\\|?*]', "_", name)


# Connect to MongoDB
def connect_to_mongodb():
    client = MongoClient(os.environ.get("MONGODB_URI"))

    if not client:
        raise Exception("Failed to connect to MongoDB")

    db = client.get_default_database()
    return db


def decompress_data(compressed_data):
    decompressed = zlib.decompress(base64.b64decode(compressed_data))
    return json.loads(decompressed.decode("utf-8"))


if __name__ == "__main__":
    # Connect to MongoDB
    db = connect_to_mongodb()

    # Create a directory for the dataset
    os.makedirs("./dataset/all_data", exist_ok=True)

    # Load the data from MongoDB
    collection = db["recipes"]

    unique_paths = set()

    while True:
        data = list(collection.find({}))

        running_count = 0

        for recipe_idx, recipe in enumerate(data):
            # Decompress the recipe data
            compressed_data = recipe["data"]
            recipe = decompress_data(compressed_data)

            # Create a directory based on the recipe name
            # recipe_name = recipe.get("name", "unknown").replace(" ", "_")
            if len(recipe.get("breadcrumbs", ["recipe", ""])) < 2:
                print(f"Skipping recipe with insufficient breadcrumbs: {recipe}")
                continue
            recipe_path = recipe.get("breadcrumbs", ["recipe", ""])[-2] or "unknown"

            directory_name = os.path.join(
                "dataset/all_data", sanitize_directory_name(recipe_path)
            ).lower()

            if not os.path.exists(directory_name):
                os.makedirs(directory_name)

            unique_paths.add(directory_name)

            if not recipe.get("image_urls"):
                print(f"No image URLs found for recipe: {recipe}")
                continue

            # Download the image
            image_urls = recipe["image_urls"]

            for idx, image_url in enumerate(image_urls):
                running_count += 1
                image_path = os.path.join(directory_name, f"{idx}{recipe['key']}.jpg")

                if os.path.exists(image_path):
                    print(
                        f"Image already exists for {idx}{recipe['key']}. Skipping download."
                    )
                    continue

                print(
                    f"Downloading image {idx + 1}/{len(image_urls)} : {running_count} : {recipe_idx}/{len(data)} : Estimated total {int((running_count * len(data)) / (recipe_idx + 1))}"
                )

                try:
                    response = requests.get(image_url, stream=True, timeout=10)
                    response.raise_for_status()  # Check if request was successful
                    with open(image_path, "wb") as out_file:
                        shutil.copyfileobj(response.raw, out_file)
                    del response
                except (ConnectionError, Timeout) as e:
                    print(f"Error downloading image from {image_url}: {e}")
                except requests.exceptions.RequestException as e:
                    print(f"Failed to download image from {image_url}: {e}")
                except Exception as e:
                    print(f"An unexpected error occurred: {e}")

        print(
            f"Downloaded {running_count} images for {len(data)} recipes in {len(unique_paths)} categories. Sleeping for 15 minutes."
        )
        time.sleep(900)
