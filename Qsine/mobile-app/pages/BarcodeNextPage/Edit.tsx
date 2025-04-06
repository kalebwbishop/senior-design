import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

import { BarcodeNextPageEditRouteProp } from '@/types';
import { KWBScreenWrapper, KWBTypography } from '@/components';

type Product = {
    product: {
        name: string;
        company: string;
        ingredients: string[];
    };
}

export default function EditProduct() {
    const [data, setData] = useState<Product | null>(null);
    const [editedData, setEditedData] = useState<Product | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const route = useRoute<BarcodeNextPageEditRouteProp>();
    const navigation = useNavigation();
    const { barcode, product } = route.params;

    useEffect(() => {
        // Initialize with the passed product data
        const transformedData = { product };
        setData(transformedData);
        setEditedData(transformedData);
    }, [product]);

    const handleSave = async () => {
        if (!editedData) return;
        
        setIsSaving(true);
        try {
            const url = `https://9k6z4zqt-5001.use.devtunnels.ms/barcode/${barcode}`;
            await axios.put(url, editedData);
            navigation.goBack();
        } catch (error) {
            setError("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    const updateProductName = (text: string) => {
        if (!editedData) return;
        setEditedData({
            ...editedData,
            product: {
                ...editedData.product,
                name: text
            }
        });
    };

    const updateCompany = (text: string) => {
        if (!editedData) return;
        setEditedData({
            ...editedData,
            product: {
                ...editedData.product,
                company: text
            }
        });
    };

    const updateIngredients = (text: string) => {
        if (!editedData) return;
        setEditedData({
            ...editedData,
            product: {
                ...editedData.product,
                ingredients: text.split('\n').filter(ingredient => ingredient.trim() !== '')
            }
        });
    };

    if (error) {
        return (
            <KWBScreenWrapper headerText="Edit Product" backButtonActive={true}>
                <View style={styles.card}>
                    <KWBTypography style={styles.errorText}>{error}</KWBTypography>
                </View>
            </KWBScreenWrapper>
        );
    }

    if (!data || !editedData) {
        return (
            <KWBScreenWrapper headerText="Edit Product" backButtonActive={true}>
                <View style={styles.card}>
                    <KWBTypography style={styles.loadingText}>Loading...</KWBTypography>
                </View>
            </KWBScreenWrapper>
        );
    }

    return (
        <KWBScreenWrapper headerText="Edit Product" backButtonActive={true}>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    <KWBTypography style={styles.saveButtonText}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </KWBTypography>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <KWBTypography variant="h3" style={styles.label}>Product Name</KWBTypography>
                <TextInput
                    style={styles.input}
                    value={editedData.product.name}
                    onChangeText={updateProductName}
                    placeholder="Enter product name"
                />
            </View>

            <View style={styles.card}>
                <KWBTypography variant="h3" style={styles.label}>Company</KWBTypography>
                <TextInput
                    style={styles.input}
                    value={editedData.product.company}
                    onChangeText={updateCompany}
                    placeholder="Enter company name"
                />
            </View>

            <View style={styles.card}>
                <KWBTypography variant="h3" style={styles.label}>Ingredients (one per line)</KWBTypography>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={editedData.product.ingredients?.join('\n') || ''}
                    onChangeText={updateIngredients}
                    multiline
                    numberOfLines={6}
                    placeholder="Enter ingredients (one per line)"
                />
            </View>
        </KWBScreenWrapper>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 16,
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
    label: {
        color: '#1A1A1A',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1A1A1A',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    saveButtonDisabled: {
        backgroundColor: '#999999',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingText: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
    },
});
