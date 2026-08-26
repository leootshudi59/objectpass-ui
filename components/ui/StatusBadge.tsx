import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';

export type Status = 'excellent' | 'bon' | 'attention' | 'panne' | 'certifié' | 'archived';

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string; dot: string }> = {
  excellent: { label: 'Excellent',  bg: '#E8F9F0', text: Colors.warrantyGreen,   dot: Colors.warrantyGreen },
  bon:       { label: 'Bon état',   bg: '#E8F9F0', text: Colors.warrantyGreen,   dot: Colors.warrantyGreen },
  attention: { label: 'À vérifier', bg: '#FEF6E4', text: Colors.diagnosticAmber, dot: Colors.diagnosticAmber },
  panne:     { label: 'En panne',   bg: '#FDE8E8', text: Colors.faultCoral,      dot: Colors.faultCoral },
  certifié:  { label: 'Certifié',   bg: '#E5EBFF', text: Colors.proofBlue,       dot: Colors.proofBlue },
  archived:  { label: 'Archivé',    bg: '#EDEFF0', text: Colors.steelGrey,      dot: Colors.steelGrey },
};

interface Props {
  status: Status;
}

export function StatusBadge({ status }: Props) {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
      <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
      <Text style={[styles.label, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    gap: 5,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
