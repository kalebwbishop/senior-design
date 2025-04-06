import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import KWBTypography from '../KWBTypography';

interface KWBButtonProps {
    onPress: () => void;
    title: string;
    style?: ViewStyle;
    textStyle?: TextStyle;
    variant?: 'primary' | 'secondary' | 'success';
}

export function KWBButton({ 
    onPress, 
    title, 
    style, 
    textStyle,
    variant = 'primary' 
}: KWBButtonProps) {
    return (
        <TouchableOpacity
            style={[styles.button, styles[variant], style]}
            onPress={onPress}
        >
            <KWBTypography style={[styles.buttonText, textStyle]}>
                {title}
            </KWBTypography>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
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
    primary: {
        backgroundColor: '#2196F3',
    },
    secondary: {
        backgroundColor: '#666666',
    },
    success: {
        backgroundColor: '#4CAF50',
    },
}); 