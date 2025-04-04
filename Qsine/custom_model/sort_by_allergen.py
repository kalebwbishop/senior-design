import sys
import json
from tqdm import tqdm
sys.path.append("../allergen-detector")

from test_model import ProcessRecipe

if __name__ == "__main__":
    try:
        with open("../data/data.json", "r") as f:
            data = json.load(f)

        with open("../data/data_with_allergens.json", "r") as f:
            data_with_allergens = json.load(f)

        data_with_allergens_keys = [recipe["key"] for recipe in data_with_allergens]
        print(data_with_allergens_keys)

        for recipe in tqdm(data, desc="Processing recipes"):
            try:
                # Skip if allergens already exist
                if recipe["key"] in data_with_allergens_keys:
                    print(f"Skipping recipe {recipe['recipe_name']} because it already has allergens")
                    continue
                allergens = ProcessRecipe(recipe)
                recipe["allergens"] = allergens
            except Exception as e:
                print(f"Error processing recipe {recipe['recipe_name']}: {e}")
                continue

        with open("../data/data_with_allergens.json", "w") as f:
            json.dump(data, f, indent=4)
            
    except KeyboardInterrupt as e:
        print("\nInterrupted by user. Saving progress...")

        data_with_allergens = [recipe for recipe in data if "allergens" in recipe.keys()]

        with open("../data/data_with_allergens.json", "w") as f:
            json.dump(data_with_allergens, f, indent=4)
        print("Progress saved. Exiting...")
        sys.exit(0)

