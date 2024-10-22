import React from "react";
import { View, Text, Button } from "react-native";
import { RootStackParamList } from "../types";
import { StackNavigationProp } from "@react-navigation/stack";

type HomeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "Home">;
};

function HomeScreen({ navigation }: Readonly<HomeScreenProps>) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Home Screen</Text>
      <Button
        title="Go to Details"
        onPress={() => navigation.navigate("Details")}
      />
    </View>
  );
}

export default HomeScreen;