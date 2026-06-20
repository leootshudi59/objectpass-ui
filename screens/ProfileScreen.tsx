import React from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

// ── Info row ───────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Feather name={icon as any} size={15} color={Colors.steelGrey} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <View style={styles.infoRight}>
        <Text style={styles.infoValue}>{value}</Text>
        <Feather name="chevron-right" size={14} color={Colors.borderMist} />
      </View>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export function ProfileScreen() {
  const { state, logout } = useAuth();
  const user = state.user;
  const initial = user?.name?.[0]?.toUpperCase() ?? 'O';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Profil</Text>

        {/* ── Avatar card ─────────────────────────────────────────── */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <Text style={styles.userName}>{user?.name ?? '—'}</Text>
          <Text style={styles.userEmail}>{user?.email ?? '—'}</Text>
        </View>

        {/* ── Account section ─────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MON COMPTE</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="shield" label="Vérification identité" value="Non effectuée" />
            <View style={styles.divider} />
            <InfoRow icon="bell" label="Notifications" value="Activées" />
            <View style={styles.divider} />
            <InfoRow icon="lock" label="Sécurité" value="Mot de passe" />
          </View>
        </View>

        {/* ── Logout ──────────────────────────────────────────────── */}
        <Pressable
          onPress={logout}
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
        >
          <Feather name="log-out" size={16} color={Colors.faultCoral} />
          <Text style={styles.logoutLabel}>Se déconnecter</Text>
        </Pressable>
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
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.graphite,
    letterSpacing: -0.5,
    marginTop: 16,
    marginBottom: 20,
  },

  // Profile card
  profileCard: {
    backgroundColor: Colors.paperSage,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderMist,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 6,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.objectNavy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.repairTeal,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.graphite,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.steelGrey,
  },

  // Account section
  section: {
    marginBottom: 28,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.steelGrey,
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: Colors.paperSage,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderMist,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.graphite,
    fontWeight: '500',
  },
  infoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoValue: {
    fontSize: 13,
    color: Colors.steelGrey,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderMist,
    marginHorizontal: 16,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.faultCoral,
    borderRadius: 12,
    paddingVertical: 14,
  },
  logoutBtnPressed: {
    opacity: 0.75,
  },
  logoutLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.faultCoral,
  },
});
