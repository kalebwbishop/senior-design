# coding: utf-8

import nltk
from nltk.tag.stanford import StanfordNERTagger
from os.path import dirname, join, exists
import json
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np



project_path = dirname(__file__)
ner_path =  join(project_path, "stanford-ner-tagger")
data_path = join(ner_path, "data")
jar = join(ner_path, "stanford-ner.jar")
model = join(ner_path, "classifiers", "ingredient-ner-model.ser.gz")


def GetIngredients(ner_tagger, ingredients:list = []):
    parsed_ingredients = []
    for ingredient in ingredients:
        words = nltk.word_tokenize(ingredient)
        tag_lst =  ner_tagger.tag(words)        
        parsed_ingredients.append(" ".join([tag[0] for tag in tag_lst if tag[1] == 'NAME']))
    return parsed_ingredients

def AllergenMatch(ingredients:list, allergens:list):
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(allergens)
    query_vector = vectorizer.transform(ingredients)
    cosine_similarities = cosine_similarity(query_vector, tfidf_matrix)
    res = []
    for i, query in enumerate(ingredients):
        # Get similarity scores for this query
        scores = cosine_similarities[i]
        # Rank document indices based on scores (highest score first)
        ranked_doc_indices = np.argsort(scores)[::-1]
        # Add Ingredient and Allergen to result
        index = ranked_doc_indices[0]
        if scores[index] > 0:
            res.append({'ingredient': query, 'allergen': allergens[index]})
    return res
    
def RecipeProcessor(ner_tagger = StanfordNERTagger(model, jar, encoding='utf8'), recipe:dict = None, df_allergies = []):
    tk_ingredients = GetIngredients(ner_tagger, recipe['ingredients'])
    allergens = df_allergies['food'].tolist()
    allergens = AllergenMatch(tk_ingredients, allergens)
    allergens = pd.DataFrame(allergens, columns=['food'])
    
    allergies = df_allergies.join(allergies, lsuffix='_org', rsuffix='_sub', on='food')['allergy'].tolist()
    return {
        'recipe_name': recipe['recipe_name'],
        'allergeies': allergies
    }


if __name__ == "__main__":
    
    # Prepare NER tagger with english model
    
    ingredientsDB = dict()
    ner_tagger = StanfordNERTagger(model, jar, encoding='utf8')
    df_allergies = pd.read_csv(join(data_path, 'AllergenData.csv'),  encoding='utf8')
    df_allergies['allergen'] = df_allergies['allergen'].astype(str)
    df_allergies = df_allergies[["allergen", "allergy"]]

    with open(join(data_path, 'parsed_data.json'), 'r', encoding='utf8') as file:
        for recipe in json.load(file):
            ingredients = GetIngredients(ner_tagger, recipe['ingredients'])
            allergens = AllergenMatch(ingredients, df_allergies['allergen'].tolist())
            allergens = pd.DataFrame.from_dict(allergens)
            allergens['allergen'] = allergens['allergen'].astype(str)            
            allergies = df_allergies.merge(allergens, how='inner', left_on='allergen', 
                                           right_on='allergen', suffixes=('_left', '_right'))['allergy'].unique().tolist()
            
            recipe_name = recipe['recipe_name']
            print(recipe['recipe_name'],allergies)