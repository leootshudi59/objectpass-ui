import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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
import { useNavigation, useRoute, type NavigationProp, type RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { Colors } from '../constants/colors';
import {
  CATEGORIES,
  COLORS_LIST,
  WARRANTY_OPTIONS,
  computeWarranty,
  computeHealthScore,
  formatDate,
  getWarrantyMonths,
  mapCategory,
  monthsToWarrantyOpt,
  parseDateString,
} from '../constants/deviceForm';
import { DatePickerModal } from '../components/form/DatePickerModal';
import { OutlineButton, SectionHeader } from '../components/ui';
import { OWNERSHIP_STATUS_CONFIG, getOwnership } from '../constants/ownership';
import { useDevices } from '../context/DevicesContext';
import { useToast } from '../context/ToastContext';

// ── Component ──────────────────────────────────────────────────────────────────

export function EditDeviceScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'EditDevice'>>();
  const { deviceId } = route.params;
  const { devices, updateDevice, removeDevice } = useDevices();
  const { showToast } = useToast();

  const device = devices.find((d) => d.id === deviceId);

  // ── Initial values (for dirty-state comparison) ────────────────────────────
  const initial = {
    deviceName:    device?.name           ?? '',
    category:      device?.category       ?? 'other',
    serialNumber:  device?.serialNumber   ?? '',
    purchaseDate:  device?.purchaseDate ? parseDateString(device.purchaseDate) : null,
    purchasePrice: device?.purchasePrice  ?? '',
    purchasePlace: device?.purchasePlace  ?? '',
    warrantyOpt:   monthsToWarrantyOpt(device?.warrantyMonths).opt,
    warrantyCustom:monthsToWarrantyOpt(device?.warrantyMonths).custom,
    hasInvoice:    device?.hasInvoice     ?? false,
    color:         device?.color          ?? '',
    photoEmoji:    device?.category ? (CATEGORIES.find((c) => c.id === device.category)?.emoji ?? '') : '',
  };

  // ── Form state ─────────────────────────────────────────────────────────────
  const [deviceName,     setDeviceName]     = useState(initial.deviceName);
  const [category,       setCategory]       = useState<string>(initial.category);
  const [serialNumber,   setSerialNumber]   = useState(initial.serialNumber);
  const [purchaseDate,   setPurchaseDate]   = useState<Date | null>(initial.purchaseDate);
  const [purchasePrice,  setPurchasePrice]  = useState(initial.purchasePrice);
  const [purchasePlace,  setPurchasePlace]  = useState(initial.purchasePlace);
  const [warrantyOpt,    setWarrantyOpt]    = useState(initial.warrantyOpt);
  const [warrantyCustom, setWarrantyCustom] = useState(initial.warrantyCustom);
  const [hasInvoice,     setHasInvoice]     = useState(initial.hasInvoice);
  const [color,          setColor]          = useState(initial.color);
  const [photoEmoji,     setPhotoEmoji]     = useState(initial.photoEmoji);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [nameTouched,    setNameTouched]    = useState(false);
  const [isSaving,       setIsSaving]       = useState(false);

  // ── Derived state ──────────────────────────────────────────────────────────
  const nameEmpty = deviceName.trim().length === 0;
  const showNameError = nameTouched && nameEmpty;

  const currentDateStr = purchaseDate ? formatDate(purchaseDate) : '';
  const isDirty =
    deviceName.trim()  !== initial.deviceName        ||
    category           !== initial.category          ||
    serialNumber.trim()!== initial.serialNumber.trim()||
    currentDateStr     !== (initial.purchaseDate ? formatDate(initial.purchaseDate) : '') ||
    purchasePrice.trim()!== initial.purchasePrice.trim()  ||
    purchasePlace.trim()!== initial.purchasePlace.trim()  ||
    warrantyOpt        !== initial.warrantyOpt       ||
    warrantyCustom     !== initial.warrantyCustom    ||
    hasInvoice         !== initial.hasInvoice        ||
    color              !== initial.color             ||
    photoEmoji         !== initial.photoEmoji;

  const canSave = isDirty && !nameEmpty;

  if (!device) return null;

  const ownership = getOwnership(device);
  const ownershipCfg = OWNERSHIP_STATUS_CONFIG[ownership.status];

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCancel = () => {
    if (!isDirty) {
      navigation.goBack();
      return;
    }
    Alert.alert(
      'Abandonner les modifications ?',
      'Vos modifications seront perdues.',
      [
        { text: 'Continuer à modifier', style: 'cancel' },
        { text: 'Abandonner', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  const handleSave = () => {
    if (!canSave || isSaving) return;
    setIsSaving(true);

    const months = getWarrantyMonths(warrantyOpt, warrantyCustom);
    const warrantyResult = purchaseDate
      ? computeWarranty(purchaseDate, months)
      : { active: false, expiry: null };

    const updatedFields: Partial<typeof device> = {};

    if (deviceName.trim() !== initial.deviceName)
      updatedFields.name = deviceName.trim();
    if (category !== initial.category)
      updatedFields.category = mapCategory(category);
    if (serialNumber.trim() !== initial.serialNumber)
      updatedFields.serialNumber = serialNumber.trim() || undefined;
    if (currentDateStr !== (initial.purchaseDate ? formatDate(initial.purchaseDate) : ''))
      updatedFields.purchaseDate = purchaseDate ? formatDate(purchaseDate) : undefined;
    if (purchasePrice.trim() !== initial.purchasePrice)
      updatedFields.purchasePrice = purchasePrice.trim() || undefined;
    if (purchasePlace.trim() !== initial.purchasePlace)
      updatedFields.purchasePlace = purchasePlace.trim() || undefined;
    if (warrantyOpt !== initial.warrantyOpt || warrantyCustom !== initial.warrantyCustom) {
      updatedFields.warrantyMonths  = months || undefined;
      updatedFields.warrantyActive  = warrantyResult.active;
      updatedFields.warrantyExpiry  = warrantyResult.expiry;
    }
    if (hasInvoice !== initial.hasInvoice)
      updatedFields.hasInvoice = hasInvoice;
    if (color !== initial.color)
      updatedFields.color = color || undefined;

    // Recompute health score from the merged device state
    const merged = { ...device, ...updatedFields };
    const newScore = computeHealthScore(merged);
    if (newScore !== device.healthScore)
      updatedFields.healthScore = newScore;

    updateDevice(device.id, updatedFields);
    showToast('✓ Appareil mis à jour', 'success');
    setIsSaving(false);
    navigation.goBack();
  };

  const handleInvoicePress = () => {
    if (hasInvoice) {
      setHasInvoice(false);
      return;
    }
    Alert.alert('Ajouter une facture', undefined, [
      { text: 'Prendre une photo',       onPress: () => setHasInvoice(true) },
      { text: 'Choisir dans la galerie', onPress: () => setHasInvoice(true) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const handlePhotoPress = () => {
    const catEmoji = CATEGORIES.find((c) => c.id === category)?.emoji ?? '📦';
    Alert.alert("Photo de l'appareil", undefined, [
      { text: 'Prendre une photo',       onPress: () => setPhotoEmoji(catEmoji) },
      { text: 'Choisir dans la galerie', onPress: () => setPhotoEmoji(catEmoji) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const handleTransfer = () => {
    navigation.navigate('TransferOwnership', { deviceId: device.id });
  };

  const handleArchive = () => {
    Alert.alert(
      'Archiver cet appareil ?',
      "L'appareil disparaîtra de votre liste principale mais restera accessible et conservera tout son historique certifié.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Archiver',
          onPress: () => {
            updateDevice(device.id, { status: 'archived' });
            showToast('✓ Appareil archivé', 'success');
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Supprimer l'appareil",
      `L'ObjectPass de ${device.name} et son historique certifié seront définitivement perdus. Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            removeDevice(device.id);
            showToast('✓ Appareil supprimé', 'success');
            navigation.navigate('Tabs', { screen: 'Accueil' });
          },
        },
      ]
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleCancel} hitSlop={12} style={styles.headerAction}>
          <Text style={styles.cancelLabel}>Annuler</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Modifier l'appareil</Text>
        <Pressable
          onPress={handleSave}
          disabled={!canSave || isSaving}
          hitSlop={12}
          style={styles.headerAction}
        >
          <Text style={[styles.saveLabel, (!canSave || isSaving) && styles.saveLabelDisabled]}>
            {isSaving ? 'Enregistrement…' : 'Enregistrer'}
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── IDENTITÉ ──────────────────────────────────────────── */}
          <View style={styles.sectionHead}>
            <SectionHeader title="Identité" />
          </View>

          <View style={styles.card}>
            {/* Name */}
            <Text style={styles.fieldLabel}>NOM DE L'APPAREIL</Text>
            <TextInput
              style={[styles.textInput, showNameError && styles.textInputError]}
              value={deviceName}
              onChangeText={(t) => { setDeviceName(t.slice(0, 40)); setNameTouched(true); }}
              onBlur={() => setNameTouched(true)}
              placeholder="Ex : Mon MacBook Pro…"
              placeholderTextColor={Colors.steelGrey}
              returnKeyType="done"
              maxLength={40}
            />
            {showNameError && (
              <Text style={styles.inlineError}>Le nom est obligatoire</Text>
            )}
            <Text style={styles.charCount}>{deviceName.length} / 40</Text>

            {/* Category */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>CATÉGORIE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {CATEGORIES.map((cat) => {
                const active = category === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Serial number */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>NUMÉRO DE SÉRIE / IMEI</Text>
            <TextInput
              style={[styles.textInput, styles.monoInput]}
              value={serialNumber}
              onChangeText={setSerialNumber}
              placeholder="Ex : C02XL0RUJHD2"
              placeholderTextColor={Colors.steelGrey}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>

          {/* ── ACHAT ─────────────────────────────────────────────── */}
          <View style={styles.sectionHead}>
            <SectionHeader title="Achat" />
          </View>

          <View style={styles.card}>
            {/* Purchase date */}
            <Text style={styles.fieldLabel}>DATE D'ACHAT</Text>
            <Pressable style={styles.rowField} onPress={() => setShowDatePicker(true)}>
              <Text style={[styles.rowFieldText, !purchaseDate && styles.placeholder]}>
                {purchaseDate ? formatDate(purchaseDate) : 'Sélectionner une date'}
              </Text>
              <Feather name="calendar" size={16} color={Colors.steelGrey} />
            </Pressable>

            {/* Purchase price */}
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

            {/* Purchase place */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>LIEU D'ACHAT (OPTIONNEL)</Text>
            <TextInput
              style={styles.textInput}
              value={purchasePlace}
              onChangeText={setPurchasePlace}
              placeholder="Ex : Apple Store, Fnac, Leboncoin…"
              placeholderTextColor={Colors.steelGrey}
              returnKeyType="done"
            />
          </View>

          {/* ── GARANTIE ──────────────────────────────────────────── */}
          <View style={styles.sectionHead}>
            <SectionHeader title="Garantie" />
          </View>

          <View style={styles.card}>
            <Text style={styles.fieldLabel}>DURÉE DE GARANTIE CONSTRUCTEUR</Text>
            <View style={styles.pillRow}>
              {WARRANTY_OPTIONS.map((opt) => {
                const active = warrantyOpt === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setWarrantyOpt(opt.id)}
                    style={[styles.pill, active && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {warrantyOpt === 'other' && (
              <TextInput
                style={[styles.textInput, { marginTop: 8 }]}
                value={warrantyCustom}
                onChangeText={setWarrantyCustom}
                placeholder="Précisez (en mois)"
                placeholderTextColor={Colors.steelGrey}
                keyboardType="numeric"
                returnKeyType="done"
              />
            )}
          </View>

          {/* ── DOCUMENTS ─────────────────────────────────────────── */}
          <View style={styles.sectionHead}>
            <SectionHeader title="Documents" />
          </View>

          <View style={styles.card}>
            <Text style={styles.fieldLabel}>FACTURE (OPTIONNEL)</Text>
            <Pressable
              style={[styles.invoiceZone, hasInvoice && styles.invoiceZoneDone]}
              onPress={handleInvoicePress}
            >
              <Text style={styles.invoiceIcon}>{hasInvoice ? '✅' : '📎'}</Text>
              <Text style={[styles.invoiceLabel, hasInvoice && { color: Colors.graphite }]}>
                {hasInvoice ? 'facture_achat.jpg · Ajoutée' : 'Ajouter une facture'}
              </Text>
              {!hasInvoice && (
                <Text style={styles.invoiceSub}>Photo ou PDF · Max 10 Mo</Text>
              )}
            </Pressable>
          </View>

          {/* ── APPARENCE ─────────────────────────────────────────── */}
          <View style={styles.sectionHead}>
            <SectionHeader title="Apparence" />
          </View>

          <View style={styles.card}>
            {/* Photo zone */}
            <Text style={styles.fieldLabel}>PHOTO (OPTIONNEL)</Text>
            <Pressable
              style={[styles.photoZone, !!photoEmoji && styles.photoZoneFilled]}
              onPress={handlePhotoPress}
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
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>COULEUR (OPTIONNEL)</Text>
            <View style={styles.colorsRow}>
              {COLORS_LIST.map((c) => {
                const active = color === c.name;
                return (
                  <Pressable
                    key={c.name}
                    onPress={() => setColor(active ? '' : c.name)}
                    style={[styles.colorCircle, { backgroundColor: c.hex }, active && styles.colorCircleActive]}
                  />
                );
              })}
            </View>
            {color !== '' && (
              <Text style={styles.colorName}>{color}</Text>
            )}
          </View>

          {/* ── PROPRIÉTÉ ─────────────────────────────────────────── */}
          <View style={styles.sectionHead}>
            <SectionHeader title="Propriété" />
          </View>

          <View style={styles.card}>
            <View style={styles.ownershipRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>PROPRIÉTAIRE ACTUEL</Text>
                <Text style={styles.ownershipOwner}>{ownership.currentOwner}</Text>
              </View>
              <View style={[styles.ownershipBadge, { backgroundColor: ownershipCfg.bg }]}>
                <View style={[styles.ownershipDot, { backgroundColor: ownershipCfg.color }]} />
                <Text style={[styles.ownershipBadgeText, { color: ownershipCfg.color }]}>
                  {ownershipCfg.label}
                </Text>
              </View>
            </View>

            {ownership.status !== 'transferred' && (
              <View style={styles.ownershipActions}>
                <OutlineButton
                  label={ownership.status === 'pending_sent' ? "Voir l'invitation en cours" : 'Transférer la propriété'}
                  onPress={handleTransfer}
                  fullWidth
                />
                <OutlineButton label="Archiver cet appareil" onPress={handleArchive} fullWidth />
              </View>
            )}
          </View>

          {/* ── ZONE SENSIBLE ─────────────────────────────────────── */}
          <View style={styles.sectionHead}>
            <SectionHeader title="Zone sensible" />
          </View>

          <View style={[styles.card, styles.dangerCard]}>
            <Text style={styles.dangerWarning}>
              La suppression de cet appareil est irréversible : l'ObjectPass et son historique certifié seront définitivement perdus.
            </Text>
            <Pressable style={styles.dangerBtn} onPress={handleDelete}>
              <Text style={styles.dangerBtnText}>Supprimer l'appareil</Text>
            </Pressable>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <DatePickerModal
        visible={showDatePicker}
        value={purchaseDate}
        onChange={setPurchaseDate}
        onClose={() => setShowDatePicker(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cleanWhite },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderMist,
  },
  headerAction: { minWidth: 80 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.graphite },
  cancelLabel: { fontSize: 16, color: Colors.steelGrey },
  saveLabel:   { fontSize: 16, fontWeight: '600', color: Colors.repairTeal, textAlign: 'right' },
  saveLabelDisabled: { color: Colors.steelGrey, opacity: 0.5 },

  // Scroll
  scrollContent: { paddingBottom: 40 },

  // Section header
  sectionHead: { marginTop: 28, paddingHorizontal: 20 },

  // Card
  card: {
    backgroundColor: Colors.paperSage,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 8,
  },

  // Field label
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.steelGrey,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  // Text input
  textInput: {
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.graphite,
    backgroundColor: Colors.cleanWhite,
  },
  textInputError: { borderColor: Colors.faultCoral },
  monoInput: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  inlineError: { fontSize: 12, color: Colors.faultCoral, marginTop: 4 },
  charCount: { fontSize: 12, color: Colors.steelGrey, textAlign: 'right', marginTop: 4 },

  // Row field (date)
  rowField: {
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cleanWhite,
  },
  rowFieldText: { fontSize: 15, color: Colors.graphite },
  placeholder: { color: Colors.steelGrey },

  // Price
  priceRow:  { flexDirection: 'row', alignItems: 'center' },
  priceInput:{ flex: 1, height: 52, borderWidth: 1.5, borderColor: Colors.borderMist, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, borderRightWidth: 0, paddingHorizontal: 14, fontSize: 15, color: Colors.graphite, backgroundColor: Colors.cleanWhite },
  priceUnit: { width: 40, height: 52, borderWidth: 1.5, borderColor: Colors.borderMist, borderTopRightRadius: 12, borderBottomRightRadius: 12, backgroundColor: Colors.paperSage, alignItems: 'center', justifyContent: 'center', fontSize: 15, color: Colors.steelGrey, textAlign: 'center', lineHeight: 52 },

  // Category chips
  chipRow:        { gap: 8, paddingBottom: 4 },
  chip:           { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.cleanWhite, borderWidth: 1.5, borderColor: Colors.borderMist, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive:     { backgroundColor: Colors.objectNavy, borderColor: Colors.objectNavy },
  chipEmoji:      { fontSize: 14 },
  chipLabel:      { fontSize: 13, fontWeight: '600', color: Colors.steelGrey },
  chipLabelActive:{ color: Colors.cleanWhite },

  // Warranty pills
  pillRow:        { flexDirection: 'row', gap: 8 },
  pill:           { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, backgroundColor: Colors.cleanWhite, borderWidth: 1.5, borderColor: Colors.borderMist },
  pillActive:     { backgroundColor: Colors.objectNavy, borderColor: Colors.objectNavy },
  pillText:       { fontSize: 13, fontWeight: '600', color: Colors.steelGrey },
  pillTextActive: { color: Colors.cleanWhite },

  // Photo zone
  photoZone:            { width: '100%', height: 160, borderRadius: 16, backgroundColor: Colors.cleanWhite, borderWidth: 1.5, borderColor: Colors.borderMist, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoZoneFilled:      { backgroundColor: 'rgba(18,184,155,0.10)', borderColor: Colors.repairTeal },
  photoEmoji:           { fontSize: 56 },
  modifyOverlay:        { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(14,37,48,0.75)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  modifyText:           { fontSize: 12, color: Colors.cleanWhite, fontWeight: '600' },
  photoPlaceholderIcon: { fontSize: 32 },
  photoPlaceholderText: { fontSize: 14, color: Colors.steelGrey, fontWeight: '500', marginTop: 4 },
  photoPlaceholderSub:  { fontSize: 12, color: Colors.steelGrey },

  // Color picker
  colorsRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  colorCircle:      { width: 28, height: 28, borderRadius: 14 },
  colorCircleActive:{ borderWidth: 3, borderColor: Colors.objectNavy },
  colorName:        { fontSize: 12, color: Colors.steelGrey, marginTop: 6 },

  // Invoice zone
  invoiceZone:    { borderWidth: 1.5, borderColor: Colors.borderMist, borderStyle: 'dashed', borderRadius: 16, height: 100, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: Colors.cleanWhite },
  invoiceZoneDone:{ borderStyle: 'solid', borderColor: Colors.repairTeal },
  invoiceIcon:    { fontSize: 24 },
  invoiceLabel:   { fontSize: 14, fontWeight: '600', color: Colors.repairTeal },
  invoiceSub:     { fontSize: 12, color: Colors.steelGrey },

  // Ownership card
  ownershipRow:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  ownershipOwner:      { fontSize: 16, fontWeight: '700', color: Colors.graphite, marginTop: 4 },
  ownershipBadge:      { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, marginLeft: 12 },
  ownershipDot:        { width: 6, height: 6, borderRadius: 3 },
  ownershipBadgeText:  { fontSize: 11, fontWeight: '700' },
  ownershipActions:    { marginTop: 16, gap: 10 },

  // Danger zone
  dangerCard:     { backgroundColor: '#FDF2F2', borderWidth: 1.5, borderColor: Colors.faultCoral },
  dangerWarning:  { fontSize: 13, color: Colors.graphite, lineHeight: 19 },
  dangerBtn:      { marginTop: 14, height: 52, borderRadius: 12, backgroundColor: Colors.faultCoral, alignItems: 'center', justifyContent: 'center' },
  dangerBtnText:  { fontSize: 15, fontWeight: '700', color: Colors.cleanWhite },
});
