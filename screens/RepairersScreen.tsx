import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import type { MainStackParamList } from '../navigation/MainNavigator';

type Route = RouteProp<MainStackParamList, 'Repairers'>;

// ── Mock data ──────────────────────────────────────────────────────────────────

interface Repairer {
  id: string;
  name: string;
  shop: string;
  rating: number;
  reviewCount: number;
  certified: boolean;
  tags: string[];
  distance: string;
  slot: string;
  price: string;
}

const REPAIRERS: Repairer[] = [
  {
    id: '1',
    name: 'Marc Delannoy',
    shop: 'iRepair Valenciennes',
    rating: 4.8,
    reviewCount: 52,
    certified: true,
    tags: ['Batterie', 'MacBook', 'iPhone'],
    distance: '0.8 km',
    slot: "Disponible aujourd'hui à 14h",
    price: 'À partir de 59 €',
  },
  {
    id: '2',
    name: 'Sophie Marlier',
    shop: 'TechCare Cambrai',
    rating: 4.5,
    reviewCount: 31,
    certified: true,
    tags: ['Écran', 'Android', 'PC'],
    distance: '1.4 km',
    slot: 'Disponible demain à 10h',
    price: 'À partir de 69 €',
  },
  {
    id: '3',
    name: 'Atelier NordFix',
    shop: 'NordFix Douai',
    rating: 4.1,
    reviewCount: 18,
    certified: false,
    tags: ['Tous appareils'],
    distance: '3.2 km',
    slot: 'Disponible dans 2 jours',
    price: 'À partir de 45 €',
  },
  {
    id: '4',
    name: 'Lucas Fontaine',
    shop: 'Repair & Go Arras',
    rating: 4.9,
    reviewCount: 87,
    certified: true,
    tags: ['Batterie', 'Vélo électrique', 'MacBook'],
    distance: '4.7 km',
    slot: "Disponible aujourd'hui à 17h",
    price: 'À partir de 79 €',
  },
  {
    id: '5',
    name: 'Claire Beaumont',
    shop: 'FixMyDevice Lens',
    rating: 3.9,
    reviewCount: 11,
    certified: false,
    tags: ['iPhone', 'iPad'],
    distance: '6.1 km',
    slot: 'Disponible dans 3 jours',
    price: 'À partir de 49 €',
  },
];

const FILTERS = ['Tous', 'À proximité', "Disponible aujourd'hui", 'Certifié ObjectPass', 'Domicile'];

// ── Sub-components ─────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function StarRow({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  const filled = Math.round(rating);
  const stars = '★'.repeat(filled) + '☆'.repeat(5 - filled);
  return (
    <Text style={styles.starRow}>
      <Text style={styles.starsFilled}>{stars.slice(0, filled)}</Text>
      <Text style={styles.starsEmpty}>{stars.slice(filled)}</Text>
      <Text style={styles.starCount}>  {rating} ({reviewCount} avis)</Text>
    </Text>
  );
}

function RepairerCard({ repairer, onReserve }: { repairer: Repairer; onReserve: () => void }) {
  const initials = getInitials(repairer.name);

  return (
    <View style={styles.card}>
      {/* Top row: avatar + info */}
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.repairerName}>{repairer.name}</Text>
          <Text style={styles.shopName}>{repairer.shop}</Text>
          <StarRow rating={repairer.rating} reviewCount={repairer.reviewCount} />
        </View>
      </View>

      {/* Badges row */}
      <View style={styles.badgesRow}>
        {repairer.certified && (
          <View style={styles.certBadge}>
            <Feather name="check-circle" size={10} color={Colors.proofBlue} />
            <Text style={styles.certBadgeLabel}>Certifié ObjectPass</Text>
          </View>
        )}
        {repairer.tags.map((tag) => (
          <View key={tag} style={styles.tagBadge}>
            <Text style={styles.tagBadgeLabel}>{tag}</Text>
          </View>
        ))}
      </View>

      {/* Info row */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Feather name="map-pin" size={12} color={Colors.steelGrey} />
          <Text style={styles.infoText}>{repairer.distance}</Text>
        </View>
        <View style={styles.infoItem}>
          <Feather name="clock" size={12} color={Colors.steelGrey} />
          <Text style={styles.infoText}>{repairer.slot}</Text>
        </View>
      </View>
      <Text style={styles.priceText}>{repairer.price}</Text>

      {/* Action buttons */}
      <View style={styles.cardActions}>
        <Pressable
          style={({ pressed }) => [styles.outlineBtn, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.outlineBtnLabel}>Voir le profil</Text>
        </Pressable>
        <Pressable
          onPress={onReserve}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
        >
          <Text style={styles.primaryBtnLabel}>Réserver</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export function RepairersScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { deviceName, deviceModel, issueLabel, priceRange, urgency } = route.params;

  const [activeFilter, setActiveFilter] = useState('Tous');

  const subtitle = `${issueLabel} · ${deviceName}`;

  const handleReserve = (repairer: Repairer) => {
    navigation.navigate('Booking', {
      repairer: {
        name: repairer.name,
        shop: repairer.shop,
        rating: repairer.rating,
        reviewCount: repairer.reviewCount,
        certified: repairer.certified,
        tags: repairer.tags,
        price: repairer.price,
      },
      diagnosis: {
        deviceName,
        deviceModel,
        issueLabel,
        priceRange,
        urgency,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Fixed header ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={Colors.objectNavy} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Réparateurs disponibles</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          <View style={styles.pricePill}>
            <Text style={styles.pricePillLabel}>Estimation : {priceRange}</Text>
          </View>
        </View>
      </View>

      {/* ── Filter chips ──────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
        style={styles.filtersScroll}
      >
        {FILTERS.map((f) => {
          const active = activeFilter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{f}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Repairer list ─────────────────────────────────────────────── */}
      <FlatList
        data={REPAIRERS}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <RepairerCard repairer={item} onReserve={() => handleReserve(item)} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cleanWhite,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
    marginTop: 2,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.graphite,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.steelGrey,
  },
  pricePill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.paperSage,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  pricePillLabel: {
    fontSize: 12,
    color: Colors.repairTeal,
    fontWeight: '600',
  },

  // Filters
  filtersScroll: {
    maxHeight: 44,
    marginBottom: 8,
  },
  filtersRow: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: Colors.paperSage,
    borderWidth: 1,
    borderColor: Colors.borderMist,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: Colors.objectNavy,
    borderColor: Colors.objectNavy,
  },
  chipLabel: {
    fontSize: 13,
    color: Colors.steelGrey,
    fontWeight: '500',
  },
  chipLabelActive: {
    color: Colors.cleanWhite,
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  // Card
  card: {
    backgroundColor: Colors.paperSage,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.borderMist,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.objectNavy,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.cleanWhite,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  repairerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.graphite,
  },
  shopName: {
    fontSize: 13,
    color: Colors.steelGrey,
  },
  starRow: {
    fontSize: 13,
    marginTop: 2,
  },
  starsFilled: {
    color: Colors.diagnosticAmber,
  },
  starsEmpty: {
    color: Colors.borderMist,
  },
  starCount: {
    color: Colors.steelGrey,
    fontSize: 12,
  },

  // Badges
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E9EFFF',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  certBadgeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.proofBlue,
  },
  tagBadge: {
    backgroundColor: '#E7F8F5',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagBadgeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.repairTeal,
  },

  // Info row
  infoRow: {
    gap: 6,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: Colors.steelGrey,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.graphite,
    marginTop: -4,
  },

  // Card action buttons
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  outlineBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.objectNavy,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.objectNavy,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: Colors.repairTeal,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.cleanWhite,
  },
});
