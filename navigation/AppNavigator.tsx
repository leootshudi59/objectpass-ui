import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { Colors } from '../constants/colors';

const Root = createNativeStackNavigator();

function SplashView() {
  return (
    <View style={styles.splash}>
      <View style={styles.splashLogoBlock}>
        <Text style={styles.splashOP}>OP</Text>
      </View>
      <Text style={styles.splashObject}>Object</Text>
      <Text style={styles.splashPass}>Pass</Text>
    </View>
  );
}

export function AppNavigator() {
  const { state } = useAuth();

  if (state.isLoading) {
    return <SplashView />;
  }

  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {state.isLoggedIn ? (
          <Root.Screen name="Main" component={MainNavigator} />
        ) : (
          <Root.Screen name="Auth" component={AuthNavigator} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.objectNavy,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  splashLogoBlock: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#123D45',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  splashOP: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.repairTeal,
  },
  splashObject: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.cleanWhite,
    letterSpacing: -0.5,
  },
  splashPass: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.repairTeal,
    letterSpacing: -0.5,
  },
});
