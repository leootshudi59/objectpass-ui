// Shared ownership/transfer status display config + fallback helper.

import { Colors } from './colors';
import type { DeviceEntry, DeviceOwnership, TransferStatus } from '../types';

export const OWNERSHIP_STATUS_CONFIG: Record<TransferStatus, { label: string; color: string; bg: string }> = {
  none:           { label: 'Actif',                  color: Colors.warrantyGreen,   bg: '#E8F9F0' },
  pending_sent:   { label: 'Transfert en attente',    color: Colors.diagnosticAmber, bg: '#FEF6E4' },
  claim_received: { label: 'Revendication reçue',     color: Colors.proofBlue,       bg: '#E5EBFF' },
  claim_sent:     { label: 'Revendication envoyée',   color: Colors.diagnosticAmber, bg: '#FEF6E4' },
  transferred:    { label: 'Transféré',               color: Colors.steelGrey,       bg: '#EDEFF0' },
  disputed:       { label: 'Litige en cours',         color: Colors.faultCoral,      bg: '#FDE8E8' },
};

// Devices persisted before the ownership model existed have no `ownership` field.
export function getOwnership(device: DeviceEntry): DeviceOwnership {
  return device.ownership ?? { currentOwner: 'Vous', status: 'none', history: [] };
}

// A device is "active" (counts toward Home/Profile lists and stats) unless it has
// been archived by its owner or has been transferred away to a new owner.
export function isDeviceActive(device: DeviceEntry): boolean {
  return device.status !== 'archived' && getOwnership(device).status !== 'transferred';
}
