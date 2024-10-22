import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as Font from "expo-font";
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
  const [fontsLoaded, setFontsLoaded] = React.useState(false);

  const loadFonts = async () => {
    await Font.loadAsync({
      "Poppins-Regular": require("./assets/fonts/Poppins-Regular.ttf"),
      "Poppins-Bold": require("./assets/fonts/Poppins-Bold.ttf"),
    });
    setFontsLoaded(true);
  };

  React.useEffect(() => {
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return <Text>Loading...</Text>;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{
        headerShown: false,
      }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
