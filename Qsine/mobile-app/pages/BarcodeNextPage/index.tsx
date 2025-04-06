import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from "axios";
import { useSelector } from 'react-redux';

import { BarcodeNextPageRouteProp } from "@/types";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import KWBScreenWrapper from "@/components/KWBScreenWrapper";
import { RootState } from '@/store';

type RootStackParamList = {
    BarcodeNextPageEdit: { barcode: string; product: Product['product'] };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Product = {
    allergens: {
        allergies: string[];
        recipe_name: string;
    };
    product: {
        name: string;
        company: string;
        ingredients: string[];
    };
}

export default function BarcodeScanned() {
    const [data, setData] = useState<Product | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute();
    const barcode = (route as BarcodeNextPageRouteProp).params.barcode;
    const userAllergens = useSelector((state: RootState) => state.userAllergens.selectedAllergens);

    const formatAllergenText = (text: string) => {
        return text
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const fetchData = () => {
        const url = `https://9k6z4zqt-5001.use.devtunnels.ms/barcode/${barcode}`;
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
    };

    useEffect(() => {
        fetchData();
    }, [barcode]);

    if (error) {
        return (
            <KWBScreenWrapper headerText="Product Details">
                <View style={styles.card}>
                    <Text style={styles.errorText}>
                        {error === "Product not found" ? "Product not found" : `Error: ${error}`}
                    </Text>
                </View>
            </KWBScreenWrapper>
        );
    }

    if (!data) {
        return (
            <KWBScreenWrapper headerText="Product Details">
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading Product Details</Text>
                    <Text style={styles.loadingSubtext}>
                        This may take up to two minutes because I am cheap and don't want to pay for better cloud services.
                    </Text>
                    <View style={styles.loadingCard}>
                        <Text style={styles.loadingCardTitle}>What's happening?</Text>
                        <Text style={styles.loadingCardText}>
                            • Scanning product information{'\n'}
                            • Analyzing ingredients{'\n'}
                            • Checking for allergens{'\n'}
                            • Preparing detailed report
                        </Text>
                    </View>
                </View>
            </KWBScreenWrapper>
        );
    }

    const matchingAllergens = data?.allergens.allergies.filter(allergen => 
        userAllergens.some(userAllergen => {
            const formattedAllergen = allergen.toLowerCase().replace(/\s+/g, '_');
            const formattedUserAllergen = userAllergen.toLowerCase().replace(/\s+/g, '_');
            return formattedAllergen.includes(formattedUserAllergen);
        })
    ) || [];

    const otherAllergens = data?.allergens.allergies.filter(allergen => 
        !userAllergens.some(userAllergen => {
            const formattedAllergen = allergen.toLowerCase().replace(/\s+/g, '_');
            const formattedUserAllergen = userAllergen.toLowerCase().replace(/\s+/g, '_');
            return formattedAllergen.includes(formattedUserAllergen);
        })
    ) || [];

    return (
        <KWBScreenWrapper headerText="Product Details" backButtonActive={true}>
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.name}>{data.product.name}</Text>
                    <Text style={styles.company}>{data.product.company}</Text>
                </View>
                <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => navigation.navigate('BarcodeNextPageEdit', { 
                        barcode: barcode, 
                        product: data.product
                    })}
                >
                    <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Allergens</Text>
                {matchingAllergens.length > 0 ? (
                    <>
                        <Text style={styles.allergenCategoryTitle}>Your Allergens</Text>
                        {matchingAllergens.map((allergen, index) => (
                            <View key={`matching-${index}`} style={[styles.allergenItem, styles.matchingAllergen]}>
                                <View style={styles.allergenIconContainer}>
                                    <Text style={styles.warningIcon}>⚠️</Text>
                                </View>
                                <Text style={styles.allergenText}>{formatAllergenText(allergen)}</Text>
                            </View>
                        ))}
                    </>
                ) : (
                    <Text style={styles.noAllergensText}>No allergens that match your profile</Text>
                )}
                {otherAllergens.length > 0 ? (
                    <>
                        <Text style={styles.allergenCategoryTitle}>Other Allergens</Text>
                        {otherAllergens.map((allergen, index) => (
                            <View key={`other-${index}`} style={[styles.allergenItem, styles.otherAllergen]}>
                                <View style={styles.allergenIconContainer}>
                                    <Text style={styles.warningIcon}>⚠️</Text>
                                </View>
                                <Text style={[styles.allergenText, styles.otherAllergenText]}>{formatAllergenText(allergen)}</Text>
                            </View>
                        ))}
                    </>
                ) : (
                    <Text style={styles.noAllergensText}>No other allergens found</Text>
                )}
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                {data.product.ingredients.map((ingredient, index) => (
                    <Text key={index} style={styles.ingredientText}>• {ingredient}</Text>
                ))}
            </View>
        </KWBScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        marginBottom: 16,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    headerContent: {
        flex: 1,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    name: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    company: {
        fontSize: 16,
        color: '#666666',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    allergenItem: {
        backgroundColor: '#FFF1F0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD1D1',
    },
    allergenIconContainer: {
        marginRight: 8,
    },
    warningIcon: {
        fontSize: 16,
    },
    allergenText: {
        color: '#D4380D',
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    ingredientText: {
        fontSize: 16,
        color: '#4A4A4A',
        marginBottom: 8,
        lineHeight: 22,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    loadingText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1A1A1A',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 12,
    },
    loadingSubtext: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
    },
    loadingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    loadingCardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    loadingCardText: {
        fontSize: 16,
        color: '#4A4A4A',
        lineHeight: 24,
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
    },
    editButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 8,
    },
    editButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    allergenCategoryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginTop: 8,
        marginBottom: 8,
    },
    matchingAllergen: {
        backgroundColor: '#FFF1F0',
        borderColor: '#FFD1D1',
    },
    otherAllergen: {
        backgroundColor: '#F5F5F5',
        borderColor: '#E0E0E0',
    },
    otherAllergenText: {
        color: '#666666',
    },
    noAllergensText: {
        fontSize: 16,
        color: '#666666',
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 8,
    },
});