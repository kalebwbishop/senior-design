import React, { useState, useRef } from 'react';
import {
    SafeAreaView,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';

export default function ProductNotFound() {
    const [productName, setProductName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [ingredients, setIngredients] = useState<string[]>(['']);
    const ingredientRefs = useRef<TextInput[]>([]);

    function handleUpdateIngredient(index: number, value: string) {
        const newIngredients = [...ingredients];
        newIngredients[index] = value;
        setIngredients(newIngredients);

        if (value.trim() !== '' && index === ingredients.length - 1) {
            setIngredients([...newIngredients, '']);
        }
    }

    function dismissKeyboard() {
        Keyboard.dismiss();
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1, paddingBottom: 100 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <TouchableWithoutFeedback onPress={dismissKeyboard}>
                    <ScrollView contentContainerStyle={styles.content}>
                        <Text style={styles.header}>Product not found</Text>
                        <Text>Enter product details manually:</Text>

                        <TextInput
                            placeholder="Product name"
                            style={styles.input}
                            value={productName}
                            onChangeText={setProductName}
                            returnKeyType="next"
                            onSubmitEditing={() => ingredientRefs.current[0]?.focus()}
                        />
                        <TextInput
                            placeholder="Company name"
                            style={styles.input}
                            value={companyName}
                            onChangeText={setCompanyName}
                            returnKeyType="next"
                            onSubmitEditing={() => ingredientRefs.current[0]?.focus()}
                        />

                        <Text style={styles.label}>Ingredients:</Text>
                        {ingredients.map((ingredient, index) => (
                            <TextInput
                                key={index}
                                placeholder={`Ingredient ${index + 1}`}
                                style={styles.input}
                                onChangeText={(value) => handleUpdateIngredient(index, value)}
                                value={ingredient}
                                ref={(ref) => (ingredientRefs.current[index] = ref!)}
                                returnKeyType="next"
                                onSubmitEditing={() =>
                                    ingredientRefs.current[index + 1]?.focus()
                                }
                            />
                        ))}
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginBottom: 20,
    },
    content: {
        padding: 20,
        justifyContent: 'center',
    },
    header: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    label: {
        marginTop: 10,
        fontSize: 16,
    },
    input: {
        width: '100%',
        padding: 10,
        marginVertical: 5,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
    },
});
