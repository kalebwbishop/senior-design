import React, { useEffect, useRef } from 'react';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useWindowDimensions, Button, StyleSheet, View } from 'react-native';
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
};

export default function KWBCamera(props: CameraProps) {
    const cameraRef = useRef<CameraView>(null);
    const isProcessingRef = useRef(false);

    const [permission, requestPermission] = useCameraPermissions();

    const insets = useSafeAreaInsets();
    const { width: screenWidth } = useWindowDimensions();
    const cameraSize = screenWidth - insets.left - insets.right - 40;
    const cameraTopOffset = insets.top + 20;

    async function handleTakePictureButtonPressed() {
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
        <CameraView
            ref={cameraRef}
            style={{ width: cameraSize, height: cameraSize, top: cameraTopOffset }}
            facing="back"
            ratio='1:1'
            barcodeScannerSettings={{
                barcodeTypes: ["upc_a"],
            }}
            onBarcodeScanned={props.onBarcodeScanned ? handleBarcodeScanned : undefined}
        />
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
    }
});
