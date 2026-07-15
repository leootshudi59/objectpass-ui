import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp, CommonActions } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { StatusBadge } from '../components/ui';
import { useAppointments } from '../context/AppointmentsContext';
import type { MainStackParamList } from '../navigation/MainNavigator';

type Route = RouteProp<MainStackParamList, 'Booking'>;

// ── Helpers ────────────────────────────────────────────────────────────────────

const DAY_ABBR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function getNext7Days(): { label: string; number: string; iso: string; display: string }[] {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      label: DAY_ABBR[d.getDay()],
      number: String(d.getDate()).padStart(2, '0'),
      iso: d.toISOString(),
      display: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
    });
  }
  return days;
}

const DAYS = getNext7Days();
const ALL_SLOTS = ['09h00', '10h30', '11h00', '14h00', '15h30', '17h00'];
const UNAVAILABLE_SLOTS = ['10h30', '15h30'];
const INTERVENTION_TYPES = ["En boutique", "À domicile", "Envoi postal"];

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

// ── Screen ─────────────────────────────────────────────────────────────────────

export function BookingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { repairer, diagnosis } = route.params;
  const { addAppointment } = useAppointments();

  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [interventionType, setInterventionType] = useState('En boutique');
  const [notes, setNotes] = useState('');
  const [notesFocused, setNotesFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const canConfirm = selectedSlot !== null && !loading;

  const handleConfirm = () => {
    if (!canConfirm) return;
    setLoading(true);

    setTimeout(() => {
      const appointment = {
        id: Date.now().toString(),
        status: 'confirmed' as const,
        device: { name: diagnosis.deviceName, model: diagnosis.deviceModel },
        issue: {
          label: diagnosis.issueLabel,
          priceRange: diagnosis.priceRange,
          urgency: diagnosis.urgency,
        },
        repairer: {
          name: repairer.name,
          shop: repairer.shop,
          certified: repairer.certified,
          rating: repairer.rating,
        },
        date: DAYS[selectedDay].display,
        time: selectedSlot!,
        type: interventionType,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      };

      addAppointment(appointment);

      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: 'Tabs', params: { screen: 'Rendez_vous' } },
            { name: 'AppointmentDetail', params: { appointmentId: appointment.id } },
          ],
        })
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={Colors.objectNavy} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Choisir un créneau</Text>
          <Text style={styles.headerSubtitle}>
            {repairer.name} · {repairer.shop}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Repairer recap card ──────────────────────────────────── */}
        <View style={styles.repairerCard}>
          <View style={styles.cardTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(repairer.name)}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.repairerName}>{repairer.name}</Text>
              <Text style={styles.shopName}>{repairer.shop}</Text>
              <StarRow rating={repairer.rating} />
            </View>
          </View>
          <View style={styles.badgesRow}>
            {repairer.certified && (
              <View style={styles.certBadge}>
                <Feather name="check-circle" size={10} color={Colors.proofBlue} />
                <Text style={styles.certBadgeLabel}>Certifié ObjectPass</Text>
              </View>
            )}
            {repairer.tags.map((tag: string) => (
              <View key={tag} style={styles.tagBadge}>
                <Text style={styles.tagBadgeLabel}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Intervention recap ───────────────────────────────────── */}
        <View style={styles.separator} />
        <View style={styles.interventionRecap}>
          <View style={styles.recapRow}>
            <View style={styles.recapLeft}>
              <Text style={styles.recapDevice}>{diagnosis.deviceName}</Text>
              <Text style={styles.recapIssue}>{diagnosis.issueLabel}</Text>
            </View>
            <StatusBadge status={mapUrgency(diagnosis.urgency)} />
          </View>
          <Text style={styles.recapPrice}>{diagnosis.priceRange}</Text>
        </View>

        {/* ── Date picker ──────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>DATE</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateRow}
        >
          {DAYS.map((day, i) => {
            const active = selectedDay === i;
            return (
              <Pressable
                key={day.iso}
                onPress={() => { setSelectedDay(i); setSelectedSlot(null); }}
                style={[styles.dayChip, active && styles.dayChipActive]}
              >
                <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>
                  {day.label}
                </Text>
                <Text style={[styles.dayNumber, active && styles.dayNumberActive]}>
                  {day.number}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Time slot grid ───────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>CRÉNEAU</Text>
        <View style={styles.slotGrid}>
          {ALL_SLOTS.map((slot) => {
            const unavailable = UNAVAILABLE_SLOTS.includes(slot);
            const active = selectedSlot === slot;
            return (
              <Pressable
                key={slot}
                onPress={() => !unavailable && setSelectedSlot(slot)}
                disabled={unavailable}
                style={[
                  styles.slotChip,
                  active && styles.slotChipActive,
                  unavailable && styles.slotChipUnavailable,
                ]}
              >
                <Text
                  style={[
                    styles.slotLabel,
                    active && styles.slotLabelActive,
                    unavailable && styles.slotLabelUnavailable,
                  ]}
                >
                  {slot}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Intervention type ────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>TYPE D'INTERVENTION</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeRow}
        >
          {INTERVENTION_TYPES.map((type) => {
            const active = interventionType === type;
            return (
              <Pressable
                key={type}
                onPress={() => setInterventionType(type)}
                style={[styles.typePill, active && styles.typePillActive]}
              >
                <Text style={[styles.typePillLabel, active && styles.typePillLabelActive]}>
                  {type}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Notes field ──────────────────────────────────────────── */}
        <Text style={styles.notesLabel}>Informations complémentaires (optionnel)</Text>
        <TextInput
          style={[styles.notesInput, notesFocused && styles.notesInputFocused]}
          placeholder="Décrivez brièvement le problème..."
          placeholderTextColor={Colors.steelGrey}
          multiline
          onFocus={() => setNotesFocused(true)}
          onBlur={() => setNotesFocused(false)}
          onChangeText={setNotes}
          value={notes}
          textAlignVertical="top"
        />

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <Pressable
          onPress={handleConfirm}
          disabled={!canConfirm}
          style={({ pressed }) => [
            styles.ctaBtn,
            !canConfirm && styles.ctaBtnDisabled,
            pressed && canConfirm && { opacity: 0.88, transform: [{ scale: 0.97 }] },
          ]}
        >
          {loading ? (
            <View style={styles.ctaLoading}>
              <ActivityIndicator color={Colors.cleanWhite} size="small" />
              <Text style={styles.ctaLabel}>Confirmation en cours...</Text>
            </View>
          ) : (
            <Text style={styles.ctaLabel}>Confirmer la réservation</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function mapUrgency(urgency: string): any {
  switch (urgency.toLowerCase()) {
    case 'élevé':
    case 'panne':
      return 'panne';
    case 'modéré':
    case 'attention':
      return 'attention';
    default:
      return 'bon';
  }
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cleanWhite,
  },

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
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.graphite,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.steelGrey,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 0,
  },

  // Repairer card
  repairerCard: {
    backgroundColor: Colors.paperSage,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  cardTop: {
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
  cardInfo: {
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
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E9EFFF',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  certBadgeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.proofBlue,
  },
  tagBadge: {
    backgroundColor: '#E7F8F5',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagBadgeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.repairTeal,
  },

  // Intervention recap
  separator: {
    height: 1,
    backgroundColor: Colors.borderMist,
    marginBottom: 16,
  },
  interventionRecap: {
    marginBottom: 20,
    gap: 6,
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recapLeft: {
    flex: 1,
    gap: 2,
    marginRight: 12,
  },
  recapDevice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.graphite,
  },
  recapIssue: {
    fontSize: 13,
    color: Colors.steelGrey,
  },
  recapPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.repairTeal,
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.steelGrey,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },

  // Date picker
  dateRow: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 20,
  },
  dayChip: {
    width: 52,
    height: 64,
    borderRadius: 14,
    backgroundColor: Colors.paperSage,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayChipActive: {
    backgroundColor: Colors.objectNavy,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.steelGrey,
  },
  dayLabelActive: {
    color: Colors.cleanWhite,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.steelGrey,
  },
  dayNumberActive: {
    color: Colors.cleanWhite,
  },

  // Time slot grid
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  slotChip: {
    width: '47%',
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
    backgroundColor: Colors.cleanWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotChipActive: {
    backgroundColor: Colors.repairTeal,
    borderColor: Colors.repairTeal,
  },
  slotChipUnavailable: {
    backgroundColor: Colors.paperSage,
    borderColor: Colors.borderMist,
  },
  slotLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.graphite,
  },
  slotLabelActive: {
    color: Colors.cleanWhite,
  },
  slotLabelUnavailable: {
    color: Colors.steelGrey,
  },

  // Intervention type
  typeRow: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 20,
  },
  typePill: {
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.paperSage,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
  },
  typePillActive: {
    backgroundColor: Colors.objectNavy,
    borderColor: Colors.objectNavy,
  },
  typePillLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.steelGrey,
  },
  typePillLabelActive: {
    color: Colors.cleanWhite,
  },

  // Notes
  notesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.graphite,
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    fontSize: 14,
    color: Colors.graphite,
    backgroundColor: Colors.cleanWhite,
    marginBottom: 24,
  },
  notesInputFocused: {
    borderColor: Colors.repairTeal,
  },

  // CTA
  ctaBtn: {
    backgroundColor: Colors.repairTeal,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnDisabled: {
    backgroundColor: Colors.borderMist,
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.cleanWhite,
  },
  ctaLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
