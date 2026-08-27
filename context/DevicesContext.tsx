import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { mockDevices } from '../data/mockDevices';
import type { DeviceEntry } from '../types';
import { useToast } from './ToastContext';
import { useAppState } from './AppStateContext';
import {
  initDevicesTable,
  getAllDevices,
  insertDevice,
  updateDeviceById,
  deleteDevice,
} from '../db/devicesDb';

export type { DeviceEntry };

interface DevicesContextValue {
  devices: DeviceEntry[];
  loading: boolean;
  newDeviceId: string | null;
  // Return a Promise so callers that need to chain several mutations (e.g. a
  // claim acceptance touching two devices) can `await` each one in turn —
  // the web AsyncStorage fallback reads/writes the whole list as one blob,
  // so two unsequenced writes race and the second silently clobbers the first.
  addDevice: (device: DeviceEntry) => Promise<void>;
  updateDevice: (id: string, changes: Partial<DeviceEntry>) => Promise<void>;
  removeDevice: (id: string) => Promise<void>;
  clearNewDevice: () => void;
}

const DevicesContext = createContext<DevicesContextValue | null>(null);

const MOCK_SEED: DeviceEntry[] = mockDevices.map((d) => ({ ...d }));

export function DevicesProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<DeviceEntry[]>([]);
  const [newDeviceId, setNewDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;
  const { setLoading: appSetLoading, setError: appSetError } = useAppState();
  const appSetLoadingRef = useRef(appSetLoading);
  appSetLoadingRef.current = appSetLoading;
  const appSetErrorRef = useRef(appSetError);
  appSetErrorRef.current = appSetError;

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      appSetLoadingRef.current(true);
      try {
        await initDevicesTable();
        const rows = await getAllDevices();
        if (cancelled) return;

        if (rows.length === 0) {
          for (const device of MOCK_SEED) {
            await insertDevice(device);
          }
          if (!cancelled) setDevices(MOCK_SEED);
        } else {
          if (!cancelled) setDevices(rows);
        }
      } catch (e) {
        if (!cancelled) {
          console.error('Error loading devices from database:', e);
          appSetErrorRef.current('Impossible de charger vos appareils.');
          setDevices(MOCK_SEED);
        }
      } finally {
        appSetLoadingRef.current(false);
        if (!cancelled) setLoading(false);
      }
    }

    hydrate();
    return () => { cancelled = true; };
  }, []);

  const addDevice = (device: DeviceEntry): Promise<void> => {
    return insertDevice(device)
      .then(() => {
        setDevices((prev) => [device, ...prev]);
        setNewDeviceId(device.id);
      })
      .catch(() => {
        showToastRef.current("Impossible d'enregistrer l'appareil", 'error');
      });
  };

  const updateDevice = (id: string, changes: Partial<DeviceEntry>): Promise<void> => {
    return updateDeviceById(id, changes)
      .then(() => {
        setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, ...changes } : d)));
      })
      .catch(() => {
        showToastRef.current("Impossible de mettre à jour l'appareil", 'error');
      });
  };

  const removeDevice = (id: string): Promise<void> => {
    return deleteDevice(id)
      .then(() => {
        setDevices((prev) => prev.filter((d) => d.id !== id));
      })
      .catch(() => {
        showToastRef.current("Impossible de supprimer l'appareil", 'error');
      });
  };

  const clearNewDevice = () => setNewDeviceId(null);

  return (
    <DevicesContext.Provider
      value={{ devices, loading, newDeviceId, addDevice, updateDevice, removeDevice, clearNewDevice }}
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
