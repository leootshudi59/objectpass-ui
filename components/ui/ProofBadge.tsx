import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface Props {
  verified: boolean;
}

export function ProofBadge({ verified }: Props) {
  if (!verified) return null;
  return (
    <View style={styles.badge}>
      <Feather name="check-circle" size={11} color={Colors.proofBlue} />
      <Text style={styles.label}>Certifié</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E5EBFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.proofBlue,
    letterSpacing: 0.3,
  },
});
