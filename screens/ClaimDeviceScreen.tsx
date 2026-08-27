import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, type NavigationProp, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/types';
import { Colors } from '../constants/colors';
import { formatDate } from '../constants/deviceForm';
import { DatePickerModal } from '../components/form/DatePickerModal';
import {
  buildClaimAcceptance,
  buildClaimDecline,
  findPendingClaimFor,
  getOwnership,
  maskSerial,
  OWNERSHIP_STATUS_CONFIG,
} from '../constants/ownership';
import { HealthScoreBadge, OutlineButton, PrimaryButton, SectionHeader } from '../components/ui';
import { useDevices } from '../context/DevicesContext';
import { useToast } from '../context/ToastContext';
import type { DeviceEntry, TransferHistoryItem } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  laptop: '💻',
  phone: '📱',
  tablet: '📱',
  ebike: '🚲',
  other: '📦',
};

interface EvidenceItem {
  key: 'photo' | 'proof' | 'listing' | 'invoice';
  icon: string;
  label: string;
  sub: string;
}

const EVIDENCE_ITEMS: EvidenceItem[] = [
  { key: 'photo',   icon: '📷', label: "Photo de l'appareil",              sub: 'Aide à confirmer que vous le possédez' },
  { key: 'proof',   icon: '🧾', label: "Preuve d'achat",                   sub: 'Ticket de caisse, virement, etc.' },
  { key: 'listing', icon: '🖼️', label: "Capture de l'annonce",             sub: 'Si acheté sur une plateforme de revente' },
  { key: 'invoice', icon: '📄', label: "Facture de revente",                sub: "Émise par le vendeur précédent" },
];

// ── Component ──────────────────────────────────────────────────────────────────

export function ClaimDeviceScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ClaimDevice'>>();
  const { deviceId } = route.params;
  const { devices, addDevice, updateDevice, removeDevice } = useDevices();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [evidence, setEvidence] = useState<Record<EvidenceItem['key'], boolean>>({
    photo: false,
    proof: false,
    listing: false,
    invoice: false,
  });
  const [transferCode, setTransferCode] = useState('');
  const [purchaseDate, setPurchaseDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const source = devices.find((d) => d.id === deviceId);
  if (!source) return null;

  const sourceOwnership = getOwnership(source);
  const pendingClaim = findPendingClaimFor(devices, source);

  // Screen state is derived from the source device's ownership status so it
  // survives navigation, app reload, or the seller resolving the claim from
  // DeviceDetailScreen / EditDeviceScreen instead of from this screen.
  const screenState: 'form' | 'waiting' | 'declined' | 'resolved' =
    sourceOwnership.status === 'claim_received' && pendingClaim
      ? 'waiting'
      : sourceOwnership.status === 'disputed'
      ? 'declined'
      : sourceOwnership.status === 'transferred'
      ? 'resolved'
      : 'form';

  const certifiedRepairs = source.repairs.filter((r) => r.certified).length;
  const activeWarranties = source.warrantyActive ? 1 : 0;
  const catEmoji = CATEGORY_EMOJI[source.category] ?? '📦';

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const toggleEvidence = (key: EvidenceItem['key']) => {
    if (evidence[key]) {
      setEvidence((prev) => ({ ...prev, [key]: false }));
      return;
    }
    Alert.alert('Ajouter un justificatif', undefined, [
      { text: 'Prendre une photo',       onPress: () => setEvidence((prev) => ({ ...prev, [key]: true })) },
      { text: 'Choisir dans la galerie', onPress: () => setEvidence((prev) => ({ ...prev, [key]: true })) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const handleSend = () => {
    if (isSending) return;
    setIsSending(true);

    setTimeout(async () => {
      const now = new Date();
      const sentEntry: TransferHistoryItem = {
        id: `th_${Date.now()}`,
        event: 'sent',
        date: formatDate(now),
        from: sourceOwnership.currentOwner,
        to: 'Vous',
        method: 'claim',
      };
      const receivedEntry: TransferHistoryItem = {
        id: `th_${Date.now() + 1}`,
        event: 'received',
        date: formatDate(now),
        from: 'Un acheteur potentiel',
        to: sourceOwnership.currentOwner,
        method: 'claim',
      };

      // Buyer's own private tracking record — hidden from the active list
      // (isDeviceActive excludes ownership.status === 'claim_sent') until the
      // previous owner accepts. The previous owner's private data (purchase
      // price, place, invoice, color) is intentionally left out of the clone.
      const claimDevice: DeviceEntry = {
        id: `claim_${Date.now()}`,
        name: source.name,
        model: source.model,
        category: source.category,
        healthScore: source.healthScore,
        status: source.status,
        lastRepairDate: source.lastRepairDate,
        warrantyActive: source.warrantyActive,
        warrantyExpiry: source.warrantyExpiry,
        repairs: source.repairs,
        battery: source.battery,
        screen: source.screen,
        storage: source.storage,
        serialNumber: source.serialNumber,
        createdAt: now.toISOString(),
        ownership: { currentOwner: 'Vous', status: 'claim_sent', history: [sentEntry] },
      };

      await addDevice(claimDevice);
      await updateDevice(source.id, {
        ownership: { ...sourceOwnership, status: 'claim_received', history: [...sourceOwnership.history, receivedEntry] },
      });

      setIsSending(false);
      showToast('✓ Demande de transfert envoyée', 'success');
    }, 900);
  };

  const handleSimulateAcceptance = async () => {
    const claim = pendingClaim;
    if (!claim) return;
    const { sourceOwnership: newSource, claimOwnership: newClaim } = buildClaimAcceptance(source, claim);
    await updateDevice(source.id, { ownership: newSource });
    await updateDevice(claim.id, { ownership: newClaim });
    showToast('✓ Transfert terminé — appareil ajouté à votre ObjectPass', 'success');
    navigation.navigate('Tabs', { screen: 'Accueil' });
  };

  const handleSimulateDecline = async () => {
    await updateDevice(source.id, { ownership: buildClaimDecline(source) });
    if (pendingClaim) await removeDevice(pendingClaim.id);
    showToast('Revendication refusée', 'info');
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
          <Text style={styles.heroTitle}>Revendiquer cet ObjectPass</Text>
          <Text style={styles.heroSubtitle}>
            Demandez à l'ancien propriétaire de {source.name} de vous en transférer la propriété.
          </Text>
        </View>

        {screenState === 'resolved' ? (
          <View style={styles.sectionHead}>
            <View style={[styles.card, styles.doneCard]}>
              <Feather name="check-circle" size={28} color={Colors.warrantyGreen} />
              <Text style={styles.doneTitle}>Ce transfert est déjà finalisé</Text>
              <Text style={styles.doneText}>Propriétaire actuel : {sourceOwnership.currentOwner}</Text>
            </View>
          </View>
        ) : screenState === 'declined' ? (
          <View style={styles.sectionHead}>
            <View style={[styles.card, styles.declinedCard]}>
              <Feather name="x-circle" size={28} color={Colors.faultCoral} />
              <Text style={styles.doneTitle}>Demande refusée</Text>
              <Text style={styles.doneText}>
                L'ancien propriétaire de {source.name} n'a pas confirmé la vente. Vous pouvez le
                recontacter en dehors de l'application pour clarifier la situation.
              </Text>
              <View style={{ marginTop: 16, width: '100%' }}>
                <OutlineButton
                  label="Retour à l'accueil"
                  onPress={() => navigation.navigate('Tabs', { screen: 'Accueil' })}
                  fullWidth
                />
              </View>
            </View>
          </View>
        ) : screenState === 'waiting' ? (
          <>
            <View style={styles.sectionHead}>
              <SectionHeader title="Revendication en cours" />
            </View>
            <View style={styles.card}>
              <View style={[styles.statusBadge, { backgroundColor: OWNERSHIP_STATUS_CONFIG.claim_sent.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: OWNERSHIP_STATUS_CONFIG.claim_sent.color }]} />
                <Text style={[styles.statusBadgeText, { color: OWNERSHIP_STATUS_CONFIG.claim_sent.color }]}>
                  Revendication envoyée
                </Text>
              </View>
              <Text style={[styles.waitingTitle, { marginTop: 16 }]}>
                Demande envoyée — En attente de confirmation de l'ancien propriétaire
              </Text>
              <Text style={styles.waitingText}>
                Dès que l'ancien propriétaire confirme la vente, {source.name} et tout son
                historique certifié apparaîtront dans votre ObjectPass.
              </Text>
            </View>

            <View style={styles.sectionHead}>
              <SectionHeader title="Zone démo" />
            </View>
            <View style={[styles.card, styles.demoCard]}>
              <Text style={styles.demoText}>
                Ces actions simulent la réponse de l'ancien propriétaire (normalement accessible
                depuis sa fiche appareil). En production, seul lui peut accepter ou refuser.
              </Text>
              <View style={{ marginTop: 12, gap: 10 }}>
                <PrimaryButton
                  label="Simuler l'acceptation par le vendeur"
                  onPress={handleSimulateAcceptance}
                  fullWidth
                />
                <OutlineButton label="Simuler le refus" onPress={handleSimulateDecline} fullWidth />
              </View>
            </View>
          </>
        ) : (
          <>
            {/* ── Detected device recap ─────────────────────────────────── */}
            <View style={styles.sectionHead}>
              <SectionHeader title="Appareil concerné" />
            </View>
            <View style={styles.card}>
              <View style={styles.recapRow}>
                <View style={styles.recapPhoto}>
                  <Text style={styles.recapPhotoEmoji}>{catEmoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recapName}>{source.name}</Text>
                  <Text style={styles.recapSerial}>S/N : {maskSerial(source.serialNumber)}</Text>
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
                <HealthScoreBadge score={source.healthScore} size="medium" />
              </View>
            </View>

            {/* ── What you'll get ───────────────────────────────────────── */}
            <View style={styles.sectionHead}>
              <SectionHeader title="Ce que vous recevrez" />
            </View>
            <View style={styles.card}>
              {[
                'Historique des réparations certifiées',
                'Garanties actives',
                'Certificats de réparation',
                'Score ObjectPass',
              ].map((item) => (
                <View key={item} style={styles.dataRow}>
                  <View style={styles.checkDot}>
                    <Feather name="check" size={12} color={Colors.cleanWhite} />
                  </View>
                  <Text style={styles.dataLabel}>{item}</Text>
                </View>
              ))}
              <View style={styles.groupDivider} />
              <Text style={styles.privacyNote}>
                Les données privées de l'ancien propriétaire (prix d'achat, coordonnées) ne vous
                seront jamais transmises.
              </Text>
            </View>

            {/* ── Evidence ───────────────────────────────────────────────── */}
            <View style={styles.sectionHead}>
              <SectionHeader title="Justificatifs (optionnel)" />
            </View>
            <View style={styles.card}>
              <Text style={styles.evidenceIntro}>
                Ces éléments aident l'ancien propriétaire à confirmer la vente rapidement.
              </Text>

              {EVIDENCE_ITEMS.map((item) => {
                const active = evidence[item.key];
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => toggleEvidence(item.key)}
                    style={[styles.evidenceRow, active && styles.evidenceRowActive]}
                  >
                    <Text style={styles.evidenceIcon}>{item.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.evidenceLabel}>{item.label}</Text>
                      <Text style={styles.evidenceSub}>{active ? 'Ajouté' : item.sub}</Text>
                    </View>
                    <Feather
                      name={active ? 'check-circle' : 'plus-circle'}
                      size={20}
                      color={active ? Colors.repairTeal : Colors.steelGrey}
                    />
                  </Pressable>
                );
              })}

              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>CODE DE TRANSFERT REÇU DU VENDEUR</Text>
              <TextInput
                style={styles.textInput}
                value={transferCode}
                onChangeText={setTransferCode}
                placeholder="Ex : OP-AB12-CD34"
                placeholderTextColor={Colors.steelGrey}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
              />

              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>DATE D'ACHAT (OPTIONNEL)</Text>
              <Pressable style={styles.dateField} onPress={() => setShowDatePicker(true)}>
                <Text style={[styles.dateFieldText, !purchaseDate && { color: Colors.steelGrey }]}>
                  {purchaseDate ? formatDate(purchaseDate) : 'Sélectionner une date'}
                </Text>
                <Feather name="calendar" size={16} color={Colors.steelGrey} />
              </Pressable>
            </View>

            {/* ── CTA ────────────────────────────────────────────────────── */}
            <View style={styles.ctaWrapper}>
              <PrimaryButton
                label={isSending ? 'Envoi en cours…' : 'Envoyer la demande'}
                onPress={handleSend}
                disabled={isSending}
                fullWidth
              />
            </View>
          </>
        )}
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        value={purchaseDate}
        onChange={setPurchaseDate}
        onClose={() => setShowDatePicker(false)}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.cleanWhite },

  hero: {
    backgroundColor: Colors.objectNavy,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#123D45', opacity: 0.18 },
  heroBack: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: Colors.cleanWhite, marginTop: 16 },
  heroSubtitle: { fontSize: 13, color: Colors.steelGrey, marginTop: 6, lineHeight: 19, maxWidth: '92%' },

  sectionHead: { marginTop: 28, paddingHorizontal: 20 },
  card: {
    backgroundColor: Colors.paperSage,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 8,
  },

  doneCard: { alignItems: 'center', gap: 6, paddingVertical: 28 },
  declinedCard: { alignItems: 'center', gap: 6, paddingVertical: 28, paddingHorizontal: 20 },
  doneTitle: { fontSize: 16, fontWeight: '700', color: Colors.graphite, marginTop: 8, textAlign: 'center' },
  doneText: { fontSize: 13, color: Colors.steelGrey, textAlign: 'center', lineHeight: 19 },

  recapRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recapPhoto: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.cleanWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recapPhotoEmoji: { fontSize: 26 },
  recapName: { fontSize: 16, fontWeight: '700', color: Colors.graphite },
  recapSerial: { fontSize: 12, color: Colors.steelGrey, fontFamily: 'monospace', marginTop: 4 },
  recapMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  recapMeta: { fontSize: 12, color: Colors.steelGrey },
  recapMetaDot: { fontSize: 12, color: Colors.steelGrey },

  dataRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  checkDot: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: Colors.warrantyGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataLabel: { fontSize: 13, color: Colors.graphite, flex: 1 },
  groupDivider: { height: 1, backgroundColor: Colors.borderMist, marginVertical: 12 },
  privacyNote: { fontSize: 12, color: Colors.steelGrey, lineHeight: 18, fontStyle: 'italic' },

  evidenceIntro: { fontSize: 12, color: Colors.steelGrey, lineHeight: 18, marginBottom: 12 },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.cleanWhite,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  evidenceRowActive: { borderColor: Colors.repairTeal },
  evidenceIcon: { fontSize: 22 },
  evidenceLabel: { fontSize: 14, fontWeight: '600', color: Colors.graphite },
  evidenceSub: { fontSize: 12, color: Colors.steelGrey, marginTop: 2 },

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
    fontFamily: 'monospace',
  },
  dateField: {
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cleanWhite,
  },
  dateFieldText: { fontSize: 15, color: Colors.graphite },

  ctaWrapper: { marginHorizontal: 20, marginTop: 28 },

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
  waitingTitle: { fontSize: 15, fontWeight: '700', color: Colors.graphite, lineHeight: 21 },
  waitingText: { fontSize: 13, color: Colors.steelGrey, lineHeight: 19, marginTop: 8 },

  demoCard: { backgroundColor: '#EEF1FF', borderWidth: 1.5, borderColor: 'rgba(36,95,255,0.2)' },
  demoText: { fontSize: 12, color: Colors.graphite, lineHeight: 18, fontStyle: 'italic' },
});
