**Train model:**
java -cp stanford-ner.jar edu.stanford.nlp.ie.crf.CRFClassifier -prop prop.txt
**Test model:**
java -cp stanford-ner.jar edu.stanford.nlp.ie.crf.CRFClassifier -loadClassifier classifiers/ingredient-ner-model.ser.gz -testFile data/gk_test.tsv