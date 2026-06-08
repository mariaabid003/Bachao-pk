import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey:            "AIzaSyCeyxHbZ6cyKRxInKclvF5w78-lETJp-tU",
  authDomain:        "bachao-app-c3348.firebaseapp.com",
  projectId:         "bachao-app-c3348",
  storageBucket:     "bachao-app-c3348.firebasestorage.app",
  messagingSenderId: "439412513988",
  appId:             "1:439412513988:web:38e6769bee9c2edad07d91",
};

const app = initializeApp(firebaseConfig);

// Use AsyncStorage persistence on native so auth survives app restarts
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    auth = getAuth(app);
  }
}

export { auth };
export const db = getFirestore(app);
export default app;
