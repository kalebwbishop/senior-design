import torch
from sentence_transformers import CrossEncoder
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
    def __init__(self, json_path, k1=1.5, b=0.75):
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
                "text": self.original_texts[i],
                "recipe": self.data[i]
            })
        return results


    

def Reranker(query, model_path, old_results, n = 5):    
    #Load model for inference
    model = CrossEncoder(model_path)
    
    passages = [result["text"] for result in old_results[:n]]
    
    ranks = model.rank(query, passages)
    
    results = [{"recipe" : old_results[rank['corpus_id']]["recipe"],
                "similarity": float(rank['score'])} for rank in ranks]
        
    # Return predicted recipes
    return results
    
    
def GetRecipe(query, n = 5):
    #Get dish class
    
    project_root = dirname(dirname(__file__))
    data_path = join(project_root, "data")
    passage_path = join(data_path, "all_recipes.json")
    model_path = "cross-encoder/ms-marco-MiniLM-L6-v2"
    
    Ridentifier = BM25(passage_path)
    results = Ridentifier.get_top_n(query, n=n*10)
    results = Reranker(query, model_path, results, n=n)
    print(len(results))
    
    return results
        

if __name__ == "__main__":
    query = """Chicken Alfredo Pasta is a rich and creamy Italian-American dish made with tender slices 
    of grilled or pan-seared chicken breast served over a bed of fettuccine noodles. 
    The pasta is coated in a luxurious Alfredo sauce, typically made from butter, heavy cream, and Parmesan cheese, 
    resulting in a silky, cheesy texture that clings to every strand. Often garnished with freshly cracked black pepper 
    and parsley, this comfort dish balances savory flavors with a smooth, buttery finish. 
    Perfect for weeknight dinners or a cozy date night at home."""
    print(GetRecipe(query)[0])
    