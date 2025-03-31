import cv2
from ultralytics import YOLO


class classify_obj:
    def __init__(self):
        self.model = YOLO("yolo11x-cls.pt")

    def classify(self, image_path):
        """
        Classify an image using the YOLO model
        Returns the top 5 predicted classes and their probabilities
        """
        img = cv2.imread(image_path)
        result = self.model.predict(source=img, save_txt=False, save_conf=True)[0]

        return [
            {
                "class": result.names.get(prob_idx),
                "prob": result.probs.top5conf[idx].item(),
            }
            for idx, prob_idx in enumerate(result.probs.top5)
        ]


if __name__ == "__main__":
    obj = classify_obj()
    print(obj.classify("D:/qsine/uploads/temp_classify.jpg"))
