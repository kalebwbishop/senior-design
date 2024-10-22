import React, { ReactNode } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Define the props interface for the component
interface QSineGradientWrapperProps {
  children: ReactNode;   // Accepts children of any React element type
  colors: string[];      // Array of gradient colors
  style?: ViewStyle;     // Optional additional styles for the container
  start?: { x: number, y: number };  // Optional start point for the gradient (default is top-left)
  end?: { x: number, y: number };    // Optional end point for the gradient (default is bottom-right)
}

const QSineGradientWrapper: React.FC<QSineGradientWrapperProps> = ({ children, colors, style, start, end }) => {
  return (
    <LinearGradient
      colors={colors}  // Accept colors as props
      start={start || { x: 0, y: 0 }}  // Allow overriding start/end values
      end={end || { x: 1, y: 1 }}
      style={[styles.container, style]}  // Allow passing additional styles
    >
      {children}  {/* Render children inside the gradient */}
    </LinearGradient>
  );
};

// Define default styles
const styles = StyleSheet.create({
  container: {
    flex: 1,  // Default to filling the entire space
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default QSineGradientWrapper;