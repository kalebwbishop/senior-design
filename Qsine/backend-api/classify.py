from ultralytics import YOLO
import json

class classify_obj:
    def __init__(self):
        self.model = YOLO("yolo11x-cls.pt")

        with open("model.json", "w") as f:
            json.dump(self.model.names, f)

    def classify(self, image_path):
        results = self.model(image_path)
        for result in results:
            probs = result.probs
            return self.model.names[probs.top1]

if __name__ == "__main__":
    yolo = classify_obj()
    print(yolo.classify("uploads/untitled.jpg"))