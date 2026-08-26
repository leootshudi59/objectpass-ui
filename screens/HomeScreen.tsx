import React, { useEffect } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import type { RootStackParamList } from '../navigation/types';
import { DeviceCard, SectionHeader } from '../components/ui';
import { useDevices } from '../context/DevicesContext';
import { useToast } from '../context/ToastContext';
import { getOwnership, isDeviceActive } from '../constants/ownership';

// ── Stat strip card ────────────────────────────────────────────────────────────

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Home Screen ────────────────────────────────────────────────────────────────

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { devices, newDeviceId, clearNewDevice } = useDevices();
  const { showToast } = useToast();

  const activeDevices     = devices.filter((d) => isDeviceActive(d));
  const archivedDevices   = devices.filter((d) => d.status === 'archived');
  const transferredDevices = devices.filter((d) => d.status !== 'archived' && getOwnership(d).status === 'transferred');

  // Stats — archived devices don't count toward active totals
  const total            = activeDevices.length;
  const repairsThisYear  = activeDevices.reduce((acc, d) => acc + d.repairs.length, 0);
  const activeWarranties = activeDevices.filter((d) => d.warrantyActive).length;

  // Show toast + badge when a new device is added
  useEffect(() => {
    if (!newDeviceId) return;
    const device = devices.find((d) => d.id === newDeviceId);
    if (!device) return;

    showToast(`✓ ${device.name} ajouté à votre ObjectPass`, 'success');

    const dismiss = setTimeout(clearNewDevice, 3000);
    return () => clearTimeout(dismiss);
  }, [newDeviceId]);

  const openAddDevice = () => navigation.navigate('AddDevice');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ── Top bar ───────────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <Text style={styles.heading}>Mes appareils</Text>
          <Pressable style={styles.avatar}>
            <Feather name="user" size={18} color={Colors.objectNavy} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Stat strip ────────────────────────────────────────────── */}
          <View style={styles.statStrip}>
            <StatCard value={total}            label="Appareils" />
            <View style={styles.statDivider} />
            <StatCard value={repairsThisYear}  label="Réparations" />
            <View style={styles.statDivider} />
            <StatCard value={activeWarranties} label="Garanties" />
          </View>

          {/* ── Device list ───────────────────────────────────────────── */}
          <View style={styles.section}>
            <SectionHeader title="Mes appareils" action="Tout voir" />
            {activeDevices.map((device) => (
              <View key={device.id} style={styles.cardWrapper}>
                <DeviceCard
                  device={device as any}
                  onPress={() => navigation.navigate('DeviceDetail', { deviceId: device.id })}
                />
                {device.id === newDeviceId && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>Nouveau ✨</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* ── Archived devices ──────────────────────────────────────── */}
          {archivedDevices.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Appareils archivés" />
              {archivedDevices.map((device) => (
                <View key={device.id} style={styles.cardWrapper}>
                  <DeviceCard
                    device={device as any}
                    onPress={() => navigation.navigate('DeviceDetail', { deviceId: device.id })}
                  />
                </View>
              ))}
            </View>
          )}

          {/* ── Transferred devices ───────────────────────────────────── */}
          {transferredDevices.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Appareils transférés" />
              {transferredDevices.map((device) => (
                <View key={device.id} style={styles.cardWrapper}>
                  <DeviceCard
                    device={device as any}
                    onPress={() => navigation.navigate('DeviceDetail', { deviceId: device.id })}
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* ── FAB ───────────────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={openAddDevice}>
          <Feather name="plus" size={26} color={Colors.cleanWhite} />
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.cleanWhite },
  container: { flex: 1, backgroundColor: Colors.cleanWhite },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.graphite,
    letterSpacing: -0.5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.paperSage,
    borderWidth: 1,
    borderColor: Colors.borderMist,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { paddingHorizontal: 20, paddingBottom: 100 },

  statStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.paperSage,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderMist,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginVertical: 16,
    alignItems: 'center',
  },
  statCard:    { flex: 1, alignItems: 'center', gap: 4 },
  statValue:   { fontSize: 24, fontWeight: '800', color: Colors.repairTeal, letterSpacing: -0.5 },
  statLabel:   { fontSize: 11, fontWeight: '600', color: Colors.steelGrey, letterSpacing: 0.5, textTransform: 'uppercase' },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.borderMist },

  section: { marginTop: 4 },

  cardWrapper: { position: 'relative' },
  newBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.diagnosticAmber,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 1,
  },
  newBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.cleanWhite },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.repairTeal,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.repairTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },

});
