import { SQLiteBindValue } from 'expo-sqlite';
import type { Appointment, AppointmentStatus } from '../types';
import { getDb } from './database.native';

interface AppointmentRow {
  id: string;
  status: string;
  device: string;
  issue: string;
  repairer: string;
  date: string;
  time: string;
  type: string;
  notes: string;
  createdAt: string;
  repairId: string | null;
}

function rowToAppointment(row: AppointmentRow): Appointment {
  const apt: Appointment = {
    id: row.id,
    status: row.status as AppointmentStatus,
    device: JSON.parse(row.device) as Appointment['device'],
    issue: JSON.parse(row.issue) as Appointment['issue'],
    repairer: JSON.parse(row.repairer) as Appointment['repairer'],
    date: row.date,
    time: row.time,
    type: row.type,
    notes: row.notes,
    createdAt: row.createdAt,
  };
  if (row.repairId !== null) apt.repairId = row.repairId;
  return apt;
}

export async function initAppointmentsTable(): Promise<void> {
  try {
    const db = await getDb();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        device TEXT NOT NULL,
        issue TEXT NOT NULL,
        repairer TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        type TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        createdAt TEXT NOT NULL,
        repairId TEXT
      );
    `);
  } catch (e) {
    throw new Error(`initAppointmentsTable failed: ${String(e)}`);
  }
}

export async function getAllAppointments(): Promise<Appointment[]> {
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<AppointmentRow>(
      'SELECT * FROM appointments ORDER BY rowid ASC',
      []
    );
    return rows.map(rowToAppointment);
  } catch (e) {
    throw new Error(`getAllAppointments failed: ${String(e)}`);
  }
}

export async function insertAppointment(appointment: Appointment): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO appointments (
        id, status, device, issue, repairer, date, time, type, notes, createdAt, repairId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        appointment.id,
        appointment.status,
        JSON.stringify(appointment.device),
        JSON.stringify(appointment.issue),
        JSON.stringify(appointment.repairer),
        appointment.date,
        appointment.time,
        appointment.type,
        appointment.notes,
        appointment.createdAt,
        appointment.repairId ?? null,
      ]
    );
  } catch (e) {
    throw new Error(`insertAppointment failed: ${String(e)}`);
  }
}

export async function updateAppointmentById(
  id: string,
  changes: Partial<Appointment>,
): Promise<void> {
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
      } else if (key === 'device' || key === 'issue' || key === 'repairer') {
        bindVal = JSON.stringify(val);
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
      `UPDATE appointments SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );
  } catch (e) {
    throw new Error(`updateAppointmentById failed: ${String(e)}`);
  }
}

export async function cancelAppointment(id: string): Promise<void> {
  return updateAppointmentById(id, { status: 'cancelled' });
}
