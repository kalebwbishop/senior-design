# coding: utf-8

import nltk
from nltk.tag.stanford import StanfordNERTagger
from os.path import dirname, join, exists

sentence = u"Twenty miles east of Reno, Nev., " \
    "where packs of wild mustangs roam free through " \
    "the parched landscape, Tesla Gigafactory 1 " \
    "sprawls near Interstate 80."

jar = './stanford-ner-tagger/stanford-ner.jar'
model = './stanford-ner-tagger/ner-model-english.ser.gz'

if exists(jar):
    print("file found")
else:
    print("file not found")

# Prepare NER tagger with english model
#ner_tagger = StanfordNERTagger(model, jar, encoding='utf8')

# Tokenize: Split sentence into words
#words = nltk.word_tokenize(sentence)

# Run NER tagger on words
#print(ner_tagger.tag(words))