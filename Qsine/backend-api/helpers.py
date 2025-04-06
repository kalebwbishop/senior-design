import os
import json
import requests
import re
from PIL import Image
import base64
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

# MongoDB setup
client = MongoClient(os.getenv('MONGODB_URI'))
db = client.get_database()
barcode_collection = db.barcodes

def attempt_to_find_product(barcode):
    fdc_id = None
    response = requests.get(
        f"https://api1.myfooddata.com/autocomplete/{barcode}"
    )
    if response.status_code == 200:
        search_data = response.json()
        if "hits" in search_data and len(search_data["hits"]) > 0:
            fdc_id = search_data["hits"][0]["document"]["fdc_id"]

    if fdc_id:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

        response = requests.get(
            f"https://tools.myfooddata.com/nutrition-facts/{fdc_id}/wt1/1",
            headers=headers,
        )
        if response.status_code == 200:
            match_name = re.search(r'"name":"(.*?)"', response.text)
            match_company = re.search(
                r'"brand_owner":"(.*?)"', response.text
            )
            match_ingredients = re.search(
                r'"ingredients":"(.*?)"', response.text
            )
            if match_name and match_company and match_ingredients:
                product = {
                    "name": match_name.group(1),
                    "company": match_company.group(1),
                    "ingredients": match_ingredients.group(1)
                    .lower()
                    .split(", "),
                }

                # Save to MongoDB
                barcode_collection.update_one(
                    {"_id": barcode},
                    {"$set": product},
                    upsert=True
                )

                return product

    return None

def clean_text(text):
    # Remove unwanted characters and newlines
    text = re.sub(r"[^\w\s,.]", "", text)
    text = re.sub(r"\s+", " ", text)

    text = text.strip()

    return text 