import React, { useEffect, useRef } from 'react';
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
import { Colors } from '../constants/colors';
import { HealthScoreBadge, OutlineButton, PrimaryButton, SectionHeader } from '../components/ui';
import { useDevices } from '../context/DevicesContext';
import { getOwnership, OWNERSHIP_STATUS_CONFIG } from '../constants/ownership';
import type { DeviceEntry } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  laptop: '💻',
  phone: '📱',
  tablet: '📱',
  ebike: '🚲',
  other: '📦',
};

function getScoreLabel(score: number) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Bon état';
  return 'Attention';
}

function getHeroScoreColor(score: number) {
  if (score >= 80) return Colors.cleanWhite;
  if (score >= 60) return Colors.diagnosticAmber;
  return Colors.faultCoral;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

interface HealthComp {
  icon: string;
  label: string;
  value: string;
  percentage: number;
  color: string;
  badge?: string;
}

function getHealthComponents(device: DeviceEntry): HealthComp[] {
  if (device.id === '1') {
    return [
      { icon: 'battery-charging', label: 'Batterie',     value: '91%',        percentage: 91,  color: Colors.warrantyGreen },
      { icon: 'monitor',          label: 'Écran',        value: 'Bon état',   percentage: 100, color: Colors.warrantyGreen },
      { icon: 'zap',              label: 'Performance',  value: 'Très bon',   percentage: 88,  color: Colors.warrantyGreen },
    ];
  }
  if (device.id === '2') {
    return [
      { icon: 'battery-charging', label: 'Batterie',     value: '87%',        percentage: 87,  color: Colors.warrantyGreen },
      { icon: 'smartphone',       label: 'Écran',        value: 'Remplacé',   percentage: 100, color: Colors.repairTeal, badge: '✓ Certifié' },
      { icon: 'wifi',             label: 'Connectivité', value: 'Bon état',   percentage: 95,  color: Colors.warrantyGreen },
    ];
  }
  if (device.id === '3') {
    return [
      { icon: 'battery-charging', label: 'Batterie',     value: '74%',        percentage: 74, color: Colors.diagnosticAmber },
      { icon: 'settings',         label: 'Moteur',       value: 'À vérifier', percentage: 60, color: Colors.diagnosticAmber },
      { icon: 'tool',             label: 'Freins',       value: 'Bon état',   percentage: 90, color: Colors.warrantyGreen },
      { icon: 'wifi',             label: 'Connectivité', value: 'Bon état',   percentage: 88, color: Colors.warrantyGreen },
    ];
  }
  return [
    { icon: 'battery-charging', label: 'Batterie',    value: '—', percentage: 0, color: Colors.steelGrey },
    { icon: 'monitor',          label: 'Écran',       value: '—', percentage: 0, color: Colors.steelGrey },
    { icon: 'zap',              label: 'Performance', value: '—', percentage: 0, color: Colors.steelGrey },
  ];
}

interface WarrantyInfo {
  type: string;
  expiryLabel: string;
  active: boolean;
  repairer?: string;
  isRepairWarranty?: boolean;
}

function getWarranties(device: DeviceEntry): WarrantyInfo[] {
  const list: WarrantyInfo[] = [];
  if (device.warrantyExpiry) {
    list.push({
      type: 'Garantie constructeur',
      expiryLabel: device.warrantyExpiry,
      active: device.warrantyActive,
    });
  }
  if (device.id === '2') {
    list.push({
      type: 'Garantie réparation',
      expiryLabel: '8 avril 2025',
      active: false,
      repairer: 'Apple Store Opéra',
      isRepairWarranty: true,
    });
  }
  return list;
}

function getEstimatedValue(device: DeviceEntry) {
  if (device.id === '1') return { price: '780 €', trend: '↑ +12% vs marché', trendPositive: true };
  if (device.id === '2') return { price: '620 €', trend: '↑ +12% vs marché', trendPositive: true };
  if (device.id === '3') return { price: '890 €', trend: '↑ +12% vs marché', trendPositive: true };
  return { price: '—', trend: 'Données insuffisantes', trendPositive: false };
}

function warrantyAccentColor(w: WarrantyInfo) {
  return w.active ? Colors.warrantyGreen : Colors.steelGrey;
}

function warrantyStatusLabel(w: WarrantyInfo) {
  return w.active ? 'Active' : 'Expirée';
}

function warrantyStatusColor(w: WarrantyInfo) {
  return w.active ? Colors.warrantyGreen : Colors.steelGrey;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function DeviceDetailScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'DeviceDetail'>>();
  const { deviceId } = route.params;
  const { devices, removeDevice } = useDevices();
  const insets = useSafeAreaInsets();

  // Health bar animations
  const barAnim0 = useRef(new Animated.Value(0)).current;
  const barAnim1 = useRef(new Animated.Value(0)).current;
  const barAnim2 = useRef(new Animated.Value(0)).current;
  const barAnim3 = useRef(new Animated.Value(0)).current;
  const barAnims = [barAnim0, barAnim1, barAnim2, barAnim3];

  // Timeline animations (up to 3 items)
  const tlOp0 = useRef(new Animated.Value(0)).current;
  const tlOp1 = useRef(new Animated.Value(0)).current;
  const tlOp2 = useRef(new Animated.Value(0)).current;
  const tlTY0 = useRef(new Animated.Value(20)).current;
  const tlTY1 = useRef(new Animated.Value(20)).current;
  const tlTY2 = useRef(new Animated.Value(20)).current;
  const tlOps = [tlOp0, tlOp1, tlOp2];
  const tlTYs = [tlTY0, tlTY1, tlTY2];

  const device = devices.find((d) => d.id === deviceId);
  const healthComponents = device ? getHealthComponents(device) : [];

  useEffect(() => {
    if (!device) return;

    // Staggered health bars
    Animated.parallel(
      healthComponents.map((comp, i) =>
        Animated.timing(barAnims[i], {
          toValue: comp.percentage,
          duration: 600,
          delay: (i + 1) * 100,
          useNativeDriver: false,
        })
      )
    ).start();

    // Staggered timeline entries (repairs + "added" node)
    const itemCount = Math.min(device.repairs.length + 1, 3);
    Animated.parallel(
      Array.from({ length: itemCount }, (_, i) => [
        Animated.timing(tlOps[i], {
          toValue: 1,
          duration: 400,
          delay: 150 * (i + 1),
          useNativeDriver: true,
        }),
        Animated.timing(tlTYs[i], {
          toValue: 0,
          duration: 400,
          delay: 150 * (i + 1),
          useNativeDriver: true,
        }),
      ]).flat()
    ).start();
  }, [device?.id]);

  if (!device) return null;

  const ownership = getOwnership(device);
  const ownershipCfg = OWNERSHIP_STATUS_CONFIG[ownership.status];
  const warranties = getWarranties(device);
  const estimatedValue = getEstimatedValue(device);
  const certifiedRepairs = device.repairs.filter((r) => r.certified);
  const hasInvoice = !!device.hasInvoice;
  const addedTlIdx = Math.min(device.repairs.length, 2);

  const handleShare = () =>
    Alert.alert("Partager l'ObjectPass", 'Fonctionnalité bientôt disponible');

  const handleMenu = () => {
    Alert.alert('Options', undefined, [
      {
        text: "Modifier l'appareil",
        onPress: () => navigation.navigate('EditDevice', { deviceId: device.id }),
      },
      {
        text: 'Générer un QR code',
        onPress: () =>
          navigation.navigate('QRCodeModal', {
            deviceId: device.id,
            name: device.name,
            serialNumber: device.serialNumber,
          }),
      },
      {
        text: "Transférer l'ObjectPass",
        onPress: () => navigation.navigate('TransferOwnership', { deviceId: device.id }),
      },
      {
        text: "Supprimer l'appareil",
        style: 'destructive' as const,
        onPress: () =>
          Alert.alert(
            "Supprimer l'appareil",
            `Voulez-vous vraiment supprimer ${device.name} de votre ObjectPass ?`,
            [
              { text: 'Annuler', style: 'cancel' },
              {
                text: 'Supprimer',
                style: 'destructive',
                onPress: () => {
                  removeDevice(device.id);
                  navigation.goBack();
                },
              },
            ]
          ),
      },
      { text: 'Annuler', style: 'cancel' as const },
    ]);
  };

  const quickActions = [
    {
      emoji: '🔧',
      label: 'Diagnostic',
      active: true,
      onPress: () => navigation.navigate('Tabs', { screen: 'Diagnostic' }),
    },
    {
      emoji: '📅',
      label: 'Rendez-vous',
      active: false,
      onPress: () => navigation.navigate('Tabs', { screen: 'Rendez_vous' }),
    },
    {
      emoji: '📤',
      label: 'Partager',
      active: false,
      onPress: handleShare,
    },
    {
      emoji: '🔗',
      label: 'QR Code',
      active: false,
      onPress: () =>
        navigation.navigate('QRCodeModal', {
          deviceId: device.id,
          name: device.name,
          serialNumber: device.serialNumber,
        }),
    },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + (insets.bottom || 0) }}
      >
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          {/* Subtle diagonal overlay */}
          <View style={styles.heroOverlay} pointerEvents="none" />

          {/* Top bar */}
          <View style={styles.heroTopBar}>
            <TouchableOpacity
              style={styles.heroIconBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="arrow-left" size={22} color={Colors.cleanWhite} />
            </TouchableOpacity>
            <View style={styles.heroTopRight}>
              <TouchableOpacity style={styles.heroIconBtn} onPress={handleShare}>
                <Feather name="share-2" size={20} color={Colors.cleanWhite} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroIconBtn} onPress={handleMenu}>
                <Feather name="more-vertical" size={20} color={Colors.cleanWhite} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Device identity */}
          <View style={styles.deviceIdentity}>
            <View style={styles.devicePhoto}>
              <Text style={styles.deviceEmoji}>
                {CATEGORY_EMOJI[device.category] ?? '📦'}
              </Text>
            </View>
            <Text style={styles.deviceName}>{device.name}</Text>
            <Text style={styles.deviceModel}>{device.model}</Text>
            <Text style={styles.serialNumber}>
              S/N : {device.serialNumber ?? '—'}
            </Text>
            {ownership.status !== 'none' && (
              <View style={[styles.ownershipPill, { backgroundColor: ownershipCfg.bg }]}>
                <View style={[styles.ownershipDot, { backgroundColor: ownershipCfg.color }]} />
                <Text style={[styles.ownershipPillText, { color: ownershipCfg.color }]}>
                  {ownershipCfg.label}
                </Text>
              </View>
            )}
          </View>

          {/* Health score block */}
          <View style={styles.healthScoreBlock}>
            <HealthScoreBadge score={device.healthScore} size="large" />
            <View style={styles.healthScoreRight}>
              <Text
                style={[
                  styles.scoreLabel,
                  { color: getHeroScoreColor(device.healthScore) },
                ]}
              >
                {getScoreLabel(device.healthScore)}
              </Text>
              <Text style={styles.scoreSubLabel}>Score ObjectPass</Text>

              <View style={styles.miniIndicators}>
                <View style={styles.miniIndicator}>
                  <View
                    style={[
                      styles.miniDot,
                      {
                        backgroundColor: device.warrantyActive
                          ? Colors.warrantyGreen
                          : Colors.steelGrey,
                      },
                    ]}
                  />
                  <Text style={styles.miniLabel}>
                    {device.warrantyActive ? 'Garantie active' : 'Garantie expirée'}
                  </Text>
                </View>
                <View style={styles.miniIndicator}>
                  <View
                    style={[
                      styles.miniDot,
                      {
                        backgroundColor: hasInvoice
                          ? Colors.warrantyGreen
                          : Colors.steelGrey,
                      },
                    ]}
                  />
                  <Text style={styles.miniLabel}>Facture</Text>
                </View>
                <View style={styles.miniIndicator}>
                  <View
                    style={[
                      styles.miniDot,
                      {
                        backgroundColor:
                          device.repairs.length > 0
                            ? Colors.repairTeal
                            : Colors.steelGrey,
                      },
                    ]}
                  />
                  <Text style={styles.miniLabel}>Réparations</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Quick Actions ────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickActionsScroll}
          contentContainerStyle={styles.quickActionsContent}
        >
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.actionChip, action.active && styles.actionChipActive]}
              onPress={action.onPress}
              activeOpacity={0.8}
            >
              <Text style={styles.actionChipEmoji}>{action.emoji}</Text>
              <Text
                style={[
                  styles.actionChipLabel,
                  action.active && styles.actionChipLabelActive,
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Santé de l'appareil ──────────────────────────────────── */}
        <View style={styles.sectionHead}>
          <SectionHeader title="Santé de l'appareil" />
        </View>

        <View style={styles.healthCard}>
          {healthComponents.map((comp, i) => (
            <View key={comp.label} style={[styles.healthRow, i > 0 && styles.healthRowGap]}>
              <View style={styles.healthRowTop}>
                <View style={styles.healthRowLeft}>
                  <Feather name={comp.icon as any} size={16} color={Colors.steelGrey} />
                  <Text style={styles.healthLabel}>{comp.label}</Text>
                </View>
                <View style={styles.healthRowRight}>
                  <Text style={[styles.healthValue, { color: comp.color }]}>
                    {comp.value}
                  </Text>
                  {comp.badge && (
                    <View style={styles.certBadgeTeal}>
                      <Text style={styles.certBadgeTealText}>{comp.badge}</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.barTrack}>
                <Animated.View
                  style={[
                    styles.barFill,
                    {
                      width: barAnims[i].interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: comp.color,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* ── Garanties ────────────────────────────────────────────── */}
        <View style={styles.sectionHead}>
          <SectionHeader title="Garanties" />
        </View>

        {warranties.length > 0 ? (
          <>
            {warranties.map((w, i) => (
              <View
                key={i}
                style={[styles.warrantyCard, i > 0 && { marginTop: 8 }]}
              >
                <View
                  style={[
                    styles.warrantyAccent,
                    { backgroundColor: warrantyAccentColor(w) },
                  ]}
                />
                <View style={styles.warrantyContent}>
                  <View style={styles.warrantyTopRow}>
                    <View style={styles.warrantyTextGroup}>
                      <Text style={styles.warrantyType}>{w.type}</Text>
                      <Text
                        style={[
                          styles.warrantyExpiry,
                          !w.active && styles.warrantyExpiryGrey,
                        ]}
                      >
                        {w.active
                          ? `Expire le ${w.expiryLabel}`
                          : `Expirée le ${w.expiryLabel}`}
                      </Text>
                      {w.isRepairWarranty && w.repairer && (
                        <Text style={styles.warrantyRepairer}>{w.repairer}</Text>
                      )}
                    </View>
                    <View
                      style={[
                        styles.warrantyStatusBadge,
                        { backgroundColor: warrantyStatusColor(w) + '22' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.warrantyStatusText,
                          { color: warrantyStatusColor(w) },
                        ]}
                      >
                        {warrantyStatusLabel(w)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Aucune garantie enregistrée</Text>
            <TouchableOpacity
              style={styles.emptyChip}
              onPress={() => Alert.alert('', 'Ajout de garantie bientôt disponible')}
            >
              <Text style={styles.emptyChipText}>Ajouter une garantie</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Historique des interventions ─────────────────────────── */}
        <View style={styles.sectionHead}>
          <SectionHeader title="Historique" action="Tout voir" onAction={() => {}} />
        </View>

        <View style={styles.timeline}>
          {/* Repair items */}
          {device.repairs.map((repair, i) => (
            <Animated.View
              key={repair.id}
              style={[
                styles.tlItem,
                {
                  opacity: tlOps[i],
                  transform: [{ translateY: tlTYs[i] }],
                },
              ]}
            >
              <View style={styles.tlLeft}>
                <View style={styles.tlNode} />
                <View style={styles.tlLine} />
              </View>

              <View style={styles.tlCard}>
                <View style={styles.tlTopRow}>
                  <Text style={styles.tlType}>{repair.type}</Text>
                  <Text style={styles.tlDate}>{repair.date}</Text>
                </View>

                <View style={styles.tlRepairerRow}>
                  <View style={styles.tlAvatar}>
                    <Text style={styles.tlAvatarText}>
                      {getInitials(repair.repairer)}
                    </Text>
                  </View>
                  <Text style={styles.tlRepairerName}>{repair.repairer}</Text>
                  {repair.certified && (
                    <View style={styles.certBadgeBlue}>
                      <Text style={styles.certBadgeBlueText}>✓ Certifié</Text>
                    </View>
                  )}
                </View>

                {repair.certified && (
                  <TouchableOpacity
                    style={styles.proofBtn}
                    onPress={() =>
                      repair.repairId
                        ? navigation.navigate('Certificate', { repairId: repair.repairId })
                        : Alert.alert('', 'Preuve bientôt disponible')
                    }
                  >
                    <Text style={styles.proofBtnText}>Voir la preuve</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          ))}

          {/* "Appareil ajouté" node — always last */}
          <Animated.View
            style={[
              styles.tlAddedItem,
              {
                opacity: tlOps[addedTlIdx],
                transform: [{ translateY: tlTYs[addedTlIdx] }],
              },
            ]}
          >
            <View style={styles.tlLeftNoLine}>
              <View style={styles.tlNodeGreen} />
            </View>
            <View style={styles.tlAddedContent}>
              <Text style={styles.tlAddedText}>
                Appareil ajouté à l'ObjectPass
              </Text>
              <Text style={styles.tlAddedDate}>
                {device.createdAt ?? 'Date inconnue'}
              </Text>
            </View>
          </Animated.View>

          {/* Empty state */}
          {device.repairs.length === 0 && (
            <View style={styles.tlEmpty}>
              <Text style={styles.tlEmptyText}>
                Aucune intervention enregistrée
              </Text>
              <TouchableOpacity
                style={styles.emptyChip}
                onPress={() => navigation.navigate('Tabs', { screen: 'Diagnostic' })}
              >
                <Text style={styles.emptyChipText}>Lancer un diagnostic</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Valeur estimée ───────────────────────────────────────── */}
        <View style={styles.sectionHead}>
          <SectionHeader title="Valeur estimée" />
        </View>

        <View style={styles.valueCard}>
          <View style={styles.valueRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.valueLabel}>Valeur de revente estimée</Text>
              <Text style={styles.valuePrice}>{estimatedValue.price}</Text>
              <Text style={styles.valueDate}>Mise à jour aujourd'hui</Text>
            </View>
            <View style={styles.valueTrendGroup}>
              <Text
                style={[
                  styles.valueTrend,
                  {
                    color: estimatedValue.trendPositive
                      ? Colors.warrantyGreen
                      : Colors.steelGrey,
                  },
                ]}
              >
                {estimatedValue.trend}
              </Text>
            </View>
          </View>
          <View style={styles.valueSeparator} />
          <View style={styles.valueFooter}>
            <Text style={styles.valueFooterText}>
              Avec historique ObjectPass certifié
            </Text>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'ObjectPass',
                  'Un historique certifié augmente la valeur de revente de votre appareil.'
                )
              }
            >
              <Feather name="info" size={14} color={Colors.repairTeal} />
            </TouchableOpacity>
          </View>
          <View style={{ marginTop: 16 }}>
            <OutlineButton
              label="Préparer la revente"
              onPress={() => Alert.alert('', 'Fonctionnalité bientôt disponible')}
              fullWidth
            />
          </View>
        </View>

        {/* ── Documents ────────────────────────────────────────────── */}
        <View style={styles.sectionHead}>
          <SectionHeader title="Documents" />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.docsScroll}
        >
          {hasInvoice && (
            <TouchableOpacity
              style={styles.docCard}
              onPress={() => Alert.alert('', 'Document bientôt disponible')}
            >
              <Feather name="file-text" size={24} color={Colors.repairTeal} />
              <Text style={styles.docLabel}>Facture d'achat</Text>
              <Text style={styles.docDate}>Date d'achat</Text>
            </TouchableOpacity>
          )}

          {certifiedRepairs.map((repair) => (
            <TouchableOpacity
              key={repair.id}
              style={styles.docCard}
              onPress={() => Alert.alert('', 'Preuve bientôt disponible')}
            >
              <Feather name="shield" size={24} color={Colors.repairTeal} />
              <Text style={styles.docLabel}>Preuve de réparation</Text>
              <Text style={styles.docDate}>{repair.date}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.docCard}
            onPress={() => Alert.alert('', 'Certificat bientôt disponible')}
          >
            <Feather name="award" size={24} color={Colors.proofBlue} />
            <Text style={[styles.docLabel, { color: Colors.proofBlue }]}>
              Certificat ObjectPass
            </Text>
            <Text style={styles.docDate}>Toujours à jour</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScrollView>

      {/* ── Sticky bar ───────────────────────────────────────────────── */}
      <View
        style={[
          styles.stickyBar,
          { paddingBottom: (insets.bottom || 0) + 12 },
        ]}
      >
        <View style={{ flex: 1 }}>
          <OutlineButton
            label="Modifier"
            onPress={() => navigation.navigate('EditDevice', { deviceId: device.id })}
            fullWidth
          />
        </View>
        <View style={{ flex: 2 }}>
          <PrimaryButton
            label="Prendre un rendez-vous"
            onPress={() => navigation.navigate('Tabs', { screen: 'Rendez_vous' })}
            fullWidth
          />
        </View>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.cleanWhite },

  // ── Hero
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
  heroTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroTopRight: {
    flexDirection: 'row',
  },
  heroIconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Device identity
  deviceIdentity: { alignItems: 'center', marginBottom: 20 },
  devicePhoto: {
    width: 80,
    height: 80,
    borderRadius: 18,
    backgroundColor: Colors.paperSage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceEmoji: { fontSize: 44 },
  deviceName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.cleanWhite,
    marginTop: 12,
    textAlign: 'center',
  },
  deviceModel: {
    fontSize: 14,
    color: Colors.steelGrey,
    textAlign: 'center',
    marginTop: 2,
  },
  serialNumber: {
    fontSize: 12,
    color: Colors.steelGrey,
    fontFamily: 'monospace',
    marginTop: 4,
    textAlign: 'center',
  },
  ownershipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
  },
  ownershipDot: { width: 6, height: 6, borderRadius: 3 },
  ownershipPillText: { fontSize: 11, fontWeight: '700' },

  // ── Health score block
  healthScoreBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  healthScoreRight: { marginLeft: 24 },
  scoreLabel: { fontSize: 18, fontWeight: '700' },
  scoreSubLabel: { fontSize: 12, color: Colors.steelGrey, marginTop: 2 },
  miniIndicators: { flexDirection: 'column', gap: 6, marginTop: 10 },
  miniIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniDot: { width: 8, height: 8, borderRadius: 4 },
  miniLabel: { fontSize: 11, color: Colors.steelGrey },

  // ── Quick actions
  quickActionsScroll: { marginTop: 20 },
  quickActionsContent: { paddingHorizontal: 20, gap: 10, paddingBottom: 4 },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.paperSage,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionChipActive: {
    backgroundColor: Colors.objectNavy,
    borderColor: Colors.objectNavy,
  },
  actionChipEmoji: { fontSize: 15 },
  actionChipLabel: { fontSize: 13, fontWeight: '600', color: Colors.graphite },
  actionChipLabelActive: { color: Colors.cleanWhite },

  // ── Section headers
  sectionHead: { marginTop: 28, paddingHorizontal: 20 },

  // ── Health card
  healthCard: {
    backgroundColor: Colors.paperSage,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 8,
  },
  healthRow: {},
  healthRowGap: { marginTop: 12 },
  healthRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  healthRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  healthRowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  healthLabel: { fontSize: 13, color: Colors.graphite, fontWeight: '500' },
  healthValue: { fontSize: 13, fontWeight: '600' },
  certBadgeTeal: {
    backgroundColor: Colors.repairTeal + '22',
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  certBadgeTealText: { fontSize: 10, fontWeight: '600', color: Colors.repairTeal },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.borderMist,
    overflow: 'hidden',
  },
  barFill: { height: 6, borderRadius: 3 },

  // ── Warranty cards
  warrantyCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cleanWhite,
    borderWidth: 1,
    borderColor: Colors.borderMist,
    borderRadius: 14,
    overflow: 'hidden',
    marginHorizontal: 20,
  },
  warrantyAccent: { width: 4, alignSelf: 'stretch' },
  warrantyContent: { flex: 1, padding: 14 },
  warrantyTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  warrantyTextGroup: { flex: 1, gap: 3 },
  warrantyType: { fontSize: 14, fontWeight: '600', color: Colors.graphite },
  warrantyExpiry: { fontSize: 13, color: Colors.steelGrey },
  warrantyExpiryGrey: { fontStyle: 'italic' },
  warrantyRepairer: { fontSize: 12, color: Colors.steelGrey, marginTop: 2 },
  warrantyStatusBadge: {
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  warrantyStatusText: { fontSize: 11, fontWeight: '700' },

  // ── Empty states
  emptyCard: {
    backgroundColor: Colors.paperSage,
    borderRadius: 14,
    padding: 20,
    marginHorizontal: 20,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: { fontSize: 13, color: Colors.steelGrey },
  emptyChip: {
    backgroundColor: Colors.cleanWhite,
    borderWidth: 1,
    borderColor: Colors.borderMist,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 4,
  },
  emptyChipText: { fontSize: 12, fontWeight: '600', color: Colors.graphite },

  // ── Timeline
  timeline: { marginHorizontal: 20, marginTop: 8 },
  tlItem: { flexDirection: 'row' },
  tlLeft: { width: 28, alignItems: 'center', paddingTop: 2 },
  tlLeftNoLine: { width: 28, alignItems: 'center', paddingTop: 2 },
  tlNode: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.repairTeal,
  },
  tlNodeGreen: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.warrantyGreen,
  },
  tlLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    backgroundColor: Colors.borderMist,
    marginTop: 4,
  },
  tlCard: {
    flex: 1,
    backgroundColor: Colors.cleanWhite,
    borderWidth: 1,
    borderColor: Colors.borderMist,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    marginLeft: 4,
  },
  tlTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tlType: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.graphite,
    flex: 1,
    marginRight: 8,
  },
  tlDate: { fontSize: 13, color: Colors.steelGrey },
  tlRepairerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  tlAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.objectNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlAvatarText: { fontSize: 11, fontWeight: '700', color: Colors.cleanWhite },
  tlRepairerName: { fontSize: 13, color: Colors.graphite, flex: 1 },
  certBadgeBlue: {
    backgroundColor: Colors.proofBlue + '18',
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  certBadgeBlueText: { fontSize: 11, fontWeight: '600', color: Colors.proofBlue },
  proofBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.objectNavy,
    borderRadius: 8,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
  },
  proofBtnText: { fontSize: 12, fontWeight: '600', color: Colors.objectNavy },
  tlAddedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tlAddedContent: { flex: 1, marginLeft: 8 },
  tlAddedText: { fontSize: 13, fontWeight: '600', color: Colors.graphite },
  tlAddedDate: { fontSize: 12, color: Colors.steelGrey, marginTop: 2 },
  tlEmpty: { paddingLeft: 36, marginTop: 12, gap: 8 },
  tlEmptyText: { fontSize: 13, color: Colors.steelGrey, fontStyle: 'italic' },

  // ── Value card
  valueCard: {
    backgroundColor: Colors.paperSage,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 8,
  },
  valueRow: { flexDirection: 'row', alignItems: 'flex-start' },
  valueLabel: { fontSize: 13, color: Colors.steelGrey },
  valuePrice: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.graphite,
    marginTop: 4,
  },
  valueDate: { fontSize: 11, color: Colors.steelGrey, marginTop: 4 },
  valueTrendGroup: { alignItems: 'flex-end', paddingTop: 28 },
  valueTrend: { fontSize: 12, fontWeight: '600' },
  valueSeparator: {
    height: 1,
    backgroundColor: Colors.borderMist,
    marginVertical: 12,
  },
  valueFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueFooterText: { fontSize: 12, color: Colors.steelGrey, flex: 1, marginRight: 8 },

  // ── Documents
  docsScroll: { paddingLeft: 20, gap: 10, paddingRight: 8, paddingBottom: 4 },
  docCard: {
    width: 140,
    height: 90,
    backgroundColor: Colors.cleanWhite,
    borderWidth: 1,
    borderColor: Colors.borderMist,
    borderRadius: 14,
    padding: 12,
    gap: 4,
    justifyContent: 'center',
  },
  docLabel: { fontSize: 12, fontWeight: '500', color: Colors.graphite },
  docDate: { fontSize: 11, color: Colors.steelGrey },

  // ── Sticky bar
  stickyBar: {
    backgroundColor: Colors.cleanWhite,
    borderTopWidth: 1,
    borderTopColor: Colors.borderMist,
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
});
