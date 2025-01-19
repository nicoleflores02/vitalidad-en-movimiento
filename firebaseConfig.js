// firebase.Config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDCCD-kJubIBFjsIDM1DVtiZ7O3uyrhM58",
  authDomain: "vitalidad-en-movimiento.firebaseapp.com",
  projectId: "vitalidad-en-movimiento",
  storageBucket: "vitalidad-en-movimiento.firebasestorage.app",
  messagingSenderId: "36030334800",
  appId: "1:36030334800:web:d9d5616bb4e0a255f10e55",
  measurementId: "G-BWP052WNKF"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
