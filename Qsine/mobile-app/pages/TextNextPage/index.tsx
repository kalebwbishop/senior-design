import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ImageCropPicker from 'react-native-image-crop-picker';
import { KWBScreenWrapper, KWBTypography } from '@/components';
import { Picker } from '@react-native-picker/picker';

type RootStackParamList = {
    TextNextPageResults: {
        croppedImagePath: string;
        processedText: string;
    };
};

type RouteParams = {
    imagePath: string;
};

const { width } = Dimensions.get('window');

export default function TextNextPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [croppedImagePath, setCroppedImagePath] = useState<string | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState('eng');
    const route = useRoute();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const imagePath = (route.params as RouteParams)?.imagePath;

    const handleCropImage = async () => {
        try {
            setLoading(true);
            setError(null);

            const croppedImage = await ImageCropPicker.openCropper({
                path: imagePath,
                mediaType: 'photo',
                width: 8192,
                height: 8192,
                freeStyleCropEnabled: true,
                cropperToolbarTitle: 'Crop Text Area',
                cropperToolbarColor: '#FFFFFF',
                cropperStatusBarColor: '#FFFFFF',
                cropperActiveWidgetColor: '#2196F3',
                cropperToolbarWidgetColor: '#2196F3',
                showCropGuidelines: true,
                enableRotationGesture: true,
                cropperCancelText: 'Cancel',
                cropperChooseText: 'Confirm',
            });

            setCroppedImagePath(croppedImage.path);
            setLoading(false);
        } catch (err) {
            setError('Failed to crop image. Please try again.');
            console.error('Error cropping image:', err);
            setLoading(false);
        }
    };

    const handleSubmitImage = async () => {
        if (!croppedImagePath) {
            setError('Please crop the image first');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Create form data to send the image
            const formData = new FormData();
            formData.append('image', {
                uri: croppedImagePath,
                type: 'image/png',
                name: 'cropped_image.png',
            } as any);
            formData.append('language', selectedLanguage);

            // Send the image to the API
            const response = await fetch(`https://9k6z4zqt-5001.use.devtunnels.ms/upload-text-image/${selectedLanguage}`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to upload image to server');
            }

            const result = await response.json();
            console.log('Upload successful:', result);

            // Navigate to Results screen with the processed data
            navigation.navigate('TextNextPageResults', {
                croppedImagePath: croppedImagePath,
                processedText: result.text
            });
            
        } catch (err) {
            setError('Failed to process image. Please try again.');
            console.error('Error processing image:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!imagePath) {
        return (
            <KWBScreenWrapper headerText="Text Analysis" backButtonActive={true}>
                <View style={styles.card}>
                    <KWBTypography style={styles.errorText}>No image provided</KWBTypography>
                </View>
            </KWBScreenWrapper>
        );
    }

    return (
        <KWBScreenWrapper headerText="Text Analysis" backButtonActive={true}>
            <View style={styles.content}>
                <View style={styles.card}>
                    <KWBTypography variant="h3" style={styles.title}>Select Text Area</KWBTypography>
                    <KWBTypography style={styles.subtitle}>
                        Crop the image to focus on the text you want to analyze
                    </KWBTypography>
                </View>

                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: `file://${croppedImagePath || imagePath}` }}
                        style={styles.image}
                        resizeMode="contain"
                    />
                </View>

                {error && (
                    <View style={styles.errorCard}>
                        <KWBTypography style={styles.errorText}>{error}</KWBTypography>
                    </View>
                )}

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.cropButton]}
                        onPress={handleCropImage}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <KWBTypography style={styles.buttonText}>
                                {croppedImagePath ? 'Recrop Image' : 'Crop Image'}
                            </KWBTypography>
                        )}
                    </TouchableOpacity>

                    {croppedImagePath && (
                        <TouchableOpacity
                            style={[styles.button, styles.submitButton]}
                            onPress={handleSubmitImage}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <KWBTypography style={styles.buttonText}>Submit Image</KWBTypography>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.languageContainer}>
                    <KWBTypography style={styles.languageLabel}>Select Language:</KWBTypography>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={selectedLanguage}
                            onValueChange={(itemValue) => setSelectedLanguage(itemValue)}
                            style={styles.picker}
                        >
                            <Picker.Item label="English" value="eng" />
                            <Picker.Item label="French" value="fre" />
                            <Picker.Item label="Spanish" value="spa" />
                        </Picker>
                    </View>
                </View>
            </View>
        </KWBScreenWrapper>
    );
}

const styles = StyleSheet.create({
    content: {
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
    title: {
        marginBottom: 8,
    },
    subtitle: {
        color: '#666666',
        lineHeight: 22,
    },
    imageContainer: {
        width: width - 32,
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
    errorCard: {
        backgroundColor: '#FFF1F0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FFD1D1',
    },
    errorText: {
        color: '#D4380D',
        textAlign: 'center',
    },
    buttonContainer: {
        gap: 12,
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
    cropButton: {
        backgroundColor: '#2196F3',
    },
    submitButton: {
        backgroundColor: '#4CAF50',
    },
    languageContainer: {
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
    languageLabel: {
        marginBottom: 8,
        color: '#666666',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        overflow: 'hidden',
        height: 150,
    },
    picker: {
        height: 150,
        width: '100%',
    },
});
