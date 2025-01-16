import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import { RootParamList } from '../types';
import BarcodeScannedPage from '../pages/BarcodeScanned';

const Stack = createStackNavigator<RootParamList>();

export default function NavigationWrapper() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="BarcodeScannedPage"
                screenOptions={{
                    cardStyle: {
                        backgroundColor: '#A0BBEA',
                    },
                    headerShown: false,
                }}>
                <Stack.Screen name="BarcodeScannedPage" component={BarcodeScannedPage} initialParams={{'barcode': ""}} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}