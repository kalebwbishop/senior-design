import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';

import { KWBCamera, KWBTypography} from "@/components";
import { KWBNavProp } from "@/types";

export default function Camera() {
    const navigation = useNavigation<KWBNavProp>();
    const insets = useSafeAreaInsets();

    const [pictureButtonPressed, setPictureButtonPressed] = useState<boolean>(false);

    function onBarcodeScanned(barcode: string) {
        navigation.push('BarcodeScannedPage', { barcode: barcode });
    }

    function onPictureTaken(uri: string) {
        navigation.push('PictureTaken', { uri: uri });
    }

    return (
        <View style={styles.container}>
            <KWBCamera
                onBarcodeScanned={onBarcodeScanned}
                onPictureTaken={onPictureTaken}
                pictureButtonPressed={pictureButtonPressed}
                setPictureButtonPressed={setPictureButtonPressed}
            />
            <KWBTypography style={styles.message}>Take a picture of your food / barcode / medicine</KWBTypography>
            <TouchableOpacity onPress={() => {
                setPictureButtonPressed(true);
            }} style={[styles.button, { marginBottom: insets.bottom + 40 }]}>
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
    }
});