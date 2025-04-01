
from os.path import dirname, join
from transformers import AutoTokenizer, DebertaV2ForSequenceClassification
import numpy as np
from torch.random import manual_seed
from torch import randint, tensor, int64
from torch.cuda import empty_cache
from transformers import Trainer, TrainingArguments
from datetime import datetime
import csv
from datasets import load_dataset, Dataset, load_metric
from peft import get_peft_model, LoraConfig, TaskType
import json

class BERT():
    #Initilize model and tokenizer
    def __init__(self, train_filepath, test_filepath, numclass):
        self.train_filepath = train_filepath
        self.test_filepath = test_filepath
        self.tokenizer = AutoTokenizer.from_pretrained("microsoft/deberta-v2-xlarge")
        self.model = DebertaV2ForSequenceClassification.from_pretrained("microsoft/deberta-v2-xlarge", 
                                                                        num_labels=numclass, 
                                                                        problem_type="multi_label_classification")

    
    def SetTrainParam(self, outdir, lr = 5e-5, bsize = 16, epochs = 3, wgtdecay = 0.1):
        self.training_args = TrainingArguments(
            output_dir=outdir,
            learning_rate=lr,
            per_device_train_batch_size=bsize,
            per_device_eval_batch_size=bsize,
            num_train_epochs=epochs,
            weight_decay=wgtdecay,
            evaluation_strategy="steps",
            logging_strategy = "steps",
            logging_steps = 10,
            eval_steps = 10,
        )

         
    def TokenizeDataset(self, bsize=16, nprocs=16, maxlen=512):
        def preprocess_function(examples):
            first_sentences = [[context] * 4 for context in examples["sent1"]]
            question_headers = examples["sent2"]
            second_sentences = [
                [f"{header} {examples[end][i]}" for end in self.choicetag] for i, header in enumerate(question_headers)
            ]

            first_sentences = sum(first_sentences, [])
            second_sentences = sum(second_sentences, [])

            tokenized_examples = self.tokenizer(first_sentences, second_sentences, truncation=True, padding=True, max_length=maxlen)
            return {k: [v[i : i + 4] for i in range(0, len(v), 4)] for k, v in tokenized_examples.items()}
        
        train_dataset = self.NPYtoDataset(self.train)
        valid_dataset = self.NPYtoDataset(self.valid)
        
        self.tk_train = train_dataset.map(preprocess_function, batched=True, batch_size=bsize, num_proc=nprocs)
        self.tk_valid = valid_dataset.map(preprocess_function, batched=True, batch_size=bsize, num_proc=nprocs)
        self.train_ready = True
    
    def Finetune(self, outdir, lr, bsize, epochs, wgtdecay, ttype, rval, ldropout, tmod, nprocs, maxlen):        
        if not self.train_ready:
            self.TokenizeDataset(bsize, nprocs, maxlen)
        
        self.SetTrainParam(outdir, lr, bsize, epochs, wgtdecay)
        self.SetLoraConfig(ttype, rval, ldropout, tmod)
        self.SetCollator()
        
        trainer = Trainer(
            model=get_peft_model(self.model, self.config),
            args=self.training_args,
            train_dataset=self.tk_train,
            eval_dataset=self.tk_train,
            tokenizer=self.tokenizer,
            data_collator=self.data_collator,
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

