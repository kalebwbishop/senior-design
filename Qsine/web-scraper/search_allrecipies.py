import requests
import re
import json
import os

class AllrecipesSearch():
    def __init__(self):
        self.start_url = 'https://www.allrecipes.com/'
        self.links_file_path = './data/allrecipes/links.json'

        try:
            self.load()
        except FileNotFoundError:
            self.checked_urls = set()
            self.to_check_urls = [self.start_url]

    def save(self):
        os.makedirs(os.path.dirname(self.links_file_path), exist_ok=True)
        with open(self.links_file_path, 'w', encoding='utf-8') as file:
            json.dump({
                'checked_urls': list(self.checked_urls),
                'to_check_urls': self.to_check_urls
            }, file, indent=4)

    def load(self):
        with open(self.links_file_path, 'r') as file:
            data = json.load(file)

        self.checked_urls = set(data.get('checked_urls', []))
        self.to_check_urls = data.get('to_check_urls', []) + [self.start_url]

    def search(self):
        count = 100

        try:
            while len(self.to_check_urls) > 0:
                curr_link = self.to_check_urls.pop()

                if curr_link in self.checked_urls:
                    continue

                response = requests.get(curr_link)
                if response.status_code != 200:
                    print('Bad response')
                    continue

                self.to_check_urls = list(set(self.to_check_urls + re.findall(r'href="(https://www.allrecipes.com/(?!thmb)[^"?]+)', response.text)))
                print(len(self.checked_urls), len(self.to_check_urls), curr_link)
                self.checked_urls.add(curr_link)

                count -= 1

                if count == 0:
                    count = 100
                    self.save()
        except KeyboardInterrupt:
            self.save()
        
        self.save()

if __name__ == '__main__':
    allrecipes_search = AllrecipesSearch()
    allrecipes_search.search()
