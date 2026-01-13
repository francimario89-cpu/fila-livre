
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";

// Configurações fornecidas pelo usuário
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

// Inicialização segura (evita o erro de inicialização duplicada no Vercel/Hot Reload)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Validação básica da chave
export const isConfigured = 
  !!firebaseConfig.apiKey && 
  firebaseConfig.apiKey.length > 20;

/**
 * Verifica se o banco está respondendo.
 * Se falhar, o erro dirá exatamente o que falta (regras ou banco não criado).
 */
export const checkDatabaseHealth = async () => {
  try {
    // Tenta ler uma coleção qualquer (mesmo que não exista)
    const q = query(collection(db, "health_check"), limit(1));
    await getDocs(q);
    return { ok: true };
  } catch (e: any) {
    console.error("Firebase Connection Error:", e.code, e.message);
    return { 
      ok: false, 
      code: e.code, 
      message: e.message 
    };
  }
};
