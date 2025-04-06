import React from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { KWBScreenWrapper, KWBTypography } from '@/components';

type RouteParams = {
    classification: string;
};

const { width } = Dimensions.get('window');

export default function Results() {
    const route = useRoute();
    const { classification } = route.params as RouteParams;

    return (
        <KWBScreenWrapper headerText="Image Analysis" backButtonActive={true}>
            <View style={styles.card}>
                <KWBTypography variant="h2" style={styles.cardTitle}>Classification</KWBTypography>
                <View style={styles.classificationContainer}>
                    <KWBTypography variant="h1" style={styles.classificationText}>
                        {classification[1][0].toUpperCase() + classification[1].slice(1)}
                    </KWBTypography>
                    <KWBTypography variant="body1" style={styles.confidenceText}>
                        Confidence: {(parseFloat(classification[0]) * 100).toFixed(1)}%
                    </KWBTypography>
                </View>
            </View>
        </KWBScreenWrapper>
    );
}

const styles = StyleSheet.create({
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
    classificationText: {
        marginBottom: 8,
    },
    confidenceText: {
        color: '#666666',
    },
    classificationContainer: {
        flexDirection: 'column',
    },
}); 