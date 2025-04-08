import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, Modal } from "react-native";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { KWBScreenWrapper, KWBTypography } from "@/components";
import { RootState, AppDispatch } from "@/store";
import { setAllergens, loadAllergens } from "@/store/slices/userAllergensSlice";
import Tts from 'react-native-tts';

interface Allergen {
    name: string;
    id: string;
}

interface TranslatedAllergen {
    original: string;
    translated: string;
}

const capitalizeWords = (str: string): string => {
    return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

// Language codes mapping for Google Translate API
const language_codes: Record<string, string> = {
    'eng': 'en',
    'fre': 'fr',
    'spa': 'es',
    'deu': 'de',
    'ita': 'it',
    'nld': 'nl',
    'por': 'pt',
    'rus': 'ru',
    'tur': 'tr',
    'jpn': 'ja',
    'kor': 'ko',
    'chi': 'zh',
    'ara': 'ar',
    'hin': 'hi',
    'ben': 'bn',
    'pan': 'pa',
    'urd': 'ur',
    'vie': 'vi',
    'tha': 'th',
    'ind': 'id',
};

// "And" words for different languages
const andWords: Record<string, string> = {
    'eng': 'and',
    'fre': 'et',
    'spa': 'y',
    'deu': 'und',
    'ita': 'e',
    'nld': 'en',
    'por': 'e',
    'rus': 'и',
    'tur': 've',
    'jpn': 'と',
    'kor': '및',
    'chi': '和',
    'ara': 'و',
    'hin': 'और',
    'ben': 'এবং',
    'pan': 'ਅਤੇ',
    'urd': 'اور',
    'vie': 'và',
    'tha': 'และ',
    'ind': 'dan',
};

// Templates for different languages
const sentenceTemplates: Record<string, string> = {
    'eng': "I have the following allergies: {allergens}.",
    'fre': "J'ai les allergies suivantes: {allergens}.",
    'spa': "Tengo las siguientes alergias: {allergens}.",
    'deu': "Ich habe die folgenden Allergien: {allergens}.",
    'ita': "Ho le seguenti allergie: {allergens}.",
    'nld': "Ik heb de volgende allergieën: {allergens}.",
    'por': "Tenho as seguintes alergias: {allergens}.",
    'rus': "У меня есть следующие аллергии: {allergens}.",
    'tur': "Benim alerjilerim: {allergens}.",
    'jpn': "私は次のアレルギーを持っています: {allergens}.",
    'kor': "나는 다음 알레르기를 가지고 있습니다: {allergens}.",
    'chi': "我有以下过敏: {allergens}.",
    'ara': "لدي الأعراض التالية: {allergens}.",
    'hin': "मेरे पास इस है: {allergens}.",
    'ben': "আমার কাছে এটি রয়েছে: {allergens}.",
    'pan': "ਮेरੇ ਕੋਲ ਇਹ ਹੈ: {allergens}.",
    'urd': "میرے پاس اس ہے: {allergens}.",
    'vie': "Tôi có các alergia sau: {allergens}.",
    'tha': "ฉันมีอาการที่ต้องการติดต่อกับ: {allergens}.",
    'ind': "Saya memiliki alergi berikut: {allergens}.",    
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
    const [selectedLanguage, setSelectedLanguage] = useState('eng');
    const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
    const [translatedAllergens, setTranslatedAllergens] = useState<TranslatedAllergen[]>([]);
    const [translatedSentence, setTranslatedSentence] = useState<string>("");
    const [isTranslating, setIsTranslating] = useState(false);
    const [isTranslationResultModalVisible, setIsTranslationResultModalVisible] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const languages = [
        { label: 'English', value: 'eng' },
        { label: 'French', value: 'fre' },
        { label: 'Spanish', value: 'spa' },
        { label: 'German', value: 'deu' },
        { label: 'Italian', value: 'ita' },
        { label: 'Dutch', value: 'nld' },
        { label: 'Portuguese', value: 'por' },
        { label: 'Russian', value: 'rus' },
        { label: 'Turkish', value: 'tur' },
        { label: 'Japanese', value: 'jpn' },
        { label: 'Korean', value: 'kor' },
        { label: 'Chinese', value: 'chi' },
        { label: 'Arabic', value: 'ara' },
        { label: 'Hindi', value: 'hin' },
        { label: 'Bengali', value: 'ben' },
        { label: 'Punjabi', value: 'pan' },
        { label: 'Urdu', value: 'urd' },
        { label: 'Vietnamese', value: 'vie' },
        { label: 'Thai', value: 'tha' },
        { label: 'Indonesian', value: 'ind' },
        
    ];

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

    useEffect(() => {
        // Initialize TTS
        Tts.setDefaultLanguage('en');
        
        // Define callback functions
        const onStart = () => setIsSpeaking(true);
        const onFinish = () => setIsSpeaking(false);
        const onError = () => setIsSpeaking(false);
        
        // Set up event listeners
        Tts.addEventListener('tts-start', onStart);
        Tts.addEventListener('tts-finish', onFinish);
        
        return () => {
            // Clean up event listeners
            Tts.removeAllListeners('tts-start');
            Tts.removeAllListeners('tts-finish');
        };
    }, []);

    // Function to safely stop TTS
    const safeStopTTS = () => {
        try {
            // Try to stop TTS
            Tts.stop();
        } catch (error) {
            console.error('Error stopping TTS:', error);
            // Try alternative approach - speak empty string to effectively stop
            try {
                Tts.speak('');
            } catch (speakError) {
                console.error('Error with alternative stop method:', speakError);
            }
        } finally {
            setIsSpeaking(false);
        }
    };

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

    const formatAllergensList = (allergenNames: string[]): string => {
        if (allergenNames.length === 0) return "";
        if (allergenNames.length === 1) return allergenNames[0];
        
        // Get the "and" word in the target language
        const andWord = andWords[selectedLanguage as keyof typeof andWords] || 'and';
        
        if (allergenNames.length === 2) return `${allergenNames[0]} ${andWord} ${allergenNames[1]}`;
        
        const lastAllergen = allergenNames[allergenNames.length - 1];
        const otherAllergens = allergenNames.slice(0, -1).join(", ");
        return `${otherAllergens}, ${andWord} ${lastAllergen}`;
    };

    const handleTranslateAllergens = async () => {
        if (selectedAllergens.length === 0) {
            setError('Please select at least one allergen to translate');
            return;
        }

        try {
            setIsTranslating(true);
            setError(null);

            // Get the allergen names for the selected allergen IDs
            const selectedAllergenNames = selectedAllergens.map(id => {
                const allergen = allergens.find(a => a.id === id);
                return allergen ? allergen.name : '';
            }).filter(name => name !== '');

            // Use Google Translate API
            const translatedResults: TranslatedAllergen[] = [];
            
            try {
                // Translate all allergens at once
                const response = await axios.post(
                    'https://translation.googleapis.com/language/translate/v2?key=AIzaSyAYqB8wDAHTIeaSQapfsRvUxhfMVXi7JcY',
                    {
                        q: selectedAllergenNames,
                        source: 'en',
                        target: language_codes[selectedLanguage as keyof typeof language_codes],
                        format: 'text',
                        model: 'nmt'
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                if (response.data && response.data.data && response.data.data.translations) {
                    // Create pairs of original and translated allergens
                    const translations = response.data.data.translations;
                    for (let i = 0; i < selectedAllergenNames.length; i++) {
                        console.log(translations[i]);
                        translatedResults.push({
                            original: selectedAllergenNames[i],
                            translated: translations[i]?.translatedText || selectedAllergenNames[i]
                        });
                    }
                } else {
                    // If translation fails, use the original text for all allergens
                    selectedAllergenNames.forEach(name => {
                        translatedResults.push({
                            original: name,
                            translated: name
                        });
                    });
                }
            } catch (err) {
                console.error('Error translating allergens:', err);
                // If translation fails, use the original text for all allergens
                selectedAllergenNames.forEach(name => {
                    translatedResults.push({
                        original: name,
                        translated: name
                    });
                });
            }

            setTranslatedAllergens(translatedResults);

            // Create a sentence with the translated allergens
            const translatedAllergenNames = translatedResults.map(item => item.translated);
            const formattedAllergensList = formatAllergensList(translatedAllergenNames);
            
            // Get the template for the selected language
            const template = sentenceTemplates[selectedLanguage as keyof typeof sentenceTemplates] || sentenceTemplates['eng'];
            
            // Replace the placeholder with the formatted allergens list
            const sentence = template.replace('{allergens}', formattedAllergensList);
            setTranslatedSentence(sentence);
            
            setIsTranslationResultModalVisible(true);
        } catch (err) {
            setError('Failed to translate allergens. Please try again.');
            console.error('Error translating allergens:', err);
        } finally {
            setIsTranslating(false);
        }
    };

    const handleSpeakSentence = async () => {
        try {
            if (isSpeaking) {
                // Use the safe stop function
                safeStopTTS();
                return;
            }
            
            // Set the language for TTS based on the selected language
            const ttsLanguage = language_codes[selectedLanguage as keyof typeof language_codes] || 'en';
            await Tts.setDefaultLanguage(ttsLanguage);
            
            // Speak the translated sentence
            await Tts.speak(translatedSentence);
        } catch (err) {
            console.error('Error speaking sentence:', err);
            setIsSpeaking(false);
        }
    };

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
                    
                    {selectedAllergens.length > 0 && (
                        <View style={styles.translationSection}>
                            <KWBTypography style={styles.sectionTitle}>Translate Allergens</KWBTypography>
                            
                            <View style={styles.languageContainer}>
                                <KWBTypography style={styles.languageLabel}>Select Language:</KWBTypography>
                                <TouchableOpacity
                                    style={styles.languageButton}
                                    onPress={() => setIsLanguageModalVisible(true)}
                                >
                                    <KWBTypography style={styles.languageButtonText}>
                                        {languages.find(lang => lang.value === selectedLanguage)?.label || 'Select Language'}
                                    </KWBTypography>
                                </TouchableOpacity>

                                <Modal
                                    visible={isLanguageModalVisible}
                                    transparent={true}
                                    animationType="fade"
                                    onRequestClose={() => setIsLanguageModalVisible(false)}
                                >
                                    <TouchableOpacity
                                        style={styles.modalOverlay}
                                        activeOpacity={1}
                                        onPress={() => setIsLanguageModalVisible(false)}
                                    >
                                        <View style={styles.modalContent}>
                                            <ScrollView style={styles.languageScrollView}>
                                                {languages.map((language) => (
                                                    <TouchableOpacity
                                                        key={language.value}
                                                        style={[
                                                            styles.languageOption,
                                                            selectedLanguage === language.value && styles.selectedLanguageOption
                                                        ]}
                                                        onPress={() => {
                                                            setSelectedLanguage(language.value);
                                                            setIsLanguageModalVisible(false);
                                                        }}
                                                    >
                                                        <KWBTypography
                                                            style={[
                                                                styles.languageOptionText,
                                                                selectedLanguage === language.value && styles.selectedLanguageOptionText
                                                            ]}
                                                        >
                                                            {language.label}
                                                        </KWBTypography>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    </TouchableOpacity>
                                </Modal>
                            </View>

                            <TouchableOpacity
                                style={[styles.button, styles.translateButton]}
                                onPress={handleTranslateAllergens}
                                disabled={isTranslating}
                            >
                                <KWBTypography style={styles.buttonText}>
                                    {isTranslating ? 'Translating...' : 'Create Translation'}
                                </KWBTypography>
                            </TouchableOpacity>
                        </View>
                    )}
                    
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

                {/* Translation Results Modal */}
                <Modal
                    visible={isTranslationResultModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setIsTranslationResultModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.translationModalContent}>
                            <View style={styles.translationModalHeader}>
                                <KWBTypography style={styles.translationModalTitle}>
                                    {languages.find(lang => lang.value === selectedLanguage)?.label} Translation
                                </KWBTypography>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => {
                                        // Stop TTS if it's speaking
                                        if (isSpeaking) {
                                            safeStopTTS();
                                        }
                                        setIsTranslationResultModalVisible(false);
                                    }}
                                >
                                    <KWBTypography style={styles.closeButtonText}>✕</KWBTypography>
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.sentenceContainer}>
                                <KWBTypography style={styles.sentenceText}>
                                    {translatedSentence}
                                </KWBTypography>
                            </View>
                            
                            <TouchableOpacity
                                style={[styles.button, styles.speakButton, isSpeaking && styles.speakingButton]}
                                onPress={handleSpeakSentence}
                            >
                                <KWBTypography style={styles.buttonText}>
                                    {isSpeaking ? 'Stop Speaking' : 'Speak Sentence'}
                                </KWBTypography>
                            </TouchableOpacity>
                            
                            <View style={styles.translationDetailsContainer}>
                                <KWBTypography style={styles.translationDetailsTitle}>
                                    Individual Allergens:
                                </KWBTypography>
                                <ScrollView style={styles.translationModalScroll}>
                                    {translatedAllergens.map((item, index) => (
                                        <View key={index} style={styles.translationItem}>
                                            <KWBTypography style={styles.originalText}>
                                                {capitalizeWords(item.original)}
                                            </KWBTypography>
                                            <KWBTypography style={styles.translatedText}>
                                                {capitalizeWords(item.translated)}
                                            </KWBTypography>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>
                    </View>
                </Modal>
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
    languageContainer: {
        marginBottom: 16,
    },
    languageLabel: {
        marginBottom: 8,
        color: '#666666',
    },
    languageButton: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#FFFFFF',
    },
    languageButtonText: {
        color: '#333333',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        width: '80%',
        maxWidth: 300,
        maxHeight: '80%',
    },
    languageScrollView: {
        maxHeight: 400,
    },
    languageOption: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    selectedLanguageOption: {
        backgroundColor: '#2196F3',
    },
    languageOptionText: {
        fontSize: 16,
        color: '#333333',
    },
    selectedLanguageOptionText: {
        color: '#FFFFFF',
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    translateButton: {
        backgroundColor: '#2196F3',
    },
    speakButton: {
        backgroundColor: '#4CAF50',
        marginTop: 16,
    },
    speakingButton: {
        backgroundColor: '#F44336',
    },
    translationModalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        width: '90%',
        maxHeight: '80%',
        padding: 16,
    },
    translationModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    translationModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        fontSize: 18,
        color: '#666666',
    },
    sentenceContainer: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    sentenceText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#1A1A1A',
        textAlign: 'center',
        lineHeight: 24,
    },
    translationDetailsContainer: {
        marginTop: 16,
    },
    translationDetailsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    translationModalScroll: {
        maxHeight: 200,
    },
    translationItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    originalText: {
        fontSize: 16,
        color: '#4A4A4A',
        flex: 1,
    },
    translatedText: {
        fontSize: 16,
        color: '#2196F3',
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
    },
    translationSection: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
});