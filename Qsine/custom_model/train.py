from ultralytics import YOLO
import torch

DATA_PATH = "./dataset"  # Path to your dataset

if __name__ == "__main__":
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")

    model = YOLO("yolo11n-cls.pt")

    try:
        # Save the trained model for inference
        model.train(
            data=DATA_PATH,
            epochs=100,
            imgsz=224,
            device=device,
            project="./runs",
        )

        # Validate the model
        results = model.val(data=DATA_PATH, imgsz=224)
        print(f"Validation results: {results}")

        model.save("model.pt")  # Save the model after training

    except KeyboardInterrupt:
        print("\nTraining interrupted. Saving the model and exiting safely...")
        model.save("model.pt")  # Save the model after training

    finally:
        print("Process completed.")
