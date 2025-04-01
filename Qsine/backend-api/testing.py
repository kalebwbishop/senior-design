import sys

sys.path.append("../custom_model")

from classify import infer_image

if __name__ == "__main__":
    image_path = "./test.jpg"  # Replace with the path to the image you want to test
    print(infer_image(image_path))
