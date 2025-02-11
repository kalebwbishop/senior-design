from PIL import Image

def resize_image(input_path, output_path, new_size):
    with Image.open(input_path) as img:
        resized_img = img.resize((new_size, new_size))
        resized_img.save(output_path)

if __name__ == "__main__":
    input_path = 'Untitled.jpg'
    output_path = 'Untitled2.jpg'
    new_size = 672  # specify the new width

    resize_image(input_path, output_path, new_size)