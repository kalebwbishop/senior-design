import React, { useRef, useState } from "react";
import { View, TextInput, Pressable, Image } from "react-native";
import { AntDesign, Feather } from "@expo/vector-icons";
import QSineTypography from "../components/QSineTypography";
import QSineGradientWrapper from "../components/QSineScreenContainer";

function HomeScreen() {
  const [text, setText] = useState("");
  const textInputRef = useRef<TextInput>(null);

  const handleFocus = () => {
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  };

  return (
    <QSineGradientWrapper colors={["#FFA07A", "#FF6347"]}>
      <Image
        style={{
          alignSelf: "flex-start",
          width: 50,
          height: 50,
          resizeMode: "contain",
          margin: 20,
        }}
        source={require("../assets/qsine_logo.png")}
      ></Image>
      <View
        style={{
          width: "100%",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <QSineTypography variant="h1" style={{ fontSize: 64 }}>
          QSine
        </QSineTypography>

        <View style={{ height: 60 }} />

        <Pressable
          onPress={handleFocus}
          style={{
            backgroundColor: "#333333",
            height: 80,
            width: "80%",
            paddingLeft: 20,
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "center",
            borderRadius: 40,
          }}
        >
          <AntDesign name="plus" size={24} color="#cccccc" />
          <View style={{ width: 20 }} />
          <QSineTypography color="#cccccc" style={{ flex: 1 }}>
            {text || "Enter Here..."}
          </QSineTypography>
          <Pressable style={{ padding: 20 }}>
            <Feather name="send" size={24} color="#cccccc" />
          </Pressable>
        </Pressable>

        <View style={{ height: 40 }} />

        <QSineTypography>Description of QSine</QSineTypography>

        <TextInput
          style={{ height: 0, width: 0 }}
          ref={textInputRef}
          autoFocus={true}
          multiline={true}
          onChangeText={setText}
          placeholder={"Enter here..."}
        />
      </View>
    </QSineGradientWrapper>
  );
}

export default HomeScreen;
