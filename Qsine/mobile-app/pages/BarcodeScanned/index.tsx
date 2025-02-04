import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable } from "react-native";
import { useRoute } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
import axios from "axios";

import { BarcodeScannedPageRouteProp } from "@/types";

import EditProduct from "./Components/EditProduct";

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
    const [editMode, setEditMode] = useState(false);

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
            return <EditProduct data={data} barcode={barcode} setError={setError} setData={setData}/>;
        }
        return <SafeAreaView style={styles.container}>
            <Text>Error: {error}</Text>
        </SafeAreaView>;
    }

    if (!data) {
        return <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center", marginInline: 20 }]}>
            <Text style={{ fontSize: 30, marginBottom: 20 }}>Loading...</Text>
            <Text>This may take up to two minutes because I am cheap and don't want to pay for better cloud services.</Text>
        </SafeAreaView>;
    }

    function handleEdit() {
        setEditMode(true);
    }

    if (editMode) {
        return <EditProduct data={data} barcode={barcode} setEditMode={setEditMode} setData={setData}/>;
    }

    console.log(data.ingredients.length);

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
        <View style={{ position: "absolute", bottom: 36, right: 36 }}>
            <Pressable onPress={handleEdit} style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#000", width: 72, height: 72, borderRadius: '40%' }}>
                <Feather name="edit-2" size={36} color="#FFFFFF" />
            </Pressable>
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