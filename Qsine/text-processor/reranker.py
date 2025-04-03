import torch
import csv
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sentence_transformers import CrossEncoder


model_name = "microsoft/deberta-v3-base"


def ParseLabel(label_path):
    with open(label_path, mode='r') as csvfile:
        reader = csv.reader(csvfile)
        header = next(reader, None)  # Skip the header row (if it exists)
        data_rows = [row for row in reader if len(row) == 2]
        dict1 = {row[0]: row[1] for row in data_rows}
        dict2 = {row[1]: row[0] for row in data_rows}
        return dict1, dict2, len(data_rows)
    

def PredictClass(model_path, label_path, query):
    #Parse Label
    id2label, label2id, numclass = ParseLabel(label_path)
    
    #Load model for inference
    tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
    model = AutoModelForSequenceClassification.from_pretrained(model_path, numlabels=numclass, local_files_only=True)
    
    # 2. Prepare Input Text
    inputs = tokenizer(query, padding=True, truncation=True, return_tensors="pt")
    
    # 3. Perform Inference
    with torch.no_grad():
        logits = model(**inputs).logits

    # The raw logits are in outputs.logits
    predicted_id = logits.argmax().item()

    # Return predicted class
    return id2label[predicted_id]

def RerankRecipe(model_name, query, dataset, rclass):
    #  Rerank recipes within class
    model = CrossEncoder(model_name)
    ranks = model.rank(query, dataset, return_documents=True)
    
    print("Query:", query)
    for rank in ranks:
        print(f"- #{rank['corpus_id']} ({rank['score']:.2f}): {rank['text']}")
    
    
def GetRecipe():
    pass    

if __name__ == "__main__":
    pass