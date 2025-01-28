import React, { useRef, useState } from 'react';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { useWindowDimensions, TouchableOpacity, Button, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';



export default function KWBCamera() {

    const navigation = useNavigation();

    const cameraRef = useRef<CameraView>(null);
    const isProcessingRef = useRef(false);

    const [text, setText] = useState('Take a picture of your food / barcode / medicine');

    const [permission, requestPermission] = useCameraPermissions();

    const insets = useSafeAreaInsets();
    const { width: screenWidth } = useWindowDimensions();
    const cameraSize = screenWidth - insets.left - insets.right - 40;
    const cameraTopOffset = insets.top + 20;

    async function handleTakePicture() {
        if (!cameraRef.current) {
            console.warn('Camera ref is not ready');
            return;
        }

        try {
            const photo = await cameraRef.current.takePictureAsync();
            console.log('Photo taken:', photo);

            if (!photo || !photo.uri) {
                console.warn('No photo captured or URI is missing');
                return;
            }

            // Read the file as a binary blob
            const fileUri = photo.uri;

            // Construct FormData
            const formData = new FormData();
            formData.append('image', {
                uri: fileUri,
                name: 'photo.jpg',
                type: 'image/jpeg',
            });
            formData.append('metadata', JSON.stringify({ name: 'burger' }));

            const uploadResponse = await fetch('http://50.5.72.176:5000/upload-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            const data = await uploadResponse.json();
            console.log('Success:', data);
        } catch (error) {
            console.error('Error during picture capture or upload:', error);
        }
    }

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="Grant Permission" />
            </View>
        );
    }

    const handleBarcodeScanned = (barcodeData: BarcodeScanningResult) => {
        if (!isProcessingRef.current) {
            isProcessingRef.current = true; // Set the flag to prevent further processing
            const scannedBarcode = barcodeData.data;

            console.log('Barcode scanned:', scannedBarcode);

            // Navigate to the next page
            navigation.push('BarcodeScannedPage', { barcode: scannedBarcode });

            // Reset the processing flag after the state is updated
            setTimeout(() => {
                isProcessingRef.current = false;
            }, 1000); // Adjust delay as necessary
        }
    };

    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={{ width: cameraSize, height: cameraSize, top: cameraTopOffset }}
                facing="back"
                ratio='1:1'
                barcodeScannerSettings={{
                    barcodeTypes: ["upc_a"],
                }}
                onBarcodeScanned={handleBarcodeScanned}
            />
            <Text style={styles.message}>{text}</Text>
            <TouchableOpacity onPress={handleTakePicture} style={[styles.button, { marginBottom: insets.bottom + 40 }]}>
                <Feather name="camera" size={64} color="black" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    message: {
        fontSize: 24,
        textAlign: 'center',
        marginHorizontal: 20,
    },
    button: {
        marginTop: 20,
        padding: 16,
        backgroundColor: 'lightblue',
        borderRadius: 45,
    },
});
