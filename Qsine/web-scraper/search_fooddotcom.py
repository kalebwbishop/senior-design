import requests
import re
import json
import hashlib

class FooddotcomSearch():
    def __init__(self):
        self.start_url = 'https://www.food.com/'
        self.links_file_path = 'fooddotcom_links.json'

        try:
            self.load()
        except FileNotFoundError:
            self.checked_urls = set()
            self.to_check_urls = [self.start_url]

        self.checked_urls.remove(self.start_url)

        print(len(self.checked_urls), len(self.to_check_urls))

    def save(self):
        with open(self.links_file_path, 'w', encoding='utf-8') as file:
            json.dump({
                'checked_urls': list(self.checked_urls),
                'to_check_urls': self.to_check_urls
            }, file, indent=4)

    def load(self):
        with open(self.links_file_path, 'r') as file:
            data = json.load(file)

        self.checked_urls = set(data['checked_urls'])
        self.to_check_urls = data['to_check_urls'] + [self.start_url]

    def search(self):
        count = 100

        try:
            while len(self.to_check_urls) > 0:
                curr_link = self.to_check_urls.pop()

                if curr_link in self.checked_urls:
                    continue

                headers = {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                    }
                         
                response = requests.get(curr_link, headers=headers)
                if response.status_code != 200:
                    print('Bad response')
                    continue

                self.to_check_urls = list(set(self.to_check_urls + re.findall(r'href="(https:\/\/www\.food\.com[^?"]*)"', response.text)))
                print(len(self.checked_urls), len(self.to_check_urls), curr_link)
                self.checked_urls.add(curr_link)

                count -= 1

                if count == 0:
                    count = 100
                    self.save()
        except KeyboardInterrupt:
            print('Saving')
            self.save()
        
        self.save()

    def create_data_file(self):
        date_file_path = "D:/qsine/scraped_data/fooddotcom_data.json"

        data = {}


        for url in self.checked_urls:
            if "www.food.com/recipe/" not in url:
                continue

            hashed_url = hashlib.md5(url.encode()).hexdigest()

            data[hashed_url] = {
                'recipe_name': '',
                'image_url': '',
                'image_path': '',
                'ingredients': [],
                'recipe_url': url
            }

        with open(date_file_path, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=4)

        print(len(data.keys()))


if __name__ == '__main__':
    fooddotcom_search = FooddotcomSearch()
    fooddotcom_search.search()
    # fooddotcom_search.create_data_file()

    # response = requests.get('https://www.food.com')

    # with open('test.html', 'w', ) as file:
    #     file.write(response.text)
