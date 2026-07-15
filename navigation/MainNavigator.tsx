import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { HomeScreen } from '../screens/HomeScreen';
import { DiagnosticScreen } from '../screens/DiagnosticScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RepairersScreen } from '../screens/RepairersScreen';
import { BookingScreen } from '../screens/BookingScreen';
import { AppointmentsScreen } from '../screens/AppointmentsScreen';
import { AppointmentDetailScreen } from '../screens/AppointmentDetailScreen';
import { AddDeviceScreen } from '../screens/AddDeviceScreen';
import { useAppointments } from '../context/AppointmentsContext';

// ── Navigation types ───────────────────────────────────────────────────────────

export type MainStackParamList = {
  Tabs: { screen?: string } | undefined;
  Repairers: {
    deviceName: string;
    deviceModel: string;
    issueLabel: string;
    priceRange: string;
    urgency: string;
  };
  Booking: {
    repairer: {
      name: string;
      shop: string;
      rating: number;
      reviewCount: number;
      certified: boolean;
      tags: string[];
      price: string;
    };
    diagnosis: {
      deviceName: string;
      deviceModel: string;
      issueLabel: string;
      priceRange: string;
      urgency: string;
    };
  };
  AppointmentDetail: {
    appointmentId: string;
  };
  AddDevice: undefined;
};

// ── Tab navigator ──────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { appointments } = useAppointments();
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.repairTeal,
        tabBarInactiveTintColor: Colors.steelGrey,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Accueil:     'home',
            Diagnostic:  'activity',
            Ajouter:     'plus',
            Rendez_vous: 'calendar',
            Profil:      'user',
          };
          const name = icons[route.name] ?? 'circle';
          if (route.name === 'Ajouter') {
            return (
              <View style={styles.addIcon}>
                <Feather name="plus" size={32} color={Colors.cleanWhite} />
              </View>
            );
          }
          return <Feather name={name as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Accueil"    component={HomeScreen} />
      <Tab.Screen name="Diagnostic" component={DiagnosticScreen} />
      <Tab.Screen
        name="Ajouter"
        component={HomeScreen}
        options={{ tabBarLabel: '' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('AddDevice');
          },
        })}
      />
      <Tab.Screen
        name="Rendez_vous"
        component={AppointmentsScreen}
        options={{
          tabBarLabel: 'Rendez-vous',
          tabBarBadge: confirmedCount > 0 ? confirmedCount : undefined,
        }}
      />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ── Main stack ─────────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="Repairers"
        component={RepairersScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="AppointmentDetail"
        component={AppointmentDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="AddDevice"
        component={AddDeviceScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.cleanWhite,
    borderTopColor: Colors.borderMist,
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 10,
    paddingTop: 6,
    overflow: 'visible',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  addIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.repairTeal,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -10 }],
    shadowColor: Colors.repairTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
