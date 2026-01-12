
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyA0Fyw53lB6UHr2BFVTWmJBuXJ6jtX4Dq8",
  authDomain: "fila-livre-5d28d.firebaseapp.com",
  databaseURL: "https://fila-livre-5d28d-default-rtdb.firebaseio.com",
  projectId: "fila-livre-5d28d",
  storageBucket: "fila-livre-5d28d.firebasestorage.app",
  messagingSenderId: "134262363702",
  appId: "1:134262363702:web:0e5af368f52dd03dddea97",
  measurementId: "G-R6YNQR1EXN"
};

// Verifica se a API Key é válida
export const isConfigured = 
  !!firebaseConfig.apiKey && 
  firebaseConfig.apiKey.length > 20 &&
  !firebaseConfig.apiKey.includes("COLE_");

// Inicialização segura
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  console.error("Erro ao inicializar Firebase:", e);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
