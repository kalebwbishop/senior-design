from os.path import dirname, join
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from transformers import Trainer, TrainingArguments
import csv
from datasets import load_dataset


class BERT():
    #Initilize model and tokenizer
    def __init__(self, train_filepath, valid_filepath):
        self.train = self.JSON2Dataset(train_filepath)
        self.valid = self.JSON2Dataset(valid_filepath)
        self.unique_labels = self.GetLabels(self.train, self.valid)
        print("Number of unique classes: {}".format(len(self.unique_labels)))
        
        model_name = "microsoft/deberta-v3-base"
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_name,
                                                                        num_labels=len(self.unique_labels), 
                                                                        problem_type="multi_label_classification")
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
            evaluation_strategy="epoch",
            logging_strategy = "epoch",
            save_strategy="epoch",
            max_grad_norm = maxgrad,
            load_best_model_at_end=True,
            metric_for_best_model="f1",
        )
    
    def JSON2Dataset(self,filepath):
        #Convert JSON to Dataset
        data = load_dataset('json', data_files=filepath)["train"]
        
        def parse_label(examples):
            # 1. Access the 'breadcrumbs' columns as lists of lists
            # 2. Extract the last element from each list   
            rtype = [sublist[-2] if len(sublist) >= 2 else "Other" for sublist in examples['breadcrumbs']]  
            #print(rtype)          
            #Create text columns
            txts = [examples['recipe_name'][i] \
                    + "\nIngredients: " + ",".join(examples['ingredients'][i]) \
                    + "\nDirections:" + " ".join(examples['steps'][i]) for i in range(len(examples['ingredients'])) ]
            
            return {'labels': rtype, "text": txts}
            
        return data.map(parse_label, batched=True, batch_size=4, num_proc=4)
    
    def GetLabels(self, train_dataset, valid_dataset):
        """Get list of unique labels"""        
        return list(set(train_dataset['labels'] + valid_dataset['labels']))
    
    def TokenizeDataset(self, bsize=16, nprocs=16, maxlen=512):
        def preprocess_function(examples):
            #Create one hotcoded labels
            examples['labels'] = [[1.0 if lb == label else 0.0 for lb in self.unique_labels] for label in examples['labels']]
            return self.tokenizer(examples['text'], truncation=True, padding="max_length", max_length=maxlen)
        
        self.tk_train = self.train.map(preprocess_function, batched=True, batch_size=bsize, num_proc=nprocs)
        self.tk_valid = self.valid.map(preprocess_function, batched=True, batch_size=bsize, num_proc=nprocs)
        self.train = None
        self.valid = None
        self.train_ready = True


    def Finetune(self, outdir, lr, bsize, epochs, wgtdecay, nprocs, maxlen, maxgrad):
        if not self.train_ready:
            self.TokenizeDataset(bsize, nprocs, maxlen)
        
        self.SetTrainParam(outdir, lr, bsize, epochs, wgtdecay, maxgrad)
        trainer = Trainer(
            model=self.model,
            args=self.training_args,
            train_dataset=self.tk_train,
            eval_dataset=self.tk_valid,
        )
        
        history = trainer.train()
        trainer.save_model(outdir)
        logs = self.ProcessLogs(trainer.state.log_history)
        self.DumpData(outdir, "trainer_logs.csv", logs)
        return logs
    
    def ProcessLogs(self, trainer_logs:list = []):
        all_logs = []
        for i in range(0, len(trainer_logs)-1, 2):
            log = trainer_logs[i] | trainer_logs[i+1]
            all_logs.append(log)
        return all_logs
    
    def DumpData(self, save_dir = "", file_name = "test.csv", data:list = []):
        with open(join(save_dir, file_name), 'w') as csvfile:
            fieldnames = list(data[0].keys())
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)

    def SetModel(self, model_path, local_files_only = False):
        pass
    
    def TestModel():
        pass
        




if __name__ == "__main__":
    project_root = dirname(dirname(__file__))
    data_path = join(project_root, "data")
    train_path = join(data_path,"data.json")
    valid_path = train_path
    
    model = BERT(train_path, valid_path)
    model.Finetune(
        outdir = "./deberta_multi_label",
        lr = 2e-5,
        bsize = 4,
        epochs = 3,
        wgtdecay = 0.01,
        maxgrad = 1.0,
        nprocs = 4,
        maxlen = 512
    )
    
    
