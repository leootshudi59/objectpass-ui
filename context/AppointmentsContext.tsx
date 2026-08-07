import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Appointment } from '../types';
import { useToast } from './ToastContext';
import { useAppState } from './AppStateContext';
import {
  initAppointmentsTable,
  getAllAppointments,
  insertAppointment,
  updateAppointmentById,
  cancelAppointment as dbCancelAppointment,
} from '../db/appointmentsDb';

export type { Appointment };

const MOCK_SEED: Appointment[] = [
  {
    id: 'apt_001',
    status: 'confirmed',
    device: { name: 'MacBook Pro M1', model: '2022' },
    issue: { label: 'Remplacement batterie', priceRange: '59–89 €', urgency: 'Modéré' },
    repairer: { name: 'Marc Delannoy', shop: 'iRepair Valenciennes', certified: true, rating: 4.8 },
    date: '24/06/2025',
    time: '14h00',
    type: 'En boutique',
    notes: '',
    createdAt: '2025-06-20T09:00:00.000Z',
  },
  {
    id: 'apt_002',
    status: 'completed',
    device: { name: 'iPhone 15 Pro', model: '2023' },
    issue: { label: 'Réparation écran', priceRange: '89–149 €', urgency: 'Faible' },
    repairer: { name: 'Sophie Marlier', shop: 'TechCare Cambrai', certified: true, rating: 4.5 },
    date: '10/06/2025',
    time: '10h30',
    type: 'En boutique',
    notes: 'Écran fissuré coin bas gauche',
    createdAt: '2025-06-05T14:00:00.000Z',
    repairId: 'rep_002',
  },
];

interface AppointmentsContextValue {
  appointments: Appointment[];
  loading: boolean;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, changes: Partial<Appointment>) => void;
  cancelAppointment: (id: string) => void;
}

const AppointmentsContext = createContext<AppointmentsContextValue | null>(null);

export function AppointmentsProvider({ children }: { children: React.ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
        await initAppointmentsTable();
        const rows = await getAllAppointments();
        if (cancelled) return;

        if (rows.length === 0) {
          for (const apt of MOCK_SEED) {
            await insertAppointment(apt);
          }
          if (!cancelled) setAppointments(MOCK_SEED);
        } else {
          if (!cancelled) setAppointments(rows);
        }
      } catch (e) {
        if (!cancelled) {
          console.error('Error loading appointments from database:', e);
          appSetErrorRef.current('Impossible de charger vos rendez-vous.');
          setAppointments(MOCK_SEED);
        }
      } finally {
        appSetLoadingRef.current(false);
        if (!cancelled) setLoading(false);
      }
    }

    hydrate();
    return () => { cancelled = true; };
  }, []);

  const addAppointment = (appointment: Appointment): void => {
    insertAppointment(appointment)
      .then(() => {
        setAppointments((prev) => [appointment, ...prev]);
      })
      .catch(() => {
        showToastRef.current("Impossible d'enregistrer le rendez-vous", 'error');
      });
  };

  const updateAppointment = (id: string, changes: Partial<Appointment>): void => {
    updateAppointmentById(id, changes)
      .then(() => {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...changes } : a))
        );
      })
      .catch(() => {
        showToastRef.current('Impossible de mettre à jour le rendez-vous', 'error');
      });
  };

  const cancelAppointment = (id: string): void => {
    dbCancelAppointment(id)
      .then(() => {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a))
        );
      })
      .catch(() => {
        showToastRef.current("Impossible d'annuler le rendez-vous", 'error');
      });
  };

  return (
    <AppointmentsContext.Provider
      value={{ appointments, loading, addAppointment, updateAppointment, cancelAppointment }}
    >
      {children}
    </AppointmentsContext.Provider>
  );
}

export function useAppointments(): AppointmentsContextValue {
  const ctx = useContext(AppointmentsContext);
  if (!ctx) throw new Error('useAppointments must be used inside AppointmentsProvider');
  return ctx;
}
