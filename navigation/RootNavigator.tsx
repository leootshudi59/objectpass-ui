import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { HomeScreen } from '../screens/HomeScreen';
import { DiagnosticScreen } from '../screens/DiagnosticScreen';

// ── Placeholder screens (not yet built) ────────────────────────────────────────

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

// ── Tab navigator ──────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: Colors.repairTeal,
          tabBarInactiveTintColor: Colors.steelGrey,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ color, size, focused }) => {
            const icons: Record<string, string> = {
              Accueil:      'home',
              Diagnostic:   'activity',
              Ajouter:      'plus',
              Rendez_vous:  'calendar',
              Profil:       'user',
            };
            const name = icons[route.name] ?? 'circle';
            if (route.name === 'Ajouter') {
              return (
                <View style={[styles.addIcon, focused && styles.addIconActive]}>
                  <Feather name="plus" size={28} color={Colors.cleanWhite} />
                </View>
              );
            }
            return <Feather name={name as any} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Accueil"     component={HomeScreen} />
        <Tab.Screen name="Diagnostic"  component={DiagnosticScreen} />
        <Tab.Screen
          name="Ajouter"
          component={() => <Placeholder label="Ajouter un appareil" />}
          options={{ tabBarLabel: '' }}
        />
        <Tab.Screen name="Rendez_vous" component={() => <Placeholder label="Rendez-vous" />}
          options={{ tabBarLabel: 'Rendez-vous' }} />
        <Tab.Screen name="Profil"      component={() => <Placeholder label="Profil" />} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.cleanWhite,
    borderTopColor: Colors.borderMist,
    borderTopWidth: 1,
    height: 76,
    paddingBottom: 12,
    paddingTop: 6,
    overflow: 'visible',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  addIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.repairTeal,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -16 }],
    shadowColor: Colors.repairTeal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  addIconActive: {
    backgroundColor: Colors.objectNavy,
  },
});
