import json
from collections import Counter
import numpy as np
import os


def get_ingredients_by_category(category):
    """
    Get all ingredients from recipes in a specific category
    (second to last breadcrumb) sorted by frequency.

    Args:
        category (str): The category to filter by (second to last breadcrumb)

    Returns:
        tuple: (list of all ingredients sorted by frequency, Counter object with ingredient frequencies)
    """
    try:
        # Load the data from the JSON file
        file_path = os.path.join(os.path.dirname(__file__), "data.json")
        with open(file_path, "r") as f:
            recipes = json.load(f)

        category = category.lower().replace(" ", "_")

        # Filter recipes by the specified category (second to last breadcrumb)
        category_recipes = [
            recipe
            for recipe in recipes
            if len(recipe["breadcrumbs"]) >= 2
            and recipe["breadcrumbs"][-2].lower().replace(" ", "_") == category
        ]

        # Extract all ingredients from the filtered recipes
        all_ingredients = []
        for recipe in category_recipes:
            all_ingredients.extend(recipe["ingredients"])

        # Count frequencies
        ingredient_counts = Counter(all_ingredients)

        # Sort ingredients by frequency (descending)
        sorted_ingredients = sorted(
            ingredient_counts.items(), key=lambda x: x[1], reverse=True
        )

        # Filter out ingredients that appear only once
        filtered_ingredients = [
            ingredient for ingredient, count in sorted_ingredients if count > 1
        ]

        return filtered_ingredients, ingredient_counts

    except FileNotFoundError:
        print(f"Error: data.json file not found")
        return [], Counter()
    except json.JSONDecodeError:
        print(f"Error: data.json is not a valid JSON file")
        return [], Counter()
    except Exception as e:
        print(f"An error occurred: {e}")
        return [], Counter()


if __name__ == "__main__":
    category = "cookies"
    ingredients, ingredient_counts = get_ingredients_by_category(category)
    print(f"\nIngredients for {category}:")
    for ingredient in ingredients:
        count = ingredient_counts[ingredient]
        print(f"- {ingredient} (appears in {count} recipes)")
