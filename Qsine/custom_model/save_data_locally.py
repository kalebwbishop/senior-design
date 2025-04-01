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

    # Load the data from MongoDB
    collection = db["recipes"]

    unique_paths = set()

    all_data = []

    data = list(collection.find({}))

    for recipe_idx, recipe in enumerate(data):
        # Decompress the recipe data
        compressed_data = recipe["data"]
        recipe = decompress_data(compressed_data)

        all_data.append(recipe)

    # Save data to a JSON file
    with open("../data/data.json", "w") as f:
        json.dump(all_data, f, indent=4)
