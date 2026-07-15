import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { Colors, healthColor } from '../constants/colors';
import { mockDevices } from '../data/mockDevices';
import { PrimaryButton, OutlineButton, StatusBadge } from '../components/ui';
import type { Device, DiagnosisResult } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 3; // steps 0, 1, 2 → then result

// ── Data ───────────────────────────────────────────────────────────────────────

const SYMPTOMS = [
  { id: 'batterie', label: 'Batterie / alimentation', emoji: '🔋' },
  { id: 'ecran',    label: 'Écran / affichage',       emoji: '📱' },
  { id: 'son',      label: 'Son / micro',              emoji: '🔊' },
  { id: 'chauffe',  label: 'Chauffe / performance',   emoji: '🌡️' },
  { id: 'eau',      label: 'Dégât des eaux',           emoji: '💧' },
  { id: 'autre',    label: 'Autre problème',           emoji: '⚙️' },
];

const SEVERITIES = [
  { id: 'léger',  label: 'Légèrement', desc: "L'appareil fonctionne encore", color: Colors.warrantyGreen },
  { id: 'modéré', label: 'Modérément', desc: 'Utilisation difficile',         color: Colors.diagnosticAmber },
  { id: 'sévère', label: 'Sévèrement', desc: 'Appareil inutilisable',         color: Colors.faultCoral },
];

// ── Result logic ───────────────────────────────────────────────────────────────

function computeResult(symptomId: string, severityId: string): DiagnosisResult {
  if (symptomId === 'batterie' && severityId === 'sévère')
    return { label: 'Remplacement batterie',             priceRange: '59 € – 89 €',  duration: '45 min', urgency: 'panne' };
  if (symptomId === 'ecran' && severityId === 'modéré')
    return { label: 'Réparation écran',                  priceRange: '89 € – 149 €', duration: '1h30',   urgency: 'attention' };
  if (symptomId === 'chauffe' && severityId === 'léger')
    return { label: 'Nettoyage interne',                 priceRange: '39 € – 59 €',  duration: '30 min', urgency: 'bon' };
  return   { label: 'Diagnostic approfondi conseillé',   priceRange: '29 €',          duration: '30 min', urgency: 'bon' };
}

// ── Selectable device row ──────────────────────────────────────────────────────

function SelectableDeviceRow({
  device,
  selected,
  onSelect,
}: {
  device: Device;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      style={[styles.selectableDevice, selected && styles.selectableDeviceSelected]}
    >
      <View style={styles.selectableLeft}>
        <View style={[styles.deviceColorDot, { backgroundColor: healthColor(device.healthScore) }]} />
        <View style={styles.selectableInfo}>
          <Text style={styles.selectableName}>{device.name}</Text>
          <Text style={styles.selectableModel}>{device.model}</Text>
        </View>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioFill} />}
      </View>
    </Pressable>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export function DiagnosticScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [step, setStep] = useState(0);
  const [selectedDeviceId, setSelectedDeviceId]   = useState<string | null>(null);
  const [selectedSymptomId, setSelectedSymptomId] = useState<string | null>(null);
  const [selectedSeverityId, setSelectedSeverityId] = useState<string | null>(null);

  const progressAnim  = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;
  const slideAnim     = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const resultY       = useRef(new Animated.Value(20)).current;

  const goToStep = (next: number, direction: 'forward' | 'back') => {
    const outX = direction === 'forward' ? -SCREEN_WIDTH : SCREEN_WIDTH;
    const inX  = direction === 'forward' ?  SCREEN_WIDTH : -SCREEN_WIDTH;

    // Animate progress bar in parallel with slide-out
    const targetProgress = next < TOTAL_STEPS ? (next + 1) / TOTAL_STEPS : 1;
    Animated.timing(progressAnim, {
      toValue: targetProgress,
      duration: 250,
      useNativeDriver: false,
    }).start();

    Animated.timing(slideAnim, { toValue: outX, duration: 200, useNativeDriver: true }).start(() => {
      setStep(next);
      slideAnim.setValue(inX);
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start();

      if (next === TOTAL_STEPS) {
        resultOpacity.setValue(0);
        resultY.setValue(20);
        Animated.parallel([
          Animated.timing(resultOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(resultY,       { toValue: 0, duration: 350, useNativeDriver: true }),
        ]).start();
      }
    });
  };

  const handleNext = () => { if (step < TOTAL_STEPS) goToStep(step + 1, 'forward'); };
  const handleBack = () => { if (step > 0)           goToStep(step - 1, 'back'); };

  const handleReset = () => {
    setStep(0);
    setSelectedDeviceId(null);
    setSelectedSymptomId(null);
    setSelectedSeverityId(null);
    progressAnim.setValue(1 / TOTAL_STEPS);
    slideAnim.setValue(0);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const isNextEnabled =
    (step === 0 && selectedDeviceId !== null) ||
    (step === 1 && selectedSymptomId !== null) ||
    (step === 2 && selectedSeverityId !== null);

  const result =
    selectedSymptomId && selectedSeverityId
      ? computeResult(selectedSymptomId, selectedSeverityId)
      : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        {step > 0 && step < TOTAL_STEPS && (
          <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={12}>
            <Feather name="arrow-left" size={20} color={Colors.graphite} />
          </Pressable>
        )}
        <View style={styles.headerText}>
          <Text style={styles.title}>Diagnostic</Text>
          <Text style={styles.subtitle}>Identifiez le problème de votre appareil</Text>
        </View>
      </View>

      {/* ── Progress bar ──────────────────────────────────────────────────── */}
      {step < TOTAL_STEPS && (
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      )}

      {/* ── Steps ─────────────────────────────────────────────────────────── */}
      {step < TOTAL_STEPS ? (
        <Animated.View style={[styles.stepWrapper, { transform: [{ translateX: slideAnim }] }]}>
          <ScrollView contentContainerStyle={styles.stepScroll} showsVerticalScrollIndicator={false}>

            {/* STEP 0 — Device selection */}
            {step === 0 && (
              <>
                <Text style={styles.question}>Quel appareil voulez-vous diagnostiquer ?</Text>
                {mockDevices.map((device) => (
                  <SelectableDeviceRow
                    key={device.id}
                    device={device}
                    selected={selectedDeviceId === device.id}
                    onSelect={() => setSelectedDeviceId(device.id)}
                  />
                ))}
              </>
            )}

            {/* STEP 1 — Symptom selection */}
            {step === 1 && (
              <>
                <Text style={styles.question}>Quel type de problème rencontrez-vous ?</Text>
                <View style={styles.pillGrid}>
                  {SYMPTOMS.map((s) => {
                    const sel = selectedSymptomId === s.id;
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => setSelectedSymptomId(s.id)}
                        style={[styles.symptomPill, sel && styles.symptomPillSelected]}
                      >
                        <Text style={styles.symptomEmoji}>{s.emoji}</Text>
                        <Text style={[styles.symptomLabel, sel && styles.symptomLabelSelected]}>
                          {s.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {/* STEP 2 — Severity */}
            {step === 2 && (
              <>
                <Text style={styles.question}>À quel point cela affecte-t-il votre utilisation ?</Text>
                {SEVERITIES.map((sv) => {
                  const sel = selectedSeverityId === sv.id;
                  return (
                    <Pressable
                      key={sv.id}
                      onPress={() => setSelectedSeverityId(sv.id)}
                      style={[
                        styles.severityCard,
                        { borderLeftColor: sv.color },
                        sel && styles.severityCardSelected,
                      ]}
                    >
                      <View style={[styles.severityDot, { backgroundColor: sv.color }]} />
                      <View style={styles.severityTextWrap}>
                        <Text style={[styles.severityLabel, sel && styles.severityLabelSelected]}>
                          {sv.label}
                        </Text>
                        <Text style={styles.severityDesc}>{sv.desc}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </>
            )}
          </ScrollView>

          {/* CTA */}
          <View style={styles.ctaBar}>
            <PrimaryButton label="Continuer" onPress={handleNext} fullWidth disabled={!isNextEnabled} />
          </View>
        </Animated.View>
      ) : (
        /* ── Result ───────────────────────────────────────────────────────── */
        <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[styles.resultCard, { opacity: resultOpacity, transform: [{ translateY: resultY }] }]}
          >
            <View style={styles.resultIconWrap}>
              <Feather name="check-circle" size={44} color={Colors.repairTeal} />
            </View>

            <Text style={styles.resultLabel}>{result?.label}</Text>

            <View style={styles.resultMeta}>
              <View style={styles.resultMetaItem}>
                <Text style={styles.resultMetaKey}>ESTIMATION</Text>
                <Text style={styles.resultPrice}>{result?.priceRange}</Text>
              </View>
              <View style={styles.resultMetaDivider} />
              <View style={styles.resultMetaItem}>
                <Text style={styles.resultMetaKey}>DURÉE</Text>
                <Text style={styles.resultDuration}>{result?.duration}</Text>
              </View>
            </View>

            <View style={styles.resultUrgencyRow}>
              <Text style={styles.resultMetaKey}>URGENCE</Text>
              <StatusBadge status={result?.urgency ?? 'bon'} />
            </View>
          </Animated.View>

          <View style={styles.resultActions}>
            <PrimaryButton
              label="Voir les réparateurs disponibles"
              fullWidth
              onPress={() => {
                const device = mockDevices.find((d) => d.id === selectedDeviceId);
                if (!device || !result) return;
                navigation.navigate('Repairers', {
                  deviceName: device.name,
                  deviceModel: device.model,
                  issueLabel: result.label,
                  priceRange: result.priceRange,
                  urgency: result.urgency,
                });
              }}
            />
            <OutlineButton label="Ajouter au passeport" fullWidth />
          </View>

          <Pressable onPress={handleReset} style={styles.restartBtn} hitSlop={8}>
            <Text style={styles.restartLabel}>Recommencer le diagnostic</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cleanWhite,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  backBtn: {
    marginTop: 4,
    padding: 4,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.graphite,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.steelGrey,
  },

  // Progress
  progressTrack: {
    height: 4,
    backgroundColor: Colors.borderMist,
    marginHorizontal: 20,
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.repairTeal,
    borderRadius: 2,
  },

  // Step wrapper (animated slide container)
  stepWrapper: {
    flex: 1,
  },
  stepScroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  question: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.graphite,
    marginBottom: 20,
    lineHeight: 26,
  },

  // CTA bar
  ctaBar: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderMist,
    backgroundColor: Colors.cleanWhite,
  },

  // Selectable device row
  selectableDevice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.paperSage,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
    padding: 16,
    marginBottom: 10,
  },
  selectableDeviceSelected: {
    borderColor: Colors.repairTeal,
    backgroundColor: '#E7F8F5',
  },
  selectableLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  selectableInfo: {
    gap: 2,
  },
  selectableName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.graphite,
  },
  selectableModel: {
    fontSize: 12,
    color: Colors.steelGrey,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.borderMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.repairTeal,
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.repairTeal,
  },

  // Symptom pills grid
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  symptomPill: {
    width: '47%',
    backgroundColor: Colors.paperSage,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
    padding: 14,
    gap: 8,
    alignItems: 'flex-start',
  },
  symptomPillSelected: {
    borderColor: Colors.repairTeal,
    backgroundColor: '#E7F8F5',
  },
  symptomEmoji: {
    fontSize: 22,
  },
  symptomLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.graphite,
    lineHeight: 18,
  },
  symptomLabelSelected: {
    color: Colors.repairTeal,
  },

  // Severity cards
  severityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.paperSage,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 10,
    gap: 14,
  },
  severityCardSelected: {
    backgroundColor: Colors.cleanWhite,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  severityTextWrap: {
    gap: 3,
  },
  severityLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.graphite,
  },
  severityLabelSelected: {
    color: Colors.objectNavy,
  },
  severityDesc: {
    fontSize: 13,
    color: Colors.steelGrey,
  },

  // Result
  resultScroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  resultCard: {
    backgroundColor: Colors.paperSage,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderMist,
    padding: 24,
    gap: 20,
  },
  resultIconWrap: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E7F8F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.graphite,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cleanWhite,
    borderRadius: 12,
    padding: 16,
  },
  resultMetaItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  resultMetaKey: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.steelGrey,
    letterSpacing: 1,
  },
  resultPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.repairTeal,
    letterSpacing: -0.5,
  },
  resultDuration: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.graphite,
  },
  resultMetaDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.borderMist,
  },
  resultUrgencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  resultActions: {
    gap: 10,
    marginTop: 4,
  },
  restartBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  restartLabel: {
    fontSize: 13,
    color: Colors.steelGrey,
    textDecorationLine: 'underline',
  },
});
