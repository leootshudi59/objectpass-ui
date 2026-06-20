import React from 'react';
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
import { Colors } from '../constants/colors';
import { mockDevices, Device } from '../data/mockDevices';
import {
  DeviceCard,
  SectionHeader,
} from '../components/ui';

// ── Stat strip card ────────────────────────────────────────────────────────────

interface StatCardProps {
  value: string | number;
  label: string;
}

function StatCard({ value, label }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Derived stats from mock data ───────────────────────────────────────────────

function computeStats(devices: Device[]) {
  const total = devices.length;
  const repairsThisYear = devices.reduce((acc, d) => acc + d.repairs.length, 0);
  const activeWarranties = devices.filter((d) => d.warrantyActive).length;
  return { total, repairsThisYear, activeWarranties };
}

// ── Home Screen ────────────────────────────────────────────────────────────────

export function HomeScreen() {
  const { total, repairsThisYear, activeWarranties } = computeStats(mockDevices);

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
            <StatCard value={total} label="Appareils" />
            <View style={styles.statDivider} />
            <StatCard value={repairsThisYear} label="Réparations" />
            <View style={styles.statDivider} />
            <StatCard value={activeWarranties} label="Garanties" />
          </View>

          {/* ── Device list ───────────────────────────────────────────── */}
          <View style={styles.section}>
            <SectionHeader title="Mes appareils" action="Tout voir" />
            {mockDevices.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </View>
        </ScrollView>

        {/* ── FAB ───────────────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
          <Feather name="plus" size={26} color={Colors.cleanWhite} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cleanWhite,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.cleanWhite,
  },
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
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
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
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.repairTeal,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.steelGrey,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.borderMist,
  },
  section: {
    marginTop: 4,
  },
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
