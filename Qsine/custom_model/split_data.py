import os
import shutil
import logging
from sklearn.model_selection import train_test_split

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("data_split.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Define paths
all_data_dir = "./dataset/all_data"
train_dir = "./dataset/train"
test_dir = "./dataset/test"
val_dir = "./dataset/val"

# Delete existing directories if they exist
if os.path.exists(train_dir):
    logger.info(f"Removing existing directory: {train_dir}")
    shutil.rmtree(train_dir)
if os.path.exists(test_dir):
    logger.info(f"Removing existing directory: {test_dir}")
    shutil.rmtree(test_dir)
if os.path.exists(val_dir):
    logger.info(f"Removing existing directory: {val_dir}")
    shutil.rmtree(val_dir)

# Create output directories if they don't exist
logger.info("Creating output directories")
os.makedirs(train_dir, exist_ok=True)
os.makedirs(test_dir, exist_ok=True)
os.makedirs(val_dir, exist_ok=True)


# Function to move files to their respective directories
def move_files(file_list, source_dir, destination_dir):
    logger.info(f"Moving {len(file_list)} files to {destination_dir}")
    for file in file_list:
        class_name = os.path.basename(os.path.dirname(file))
        class_dir = os.path.join(destination_dir, class_name)
        os.makedirs(class_dir, exist_ok=True)
        shutil.copy(file, os.path.join(class_dir, os.path.basename(file)))


# Iterate through each class subfolder
logger.info(f"Starting data split process from {all_data_dir}")
for class_name in os.listdir(all_data_dir):
    class_dir = os.path.join(all_data_dir, class_name)
    if not os.path.isdir(class_dir):  # Skip if it's not a directory
        logger.warning(f"Skipping non-directory item: {class_name}")
        continue

    # Get all files for the current class
    all_files = [
        os.path.join(class_dir, f)
        for f in os.listdir(class_dir)
        if os.path.isfile(os.path.join(class_dir, f))
    ]

    # Skip empty class directories
    if len(all_files) < 400:
        logger.warning(f"Not enough files to split for class {class_name}. Skipping.")
        continue

    logger.info(f"Processing class {class_name} with {len(all_files)} files")

    # Split data into train, test, and validation sets
    train_files, temp_files = train_test_split(
        all_files, test_size=0.2, random_state=42
    )

    if len(temp_files) < 2:
        logger.warning(f"Not enough files to split for class {class_name}. Skipping.")
        continue

    test_files, val_files = train_test_split(
        temp_files, test_size=0.05, random_state=42
    )

    logger.info(f"Class {class_name} split: {len(train_files)} train, {len(test_files)} test, {len(val_files)} validation")

    # Move files while preserving class structure
    move_files(train_files, all_data_dir, train_dir)
    move_files(test_files, all_data_dir, test_dir)
    move_files(val_files, all_data_dir, val_dir)

logger.info("Data splitting completed successfully")
