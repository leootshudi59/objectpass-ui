import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './context/AuthContext';
import { AppointmentsProvider } from './context/AppointmentsContext';
import { DevicesProvider } from './context/DevicesContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ui/ToastContainer';
import { AppNavigator } from './navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <DevicesProvider>
        <AppointmentsProvider>
          <ToastProvider>
            <View style={{ flex: 1 }}>
              <StatusBar style="dark" />
              <AppNavigator />
              <ToastContainer />
            </View>
          </ToastProvider>
        </AppointmentsProvider>
      </DevicesProvider>
    </AuthProvider>
  );
}
