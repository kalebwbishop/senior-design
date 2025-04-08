import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { KWBScreenWrapper, KWBTypography } from '@/components';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

type RouteParams = {
    confirmedText: string;
};

type ClassificationData = {
    data: {
        classifications: string[];
        confidences: number[];
        ingredients: string[];
        allergens: {
            allergies: string[];
        };
        steps: string[];
        keys: string[];
    };
};

type ClassificationItem = {
    name: string;
    confidence: string;
};

export default function Results() {
    const route = useRoute();
    const { confirmedText } = route.params as RouteParams;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [classification, setClassification] = useState<[string, string]>(['0', '']);
    const [allClassifications, setAllClassifications] = useState<ClassificationItem[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [data, setData] = useState<{
        recipe_name: string;
        allergies: string[];
        ingredients: string[];
        steps: string[];
        keys: string[];
    } | null>(null);
    const [fetchingRecipe, setFetchingRecipe] = useState(false);
    const userAllergens = useSelector((state: RootState) => state.userAllergens.selectedAllergens);

    useEffect(() => {
        const classifyText = async () => {
            if (!confirmedText) {
                setError('No text provided for classification');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                
                const response = await axios.post('https://9k6z4zqt-5001.use.devtunnels.ms/classify-text', {
                    text: confirmedText
                });
                
                const result = response.data as ClassificationData;
                console.log('Classification successful:', result);

                const data = result.data;

                // Store all classifications with their confidence scores
                const classificationsList = data.classifications.map((name, index) => ({
                    name,
                    confidence: data.confidences ? data.confidences[index].toString() : '0'
                }));
                setAllClassifications(classificationsList);

                // Set the classification and data
                setClassification([data.confidences ? data.confidences[0].toString() : '0', data.classifications[0]]);
                setData({
                    recipe_name: data.classifications[0],
                    allergies: data.allergens.allergies,
                    ingredients: data.ingredients,
                    steps: data.steps,
                    keys: data.keys
                });
            } catch (err) {
                console.error('Error classifying text:', err);
                setError('Failed to classify text. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        classifyText();
    }, [confirmedText]);

    const fetchRecipeByKey = async (key: string) => {
        try {
            setFetchingRecipe(true);
            setError(null);
            
            const response = await axios.get(`https://9k6z4zqt-5001.use.devtunnels.ms/get-recipe/${key}`);
            console.log('Recipe fetched successfully:', response.data);
            
            const recipeData = response.data;
            
            // Update the data with the recipe details
            setData({
                recipe_name: recipeData.recipe_name || data?.recipe_name || '',
                allergies: data?.allergies || [],
                ingredients: recipeData.ingredients || data?.ingredients || [],
                steps: recipeData.steps || data?.steps || [],
                keys: data?.keys || []
            });
        } catch (err) {
            console.error('Error fetching recipe:', err);
            // Don't set error here to avoid disrupting the UI
        } finally {
            setFetchingRecipe(false);
        }
    };

    const handleClassificationChange = (index: number) => {
        if (index === selectedIndex) return;
        
        setSelectedIndex(index);
        const selectedClassification = allClassifications[index];
        setClassification([selectedClassification.confidence, selectedClassification.name]);
        
        // If we have a key for this classification, fetch the recipe data
        if (data?.keys && data.keys[index]) {
            fetchRecipeByKey(data.keys[index]);
        } else {
            // Otherwise, just update the recipe name
            setData({
                recipe_name: selectedClassification.name,
                allergies: data?.allergies || [],
                ingredients: data?.ingredients || [],
                steps: data?.steps || [],
                keys: data?.keys || []
            });
        }
    };

    const formatAllergenText = (text: string) => {
        return text
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    // Filter allergens based on user's allergen profile
    const matchingAllergens = data?.allergies && Array.isArray(data.allergies) ? data.allergies.filter((allergen: string) => 
        userAllergens && Array.isArray(userAllergens) && userAllergens.some(userAllergen => {
            const formattedAllergen = allergen.toLowerCase().replace(/\s+/g, '_');
            const formattedUserAllergen = userAllergen.toLowerCase().replace(/\s+/g, '_');
            return formattedAllergen.includes(formattedUserAllergen);
        })
    ) || [] : [];

    const otherAllergens = data?.allergies && Array.isArray(data.allergies) ? data.allergies.filter((allergen: string) => 
        userAllergens && Array.isArray(userAllergens) && !userAllergens.some(userAllergen => {
            const formattedAllergen = allergen.toLowerCase().replace(/\s+/g, '_');
            const formattedUserAllergen = userAllergen.toLowerCase().replace(/\s+/g, '_');
            return formattedAllergen.includes(formattedUserAllergen);
        })
    ) || [] : [];

    // If there's an error, display it
    if (error) {
        return (
            <KWBScreenWrapper headerText="Text Analysis" backButtonActive={true}>
                <View style={styles.card}>
                    <KWBTypography style={styles.errorText}>
                        {error}
                    </KWBTypography>
                </View>
            </KWBScreenWrapper>
        );
    }

    // If data is not available yet, show loading state
    if (loading) {
        return (
            <KWBScreenWrapper headerText="Text Analysis" backButtonActive={true}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <KWBTypography style={styles.loadingText}>Analyzing Text</KWBTypography>
                    <KWBTypography style={styles.loadingSubtext}>
                        This may take a moment while we process your text.
                    </KWBTypography>
                    <View style={styles.loadingCard}>
                        <KWBTypography style={styles.loadingCardTitle}>What's happening?</KWBTypography>
                        <KWBTypography style={styles.loadingCardText}>
                            • Extracting text from image{'\n'}
                            • Processing text content{'\n'}
                            • Classifying food items{'\n'}
                            • Identifying ingredients{'\n'}
                            • Checking for allergens{'\n'}
                            • Preparing detailed report
                        </KWBTypography>
                    </View>
                </View>
            </KWBScreenWrapper>
        );
    }

    return (
        <KWBScreenWrapper headerText="Text Analysis" backButtonActive={true}>
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <KWBTypography variant="h2" style={styles.title}>
                            {classification && classification[1] ? classification[1][0].toUpperCase() + classification[1].slice(1) : 'Unknown'}
                        </KWBTypography>
                        <KWBTypography style={styles.confidenceText}>
                            Confidence Score: {classification && classification[0] ? (Math.abs(parseFloat(classification[0]))).toFixed(1) : '0.0'}
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
                                        {Math.abs(parseFloat(item.confidence)).toFixed(1)}
                                    </KWBTypography>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View style={styles.card}>
                    <KWBTypography variant="h3" style={styles.sectionTitle}>Extracted Text</KWBTypography>
                    <KWBTypography style={styles.textContent}>
                        {confirmedText || 'No text was extracted from the image.'}
                    </KWBTypography>
                </View>

                {data && data.allergies && data.allergies.length > 0 && (
                    <View style={styles.card}>
                        <KWBTypography variant="h3" style={styles.sectionTitle}>Allergens</KWBTypography>
                        {fetchingRecipe ? (
                            <View style={styles.fetchingContainer}>
                                <ActivityIndicator size="small" color="#007AFF" />
                                <KWBTypography style={styles.fetchingText}>Fetching recipe data...</KWBTypography>
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
                )}

                {data && data.ingredients && data.ingredients.length > 0 && (
                    <View style={styles.card}>
                        <KWBTypography variant="h3" style={styles.sectionTitle}>Ingredients</KWBTypography>
                        {fetchingRecipe ? (
                            <View style={styles.fetchingContainer}>
                                <ActivityIndicator size="small" color="#007AFF" />
                                <KWBTypography style={styles.fetchingText}>Loading ingredients...</KWBTypography>
                            </View>
                        ) : (
                            <View style={styles.ingredientsList}>
                                {data.ingredients.map((ingredient, index) => (
                                    <View key={index} style={styles.ingredientItem}>
                                        <KWBTypography style={styles.ingredientText}>
                                            • {ingredient}
                                        </KWBTypography>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}
                {data && data.steps && data.steps.length > 0 && (
                    <View style={styles.card}>
                        <KWBTypography variant="h3" style={styles.sectionTitle}>Steps</KWBTypography>
                        {fetchingRecipe ? (
                            <View style={styles.fetchingContainer}>
                                <ActivityIndicator size="small" color="#007AFF" />
                                <KWBTypography style={styles.fetchingText}>Loading steps...</KWBTypography>
                            </View>
                        ) : (
                            <View style={styles.stepsList}>
                                {data.steps.map((step, index) => (
                                    <View key={index} style={styles.stepItem}>
                                        <KWBTypography style={styles.stepText}>
                                            • {step}
                                        </KWBTypography>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </KWBScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    title: {
        marginBottom: 4,
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
    textContent: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333333',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
        color: '#333333',
    },
    loadingSubtext: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 24,
    },
    loadingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    loadingCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333333',
    },
    loadingCardText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#666666',
    },
    errorText: {
        color: '#D32F2F',
        textAlign: 'center',
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
    ingredientsList: {
        marginTop: 8,
    },
    ingredientItem: {
        marginBottom: 8,
    },
    ingredientText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333333',
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
    matchingAllergen: {
        backgroundColor: '#FFF1F0',
        borderColor: '#FFD1D1',
    },
    stepsList: {
        marginTop: 8,
    },
    stepItem: {
        marginBottom: 8,
    },
    stepText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333333',
    },
    confidenceText: {
        color: '#666666',
    },
    selectorConfidence: {
        fontSize: 12,
        color: '#666666',
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
});
