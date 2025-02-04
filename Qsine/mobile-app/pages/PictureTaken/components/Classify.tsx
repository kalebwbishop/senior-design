import React, {useState} from "react";

import { Text, StyleSheet, View, Pressable } from "react-native";

interface ResponseResult {
    success: boolean;
    response?: Classification[];
    error?: string;
}

interface Classification {
    class: string;
    prob: number;
}

export default function Classify({ uri }: { uri: string }) {

    const [response, setResponse] = useState<ResponseResult | null>(null);

    async function handleClassifyPressed() {
        // Construct FormData
        const formData = new FormData();
        formData.append('image', {
            uri: uri,
            name: 'photo.jpg',
            type: 'image/jpeg',
        });
        formData.append('metadata', JSON.stringify({ name: 'burger' }));

        const uploadResponse = await fetch('https://senior-design-jhmb.onrender.com/classify-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            body: formData,
        });

        const data = await uploadResponse.json();

        setResponse({
            success: true,
            response: data.data,
        });
        console.log('Success:', data.data);
    }

    return (
        <View style={styles.container}>
            <Pressable onPress={handleClassifyPressed}>
                <Text style={styles.text}>Classify</Text>
                
                {response && response.response && response.response.map((item, index) => (
                    <Text key={index} style={styles.text}>{item.class} - {item.prob}</Text>
                ))}
            </Pressable>
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