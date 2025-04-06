import React from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import { Provider } from 'react-redux';
import { store } from '@/store';

import KWBNavigationWrapper from '@/wrappers/KWBNavigationWrapper';

import EditProduct from './pages/BarcodeNextPage/Components/EditProduct';

export default function App() {
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
    <Provider store={store}>
      <KWBNavigationWrapper />
    </Provider>
  );
}