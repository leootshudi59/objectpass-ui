import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, type NavigationProp, type RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, healthColor } from '../constants/colors';
import { HealthScoreBadge, OutlineButton, PrimaryButton, SectionHeader } from '../components/ui';
import { useDevices } from '../context/DevicesContext';
import type { Certificate } from '../types';

// ── Category emoji ─────────────────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  laptop: '💻',
  phone: '📱',
  tablet: '📱',
  ebike: '🚲',
  other: '📦',
};

// ── Certificate mock data ──────────────────────────────────────────────────────

const CERTIFICATES: Record<string, Certificate> = {
  rep_001: {
    type: 'Remplacement batterie',
    date: '10 juin 2025',
    duration: '45 minutes',
    interventionType: 'En boutique',
    part: {
      name: 'Batterie MacBook Pro M1',
      quality: 'premium',
      reference: 'OEM-BAT-MBP2022',
    },
    warrantyMonths: 12,
    warrantyExpiry: '10 juin 2026',
    warrantyExpired: false,
    notes:
      'Batterie remplacée avec une pièce OEM certifiée Apple. Cycle count remis à zéro. Testé sous charge complète.',
    repairer: {
      name: 'Marc Delannoy',
      shop: 'iRepair Valenciennes',
      rating: 4.8,
      tags: ['Batterie', 'MacBook', 'iPhone'],
      memberSince: '2023',
      signatureHash: '0x3a7f...c4b2e1',
    },
    proof: {
      id: 'OP-2025-REP-C02XL-7F3A',
      issuedAt: '10 juin 2025 à 15h42',
      blockchainHash: '0x8f3a2c...d94e1b',
      network: 'Polygon · ObjectPass Layer',
      status: 'pending_anchor',
    },
  },
  rep_002: {
    type: 'Réparation écran',
    date: '5 novembre 2024',
    duration: '1h30',
    interventionType: 'En boutique',
    part: {
      name: 'Écran OLED iPhone 15 Pro',
      quality: 'standard',
      reference: 'SCR-IP15P-OLED-001',
    },
    warrantyMonths: 6,
    warrantyExpiry: '5 mai 2025',
    warrantyExpired: true,
    notes: 'Écran fissuré coin bas gauche remplacé. Calibration tactile effectuée.',
    repairer: {
      name: 'Sophie Marlier',
      shop: 'TechCare Cambrai',
      rating: 4.5,
      tags: ['Écran', 'Android', 'PC'],
      memberSince: '2023',
      signatureHash: '0x9c2d...a17f3e',
    },
    proof: {
      id: 'OP-2024-REP-IP15P-3B8C',
      issuedAt: '5 novembre 2024 à 11h15',
      blockchainHash: '0x4e1b9a...c23d7f',
      network: 'Polygon · ObjectPass Layer',
      status: 'anchored',
    },
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// ── QR pattern (8×8 simulated finder pattern) ─────────────────────────────────

const QR_PATTERN = [
  [1, 1, 1, 1, 1, 1, 1, 0],
  [1, 0, 0, 0, 0, 0, 1, 0],
  [1, 0, 1, 1, 1, 0, 1, 1],
  [1, 0, 1, 0, 1, 0, 1, 0],
  [1, 0, 1, 1, 1, 0, 1, 0],
  [1, 0, 0, 0, 0, 0, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 0, 1, 0, 1, 0, 1],
];

const CELL_SIZE = 18;

// ── Screen ─────────────────────────────────────────────────────────────────────

export function CertificateScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Certificate'>>();
  const { repairId } = route.params;
  const { devices } = useDevices();
  const insets = useSafeAreaInsets();

  const cert: Certificate | undefined = CERTIFICATES[repairId];
  const device = devices.find((d) =>
    d.repairs.some((r) => r.repairId === repairId)
  );

  // ── Animations
  const checkScale = useRef(new Animated.Value(0.5)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const secOp0 = useRef(new Animated.Value(0)).current;
  const secOp1 = useRef(new Animated.Value(0)).current;
  const secOp2 = useRef(new Animated.Value(0)).current;
  const secOp3 = useRef(new Animated.Value(0)).current;
  const secOp4 = useRef(new Animated.Value(0)).current;
  const secOp5 = useRef(new Animated.Value(0)).current;
  const sectionAnims = [secOp0, secOp1, secOp2, secOp3, secOp4, secOp5];
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // ── State
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    Animated.spring(checkScale, {
      toValue: 1,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 750, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 750, useNativeDriver: true }),
      ])
    ).start();

    Animated.stagger(
      80,
      sectionAnims.map((anim) =>
        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true })
      )
    ).start();
  }, []);

  if (!cert) return null;

  const isWarrantyActive = !cert.warrantyExpired;
  const deviceName = device?.name ?? 'cet appareil';
  const score = device?.healthScore ?? 0;
  const filledStars = Math.round(cert.repairer.rating);

  const handleCopyId = () => {
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyLink = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddToPassport = () => {
    setToastVisible(true);
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2400),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => navigation.goBack());
  };

  return (
    <View style={styles.screen}>
      {/* ── Top bar ───────────────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.topBarBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Preuve de réparation</Text>
        <TouchableOpacity
          style={styles.topBarBtn}
          onPress={() => Alert.alert('Partager la preuve', 'Bientôt disponible')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="share-2" size={20} color={Colors.repairTeal} />
        </TouchableOpacity>
      </View>

      {/* ── ScrollView ────────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + (insets.bottom || 0) }}
      >
        {/* ── Hero ────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.heroOverlay} pointerEvents="none" />

          <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
            <Feather name="check" size={40} color={Colors.cleanWhite} />
          </Animated.View>

          <Text style={styles.heroCertTitle}>Réparation certifiée</Text>
          <Text style={styles.heroCertSub}>Attestation signée et vérifiable</Text>

          <View style={styles.metaChipsRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>📅 {cert.date}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>⏱ {cert.duration}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>🛡️ Garantie {cert.warrantyMonths} mois</Text>
            </View>
          </View>
        </View>

        {/* ── Appareil ────────────────────────────────────────────── */}
        <Animated.View style={{ opacity: secOp0 }}>
          <View style={styles.sectionHead}>
            <SectionHeader title="Appareil" />
          </View>
          <View style={styles.card}>
            <View style={styles.deviceRow}>
              <View style={styles.devicePhotoZone}>
                <Text style={styles.deviceEmoji}>
                  {CATEGORY_EMOJI[device?.category ?? 'other']}
                </Text>
              </View>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{device?.name ?? '—'}</Text>
                <Text style={styles.deviceModel}>{device?.model ?? '—'}</Text>
                <Text style={styles.deviceSerial}>
                  S/N : {device?.serialNumber ?? '—'}
                </Text>
              </View>
            </View>
            <View style={styles.deviceScoreRow}>
              <HealthScoreBadge score={score} size="small" />
              <Text style={styles.deviceScoreLabel}>Score après intervention</Text>
              <Text style={[styles.deviceScoreValue, { color: healthColor(score) }]}>
                {score}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Intervention ────────────────────────────────────────── */}
        <Animated.View style={{ opacity: secOp1 }}>
          <View style={styles.sectionHead}>
            <SectionHeader title="Intervention" />
          </View>
          <View style={styles.card}>
            <View style={{ gap: 14 }}>
              {(
                [
                  { label: 'TYPE', value: cert.type },
                  { label: 'DATE', value: cert.date },
                  { label: 'DURÉE', value: cert.duration },
                  { label: "TYPE D'INTERVENTION", value: cert.interventionType },
                ] as { label: string; value: string }[]
              ).map((row) => (
                <View key={row.label} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue}>{row.value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.separator} />

            <Text style={styles.infoLabel}>PIÈCE(S) REMPLACÉE(S)</Text>
            <View style={styles.partCard}>
              <Text style={styles.partName}>{cert.part.name}</Text>
              <View style={styles.partMeta}>
                <View
                  style={[
                    styles.partQualityBadge,
                    cert.part.quality === 'premium'
                      ? styles.partQualityPremium
                      : styles.partQualityStandard,
                  ]}
                >
                  <Text
                    style={[
                      styles.partQualityText,
                      { color: cert.part.quality === 'premium' ? Colors.warrantyGreen : Colors.steelGrey },
                    ]}
                  >
                    {cert.part.quality === 'premium' ? 'Premium' : 'Standard'}
                  </Text>
                </View>
                <Text style={styles.partRef}>Référence : {cert.part.reference}</Text>
              </View>
            </View>

            {cert.notes ? (
              <>
                <View style={styles.separator} />
                <Text style={styles.infoLabel}>NOTES DU RÉPARATEUR</Text>
                <Text style={styles.notesText}>{cert.notes}</Text>
              </>
            ) : null}
          </View>
        </Animated.View>

        {/* ── Réparateur ──────────────────────────────────────────── */}
        <Animated.View style={{ opacity: secOp2 }}>
          <View style={styles.sectionHead}>
            <SectionHeader title="Réparateur" />
          </View>
          <View style={styles.card}>
            <View style={styles.repairerTop}>
              <View style={styles.repAvatar}>
                <Text style={styles.repAvatarText}>{getInitials(cert.repairer.name)}</Text>
              </View>
              <View style={styles.repInfo}>
                <Text style={styles.repName}>{cert.repairer.name}</Text>
                <Text style={styles.repShop}>{cert.repairer.shop}</Text>
                <Text style={styles.starsRow}>
                  <Text style={styles.starsFilled}>{'★'.repeat(filledStars)}</Text>
                  <Text style={styles.starsEmpty}>{'☆'.repeat(5 - filledStars)}</Text>
                  <Text style={styles.starsCount}>  {cert.repairer.rating}</Text>
                </Text>
              </View>
            </View>

            <View style={[styles.separator, { marginVertical: 12 }]} />

            <View style={styles.certRow}>
              <View style={styles.certOPBadge}>
                <Text style={styles.certOPBadgeText}>✓ Certifié ObjectPass</Text>
              </View>
              <Text style={styles.memberSince}>Membre depuis {cert.repairer.memberSince}</Text>
            </View>

            <View style={styles.tagsRow}>
              {cert.repairer.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.separator, { marginVertical: 12 }]} />

            <Text style={styles.sigLabel}>SIGNATURE NUMÉRIQUE</Text>
            <Text style={styles.sigHash}>{cert.repairer.signatureHash}</Text>
            <View style={styles.sigFooter}>
              <Feather name="lock" size={10} color={Colors.steelGrey} />
              <Text style={styles.sigFooterText}> Signature cryptographique du réparateur</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Preuve vérifiable ───────────────────────────────────── */}
        <Animated.View style={{ opacity: secOp3 }}>
          <View style={styles.sectionHead}>
            <SectionHeader title="Preuve vérifiable" />
          </View>
          <View style={styles.proofCard}>
            {/* Top row */}
            <View style={styles.proofTopRow}>
              <Feather name="shield" size={24} color={Colors.proofBlue} />
              <View style={styles.proofTitleBlock}>
                <Text style={styles.proofTitle}>Attestation ObjectPass</Text>
                <Text style={styles.proofSubtitle}>Ancrée et vérifiable</Text>
              </View>
              <View style={styles.proofValidRow}>
                <Animated.View
                  style={[styles.pulseDot, { transform: [{ scale: pulseAnim }] }]}
                />
                <Text style={styles.proofValidText}>Valide</Text>
              </View>
            </View>

            {/* Info rows */}
            <View style={styles.proofInfoRows}>
              <View style={styles.proofInfoRow}>
                <Text style={styles.proofInfoLabel}>ÉMISE LE</Text>
                <Text style={styles.proofInfoValue}>{cert.proof.issuedAt}</Text>
              </View>

              <View style={styles.proofInfoRow}>
                <Text style={styles.proofInfoLabel}>IDENTIFIANT DE PREUVE</Text>
                <View style={styles.proofIdRow}>
                  <Text style={styles.proofIdValue}>{cert.proof.id}</Text>
                  <TouchableOpacity onPress={handleCopyId}>
                    <Feather
                      name="copy"
                      size={12}
                      color={copiedId ? Colors.warrantyGreen : Colors.steelGrey}
                    />
                  </TouchableOpacity>
                </View>
                {copiedId && <Text style={styles.copiedText}>Copié !</Text>}
              </View>

              <View style={styles.proofInfoRow}>
                <Text style={styles.proofInfoLabel}>EMPREINTE BLOCKCHAIN</Text>
                <Text style={styles.proofHashValue}>{cert.proof.blockchainHash}</Text>
                {cert.proof.status === 'pending_anchor' ? (
                  <View style={styles.pendingPill}>
                    <Text style={styles.pendingPillText}>En attente d'ancrage</Text>
                  </View>
                ) : (
                  <View style={styles.anchoredPill}>
                    <Text style={styles.anchoredPillText}>✓ Ancré</Text>
                  </View>
                )}
              </View>

              <View style={styles.proofInfoRow}>
                <Text style={styles.proofInfoLabel}>RÉSEAU</Text>
                <Text style={styles.proofInfoValue}>{cert.proof.network}</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.proofFooter}>
              <Feather name="info" size={12} color={Colors.steelGrey} />
              <Text style={styles.proofFooterText}>
                {' '}Cette preuve est indépendante d'ObjectPass. Elle peut être vérifiée par tout acheteur, assureur ou marketplace compatible, même si ObjectPass n'existe plus.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Garantie ────────────────────────────────────────────── */}
        <Animated.View style={{ opacity: secOp4 }}>
          <View style={styles.sectionHead}>
            <SectionHeader title="Garantie" />
          </View>
          <View style={styles.warrantyCard}>
            <View
              style={[
                styles.warrantyAccent,
                { backgroundColor: isWarrantyActive ? Colors.warrantyGreen : Colors.steelGrey },
              ]}
            />
            <View style={styles.warrantyContent}>
              <Text style={styles.warrantyTitle}>Garantie réparation</Text>
              <Text style={styles.warrantyDuration}>{cert.warrantyMonths} mois</Text>
              <Text
                style={[
                  styles.warrantyExpiry,
                  { color: isWarrantyActive ? Colors.warrantyGreen : Colors.steelGrey },
                ]}
              >
                {isWarrantyActive
                  ? `Expire le ${cert.warrantyExpiry}`
                  : `Expirée le ${cert.warrantyExpiry}`}
              </Text>
              <Text style={styles.warrantyCoverage}>Couvre la pièce et la main d'œuvre</Text>
              <View style={styles.warrantyStatusRow}>
                <View
                  style={[
                    styles.warrantyStatusBadge,
                    {
                      backgroundColor: isWarrantyActive
                        ? Colors.warrantyGreen + '18'
                        : Colors.steelGrey + '18',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.warrantyStatusText,
                      { color: isWarrantyActive ? Colors.warrantyGreen : Colors.steelGrey },
                    ]}
                  >
                    {isWarrantyActive ? '✓ Garantie active' : 'Garantie expirée'}
                  </Text>
                </View>
                <Text style={styles.warrantyRepairerLabel}>
                  Émise par {cert.repairer.name}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── QR Code ─────────────────────────────────────────────── */}
        <Animated.View style={{ opacity: secOp5 }}>
          <View style={styles.sectionHead}>
            <SectionHeader title="Partager cette preuve" />
          </View>
          <View style={styles.qrCard}>
            <Text style={styles.qrSubtitle}>
              Partagez ce QR code avec un acheteur, un assureur ou une marketplace pour prouver l'intervention.
            </Text>

            {/* QR placeholder */}
            <View style={styles.qrOuter}>
              <View style={styles.qrGrid}>
                {QR_PATTERN.map((row, ri) => (
                  <View key={ri} style={styles.qrRow}>
                    {row.map((cell, ci) => (
                      <View
                        key={ci}
                        style={[
                          styles.qrCell,
                          { backgroundColor: cell ? Colors.objectNavy : Colors.cleanWhite },
                        ]}
                      />
                    ))}
                  </View>
                ))}
              </View>
              <View style={styles.qrLogo} pointerEvents="none">
                <Text style={styles.qrLogoText}>OP</Text>
              </View>
            </View>

            <Text style={styles.qrProofId}>{cert.proof.id}</Text>

            <View style={styles.qrBtns}>
              <View style={{ flex: 1 }}>
                <OutlineButton
                  label={copiedLink ? 'Copié !' : 'Copier le lien'}
                  onPress={handleCopyLink}
                  fullWidth
                />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label="Partager"
                  onPress={() => Alert.alert('Partager la preuve', 'Bientôt disponible')}
                  fullWidth
                />
              </View>
            </View>

            <View style={styles.privacyNote}>
              <Feather name="eye-off" size={11} color={Colors.steelGrey} />
              <Text style={styles.privacyNoteText}>
                {' '}Vos données personnelles ne sont pas partagées
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* ── Sticky bar ────────────────────────────────────────────── */}
      <View style={[styles.stickyBar, { paddingBottom: (insets.bottom || 0) + 12 }]}>
        <PrimaryButton
          label="Ajouter au passeport de l'appareil"
          onPress={handleAddToPassport}
          fullWidth
        />
      </View>

      {/* ── Toast ─────────────────────────────────────────────────── */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toast,
            { opacity: toastOpacity, bottom: (insets.bottom || 0) + 84 },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.toastText}>
            ✓ Preuve ajoutée au passeport de {deviceName}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.cleanWhite },

  // ── Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    backgroundColor: Colors.cleanWhite,
  },
  topBarBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 22,
    color: Colors.steelGrey,
    lineHeight: 26,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: Colors.graphite,
  },

  // ── Hero
  hero: {
    backgroundColor: Colors.objectNavy,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#123D45',
    opacity: 0.18,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.repairTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCertTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.cleanWhite,
    textAlign: 'center',
    marginTop: 16,
  },
  heroCertSub: {
    fontSize: 14,
    color: Colors.steelGrey,
    textAlign: 'center',
    marginTop: 4,
  },
  metaChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  metaChip: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  metaChipText: {
    color: Colors.cleanWhite,
    fontSize: 12,
    fontWeight: '500',
  },

  // ── Sections
  sectionHead: { marginTop: 28, paddingHorizontal: 20 },

  // ── Card (Paper Sage)
  card: {
    backgroundColor: Colors.paperSage,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 8,
  },

  // ── Device section
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  devicePhotoZone: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.objectNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceEmoji: { fontSize: 28 },
  deviceInfo: { flex: 1, marginLeft: 12 },
  deviceName: { fontSize: 16, fontWeight: '700', color: Colors.graphite },
  deviceModel: { fontSize: 13, color: Colors.steelGrey, marginTop: 2 },
  deviceSerial: {
    fontSize: 12,
    color: Colors.steelGrey,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  deviceScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderMist,
  },
  deviceScoreLabel: {
    flex: 1,
    fontSize: 11,
    color: Colors.steelGrey,
    marginLeft: 8,
  },
  deviceScoreValue: { fontSize: 14, fontWeight: '700' },

  // ── Intervention info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.steelGrey,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flexShrink: 0,
    marginRight: 8,
  },
  infoValue: {
    fontSize: 13,
    color: Colors.graphite,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderMist,
    marginVertical: 12,
  },
  partCard: {
    backgroundColor: Colors.cleanWhite,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  partName: { fontSize: 13, color: Colors.graphite, fontWeight: '600' },
  partMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  partQualityBadge: {
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  partQualityPremium: { backgroundColor: Colors.warrantyGreen + '18' },
  partQualityStandard: { backgroundColor: Colors.steelGrey + '18' },
  partQualityText: { fontSize: 11, fontWeight: '600' },
  partRef: { fontSize: 11, color: Colors.steelGrey, fontFamily: 'monospace' },
  notesText: {
    fontSize: 13,
    color: Colors.graphite,
    fontStyle: 'italic',
    marginTop: 6,
    lineHeight: 20,
  },

  // ── Repairer section
  repairerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  repAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.objectNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repAvatarText: { fontSize: 16, fontWeight: '700', color: Colors.cleanWhite },
  repInfo: { flex: 1, gap: 2 },
  repName: { fontSize: 15, fontWeight: '700', color: Colors.graphite },
  repShop: { fontSize: 13, color: Colors.steelGrey },
  starsRow: { fontSize: 13, marginTop: 2 },
  starsFilled: { color: Colors.diagnosticAmber },
  starsEmpty: { color: Colors.borderMist },
  starsCount: { color: Colors.steelGrey, fontSize: 12 },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  certOPBadge: {
    backgroundColor: '#E9EFFF',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  certOPBadgeText: { fontSize: 12, color: Colors.proofBlue, fontWeight: '600' },
  memberSince: { fontSize: 12, color: Colors.steelGrey },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: Colors.repairTeal + '18',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { fontSize: 12, color: Colors.repairTeal, fontWeight: '600' },
  sigLabel: {
    fontSize: 12,
    color: Colors.steelGrey,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sigHash: {
    fontSize: 11,
    color: Colors.steelGrey,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  sigFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  sigFooterText: {
    fontSize: 10,
    color: Colors.steelGrey,
    fontStyle: 'italic',
  },

  // ── Proof card (Web3 section)
  proofCard: {
    backgroundColor: '#ECF1FF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(36, 95, 255, 0.13)',
  },
  proofTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  proofTitleBlock: { flex: 1 },
  proofTitle: { fontSize: 15, fontWeight: '700', color: Colors.proofBlue },
  proofSubtitle: { fontSize: 12, color: Colors.steelGrey, marginTop: 2 },
  proofValidRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.warrantyGreen,
  },
  proofValidText: { fontSize: 11, color: Colors.warrantyGreen, fontWeight: '600' },
  proofInfoRows: { marginTop: 16, gap: 10 },
  proofInfoRow: { gap: 3 },
  proofInfoLabel: {
    fontSize: 10,
    color: Colors.steelGrey,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  proofInfoValue: { fontSize: 12, color: Colors.graphite, fontWeight: '600' },
  proofIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proofIdValue: {
    fontSize: 12,
    color: Colors.graphite,
    fontFamily: 'monospace',
    fontWeight: '600',
    flex: 1,
  },
  copiedText: { fontSize: 11, color: Colors.warrantyGreen, fontStyle: 'italic' },
  proofHashValue: {
    fontSize: 12,
    color: Colors.steelGrey,
    fontFamily: 'monospace',
    fontStyle: 'italic',
  },
  pendingPill: {
    backgroundColor: Colors.diagnosticAmber + '1A',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  pendingPillText: { fontSize: 10, color: Colors.diagnosticAmber },
  anchoredPill: {
    backgroundColor: Colors.warrantyGreen + '1A',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  anchoredPillText: { fontSize: 10, color: Colors.warrantyGreen },
  proofFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(36, 95, 255, 0.13)',
    gap: 4,
  },
  proofFooterText: {
    flex: 1,
    fontSize: 11,
    color: Colors.steelGrey,
    lineHeight: 16,
    fontStyle: 'italic',
  },

  // ── Warranty card
  warrantyCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cleanWhite,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginTop: 8,
  },
  warrantyAccent: {
    width: 4,
    borderRadius: 2,
    alignSelf: 'stretch',
    margin: 4,
  },
  warrantyContent: { flex: 1, padding: 16, gap: 4 },
  warrantyTitle: { fontSize: 15, fontWeight: '700', color: Colors.graphite },
  warrantyDuration: { fontSize: 13, color: Colors.steelGrey },
  warrantyExpiry: { fontSize: 13, fontWeight: '600' },
  warrantyCoverage: { fontSize: 12, color: Colors.steelGrey, marginTop: 6 },
  warrantyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  warrantyStatusBadge: {
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  warrantyStatusText: { fontSize: 12, fontWeight: '600' },
  warrantyRepairerLabel: { fontSize: 12, color: Colors.steelGrey },

  // ── QR code section
  qrCard: {
    backgroundColor: Colors.paperSage,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 8,
    alignItems: 'center',
  },
  qrSubtitle: {
    fontSize: 13,
    color: Colors.steelGrey,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  qrOuter: {
    width: 180,
    height: 180,
    backgroundColor: Colors.cleanWhite,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  qrGrid: { gap: 0 },
  qrRow: { flexDirection: 'row' },
  qrCell: { width: CELL_SIZE, height: CELL_SIZE, borderRadius: 2 },
  qrLogo: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.objectNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrLogoText: { fontSize: 10, fontWeight: '800', color: Colors.repairTeal },
  qrProofId: {
    fontSize: 11,
    color: Colors.steelGrey,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: 12,
  },
  qrBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    width: '100%',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  privacyNoteText: {
    fontSize: 11,
    color: Colors.steelGrey,
    fontStyle: 'italic',
  },

  // ── Sticky bar
  stickyBar: {
    backgroundColor: Colors.cleanWhite,
    borderTopWidth: 1,
    borderTopColor: Colors.borderMist,
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  // ── Toast
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: Colors.objectNavy,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toastText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.cleanWhite,
    textAlign: 'center',
  },
});
