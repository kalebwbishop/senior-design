import torch
import csv
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sentence_transformers import CrossEncoder
from .train_model import BERT
import math
import json
from collections import Counter, defaultdict
from os.path import dirname, join

class BM25:
    def __init__(self, json_path, k1=1.5, b=0.75):
        self.k1 = k1
        self.b = b
        # Load and store original passages
        with open(json_path, "r", encoding="utf-8") as f:
            self.data = json.load(f)
        
        # Extract text content from each passage
        self.original_texts = [entry['recipe_name'] \
                    + "\nIngredients: " + ",".join(entry['ingredients']) \
                    + "\nDirections:" + " ".join(entry['steps']) for entry in self.data]
        
        # Tokenize and preprocess
        self.corpus = [self.tokenize(text) for text in self.original_texts]
        self.doc_lens = [len(doc) for doc in self.corpus]
        self.avgdl = sum(self.doc_lens) / len(self.doc_lens)
        self.df = self.compute_df()
        self.N = len(self.corpus)

    def tokenize(self, text):
        return text.lower().split()

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
        
        if return_ids and id_key in self.data[0]:
            return [(self.data[i][id_key], score) for i, score in sorted_scores[:n]]
        else:
            return [(self.original_texts[i], score) for i, score in sorted_scores[:n]]


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
    model = AutoModelForSequenceClassification.from_pretrained(model_path, numclass=nclass)
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    
    # 2. Prepare Input Text
    inputs = tokenizer(query, padding=True, truncation=True, return_tensors="pt")
    
    # 3. Perform Inference
    with torch.no_grad():
        logits = model(**inputs).logits

    # The raw logits are in outputs.logits
    predicted_id = logits.argmax().item()

    # Return predicted class
    return id2label[predicted_id]
    
    
def GetRecipe(query, model_path, label_path, passage_path):
    #Get dish class
    dclass = PredictClass(query, model_path, label_path)
    
    Ridentifier = BM25(passage_path)
    return Ridentifier.get_top_n(query, n=3)
        

if __name__ == "__main__":
    project_root = dirname(dirname(__file__))
    data_path = join(project_root, "data")
    model_path = "SussyCat/Qsine-DeBERTa-v1.2"
    label_path = join(data_path, "labels_dict.csv")
    passage_path = join(data_path, "all_recipes.json")
    