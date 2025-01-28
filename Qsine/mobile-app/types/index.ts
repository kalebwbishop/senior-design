import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type RootParamList = {
  'CameraPage': undefined;
  'BarcodeScannedPage': { 'barcode': string };
};

type BarcodeScannedPageNavProp = StackNavigationProp<RootParamList, 'BarcodeScannedPage'>;
type BarcodeScannedPageRouteProp = RouteProp<RootParamList, 'BarcodeScannedPage'>;

export type {
  RootParamList,
  BarcodeScannedPageNavProp,
  BarcodeScannedPageRouteProp,
};