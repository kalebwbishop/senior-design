from ultralytics import YOLO
import torch
from PIL import Image
import os


# Path to your saved model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pt")


# Function to load and perform inference on an image
def infer_image(image_path):
    # Load the trained model
    model = YOLO(MODEL_PATH)

    # Load the image
    img = Image.open(image_path)

    # Perform inference
    results = model(img)

    # Check if results contain the desired output
    if isinstance(results, list):
        result = results[0]  # Get the first result if it's a list
    else:
        result = results  # If it's not a list, use the result directly

    # Extract the class names and confidence scores
    probs = result.probs
    class_names = result.names

    return probs.top1conf.item(), class_names[probs.top1]


if __name__ == "__main__":
    image_path = "./test.jpg"  # Replace with the path to the image you want to test
    print(infer_image(image_path))
