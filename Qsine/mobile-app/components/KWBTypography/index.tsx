import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

interface KWBTypographyProps extends TextProps {
    variant?: 'h1' | 'h2' | 'h3' | 'body1' | 'body2';
    children: React.ReactNode;
}

const KWBTypography: React.FC<KWBTypographyProps> = ({ variant = 'body1', children, style, ...props }) => {
    const getFontSize = () => {
        switch (variant) {
            case 'h1':
                return 24;
            case 'h2':
                return 20;
            case 'h3':
                return 18;
            case 'body1':
                return 16;
            case 'body2':
                return 14;
            default:
                return 16;
        }
    };

    return (
        <Text style={[{ fontSize: getFontSize()}, styles.text, style]} {...props}>
            {children}
        </Text>
    );
};

const styles = StyleSheet.create({
    text: {
        color: 'white',
    },
});

export default KWBTypography;