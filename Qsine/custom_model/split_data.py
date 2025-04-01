import os
import shutil
from sklearn.model_selection import train_test_split

# Define paths
all_data_dir = "./dataset/all_data"
train_dir = "./dataset/train"
test_dir = "./dataset/test"
val_dir = "./dataset/val"

# Delete existing directories if they exist
if os.path.exists(train_dir):
    shutil.rmtree(train_dir)
if os.path.exists(test_dir):
    shutil.rmtree(test_dir)
if os.path.exists(val_dir):
    shutil.rmtree(val_dir)

# Create output directories if they don't exist
os.makedirs(train_dir, exist_ok=True)
os.makedirs(test_dir, exist_ok=True)
os.makedirs(val_dir, exist_ok=True)


# Function to move files to their respective directories
def move_files(file_list, source_dir, destination_dir):
    for file in file_list:
        class_name = os.path.basename(os.path.dirname(file))
        class_dir = os.path.join(destination_dir, class_name)
        os.makedirs(class_dir, exist_ok=True)
        shutil.copy(file, os.path.join(class_dir, os.path.basename(file)))


# Iterate through each class subfolder
for class_name in os.listdir(all_data_dir):
    class_dir = os.path.join(all_data_dir, class_name)
    if not os.path.isdir(class_dir):  # Skip if it's not a directory
        continue

    # Get all files for the current class
    all_files = [
        os.path.join(class_dir, f)
        for f in os.listdir(class_dir)
        if os.path.isfile(os.path.join(class_dir, f))
    ]

    # Skip empty class directories
    if len(all_files) < 400:
        print(f"Not enough files to split for class {class_name}. Skipping.")
        continue

    # Split data into train, test, and validation sets
    train_files, temp_files = train_test_split(
        all_files, test_size=0.2, random_state=42
    )

    if len(temp_files) < 2:
        print(f"Not enough files to split for class {class_name}. Skipping.")
        continue

    test_files, val_files = train_test_split(
        temp_files, test_size=0.05, random_state=42
    )

    # Move files while preserving class structure
    move_files(train_files, all_data_dir, train_dir)
    move_files(test_files, all_data_dir, test_dir)
    move_files(val_files, all_data_dir, val_dir)
