import React from "react";
import { Text, StyleSheet, TextStyle } from "react-native";

interface QSineTypographyProps {
  variant?: "h1" | "h2" | "h3" | "body" | "caption" | "button";
  color?: string;
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
}

const QSineTypography: React.FC<QSineTypographyProps> = ({
  variant = "body",
  color = "#000",
  style,
  children,
}) => {
  return <Text style={[styles[variant], { color }, style]}>{children}</Text>;
};

const styles = StyleSheet.create({
  h1: {
    fontFamily: "Poppins-Bold",
    fontSize: 32,
    lineHeight: 40,
  },
  h2: {
    fontFamily: "Poppins-Bold",
    fontSize: 28,
    lineHeight: 36,
  },
  h3: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 24,
    lineHeight: 32,
  },
  body: {
    fontFamily: "Poppins-Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: "Poppins-Bold",
    fontSize: 16,
    lineHeight: 24,
    textTransform: "uppercase",
  },
});

export default QSineTypography;
