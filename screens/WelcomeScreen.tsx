import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import type { AuthStackParamList } from '../navigation/AuthNavigator';

type Nav = NavigationProp<AuthStackParamList>;

const MOCK_USER = { name: 'Léo Otshudi', email: 'leo@objectpass.io', avatar: null };

type AuthMethod = 'google' | 'apple' | 'email';

// ── Auth button ────────────────────────────────────────────────────────────────

interface AuthButtonProps {
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  containerStyle: StyleProp<ViewStyle>;
  labelColor: string;
  spinnerColor: string;
  onPress: () => void;
}

function AuthButton({ icon, label, loading, containerStyle, labelColor, spinnerColor, onPress }: AuthButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [styles.authBtn, containerStyle, pressed && styles.authBtnPressed]}
    >
      {loading ? (
        <>
          <ActivityIndicator size="small" color={spinnerColor} style={styles.spinner} />
          <Text style={[styles.authBtnLabel, { color: labelColor }]}>Connexion...</Text>
        </>
      ) : (
        <>
          <View style={styles.authBtnIcon}>{icon}</View>
          <Text style={[styles.authBtnLabel, { color: labelColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export function WelcomeScreen() {
  const { login } = useAuth();
  const navigation = useNavigation<Nav>();
  const [loadingBtn, setLoadingBtn] = useState<AuthMethod | null>(null);

  const handleAuth = async (method: AuthMethod) => {
    if (loadingBtn) return;
    setLoadingBtn(method);
    await new Promise<void>((r) => setTimeout(r, 1200));
    await login(MOCK_USER);
    // AuthGate automatically switches to MainNavigator on state change
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo section ─────────────────────────────────────────── */}
        <View style={styles.logoSection}>
          <View style={styles.logoBlock}>
            <Text style={styles.logoOP}>OP</Text>
          </View>
          <Text style={styles.appName}>ObjectPass</Text>
          <Text style={styles.tagline}>
            Le carnet de santé de vos appareils numériques
          </Text>
        </View>

        {/* ── Auth buttons ─────────────────────────────────────────── */}
        <View style={styles.buttons}>
          <AuthButton
            icon={<Ionicons name="logo-google" size={20} color="#EA4335" />}
            label="Continuer avec Google"
            loading={loadingBtn === 'google'}
            containerStyle={styles.btnGoogle}
            labelColor={Colors.graphite}
            spinnerColor={Colors.graphite}
            onPress={() => handleAuth('google')}
          />
          <AuthButton
            icon={<Ionicons name="logo-apple" size={20} color={Colors.cleanWhite} />}
            label="Continuer avec Apple"
            loading={loadingBtn === 'apple'}
            containerStyle={styles.btnApple}
            labelColor={Colors.cleanWhite}
            spinnerColor={Colors.cleanWhite}
            onPress={() => handleAuth('apple')}
          />
          <AuthButton
            icon={<Feather name="mail" size={20} color={Colors.repairTeal} />}
            label="Continuer avec email"
            loading={loadingBtn === 'email'}
            containerStyle={styles.btnEmail}
            labelColor={Colors.graphite}
            spinnerColor={Colors.repairTeal}
            onPress={() => handleAuth('email')}
          />
        </View>

        {/* ── Bottom ───────────────────────────────────────────────── */}
        <View style={styles.bottom}>
          <Text style={styles.loginRow}>
            Déjà un compte ?{'  '}
            <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
              Se connecter
            </Text>
          </Text>
          <Text style={styles.legal}>
            En continuant, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité.{'\n'}
            Votre wallet est créé automatiquement et sécurisé.
          </Text>
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
  scroll: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 32,
  },

  // Logo section
  logoSection: {
    alignItems: 'center',
    paddingTop: 72,
    paddingBottom: 48,
    paddingHorizontal: 32,
  },
  logoBlock: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.objectNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoOP: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.repairTeal,
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.graphite,
    marginTop: 16,
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 15,
    color: Colors.steelGrey,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 22,
    marginTop: 8,
  },

  // Buttons
  buttons: {
    paddingHorizontal: 24,
    gap: 12,
  },
  authBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 12,
  },
  authBtnPressed: {
    opacity: 0.82,
  },
  authBtnIcon: {
    width: 24,
    alignItems: 'center',
  },
  authBtnLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  spinner: {
    width: 24,
  },
  btnGoogle: {
    backgroundColor: Colors.cleanWhite,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  btnApple: {
    backgroundColor: Colors.objectNavy,
  },
  btnEmail: {
    backgroundColor: Colors.paperSage,
  },

  // Bottom
  bottom: {
    paddingHorizontal: 24,
    paddingTop: 28,
    alignItems: 'center',
    gap: 14,
  },
  loginRow: {
    fontSize: 14,
    color: Colors.steelGrey,
  },
  loginLink: {
    color: Colors.repairTeal,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  legal: {
    fontSize: 11,
    color: Colors.steelGrey,
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 300,
  },
});
