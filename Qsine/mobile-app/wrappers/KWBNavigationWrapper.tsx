import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import { RootParamList } from '../types';
import CameraPage from '@/pages/Camera';
import PictureTaken from '@/pages/PictureTaken';
import BarcodeScannedPage from '@/pages/BarcodeScanned';
import UserSettingsPage from '@/pages/UserSettings';

const Stack = createStackNavigator<RootParamList>();

export default function KWBNavigationWrapper() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="UserSettingsPage"
                screenOptions={{
                    cardStyle: {
                        backgroundColor: '#A0BBEA',
                    },
                    headerShown: false,
                }}>
                <Stack.Screen name="CameraPage" component={CameraPage} />
                <Stack.Screen name="PictureTaken" component={PictureTaken} />
                <Stack.Screen name="BarcodeScannedPage" component={BarcodeScannedPage} initialParams={{'barcode': "000000099482"}} />
                <Stack.Screen name="UserSettingsPage" component={UserSettingsPage} />
                {/* <Stack.Screen name="BarcodeScannedPage" component={BarcodeScannedPage} initialParams={{'barcode': "014100099482"}} /> */}
            </Stack.Navigator>
        </NavigationContainer>
    );
}