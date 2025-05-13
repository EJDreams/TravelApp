// screens/AuthScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, ActivityIndicator } from 'react-native';
import { getFirebaseAuth } from '../utils/firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Get the auth instance when needed
  const auth = getFirebaseAuth();

  // Validate email format
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  // Validate password strength
  const validatePassword = (password) => {
    return password.length >= 6; // Simple validation for example purposes
  };

  const login = async () => {
    // Input validation
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email and password are required');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    try {
      setErrorMessage('');
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate('Dashboard');
    } catch (error) {
      console.error(error);
      setErrorMessage('Login failed: ' + error.message);
      Alert.alert('Login Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async () => {
    // Input validation
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email and password are required');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    try {
      setErrorMessage('');
      setIsLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      navigation.navigate('Dashboard');
    } catch (error) {
      console.error(error);
      setErrorMessage('Sign up failed: ' + error.message);
      Alert.alert('Sign Up Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Travel Planner</Text>
      
      <TextInput 
        placeholder="Email" 
        value={email}
        onChangeText={setEmail} 
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        accessibilityLabel="Email input field"
      />
      
      <TextInput 
        placeholder="Password" 
        value={password}
        secureTextEntry 
        onChangeText={setPassword} 
        style={styles.input}
        accessibilityLabel="Password input field"
      />
      
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <View style={styles.buttonContainer}>
          <Button title="Login" onPress={login} disabled={isLoading} />
          <View style={styles.buttonSpacer} />
          <Button title="Sign Up" onPress={signup} disabled={isLoading} />
          <View style={styles.buttonSpacer} />
          <Button 
            title="Join a Trip" 
            onPress={() => navigation.navigate('JoinTrip')} 
            disabled={isLoading}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20 
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20
  },
  input: { 
    height: 50, 
    borderColor: 'gray', 
    borderWidth: 1, 
    marginBottom: 15, 
    paddingHorizontal: 10,
    borderRadius: 5
  },
  error: { 
    color: 'red', 
    marginBottom: 15,
    textAlign: 'center'
  },
  loader: {
    marginVertical: 20
  },
  buttonContainer: {
    width: '100%'
  },
  buttonSpacer: {
    height: 10
  }
});