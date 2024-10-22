import os
import requests
from urllib.parse import urlparse
import json

def download_image(index, url, save_folder='scraped_data/images'):
    # Parse the URL to get the image name
    parsed_url = urlparse(url)
    image_name = os.path.basename(parsed_url.path)
    
    # Get the image file type from the URL
    file_type = os.path.splitext(image_name)[1]

    # Create the save folder if it doesn't exist
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
    with open('scraped_data/image_legend.json', 'r') as file:
        data = json.load(file)

    for index, recipe in enumerate(data):
        download_image(index, recipe['image_url'])