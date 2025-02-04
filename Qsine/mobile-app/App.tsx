import React from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';

import KWBNavigationWrapper from '@/wrappers/KWBNavigationWrapper';

import EditProduct from './pages/BarcodeScanned/Components/EditProduct';

export default function Index() {
  const [fontsLoaded] = useFonts({
    Poppins_Regular: Poppins_400Regular,
    Poppins_Bold: Poppins_700Bold,
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  return (
    <KWBNavigationWrapper />
    // <ProductNotFound x/>
  );
}