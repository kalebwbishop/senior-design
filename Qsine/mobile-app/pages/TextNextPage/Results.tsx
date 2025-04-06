import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Image,
    Dimensions,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { KWBScreenWrapper, KWBTypography, KWBButton } from '@/components';

type RouteParams = {
    processedText?: string;
    manualText?: boolean;
};

const { width } = Dimensions.get('window');

export default function Results() {
    const route = useRoute();
    const navigation = useNavigation();
    const { processedText, manualText } = route.params as RouteParams;
    const [editedText, setEditedText] = useState(processedText);
    const textInputRef = useRef<TextInput>(null);

    useEffect(() => {
        // Focus the text input when component mounts
        textInputRef.current?.focus();
    }, []);

    const handleConfirm = () => {
        // Here you can handle the confirmed text
        // For now, we'll just go back to the previous screen
        navigation.goBack();
    };

    return (
        <KWBScreenWrapper headerText="Text Analysis" backButtonActive={true}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
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
                    </View>

                    <View style={styles.buttonContainer}>
                        <KWBButton
                            title={manualText ? 'Submit' : 'Confirm'}
                            onPress={handleConfirm}
                            variant="success"
                        />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </KWBScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
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
    buttonContainer: {
        padding: 16,
        marginTop: 'auto',
        gap: 12,
    },
});
