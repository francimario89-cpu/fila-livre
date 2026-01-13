
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

// Credenciais sincronizadas para Fila Livre
export const firebaseConfig = {
  apiKey: "AIzaSyA0Fyw53lB6UHr2BFVTWmJBuXJ6jtX4Dq8",
  authDomain: "fila-livre-5d28d.firebaseapp.com",
  databaseURL: "https://fila-livre-5d28d-default-rtdb.firebaseio.com",
  projectId: "fila-livre-5d28d",
  storageBucket: "fila-livre-5d28d.firebasestorage.app",
  messagingSenderId: "134262363702",
  appId: "1:134262363702:web:aa07548c8180863fddea97",
  measurementId: "G-M09SM7KT1P"
};

let app;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
} catch (e) {
  console.error("Erro na inicialização crítica do Firebase:", e);
  app = {} as any;
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Força persistência local para garantir funcionamento em redes instáveis (Offline-First)
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Múltiplas abas abertas, persistência desabilitada nesta instância.");
    } else if (err.code === 'unimplemented') {
      console.warn("O navegador atual não suporta persistência offline.");
    }
  });
}
