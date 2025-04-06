import React, { useRef } from "react";
import { StyleSheet, SafeAreaView, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from "expo-blur";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from "@react-navigation/native";

import KWBTypography from "../KWBTypography";

interface KWBScreenWrapperProps {
    backButtonActive?: boolean;
    headerText?: string;
    children: React.ReactNode;
}

const KWBScreenWrapper: React.FC<KWBScreenWrapperProps> = ({ backButtonActive = false, headerText, children }) => {
    const navigation = useNavigation();
    
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);
    const scrollViewPaddingTop = 100 - insets.top + 16; // Header height - top inset + 16px margin

    return (
        <SafeAreaView style={styles.container}>
            <BlurView style={styles.blurHeader} intensity={50} tint="default">
                <Pressable
                    onPress={() => {
                        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                    }}
                    style={styles.headerContainer}
                >
                    {navigation && backButtonActive && (
                        <Pressable onPress={() => { navigation.goBack() }} style={styles.chevronContainer}>
                            <Ionicons name="chevron-back" size={24} color="white" />
                        </Pressable>
                    )}
                    <KWBTypography variant="h1" style={[styles.headerText, { color: 'white' }]}>
                        {headerText}
                    </KWBTypography>
                    {navigation && backButtonActive && (
                        <Pressable onPress={() => {}} style={[styles.chevronContainer, { opacity: 0 }]}>
                            <Ionicons name="chevron-back" size={24} color="white" />
                        </Pressable>
                    )}
                </Pressable>
            </BlurView>

            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={[styles.scrollViewContent, { paddingTop: scrollViewPaddingTop }]}
            >
                {children}
            </ScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    blurHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    scrollViewContent: {
        marginHorizontal: 16,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center', // Center vertically
        justifyContent: 'center', // Center horizontally
        paddingTop: 40,
    },
    chevronContainer: {
        paddingLeft: 16,
        paddingRight: 32,
    },
    headerText: {
        flex: 1,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default KWBScreenWrapper;