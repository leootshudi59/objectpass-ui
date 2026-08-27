import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, type NavigationProp, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/types';
import { Colors } from '../constants/colors';
import { formatDate } from '../constants/deviceForm';
import { getOwnership, maskSerial, OWNERSHIP_STATUS_CONFIG } from '../constants/ownership';
import { HealthScoreBadge, OutlineButton, PrimaryButton, SectionHeader } from '../components/ui';
import { useDevices } from '../context/DevicesContext';
import { useToast } from '../context/ToastContext';
import type { DeviceOwnership, TransferHistoryItem, TransferMethod } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateTransferCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `OP-${part()}-${part()}`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

const TRANSFER_METHODS: { id: TransferMethod; label: string; description: string; icon: string }[] = [
  { id: 'email', label: 'Email', description: 'Envoyer une invitation par email', icon: 'mail' },
  { id: 'qr', label: 'QR code', description: 'Faire scanner un code en personne', icon: 'grid' },
  { id: 'link', label: 'Lien sécurisé', description: 'Partager un lien de transfert unique', icon: 'link' },
];

const ALWAYS_SHARED = [
  'Historique des réparations certifiées',
  'Garanties actives',
  'Certificats de réparation',
  'Score ObjectPass',
];

interface OptionalItem {
  key: 'invoice' | 'photos' | 'diagnostics';
  label: string;
}

const OPTIONAL_SHARED: OptionalItem[] = [
  { key: 'invoice', label: "Facture d'achat" },
  { key: 'photos', label: 'Photos avant / après' },
  { key: 'diagnostics', label: 'Anciens diagnostics' },
];

const NEVER_SHARED = [
  "Prix d'achat",
  'Nom et email du précédent propriétaire',
  'Notes privées',
];

// ── Component ──────────────────────────────────────────────────────────────────

export function TransferOwnershipScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'TransferOwnership'>>();
  const { deviceId } = route.params;
  const { devices, updateDevice } = useDevices();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const device = devices.find((d) => d.id === deviceId);

  const [method, setMethod] = useState<TransferMethod>('email');
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [optional, setOptional] = useState<Record<OptionalItem['key'], boolean>>({
    invoice: false,
    photos: false,
    diagnostics: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  if (!device) return null;

  const ownership = getOwnership(device);
  const isPending = ownership.status === 'pending_sent';
  const isTransferred = ownership.status === 'transferred';
  const ownershipCfg = OWNERSHIP_STATUS_CONFIG[ownership.status];

  const activeWarranties = device.warrantyActive ? 1 : 0;
  const certifiedRepairs = device.repairs.filter((r) => r.certified).length;

  const emailInvalid = method === 'email' && emailTouched && !isValidEmail(email);
  const canGenerate = method !== 'email' || isValidEmail(email);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleGenerate = () => {
    if (method === 'email') {
      setEmailTouched(true);
      if (!isValidEmail(email)) return;
    }
    setIsGenerating(true);

    setTimeout(() => {
      const code = generateTransferCode();
      const historyItem: TransferHistoryItem = {
        id: `th_${Date.now()}`,
        event: 'sent',
        date: formatDate(new Date()),
        from: ownership.currentOwner,
        to: method === 'email' ? email.trim() : undefined,
        method,
      };
      const newOwnership: DeviceOwnership = {
        ...ownership,
        status: 'pending_sent',
        pendingRecipient: method === 'email' ? email.trim() : undefined,
        transferCode: code,
        history: [...ownership.history, historyItem],
      };
      updateDevice(device.id, { ownership: newOwnership });
      setIsGenerating(false);
      showToast('✓ Invitation de transfert générée', 'success');
    }, 900);
  };

  const handleCopyCode = () => {
    showToast('✓ Code copié dans le presse-papiers', 'success');
  };

  const handleCopyLink = () => {
    showToast('✓ Lien copié dans le presse-papiers', 'success');
  };

  const handleSimulateAcceptance = () => {
    const buyerLabel = ownership.pendingRecipient ?? 'Nouvel acquéreur';
    const historyItem: TransferHistoryItem = {
      id: `th_${Date.now()}`,
      event: 'completed',
      date: formatDate(new Date()),
      from: ownership.currentOwner,
      to: buyerLabel,
      method: ownership.history[ownership.history.length - 1]?.method ?? method,
    };
    const newOwnership: DeviceOwnership = {
      ...ownership,
      status: 'transferred',
      currentOwner: buyerLabel,
      pendingRecipient: undefined,
      history: [...ownership.history, historyItem],
    };
    updateDevice(device.id, { ownership: newOwnership });
    showToast('✓ Transfert terminé', 'success');
    navigation.navigate('Tabs', { screen: 'Accueil' });
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 + (insets.bottom || 0) }}
      >
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <View style={styles.heroOverlay} pointerEvents="none" />
          <TouchableOpacity
            style={styles.heroBack}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={22} color={Colors.cleanWhite} />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Transférer cet ObjectPass</Text>
          <Text style={styles.heroSubtitle}>
            Transmettez l'historique vérifié de {device.name} à son nouveau propriétaire, en toute confiance.
          </Text>
        </View>

        {isTransferred ? (
          <View style={styles.sectionHead}>
            <View style={[styles.card, styles.doneCard]}>
              <Feather name="check-circle" size={28} color={Colors.warrantyGreen} />
              <Text style={styles.doneTitle}>Cet appareil a déjà été transféré</Text>
              <Text style={styles.doneText}>Propriétaire actuel : {ownership.currentOwner}</Text>
            </View>
          </View>
        ) : isPending ? (
          <>
            {/* ── Confirmation state ────────────────────────────────────── */}
            <View style={styles.sectionHead}>
              <SectionHeader title="Invitation générée" />
            </View>
            <View style={styles.card}>
              <View style={[styles.statusBadge, { backgroundColor: ownershipCfg.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: ownershipCfg.color }]} />
                <Text style={[styles.statusBadgeText, { color: ownershipCfg.color }]}>
                  {ownershipCfg.label}
                </Text>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>CODE DE TRANSFERT</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{ownership.transferCode}</Text>
                <Pressable onPress={handleCopyCode} hitSlop={10}>
                  <Feather name="copy" size={18} color={Colors.repairTeal} />
                </Pressable>
              </View>

              {ownership.pendingRecipient && (
                <Text style={styles.recipientText}>Envoyé à {ownership.pendingRecipient}</Text>
              )}

              <View style={styles.qrZone}>
                <Feather name="grid" size={56} color={Colors.steelGrey} />
                <Text style={styles.qrText}>QR Code{'\n'}{ownership.transferCode}</Text>
              </View>

              <View style={{ marginTop: 16 }}>
                <OutlineButton label="Copier le lien" onPress={handleCopyLink} fullWidth />
              </View>
            </View>

            <View style={styles.sectionHead}>
              <SectionHeader title="Zone démo" />
            </View>
            <View style={[styles.card, styles.demoCard]}>
              <Text style={styles.demoText}>
                Cette action simule l'étape côté acheteur. En production, le transfert se
                finalise uniquement lorsque le nouveau propriétaire accepte l'invitation.
              </Text>
              <View style={{ marginTop: 12 }}>
                <PrimaryButton
                  label="Simuler l'acceptation par l'acheteur"
                  onPress={handleSimulateAcceptance}
                  fullWidth
                />
              </View>
            </View>
          </>
        ) : (
          <>
            {/* ── Device recap ──────────────────────────────────────────── */}
            <View style={styles.sectionHead}>
              <SectionHeader title="Appareil concerné" />
            </View>
            <View style={styles.card}>
              <View style={styles.recapRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recapName}>{device.name}</Text>
                  <Text style={styles.recapSerial}>S/N : {maskSerial(device.serialNumber)}</Text>
                  <View style={styles.recapMetaRow}>
                    <Text style={styles.recapMeta}>
                      {activeWarranties} garantie{activeWarranties > 1 ? 's' : ''} active
                      {activeWarranties > 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.recapMetaDot}>·</Text>
                    <Text style={styles.recapMeta}>
                      {certifiedRepairs} réparation{certifiedRepairs > 1 ? 's' : ''} certifiée
                      {certifiedRepairs > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <HealthScoreBadge score={device.healthScore} size="medium" />
              </View>
            </View>

            {/* ── Transfer method ───────────────────────────────────────── */}
            <View style={styles.sectionHead}>
              <SectionHeader title="Méthode de transfert" />
            </View>
            <View style={styles.card}>
              {TRANSFER_METHODS.map((m) => {
                const active = method === m.id;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => setMethod(m.id)}
                    style={[styles.methodRow, active && styles.methodRowActive]}
                  >
                    <View style={[styles.methodIcon, active && styles.methodIconActive]}>
                      <Feather
                        name={m.icon as any}
                        size={18}
                        color={active ? Colors.cleanWhite : Colors.objectNavy}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.methodLabel, active && styles.methodLabelActive]}>
                        {m.label}
                      </Text>
                      <Text style={styles.methodDesc}>{m.description}</Text>
                    </View>
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active && <View style={styles.radioDot} />}
                    </View>
                  </Pressable>
                );
              })}

              {method === 'email' && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.fieldLabel}>EMAIL DU DESTINATAIRE</Text>
                  <TextInput
                    style={[styles.textInput, emailInvalid && styles.textInputError]}
                    value={email}
                    onChangeText={setEmail}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="acheteur@email.com"
                    placeholderTextColor={Colors.steelGrey}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                  />
                  {emailInvalid && <Text style={styles.inlineError}>Adresse email invalide</Text>}
                </View>
              )}
            </View>

            {/* ── Shared data ────────────────────────────────────────────── */}
            <View style={styles.sectionHead}>
              <SectionHeader title="Données partagées" />
            </View>
            <View style={styles.card}>
              <Text style={styles.groupLabel}>TOUJOURS TRANSFÉRÉ</Text>
              {ALWAYS_SHARED.map((item) => (
                <View key={item} style={styles.dataRow}>
                  <View style={styles.checkLocked}>
                    <Feather name="check" size={12} color={Colors.cleanWhite} />
                  </View>
                  <Text style={[styles.dataLabel, { flex: 1 }]}>{item}</Text>
                  <Feather name="lock" size={12} color={Colors.steelGrey} />
                </View>
              ))}

              <View style={styles.groupDivider} />

              <Text style={styles.groupLabel}>OPTIONNEL — À VOUS DE CHOISIR</Text>
              {OPTIONAL_SHARED.map((item) => (
                <View key={item.key} style={styles.dataRow}>
                  <Text style={[styles.dataLabel, { flex: 1 }]}>{item.label}</Text>
                  <Switch
                    value={optional[item.key]}
                    onValueChange={(v) => setOptional((prev) => ({ ...prev, [item.key]: v }))}
                    trackColor={{ false: Colors.borderMist, true: Colors.repairTeal }}
                    thumbColor={Colors.cleanWhite}
                    ios_backgroundColor={Colors.borderMist}
                  />
                </View>
              ))}

              <View style={styles.groupDivider} />

              <Text style={styles.groupLabel}>JAMAIS TRANSFÉRÉ</Text>
              {NEVER_SHARED.map((item) => (
                <View key={item} style={styles.dataRow}>
                  <Feather name="x" size={14} color={Colors.faultCoral} />
                  <Text style={[styles.dataLabel, styles.dataLabelExcluded]}>{item}</Text>
                </View>
              ))}
            </View>

            {/* ── Warning ────────────────────────────────────────────────── */}
            <View style={styles.sectionHead}>
              <SectionHeader title="À savoir" />
            </View>
            <View style={[styles.card, styles.warningCard]}>
              <Feather name="alert-triangle" size={18} color={Colors.diagnosticAmber} />
              <Text style={styles.warningText}>
                Après acceptation, {device.name} sera rattaché au compte du nouveau propriétaire.
                Vous conserverez un accès en lecture limité à son historique certifié.
              </Text>
            </View>

            {/* ── CTA ────────────────────────────────────────────────────── */}
            <View style={styles.ctaWrapper}>
              <PrimaryButton
                label={isGenerating ? 'Génération…' : "Générer l'invitation de transfert"}
                onPress={handleGenerate}
                disabled={!canGenerate || isGenerating}
                fullWidth
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.cleanWhite },

  // Hero
  hero: {
    backgroundColor: Colors.objectNavy,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#123D45',
    opacity: 0.18,
  },
  heroBack: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.cleanWhite,
    marginTop: 16,
  },
  heroSubtitle: {
    fontSize: 13,
    color: Colors.steelGrey,
    marginTop: 6,
    lineHeight: 19,
    maxWidth: '92%',
  },

  // Section / card
  sectionHead: { marginTop: 28, paddingHorizontal: 20 },
  card: {
    backgroundColor: Colors.paperSage,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 8,
  },

  // Done (already transferred)
  doneCard: { alignItems: 'center', gap: 6, paddingVertical: 28 },
  doneTitle: { fontSize: 16, fontWeight: '700', color: Colors.graphite, marginTop: 8 },
  doneText: { fontSize: 13, color: Colors.steelGrey },

  // Field label / input (shared visual language with EditDeviceScreen)
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.steelGrey,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  textInput: {
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.graphite,
    backgroundColor: Colors.cleanWhite,
  },
  textInputError: { borderColor: Colors.faultCoral },
  inlineError: { fontSize: 12, color: Colors.faultCoral, marginTop: 4 },

  // Device recap
  recapRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recapName: { fontSize: 16, fontWeight: '700', color: Colors.graphite },
  recapSerial: { fontSize: 12, color: Colors.steelGrey, fontFamily: 'monospace', marginTop: 4 },
  recapMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  recapMeta: { fontSize: 12, color: Colors.steelGrey },
  recapMetaDot: { fontSize: 12, color: Colors.steelGrey },

  // Transfer method
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.cleanWhite,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  methodRowActive: { borderColor: Colors.objectNavy },
  methodIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.paperSage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIconActive: { backgroundColor: Colors.objectNavy },
  methodLabel: { fontSize: 14, fontWeight: '600', color: Colors.graphite },
  methodLabelActive: { color: Colors.objectNavy },
  methodDesc: { fontSize: 12, color: Colors.steelGrey, marginTop: 2 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.objectNavy },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.objectNavy },

  // Shared data groups
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.steelGrey,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  checkLocked: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: Colors.warrantyGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataLabel: { fontSize: 13, color: Colors.graphite },
  dataLabelExcluded: { color: Colors.steelGrey, textDecorationLine: 'line-through' },
  groupDivider: { height: 1, backgroundColor: Colors.borderMist, marginVertical: 12 },

  // Warning
  warningCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FEF6E4',
    borderWidth: 1.5,
    borderColor: Colors.diagnosticAmber,
    alignItems: 'flex-start',
  },
  warningText: { flex: 1, fontSize: 13, color: Colors.graphite, lineHeight: 19 },

  // CTA
  ctaWrapper: { marginHorizontal: 20, marginTop: 28 },

  // Confirmation state
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.repairTeal,
    backgroundColor: Colors.cleanWhite,
    paddingHorizontal: 16,
  },
  codeText: { fontSize: 18, fontWeight: '700', letterSpacing: 1.5, color: Colors.graphite, fontFamily: 'monospace' },
  recipientText: { fontSize: 12, color: Colors.steelGrey, marginTop: 8 },
  qrZone: {
    width: 180,
    height: 180,
    alignSelf: 'center',
    backgroundColor: Colors.cleanWhite,
    borderRadius: 16,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  qrText: { fontSize: 11, fontFamily: 'monospace', color: Colors.steelGrey, textAlign: 'center' },

  // Demo card
  demoCard: { backgroundColor: '#EEF1FF', borderWidth: 1.5, borderColor: 'rgba(36,95,255,0.2)' },
  demoText: { fontSize: 12, color: Colors.graphite, lineHeight: 18, fontStyle: 'italic' },
});
