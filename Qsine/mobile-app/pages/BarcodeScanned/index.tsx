import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import Feather from '@expo/vector-icons/Feather';

export default function BarcodeScanned() {

    const TestAlergies = new Set(["soy", "milk", "nonfat milk", "wheat", "corn", "sugar", "vanilla"]);

    const barcode = "014100099482";
    const TestData = {
        "name": "Vanilla Cupcake Goldfish Grahams",
        "company": "Pepperidge Farm",
        "ingredients": [
            "smiles",
            "whole wheat flour",
            "enriched wheat flour",
            "vegetable oils",
            "sugar",
            "cornstarch",
            "brown sugar",
            "invert syrup",
            "natural flavors",
            "salt",
            "nonfat milk",
            "baking soda",
            "corn syrup solids",
            "baking powder",
            "colors",
            "cream",
            "soy lecithin",
            "vanilla extract"
        ]
    }

    const isDangerous = TestData.ingredients.filter(ingredient => TestAlergies.has(ingredient));
    const isSafe = TestData.ingredients.filter(ingredient => !TestAlergies.has(ingredient));

    return <SafeAreaView style={styles.container}>
        <Text style={styles.name}>{TestData.name}</Text>
        <Text style={styles.company}>{TestData.company}</Text>

        <View>
            <Text>Dangerous Ingredients</Text>
            {isDangerous.map((ingredient, index) => {
                return <Text key={index} style={styles.ingredients}>{ingredient}</Text>
            })}
        </View>

        <View>
            <Text>Safe Ingredients</Text>
            {isSafe.map((ingredient, index) => {
                return <Text key={index} style={styles.ingredients}>{ingredient}</Text>
            })}
        </View>

        {/* Edit Data */}
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#FF0000", padding: 10 }}>
            <Text>Edit Data</Text>
            <Feather name="edit-2" size={24} color="#FFFFFF" />
        </View>
    </SafeAreaView>;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#A0BBEA",
    },
    name: {
        fontSize: 24,
        color: "#FFFFFF",
        marginBottom: 4
    },
    company: {
        fontSize: 20,
        color: "#FFFFFF",
        marginBottom: 8
    },
    barcode: {
        fontSize: 18
    },
    ingredients: {
        fontSize: 16,
        color: "#FFFFFF"
    }
});