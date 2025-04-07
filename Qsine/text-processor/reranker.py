import torch
import csv
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import math
import json
from collections import Counter, defaultdict
from os.path import dirname, join
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import string
import unicodedata



class BM25:
    def __init__(self, json_path, rclass = "Recipes", k1=1.5, b=0.75):
        self.k1 = k1
        self.b = b
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))
        # Load and store original passages
        with open(json_path, "r", encoding="utf-8") as file:
            self.data = json.load(file)
        
        
        # Extract text content from each passage
        self.txt_ids = [entry["key"] for entry in self.data] 
        self.original_texts = [entry['recipe_name'] \
                    + "\nIngredients: " + ", ".join(entry['ingredients']) \
                    + "\nDirections:" + " ".join(entry['steps']) for entry in self.data]
        
        # Tokenize and preprocess
        self.corpus = [self.tokenize(text) for text in self.original_texts]
        self.doc_lens = [len(doc) for doc in self.corpus]
        self.avgdl = sum(self.doc_lens) / len(self.doc_lens)
        self.df = self.compute_df()
        self.N = len(self.corpus)

    def tokenize(self, text):
        #Normalize to ASCII
        text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
        
        #Remove punctuation
        text = text.translate(str.maketrans('', '', string.punctuation))

        # Tokenize and lemmatize
        tokens = word_tokenize(text.lower())
        tokens = [t for t in tokens if t not in self.stop_words and t.isalpha()]
        return [self.lemmatizer.lemmatize(t) for t in tokens]

    def compute_df(self):
        df = defaultdict(int)
        for doc in self.corpus:
            for term in set(doc):
                df[term] += 1
        return df

    def idf(self, term):
        df = self.df.get(term, 0)
        return math.log(1 + (self.N - df + 0.5) / (df + 0.5))

    def score(self, query, index):
        score = 0.0
        doc = self.corpus[index]
        freqs = Counter(doc)
        dl = self.doc_lens[index]
        for term in self.tokenize(query):
            if term not in freqs:
                continue
            f = freqs[term]
            idf = self.idf(term)
            denom = f + self.k1 * (1 - self.b + self.b * dl / self.avgdl)
            score += idf * ((f * (self.k1 + 1)) / denom)
        return score

    def get_top_n(self, query, n=5, return_ids=False, id_key="id"):
        scores = [(i, self.score(query, i)) for i in range(len(self.corpus))]
        sorted_scores = sorted(scores, key=lambda x: x[1], reverse=True)
        
        results = []
        for i, score in sorted_scores[:n]:
            results.append({
                "id": self.txt_ids[i],  # 'key' from JSON
                "recipe": self.data[i],
                "similarity": score
            })
        return results


def ParseLabel(label_path):
    with open(label_path, mode='r') as csvfile:
        reader = csv.reader(csvfile)
        header = next(reader, None)  # Skip the header row (if it exists)
        data_rows = [row for row in reader if len(row) == 2]
        id2label = {row[0]: row[1] for row in data_rows}
        label2id = {row[1]: row[0] for row in data_rows}
        return id2label, label2id, len(data_rows)
    

def PredictClass(query, model_path, label_path):
    #Parse Label
    id2label, label2id, nclass = ParseLabel(label_path)
    
    #Load model for inference
    model = AutoModelForSequenceClassification.from_pretrained(model_path, num_labels=nclass)
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    
    # 2. Prepare Input Text
    inputs = tokenizer(query, padding="max_length", truncation=True, return_tensors="pt", max_length=512)
    
    # 3. Perform Inference
    with torch.no_grad():
        logits = model(**inputs).logits

    # The raw logits are in outputs.logits
    predicted_id = logits.argmax().item()

    # Return predicted class
    return id2label[str(predicted_id)]
    
    
def GetRecipe(query, n = 3):
    #Get dish class
    #dclass = PredictClass(query, model_path, label_path)
    project_root = dirname(dirname(__file__))
    data_path = join(project_root, "data")
    passage_path = join(data_path, "all_recipes.json")
    
    Ridentifier = BM25(passage_path)
    return Ridentifier.get_top_n(query, n=n)
        

if __name__ == "__main__":
    query = """Chicken Alfredo Pasta is a rich and creamy Italian-American dish made with tender slices 
    of grilled or pan-seared chicken breast served over a bed of fettuccine noodles. 
    The pasta is coated in a luxurious Alfredo sauce, typically made from butter, heavy cream, and Parmesan cheese, 
    resulting in a silky, cheesy texture that clings to every strand. Often garnished with freshly cracked black pepper 
    and parsley, this comfort dish balances savory flavors with a smooth, buttery finish. 
    Perfect for weeknight dinners or a cozy date night at home."""
    print(GetRecipe(query))
    