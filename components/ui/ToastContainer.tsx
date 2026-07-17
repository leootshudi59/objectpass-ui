import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useToast, type ToastEntry, type ToastType } from '../../context/ToastContext';

// ── Per-type visual tokens ─────────────────────────────────────────────────────

const BG_COLOR: Record<ToastType, string> = {
  success: Colors.objectNavy,
  error:   Colors.faultCoral,
  info:    Colors.objectNavy,
  warning: Colors.diagnosticAmber,
};

const TEXT_COLOR: Record<ToastType, string> = {
  success: Colors.cleanWhite,
  error:   Colors.cleanWhite,
  info:    Colors.cleanWhite,
  warning: Colors.graphite,
};

const ICON_COLOR: Record<ToastType, string> = {
  success: Colors.repairTeal,
  error:   Colors.cleanWhite,
  info:    Colors.proofBlue,
  warning: Colors.graphite,
};

const ICON_NAME: Record<ToastType, React.ComponentProps<typeof Feather>['name']> = {
  success: 'check-circle',
  error:   'alert-circle',
  info:    'info',
  warning: 'alert-triangle',
};

// ── Toast item with enter/exit animation ──────────────────────────────────────

function ToastItem({ toast }: { toast: ToastEntry }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  // Enter animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  // Exit animation when context signals removal
  useEffect(() => {
    if (!toast.removing) return;
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 20, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [toast.removing, opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.item,
        {
          backgroundColor: BG_COLOR[toast.type],
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Feather
        name={ICON_NAME[toast.type]}
        size={16}
        color={ICON_COLOR[toast.type]}
        style={styles.icon}
      />
      <Text style={[styles.message, { color: TEXT_COLOR[toast.type] }]} numberOfLines={3}>
        {toast.message}
      </Text>
    </Animated.View>
  );
}

// ── Container ─────────────────────────────────────────────────────────────────

export function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position:  'absolute',
    bottom:    90,
    left:      16,
    right:     16,
    zIndex:    9999,
    gap:       8,
  },
  item: {
    flexDirection:  'row',
    alignItems:     'center',
    borderRadius:   12,
    paddingHorizontal: 16,
    paddingVertical:   12,
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 4 },
    shadowOpacity:  0.18,
    shadowRadius:   8,
    elevation:      8,
  },
  icon: {
    marginRight: 10,
    flexShrink:  0,
  },
  message: {
    flex:       1,
    fontSize:   14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
