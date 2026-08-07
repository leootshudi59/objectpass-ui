import { SQLiteBindValue } from 'expo-sqlite';
import type { DeviceCategory, DeviceStatus, Repair, DeviceEntry } from '../types';
import { getDb } from './database.native';

interface DeviceRow {
  id: string;
  name: string;
  model: string;
  category: string;
  healthScore: number;
  status: string;
  lastRepairDate: string | null;
  warrantyActive: number;
  warrantyExpiry: string | null;
  repairs: string;
  battery: number;
  screen: number;
  storage: number;
  serialNumber: string | null;
  purchaseDate: string | null;
  purchasePrice: string | null;
  purchasePlace: string | null;
  warrantyMonths: number | null;
  hasInvoice: number | null;
  color: string | null;
  createdAt: string | null;
}

function rowToDeviceEntry(row: DeviceRow): DeviceEntry {
  const entry: DeviceEntry = {
    id: row.id,
    name: row.name,
    model: row.model,
    category: row.category as DeviceCategory,
    healthScore: row.healthScore,
    status: row.status as DeviceStatus,
    lastRepairDate: row.lastRepairDate,
    warrantyActive: row.warrantyActive === 1,
    warrantyExpiry: row.warrantyExpiry,
    repairs: JSON.parse(row.repairs) as Repair[],
    battery: row.battery,
    screen: row.screen,
    storage: row.storage,
  };
  if (row.serialNumber !== null) entry.serialNumber = row.serialNumber;
  if (row.purchaseDate !== null) entry.purchaseDate = row.purchaseDate;
  if (row.purchasePrice !== null) entry.purchasePrice = row.purchasePrice;
  if (row.purchasePlace !== null) entry.purchasePlace = row.purchasePlace;
  if (row.warrantyMonths !== null) entry.warrantyMonths = row.warrantyMonths;
  if (row.hasInvoice !== null) entry.hasInvoice = row.hasInvoice === 1;
  if (row.color !== null) entry.color = row.color;
  if (row.createdAt !== null) entry.createdAt = row.createdAt;
  return entry;
}

export async function initDevicesTable(): Promise<void> {
  try {
    const db = await getDb();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        model TEXT NOT NULL,
        category TEXT NOT NULL,
        healthScore INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL,
        lastRepairDate TEXT,
        warrantyActive INTEGER NOT NULL DEFAULT 0,
        warrantyExpiry TEXT,
        repairs TEXT NOT NULL DEFAULT '[]',
        battery INTEGER NOT NULL DEFAULT 0,
        screen INTEGER NOT NULL DEFAULT 0,
        storage INTEGER NOT NULL DEFAULT 0,
        serialNumber TEXT,
        purchaseDate TEXT,
        purchasePrice TEXT,
        purchasePlace TEXT,
        warrantyMonths INTEGER,
        hasInvoice INTEGER,
        color TEXT,
        createdAt TEXT
      );
    `);
  } catch (e) {
    throw new Error(`initDevicesTable failed: ${String(e)}`);
  }
}

export async function getAllDevices(): Promise<DeviceEntry[]> {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<DeviceRow>(
      'SELECT * FROM devices ORDER BY rowid ASC',
      []
    );
    return rows.map(rowToDeviceEntry);
  } catch (e) {
    throw new Error(`getAllDevices failed: ${String(e)}`);
  }
}

export async function insertDevice(device: DeviceEntry): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO devices (
        id, name, model, category, healthScore, status, lastRepairDate,
        warrantyActive, warrantyExpiry, repairs, battery, screen, storage,
        serialNumber, purchaseDate, purchasePrice, purchasePlace,
        warrantyMonths, hasInvoice, color, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        device.id,
        device.name,
        device.model,
        device.category,
        device.healthScore,
        device.status,
        device.lastRepairDate ?? null,
        device.warrantyActive ? 1 : 0,
        device.warrantyExpiry ?? null,
        JSON.stringify(device.repairs),
        device.battery,
        device.screen,
        device.storage,
        device.serialNumber ?? null,
        device.purchaseDate ?? null,
        device.purchasePrice ?? null,
        device.purchasePlace ?? null,
        device.warrantyMonths ?? null,
        device.hasInvoice != null ? (device.hasInvoice ? 1 : 0) : null,
        device.color ?? null,
        device.createdAt ?? null,
      ]
    );
  } catch (e) {
    throw new Error(`insertDevice failed: ${String(e)}`);
  }
}

export async function updateDeviceById(id: string, changes: Partial<DeviceEntry>): Promise<void> {
  try {
    const db = await getDb();
    const setClauses: string[] = [];
    const values: SQLiteBindValue[] = [];

    for (const [key, val] of Object.entries(changes)) {
      if (key === 'id') continue;
      setClauses.push(`${key} = ?`);

      let bindVal: SQLiteBindValue;
      if (val === undefined || val === null) {
        bindVal = null;
      } else if (key === 'repairs') {
        bindVal = JSON.stringify(val);
      } else if (key === 'warrantyActive' || key === 'hasInvoice') {
        bindVal = val ? 1 : 0;
      } else if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        bindVal = val;
      } else {
        bindVal = JSON.stringify(val);
      }
      values.push(bindVal);
    }

    if (setClauses.length === 0) return;
    values.push(id);

    await db.runAsync(
      `UPDATE devices SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );
  } catch (e) {
    throw new Error(`updateDeviceById failed: ${String(e)}`);
  }
}

export async function deleteDevice(id: string): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM devices WHERE id = ?', [id]);
  } catch (e) {
    throw new Error(`deleteDevice failed: ${String(e)}`);
  }
}
