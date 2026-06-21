import React, { createContext, useContext, useState } from 'react';

export interface Appointment {
  id: string;
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  device: { name: string; model: string };
  issue: { label: string; priceRange: string; urgency: string };
  repairer: { name: string; shop: string; certified: boolean; rating: number };
  date: string;
  time: string;
  type: string;
  notes: string;
  createdAt: string;
}

const MOCK_APPOINTMENTS: Appointment[] = [
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
  },
];

interface AppointmentsContextValue {
  appointments: Appointment[];
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, changes: Partial<Appointment>) => void;
  cancelAppointment: (id: string) => void;
}

const AppointmentsContext = createContext<AppointmentsContextValue | null>(null);

export function AppointmentsProvider({ children }: { children: React.ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);

  const addAppointment = (appointment: Appointment) => {
    setAppointments((prev) => [appointment, ...prev]);
  };

  const updateAppointment = (id: string, changes: Partial<Appointment>) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...changes } : a))
    );
  };

  const cancelAppointment = (id: string) => {
    updateAppointment(id, { status: 'cancelled' });
  };

  return (
    <AppointmentsContext.Provider
      value={{ appointments, addAppointment, updateAppointment, cancelAppointment }}
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
