// Shared ownership/transfer status display config + fallback helper.

import { Colors } from './colors';
import { formatDate } from './deviceForm';
import type { DeviceEntry, DeviceOwnership, TransferHistoryItem, TransferStatus } from '../types';

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
// been archived, has been transferred away to someone else (currentOwner is no
// longer "Vous"), or is a buyer-side claim placeholder still awaiting the previous
// owner's decision (claim_sent — not really "yours" yet).
export function isDeviceActive(device: DeviceEntry): boolean {
  if (device.status === 'archived') return false;
  const ownership = getOwnership(device);
  if (ownership.status === 'claim_sent') return false;
  return ownership.currentOwner === 'Vous';
}

// ── Buyer-side "claim an existing ObjectPass" helpers ───────────────────────────
//
// ObjectPass has no backend / multi-user data source. To demo "this serial already
// has a digital passport", we reuse one of the seeded mock devices as a stand-in
// for "a device someone else already registered": the iPhone 15 Pro seeded in
// /data/mockDevices.ts (id "2", serial "DNPH7V09PKDX"). Typing that exact serial
// number in AddDeviceScreen's identification step triggers the
// "ObjectPass existant détecté" flow instead of the normal add wizard.

export const DEMO_EXISTING_OBJECTPASS_SERIAL = 'DNPH7V09PKDX';

export function normalizeSerial(sn?: string | null): string {
  return (sn ?? '').trim().toUpperCase();
}

export function maskSerial(sn?: string): string {
  if (!sn) return '—';
  if (sn.length <= 4) return sn;
  return '•'.repeat(sn.length - 4) + sn.slice(-4);
}

// Finds a device whose serial matches (trimmed, case-insensitive) and that isn't
// already mid-claim/transfer — i.e. a "clean" existing ObjectPass a buyer could
// still request. Used by AddDeviceScreen's detection step.
export function findClaimableDeviceBySerial(devices: DeviceEntry[], serial: string): DeviceEntry | null {
  const target = normalizeSerial(serial);
  if (!target) return null;
  return (
    devices.find(
      (d) =>
        d.status !== 'archived' &&
        normalizeSerial(d.serialNumber) === target &&
        getOwnership(d).status === 'none'
    ) ?? null
  );
}

// Finds the buyer's own pending-claim placeholder device for a given "source"
// (the existing ObjectPass being claimed), matched by shared serial number.
export function findPendingClaimFor(devices: DeviceEntry[], source: DeviceEntry): DeviceEntry | undefined {
  const target = normalizeSerial(source.serialNumber);
  if (!target) return undefined;
  return devices.find(
    (d) => getOwnership(d).status === 'claim_sent' && normalizeSerial(d.serialNumber) === target
  );
}

function historyItem(event: TransferHistoryItem['event'], from?: string, to?: string): TransferHistoryItem {
  return {
    id: `th_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    event,
    date: formatDate(new Date()),
    from,
    to,
    method: 'claim',
  };
}

const DEFAULT_BUYER_LABEL = 'Nouvel acquéreur';

// Resolves a claim acceptance: the source device (the existing ObjectPass) leaves
// its current owner's active list, while the buyer's claim placeholder becomes a
// fully-owned, active device.
export function buildClaimAcceptance(
  source: DeviceEntry,
  claim: DeviceEntry,
  buyerLabel: string = DEFAULT_BUYER_LABEL
): { sourceOwnership: DeviceOwnership; claimOwnership: DeviceOwnership } {
  const sourceOwnership = getOwnership(source);
  const claimOwnership = getOwnership(claim);

  return {
    sourceOwnership: {
      ...sourceOwnership,
      currentOwner: buyerLabel,
      status: 'transferred',
      history: [...sourceOwnership.history, historyItem('completed', sourceOwnership.currentOwner, buyerLabel)],
    },
    claimOwnership: {
      ...claimOwnership,
      currentOwner: 'Vous',
      status: 'transferred',
      history: [...claimOwnership.history, historyItem('completed', sourceOwnership.currentOwner, 'Vous')],
    },
  };
}

// Resolves a claim decline: the source device stays with its current owner but is
// flagged as disputed; the buyer's claim placeholder is discarded by the caller
// (via removeDevice) since it was never added to their active list.
export function buildClaimDecline(source: DeviceEntry): DeviceOwnership {
  const sourceOwnership = getOwnership(source);
  return {
    ...sourceOwnership,
    status: 'disputed',
    history: [...sourceOwnership.history, historyItem('declined', sourceOwnership.currentOwner)],
  };
}
