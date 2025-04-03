from collections import defaultdict
from fuzzywuzzy import fuzz, process
from pathlib import Path
import shutil
import json

# Define paths
all_data_dir = Path("./dataset/all_data")
cleaned_dir = Path("./dataset/cleaned_data")
output_file = Path("./category_mapping.json")  # File to save the category mapping

# Delete existing directories if they exist
if cleaned_dir.exists():
    shutil.rmtree(cleaned_dir)

# Create output directories if they don't exist
cleaned_dir.mkdir(parents=True, exist_ok=True)

# Get the categories
categories = [f.name for f in all_data_dir.iterdir() if f.is_dir()]

# Print number of original categories
print("Original categories:", len(categories))


# Step 1: Extract meaningful category keywords
def extract_main_category(cat):
    return "_".join(cat.split("_")[:3])  # Keep the first 3 hierarchy levels


# Step 2: Group categories using fuzzy matching
def group_similar_categories(categories, threshold=80):
    unique_categories = list(set(extract_main_category(cat) for cat in categories))
    category_map = {}

    for cat in unique_categories:
        match = process.extractOne(
            cat, category_map.keys(), scorer=fuzz.token_sort_ratio
        )

        if match and match[1] > threshold:
            category_map[cat] = match[0]  # Merge with the closest match
        else:
            category_map[cat] = cat  # Keep as a new group

    return category_map


# Step 3: Apply grouping and output cleaned categories
category_map = group_similar_categories(categories)

# Step 4: Generate final mapped categories
cleaned_categories = {
    cat: category_map[extract_main_category(cat)] for cat in categories
}

# Print category mappings
for original, new in cleaned_categories.items():
    print(f"{original}  -->  {new}")

# Step 5: Copy entire directories using shutil.copytree
for idx, (original, new) in enumerate(cleaned_categories.items()):
    print(f"Progress: {idx + 1}/{len(cleaned_categories)}")
    original_path = all_data_dir / original
    new_path = cleaned_dir / new

    # Copy the entire directory to the new location
    if not new_path.exists():
        shutil.copytree(original_path, new_path)
    else:
        # If the directory exists, merge it by copying the contents
        for file in original_path.iterdir():
            shutil.copy(file, new_path)

# Save the category mapping to a JSON file for future use
with open(output_file, "w") as f:
    json.dump(cleaned_categories, f, indent=4)

print("Cleaned categories:", len(set(cleaned_categories.values())))
print(f"Category mapping saved to {output_file}")
