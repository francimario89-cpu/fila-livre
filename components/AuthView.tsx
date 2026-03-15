
import React, { useState } from 'react';
import { LOGO_SVG } from '../constants';
import { auth, db, sendPasswordResetEmail } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, getDocFromServer } from 'firebase/firestore';
import { Mail, User, Building2, ChevronLeft, Lock, Eye, EyeOff, KeyRound, Loader2, AlertCircle, CheckCircle2, Scissors, ArrowRight, UserPlus, Phone, MessageCircle, Sun, Moon } from 'lucide-react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
  }
}

interface AuthViewProps {
  onLogin: (email: string, role: 'admin' | 'staff' | 'client') => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, theme = 'dark', onToggleTheme }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'admin' | 'staff' | 'client'>('client');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const handleFirestoreError = (err: any, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: err instanceof Error ? err.message : String(err),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    return `Erro de permissão (${operationType}): Verifique as regras do Firestore para o caminho ${path}`;
  };

  const isLight = theme === 'light';

  const handleForgotPassword = async () => {
    if (!identifier) {
      setError('Informe seu e-mail ou celular para recuperar a senha.');
      return;
    }
    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      const email = await findEmailByIdentifier(identifier);
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      console.error(err);
      setError('Erro ao enviar e-mail: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isPhoneFormat = (input: string) => {
    const digitsOnly = input.replace(/\D/g, '');
    // Aceita números de 8 a 15 dígitos (considerando DDI, DDD e o nono dígito)
    return /^\d+$/.test(digitsOnly) && !input.includes('@') && digitsOnly.length >= 8 && digitsOnly.length <= 15;
  };

  const normalizePhone = (input: string) => {
    const digits = input.replace(/\D/g, '');
    // Se começar com 55 e tiver mais de 11 dígitos, remove o 55 (DDI Brasil)
    if (digits.length > 11 && digits.startsWith('55')) {
      return digits.substring(2);
    }
    return digits;
  };

  const findEmailByIdentifier = async (input: string) => {
    const clean = input.trim().toLowerCase();
    if (isPhoneFormat(clean)) {
      const normalized = normalizePhone(clean);
      try {
        const q = query(collection(db, "users"), where("phone", "==", normalized));
        const snap = await getDocs(q);
        if (!snap.empty) return snap.docs[0].data().email;
      } catch (err) {
        console.warn("Não foi possível consultar o telefone (provavelmente permissão). Usando fallback.", err);
        // Se falhar a consulta (comum para usuários não logados), continuamos com o fallback
      }
      return `${normalized}@telefone.com`;
    }
    return clean;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const finalIdentifier = await findEmailByIdentifier(identifier);
      if (isRegistering) {
        if (!name) throw new Error('Nome é obrigatório');
        if (password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres');
        
        const result = await createUserWithEmailAndPassword(auth, finalIdentifier, password);
        await updateProfile(result.user, { displayName: name });
        
        const userRef = doc(db, "users", result.user.uid);
        const phoneData = isPhoneFormat(identifier) ? normalizePhone(identifier) : null;
        
        try {
          await setDoc(userRef, {
            uid: result.user.uid,
            email: result.user.email,
            name: name,
            role: role,
            phone: phoneData,
            createdAt: Date.now()
          }, { merge: true });
        } catch (fsErr: any) {
          setError(handleFirestoreError(fsErr, OperationType.WRITE, `users/${result.user.uid}`));
          setIsLoading(false);
          return;
        }
        
        onLogin(result.user.email!, role);
      } else {
        const result = await signInWithEmailAndPassword(auth, finalIdentifier, password);
        const userRef = doc(db, "users", result.user.uid);
        let userRoleResult: 'admin' | 'staff' | 'client' = 'client';
        try {
          const userSnap = await getDoc(userRef);
          userRoleResult = userSnap.exists() ? userSnap.data().role : 'client';
        } catch (fsErr) {
          console.warn("Erro ao buscar perfil, usando role padrão", fsErr);
        }
        onLogin(result.user.email!, userRoleResult);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') setError('Dados incorretos.');
      else if (err.code === 'auth/email-already-in-use') {
        if (isPhoneFormat(identifier)) {
          setError('Este número de celular já está cadastrado.');
        } else {
          setError('Este e-mail já está em uso.');
        }
      }
      else setError('Erro ao autenticar: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative transition-colors duration-500 ${isLight ? 'bg-slate-50' : 'bg-[#050810]'} overflow-y-auto py-10`}>
      
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <button 
          onClick={onToggleTheme} 
          className={`p-3 rounded-2xl shadow-xl transition-all active:scale-95 ${isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-amber-400 border border-white/5'}`}
        >
          {isLight ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      <div className="w-full max-w-sm relative z-10 space-y-6 sm:space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto drop-shadow-2xl">{LOGO_SVG}</div>
          <h1 className={`text-2xl font-black font-orbitron tracking-tighter uppercase leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>FILA LIVRE</h1>
          <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.4em]">GERENCIAMENTO INTELIGENTE</p>
        </div>

        <div className={`p-5 sm:p-6 rounded-[32px] shadow-2xl border ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900/80 border-white/5 backdrop-blur-xl'}`}>
          <div className="flex bg-slate-950/50 p-1 rounded-2xl mb-6 sm:mb-8">
            <button 
              onClick={() => setIsRegistering(false)}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isRegistering ? 'bg-teal-500 text-slate-950' : 'text-slate-50'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => setIsRegistering(true)}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isRegistering ? 'bg-teal-500 text-slate-950' : 'text-slate-50'}`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4 sm:space-y-5">
            {isRegistering && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Conta</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      type="button"
                      onClick={() => setRole('client')}
                      className={`py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${role === 'client' ? 'bg-teal-500/10 border-teal-500 text-teal-500' : 'bg-transparent border-slate-800 text-slate-500'}`}
                    >
                      Cliente
                    </button>
                    <button 
                      type="button"
                      onClick={() => setRole('staff')}
                      className={`py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${role === 'staff' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-transparent border-slate-800 text-slate-500'}`}
                    >
                      Equipe
                    </button>
                    <button 
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${role === 'admin' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-transparent border-slate-800 text-slate-500'}`}
                    >
                      Gestor
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Seu Nome</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input required value={name} onChange={e => setName(e.target.value.toUpperCase())} placeholder="NOME COMPLETO" className={`w-full border pl-12 pr-4 py-4 rounded-2xl text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-teal-500/20 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-950' : 'bg-slate-950 border-slate-800 text-white'}`} />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail ou Celular</label>
              <div className="relative">
                {isPhoneFormat(identifier) ? (
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500" size={18} />
                ) : (
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                )}
                <input 
                  required 
                  value={identifier} 
                  onChange={e => setIdentifier(e.target.value)} 
                  placeholder="EX: (11) 99999-9999 OU EMAIL" 
                  inputMode={isPhoneFormat(identifier) ? "tel" : "email"}
                  className={`w-full border pl-12 pr-4 py-4 rounded-2xl text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-teal-500/20 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-950' : 'bg-slate-950 border-slate-800 text-white'}`} 
                />
              </div>
              {isPhoneFormat(identifier) && (
                <p className="text-[8px] text-teal-500 font-bold uppercase tracking-tight ml-1">
                  Detectamos um número de celular
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  required 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className={`w-full border pl-12 pr-12 py-4 rounded-2xl text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-teal-500/20 ${isLight ? 'bg-slate-50 border-slate-200 text-slate-950' : 'bg-slate-950 border-slate-800 text-white'}`} 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {successMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-tight">
                <CheckCircle2 size={14} />
                {successMessage}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-tight">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button disabled={isLoading} className={`w-full py-5 rounded-2xl font-black text-[10px] tracking-widest transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2 ${isRegistering ? 'bg-teal-500 text-slate-950 shadow-teal-500/20' : 'bg-indigo-600 text-white shadow-indigo-600/20'}`}>
              {isLoading ? <Loader2 className="animate-spin" /> : (isRegistering ? 'CRIAR MINHA CONTA' : 'ENTRAR NO SISTEMA')}
            </button>
          </form>
        </div>

        <button 
          type="button"
          onClick={() => !isRegistering && handleForgotPassword()}
          className="w-full text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest hover:text-teal-500 transition-colors"
        >
          {isRegistering ? 'Ao criar conta você aceita nossos termos' : 'Esqueceu sua senha? Clique aqui'}
        </button>
      </div>
    </div>
  );
};
