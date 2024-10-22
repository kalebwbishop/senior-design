import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import {
  createStackNavigator
} from "@react-navigation/stack";
import { Text, View } from "react-native";

import HomeScreen from "./HomeScreen";

const Stack = createStackNavigator();

// Define your details screen
function DetailsScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Details Screen</Text>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
