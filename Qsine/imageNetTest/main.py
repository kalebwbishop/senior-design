from ultralytics import YOLO

# Load a model
model = YOLO("yolo11n-cls.pt") 

# Run batched inference on a list of images
results = model(["untitled.webp"])  # return a list of Results objects

# Process results list
for result in results:
    probs = result.probs  # Probs object for classification outputs

    print(model.names[probs.top1])  # print class and confidence
