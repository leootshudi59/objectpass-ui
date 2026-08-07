import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAppState } from '../../context/AppStateContext';

export function GlobalLoadingOverlay() {
  const { isLoading, loadingMessage } = useAppState();

  if (!isLoading) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-only">
      <ActivityIndicator size="large" color={Colors.repairTeal} />
      {loadingMessage !== undefined ? (
        <Text style={styles.message}>{loadingMessage}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 37, 48, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  message: {
    color: Colors.cleanWhite,
    fontSize: 15,
    marginTop: 14,
    fontWeight: '500',
  },
});
