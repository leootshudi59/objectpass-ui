// Shared constants and helpers for device add / edit forms

export const CATEGORIES = [
  { id: 'laptop',  label: 'Ordinateur',       emoji: '💻' },
  { id: 'phone',   label: 'Smartphone',        emoji: '📱' },
  { id: 'tablet',  label: 'Tablette',          emoji: '🖥️' },
  { id: 'console', label: 'Console',           emoji: '🎮' },
  { id: 'ebike',   label: 'Vélo électrique',   emoji: '🚲' },
  { id: 'other',   label: 'Autre',             emoji: '🖨️' },
];

export const BRANDS = ['Apple', 'Samsung', 'Lenovo', 'Dell', 'HP', 'Cowboy', 'VanMoof', 'Sony', 'Microsoft', 'Autre'];

export const MODELS_BY_BRAND: Record<string, string[]> = {
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

export const MONTHS_FR = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
export const FULL_MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
export const YEARS = Array.from({ length: 11 }, (_, i) => 2015 + i);

export const COLORS_LIST = [
  { name: 'Space Grey',  hex: '#6B7C80' },
  { name: 'Silver',      hex: '#C0C0C0' },
  { name: 'Midnight',    hex: '#1C2526' },
  { name: 'Starlight',   hex: '#F2E6D4' },
  { name: 'Gold',        hex: '#D4AF37' },
  { name: 'Blue',        hex: '#2D5BE3' },
  { name: 'Green',       hex: '#2EB872' },
  { name: 'Rouge',       hex: '#E85D5D' },
];

export const WARRANTY_OPTIONS = [
  { id: '1',     label: '1 an' },
  { id: '2',     label: '2 ans' },
  { id: 'other', label: 'Autre' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────────

export function formatDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')} ${FULL_MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

export function parseDateString(s: string): Date | null {
  if (!s) return null;
  const parts = s.split(' ');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const monthIdx = FULL_MONTHS_FR.findIndex((m) => m.toLowerCase() === parts[1].toLowerCase());
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || monthIdx === -1 || isNaN(year)) return null;
  return new Date(year, monthIdx, day);
}

export function getWarrantyMonths(option: string, custom: string): number {
  if (option === '1') return 12;
  if (option === '2') return 24;
  if (option === 'other') return parseInt(custom, 10) || 0;
  return 0;
}

export function monthsToWarrantyOpt(months?: number): { opt: string; custom: string } {
  if (!months) return { opt: '', custom: '' };
  if (months === 12) return { opt: '1', custom: '' };
  if (months === 24) return { opt: '2', custom: '' };
  return { opt: 'other', custom: String(months) };
}

export function computeWarranty(
  purchaseDate: Date,
  months: number,
): { active: boolean; expiry: string | null } {
  if (months === 0) return { active: false, expiry: null };
  const exp = new Date(purchaseDate);
  exp.setMonth(exp.getMonth() + months);
  return {
    active: exp > new Date(),
    expiry: `${MONTHS_FR[exp.getMonth()]} ${exp.getFullYear()}`,
  };
}

import type { DeviceEntry } from '../types';

export function mapCategory(cat: string): DeviceEntry['category'] {
  if (cat === 'laptop') return 'laptop';
  if (cat === 'phone') return 'phone';
  if (cat === 'tablet') return 'tablet';
  if (cat === 'ebike') return 'ebike';
  return 'other';
}

export function computeHealthScore(device: DeviceEntry): number {
  let score = 50;
  if (device.warrantyActive) score += 15;
  if (device.hasInvoice) score += 15;
  score += Math.min(20, device.repairs.length * 10);
  return Math.min(100, score);
}
