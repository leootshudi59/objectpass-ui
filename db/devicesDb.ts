import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DeviceEntry } from '../types';

const STORAGE_KEY = 'objectpass.devices';

async function readAll(): Promise<DeviceEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  return JSON.parse(raw) as DeviceEntry[];
}

async function writeAll(devices: DeviceEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
}

export async function initDevicesTable(): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    if (existing === null) {
      await AsyncStorage.setItem(STORAGE_KEY, '[]');
    }
  } catch (e) {
    throw new Error(`initDevicesTable failed: ${String(e)}`);
  }
}

export async function getAllDevices(): Promise<DeviceEntry[]> {
  try {
    return await readAll();
  } catch (e) {
    throw new Error(`getAllDevices failed: ${String(e)}`);
  }
}

export async function insertDevice(device: DeviceEntry): Promise<void> {
  try {
    const devices = await readAll();
    const idx = devices.findIndex((d) => d.id === device.id);
    if (idx !== -1) {
      devices[idx] = device;
    } else {
      devices.push(device);
    }
    await writeAll(devices);
  } catch (e) {
    throw new Error(`insertDevice failed: ${String(e)}`);
  }
}

export async function updateDeviceById(
  id: string,
  changes: Partial<DeviceEntry>,
): Promise<void> {
  try {
    const devices = await readAll();
    const idx = devices.findIndex((d) => d.id === id);
    if (idx === -1) return;
    devices[idx] = { ...devices[idx], ...changes };
    await writeAll(devices);
  } catch (e) {
    throw new Error(`updateDeviceById failed: ${String(e)}`);
  }
}

export async function deleteDevice(id: string): Promise<void> {
  try {
    const devices = await readAll();
    await writeAll(devices.filter((d) => d.id !== id));
  } catch (e) {
    throw new Error(`deleteDevice failed: ${String(e)}`);
  }
}
