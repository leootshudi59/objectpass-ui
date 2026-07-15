import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { useDevices } from '../context/DevicesContext';
import type { DeviceEntry } from '../context/DevicesContext';

// ── Constants ──────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5;
const { width: SCREEN_W } = Dimensions.get('window');
const PROGRESS_W = SCREEN_W - 40;

const CATEGORIES = [
  { id: 'laptop',  label: 'Ordinateur',       emoji: '💻' },
  { id: 'phone',   label: 'Smartphone',        emoji: '📱' },
  { id: 'tablet',  label: 'Tablette',          emoji: '🖥️' },
  { id: 'console', label: 'Console',           emoji: '🎮' },
  { id: 'ebike',   label: 'Vélo électrique',   emoji: '🚲' },
  { id: 'other',   label: 'Autre',             emoji: '🖨️' },
];

const BRANDS = ['Apple', 'Samsung', 'Lenovo', 'Dell', 'HP', 'Cowboy', 'VanMoof', 'Sony', 'Microsoft', 'Autre'];

const MODELS_BY_BRAND: Record<string, string[]> = {
  Apple:     ['MacBook Pro M1', 'MacBook Air M2', 'iPhone 15 Pro', 'iPhone 14', 'iPad Pro', 'Apple Watch'],
  Samsung:   ['Galaxy S24', 'Galaxy Tab S9', 'Galaxy Book'],
  Lenovo:    ['ThinkPad X1 Carbon', 'IdeaPad 5', 'Legion 5'],
  Dell:      ['XPS 15', 'Inspiron 15', 'Latitude 14'],
  HP:        ['Spectre x360', 'Pavilion 15', 'EliteBook 840'],
  Cowboy:    ['C5', 'C4', 'C3'],
  VanMoof:   ['S5', 'A5', 'S3'],
  Sony:      ['PS5', 'WH-1000XM5', 'Xperia 1 V'],
  Microsoft: ['Surface Pro 9', 'Surface Laptop 5', 'Xbox Series X'],
  Autre:     ['Autre modèle'],
};

const MONTHS_FR = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
const FULL_MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const YEARS = Array.from({ length: 11 }, (_, i) => 2015 + i);

const COLORS_LIST = [
  { name: 'Space Grey',  hex: '#6B7C80' },
  { name: 'Silver',      hex: '#C0C0C0' },
  { name: 'Midnight',    hex: '#1C2526' },
  { name: 'Starlight',   hex: '#F2E6D4' },
  { name: 'Gold',        hex: '#D4AF37' },
  { name: 'Blue',        hex: '#2D5BE3' },
  { name: 'Green',       hex: '#2EB872' },
  { name: 'Rouge',       hex: '#E85D5D' },
];

const WARRANTY_OPTIONS = [
  { id: '1',     label: '1 an' },
  { id: '2',     label: '2 ans' },
  { id: 'other', label: 'Autre' },
];

// ── Generic picker modal ───────────────────────────────────────────────────────

function PickerModal({
  visible, title, options, selected, onSelect, onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <Pressable style={pm.overlay} onPress={onClose} />
      <View style={pm.sheet}>
        <View style={pm.handle} />
        <Text style={pm.sheetTitle}>{title}</Text>
        <FlatList
          data={options}
          keyExtractor={(item) => item}
          style={{ maxHeight: 320 }}
          renderItem={({ item }) => {
            const active = selected === item;
            return (
              <Pressable
                onPress={() => { onSelect(item); onClose(); }}
                style={[pm.option, active && pm.optionActive]}
              >
                {active && <Feather name="check" size={16} color={Colors.repairTeal} style={{ marginRight: 8 }} />}
                <Text style={[pm.optionText, active && pm.optionTextActive]}>{item}</Text>
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:          { backgroundColor: Colors.cleanWhite, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  handle:         { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.borderMist, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:     { fontSize: 17, fontWeight: '700', color: Colors.graphite, marginBottom: 12 },
  option:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderMist },
  optionActive:   { },
  optionText:     { fontSize: 15, color: Colors.graphite },
  optionTextActive: { color: Colors.repairTeal, fontWeight: '700' },
});

// ── Date picker modal ──────────────────────────────────────────────────────────

function DatePickerModal({
  visible, value, onChange, onClose,
}: {
  visible: boolean;
  value: Date | null;
  onChange: (d: Date) => void;
  onClose: () => void;
}) {
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
      <Pressable style={pm.overlay} onPress={onClose} />
      <View style={dp.sheet}>
        <View style={pm.handle} />
        <Text style={pm.sheetTitle}>Date d'achat</Text>

        <View style={dp.columns}>
          {/* Day */}
          <ScrollView style={dp.col} showsVerticalScrollIndicator={false}>
            {days.map((d) => (
              <Pressable key={d} onPress={() => setSelDay(d)}
                style={[dp.colItem, selDay === d && dp.colItemActive]}>
                <Text style={[dp.colText, selDay === d && dp.colTextActive]}>{d}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {/* Month */}
          <ScrollView style={[dp.col, { flex: 2 }]} showsVerticalScrollIndicator={false}>
            {FULL_MONTHS_FR.map((m, i) => (
              <Pressable key={m} onPress={() => setSelMonth(i)}
                style={[dp.colItem, selMonth === i && dp.colItemActive]}>
                <Text style={[dp.colText, selMonth === i && dp.colTextActive]}>{m}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {/* Year */}
          <ScrollView style={dp.col} showsVerticalScrollIndicator={false}>
            {YEARS.map((y) => (
              <Pressable key={y} onPress={() => setSelYear(y)}
                style={[dp.colItem, selYear === y && dp.colItemActive]}>
                <Text style={[dp.colText, selYear === y && dp.colTextActive]}>{y}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <Pressable onPress={confirm} style={dp.confirmBtn}>
          <Text style={dp.confirmLabel}>Valider</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const dp = StyleSheet.create({
  sheet:         { backgroundColor: Colors.cleanWhite, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  columns:       { flexDirection: 'row', height: 220, gap: 4, marginBottom: 16 },
  col:           { flex: 1 },
  colItem:       { paddingVertical: 10, paddingHorizontal: 6, borderRadius: 8, marginBottom: 2, alignItems: 'center' },
  colItemActive: { backgroundColor: Colors.objectNavy },
  colText:       { fontSize: 15, color: Colors.graphite, textAlign: 'center' },
  colTextActive: { color: Colors.cleanWhite, fontWeight: '700' },
  confirmBtn:    { backgroundColor: Colors.repairTeal, borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center' },
  confirmLabel:  { fontSize: 16, fontWeight: '700', color: Colors.cleanWhite },
});

// ── Scanner overlay ────────────────────────────────────────────────────────────

function ScannerOverlay() {
  return (
    <View style={sc.overlay}>
      <View style={sc.frame} />
      <Text style={sc.text}>Pointez vers le code</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  frame:   { width: 220, height: 220, borderWidth: 2.5, borderColor: Colors.cleanWhite, borderRadius: 12 },
  text:    { marginTop: 24, fontSize: 16, color: Colors.cleanWhite, fontWeight: '600' },
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')} ${FULL_MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

function getWarrantyMonths(option: string, custom: string): number {
  if (option === '1') return 12;
  if (option === '2') return 24;
  if (option === 'other') return parseInt(custom) || 0;
  return 0;
}

function computeWarranty(purchaseDate: Date, months: number): { active: boolean; expiry: string | null } {
  if (months === 0) return { active: false, expiry: null };
  const exp = new Date(purchaseDate);
  exp.setMonth(exp.getMonth() + months);
  return {
    active: exp > new Date(),
    expiry: `${MONTHS_FR[exp.getMonth()]} ${exp.getFullYear()}`,
  };
}

function mapCategory(cat: string): DeviceEntry['category'] {
  if (cat === 'laptop')  return 'laptop';
  if (cat === 'phone')   return 'phone';
  if (cat === 'tablet')  return 'tablet';
  if (cat === 'ebike')   return 'ebike';
  return 'other';
}

// ── Main screen ────────────────────────────────────────────────────────────────

export function AddDeviceScreen() {
  const navigation = useNavigation<any>();
  const { addDevice } = useDevices();

  // Step state
  const [step, setStep] = useState(1);
  const slideAnim  = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(PROGRESS_W / TOTAL_STEPS)).current;

  // Wizard data
  const [method,         setMethod]         = useState<'scan' | 'serial' | 'catalogue' | null>(null);
  const [serialNumber,   setSerialNumber]   = useState('');
  const [category,       setCategory]       = useState('');
  const [catalogueBrand, setCatalogueBrand] = useState('');
  const [catalogueModel, setCatalogueModel] = useState('');
  const [purchaseDate,   setPurchaseDate]   = useState<Date | null>(null);
  const [purchasePrice,  setPurchasePrice]  = useState('');
  const [purchasePlace,  setPurchasePlace]  = useState('');
  const [warrantyOpt,    setWarrantyOpt]    = useState('');
  const [warrantyCustom, setWarrantyCustom] = useState('');
  const [hasInvoice,     setHasInvoice]     = useState(false);
  const [deviceName,     setDeviceName]     = useState('');
  const [photoEmoji,     setPhotoEmoji]     = useState('');
  const [selectedColor,  setSelectedColor]  = useState('');
  const [loading,        setLoading]        = useState(false);

  // UI toggles
  const [showScanner,     setShowScanner]     = useState(false);
  const [showBrandPicker, setShowBrandPicker] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showDatePicker,  setShowDatePicker]  = useState(false);
  const [showHints,       setShowHints]       = useState(false);

  // Progress bar animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (step / TOTAL_STEPS) * PROGRESS_W,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step]);

  // ── Navigation helpers ─────────────────────────────────────────────────────

  const goToStep = (next: number) => {
    const forward = next > step;
    Animated.timing(slideAnim, {
      toValue: forward ? -SCREEN_W : SCREEN_W,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setStep(next);
      slideAnim.setValue(forward ? SCREEN_W : -SCREEN_W);
      Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start();
    });
  };

  const handleClose = () => {
    Alert.alert(
      "Abandonner l'ajout ?",
      'Vos informations seront perdues.',
      [
        { text: 'Continuer', style: 'cancel' },
        { text: 'Abandonner', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  // ── Step validity ──────────────────────────────────────────────────────────

  const isValid = (s: number): boolean => {
    switch (s) {
      case 1: return method !== null;
      case 2: return serialNumber.trim().length > 0 && category.length > 0;
      case 3: return purchaseDate !== null;
      case 4: return deviceName.trim().length > 0;
      case 5: return true;
      default: return false;
    }
  };

  // ── Method selection ───────────────────────────────────────────────────────

  const handleMethodSelect = (m: 'scan' | 'serial' | 'catalogue') => {
    setMethod(m);
    if (m === 'scan') {
      setShowScanner(true);
      setTimeout(() => {
        setShowScanner(false);
        setSerialNumber('SN-MBP-2022-A1234');
        setDeviceName('MacBook Pro M1');
        setCategory('laptop');
        goToStep(2);
      }, 2000);
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      goToStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      const months = getWarrantyMonths(warrantyOpt, warrantyCustom);
      const { active: warrantyActive, expiry: warrantyExpiry } =
        purchaseDate ? computeWarranty(purchaseDate, months) : { active: false, expiry: null };

      const catEmoji = CATEGORIES.find((c) => c.id === category)?.emoji ?? '📦';

      const newDevice: DeviceEntry = {
        id:              Date.now().toString(),
        name:            deviceName.trim(),
        model:           catalogueModel || serialNumber,
        category:        mapCategory(category),
        healthScore:     0,
        status:          'bon',
        lastRepairDate:  null,
        warrantyActive,
        warrantyExpiry,
        repairs:         [],
        battery:         100,
        screen:          100,
        storage:         100,
        serialNumber:    serialNumber,
        purchaseDate:    purchaseDate ? formatDate(purchaseDate) : undefined,
        purchasePrice:   purchasePrice || undefined,
        purchasePlace:   purchasePlace || undefined,
        warrantyMonths:  months || undefined,
        hasInvoice,
        color:           selectedColor || undefined,
        createdAt:       new Date().toISOString(),
      };

      addDevice(newDevice);
      setLoading(false);
      navigation.goBack();
    }, 1500);
  };

  // ── Catalogue auto-fill ────────────────────────────────────────────────────

  const handleModelSelect = (model: string) => {
    setCatalogueModel(model);
    setDeviceName(model);
    setSerialNumber('SN-AUTO-' + Math.floor(Math.random() * 999999).toString().padStart(6, '0'));
    const catEmoji = CATEGORIES.find((c) => c.id === category)?.emoji ?? '📦';
    setPhotoEmoji(catEmoji);
  };

  // ── Step renders ───────────────────────────────────────────────────────────

  const renderStep1 = () => {
    const cards = [
      {
        key: 'scan',
        icon: '📷',
        title: 'Scanner le code-barres / QR code',
        subtitle: 'Scannez la boîte ou la facture de votre appareil',
        badge: 'Recommandé',
      },
      {
        key: 'serial',
        icon: '🔢',
        title: 'Entrer le numéro de série',
        subtitle: 'Saisissez manuellement le S/N ou IMEI',
        badge: null,
      },
      {
        key: 'catalogue',
        icon: '📋',
        title: 'Choisir dans un catalogue',
        subtitle: 'Sélectionnez la marque et le modèle',
        badge: null,
      },
    ];

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Comment souhaitez-vous ajouter votre appareil ?</Text>
        <Text style={styles.stepSubtitle}>Choisissez la méthode la plus rapide</Text>
        <View style={{ gap: 12, marginTop: 24 }}>
          {cards.map((card) => {
            const active = method === card.key;
            return (
              <Pressable
                key={card.key}
                onPress={() => handleMethodSelect(card.key as any)}
                style={[styles.methodCard, active && styles.methodCardActive]}
              >
                <Text style={styles.methodIcon}>{card.icon}</Text>
                <View style={styles.methodInfo}>
                  <View style={styles.methodTitleRow}>
                    <Text style={styles.methodTitle}>{card.title}</Text>
                    {card.badge && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedText}>{card.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.methodSubtitle}>{card.subtitle}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  const renderStep2 = () => {
    const isCatalogue = method === 'catalogue';
    const modelList = catalogueBrand ? (MODELS_BY_BRAND[catalogueBrand] ?? ['Autre modèle']) : [];

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.stepContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.stepTitle}>Identifiez votre appareil</Text>
        <Text style={styles.stepSubtitle}>
          Le numéro de série permet de lier cet appareil à votre ObjectPass de façon unique.
        </Text>

        {/* Serial */}
        <Text style={[styles.fieldLabel, { marginTop: 24 }]}>NUMÉRO DE SÉRIE / IMEI</Text>
        <View style={styles.serialRow}>
          <TextInput
            style={styles.serialInput}
            value={serialNumber}
            onChangeText={setSerialNumber}
            placeholder="Ex : C02XL0RUJHD2 ou 356938035643809"
            placeholderTextColor={Colors.steelGrey}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
          />
          <Pressable
            style={styles.serialCamera}
            onPress={() => {
              setShowScanner(true);
              setTimeout(() => {
                setShowScanner(false);
                setSerialNumber('SN-MBP-2022-A1234');
              }, 2000);
            }}
          >
            <Feather name="camera" size={18} color={Colors.repairTeal} />
          </Pressable>
        </View>

        {/* Helper accordion */}
        <Pressable onPress={() => setShowHints(!showHints)} style={styles.hintsToggle}>
          <Text style={styles.hintsToggleText}>
            Où trouver ce numéro ? {showHints ? '▲' : '▾'}
          </Text>
        </Pressable>
        {showHints && (
          <View style={styles.hintsBox}>
            <Text style={styles.hintLine}>• iPhone / iPad : Réglages &gt; Général &gt; Informations</Text>
            <Text style={styles.hintLine}>• Mac : Pomme &gt; À propos de ce Mac</Text>
            <Text style={styles.hintLine}>• Vélo électrique : sous la batterie ou sur le cadre</Text>
            <Text style={styles.hintLine}>• Autres : sous l'appareil ou dans Réglages &gt; À propos</Text>
          </View>
        )}

        {/* Category */}
        <Text style={[styles.fieldLabel, { marginTop: 20 }]}>CATÉGORIE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}>
          {CATEGORIES.map((cat) => {
            const active = category === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                style={[styles.catChip, active && styles.catChipActive]}
              >
                <Text style={styles.catChipEmoji}>{cat.emoji}</Text>
                <Text style={[styles.catChipLabel, active && styles.catChipLabelActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Catalogue mode */}
        {isCatalogue && (
          <View style={{ marginTop: 20, gap: 12 }}>
            <Text style={styles.fieldLabel}>MARQUE</Text>
            <Pressable style={styles.dropdownField} onPress={() => setShowBrandPicker(true)}>
              <Text style={[styles.dropdownValue, !catalogueBrand && { color: Colors.steelGrey }]}>
                {catalogueBrand || 'Sélectionner une marque'}
              </Text>
              <Feather name="chevron-down" size={16} color={Colors.repairTeal} />
            </Pressable>

            {catalogueBrand && (
              <>
                <Text style={styles.fieldLabel}>MODÈLE</Text>
                <Pressable style={styles.dropdownField} onPress={() => setShowModelPicker(true)}>
                  <Text style={[styles.dropdownValue, !catalogueModel && { color: Colors.steelGrey }]}>
                    {catalogueModel || 'Sélectionner un modèle'}
                  </Text>
                  <Feather name="chevron-down" size={16} color={Colors.repairTeal} />
                </Pressable>
              </>
            )}

            {catalogueModel && (
              <View style={styles.autoSerialNote}>
                <Text style={styles.autoSerialText}>{serialNumber}</Text>
                <Text style={styles.autoSerialSubtext}>Numéro généré automatiquement — modifiable</Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 32 }} />

        <PickerModal
          visible={showBrandPicker}
          title="Choisir une marque"
          options={BRANDS}
          selected={catalogueBrand}
          onSelect={(v) => { setCatalogueBrand(v); setCatalogueModel(''); }}
          onClose={() => setShowBrandPicker(false)}
        />
        <PickerModal
          visible={showModelPicker}
          title="Choisir un modèle"
          options={modelList}
          selected={catalogueModel}
          onSelect={handleModelSelect}
          onClose={() => setShowModelPicker(false)}
        />
      </ScrollView>
    );
  };

  const renderStep3 = () => (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.stepContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.stepTitle}>Informations d'achat</Text>
      <Text style={styles.stepSubtitle}>
        Ces données alimentent votre ObjectPass et vos alertes de garantie.
      </Text>

      {/* Date */}
      <Text style={[styles.fieldLabel, { marginTop: 24 }]}>DATE D'ACHAT</Text>
      <Pressable style={styles.dateField} onPress={() => setShowDatePicker(true)}>
        <Text style={[styles.dateFieldText, !purchaseDate && { color: Colors.steelGrey }]}>
          {purchaseDate ? formatDate(purchaseDate) : 'Sélectionner une date'}
        </Text>
        <Feather name="calendar" size={16} color={Colors.steelGrey} />
      </Pressable>

      {/* Price */}
      <Text style={[styles.fieldLabel, { marginTop: 16 }]}>PRIX D'ACHAT (OPTIONNEL)</Text>
      <View style={styles.priceRow}>
        <TextInput
          style={styles.priceInput}
          value={purchasePrice}
          onChangeText={setPurchasePrice}
          placeholder="Ex : 1 299"
          placeholderTextColor={Colors.steelGrey}
          keyboardType="numeric"
          returnKeyType="done"
        />
        <Text style={styles.priceUnit}>€</Text>
      </View>

      {/* Place */}
      <Text style={[styles.fieldLabel, { marginTop: 16 }]}>LIEU D'ACHAT (OPTIONNEL)</Text>
      <TextInput
        style={styles.textField}
        value={purchasePlace}
        onChangeText={setPurchasePlace}
        placeholder="Ex : Apple Store, Fnac, Leboncoin..."
        placeholderTextColor={Colors.steelGrey}
        returnKeyType="done"
      />

      {/* Invoice */}
      <Text style={[styles.fieldLabel, { marginTop: 16 }]}>FACTURE (OPTIONNEL)</Text>
      <Pressable
        style={[styles.invoiceZone, hasInvoice && styles.invoiceZoneDone]}
        onPress={() => {
          if (hasInvoice) { setHasInvoice(false); return; }
          Alert.alert('Ajouter une facture', undefined, [
            { text: 'Prendre une photo',      onPress: () => setHasInvoice(true) },
            { text: 'Choisir dans la galerie', onPress: () => setHasInvoice(true) },
            { text: 'Annuler', style: 'cancel' },
          ]);
        }}
      >
        <Text style={styles.invoiceIcon}>{hasInvoice ? '✅' : '📎'}</Text>
        <Text style={[styles.invoiceLabel, hasInvoice && { color: Colors.graphite }]}>
          {hasInvoice ? 'facture_achat.jpg · Ajoutée' : 'Ajouter une facture'}
        </Text>
        <Text style={styles.invoiceSub}>
          {hasInvoice ? '' : 'Photo ou PDF · Max 10 Mo'}
        </Text>
      </Pressable>

      {/* Warranty */}
      <Text style={[styles.fieldLabel, { marginTop: 16 }]}>DURÉE DE GARANTIE CONSTRUCTEUR</Text>
      <View style={styles.warrantyRow}>
        {WARRANTY_OPTIONS.map((opt) => {
          const active = warrantyOpt === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => setWarrantyOpt(opt.id)}
              style={[styles.warrantyPill, active && styles.warrantyPillActive]}
            >
              <Text style={[styles.warrantyPillText, active && styles.warrantyPillTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {warrantyOpt === 'other' && (
        <TextInput
          style={[styles.textField, { marginTop: 8 }]}
          value={warrantyCustom}
          onChangeText={setWarrantyCustom}
          placeholder="Précisez (en mois)"
          placeholderTextColor={Colors.steelGrey}
          keyboardType="numeric"
          returnKeyType="done"
        />
      )}

      <View style={{ height: 32 }} />

      <DatePickerModal
        visible={showDatePicker}
        value={purchaseDate}
        onChange={setPurchaseDate}
        onClose={() => setShowDatePicker(false)}
      />
    </ScrollView>
  );

  const renderStep4 = () => {
    const catEmoji = CATEGORIES.find((c) => c.id === category)?.emoji ?? '📦';
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.stepContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.stepTitle}>Personnalisez votre appareil</Text>
        <Text style={styles.stepSubtitle}>
          Une photo et un nom pour le reconnaître facilement dans votre ObjectPass.
        </Text>

        {/* Device name */}
        <Text style={[styles.fieldLabel, { marginTop: 24 }]}>NOM DE L'APPAREIL</Text>
        <TextInput
          style={styles.nameInput}
          value={deviceName}
          onChangeText={(t) => setDeviceName(t.slice(0, 40))}
          placeholder="Ex : Mon MacBook Pro, iPhone Pro Max..."
          placeholderTextColor={Colors.steelGrey}
          returnKeyType="done"
          maxLength={40}
        />
        <Text style={styles.charCount}>{deviceName.length} / 40</Text>

        {/* Photo zone */}
        <Pressable
          style={[styles.photoZone, !!photoEmoji && styles.photoZoneFilled]}
          onPress={() => {
            Alert.alert('Photo de l\'appareil', undefined, [
              { text: 'Prendre une photo',       onPress: () => setPhotoEmoji(catEmoji) },
              { text: 'Choisir dans la galerie',  onPress: () => setPhotoEmoji(catEmoji) },
              { text: 'Annuler', style: 'cancel' },
            ]);
          }}
        >
          {photoEmoji ? (
            <>
              <Text style={styles.photoEmoji}>{photoEmoji}</Text>
              <View style={styles.modifyOverlay}>
                <Text style={styles.modifyText}>Modifier</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.photoPlaceholderIcon}>📷</Text>
              <Text style={styles.photoPlaceholderText}>Ajouter une photo</Text>
              <Text style={styles.photoPlaceholderSub}>Optionnel — aide à identifier l'appareil</Text>
            </>
          )}
        </Pressable>

        {/* Color picker */}
        <Text style={[styles.fieldLabel, { marginTop: 20 }]}>COULEUR (OPTIONNEL)</Text>
        <View style={styles.colorsRow}>
          {COLORS_LIST.map((c) => {
            const active = selectedColor === c.name;
            return (
              <Pressable
                key={c.name}
                onPress={() => setSelectedColor(active ? '' : c.name)}
                style={[styles.colorCircle, { backgroundColor: c.hex }, active && styles.colorCircleActive]}
              />
            );
          })}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    );
  };

  const renderStep5 = () => {
    const catEntry   = CATEGORIES.find((c) => c.id === category);
    const catEmoji   = catEntry?.emoji ?? '📦';
    const catLabel   = catEntry?.label ?? 'Appareil';
    const months     = getWarrantyMonths(warrantyOpt, warrantyCustom);
    const { active: wActive, expiry: wExpiry } =
      purchaseDate ? computeWarranty(purchaseDate, months) : { active: false, expiry: null };

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.stepContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.stepTitle}>Tout est prêt ✓</Text>
        <Text style={styles.stepSubtitle}>
          Vérifiez les informations avant d'ajouter votre appareil à votre ObjectPass.
        </Text>

        {/* Recap card */}
        <View style={styles.recapCard}>
          <View style={styles.recapPhotoBox}>
            <Text style={styles.recapPhotoEmoji}>{photoEmoji || catEmoji}</Text>
          </View>
          <Text style={styles.recapDeviceName}>{deviceName || '—'}</Text>
          <View style={styles.recapCatPill}>
            <Text style={styles.recapCatText}>{catLabel}</Text>
          </View>

          <View style={styles.recapRows}>
            {[
              { label: 'Numéro de série', value: serialNumber || '—', teal: true, mono: true },
              { label: 'Date d\'achat',    value: purchaseDate ? formatDate(purchaseDate) : '—' },
              { label: 'Prix d\'achat',    value: purchasePrice ? `${purchasePrice} €` : '—' },
              { label: 'Lieu d\'achat',    value: purchasePlace || '—' },
              { label: 'Garantie',         value: months > 0 ? `${months < 12 ? months + ' mois' : months / 12 + ' an(s)'}${wExpiry ? ' · jusqu\'en ' + wExpiry : ''}` : '—', green: wActive },
              { label: 'Facture',          value: hasInvoice ? '✓ Ajoutée' : '—', green: hasInvoice },
            ].map((row, i) => (
              <View key={i} style={styles.recapRow}>
                <Text style={styles.recapRowLabel}>{row.label}</Text>
                <Text style={[
                  styles.recapRowValue,
                  row.teal  && { color: Colors.repairTeal, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
                  row.green && { color: Colors.warrantyGreen },
                ]}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ObjectPass preview */}
        <Text style={[styles.fieldLabel, { marginTop: 24 }]}>VOTRE OBJECTPASS</Text>
        <View style={styles.passPreview}>
          <Text style={styles.passScore}>—/100</Text>
          <View style={styles.passNewPill}>
            <Text style={styles.passNewText}>Nouvel appareil</Text>
          </View>
          <Text style={styles.passNoRepairs}>Aucune réparation enregistrée</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const stepContent: Record<number, () => React.ReactNode> = {
    1: renderStep1,
    2: renderStep2,
    3: renderStep3,
    4: renderStep4,
    5: renderStep5,
  };

  const ctaLabel = step === 5
    ? (loading ? 'Ajout en cours...' : 'Ajouter à mon ObjectPass')
    : 'Continuer';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Scanner overlay */}
      {showScanner && <ScannerOverlay />}

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={12}>
          <Feather name="x" size={22} color={Colors.steelGrey} />
        </Pressable>
        <Text style={styles.headerTitle}>Ajouter un appareil</Text>
        <Text style={styles.stepCounter}>Étape {step} / {TOTAL_STEPS}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressAnim }]} />
      </View>

      {/* Step content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={120}
      >
        <Animated.View style={[styles.stepWrapper, { transform: [{ translateX: slideAnim }] }]}>
          {stepContent[step]?.()}
        </Animated.View>

        {/* Bottom actions */}
        <View style={styles.bottomArea}>
          <Pressable
            onPress={handleNext}
            disabled={!isValid(step) || loading}
            style={({ pressed }) => [
              styles.ctaBtn,
              (!isValid(step) || loading) && styles.ctaBtnDisabled,
              pressed && isValid(step) && !loading && { opacity: 0.88, transform: [{ scale: 0.97 }] },
            ]}
          >
            <Text style={styles.ctaLabel}>{ctaLabel}</Text>
          </Pressable>
          {step > 1 && (
            <Pressable
              onPress={() => goToStep(step - 1)}
              style={styles.prevBtn}
              disabled={loading}
            >
              <Text style={styles.prevBtnLabel}>Étape précédente</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cleanWhite },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
  closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600', color: Colors.graphite, textAlign: 'center' },
  stepCounter: { fontSize: 13, color: Colors.steelGrey, minWidth: 60, textAlign: 'right' },

  // Progress
  progressTrack: { height: 4, backgroundColor: Colors.borderMist, marginHorizontal: 20, borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: 4, backgroundColor: Colors.repairTeal, borderRadius: 2 },

  // Step content
  stepWrapper: { flex: 1 },
  stepContent: { paddingHorizontal: 20, paddingTop: 20, flexGrow: 1 },
  stepTitle:   { fontSize: 22, fontWeight: '700', color: Colors.graphite, letterSpacing: -0.3, marginBottom: 6 },
  stepSubtitle:{ fontSize: 14, color: Colors.steelGrey, lineHeight: 20 },

  // Field label
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.steelGrey, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },

  // Method cards (step 1)
  methodCard:       { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: Colors.paperSage, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.borderMist, padding: 20 },
  methodCardActive: { borderColor: Colors.objectNavy, backgroundColor: 'rgba(14,37,48,0.04)' },
  methodIcon:       { fontSize: 28 },
  methodInfo:       { flex: 1, gap: 4 },
  methodTitleRow:   { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  methodTitle:      { fontSize: 16, fontWeight: '700', color: Colors.graphite },
  methodSubtitle:   { fontSize: 13, color: Colors.steelGrey, lineHeight: 18 },
  recommendedBadge: { backgroundColor: Colors.repairTeal, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  recommendedText:  { fontSize: 11, fontWeight: '700', color: Colors.cleanWhite },

  // Step 2 — serial
  serialRow:    { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4 },
  serialInput:  { flex: 1, height: 52, borderWidth: 1.5, borderColor: Colors.borderMist, borderRadius: 12, paddingHorizontal: 14, fontSize: 16, color: Colors.graphite, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  serialCamera: { width: 44, height: 52, borderWidth: 1.5, borderColor: Colors.borderMist, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  hintsToggle:     { paddingVertical: 6 },
  hintsToggleText: { fontSize: 12, color: Colors.steelGrey },
  hintsBox:        { backgroundColor: Colors.paperSage, borderRadius: 12, padding: 12, marginTop: 4, gap: 4 },
  hintLine:        { fontSize: 12, color: Colors.steelGrey, lineHeight: 18 },

  chipRow:         { gap: 8, paddingBottom: 4, flexDirection: 'row' },
  catChip:         { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.paperSage, borderWidth: 1.5, borderColor: Colors.borderMist, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8 },
  catChipActive:   { backgroundColor: Colors.objectNavy, borderColor: Colors.objectNavy },
  catChipEmoji:    { fontSize: 14 },
  catChipLabel:    { fontSize: 13, fontWeight: '600', color: Colors.steelGrey },
  catChipLabelActive: { color: Colors.cleanWhite },

  dropdownField:   { height: 52, borderWidth: 1.5, borderColor: Colors.borderMist, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownValue:   { fontSize: 16, color: Colors.graphite, flex: 1 },

  autoSerialNote:  { backgroundColor: '#E7F8F5', borderRadius: 12, padding: 12, gap: 4 },
  autoSerialText:  { fontSize: 14, color: Colors.repairTeal, fontStyle: 'italic', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  autoSerialSubtext: { fontSize: 11, color: Colors.steelGrey },

  // Step 3
  textField:     { height: 52, borderWidth: 1.5, borderColor: Colors.borderMist, borderRadius: 12, paddingHorizontal: 14, fontSize: 15, color: Colors.graphite },
  dateField:     { height: 52, borderWidth: 1.5, borderColor: Colors.borderMist, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateFieldText: { fontSize: 15, color: Colors.graphite },
  priceRow:      { flexDirection: 'row', alignItems: 'center', gap: 0 },
  priceInput:    { flex: 1, height: 52, borderWidth: 1.5, borderColor: Colors.borderMist, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, borderRightWidth: 0, paddingHorizontal: 14, fontSize: 15, color: Colors.graphite },
  priceUnit:     { width: 40, height: 52, borderWidth: 1.5, borderColor: Colors.borderMist, borderTopRightRadius: 12, borderBottomRightRadius: 12, backgroundColor: Colors.paperSage, alignItems: 'center', justifyContent: 'center', fontSize: 15, color: Colors.steelGrey, textAlign: 'center', lineHeight: 52 },

  invoiceZone:      { borderWidth: 1.5, borderColor: Colors.borderMist, borderStyle: 'dashed', borderRadius: 16, height: 100, alignItems: 'center', justifyContent: 'center', gap: 4 },
  invoiceZoneDone:  { borderStyle: 'solid', borderColor: Colors.repairTeal },
  invoiceIcon:      { fontSize: 24 },
  invoiceLabel:     { fontSize: 14, fontWeight: '600', color: Colors.repairTeal },
  invoiceSub:       { fontSize: 12, color: Colors.steelGrey },

  warrantyRow:      { flexDirection: 'row', gap: 8 },
  warrantyPill:     { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, backgroundColor: Colors.paperSage, borderWidth: 1.5, borderColor: Colors.borderMist },
  warrantyPillActive:{ backgroundColor: Colors.objectNavy, borderColor: Colors.objectNavy },
  warrantyPillText: { fontSize: 13, fontWeight: '600', color: Colors.steelGrey },
  warrantyPillTextActive: { color: Colors.cleanWhite },

  // Step 4
  nameInput:   { height: 56, borderWidth: 1.5, borderColor: Colors.borderMist, borderRadius: 12, paddingHorizontal: 14, fontSize: 18, fontWeight: '600', color: Colors.graphite },
  charCount:   { fontSize: 12, color: Colors.steelGrey, textAlign: 'right', marginTop: 4 },
  photoZone:   { width: '100%', height: 180, borderRadius: 20, backgroundColor: Colors.paperSage, alignItems: 'center', justifyContent: 'center', marginTop: 16, overflow: 'hidden' },
  photoZoneFilled: { backgroundColor: 'rgba(18,184,155,0.12)' },
  photoEmoji:  { fontSize: 64 },
  modifyOverlay: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(14,37,48,0.75)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  modifyText:  { fontSize: 12, color: Colors.cleanWhite, fontWeight: '600' },
  photoPlaceholderIcon: { fontSize: 36 },
  photoPlaceholderText: { fontSize: 14, color: Colors.steelGrey, fontWeight: '500', marginTop: 4 },
  photoPlaceholderSub:  { fontSize: 12, color: Colors.steelGrey },
  colorsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  colorCircle: { width: 28, height: 28, borderRadius: 14 },
  colorCircleActive: { borderWidth: 3, borderColor: Colors.objectNavy },

  // Step 5 — recap
  recapCard:     { backgroundColor: Colors.objectNavy, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
  recapPhotoBox: { width: 72, height: 72, borderRadius: 16, backgroundColor: Colors.paperSage, alignItems: 'center', justifyContent: 'center' },
  recapPhotoEmoji: { fontSize: 36 },
  recapDeviceName: { fontSize: 20, fontWeight: '700', color: Colors.cleanWhite, textAlign: 'center', marginTop: 4 },
  recapCatPill:  { backgroundColor: Colors.repairTeal, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4 },
  recapCatText:  { fontSize: 12, fontWeight: '700', color: Colors.cleanWhite },
  recapRows:     { width: '100%', marginTop: 8, gap: 0 },
  recapRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 4 },
  recapRowLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  recapRowValue: { fontSize: 13, color: Colors.cleanWhite, fontWeight: '600', textAlign: 'right', maxWidth: '60%' },

  passPreview:   { backgroundColor: Colors.paperSage, borderRadius: 16, padding: 16, gap: 6, alignItems: 'flex-start' },
  passScore:     { fontSize: 22, fontWeight: '800', color: Colors.steelGrey },
  passNewPill:   { backgroundColor: Colors.diagnosticAmber, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  passNewText:   { fontSize: 11, fontWeight: '700', color: Colors.cleanWhite },
  passNoRepairs: { fontSize: 12, color: Colors.steelGrey },

  // Bottom CTA
  bottomArea:    { padding: 20, paddingTop: 8, gap: 0 },
  ctaBtn:        { backgroundColor: Colors.repairTeal, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' },
  ctaBtnDisabled:{ backgroundColor: Colors.borderMist, opacity: 0.5 },
  ctaLabel:      { fontSize: 16, fontWeight: '700', color: Colors.cleanWhite },
  prevBtn:       { marginTop: 10, height: 48, borderWidth: 1.5, borderColor: Colors.objectNavy, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  prevBtnLabel:  { fontSize: 15, fontWeight: '700', color: Colors.objectNavy },
});
