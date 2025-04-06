import React, { useEffect, useRef } from 'react';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useWindowDimensions, Button, StyleSheet, View, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import KWBTypography from '../KWBTypography';

interface PictureResult {
    success: boolean;
    uri?: string;
    error?: string;
}

async function handleTakePicture(camera_ref: React.RefObject<CameraView>): Promise<PictureResult> {
    if (!camera_ref.current) {
        return { success: false, error: "Camera ref is not ready" };
    }

    const photo = await camera_ref.current.takePictureAsync();

    if (!photo || !photo.uri) {
        return { success: false, error: "No photo captured or URI is missing" };
    }

    return { success: true, uri: photo.uri };
}

type CameraProps = {
    onBarcodeScanned?: (barcode: string) => void;
    onPictureTaken?: (uri: string) => void;
    pictureButtonPressed?: boolean;
    setPictureButtonPressed?: (pressed: boolean) => void;
    enableBarcodeScanning?: boolean;
};

export default function KWBCamera(props: CameraProps) {
    const cameraRef = useRef<CameraView>(null);
    const isProcessingRef = useRef(false);
    const flashAnimation = useRef(new Animated.Value(0)).current;

    const [permission, requestPermission] = useCameraPermissions();

    const insets = useSafeAreaInsets();
    const { width: screenWidth } = useWindowDimensions();
    const cameraSize = screenWidth - insets.left - insets.right - 40;
    const cameraTopOffset = insets.top + 20;

    async function handleTakePictureButtonPressed() {
        // Trigger flash animation
        Animated.sequence([
            Animated.timing(flashAnimation, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(flashAnimation, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        const result = await handleTakePicture(cameraRef);

        if (result.success && result.uri) {
            if (props.onPictureTaken) {
                props.onPictureTaken(result.uri);
            }
        } else {
            console.error('Error during picture capture:', result.error);
        }
    }

    useEffect(() => {
        if (props.pictureButtonPressed) {
            handleTakePictureButtonPressed();
            props.setPictureButtonPressed && props.setPictureButtonPressed(false);
        }
    }, [props.pictureButtonPressed]);


    const handleBarcodeScanned = (barcodeData: BarcodeScanningResult) => {
        if (!isProcessingRef.current) {
            isProcessingRef.current = true;
            const scannedBarcode = barcodeData.data;

            if (props.onBarcodeScanned) {
                props.onBarcodeScanned(scannedBarcode);
            }

            // Reset the processing flag after the state is updated
            setTimeout(() => {
                isProcessingRef.current = false;
            }, 1000); // Adjust delay as necessary
        }
    };

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <KWBTypography style={styles.message}>We need your permission to show the camera</KWBTypography>
                <Button onPress={requestPermission} title="Grant Permission" />
            </View>
        );
    }

    return (
        <View style={styles.cameraWrapper}>
            <CameraView
                ref={cameraRef}
                style={[styles.camera, { width: cameraSize, height: cameraSize, top: cameraTopOffset }]}
                facing="back"
                ratio='1:1'
                barcodeScannerSettings={props.enableBarcodeScanning ? {
                    barcodeTypes: ["upc_a"],
                } : undefined}
                onBarcodeScanned={props.enableBarcodeScanning && props.onBarcodeScanned ? handleBarcodeScanned : undefined}
            />
            <View style={[styles.frameOverlay, { width: cameraSize, height: cameraSize, top: cameraTopOffset }]}>
                <View style={styles.cornerTopLeft} />
                <View style={styles.cornerTopRight} />
                <View style={styles.cornerBottomLeft} />
                <View style={styles.cornerBottomRight} />
            </View>
            <Animated.View 
                style={[
                    styles.flash,
                    {
                        opacity: flashAnimation,
                        width: cameraSize,
                        height: cameraSize,
                        top: cameraTopOffset,
                    }
                ]} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cameraWrapper: {
        flex: 1,
        alignItems: 'center',
        position: 'relative',
    },
    camera: {
        position: 'absolute',
        borderRadius: 12,
        overflow: 'hidden',
    },
    frameOverlay: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 12,
    },
    cornerTopLeft: {
        position: 'absolute',
        top: -2,
        left: -2,
        width: 20,
        height: 20,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#FFFFFF',
        borderTopLeftRadius: 12,
    },
    cornerTopRight: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 20,
        height: 20,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderColor: '#FFFFFF',
        borderTopRightRadius: 12,
    },
    cornerBottomLeft: {
        position: 'absolute',
        bottom: -2,
        left: -2,
        width: 20,
        height: 20,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#FFFFFF',
        borderBottomLeftRadius: 12,
    },
    cornerBottomRight: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 20,
        height: 20,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderColor: '#FFFFFF',
        borderBottomRightRadius: 12,
    },
    flash: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 12,
    },
    message: {
        fontSize: 24,
        textAlign: 'center',
        marginHorizontal: 20,
    }
});
