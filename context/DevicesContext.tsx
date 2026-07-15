import React, { createContext, useContext, useState } from 'react';
import { mockDevices } from '../data/mockDevices';
import type { Device } from '../data/mockDevices';

export interface DeviceEntry extends Device {
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: string;
  purchasePlace?: string;
  warrantyMonths?: number;
  hasInvoice?: boolean;
  color?: string;
  createdAt?: string;
}

interface DevicesContextValue {
  devices: DeviceEntry[];
  newDeviceId: string | null;
  addDevice: (device: DeviceEntry) => void;
  updateDevice: (id: string, changes: Partial<DeviceEntry>) => void;
  removeDevice: (id: string) => void;
  clearNewDevice: () => void;
}

const DevicesContext = createContext<DevicesContextValue | null>(null);

const SEED: DeviceEntry[] = mockDevices.map((d) => ({ ...d }));

export function DevicesProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<DeviceEntry[]>(SEED);
  const [newDeviceId, setNewDeviceId] = useState<string | null>(null);

  const addDevice = (device: DeviceEntry) => {
    setDevices((prev) => [device, ...prev]);
    setNewDeviceId(device.id);
  };

  const updateDevice = (id: string, changes: Partial<DeviceEntry>) => {
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, ...changes } : d)));
  };

  const removeDevice = (id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
  };

  const clearNewDevice = () => setNewDeviceId(null);

  return (
    <DevicesContext.Provider
      value={{ devices, newDeviceId, addDevice, updateDevice, removeDevice, clearNewDevice }}
    >
      {children}
    </DevicesContext.Provider>
  );
}

export function useDevices(): DevicesContextValue {
  const ctx = useContext(DevicesContext);
  if (!ctx) throw new Error('useDevices must be inside DevicesProvider');
  return ctx;
}
