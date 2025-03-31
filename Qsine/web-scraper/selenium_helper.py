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
from selenium.common.exceptions import NoSuchElementException
import hashlib
import requests
from bs4 import BeautifulSoup

# Initialize Flask app
app = Flask(__name__)

# Setup local Firefox WebDriver
service = Service(GeckoDriverManager().install())
options = webdriver.FirefoxOptions()
options.add_argument("--headless")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")

driver = webdriver.Firefox(service=service, options=options)


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


def find_image_urls(url):
    driver.get(url)
    print(driver.title)

    # Find all 'a' tags with the specified class
    gallery_links = driver.find_elements(
        By.CSS_SELECTOR, "a.gallery-photo.dialog-link.mntl-text-link"
    )

    # Click the first link if it exists
    if gallery_links:
        try:
            first_link = gallery_links[0]
            href = first_link.get_attribute("href")
            print(f"Clicking on the first link: {href}")
            first_link.click()
        except Exception as e:
            print(f"Error clicking the first link: {e}")
    else:
        print("No gallery links found.")

    data_page = 2
    while True:
        try:
            # Scroll to the bottom of the page first
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(0.5)  # Allow time for content to load

            # Wait until the next button becomes clickable
            next_button = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable(
                    (By.CSS_SELECTOR, f".pagination__next[data-page='{data_page}']")
                )
            )

            # Scroll directly to the next button
            driver.execute_script(
                "arguments[0].scrollIntoView({block: 'center'});", next_button
            )
            time.sleep(0.5)

            try:
                dismiss_button = driver.find_element(
                    By.CSS_SELECTOR, ".pushly-prompt-btn-dismiss"
                )
                dismiss_button.click()
                print("Pushly prompt dismissed.")
                time.sleep(1)

            except NoSuchElementException:
                print("No Pushly prompt found.")

            try:
                no_thanks_button = driver.find_element(
                    By.CSS_SELECTOR, "div.fb_lightbox-overlay.fb_lightbox-overlay-fixed"
                )
                no_thanks_button.click()
                print("No Thanks button clicked.")
                time.sleep(1)
            except NoSuchElementException:
                print("No 'No Thanks' button found.")

            # Click the next button
            next_button.click()
            print("Next button clicked.")

            data_page += 1
            time.sleep(0.5)
        except Exception as e:
            print(f"Error clicking next button: {e}")
            break

    # Find all divs with class 'photo-dialog__item'
    image_tags = driver.find_elements(By.CLASS_NAME, "photo-dialog__item")
    print(f"Found {len(image_tags)} image tags")

    # Extract the image URLs
    image_urls = []
    for idx, div in enumerate(image_tags):
        try:
            # Find the nested figure element
            figure = div.find_element(By.TAG_NAME, "figure")
            inner_divs = figure.find_elements(By.TAG_NAME, "div")

            # Look for the image tag inside the appropriate div
            img_tag = None
            if inner_divs:
                img_tag = inner_divs[0].find_element(By.TAG_NAME, "img")
            else:
                img_tag = figure.find_element(By.TAG_NAME, "img")

            # Get the 'data-src' attribute (change to 'src' if needed)
            if img_tag:
                image_url = img_tag.get_attribute("data-src")
                image_urls.append(image_url)

        except Exception as e:
            print(f"Error processing image {idx}: {e}")

    # Print the extracted image URLs
    for url in image_urls:
        print(url)

    return image_urls


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
