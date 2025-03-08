import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type RootParamList = {
  'CameraPage': undefined;
  'PictureTaken': {'uri': string};
  'BarcodeScannedPage': { 'barcode': string };
  'UserSettingsPage': undefined;
};

type Product = {
  name: string;
  company: string;
  ingredients: string[];
};

type KWBNavProp = StackNavigationProp<RootParamList>;

type PictureTakenPageRouteProp = RouteProp<RootParamList, 'PictureTaken'>;
type BarcodeScannedPageRouteProp = RouteProp<RootParamList, 'BarcodeScannedPage'>;

export type {
  RootParamList,
  KWBNavProp,
  PictureTakenPageRouteProp,
  BarcodeScannedPageRouteProp,
  Product,
};