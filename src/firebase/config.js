import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// انسخ Config من Firebase Console هنا
const firebaseConfig = {
  apiKey: "AIzaSyCQnN1v7p_XaHnr4AfsVCN7_OS56XsPDEQ",
  authDomain: "cancare-312a8.firebaseapp.com",
  projectId: "cancare-312a8",
  storageBucket: "cancare-312a8.firebasestorage.app",
  messagingSenderId: "703462857062",
  appId: "1:703462857062:web:74195215045f9fcdc350a7",
  measurementId: "G-K8TDQFPW5T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
