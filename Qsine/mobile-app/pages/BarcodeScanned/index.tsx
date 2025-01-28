import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { useRoute } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
import axios from "axios";

import { BarcodeScannedPageRouteProp } from "@/types";

import ProductNotFound from "./Components/ProductNotFound";

type Product = {
    name: string;
    company: string;
    ingredients: string[];
}

export default function BarcodeScanned() {
    const TestAlergies = new Set(["soy", "milk", "nonfat milk", "wheat", "corn", "sugar", "vanilla"]);

    const [data, setData] = useState<Product | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [alergies, setAlergies] = useState<Set<string>>(TestAlergies);

    const route = useRoute();
    const barcode = (route as BarcodeScannedPageRouteProp).params.barcode;

    useEffect(() => {
        const url = `https://senior-design-jhmb.onrender.com/barcode/${barcode}`;
        console.log(url);

        axios.get(url)
        .then(response => setData(response.data))
        .catch(error => {
            if (error.response) {
                console.error("Server Error:", error.response.data.message);
            } else {
                console.error("Error:", error.message);
            }
            setError(error.response?.data?.message || "Something went wrong");
        });
    
    }, [barcode]);

    if (error) {
        if (error === "Product not found") {
            return <ProductNotFound />;
        }
        return <SafeAreaView style={styles.container}>
            <Text>Error: {error}</Text>
        </SafeAreaView>;
    }

    if (!data) {
        return <SafeAreaView style={styles.container}>
            <Text>Loading...</Text>
        </SafeAreaView>;
    }

    const isDangerous = data.ingredients.filter(ingredient => alergies.has(ingredient));
    const isSafe = data.ingredients.filter(ingredient => !alergies.has(ingredient));

    return <SafeAreaView style={styles.container}>
        <Text style={styles.name}>{data.name}</Text>
        <Text style={styles.company}>{data.company}</Text>

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