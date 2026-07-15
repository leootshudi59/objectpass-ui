// ── Device ────────────────────────────────────────────────────────────────────

export type DeviceCategory = 'laptop' | 'phone' | 'ebike' | 'tablet' | 'other';
export type DeviceStatus   = 'excellent' | 'bon' | 'attention' | 'panne';
export type PartQuality    = 'premium' | 'standard';

export interface Repair {
  id: string;
  date: string;
  type: string;
  repairer: string;
  certified: boolean;
  repairId?: string;
}

export interface Device {
  id: string;
  name: string;
  model: string;
  category: DeviceCategory;
  healthScore: number;
  status: DeviceStatus;
  lastRepairDate: string | null;
  warrantyActive: boolean;
  warrantyExpiry: string | null;
  repairs: Repair[];
  battery: number;
  screen: number;
  storage: number;
  serialNumber?: string;
}

export interface DeviceEntry extends Device {
  purchaseDate?: string;
  purchasePrice?: string;
  purchasePlace?: string;
  warrantyMonths?: number;
  hasInvoice?: boolean;
  color?: string;
  createdAt?: string;
}

// ── Repairer ──────────────────────────────────────────────────────────────────

export interface Repairer {
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

// ── Diagnosis ─────────────────────────────────────────────────────────────────

export type UrgencyLevel = 'panne' | 'attention' | 'bon' | 'excellent';

export interface DiagnosisResult {
  label: string;
  priceRange: string;
  duration: string;
  urgency: UrgencyLevel;
}

export interface PendingDiagnostic {
  deviceId: string;
  symptomId: string;
  severityId: string;
  result: DiagnosisResult;
  createdAt: string;
}

// ── Appointment ───────────────────────────────────────────────────────────────

export type AppointmentStatus = 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type InterventionType  = 'En boutique' | 'À domicile' | 'Envoi postal';

export interface Appointment {
  id: string;
  status: AppointmentStatus;
  device: { name: string; model: string };
  issue: { label: string; priceRange: string; urgency: string };
  repairer: { name: string; shop: string; certified: boolean; rating: number };
  date: string;
  time: string;
  type: string;
  notes: string;
  createdAt: string;
  repairId?: string;
}

// ── Certificate ───────────────────────────────────────────────────────────────

export type BlockchainAnchorStatus = 'pending_anchor' | 'anchored';

export interface RepairProof {
  id: string;
  issuedAt: string;
  blockchainHash: string;
  network: string;
  status: BlockchainAnchorStatus;
}

export interface Certificate {
  type: string;
  date: string;
  duration: string;
  interventionType: string;
  part: {
    name: string;
    quality: PartQuality;
    reference: string;
  };
  warrantyMonths: number;
  warrantyExpiry: string;
  warrantyExpired: boolean;
  notes: string;
  repairer: {
    name: string;
    shop: string;
    rating: number;
    tags: string[];
    memberSince: string;
    signatureHash: string;
  };
  proof: RepairProof;
}

// ── User ──────────────────────────────────────────────────────────────────────

export interface User {
  name: string;
  email: string;
  avatar: string | null;
}
