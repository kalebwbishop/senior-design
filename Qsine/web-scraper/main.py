import requests
import re
import json
import os
from pymongo import MongoClient, UpdateOne
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import time
import hashlib
import zlib
import json
import base64
import concurrent.futures
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from selenium_helper import find_image_urls

load_dotenv()


class AllrecipesSearch:
    def __init__(self):
        self.start_url = "https://www.allrecipes.com/"
        self.temp_recipes = []
        self.db = self.connect_to_mongodb()
        self.session = self._create_session()
        self.batch_size = 20  # Increased from 5 to 20 for better performance
        self.max_workers = 10  # Number of parallel workers
        
        # Initialize MongoDB collections
        self.recipes_collection = self.db.recipes
        self.state_collection = self.db.scraper_state
        self.failures_collection = self.db.failures
        
        # Load state from MongoDB
        self.load_state()

    def _create_session(self):
        """Create a session with retry strategy for better performance"""
        session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=0.5,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy, pool_connections=20, pool_maxsize=20)
        session.mount("https://", adapter)
        session.mount("http://", adapter)
        return session

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
        # Save state to MongoDB
        self.state_collection.update_one(
            {"_id": "scraper_state"},
            {
                "$set": {
                    "checked_urls": list(self.checked_urls),
                    "to_check_urls": self.to_check_urls,
                }
            },
            upsert=True,
        )

        # Batch database operations
        if self.temp_recipes:
            # Prepare bulk operations
            bulk_operations = []
            for recipe in self.temp_recipes:
                key = recipe["key"]
                
                # Retrieve the recipe from the database using the key
                existing_recipe = self.recipes_collection.find_one({"key": key})
                
                # If the recipe exists, update its image_urls
                if existing_recipe:
                    existing_data = json.loads(
                        zlib.decompress(base64.b64decode(existing_recipe["data"])).decode(
                            "utf-8"
                        )
                    )
                    recipe["image_urls"] = existing_data.get("image_urls", [])
                
                compressed_recipe = self.compress_data(recipe)
                
                # Create UpdateOne operation
                update_operation = UpdateOne(
                    {"key": key},
                    {"$set": {"data": compressed_recipe}},
                    upsert=True
                )
                
                # Add to bulk operations
                bulk_operations.append(update_operation)
            
            # Execute bulk operations
            if bulk_operations:
                self.recipes_collection.bulk_write(bulk_operations)
            
            # Clear temp recipes after saving
            self.temp_recipes = []

        print("Saved progress")

    def load_state(self):
        """Load state from MongoDB"""
        state_doc = self.state_collection.find_one({"_id": "scraper_state"})
        
        if state_doc:
            self.checked_urls = set(state_doc.get("checked_urls", []))
            self.to_check_urls = state_doc.get("to_check_urls", [])
        else:
            self.checked_urls = set()
            self.to_check_urls = [self.start_url]
            
        # Load failures from MongoDB
        failures_docs = self.failures_collection.find({}, {"url": 1})
        self.failures = set(doc["url"] for doc in failures_docs)

    def add_failure(self, url):
        """Add a URL to the failures collection"""
        if url not in self.failures:
            self.failures.add(url)
            self.failures_collection.update_one(
                {"url": url},
                {"$set": {"url": url, "timestamp": time.time()}},
                upsert=True
            )

    def process_url(self, url):
        """Process a single URL - extracted from search method for parallel processing"""
        if url in self.checked_urls:
            return None
        
        try:
            response = self.session.get(url)
            if response.status_code != 200:
                print(f"Bad response for {url}: {response.status_code}")
                return None
                
            # Extract new links
            new_links = re.findall(
                r'href="(https://www.allrecipes.com/(?!thmb)[^"?]+)',
                response.text,
            )
            
            # Parse the recipe
            recipe = self.parse(url)
            
            return {
                "recipe": recipe,
                "new_links": new_links,
                "url": url
            }
            
        except Exception as e:
            print(f"Error processing {url}: {e}")
            if url not in self.failures:
                self.add_failure(url)
            return None

    def search(self):
        count = 0
        
        try:
            while len(self.to_check_urls) > 0:
                # Get a batch of URLs to process
                batch_size = min(self.max_workers, len(self.to_check_urls))
                batch_urls = [self.to_check_urls.pop() for _ in range(batch_size)]
                
                # Process URLs in parallel
                with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                    future_to_url = {executor.submit(self.process_url, url): url for url in batch_urls}
                    
                    for future in concurrent.futures.as_completed(future_to_url):
                        url = future_to_url[future]
                        try:
                            result = future.result()
                            if result:
                                # Add new links to the queue
                                self.to_check_urls = list(set(self.to_check_urls + result["new_links"]))
                                
                                # Add to checked URLs
                                self.checked_urls.add(url)
                                
                                # Add recipe to temp recipes if it exists
                                if result["recipe"]:
                                    self.temp_recipes.append(result["recipe"])
                                    count += 1
                                    
                                    # Save progress periodically
                                    if count >= self.batch_size:
                                        self.save()
                                        count = 0
                                        
                        except Exception as e:
                            print(f"Error processing {url}: {e}")
                
                print(f"Processed batch. Checked: {len(self.checked_urls)}, To check: {len(self.to_check_urls)}")

        except KeyboardInterrupt:
            print("Interrupted by user. Saving progress...")
            self.save()

        # Final save
        self.save()

    def parse(self, url, check_failures=True):
        try:
            if check_failures and url in self.failures:
                print(f"{url}: URL already in failures")
                return None

            temp_recipe = {}
            key = hashlib.md5(url.encode("utf-8")).hexdigest()

            print(f"Parsing {url}")
            temp_recipe["url"] = url
            temp_recipe["key"] = key

            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }

            response = self.session.get(url, headers=headers)
            if "Signal - Not Acceptable" in response.text:
                print("Resting for 5 minutes")
                time.sleep(300)
                return None

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

            # Extract the image URLs - commented out for now as it's slow
            # image_urls = find_image_urls(url)
            # if len(image_urls) == 0:
            #     raise ValueError("No images found")
            # temp_recipe["image_urls"] = image_urls

            return temp_recipe

        except Exception as e:
            print(f"Error parsing {url}: {e}")

            if url not in self.failures:
                self.add_failure(url)

            return None


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
