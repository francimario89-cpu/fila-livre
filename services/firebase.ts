
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, sendPasswordResetEmail } from "firebase/auth";
import { 
  getFirestore, 
  terminate,
  initializeFirestore,
  memoryLocalCache
} from "firebase/firestore";

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

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Inicializamos o Firestore com cache em memória para evitar o erro 'unavailable' 
// que acontece quando o IndexedDB do navegador falha ou o banco não existe.
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache()
});

export { sendPasswordResetEmail };

export const isConfigured = 
  !!firebaseConfig.apiKey && 
  firebaseConfig.apiKey.length > 20;

/**
 * Função para forçar a limpeza de qualquer estado offline corrompido
 */
export const clearFirestoreCache = async () => {
  try {
    await terminate(db);
    console.log("Firestore finalizado para limpeza.");
    window.location.reload();
  } catch (e) {
    console.error("Erro ao limpar cache:", e);
    window.location.reload();
  }
};
