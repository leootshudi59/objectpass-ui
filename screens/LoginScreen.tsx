import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

type LoginMethod = 'email' | 'google' | 'apple';

// ── Small social button ────────────────────────────────────────────────────────

interface SocialBtnProps {
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  textColor: string;
  spinnerColor: string;
  containerStyle: StyleProp<ViewStyle>;
  onPress: () => void;
}

function SocialBtn({ icon, label, loading, textColor, spinnerColor, containerStyle, onPress }: SocialBtnProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [styles.socialBtn, containerStyle, pressed && { opacity: 0.8 }]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <>
          {icon}
          <Text style={[styles.socialBtnLabel, { color: textColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export function LoginScreen() {
  const { login } = useAuth();
  const navigation = useNavigation<Nav>();

  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [showPassword, setShowPassword]     = useState(false);
  const [emailFocused, setEmailFocused]     = useState(false);
  const [pwFocused, setPwFocused]           = useState(false);
  const [loadingBtn, setLoadingBtn]         = useState<LoginMethod | null>(null);

  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async (method: LoginMethod) => {
    if (loadingBtn) return;
    setLoadingBtn(method);
    await new Promise<void>((r) => setTimeout(r, 1200));
    await login(MOCK_USER);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Back ──────────────────────────────────────────────── */}
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={12}
          >
            <Feather name="arrow-left" size={22} color={Colors.objectNavy} />
          </Pressable>

          {/* ── Header ────────────────────────────────────────────── */}
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>Accédez à votre espace ObjectPass</Text>

          {/* ── Email field ───────────────────────────────────────── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>ADRESSE EMAIL</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              onSubmitEditing={() => passwordRef.current?.focus()}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              blurOnSubmit={false}
              placeholder="vous@exemple.com"
              placeholderTextColor={Colors.steelGrey}
              style={[styles.input, emailFocused && styles.inputFocused]}
            />
          </View>

          {/* ── Password field ────────────────────────────────────── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>MOT DE PASSE</Text>
            <View style={[styles.inputWrap, pwFocused && styles.inputWrapFocused]}>
              <TextInput
                ref={passwordRef}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                blurOnSubmit
                placeholder="••••••••"
                placeholderTextColor={Colors.steelGrey}
                style={styles.inputInner}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color={Colors.steelGrey}
                />
              </Pressable>
            </View>
          </View>

          {/* Forgot */}
          <Text style={styles.forgot}>Mot de passe oublié ?</Text>

          {/* ── Primary CTA ───────────────────────────────────────── */}
          <Pressable
            onPress={() => handleLogin('email')}
            disabled={!!loadingBtn}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
          >
            {loadingBtn === 'email' ? (
              <>
                <ActivityIndicator size="small" color={Colors.cleanWhite} />
                <Text style={styles.primaryBtnLabel}>Connexion...</Text>
              </>
            ) : (
              <Text style={styles.primaryBtnLabel}>Se connecter</Text>
            )}
          </Pressable>

          {/* ── Separator ─────────────────────────────────────────── */}
          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>ou</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* ── Social buttons ────────────────────────────────────── */}
          <View style={styles.socialRow}>
            <SocialBtn
              icon={<Ionicons name="logo-google" size={18} color="#EA4335" />}
              label="Google"
              loading={loadingBtn === 'google'}
              textColor={Colors.graphite}
              spinnerColor={Colors.graphite}
              containerStyle={styles.socialBtnGoogle}
              onPress={() => handleLogin('google')}
            />
            <SocialBtn
              icon={<Ionicons name="logo-apple" size={18} color={Colors.cleanWhite} />}
              label="Apple"
              loading={loadingBtn === 'apple'}
              textColor={Colors.cleanWhite}
              spinnerColor={Colors.cleanWhite}
              containerStyle={styles.socialBtnApple}
              onPress={() => handleLogin('apple')}
            />
          </View>

          {/* ── Register link ─────────────────────────────────────── */}
          <Text style={styles.registerText}>
            Pas encore de compte ?{'  '}
            <Text style={styles.registerLink} onPress={() => navigation.goBack()}>
              Créer mon ObjectPass
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cleanWhite,
  },
  kav: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  backBtn: {
    marginTop: 16,
    marginBottom: 28,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.graphite,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.steelGrey,
    marginBottom: 32,
  },

  // Field
  fieldGroup: {
    marginBottom: 16,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.steelGrey,
    letterSpacing: 1,
  },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.graphite,
    backgroundColor: Colors.cleanWhite,
  },
  inputFocused: {
    borderColor: Colors.repairTeal,
    borderWidth: 2,
  },

  // Password field with eye toggle
  inputWrap: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cleanWhite,
  },
  inputWrapFocused: {
    borderColor: Colors.repairTeal,
    borderWidth: 2,
  },
  inputInner: {
    flex: 1,
    fontSize: 16,
    color: Colors.graphite,
    height: '100%',
  },

  forgot: {
    fontSize: 13,
    color: Colors.repairTeal,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 24,
  },

  // Primary button
  primaryBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.repairTeal,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  primaryBtnLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.cleanWhite,
    letterSpacing: 0.1,
  },

  // Separator
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderMist,
  },
  separatorText: {
    fontSize: 13,
    color: Colors.steelGrey,
    fontWeight: '500',
  },

  // Social buttons
  socialRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  socialBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialBtnLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  socialBtnGoogle: {
    backgroundColor: Colors.cleanWhite,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
  },
  socialBtnApple: {
    backgroundColor: Colors.objectNavy,
  },

  // Register link
  registerText: {
    fontSize: 14,
    color: Colors.steelGrey,
    textAlign: 'center',
  },
  registerLink: {
    color: Colors.repairTeal,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
