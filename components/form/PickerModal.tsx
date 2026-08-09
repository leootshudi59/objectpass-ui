import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface Props {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}

export function PickerModal({ visible, title, options, selected, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>{title}</Text>
        <FlatList
          data={options}
          keyExtractor={(item) => item}
          style={{ maxHeight: 320 }}
          renderItem={({ item }) => {
            const active = selected === item;
            return (
              <Pressable
                onPress={() => { onSelect(item); onClose(); }}
                style={styles.option}
              >
                {active && <Feather name="check" size={16} color={Colors.repairTeal} style={{ marginRight: 8 }} />}
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{item}</Text>
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:           { backgroundColor: Colors.cleanWhite, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  handle:          { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.borderMist, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:      { fontSize: 17, fontWeight: '700', color: Colors.graphite, marginBottom: 12 },
  option:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderMist },
  optionText:      { fontSize: 15, color: Colors.graphite },
  optionTextActive:{ color: Colors.repairTeal, fontWeight: '700' },
});
