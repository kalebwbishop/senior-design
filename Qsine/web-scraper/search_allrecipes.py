import requests
import re
import json

class SearchAllRecipes:
    allrecipes_links_file = 'allrecipes_links.json'

    def __init__(self):
        self.checked_links = []
        self.links_to_check = set(['https://www.allrecipes.com/'])
        self.current_link = None

    def fetch_allrecipes(self):
        if self.links_to_check:
            self.current_link = self.links_to_check.pop()

        if self.current_link in self.checked_links:
            return None

        response = requests.get(self.current_link)
        
        if response.status_code == 200:
            self.checked_links.append(self.current_link)

            return str(response.text.encode('utf-8')).replace("\n", "")
        else:
            print(f"Failed to retrieve data: {response.status_code}")

    def parse_links(self, text):
        # Use regex to extract all the links from the text
        # The regex pattern for links is: <a href="(.*?)"

        pattern = r' href="(https:\/\/www\.allrecipes\.com\/.*?)"'
        links = re.findall(pattern, text)

        url_validation = r'(http(s)?:\/\/)?(www\.)?[a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)'
        links = [link for link in links if re.match(url_validation, link)]

        [self.links_to_check.add(link) for link in links]

        with open(SearchAllRecipes.allrecipes_links_file, 'w') as f:
            f.write(json.dumps(self.checked_links, indent=4))


        return links
    
    def depth_first_search(self):
        while self.links_to_check:
            print(f"Links to check: {len(self.links_to_check)}")

            text = self.fetch_allrecipes()

            if not text:
                continue

            self.parse_links(text)

if __name__ == "__main__":
    search = SearchAllRecipes()
    search.depth_first_search()
