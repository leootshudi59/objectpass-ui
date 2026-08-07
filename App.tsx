import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';
import { AppStateProvider } from './context/AppStateContext';
import { AppointmentsProvider } from './context/AppointmentsContext';
import { DevicesProvider } from './context/DevicesContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ui/ToastContainer';
import { GlobalLoadingOverlay } from './components/ui/GlobalLoadingOverlay';
import { GlobalErrorBanner } from './components/ui/GlobalErrorBanner';
import { AppNavigator } from './navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <AppStateProvider>
            <DevicesProvider>
              <AppointmentsProvider>
                <View style={{ flex: 1 }}>
                  <StatusBar style="dark" />
                  <AppNavigator />
                  <ToastContainer />
                  <GlobalLoadingOverlay />
                  <GlobalErrorBanner />
                </View>
              </AppointmentsProvider>
            </DevicesProvider>
          </AppStateProvider>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
