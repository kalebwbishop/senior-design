from os.path import dirname, join
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
from transformers import EarlyStoppingCallback
import csv
from datasets import load_dataset, ClassLabel
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import torch
import numpy as np


def compute_metrics(eval_pred):
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)
    #labels = labels.numpy()
    precision, recall, f1, _ = precision_recall_fscore_support(labels, predictions, average='weighted', zero_division=0)
    acc = accuracy_score(labels, predictions)
    return {
        'accuracy': acc,
        'f1': f1,
        'precision': precision,
        'recall': recall
    }


class BERT():
    #Initilize model and tokenizer
    def __init__(self, model_name, data_filepath = "", label_filepath=""):
        self.data = self.JSON2Dataset(data_filepath)
        self.unique_labels = self.GetLabels(self.data)
        print("Number of unique classes: {}".format(len(self.unique_labels)))
        
        self.model_name = model_name
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_name,
                                                                        num_labels=len(self.unique_labels))
        self.trainer = None
        self.training_args = None
        self.train_ready = False
        self.tk_train = None
        self.tk_valid = None        
    
    
    def SetTrainParam(self, outdir, lr, bsize, epochs, wgtdecay, maxgrad):
        self.training_args = TrainingArguments(
            output_dir=outdir,
            learning_rate=lr,
            per_device_train_batch_size=bsize,
            per_device_eval_batch_size=bsize,
            num_train_epochs=epochs,
            weight_decay=wgtdecay,
            eval_strategy="epoch",
            logging_strategy = "epoch",
            save_strategy ="epoch", # Disable automatic checkpoint saving
            save_total_limit = 3, # 2 checkpoints and 1 model
            max_grad_norm = maxgrad, #Gradient clipping
            load_best_model_at_end=True,
            fp16=True,  # Enable float16 mixed precision
            metric_for_best_model="f1",
            greater_is_better=True,     # Whether a higher value of the metric is better (for F1)
        )
    
    def JSON2Dataset(self,filepath):
        #Convert JSON to Dataset
        data = load_dataset('json', data_files=filepath)["train"]
        
        def parse_label(examples):
            # 1. Access the 'breadcrumbs' columns as lists of lists
            # 2. Extract the last element from each list   
            rtype = [sublist[-2] if len(sublist) >= 2 else "Recipes" for sublist in examples['breadcrumbs']]  
            #print(rtype)          
            #Create text columns
            txts = [examples['recipe_name'][i] \
                    + "\nIngredients: " + ",".join(examples['ingredients'][i]) \
                    + "\nDirections:" + " ".join(examples['steps'][i]) for i in range(len(examples['ingredients'])) ]
            
            return {'label': rtype, "text": txts}
            
        return data.map(parse_label, batched=True, batch_size=4, num_proc=4)
    
    def GetLabels(self, data):
        """Get list of unique labels"""        
        return list(set(data['label']))
    
    def TokenizeDataset(self, bsize=16, nprocs=16, maxlen=512):
        def preprocess_function(examples):
            #Create one hotcoded labels
            examples['label'] = [self.unique_labels.index(label) for label in examples['label']]
            return self.tokenizer(examples['text'], truncation=True, padding="max_length", max_length=maxlen)
        
        # Now you can perform the train_test_split without stratification:
        self.data = self.data.train_test_split(test_size=0.2, shuffle=True, seed=42)
        
        self.tk_train = self.data["train"].map(preprocess_function, batched=True, batch_size=bsize)
        self.tk_valid = self.data["test"].map(preprocess_function, batched=True, batch_size=bsize)
        self.data = None
        self.train_ready = True


    def Finetune(self, outdir, lr, bsize, epochs, wgtdecay, nprocs, maxlen, maxgrad, checkpoint=False):
        if not self.train_ready:
            self.TokenizeDataset(bsize, nprocs, maxlen)
        
        self.SetTrainParam(outdir, lr, bsize, epochs, wgtdecay, maxgrad)
        early_stopping_callback = EarlyStoppingCallback(early_stopping_patience=3)  # Stop if no improvement for 3 epochs
        trainer = Trainer(
            model=self.model,
            args=self.training_args,
            train_dataset=self.tk_train,
            eval_dataset=self.tk_valid,
            compute_metrics=compute_metrics,
            callbacks=[early_stopping_callback], # Stop if no improvement for 3 epochs
        )
        print("Starting training")
        history = trainer.train(resume_from_checkpoint=checkpoint) # Resume training from checkpoint in outdir
        print("Finished training")
        trainer.save_model(outdir)
        self.tokenizer.save_pretrained(outdir)

        logs = self.ProcessLogs(trainer.state.log_history)
        lb_dict = self.ProcessLabels(self.unique_labels)
        
        self.DumpData(outdir, "trainer_logs.csv", logs)
        self.DumpData(outdir, "labels_dict.csv", lb_dict)
        return logs
    
    def ProcessLogs(self, trainer_logs:list = []):
        all_logs = []
        for i in range(0, len(trainer_logs)-1, 2):
            log = trainer_logs[i] | trainer_logs[i+1]
            all_logs.append(log)
        return all_logs

    def ProcessLabels(self, labels):
        return [{"id": index, "label": label} for index, label in enumerate(labels)]
    
    def DumpData(self, save_dir = "", file_name = "test.csv", data:list = []):
        with open(join(save_dir, file_name), 'w') as csvfile:
            fieldnames = list(data[0].keys())
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)

    def SetModel(self, model_path, local_files_only = False):
        pass
    
    def Query(self):
        pass
    
    

    
if __name__ == "__main__":
    project_root = "/kaggle"
    model_name = "microsoft/deberta-v3-large"
    print(project_root)
    project_root = dirname(dirname(__file__))
    data_path = join(project_root, "data","all_recipes.json")
    
    model = BERT(model_name,data_path)
    model.Finetune(
        outdir = join(project_root, "text-processor", "deberta_multi-label_single-class"),
        lr = 1e-5,
        bsize = 4,
        epochs = 20,
        wgtdecay = 0.01,
        maxgrad = 1.0,
        nprocs = 4,
        maxlen = 512,
        checkpoint = False
    )
    
    
