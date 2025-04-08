import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import { RootParamList } from '../types';
import CameraPage from '@/pages/Camera';
import ImageNextPage from '@/pages/ImageNextPage';
import ImageNextPageResults from '@/pages/ImageNextPage/Results';
import TextNextPage from '@/pages/TextNextPage';
import BarcodeNextPage from '@/pages/BarcodeNextPage';
import BarcodeNextPageEdit from '@/pages/BarcodeNextPage/Edit';
import UserSettingsPage from '@/pages/UserSettings';
import TextNextPageResults from '@/pages/TextNextPage/Results';
import TextNextPageConfirmText from '@/pages/TextNextPage/ConfirmText';
const Stack = createStackNavigator<RootParamList>();

export default function KWBNavigationWrapper() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="CameraPage"
                screenOptions={{
                    cardStyle: {
                        backgroundColor: '#F5F7FA',
                    },
                    headerShown: false,
                }}>
                <Stack.Screen name="CameraPage" component={CameraPage} />
                <Stack.Screen name="ImageNextPage" component={ImageNextPage} />
                <Stack.Screen name="ImageNextPageResults" component={ImageNextPageResults} />
                <Stack.Screen name="BarcodeNextPage" component={BarcodeNextPage} initialParams={{'barcode': "051500255445"}} />
                <Stack.Screen name="BarcodeNextPageEdit" component={BarcodeNextPageEdit} />
                <Stack.Screen name="TextNextPage" component={TextNextPage} />
                <Stack.Screen name="TextNextPageConfirmText" component={TextNextPageConfirmText} />
                <Stack.Screen name="TextNextPageResults" component={TextNextPageResults} />
                <Stack.Screen name="UserSettingsPage" component={UserSettingsPage} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}