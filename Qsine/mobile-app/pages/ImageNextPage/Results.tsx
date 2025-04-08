import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { KWBScreenWrapper, KWBTypography } from '@/components';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

type RouteParams = {
    imagePath: string;
};

type ApiResponse = {
    data: {
        classifications: string[];
        confidences: number[];
        ingredients: string[];
        allergens: {
            allergies: string[];
        };
    };
};

type ClassificationData = {
    name: string;
    confidence: string;
};

export default function Results() {
    const route = useRoute();
    const { imagePath } = route.params as RouteParams;
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        recipe_name: string;
        allergies: string[];
        ingredients: string[];
    } | null>(null);
    const [classification, setClassification] = useState<[string, string]>(['0', '']);
    const [allClassifications, setAllClassifications] = useState<ClassificationData[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [fetchingAllergens, setFetchingAllergens] = useState(false);
    const [fetchingIngredients, setFetchingIngredients] = useState(false);
    const userAllergens = useSelector((state: RootState) => state.userAllergens.selectedAllergens);

    useEffect(() => {
        const processImage = async () => {
            try {
                setLoading(true);
                setError(null);

                // Create form data to send the image
                const formData = new FormData();
                formData.append('image', {
                    uri: imagePath,
                    type: 'image/png',
                    name: 'cropped_image.png',
                } as any);

                // Send the image to the API
                const response = await fetch('https://9k6z4zqt-5001.use.devtunnels.ms/classify-image', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to upload image to server');
                }

                const result = await response.json() as ApiResponse;
                console.log('Upload successful:', result);

                const data = result.data;

                // Store all classifications
                const classificationsList = data.classifications.map((name, index) => ({
                    name,
                    confidence: data.confidences[index].toString()
                }));
                setAllClassifications(classificationsList);

                // Set the classification and data
                setClassification([data.confidences[0].toString(), data.classifications[0]]);
                setData({
                    recipe_name: data.classifications[0],
                    allergies: data.allergens.allergies,
                    ingredients: data.ingredients
                });
            } catch (err) {
                console.error('Error processing image:', err);
                setError('Failed to process image. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        processImage();
    }, [imagePath]);

    const fetchAllergensForClassification = async (classificationName: string) => {
        try {
            setFetchingAllergens(true);
            setFetchingIngredients(true);
            
            const response = await fetch(`https://9k6z4zqt-5001.use.devtunnels.ms/get-classification/${encodeURIComponent(classificationName)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch allergens for classification');
            }

            const result = await response.json();
            console.log('Allergens fetched successfully:', result);

            // Update the data with the new allergens and ingredients
            if (data) {
                setData({
                    ...data,
                    allergies: result.data.allergens.allergies,
                    ingredients: result.data.ingredients || data.ingredients
                });
            }
        } catch (err) {
            console.error('Error fetching allergens:', err);
            setError('Failed to fetch allergens for this classification.');
        } finally {
            setFetchingAllergens(false);
            setFetchingIngredients(false);
        }
    };

    const handleClassificationChange = (index: number) => {
        if (index === selectedIndex) return;
        
        setSelectedIndex(index);
        const selectedClassification = allClassifications[index];
        setClassification([selectedClassification.confidence, selectedClassification.name]);
        
        // Fetch allergens for the selected classification
        fetchAllergensForClassification(selectedClassification.name);
    };

    const formatAllergenText = (text: string) => {
        return text
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    // If there's an error, display it
    if (error) {
        return (
            <KWBScreenWrapper headerText="Image Analysis" backButtonActive={true}>
                <View style={styles.card}>
                    <Text style={styles.errorText}>
                        {error === "Product not found" ? "Product not found" : `Error: ${error}`}
                    </Text>
                </View>
            </KWBScreenWrapper>
        );
    }

    // If data is not available yet, show loading state
    if (loading || !data) {
        return (
            <KWBScreenWrapper headerText="Image Analysis" backButtonActive={true}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Analyzing Image</Text>
                    <Text style={styles.loadingSubtext}>
                        This may take a moment while we process your image.
                    </Text>
                    <View style={styles.loadingCard}>
                        <Text style={styles.loadingCardTitle}>What's happening?</Text>
                        <Text style={styles.loadingCardText}>
                            • Analyzing food image{'\n'}
                            • Identifying ingredients{'\n'}
                            • Checking for allergens{'\n'}
                            • Preparing detailed report
                        </Text>
                    </View>
                </View>
            </KWBScreenWrapper>
        );
    }

    // Filter allergens based on user's allergen profile
    const matchingAllergens = data.allergies && Array.isArray(data.allergies) ? data.allergies.filter((allergen: string) => 
        userAllergens && Array.isArray(userAllergens) && userAllergens.some(userAllergen => {
            const formattedAllergen = allergen.toLowerCase().replace(/\s+/g, '_');
            const formattedUserAllergen = userAllergen.toLowerCase().replace(/\s+/g, '_');
            return formattedAllergen.includes(formattedUserAllergen);
        })
    ) || [] : [];

    const otherAllergens = data.allergies && Array.isArray(data.allergies) ? data.allergies.filter((allergen: string) => 
        userAllergens && Array.isArray(userAllergens) && !userAllergens.some(userAllergen => {
            const formattedAllergen = allergen.toLowerCase().replace(/\s+/g, '_');
            const formattedUserAllergen = userAllergen.toLowerCase().replace(/\s+/g, '_');
            return formattedAllergen.includes(formattedUserAllergen);
        })
    ) || [] : [];

    return (
        <KWBScreenWrapper headerText="Image Analysis" backButtonActive={true}>
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <KWBTypography variant="h2" style={styles.name}>
                            {classification && classification[1] ? classification[1][0].toUpperCase() + classification[1].slice(1) : 'Unknown'}
                        </KWBTypography>
                        <KWBTypography style={styles.confidenceText}>
                            Confidence: {classification && classification[0] ? (parseFloat(classification[0]) * 100).toFixed(1) : '0.0'}%
                        </KWBTypography>
                    </View>
                </View>

                {/* Classification Selector */}
                {allClassifications.length > 1 && (
                    <View style={styles.card}>
                        <KWBTypography variant="h3" style={styles.sectionTitle}>Other Possible Classifications</KWBTypography>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
                            {allClassifications.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.selectorItem,
                                        selectedIndex === index && styles.selectedSelectorItem
                                    ]}
                                    onPress={() => handleClassificationChange(index)}
                                >
                                    <KWBTypography style={[
                                        styles.selectorText,
                                        selectedIndex === index && styles.selectedSelectorText
                                    ]}>
                                        {item.name[0].toUpperCase() + item.name.slice(1)}
                                    </KWBTypography>
                                    <KWBTypography style={styles.selectorConfidence}>
                                        {(parseFloat(item.confidence) * 100).toFixed(1)}%
                                    </KWBTypography>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View style={styles.card}>
                    <KWBTypography variant="h3" style={styles.sectionTitle}>Allergens</KWBTypography>
                    {fetchingAllergens ? (
                        <View style={styles.fetchingContainer}>
                            <ActivityIndicator size="small" color="#007AFF" />
                            <Text style={styles.fetchingText}>Fetching allergens...</Text>
                        </View>
                    ) : (
                        <>
                            {matchingAllergens.length > 0 ? (
                                <>
                                    <KWBTypography style={styles.allergenCategoryTitle}>Your Allergens</KWBTypography>
                                    {matchingAllergens.map((allergen, index) => (
                                        <View key={`matching-${index}`} style={[styles.allergenItem, styles.matchingAllergen]}>
                                            <View style={styles.allergenIconContainer}>
                                                <KWBTypography style={styles.warningIcon}>⚠️</KWBTypography>
                                            </View>
                                            <KWBTypography style={styles.allergenText}>{formatAllergenText(allergen)}</KWBTypography>
                                        </View>
                                    ))}
                                </>
                            ) : (
                                <KWBTypography style={styles.noAllergensText}>No allergens that match your profile</KWBTypography>
                            )}
                            {otherAllergens.length > 0 ? (
                                <>
                                    <KWBTypography style={styles.allergenCategoryTitle}>Other Allergens</KWBTypography>
                                    {otherAllergens.map((allergen, index) => (
                                        <View key={`other-${index}`} style={[styles.allergenItem, styles.otherAllergen]}>
                                            <View style={styles.allergenIconContainer}>
                                                <KWBTypography style={styles.warningIcon}>⚠️</KWBTypography>
                                            </View>
                                            <KWBTypography style={[styles.allergenText, styles.otherAllergenText]}>{formatAllergenText(allergen)}</KWBTypography>
                                        </View>
                                    ))}
                                </>
                            ) : (
                                <KWBTypography style={styles.noAllergensText}>No other allergens found</KWBTypography>
                            )}
                        </>
                    )}
                </View>

                <View style={styles.card}>
                    <KWBTypography variant="h3" style={styles.sectionTitle}>Ingredients</KWBTypography>
                    {fetchingIngredients ? (
                        <View style={styles.fetchingContainer}>
                            <ActivityIndicator size="small" color="#2196F3" />
                            <KWBTypography style={styles.fetchingText}>Loading ingredients...</KWBTypography>
                        </View>
                    ) : (
                        data.ingredients.map((ingredient, index) => (
                            <KWBTypography key={index} style={styles.ingredientText}>• {ingredient}</KWBTypography>
                        ))
                    )}
                </View>
            </ScrollView>
        </KWBScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#F5F7FA',
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
    name: {
        marginBottom: 4,
    },
    confidenceText: {
        color: '#666666',
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
        marginBottom: 12,
    },
    selectorScroll: {
        marginTop: 8,
    },
    selectorItem: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 12,
        marginRight: 8,
        minWidth: 120,
    },
    selectedSelectorItem: {
        backgroundColor: '#2196F3',
    },
    selectorText: {
        color: '#4A4A4A',
        marginBottom: 4,
    },
    selectedSelectorText: {
        color: '#FFFFFF',
    },
    selectorConfidence: {
        fontSize: 12,
        color: '#666666',
    },
    allergenCategoryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginTop: 8,
        marginBottom: 8,
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
    ingredientText: {
        fontSize: 16,
        color: '#4A4A4A',
        marginBottom: 8,
        lineHeight: 22,
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
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
    fetchingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    fetchingText: {
        fontSize: 16,
        color: '#666666',
        marginLeft: 8,
    },
    matchingAllergen: {
        backgroundColor: '#FFF1F0',
        borderColor: '#FFD1D1',
    },
}); 