import React from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { OutlineButton, PrimaryButton } from '../components/ui';
import { useAppointments, type Appointment } from '../context/AppointmentsContext';
import type { MainStackParamList } from '../navigation/MainNavigator';

type Route = RouteProp<MainStackParamList, 'AppointmentDetail'>;

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function StarRow({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <Text style={styles.starRow}>
      <Text style={styles.starsFilled}>{'★'.repeat(filled)}</Text>
      <Text style={styles.starsEmpty}>{'☆'.repeat(5 - filled)}</Text>
      <Text style={styles.starCount}>  {rating}</Text>
    </Text>
  );
}

function formatDateLong(dateStr: string): string {
  // dateStr is "DD/MM/YYYY"
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  const [day, month, year] = parts;
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const MONTHS = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ];
  return `${DAYS[d.getDay()]} ${Number(day)} ${MONTHS[d.getMonth()]} ${year}`;
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

// ── Timeline ───────────────────────────────────────────────────────────────────

interface TimelineStep {
  label: string;
  done: boolean;
  date?: string;
}

function getTimeline(appointment: Appointment): TimelineStep[] {
  const confirmedDate = appointment.date + ' ' + appointment.time;
  const steps: TimelineStep[] = [
    { label: 'Réservation confirmée', done: true, date: confirmedDate },
    { label: 'Appareil déposé / envoyé', done: appointment.status === 'in_progress' || appointment.status === 'completed' },
    { label: 'Réparation en cours', done: appointment.status === 'completed' },
    { label: 'Prêt à récupérer', done: appointment.status === 'completed' },
  ];
  return steps;
}

function Timeline({ appointment }: { appointment: Appointment }) {
  const steps = getTimeline(appointment);
  return (
    <View style={styles.timeline}>
      {steps.map((step, i) => (
        <View key={i} style={styles.timelineRow}>
          <View style={styles.timelineLine}>
            <View
              style={[
                styles.timelineDot,
                step.done && styles.timelineDotDone,
              ]}
            >
              {step.done && (
                <Feather name="check" size={10} color={Colors.cleanWhite} />
              )}
            </View>
            {i < steps.length - 1 && (
              <View
                style={[
                  styles.timelineConnector,
                  step.done && styles.timelineConnectorDone,
                ]}
              />
            )}
          </View>
          <View style={styles.timelineContent}>
            <Text style={[styles.timelineLabel, step.done && styles.timelineLabelDone]}>
              {step.label}
            </Text>
            {step.date && (
              <Text style={styles.timelineDate}>{step.date}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export function AppointmentDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { appointmentId } = route.params;
  const { appointments, updateAppointment } = useAppointments();

  const appointment = appointments.find((a) => a.id === appointmentId);

  if (!appointment) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Rendez-vous introuvable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const accent = accentColor(appointment.status);
  const initials = getInitials(appointment.repairer.name);

  const handleCancel = () => {
    Alert.alert(
      'Annuler le rendez-vous',
      'Voulez-vous vraiment annuler ce rendez-vous ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: () => {
            updateAppointment(appointment.id, { status: 'cancelled' });
            navigation.navigate('Tabs', { screen: 'Rendez_vous' });
          },
        },
      ]
    );
  };

  const handleModify = () => {
    Alert.alert('Modifier le rendez-vous', 'Fonctionnalité bientôt disponible 🛠️');
  };

  const handleProof = () => {
    Alert.alert('Preuve de réparation', 'Fonctionnalité bientôt disponible 🛠️');
  };

  const handleReview = () => {
    Alert.alert('Laisser un avis', 'Fonctionnalité bientôt disponible 🛠️');
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={Colors.objectNavy} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{appointment.device.name}</Text>
          <Text style={styles.headerSubtitle}>{appointment.issue.label}</Text>
        </View>
        <View style={[styles.statusPill, { borderColor: accent }]}>
          <View style={[styles.statusDot, { backgroundColor: accent }]} />
          <Text style={[styles.statusPillText, { color: accent }]}>
            {statusLabel(appointment.status)}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section Intervention ──────────────────────────────── */}
        <Text style={styles.sectionTitle}>Intervention</Text>
        <View style={styles.card}>
          <Text style={styles.cardIssueLabel}>{appointment.issue.label}</Text>
          <Text style={styles.cardPrice}>{appointment.issue.priceRange}</Text>
          <View style={styles.pillRow}>
            <View style={styles.urgencyPill}>
              <Text style={styles.urgencyPillText}>⚡ {appointment.issue.urgency}</Text>
            </View>
            <View style={styles.typePill}>
              <Text style={styles.typePillText}>📍 {appointment.type}</Text>
            </View>
          </View>
        </View>

        {/* ── Section Réparateur ────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Réparateur</Text>
        <View style={styles.card}>
          <View style={styles.repairerTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.repairerInfo}>
              <Text style={styles.repairerName}>{appointment.repairer.name}</Text>
              <Text style={styles.shopName}>{appointment.repairer.shop}</Text>
              <StarRow rating={appointment.repairer.rating} />
            </View>
          </View>
          {appointment.repairer.certified && (
            <View style={styles.certBadge}>
              <Feather name="check-circle" size={11} color={Colors.proofBlue} />
              <Text style={styles.certBadgeLabel}>Certifié ObjectPass</Text>
            </View>
          )}
          <View style={styles.repairerActions}>
            <Pressable
              onPress={() => Alert.alert('Appeler', 'Fonctionnalité bientôt disponible 🛠️')}
              style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
            >
              <Feather name="phone" size={14} color={Colors.objectNavy} />
              <Text style={styles.actionBtnLabel}>Appeler</Text>
            </Pressable>
            <Pressable
              onPress={() => Alert.alert('Message', 'Fonctionnalité bientôt disponible 🛠️')}
              style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
            >
              <Feather name="message-square" size={14} color={Colors.objectNavy} />
              <Text style={styles.actionBtnLabel}>Message</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Section Créneau ───────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Créneau</Text>
        <View style={styles.card}>
          <View style={styles.slotRow}>
            <Text style={styles.slotIcon}>📅</Text>
            <Text style={styles.slotText}>{formatDateLong(appointment.date)}</Text>
          </View>
          <View style={styles.slotRow}>
            <Text style={styles.slotIcon}>⏱</Text>
            <Text style={styles.slotText}>{appointment.time}</Text>
          </View>
          <View style={styles.slotRow}>
            <Text style={styles.slotIcon}>📍</Text>
            <Text style={styles.slotText}>{appointment.type}</Text>
          </View>
          {!!appointment.notes && (
            <Text style={styles.notes}>"{appointment.notes}"</Text>
          )}
        </View>

        {/* ── Section Statut ────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Statut de l'intervention</Text>
        <View style={styles.card}>
          <Timeline appointment={appointment} />
        </View>

        {/* ── Action buttons ────────────────────────────────────── */}
        <View style={styles.actions}>
          {appointment.status === 'confirmed' && (
            <>
              <OutlineButton label="Modifier le rendez-vous" onPress={handleModify} />
              <Pressable
                onPress={handleCancel}
                style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.cancelBtnLabel}>Annuler le rendez-vous</Text>
              </Pressable>
            </>
          )}
          {appointment.status === 'completed' && (
            <>
              <PrimaryButton label="Voir la preuve de réparation" onPress={handleProof} />
              <OutlineButton label="Laisser un avis" onPress={handleReview} />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cleanWhite,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.steelGrey,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
    marginTop: 2,
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.graphite,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.steelGrey,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 99,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.steelGrey,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 10,
  },

  card: {
    backgroundColor: Colors.paperSage,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },

  // Intervention
  cardIssueLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.graphite,
  },
  cardPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.repairTeal,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  urgencyPill: {
    backgroundColor: '#FEF3DB',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  urgencyPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.diagnosticAmber,
  },
  typePill: {
    backgroundColor: Colors.borderMist,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.steelGrey,
  },

  // Repairer
  repairerTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.objectNavy,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.cleanWhite,
  },
  repairerInfo: {
    flex: 1,
    gap: 2,
  },
  repairerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.graphite,
  },
  shopName: {
    fontSize: 13,
    color: Colors.steelGrey,
  },
  starRow: {
    fontSize: 13,
    marginTop: 2,
  },
  starsFilled: {
    color: Colors.diagnosticAmber,
  },
  starsEmpty: {
    color: Colors.borderMist,
  },
  starCount: {
    color: Colors.steelGrey,
    fontSize: 12,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E9EFFF',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  certBadgeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.proofBlue,
  },
  repairerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.objectNavy,
    borderRadius: 10,
    paddingVertical: 8,
  },
  actionBtnLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.objectNavy,
  },

  // Créneau
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  slotIcon: {
    fontSize: 16,
    width: 22,
    textAlign: 'center',
  },
  slotText: {
    fontSize: 14,
    color: Colors.graphite,
    fontWeight: '500',
  },
  notes: {
    fontSize: 13,
    color: Colors.steelGrey,
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 18,
  },

  // Timeline
  timeline: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 14,
    minHeight: 48,
  },
  timelineLine: {
    alignItems: 'center',
    width: 20,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.borderMist,
    backgroundColor: Colors.cleanWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  timelineDotDone: {
    backgroundColor: Colors.repairTeal,
    borderColor: Colors.repairTeal,
  },
  timelineConnector: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.borderMist,
    marginVertical: 4,
  },
  timelineConnectorDone: {
    backgroundColor: Colors.repairTeal,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: 16,
    gap: 2,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.steelGrey,
  },
  timelineLabelDone: {
    color: Colors.graphite,
    fontWeight: '600',
  },
  timelineDate: {
    fontSize: 12,
    color: Colors.steelGrey,
  },

  // Actions
  actions: {
    marginTop: 28,
    gap: 12,
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: Colors.faultCoral,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.faultCoral,
  },
});
