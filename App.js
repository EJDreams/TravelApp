// App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { getFirebaseAuth } from './utils/firebaseConfig'; // Updated import
import { onAuthStateChanged } from 'firebase/auth';

// Import the UserProvider
import { UserProvider } from './contexts/UserContext';

// Import screens
import AuthScreen from './screens/AuthScreen';
import Dashboard from './screens/Dashboard';
import Itinerary from './screens/Itinerary';
import Expenses from './screens/Expenses';
import PackingList from './screens/PackingList';
import JoinTrip from './screens/JoinTrip';
import CreateTrip from './screens/CreateTrip';

// Create navigation stacks
const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();

// Auth Navigator
const AuthNavigator = () => (
  <AuthStack.Navigator>
    <AuthStack.Screen 
      name="Auth" 
      component={AuthScreen} 
      options={{ headerShown: false }}
    />
    <AuthStack.Screen 
      name="JoinTrip" 
      component={JoinTrip} 
      options={{ title: 'Join a Trip' }}
    />
  </AuthStack.Navigator>
);

// App Navigator
const AppNavigator = () => (
  <AppStack.Navigator>
    <AppStack.Screen 
      name="Dashboard" 
      component={Dashboard} 
      options={{ title: 'Trip Dashboard' }}
    />
    <AppStack.Screen 
      name="Itinerary" 
      component={Itinerary} 
      options={{ title: 'Trip Itinerary' }}
    />
    <AppStack.Screen 
      name="Expenses" 
      component={Expenses} 
      options={{ title: 'Trip Expenses' }}
    />
    <AppStack.Screen 
      name="PackingList" 
      component={PackingList} 
      options={{ title: 'Packing List' }}
    />
    <AppStack.Screen 
      name="JoinTrip" 
      component={JoinTrip} 
      options={{ title: 'Join a Trip' }}
    />
    <AppStack.Screen 
      name="CreateTrip" 
      component={CreateTrip} 
      options={{ title: 'Create a Trip' }}
    />
  </AppStack.Navigator>
);

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // Handle user state changes
  const onAuthStateChangedHandler = (user) => {
    setUser(user);
    if (initializing) setInitializing(false);
  };

  useEffect(() => {
    // Add a small delay to ensure runtime is ready before firebase initialization
    const initAuth = setTimeout(() => {
      const auth = getFirebaseAuth();
      const subscriber = onAuthStateChanged(auth, onAuthStateChangedHandler);
      return () => {
        subscriber(); // unsubscribe on unmount
        clearTimeout(initAuth);
      };
    }, 500);

    return () => clearTimeout(initAuth);
  }, []);

  // Show loading indicator while initializing
  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading Trip Planner...</Text>
      </View>
    );
  }

  return (
    <UserProvider>
      <NavigationContainer>
        {user ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </UserProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10
  }
});