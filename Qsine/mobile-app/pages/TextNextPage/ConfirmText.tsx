import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Image,
    Dimensions,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import { KWBScreenWrapper, KWBTypography, KWBButton } from '@/components';

type RootStackParamList = {
    TextNextPageResults: {
        confirmedText: string;
    };
};

type RouteParams = {
    processedText?: string;
    language?: string;
    manualText?: boolean;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

export default function ConfirmText() {
    const route = useRoute();
    const navigation = useNavigation<NavigationProp>();
    const { processedText, manualText, language } = route.params as RouteParams;
    const [editedText, setEditedText] = useState(processedText);
    const [originalText, setOriginalText] = useState(processedText);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [translatedText, setTranslatedText] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [showTranslation, setShowTranslation] = useState(false);
    const textInputRef = useRef<TextInput>(null);

    const language_codes = {
        'eng': 'en',
        'fre': 'fr',
        'spa': 'es',
    }

    useEffect(() => {
        // Focus the text input when component mounts
        textInputRef.current?.focus();
        
        // Auto-translate if language is not English
        if (processedText && language && language.toLowerCase() !== 'eng') {
            translateText(true);
        }
    }, []);

    // Check if text has been modified
    const isTextModified = () => {
        return editedText !== originalText;
    };

    const translateText = async (isAutoTranslate = false) => {
        if (!editedText) {
            setError('No text to translate');
            return;
        }

        try {
            setIsTranslating(true);
            setError(null);

            console.log('Translating text:', editedText);
            console.log('Language:', language);
            
            const response = await axios.post(
                'https://translation.googleapis.com/language/translate/v2',
                null,
                {
                    params: {
                        key: 'AIzaSyAYqB8wDAHTIeaSQapfsRvUxhfMVXi7JcY',
                        q: editedText,
                        target: 'en', // Default to English
                        source: language_codes[language as keyof typeof language_codes],
                        format: 'text'
                    }
                }
            );
            
            if (response.data && response.data.data && response.data.data.translations) {
                const translatedText = response.data.data.translations[0].translatedText;
                setTranslatedText(translatedText);
                setShowTranslation(true);
                
                // No longer showing alert for manual translation
                // Just update the translated text in the UI
            } else {
                setError('Failed to translate text');
            }
        } catch (err) {
            console.error('Error translating text:', err);
            setError('Failed to translate text. Please try again.');
        } finally {
            setIsTranslating(false);
        }
    };

    const handleConfirm = async () => {
        if (!editedText) {
            setError('Please enter some text');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            // Use translated text if available, otherwise use edited text
            const textToSubmit = translatedText || editedText;
            
            // Navigate back with the classification results
            navigation.navigate('TextNextPageResults', {
                confirmedText: textToSubmit,
            });
        } catch (err) {
            console.error('Error classifying text:', err);
            setError('Failed to classify text. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KWBScreenWrapper headerText="Text Analysis" backButtonActive={true}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <ScrollView style={styles.scrollView}>
                    <View style={styles.content}>
                        <View style={styles.card}>
                            <KWBTypography variant="h2" style={styles.cardTitle}>{manualText ? 'Please Enter Text' : 'Extracted Text'}</KWBTypography>
                            <TextInput
                                ref={textInputRef}
                                value={editedText}
                                onChangeText={setEditedText}
                                multiline
                                style={styles.textInput}
                                textAlignVertical="top"
                            />
                            {error && (
                                <KWBTypography style={styles.errorText}>{error}</KWBTypography>
                            )}
                        </View>

                        {showTranslation && translatedText && (
                            <View style={styles.card}>
                                <KWBTypography variant="h2" style={styles.cardTitle}>Translated Text</KWBTypography>
                                <View style={styles.translatedTextContainer}>
                                    <KWBTypography style={styles.translatedText}>{translatedText}</KWBTypography>
                                </View>
                            </View>
                        )}

                        <View style={styles.buttonContainer}>
                            {loading ? (
                                <ActivityIndicator size="large" color="#007AFF" />
                            ) : (
                                <>
                                    {processedText && !manualText && language && language.toLowerCase() !== 'eng' && isTextModified() && (
                                        <KWBButton
                                            title={isTranslating ? "Translating..." : "Retranslate"}
                                            onPress={isTranslating ? () => {} : () => translateText(false)}
                                            variant="secondary"
                                        />
                                    )}
                                    <KWBButton
                                        title={manualText ? 'Submit' : 'Confirm'}
                                        onPress={handleConfirm}
                                        variant="success"
                                    />
                                </>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </KWBScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingBottom: 20,
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
    cardTitle: {
        marginBottom: 12,
    },
    imageContainer: {
        width: width - 64,
        aspectRatio: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    resultText: {
        lineHeight: 24,
    },
    loadingContainer: {
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        color: '#666666',
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        minHeight: 100,
        fontSize: 16,
        lineHeight: 24,
        color: '#000000',
    },
    translatedTextContainer: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        minHeight: 100,
        backgroundColor: '#F9F9F9',
    },
    translatedText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#000000',
    },
    buttonContainer: {
        padding: 16,
        marginTop: 'auto',
        gap: 12,
    },
    errorText: {
        color: '#FF3B30',
        marginTop: 8,
        fontSize: 14,
    },
});
