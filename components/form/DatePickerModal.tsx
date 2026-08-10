import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { FULL_MONTHS_FR, YEARS } from '../../constants/deviceForm';

interface Props {
  visible: boolean;
  title?: string;
  value: Date | null;
  onChange: (d: Date) => void;
  onClose: () => void;
}

export function DatePickerModal({ visible, title = "Date d'achat", value, onChange, onClose }: Props) {
  const today = new Date();
  const [selDay,   setSelDay]   = useState(value?.getDate()     ?? today.getDate());
  const [selMonth, setSelMonth] = useState(value?.getMonth()    ?? today.getMonth());
  const [selYear,  setSelYear]  = useState(value?.getFullYear() ?? today.getFullYear());

  const maxDay = new Date(selYear, selMonth + 1, 0).getDate();
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  const confirm = () => {
    const d = Math.min(selDay, maxDay);
    onChange(new Date(selYear, selMonth, d));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>{title}</Text>

        <View style={styles.columns}>
          <ScrollView style={styles.col} showsVerticalScrollIndicator={false}>
            {days.map((d) => (
              <Pressable key={d} onPress={() => setSelDay(d)}
                style={[styles.colItem, selDay === d && styles.colItemActive]}>
                <Text style={[styles.colText, selDay === d && styles.colTextActive]}>{d}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <ScrollView style={[styles.col, { flex: 2 }]} showsVerticalScrollIndicator={false}>
            {FULL_MONTHS_FR.map((m, i) => (
              <Pressable key={m} onPress={() => setSelMonth(i)}
                style={[styles.colItem, selMonth === i && styles.colItemActive]}>
                <Text style={[styles.colText, selMonth === i && styles.colTextActive]}>{m}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <ScrollView style={styles.col} showsVerticalScrollIndicator={false}>
            {YEARS.map((y) => (
              <Pressable key={y} onPress={() => setSelYear(y)}
                style={[styles.colItem, selYear === y && styles.colItemActive]}>
                <Text style={[styles.colText, selYear === y && styles.colTextActive]}>{y}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <Pressable onPress={confirm} style={styles.confirmBtn}>
          <Text style={styles.confirmLabel}>Valider</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:        { backgroundColor: Colors.cleanWhite, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  handle:       { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.borderMist, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:   { fontSize: 17, fontWeight: '700', color: Colors.graphite, marginBottom: 12 },
  columns:      { flexDirection: 'row', height: 220, gap: 4, marginBottom: 16 },
  col:          { flex: 1 },
  colItem:      { paddingVertical: 10, paddingHorizontal: 6, borderRadius: 8, marginBottom: 2, alignItems: 'center' },
  colItemActive:{ backgroundColor: Colors.objectNavy },
  colText:      { fontSize: 15, color: Colors.graphite, textAlign: 'center' },
  colTextActive:{ color: Colors.cleanWhite, fontWeight: '700' },
  confirmBtn:   { backgroundColor: Colors.repairTeal, borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center' },
  confirmLabel: { fontSize: 16, fontWeight: '700', color: Colors.cleanWhite },
});
