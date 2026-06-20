import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { HomeScreen } from '../screens/HomeScreen';
import { DiagnosticScreen } from '../screens/DiagnosticScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RepairersScreen } from '../screens/RepairersScreen';

// ── Navigation types ───────────────────────────────────────────────────────────

export type MainStackParamList = {
  Tabs: undefined;
  Repairers: {
    deviceName: string;
    deviceModel: string;
    issueLabel: string;
    priceRange: string;
    urgency: string;
  };
};

// ── Placeholders ───────────────────────────────────────────────────────────────

function Placeholder({ label }: { label: string }) {
  return (
    <View style={ph.container}>
      <Text style={ph.text}>{label}</Text>
    </View>
  );
}

const ph = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cleanWhite },
  text: { fontSize: 16, color: Colors.steelGrey, fontWeight: '600' },
});

// ── Tab navigator (inner) ──────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.repairTeal,
        tabBarInactiveTintColor: Colors.steelGrey,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, size, focused }) => {
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
              <View style={[styles.addIcon, focused && styles.addIconActive]}>
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
        component={() => <Placeholder label="Ajouter un appareil" />}
        options={{ tabBarLabel: '' }}
      />
      <Tab.Screen
        name="Rendez_vous"
        component={() => <Placeholder label="Rendez-vous" />}
        options={{ tabBarLabel: 'Rendez-vous' }}
      />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ── Main stack (tabs + full-screen overlays) ───────────────────────────────────

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
  addIconActive: {
    backgroundColor: Colors.objectNavy,
  },
});
