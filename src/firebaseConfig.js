import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

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
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { db, auth, analytics };
