import torch
import csv
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sentence_transformers import CrossEncoder
from .train_model import BERT


def ParseLabel(label_path):
    with open(label_path, mode='r') as csvfile:
        reader = csv.reader(csvfile)
        header = next(reader, None)  # Skip the header row (if it exists)
        data_rows = [row for row in reader if len(row) == 2]
        dict1 = {row[0]: row[1] for row in data_rows}
        dict2 = {row[1]: row[0] for row in data_rows}
        return dict1, dict2, len(data_rows)
    

def PredictClass(classifier, label_path, query):
    #Parse Label
    id2label, label2id, numclass = ParseLabel(label_path)
    
    #Load model for inference
    model = BERT()
    
    # 2. Prepare Input Text
    inputs = tokenizer(query, padding=True, truncation=True, return_tensors="pt")
    
    # 3. Perform Inference
    with torch.no_grad():
        logits = model(**inputs).logits

    # The raw logits are in outputs.logits
    predicted_id = logits.argmax().item()

    # Return predicted class
    return id2label[predicted_id]

def RerankRecipe(reranker, query, passage, rclass):
    #  Rerank recipes within class
    model = CrossEncoder(reranker)
    ranks = model.rank(query, passage, return_documents=True)
    
    print("Query:", query)
    for rank in ranks:
        print(f"- #{rank['corpus_id']} ({rank['score']:.2f}): {rank['text']}")
    
    
def GetRecipe(query):
    #Get dish class
    
    pass    

if __name__ == "__main__":
    pass