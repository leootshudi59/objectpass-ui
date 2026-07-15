import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, healthColor } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useDevices } from '../context/DevicesContext';
import { SectionHeader } from '../components/ui/SectionHeader';
import { HealthScoreBadge } from '../components/ui/HealthScoreBadge';
import type { DeviceEntry } from '../context/DevicesContext';

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    laptop: '💻',
    phone:  '📱',
    ebike:  '🚲',
    tablet: '📟',
    other:  '📦',
  };
  return map[category] ?? '📦';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Bon';
  if (score >= 55) return 'Attention';
  return 'Panne';
}

// ── Animated counter (count-up on mount) ───────────────────────────────────────

function AnimatedCounter({ value, style }: { value: number; style: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    Animated.timing(anim, {
      toValue: value,
      duration: 800,
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(id);
  }, [value]);

  return <Text style={style}>{display}</Text>;
}

// ── Mini device card ───────────────────────────────────────────────────────────

function MiniDeviceCard({ device }: { device: DeviceEntry }) {
  const emoji = getCategoryEmoji(device.category);
  const score = device.healthScore;
  const color = healthColor(score);
  const label = getScoreLabel(score);

  return (
    <View style={styles.miniCard}>
      <Text style={styles.miniEmoji}>{emoji}</Text>
      <Text style={styles.miniName} numberOfLines={1}>{device.name}</Text>
      <View style={styles.miniBadgeWrapper}>
        <HealthScoreBadge score={score} size="small" />
      </View>
      <Text style={[styles.miniStatus, { color }]}>{label}</Text>
    </View>
  );
}

// ── Settings row ───────────────────────────────────────────────────────────────

interface SettingsRowProps {
  iconName: string;
  label: string;
  isToggle?: boolean;
  notifEnabled?: boolean;
  onToggle?: (val: boolean) => void;
  alertText?: string;
  isLast?: boolean;
}

function SettingsRow({
  iconName, label, isToggle, notifEnabled, onToggle, alertText, isLast,
}: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={[styles.settingsRow, !isLast && styles.settingsRowBorder]}
      activeOpacity={isToggle ? 1 : 0.7}
      onPress={isToggle ? undefined : () => Alert.alert(alertText ?? '')}
    >
      <View style={styles.settingsLeft}>
        <View style={styles.settingsIconCircle}>
          <Feather name={iconName as any} size={16} color={Colors.steelGrey} />
        </View>
        <Text style={styles.settingsLabel}>{label}</Text>
      </View>
      {isToggle ? (
        <Switch
          value={notifEnabled}
          onValueChange={onToggle}
          trackColor={{ false: Colors.borderMist, true: Colors.repairTeal }}
          thumbColor={Colors.cleanWhite}
          ios_backgroundColor={Colors.borderMist}
        />
      ) : (
        <Feather name="chevron-right" size={14} color={Colors.steelGrey} />
      )}
    </TouchableOpacity>
  );
}

// ── Mock activity ──────────────────────────────────────────────────────────────

const ACTIVITY_ITEMS = [
  {
    iconName: 'tool' as const,
    iconBg: Colors.repairTeal + '1A',
    iconColor: Colors.repairTeal,
    label: 'Batterie remplacée · Certifiée',
    device: 'MacBook Pro M1',
    date: '10 juin 2025',
  },
  {
    iconName: 'plus-circle' as const,
    iconBg: Colors.proofBlue + '1A',
    iconColor: Colors.proofBlue,
    label: 'Appareil ajouté',
    device: 'iPhone 15 Pro',
    date: '20 sept. 2023',
  },
  {
    iconName: 'alert-circle' as const,
    iconBg: Colors.diagnosticAmber + '1A',
    iconColor: Colors.diagnosticAmber,
    label: 'Diagnostic en attente',
    device: 'Vélo Cowboy C5',
    date: '20 mai 2025',
  },
];

// ── Screen ─────────────────────────────────────────────────────────────────────

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { state, logout } = useAuth();
  const { devices } = useDevices();
  const user = state.user;

  const initials     = user?.name ? getInitials(user.name) : 'OP';
  const totalRepairs = devices.reduce((acc, d) => acc + d.repairs.length, 0);
  const activeWarranties = devices.filter((d) => d.warrantyActive).length;
  const certifiedRepairs = devices.reduce(
    (acc, d) => acc + d.repairs.filter((r) => r.certified).length,
    0,
  );

  const [notifEnabled, setNotifEnabled] = useState(true);

  // Activity stagger fade-in refs (Rules of Hooks: must be outside loops)
  const fade0 = useRef(new Animated.Value(0)).current;
  const fade1 = useRef(new Animated.Value(0)).current;
  const fade2 = useRef(new Animated.Value(0)).current;
  const activityFades = [fade0, fade1, fade2];

  useEffect(() => {
    activityFades.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 280,
        delay: (i + 1) * 100,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Se déconnecter ?',
      'Vous devrez vous reconnecter pour accéder à votre ObjectPass.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se déconnecter', style: 'destructive', onPress: logout },
      ],
    );
  };

  const SETTINGS: SettingsRowProps[] = [
    {
      iconName: 'bell',
      label: 'Notifications',
      isToggle: true,
      notifEnabled,
      onToggle: setNotifEnabled,
    },
    {
      iconName: 'shield',
      label: 'Confidentialité',
      alertText: 'Paramètres de confidentialité — bientôt disponible',
    },
    {
      iconName: 'file-text',
      label: 'Mes documents',
      alertText: 'Mes documents — bientôt disponible',
    },
    {
      iconName: 'help-circle',
      label: 'Aide & Support',
      alertText: 'Aide & Support — bientôt disponible',
    },
    {
      iconName: 'info',
      label: "À propos d'ObjectPass",
      alertText: 'ObjectPass · v0.1.0 — MVP',
    },
    {
      iconName: 'star',
      label: "Noter l'application",
      alertText: 'Merci ! La notation sera disponible prochainement.',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <View style={styles.hero}>
        <View style={styles.heroOverlay} />

        {/* Avatar */}
        <View>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <TouchableOpacity
            style={styles.cameraBadge}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Modifier la photo', 'Bientôt disponible')}
          >
            <Feather name="camera" size={10} color={Colors.cleanWhite} />
          </TouchableOpacity>
        </View>

        <Text style={styles.heroName}>{user?.name ?? '—'}</Text>
        <Text style={styles.heroEmail}>{user?.email ?? '—'}</Text>

        <View style={styles.verifiedPill}>
          <Feather name="shield" size={10} color={Colors.repairTeal} />
          <Text style={styles.verifiedText}> Compte vérifié</Text>
        </View>

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statCol}>
            <AnimatedCounter value={devices.length} style={styles.statValue} />
            <Text style={styles.statLabel}>Appareils</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <AnimatedCounter value={totalRepairs} style={styles.statValue} />
            <Text style={styles.statLabel}>Réparations</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <AnimatedCounter value={activeWarranties} style={styles.statValue} />
            <Text style={styles.statLabel}>Garanties</Text>
          </View>
        </View>
      </View>

      {/* ── MES APPAREILS ────────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionPad}>
          <SectionHeader
            title="MES APPAREILS"
            action="Voir tout"
            onAction={() => navigation.navigate('Accueil')}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.devicesScroll}
          snapToInterval={152}
          decelerationRate="fast"
        >
          {devices.map((device) => (
            <MiniDeviceCard key={device.id} device={device} />
          ))}
          <TouchableOpacity
            style={styles.addCard}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('AddDevice')}
          >
            <Feather name="plus" size={24} color={Colors.repairTeal} />
            <Text style={styles.addCardLabel}>Ajouter</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── ACTIVITÉ RÉCENTE ─────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionPad}>
          <SectionHeader title="ACTIVITÉ RÉCENTE" />
        </View>
        <View style={styles.activityList}>
          {ACTIVITY_ITEMS.map((item, i) => (
            <Animated.View key={i} style={{ opacity: activityFades[i] }}>
              <TouchableOpacity
                style={styles.activityItem}
                activeOpacity={0.85}
                onPress={() => Alert.alert('Détail bientôt disponible')}
              >
                <View style={[styles.activityIconCircle, { backgroundColor: item.iconBg }]}>
                  <Feather name={item.iconName} size={16} color={item.iconColor} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityLabel}>{item.label}</Text>
                  <Text style={styles.activityDevice}>{item.device}</Text>
                  <Text style={styles.activityDate}>{item.date}</Text>
                </View>
                <Feather name="chevron-right" size={14} color={Colors.borderMist} />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* ── MON OBJECTPASS ───────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionPad}>
          <SectionHeader title="MON OBJECTPASS" />
        </View>
        <View style={styles.opCard}>
          <View style={styles.opTopRow}>
            <View style={styles.opTitleRow}>
              <Feather name="shield" size={20} color={Colors.proofBlue} />
              <Text style={styles.opTitle}>Identité ObjectPass</Text>
            </View>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Actif</Text>
            </View>
          </View>

          <View style={styles.opInfoRows}>
            <View style={styles.opInfoRow}>
              <Text style={styles.opInfoLabel}>IDENTIFIANT</Text>
              <Text style={[styles.opInfoValue, styles.mono]}>OP-LEO-7F3A-2024</Text>
            </View>
            <View style={styles.opInfoRow}>
              <Text style={styles.opInfoLabel}>WALLET</Text>
              <View style={styles.walletRow}>
                <Text style={[styles.opInfoValue, styles.mono]}>0x3a7f...c4b2</Text>
                <TouchableOpacity
                  onPress={() => Alert.alert('Copié', 'Adresse copiée dans le presse-papiers')}
                  style={styles.copyBtn}
                >
                  <Feather name="copy" size={12} color={Colors.steelGrey} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.opInfoRow}>
              <Text style={styles.opInfoLabel}>APPAREILS LIÉS</Text>
              <Text style={styles.opInfoValue}>{devices.length}</Text>
            </View>
            <View style={styles.opInfoRow}>
              <Text style={styles.opInfoLabel}>PREUVES ÉMISES</Text>
              <Text style={styles.opInfoValue}>{certifiedRepairs}</Text>
            </View>
          </View>

          <View style={styles.opNoteBorder}>
            <Feather name="lock" size={11} color={Colors.steelGrey} />
            <Text style={styles.opNoteText}>
              {' '}Votre wallet est sécurisé et géré automatiquement par ObjectPass.
            </Text>
          </View>
        </View>
      </View>

      {/* ── PARAMÈTRES ───────────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionPad}>
          <SectionHeader title="PARAMÈTRES" />
        </View>
        <View style={styles.settingsCard}>
          {SETTINGS.map((row, i) => (
            <SettingsRow
              key={row.label}
              {...row}
              isLast={i === SETTINGS.length - 1}
            />
          ))}
        </View>
      </View>

      {/* ── LOGOUT ───────────────────────────────────────────────────── */}
      <View style={styles.logoutWrapper}>
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.7}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={16} color={Colors.faultCoral} style={{ marginRight: 8 }} />
          <Text style={styles.logoutLabel}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <Text style={styles.footerVersion}>ObjectPass · v0.1.0</Text>
        <Text style={styles.footerTagline}>Le carnet de santé de vos appareils numériques</Text>
        <View style={styles.footerDot} />
      </View>
    </ScrollView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const MONO = Platform.OS === 'ios' ? 'Courier' : 'monospace';

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: Colors.cleanWhite,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // ── Hero ────────────────────────────────────────────────────────────

  hero: {
    backgroundColor: Colors.objectNavy,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#123D45',
    opacity: 0.28,
  },

  // Avatar
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.objectNavy,
    borderWidth: 2,
    borderColor: Colors.repairTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.repairTeal,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.repairTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Identity
  heroName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.cleanWhite,
    textAlign: 'center',
    marginTop: 16,
  },
  heroEmail: {
    fontSize: 14,
    color: Colors.steelGrey,
    textAlign: 'center',
    marginTop: 4,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.cleanWhite,
  },

  // Stats strip
  statsStrip: {
    flexDirection: 'row',
    marginTop: 24,
    width: '100%',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.cleanWhite,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.steelGrey,
    marginTop: 2,
    textAlign: 'center',
  },

  // ── Section layout ───────────────────────────────────────────────────

  section: {
    marginTop: 28,
  },
  sectionPad: {
    marginHorizontal: 20,
  },

  // ── Mini device cards ────────────────────────────────────────────────

  devicesScroll: {
    paddingLeft: 20,
    paddingRight: 8,
    gap: 12,
    alignItems: 'flex-start',
  },
  miniCard: {
    width: 140,
    backgroundColor: Colors.paperSage,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  miniEmoji: {
    fontSize: 32,
    textAlign: 'center',
  },
  miniName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.graphite,
    textAlign: 'center',
    marginTop: 8,
  },
  miniBadgeWrapper: {
    alignItems: 'center',
    marginTop: 8,
  },
  miniStatus: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  addCard: {
    width: 140,
    minHeight: 140,
    backgroundColor: Colors.paperSage,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCardLabel: {
    fontSize: 12,
    color: Colors.repairTeal,
    marginTop: 6,
  },

  // ── Activity ─────────────────────────────────────────────────────────

  activityList: {
    marginHorizontal: 20,
    gap: 8,
  },
  activityItem: {
    backgroundColor: Colors.cleanWhite,
    borderWidth: 1,
    borderColor: Colors.borderMist,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    marginLeft: 12,
    flex: 1,
  },
  activityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.graphite,
  },
  activityDevice: {
    fontSize: 12,
    color: Colors.steelGrey,
    marginTop: 2,
  },
  activityDate: {
    fontSize: 11,
    color: Colors.steelGrey,
    marginTop: 2,
  },

  // ── ObjectPass card ──────────────────────────────────────────────────

  opCard: {
    marginHorizontal: 20,
    backgroundColor: '#EEF1FF',
    borderWidth: 1.5,
    borderColor: 'rgba(36,95,255,0.13)',
    borderRadius: 16,
    padding: 20,
  },
  opTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  opTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  opTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.proofBlue,
    marginLeft: 8,
  },
  activePill: {
    backgroundColor: Colors.warrantyGreen + '1A',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activePillText: {
    fontSize: 11,
    color: Colors.warrantyGreen,
    fontWeight: '600',
  },
  opInfoRows: {
    marginTop: 16,
    gap: 10,
  },
  opInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  opInfoLabel: {
    fontSize: 11,
    color: Colors.steelGrey,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  opInfoValue: {
    fontSize: 12,
    color: Colors.graphite,
    fontWeight: '600',
    textAlign: 'right',
  },
  mono: {
    fontFamily: MONO,
    color: Colors.steelGrey,
    fontWeight: '400',
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copyBtn: {
    padding: 2,
  },
  opNoteBorder: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(36,95,255,0.13)',
  },
  opNoteText: {
    fontSize: 11,
    color: Colors.steelGrey,
    fontStyle: 'italic',
    lineHeight: 16,
    flex: 1,
  },

  // ── Settings ─────────────────────────────────────────────────────────

  settingsCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.cleanWhite,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
    overflow: 'hidden',
  },
  settingsRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderMist,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.paperSage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    fontSize: 14,
    color: Colors.graphite,
    marginLeft: 12,
  },

  // ── Logout ───────────────────────────────────────────────────────────

  logoutWrapper: {
    marginHorizontal: 20,
    marginTop: 8,
  },
  logoutBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.faultCoral,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.faultCoral,
  },

  // ── Footer ───────────────────────────────────────────────────────────

  footer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  footerVersion: {
    fontSize: 11,
    color: Colors.steelGrey,
  },
  footerTagline: {
    fontSize: 11,
    color: Colors.steelGrey,
    marginTop: 4,
    textAlign: 'center',
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.repairTeal,
    marginTop: 12,
  },
});
