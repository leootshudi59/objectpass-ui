import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './context/AuthContext';
import { AppointmentsProvider } from './context/AppointmentsContext';
import { AppNavigator } from './navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <AppointmentsProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </AppointmentsProvider>
    </AuthProvider>
  );
}
