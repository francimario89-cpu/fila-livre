
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * ✅ CONFIGURAÇÃO ATUALIZADA COM SUCESSO
 * Projeto: fila-livre-5d28d
 * O aplicativo agora está conectado ao seu banco de dados Firebase.
 */
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

// Verifica se as chaves foram preenchidas (não são mais os placeholders)
export const isConfigured = 
  firebaseConfig.apiKey !== "" && 
  !firebaseConfig.apiKey.includes("COLE_") &&
  firebaseConfig.appId.startsWith("1:");

// Inicialização do Firebase com suas credenciais reais
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
