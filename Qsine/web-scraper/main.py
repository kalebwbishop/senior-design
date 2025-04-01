import requests
import re
import json
import os
from pymongo import MongoClient
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import time
import hashlib
import zlib
import json
import base64

from selenium_helper import find_image_urls

load_dotenv()


class AllrecipesSearch:
    def __init__(self):
        self.start_url = "https://www.allrecipes.com/"
        self.links_file_path = "./links.json"
        self.failures_file_path = "./failures.txt"
        self.temp_recipes = []
        self.db = self.connect_to_mongodb()

        try:
            with open(self.failures_file_path, "r") as file:
                self.failures = set(file.read().splitlines())

        except FileNotFoundError:
            with open(self.failures_file_path, "w") as file:
                file.write("")
            self.failures = set([])

        try:
            self.load()

        except FileNotFoundError:
            self.checked_urls = set()
            self.to_check_urls = [self.start_url]

    # Connect to MongoDB
    def connect_to_mongodb(self):
        client = MongoClient(os.environ.get("MONGODB_URI"))

        if not client:
            raise Exception("Failed to connect to MongoDB")

        db = client.get_default_database()
        return db

    def compress_data(self, data):
        json_str = json.dumps(data)
        compressed = zlib.compress(json_str.encode("utf-8"))
        return base64.b64encode(compressed).decode("utf-8")  # Encode for storage

    def save(self):
        os.makedirs(os.path.dirname(self.links_file_path), exist_ok=True)
        with open(self.links_file_path, "w", encoding="utf-8") as file:
            json.dump(
                {
                    "checked_urls": list(self.checked_urls),
                    "to_check_urls": self.to_check_urls,
                },
                file,
                indent=4,
            )

        for recipe in self.temp_recipes:
            key = recipe["key"]

            # Retrieve the recipe from the database using the key
            existing_recipe = self.db.recipes.find_one({"key": key})

            # If the recipe exists, update its image_urls
            if existing_recipe:
                existing_data = json.loads(
                    zlib.decompress(base64.b64decode(existing_recipe["data"])).decode(
                        "utf-8"
                    )
                )
                recipe["image_urls"] = existing_data.get("image_urls", [])

            compressed_recipe = self.compress_data(recipe)

            self.db.recipes.update_one(
                {"key": key},
                {"$set": {"data": compressed_recipe}},  # Store compressed data
                upsert=True,
            )

        print("Saved progress")

    def load(self):
        if not os.path.exists(self.links_file_path):
            data = {"checked_urls": [], "to_check_urls": []}
        else:
            with open(self.links_file_path, "r") as file:
                try:
                    data = json.load(file)
                except json.JSONDecodeError:
                    data = {"checked_urls": [], "to_check_urls": []}

        self.checked_urls = set(data.get("checked_urls", []))
        self.to_check_urls = data.get("to_check_urls", []) + [self.start_url]

    def search(self):
        count = 0
        max_retries = 5  # Max retries before giving up
        retry_wait_time = 10  # Seconds to wait before retrying

        try:
            while len(self.to_check_urls) > 0:
                curr_link = self.to_check_urls.pop()

                if curr_link in self.checked_urls:
                    continue

                retries = 0
                while retries < max_retries:
                    try:
                        response = requests.get(curr_link)
                        if response.status_code != 200:
                            print("Bad response")
                            time.sleep(600)
                            retries = max_retries
                            continue
                        break  # If successful, exit the retry loop

                    except (
                        requests.exceptions.ConnectionError,
                        requests.exceptions.Timeout,
                    ) as e:
                        print(f"Error connecting to {curr_link}: {e}")
                        retries += 1
                        if retries < max_retries:
                            print(
                                f"Retrying {curr_link} in {retry_wait_time} seconds... ({retries}/{max_retries})"
                            )
                            time.sleep(retry_wait_time)
                        else:
                            print(
                                f"Max retries reached for {curr_link}. Moving to the next URL."
                            )
                            self.failures.add(curr_link)
                            with open(self.failures_file_path, "a") as file:
                                file.write(curr_link + "\n")
                            break  # Exit the retry loop after max retries

                if retries >= max_retries:
                    continue  # Skip to the next URL after max retries are reached

                self.to_check_urls = list(
                    set(
                        self.to_check_urls
                        + re.findall(
                            r'href="(https://www.allrecipes.com/(?!thmb)[^"?]+)',
                            response.text,
                        )
                    )
                )
                print(len(self.checked_urls), len(self.to_check_urls), curr_link)
                self.checked_urls.add(curr_link)

                self.parse(curr_link)

                count += 1

                if count >= 5:
                    count = 0
                    self.save()

        except KeyboardInterrupt:
            self.save()

        self.save()

    def parse(self, url, check_failures=True):
        try:

            if check_failures and url in self.failures:
                print(f"{url}: URL already in failures")
                return

            temp_recipe = {}
            key = hashlib.md5(url.encode("utf-8")).hexdigest()

            print(f"Parsing {url}")
            temp_recipe["url"] = url
            temp_recipe["key"] = key

            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }

            response = requests.get(url, headers=headers)
            if "Signal - Not Acceptable" in response.text:
                print("Resting for 5 minutes")
                time.sleep(300)
                return

            soup = BeautifulSoup(response.text, "html.parser")

            # Extract recipe name
            title_tag = soup.find("title")
            temp_recipe["recipe_name"] = (
                title_tag.text.strip() if title_tag else "Unknown"
            )

            # Extract ingredients
            ingredients = [
                tag.text.strip() for tag in soup.select('[data-ingredient-name="true"]')
            ]
            if not ingredients:
                raise ValueError("Ingredients not found")
            temp_recipe["ingredients"] = ingredients

            # Extract recipe description
            description_tag = soup.select_one(".article-subheading.text-body-100")
            temp_recipe["recipe_description"] = (
                description_tag.text.strip() if description_tag else "No description"
            )

            # Extract details (label-value pairs)
            details = {}
            for detail in soup.select(".mm-recipes-details__label"):
                label = detail.text.strip()
                value_tag = detail.find_next_sibling(class_="mm-recipes-details__value")
                if value_tag:
                    details[label] = value_tag.text.strip()
            temp_recipe["details"] = details

            # Extract steps
            steps = [
                step.text.strip()
                for step in soup.select(
                    "#mm-recipes-steps__content_1-0 ol li p.mntl-sc-block-html"
                )
            ]
            temp_recipe["steps"] = steps

            # Extract breadcrumbs
            breadcrumbs = [
                breadcrumb.text.strip()
                for breadcrumb in soup.select(".mntl-breadcrumbs__item .link__wrapper")
            ]
            temp_recipe["breadcrumbs"] = breadcrumbs

            # Find all image tags inside figure elements
            # image_tags = soup.find_all("div", class_="photo-dialog__item")
            # print(f"Found {len(image_tags)} image tags")

            # Extract the image URLs
            # image_urls = find_image_urls(url)
            # for idx, div in enumerate(image_tags):
            #     inner1 = div.find("figure")
            #     inner2 = inner1.find("div")

            #     if not inner2:
            #         img_tag = inner1.find("img")
            #     else:
            #         img_tag = inner2.find("img")

            #     if img_tag:
            #         # Get the image URL from the 'src' attribute
            #         image_url = img_tag["data-src"]

            #         image_urls.append(image_url)

            # if len(image_urls) == 0:
            #     raise ValueError("No images found")

            # temp_recipe["image_urls"] = image_urls

            self.temp_recipes.append(temp_recipe)
            return temp_recipe

        except Exception as e:
            print(f"Error parsing {url}: {e}")

            if url not in self.failures:
                print(f"Adding {url} to failures")
                with open(self.failures_file_path, "a") as file:
                    file.write(url + "\n")

                self.failures.add(url)

            return


if __name__ == "__main__":
    allrecipes_search = AllrecipesSearch()
    allrecipes_search.search()

    # For testing purposes, you can uncomment the following lines to test the parse method directly
    # print(
    #     allrecipes_search.parse(
    #         "https://www.allrecipes.com/recipe/282905/honey-garlic-shrimp/",
    #         check_failures=False,
    #     )
    # )
