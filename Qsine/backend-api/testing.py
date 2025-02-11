import json
import ollama
import re
import time

# Define classification categories
dish_types = ["Appetizer & Starter", "Main Course", "Side Dish", "Dessert", "etc."]
main_ingredients = ["Chicken", "Beef", "Vegetarian", "Seafood", "Pasta-Based", "Dairy", "Grain-Based", "etc."]
cooking_methods = ["Grilled", "Baked", "Fried", "Boiled", "Steamed", "Raw", "etc."]
cuisines = ["Italian", "Mexican", "Indian", "Chinese", "American", "Middle Eastern", "etc."]

categories = {
    "Dish Type": dish_types,
    "Main Ingredient": main_ingredients,
    "Cooking Method": cooking_methods,
    "Cuisine": cuisines,
}

# Function to classify a recipe in one API call
def classify_recipe(recipe):
    prompt = f"Classify the following recipe based on multiple attributes:\n\n" \
             f"Recipe Name: {recipe['recipe_name']}\nIngredients: {', '.join(recipe['ingredients'])}\n\n" \
             f"Provide the classification in the following format:\n" \
             f"- Dish Type: (one of {', '.join(dish_types)})\n" \
             f"- Main Ingredient: (one of {', '.join(main_ingredients)})\n" \
             f"- Cooking Method: (one of {', '.join(cooking_methods)})\n" \
             f"- Cuisine: (one of {', '.join(cuisines)})\n"

    response = ollama.generate(model='deepseek-r1:14b', prompt=prompt)

    response_text = response.get('response', '')

    # Extract classification results using regex
    results = {}
    for category, options in categories.items():
        pattern = rf"{category}:\s*({ '|'.join(options) })"
        match = re.search(pattern, response_text, re.IGNORECASE)
        results[category] = match.group(1) if match else "Unknown"

    return results

if __name__ == '__main__':
    with open(r"D:\qsine\scraped_data\new.json", 'r', encoding='utf-8') as f:
        data = json.load(f)

    total_recipes = len(data)
    current_recipe = 0

    try:
        for key, recipe in data.items():  # Iterate over all recipes
            last_time = time.time() - start_time if current_recipe > 0 else 0
            start_time = time.time()
            current_recipe += 1
            print(f"Estimated time remaining: {(total_recipes - current_recipe) * (last_time) / current_recipe:.2f} seconds")
            print(f"\n{(current_recipe / total_recipes) * 100:.2f}%\tClassifying Recipe: {recipe['recipe_name']}")

            if "classifications" in recipe:
                print("  Already classified. Skipping...")
                continue

            classifications = classify_recipe(recipe)

            for category, result in classifications.items():
                print(f"  {category}: {result}")

            print(f"Time taken: {time.time() - start_time:.2f} seconds")

            # Save the classification results in the recipe object
            recipe.update({"classifications": {
                "dish-type": classifications["Dish Type"],
                "main-ingredient": classifications["Main Ingredient"],
                "cooking-method": classifications["Cooking Method"],
                "cuisine": classifications["Cuisine"]
            }})

            data[key] = recipe

    except Exception as e:
        print(f"Error occurred: {e}")

    # Save the updated data
    with open(r"D:\qsine\scraped_data\new.json", 'w', encoding='utf-8') as f:
        print("\nSaving the updated data...")
        json.dump(data, f, indent=4)
