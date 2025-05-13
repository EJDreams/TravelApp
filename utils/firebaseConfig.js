// utils/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Lazy initialization for Firebase Auth and Firestore
let _auth = null;
let _db = null;

export const getFirebaseAuth = () => {
  if (!_auth) {
    _auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  }
  return _auth;
};

export const getFirebaseDb = () => {
  if (!_db) {
    _db = getFirestore(app);
  }
  return _db;
};

// REMOVE the following lines that initialize at import time:
// export const auth = getFirebaseAuth();
// export const db = getFirebaseDb();