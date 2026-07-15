import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { Colors } from '../constants/colors';
import { StatusBadge, PrimaryButton } from '../components/ui';
import { useAppointments } from '../context/AppointmentsContext';
import type { Appointment } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────────────

type TabKey = 'avenir' | 'encours' | 'passes';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'avenir', label: 'À venir' },
  { key: 'encours', label: 'En cours' },
  { key: 'passes', label: 'Passés' },
];

function filterByTab(appointments: Appointment[], tab: TabKey): Appointment[] {
  switch (tab) {
    case 'avenir':   return appointments.filter((a) => a.status === 'confirmed');
    case 'encours':  return appointments.filter((a) => a.status === 'in_progress');
    case 'passes':   return appointments.filter((a) => a.status === 'completed' || a.status === 'cancelled');
    default: return [];
  }
}

function accentColor(status: Appointment['status']): string {
  switch (status) {
    case 'confirmed':   return Colors.repairTeal;
    case 'in_progress': return Colors.diagnosticAmber;
    case 'completed':   return Colors.warrantyGreen;
    case 'cancelled':   return Colors.steelGrey;
  }
}

function statusLabel(status: Appointment['status']): string {
  switch (status) {
    case 'confirmed':   return 'Confirmé';
    case 'in_progress': return 'En cours';
    case 'completed':   return 'Terminé';
    case 'cancelled':   return 'Annulé';
  }
}

function statusBadgeType(status: Appointment['status']): any {
  switch (status) {
    case 'confirmed':   return 'certifié';
    case 'in_progress': return 'attention';
    case 'completed':   return 'excellent';
    case 'cancelled':   return 'panne';
  }
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function AppointmentCard({
  appointment,
  onPress,
}: {
  appointment: Appointment;
  onPress: () => void;
}) {
  const accent = accentColor(appointment.status);
  const initials = getInitials(appointment.repairer.name);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accent }]} />

      <View style={styles.cardContent}>
        {/* Top row */}
        <View style={styles.cardTopRow}>
          <Text style={styles.deviceName} numberOfLines={1}>
            {appointment.device.name}
          </Text>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: accent }]} />
            <Text style={[styles.statusText, { color: accent }]}>
              {statusLabel(appointment.status)}
            </Text>
          </View>
        </View>

        <Text style={styles.issueLabel}>{appointment.issue.label}</Text>

        {/* Separator */}
        <View style={styles.cardSeparator} />

        {/* Repairer row */}
        <View style={styles.repairerRow}>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallText}>{initials}</Text>
          </View>
          <View style={styles.repairerInfo}>
            <Text style={styles.repairerName}>{appointment.repairer.name}</Text>
            <Text style={styles.shopName}>{appointment.repairer.shop}</Text>
          </View>
          {appointment.repairer.certified && (
            <View style={styles.certBadge}>
              <Feather name="check-circle" size={9} color={Colors.proofBlue} />
              <Text style={styles.certBadgeLabel}>Certifié</Text>
            </View>
          )}
        </View>

        {/* Date / time / type row */}
        <Text style={styles.dateRow}>
          📅 {appointment.date}  ·  ⏱ {appointment.time}  ·  📍 {appointment.type}
        </Text>

        {/* Price */}
        <Text style={styles.priceText}>{appointment.issue.priceRange}</Text>
      </View>
    </Pressable>
  );
}

function EmptyState({ tab, onDiagnostic }: { tab: TabKey; onDiagnostic: () => void }) {
  const subtext =
    tab === 'avenir'
      ? 'Lancez un diagnostic pour réserver'
      : tab === 'encours'
      ? 'Aucun appareil en cours de réparation'
      : 'Vos interventions passées apparaîtront ici';

  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🗓️</Text>
      <Text style={styles.emptyTitle}>Aucun rendez-vous</Text>
      <Text style={styles.emptySubtext}>{subtext}</Text>
      {tab === 'avenir' && (
        <View style={styles.emptyCta}>
          <PrimaryButton label="Lancer un diagnostic" onPress={onDiagnostic} />
        </View>
      )}
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export function AppointmentsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { appointments } = useAppointments();
  const [activeTab, setActiveTab] = useState<TabKey>('avenir');

  const filtered = filterByTab(appointments, activeTab);
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const subtitle = `${appointments.length} rendez-vous · ${confirmedCount} à venir`;

  const goToDiagnostic = () => {
    navigation.navigate('Tabs', { screen: 'Diagnostic' });
  };

  const goToDetail = (appointmentId: string) => {
    navigation.navigate('AppointmentDetail', { appointmentId });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes rendez-vous</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* ── Tab bar ───────────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={styles.tab}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {active && <View style={styles.tabUnderline} />}
            </Pressable>
          );
        })}
      </View>

      {/* ── List ──────────────────────────────────────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AppointmentCard
            appointment={item}
            onPress={() => goToDetail(item.id)}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState tab={activeTab} onDiagnostic={goToDiagnostic} />
        }
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cleanWhite,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.graphite,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.steelGrey,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderMist,
    marginTop: 16,
    marginHorizontal: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 10,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.steelGrey,
  },
  tabLabelActive: {
    color: Colors.objectNavy,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '10%',
    right: '10%',
    height: 2,
    backgroundColor: Colors.repairTeal,
    borderRadius: 1,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  listContentEmpty: {
    flex: 1,
  },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.cleanWhite,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
    marginBottom: 12,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    borderRadius: 2,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    gap: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.graphite,
    flex: 1,
    marginRight: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: Colors.paperSage,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  issueLabel: {
    fontSize: 13,
    color: Colors.steelGrey,
  },
  cardSeparator: {
    height: 1,
    backgroundColor: Colors.borderMist,
    marginVertical: 4,
  },

  // Repairer row
  repairerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.objectNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.cleanWhite,
  },
  repairerInfo: {
    flex: 1,
  },
  repairerName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.graphite,
  },
  shopName: {
    fontSize: 11,
    color: Colors.steelGrey,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E9EFFF',
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  certBadgeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.proofBlue,
  },
  dateRow: {
    fontSize: 12,
    color: Colors.steelGrey,
    marginTop: 2,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.repairTeal,
    marginTop: 2,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
    marginTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.graphite,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.steelGrey,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCta: {
    marginTop: 16,
    width: '100%',
  },
});
