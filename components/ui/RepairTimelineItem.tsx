import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import type { Repair } from '../../types';
import { ProofBadge } from './ProofBadge';

interface Props {
  repair: Repair;
  isLast?: boolean;
}

export function RepairTimelineItem({ repair, isLast = false }: Props) {
  return (
    <View style={styles.row}>
      {/* Timeline column */}
      <View style={styles.timelineCol}>
        <View style={styles.dot} />
        {!isLast && <View style={styles.line} />}
      </View>

      {/* Content */}
      <View style={[styles.content, !isLast && styles.contentBorder]}>
        <View style={styles.topRow}>
          <Text style={styles.date}>{repair.date}</Text>
          {repair.certified && <ProofBadge verified />}
        </View>
        <Text style={styles.type}>{repair.type}</Text>
        <View style={styles.repairerRow}>
          <Feather name="tool" size={11} color={Colors.steelGrey} />
          <Text style={styles.repairer}>{repair.repairer}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  timelineCol: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.repairTeal,
    marginTop: 4,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.borderMist,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingBottom: 20,
    paddingLeft: 10,
    gap: 3,
  },
  contentBorder: {
    // spacing handled by paddingBottom on content
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: 11,
    color: Colors.steelGrey,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  type: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.graphite,
  },
  repairerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  repairer: {
    fontSize: 12,
    color: Colors.steelGrey,
  },
});
