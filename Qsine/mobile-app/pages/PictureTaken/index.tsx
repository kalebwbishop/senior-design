import React, { useState } from "react";
import { SafeAreaView, Text, StyleSheet, Image, Switch, View, Pressable } from "react-native";
import { useRoute } from '@react-navigation/native';

import { PictureTakenPageRouteProp } from "@/types";

import Classify from "./components/Classify";
import Save from "./components/Save";

export default function PictureTaken() {
    const route = useRoute();
    const uri = (route as PictureTakenPageRouteProp).params.uri;

    const [classify, setClassify] = useState(true);

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

            <Switch
                value={classify}
                onValueChange={() => setClassify(previousState => !previousState)}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={classify ? "#f5dd4b" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
            />

            <Pressable onPress={() => setClassify(!classify)} style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 20, backgroundColor: 'red' }}>
                <View style={{ backgroundColor: classify ? 'blue' : 'transparent' }}>
                    <Text style={styles.text}>Classify</Text>
                </View>
                <View style={{ backgroundColor: !classify ? 'blue' : 'transparent' }}>
                    <Text style={styles.text}>Save</Text>
                </View>
            </Pressable>

            {classify ? (
                <Classify uri={uri} />
            ) : (
                <Save />
            )}
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
