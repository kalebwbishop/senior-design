import React from "react";

import { Text, StyleSheet, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";

export default function Save() {
    const handleSave = () => {
        // Save image
    };

    return (
        <View style={styles.container}>
            <TextInput placeholder="Enter image name" style={{ backgroundColor: '#fff', padding: 10, borderRadius: 5, marginBottom: 10 }} />
            <TextInput placeholder="Enter image ingredients" style={{ backgroundColor: '#fff', padding: 10, borderRadius: 5, marginBottom: 10 }} />
            <Text style={styles.text}>Save</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#A0BBEA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
});