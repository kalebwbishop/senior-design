from flask import Flask, jsonify, request
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from webdriver_manager.firefox import GeckoDriverManager
import time
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException
import hashlib
import requests
from bs4 import BeautifulSoup
import concurrent.futures
import re

# Initialize Flask app
app = Flask(__name__)

# Setup local Firefox WebDriver
service = Service(GeckoDriverManager().install())
options = webdriver.FirefoxOptions()
options.add_argument("--headless")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")

# Create a pool of drivers
driver_pool = []
MAX_DRIVERS = 5

def get_driver():
    """Get a driver from the pool or create a new one if needed"""
    if driver_pool:
        return driver_pool.pop()
    else:
        return webdriver.Firefox(service=service, options=options)

def return_driver(driver):
    """Return a driver to the pool"""
    if len(driver_pool) < MAX_DRIVERS:
        driver_pool.append(driver)
    else:
        driver.quit()

def get_recipe_data(url):
    """
    Scrapes recipe data from the given URL using Selenium.
    Extracts recipe name, ingredients, description, details, steps, and breadcrumbs.
    """
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
    temp_recipe["recipe_name"] = title_tag.text.strip() if title_tag else "Unknown"

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

    if not temp_recipe["recipe_description"]:
        raise ValueError("Recipe description not found")

    # Extract details (label-value pairs)
    details = {}
    for detail in soup.select(".mm-recipes-details__label"):
        label = detail.text.strip()
        value_tag = detail.find_next_sibling(class_="mm-recipes-details__value")
        if value_tag:
            details[label] = value_tag.text.strip()

    if not details:
        raise ValueError("Details not found")

    temp_recipe["details"] = details

    # Extract steps
    steps = [step.text.strip() for step in soup.select(".mntl-sc-block-html")]

    if not steps:
        raise ValueError("Steps not found")

    temp_recipe["steps"] = steps

    # Extract breadcrumbs
    breadcrumbs = [
        breadcrumb.text.strip()
        for breadcrumb in soup.select(".mntl-breadcrumbs__item .link__wrapper")
    ]

    if not breadcrumbs:
        raise ValueError("Breadcrumbs not found")

    temp_recipe["breadcrumbs"] = breadcrumbs

    return temp_recipe


def extract_images_from_page(driver, url):
    """Extract images from a single page"""
    try:
        driver.get(url)
        
        # Find all image elements with data-src attribute
        image_elements = driver.find_elements(By.CSS_SELECTOR, "img[data-src]")
        
        # Extract image URLs
        image_urls = []
        for img in image_elements:
            try:
                img_url = img.get_attribute("data-src")
                if img_url and "thmb" not in img_url:  # Filter out thumbnail images
                    image_urls.append(img_url)
            except Exception:
                continue
                
        return image_urls
    except Exception as e:
        print(f"Error extracting images from {url}: {e}")
        return []


def find_image_urls(url):
    """Find image URLs using a more efficient approach"""
    driver = get_driver()
    try:
        # First try to get images directly from the page
        image_urls = extract_images_from_page(driver, url)
        
        # If we found images, return them
        if image_urls:
            return image_urls
            
        # If not, try the gallery approach
        driver.get(url)
        
        # Find gallery links
        gallery_links = driver.find_elements(
            By.CSS_SELECTOR, "a.gallery-photo.dialog-link.mntl-text-link"
        )
        
        if not gallery_links:
            return []
            
        # Get the first gallery link
        first_link = gallery_links[0]
        gallery_url = first_link.get_attribute("href")
        
        if not gallery_url:
            return []
            
        # Navigate to the gallery
        driver.get(gallery_url)
        
        # Extract images from the gallery
        gallery_images = extract_images_from_page(driver, gallery_url)
        
        # Try to navigate through pagination if available
        try:
            # Find pagination links
            pagination_links = driver.find_elements(By.CSS_SELECTOR, ".pagination__next")
            
            for pagination_link in pagination_links:
                try:
                    next_url = pagination_link.get_attribute("href")
                    if next_url:
                        # Extract images from the next page
                        next_page_images = extract_images_from_page(driver, next_url)
                        gallery_images.extend(next_page_images)
                except Exception:
                    continue
        except Exception:
            pass
            
        return gallery_images
        
    except Exception as e:
        print(f"Error in find_image_urls: {e}")
        return []
    finally:
        return_driver(driver)


@app.route("/scrape", methods=["GET"])
def scrape_recipe():
    """
    Endpoint that scrapes recipe data and image URLs.
    Expected query parameter: 'url' with the recipe URL.
    """
    url = request.args.get("url")

    if not url:
        return jsonify({"error": "URL parameter is required"}), 400

    try:
        recipe_data = get_recipe_data(url)
        recipe_data["image_urls"] = find_image_urls(url)
        return jsonify(recipe_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/")
def index():
    return jsonify({"message": "Welcome to the Recipe Scraper API!"})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
