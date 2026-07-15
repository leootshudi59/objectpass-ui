import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors, healthColor } from '../../constants/colors';
import type { Device } from '../../types';
import { HealthScoreBadge } from './HealthScoreBadge';
import { StatusBadge } from './StatusBadge';

const CATEGORY_ICON: Record<Device['category'], { lib: 'feather' | 'ionicons'; name: string }> = {
  laptop:  { lib: 'feather',   name: 'monitor' },
  phone:   { lib: 'feather',   name: 'smartphone' },
  tablet:  { lib: 'feather',   name: 'tablet' },
  ebike:   { lib: 'ionicons',  name: 'bicycle-outline' },
  other:   { lib: 'feather',   name: 'box' },
};

interface Props {
  device: Device;
  onPress?: () => void;
}

export function DeviceCard({ device, onPress }: Props) {
  const iconCfg = CATEGORY_ICON[device.category];
  const statusColor = healthColor(device.healthScore);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* Left status stripe */}
      <View style={[styles.stripe, { backgroundColor: statusColor }]} />

      {/* Icon */}
      <View style={styles.iconWrap}>
        {iconCfg.lib === 'feather' ? (
          <Feather name={iconCfg.name as any} size={22} color={Colors.repairTeal} />
        ) : (
          <Ionicons name={iconCfg.name as any} size={22} color={Colors.repairTeal} />
        )}
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{device.name}</Text>
          <HealthScoreBadge score={device.healthScore} size="small" />
        </View>

        <Text style={styles.model}>{device.model}</Text>

        <View style={styles.bottomRow}>
          <StatusBadge status={device.status} />

          {device.warrantyActive && (
            <View style={styles.warrantyRow}>
              <View style={styles.warrantyDot} />
              <Text style={styles.warrantyLabel}>Garantie active</Text>
            </View>
          )}
        </View>

        {device.lastRepairDate && (
          <Text style={styles.meta}>Dernière intervention : {device.lastRepairDate}</Text>
        )}
      </View>

      <Feather name="chevron-right" size={16} color={Colors.borderMist} style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.paperSage,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderMist,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  stripe: {
    width: 4,
    alignSelf: 'stretch',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.cleanWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
    marginRight: 12,
  },
  content: {
    flex: 1,
    paddingVertical: 16,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.graphite,
    flex: 1,
    marginRight: 8,
  },
  model: {
    fontSize: 12,
    color: Colors.steelGrey,
    marginTop: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  warrantyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  warrantyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.warrantyGreen,
  },
  warrantyLabel: {
    fontSize: 11,
    color: Colors.warrantyGreen,
    fontWeight: '600',
  },
  meta: {
    fontSize: 11,
    color: Colors.steelGrey,
    marginTop: 4,
    letterSpacing: 0.1,
  },
  chevron: {
    marginRight: 14,
  },
});
