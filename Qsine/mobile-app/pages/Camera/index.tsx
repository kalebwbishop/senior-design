import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View, ScrollView } from "react-native";
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

import { KWBCamera, KWBTypography } from "@/components";
import { KWBNavProp } from "@/types";

type CameraMode = 'text' | 'image' | 'barcode';

export default function Camera() {
    const navigation = useNavigation<KWBNavProp>();
    const insets = useSafeAreaInsets();
    const [mode, setMode] = useState<CameraMode>('image');
    const [pictureButtonPressed, setPictureButtonPressed] = useState<boolean>(false);
    const [barcodeScanned, setBarcodeScanned] = useState<boolean>(false);

    useFocusEffect(
        React.useCallback(() => {
            setBarcodeScanned(false);
        }, [])
    );

    function onBarcodeScanned(barcode: string) {
        if (!barcodeScanned) {
            setBarcodeScanned(true);
            navigation.push('BarcodeNextPage', { barcode: barcode });
        }
    }

    function onPictureTaken(uri: string) {
        if (mode === 'text') {
            navigation.push('TextNextPage', { imagePath: uri });
        } else if (mode === 'image') {
            navigation.push('ImageNextPage', { imagePath: uri });
        }
    }

    const getModeMessage = () => {
        switch (mode) {
            case 'text':
                return 'Take a picture of some text, such as a menu';
            case 'image':
                return 'Take a picture of your food';
            case 'barcode':
                return 'Scan a barcode of your food';
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.cameraContainer}>
                <KWBCamera
                    onBarcodeScanned={onBarcodeScanned}
                    onPictureTaken={onPictureTaken}
                    pictureButtonPressed={pictureButtonPressed}
                    setPictureButtonPressed={setPictureButtonPressed}
                    enableBarcodeScanning={mode === 'barcode' && !barcodeScanned}
                />
            </View>

            <View style={styles.controlsContainer}>
                <View style={styles.modeSelector}>
                    {(['text', 'image', 'barcode'] as CameraMode[]).map((m) => (
                        <TouchableOpacity
                            key={m}
                            style={[
                                styles.modeButton,
                                mode === m && styles.modeButtonActive
                            ]}
                            onPress={() => setMode(m)}
                        >
                            {m === 'barcode' ? (
                                <FontAwesome6
                                    name="barcode"
                                    size={20}
                                    color={mode === m ? '#FFFFFF' : '#666666'}
                                />
                            ) : (
                                <Feather
                                    name={m === 'text' ? 'type' : 'camera'}
                                    size={20}
                                    color={mode === m ? '#FFFFFF' : '#666666'}
                                />
                            )}
                            {mode === m && (
                                <KWBTypography style={[
                                    styles.modeText,
                                    styles.modeTextActive
                                ]}>
                                    {m.charAt(0).toUpperCase() + m.slice(1)}
                                </KWBTypography>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                <KWBTypography style={styles.message}>{getModeMessage()}</KWBTypography>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        onPress={() => {
                            setPictureButtonPressed(true);
                        }}
                        style={[styles.button, { marginBottom: insets.bottom + 40, opacity: mode === 'barcode' ? 0 : 1 }]}
                    >
                        <Feather name="camera" size={64} color="white" />
                    </TouchableOpacity>
                    {mode === 'text' && (
                        <TouchableOpacity
                            onPress={() => {
                                navigation.push('TextNextPageConfirmText', { manualText: true, processedText: '' });
                            }}
                            style={[styles.button, { marginBottom: insets.bottom + 40 }]}
                        >
                            <Feather name="type" size={64} color="white" />
                        </TouchableOpacity>
                    )}
                </View>

            </View>

            <TouchableOpacity
                style={[styles.settingsButton, { bottom: insets.bottom + 20 }]}
                onPress={() => navigation.navigate('UserSettingsPage')}
            >
                <Feather name="settings" size={24} color="white" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: '#F5F7FA',
    },
    cameraContainer: {
        width: '100%',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    controlsContainer: {
        width: '100%',
        alignItems: 'center',
        padding: 16,
    },
    modeSelector: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginTop: 40,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    modeButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginHorizontal: 5,
        backgroundColor: '#F5F7FA',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minWidth: 60,
    },
    modeButtonActive: {
        justifyContent: 'center',
        flex: 1,
        backgroundColor: '#2196F3',
    },
    modeText: {
        fontSize: 16,
        color: '#666666',
    },
    modeTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    message: {
        fontSize: 24,
        textAlign: 'center',
        marginHorizontal: 20,
        marginTop: 20,
        color: '#1A1A1A',
        fontWeight: '600',
        height: 80,
        lineHeight: 32,
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    button: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#2196F3',
        borderRadius: 45,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    settingsButton: {
        position: 'absolute',
        right: 20,
        padding: 12,
        backgroundColor: '#666666',
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    }
});