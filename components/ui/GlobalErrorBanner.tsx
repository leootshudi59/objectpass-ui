import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAppState } from '../../context/AppStateContext';

const TRANSLATE_HIDDEN = -120;
const AUTO_DISMISS_MS = 5000;

export function GlobalErrorBanner() {
  const { error, clearError } = useAppState();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(TRANSLATE_HIDDEN)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [shown, setShown] = useState(false);

  function dismiss() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Animated.timing(translateY, {
      toValue: TRANSLATE_HIDDEN,
      duration: 250,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setShown(false);
        clearError();
      }
    });
  }

  useEffect(() => {
    if (!error) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    setShown(true);
    translateY.stopAnimation();
    translateY.setValue(TRANSLATE_HIDDEN);

    Animated.timing(translateY, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start();

    timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);
  }, [error]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!shown) return null;

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
      <View style={{ height: insets.top }} />
      <View style={styles.content}>
        <Feather name="alert-circle" size={18} color={Colors.cleanWhite} style={styles.icon} />
        <Text style={styles.text} numberOfLines={2}>{error}</Text>
        <Pressable onPress={dismiss} hitSlop={8}>
          <Feather name="x" size={18} color={Colors.cleanWhite} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.faultCoral,
    zIndex: 10000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  icon: {
    marginRight: 10,
    flexShrink: 0,
  },
  text: {
    color: Colors.cleanWhite,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});
