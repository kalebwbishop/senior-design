import shutil
import os
with open('./archive/meta/meta/train.txt', 'r', encoding='utf-8') as f:
    data = f.readlines()
    data = [line.strip() for line in data]

    for line in data:
        # Move the file to the new location 
        source_path = "./archive/images/" + line.strip() + ".jpg"
        destination_path = "./datas/train/" + line.strip() + ".jpg"

        # Create the destination directory if it doesn't exist
        destination_dir = os.path.dirname(destination_path)
        if not os.path.exists(destination_dir):
            os.makedirs(destination_dir, exist_ok=True)

        print(f"Moving {source_path} to {destination_path}")
        shutil.move(source_path, destination_path)
        print(f"Moved {source_path} to {destination_path}")

