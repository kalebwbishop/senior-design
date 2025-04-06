import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type RootParamList = {
  'CameraPage': undefined;
  'PictureTaken': {'uri': string};
  'BarcodeNextPage': { 'barcode': string };
  'BarcodeNextPageEdit': { 'barcode': string, 'product': Product['product'] };
  'UserSettingsPage': undefined;
  'TextNextPage': { 'imagePath': string };
  'TextNextPageResults': { 'processedText': string, 'manualText': boolean };
  'ImageNextPage': { 'imagePath': string };
  'ImageNextPageResults': { 'croppedImagePath': string, 'originalImagePath': string, 'classification': string };
};

type Product = {
  product: {
    name: string;
    company: string;
    ingredients: string[];
  };
};

type KWBNavProp = StackNavigationProp<RootParamList>;

type PictureTakenPageRouteProp = RouteProp<RootParamList, 'PictureTaken'>;
type BarcodeNextPageRouteProp = RouteProp<RootParamList, 'BarcodeNextPage'>;
type BarcodeNextPageEditRouteProp = RouteProp<RootParamList, 'BarcodeNextPageEdit'>;

export type {
  RootParamList,
  KWBNavProp,
  PictureTakenPageRouteProp,
  BarcodeNextPageRouteProp,
  BarcodeNextPageEditRouteProp,
  Product,
};