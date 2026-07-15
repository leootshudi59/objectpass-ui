import React from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { OutlineButton, PrimaryButton } from '../components/ui';

type Params = { deviceId: string; name: string; serialNumber?: string };

export function QRCodeModal() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { name, serialNumber } = route.params as Params;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: (insets.bottom || 0) + 20 }]}>
      {/* Close */}
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Feather name="x" size={22} color={Colors.steelGrey} />
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.title}>QR Code ObjectPass</Text>
      <Text style={styles.subtitle}>{name}</Text>

      {/* QR placeholder */}
      <View style={styles.qrZone}>
        <Feather name="grid" size={60} color={Colors.steelGrey} />
        <Text style={styles.qrText}>QR Code{'\n'}{serialNumber ?? 'S/N : —'}</Text>
      </View>

      {/* Proof badge */}
      <View style={styles.proofBadge}>
        <Text style={styles.proofText}>✓ Preuve vérifiable ObjectPass</Text>
      </View>

      {/* Caption */}
      <Text style={styles.caption}>
        Scannez ce code pour accéder à l'historique vérifié de cet appareil.
      </Text>

      {/* Buttons */}
      <View style={styles.buttonsRow}>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            label="Partager"
            onPress={() => Alert.alert('Partager', 'Fonctionnalité bientôt disponible')}
            fullWidth
          />
        </View>
        <View style={{ flex: 1 }}>
          <OutlineButton
            label="Télécharger"
            onPress={() => Alert.alert('Télécharger', 'Fonctionnalité bientôt disponible')}
            fullWidth
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cleanWhite,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.graphite,
    marginTop: 32,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.steelGrey,
    marginTop: 4,
  },
  qrZone: {
    width: 200,
    height: 200,
    backgroundColor: Colors.paperSage,
    borderRadius: 16,
    marginTop: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  qrText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.steelGrey,
    textAlign: 'center',
  },
  proofBadge: {
    backgroundColor: Colors.proofBlue + '18',
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 20,
  },
  proofText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.proofBlue,
  },
  caption: {
    fontSize: 12,
    color: Colors.steelGrey,
    textAlign: 'center',
    maxWidth: 240,
    marginTop: 12,
    lineHeight: 18,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 28,
    width: '100%',
  },
});
