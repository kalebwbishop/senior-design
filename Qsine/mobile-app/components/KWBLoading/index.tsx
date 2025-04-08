import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { KWBTypography } from '@/components';

interface KWBLoadingProps {
  text?: string;
}

const KWBLoading: React.FC<KWBLoadingProps> = ({ text }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2196F3" />
      {text && <KWBTypography style={styles.text}>{text}</KWBTypography>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  text: {
    marginTop: 16,
    color: '#666666',
  },

});

export default KWBLoading;
