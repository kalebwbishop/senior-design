from ultralytics import YOLO
import torch

DATA_PATH = "./data"  # Path to your dataset
PATIENCE = 10  # Number of epochs with no improvement before stopping

if __name__ == "__main__":
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")

    model = YOLO("yolo11n-cls.pt")
    best_loss = float("inf")
    epochs_no_improve = 0

    try:
        for epoch in range(100):
            print(f"Epoch {epoch+1}/100")
            results = model.train(data=DATA_PATH, epochs=1, imgsz=224, device=device)
            val_results = model.val(data=DATA_PATH, device=device)

            val_loss = val_results["loss"]  # Assuming the validation loss key is "loss"
            print(f"Validation Loss: {val_loss}")

            if val_loss < best_loss:
                best_loss = val_loss
                epochs_no_improve = 0
                model.save("best_model.pt")  # Save best model
            else:
                epochs_no_improve += 1
                print(f"No improvement for {epochs_no_improve} epochs")

            if epochs_no_improve >= PATIENCE:
                print("Early stopping triggered.")
                break

    except KeyboardInterrupt:
        print("\nTraining interrupted. Saving the model and exiting safely...")
        model.save("model.pt")
        print("Model saved.")

    finally:
        print("Process completed.")
