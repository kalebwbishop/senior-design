import React, { useState } from "react";
import { SafeAreaView, Text, StyleSheet, Image, Switch, View, Pressable } from "react-native";
import { useRoute } from '@react-navigation/native';

import { PictureTakenPageRouteProp } from "@/types";

import Classify from "./components/Classify";

export default function PictureTaken() {
    const route = useRoute();
    const uri = (route as PictureTakenPageRouteProp).params.uri;

    return (
        <SafeAreaView style={styles.container}>
            {uri ? (
                <Image
                    source={{ uri: uri }}
                    style={styles.image}
                    accessibilityLabel="Captured picture"
                />
            ) : (
                <Text>No image available</Text>
            )}

            <Classify uri={uri} />
       
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#A0BBEA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: 300, // Adjust size as needed
        height: 300,
        borderRadius: 10,
        marginBottom: 20,
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
});
