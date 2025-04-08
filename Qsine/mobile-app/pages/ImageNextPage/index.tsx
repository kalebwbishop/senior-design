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

type RootStackParamList = {
    ImageNextPageResults: {
        imagePath: string;
    };
};

type RouteParams = {
    imagePath: string;
};

const { width } = Dimensions.get('window');

export default function ImageNextPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [croppedImagePath, setCroppedImagePath] = useState<string | null>(null);
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
                cropperToolbarTitle: 'Crop Image Area',
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

            // Navigate to Results screen with the image path
            navigation.navigate('ImageNextPageResults', {
                imagePath: croppedImagePath
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
            <KWBScreenWrapper headerText="Image Analysis" backButtonActive={true}>
                <View style={styles.card}>
                    <KWBTypography style={styles.errorText}>No image provided</KWBTypography>
                </View>
            </KWBScreenWrapper>
        );
    }

    return (
        <KWBScreenWrapper headerText="Image Analysis" backButtonActive={true}>
            <View style={styles.content}>
                <View style={styles.card}>
                    <KWBTypography variant="h3" style={styles.title}>Select Image Area</KWBTypography>
                    <KWBTypography style={styles.subtitle}>
                        Crop the image to focus on the area you want to analyze
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
    buttonContainer: {
        gap: 12,
    },
    button: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cropButton: {
        backgroundColor: '#2196F3',
    },
    submitButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    errorCard: {
        backgroundColor: '#FFEBEE',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    errorText: {
        color: '#D32F2F',
    },
});
