import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Appointment } from '../types';

const STORAGE_KEY = 'objectpass.appointments';

async function readAll(): Promise<Appointment[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  return JSON.parse(raw) as Appointment[];
}

async function writeAll(appointments: Appointment[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
}

export async function initAppointmentsTable(): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    if (existing === null) {
      await AsyncStorage.setItem(STORAGE_KEY, '[]');
    }
  } catch (e) {
    throw new Error(`initAppointmentsTable failed: ${String(e)}`);
  }
}

export async function getAllAppointments(): Promise<Appointment[]> {
  try {
    return await readAll();
  } catch (e) {
    throw new Error(`getAllAppointments failed: ${String(e)}`);
  }
}

export async function insertAppointment(appointment: Appointment): Promise<void> {
  try {
    const appointments = await readAll();
    const idx = appointments.findIndex((a) => a.id === appointment.id);
    if (idx !== -1) {
      appointments[idx] = appointment;
    } else {
      appointments.push(appointment);
    }
    await writeAll(appointments);
  } catch (e) {
    throw new Error(`insertAppointment failed: ${String(e)}`);
  }
}

export async function updateAppointmentById(
  id: string,
  changes: Partial<Appointment>,
): Promise<void> {
  try {
    const appointments = await readAll();
    const idx = appointments.findIndex((a) => a.id === id);
    if (idx === -1) return;
    appointments[idx] = { ...appointments[idx], ...changes };
    await writeAll(appointments);
  } catch (e) {
    throw new Error(`updateAppointmentById failed: ${String(e)}`);
  }
}

export async function cancelAppointment(id: string): Promise<void> {
  return updateAppointmentById(id, { status: 'cancelled' });
}
