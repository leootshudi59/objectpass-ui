// ObjectPass brand color system — single source of truth. Never hardcode hex elsewhere.

export const Colors = {
  // Brand
  objectNavy:   '#0E2530',
  repairTeal:   '#12B89B',
  proofBlue:    '#245FFF',
  paperSage:    '#EAF4EF',
  graphite:     '#162024',

  // Status
  warrantyGreen:    '#2EB872',
  diagnosticAmber:  '#F2B84B',
  faultCoral:       '#E85D5D',

  // UI utility
  steelGrey:   '#6B7C80',
  borderMist:  '#D7E3DF',
  cleanWhite:  '#F8FCFA',
} as const;

export type ColorToken = keyof typeof Colors;

// Health score → color mapping
export function healthColor(score: number): string {
  if (score >= 80) return Colors.warrantyGreen;
  if (score >= 60) return Colors.diagnosticAmber;
  return Colors.faultCoral;
}
