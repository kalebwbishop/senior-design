import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, TextInput } from "react-native";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { KWBScreenWrapper, KWBTypography } from "@/components";
import { RootState, AppDispatch } from "@/store";
import { setAllergens, loadAllergens } from "@/store/slices/userAllergensSlice";

interface Allergen {
    name: string;
    id: string;
}

const capitalizeWords = (str: string): string => {
    return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export default function UserSettings() {
    const dispatch = useDispatch<AppDispatch>();
    const selectedAllergens = useSelector(
        (state: RootState) => state.userAllergens.selectedAllergens
    );
    const [allergens, setAllergensState] = useState<Allergen[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);
                // Fetch allergens and load stored allergens concurrently
                const [allergenResponse] = await Promise.all([
                    axios.get<Allergen[]>('https://9k6z4zqt-5001.use.devtunnels.ms/get-allergens'),
                    dispatch(loadAllergens()) // Use Redux Thunk action
                ]);

                setAllergensState(allergenResponse.data);
            } catch (err) {
                console.error('Error initializing:', err);
                setError('Failed to initialize settings');
            } finally {
                setLoading(false);
            }
        };

        void init();
    }, [dispatch]);

    const toggleAllergen = useCallback((allergenId: string) => {
        const newAllergens = selectedAllergens.includes(allergenId)
            ? selectedAllergens.filter((id) => id !== allergenId)
            : [...selectedAllergens, allergenId];
        dispatch(setAllergens(newAllergens));
    }, [dispatch, selectedAllergens]);

    const filteredAllergens = useMemo(() => {
        return allergens
            .filter(allergen =>
                allergen.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [allergens, searchQuery]);

    if (loading) {
        return (
            <KWBScreenWrapper headerText="User Settings" backButtonActive={true}>
                <View style={styles.card}>
                    <KWBTypography style={styles.loadingText}>Loading allergens...</KWBTypography>
                    <KWBTypography style={styles.loadingSubtext}>
                        Please wait while we fetch your allergen information.
                    </KWBTypography>
                </View>
            </KWBScreenWrapper>
        );
    }

    if (error) {
        return (
            <KWBScreenWrapper headerText="User Settings" backButtonActive={true}>
                <View style={styles.card}>
                    <KWBTypography style={styles.errorText}>{error}</KWBTypography>
                </View>
            </KWBScreenWrapper>
        );
    }

    return (
        <KWBScreenWrapper headerText="User Settings" backButtonActive={true}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.card}>
                    <KWBTypography style={styles.sectionTitle}>Select Your Allergens</KWBTypography>
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search allergens..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#999999"
                        />
                    </View>
                    <View style={styles.allergenList}>
                        {filteredAllergens.map((allergen) => (
                            <TouchableOpacity
                                key={allergen.id}
                                style={[
                                    styles.allergenItem,
                                    selectedAllergens.includes(allergen.id) && styles.selectedAllergen
                                ]}
                                onPress={() => toggleAllergen(allergen.id)}
                            >
                                <KWBTypography style={[
                                    styles.allergenText,
                                    selectedAllergens.includes(allergen.id) && styles.selectedAllergenText
                                ]}>
                                    {capitalizeWords(allergen.name)}
                                </KWBTypography>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </KWBScreenWrapper>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        padding: 16,
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 12,
    },
    allergenList: {
        gap: 12,
    },
    allergenItem: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    selectedAllergen: {
        backgroundColor: '#FFF1F0',
        borderColor: '#FFD1D1',
    },
    allergenText: {
        fontSize: 16,
        color: '#4A4A4A',
    },
    selectedAllergenText: {
        color: '#D4380D',
        fontWeight: '500',
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
    },
    loadingText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 12,
    },
    loadingSubtext: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
    },
    searchContainer: {
        marginBottom: 16,
    },
    searchInput: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1A1A1A',
    },
});