import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './context/AuthContext';
import { AppointmentsProvider } from './context/AppointmentsContext';
import { DevicesProvider } from './context/DevicesContext';
import { AppNavigator } from './navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <DevicesProvider>
        <AppointmentsProvider>
          <StatusBar style="dark" />
          <AppNavigator />
        </AppointmentsProvider>
      </DevicesProvider>
    </AuthProvider>
  );
}
