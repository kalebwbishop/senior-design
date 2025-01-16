import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type RootParamList = {
  'BarcodeScannedPage': { barcode: string };
};

type MainPageNavigationProp = StackNavigationProp<RootParamList, 'BarcodeScannedPage'>;
type MainPageRouteProp = RouteProp<RootParamList, 'BarcodeScannedPage'>;

export type {
  RootParamList,
  MainPageNavigationProp,
  MainPageRouteProp,
};