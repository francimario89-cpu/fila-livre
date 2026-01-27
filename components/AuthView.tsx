
import React, { useState } from 'react';
import { LOGO_SVG } from '../constants';
import { auth, db, sendPasswordResetEmail } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Mail, User, Building2, ChevronLeft, Lock, Eye, EyeOff, KeyRound, Loader2, AlertCircle, CheckCircle2, Scissors, ArrowRight, UserPlus, Phone, MessageCircle, Sun, Moon } from 'lucide-react';

interface AuthViewProps {
  onLogin: (email: string, role: 'admin' | 'staff' | 'client') => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

type AuthScreen = 'selection' | 'email' | 'forgot_password';

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, theme = 'dark', onToggleTheme }) => {
  const [screen, setScreen] = useState<AuthScreen>('selection');
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'admin' | 'staff' | 'client' | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isLight = theme === 'light';

  const isPhoneFormat = (input: string) => {
    const digitsOnly = input.replace(/\D/g, '');
    return /^\d+$/.test(digitsOnly) && !input.includes('@') && digitsOnly.length >= 8;
  };

  const findEmailByIdentifier = async (input: string) => {
    const clean = input.trim().toLowerCase();
    if (isPhoneFormat(clean)) {
      const digits = clean.replace(/\D/g, '');
      const q = query(collection(db, "users"), where("phone", "==", digits));
      const snap = await getDocs(q);
      if (!snap.empty) return snap.docs[0].data().email;
      return `${digits}@telefone.com`;
    }
    return clean;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setError('');
    setIsLoading(true);
    try {
      const finalIdentifier = await findEmailByIdentifier(identifier);
      if (isRegistering) {
        if (!name) throw new Error('name-required');
        const result = await createUserWithEmailAndPassword(auth, finalIdentifier, password);
        await updateProfile(result.user, { displayName: name });
        const userRef = doc(db, "users", result.user.uid);
        const phoneData = isPhoneFormat(identifier) ? identifier.replace(/\D/g, '') : null;
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email,
          name: name,
          role: role,
          phone: phoneData,
          createdAt: Date.now()
        }, { merge: true });
        onLogin(result.user.email!, role);
      } else {
        const result = await signInWithEmailAndPassword(auth, finalIdentifier, password);
        const userRef = doc(db, "users", result.user.uid);
        const userSnap = await getDoc(userRef);
        const userRoleResult = userSnap.exists() ? userSnap.data().role : role;
        onLogin(result.user.email!, userRoleResult);
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') setError('Dados incorretos.');
      else setError('Erro ao autenticar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 relative transition-colors duration-500 ${isLight ? 'bg-slate-50' : 'bg-[#050810]'}`}>
      
      {/* Botão de Tema na Tela Inicial */}
      <div className="absolute top-6 right-6 z-50">
        <button 
          onClick={onToggleTheme} 
          className={`p-3 rounded-2xl shadow-xl transition-all active:scale-95 ${isLight ? 'bg-white text-slate-800' : 'bg-slate-900 text-amber-400 border border-white/5'}`}
        >
          {isLight ? <Moon size={24} /> : <Sun size={24} />}
        </button>
      </div>

      <div className={`absolute inset-0 blur-[150px] opacity-10 ${role === 'admin' ? 'bg-indigo-600' : role === 'staff' ? 'bg-amber-600' : 'bg-teal-600'}`} />
      
      <div className="w-full max-w-sm relative z-10 space-y-8">
        {(screen !== 'selection' && role) && (
          <button onClick={() => { setScreen('selection'); setRole(null); setError(''); }} className={`flex items-center gap-2 transition-colors text-[10px] font-black uppercase tracking-widest ${isLight ? 'text-slate-400 hover:text-slate-900' : 'text-slate-500 hover:text-white'}`}>
            <ChevronLeft size={16} /> Voltar
          </button>
        )}

        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto drop-shadow-2xl">
            {LOGO_SVG}
          </div>
          <h1 className={`text-3xl font-black font-orbitron tracking-tighter uppercase leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>FILA LIVRE</h1>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em]">SISTEMA DE FILA DIGITAL</p>
        </div>

        {screen === 'selection' ? (
          <div className="grid grid-cols-1 gap-4">
             <button onClick={() => { setRole('client'); setScreen('email'); }} className={`group border-2 p-6 rounded-[32px] transition-all duration-300 shadow-xl text-left flex items-center gap-4 ${isLight ? 'bg-white border-slate-100 hover:border-teal-500' : 'bg-slate-900/40 border-slate-800 hover:border-teal-500'}`}>
                <div className="w-12 h-12 bg-teal-500/10 text-teal-500 rounded-xl flex items-center justify-center border border-teal-500/20"><User size={24} /></div>
                <div><h3 className={`font-black text-lg uppercase tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>Sou Cliente</h3><p className="text-[8px] text-slate-500 font-bold uppercase">Entrar na fila</p></div>
             </button>
             <button onClick={() => { setRole('staff'); setScreen('email'); }} className={`group border-2 p-6 rounded-[32px] transition-all duration-300 shadow-xl text-left flex items-center gap-4 ${isLight ? 'bg-white border-slate-100 hover:border-amber-500' : 'bg-slate-900/40 border-slate-800 hover:border-amber-500'}`}>
                <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20"><Scissors size={24} /></div>
                <div><h3 className={`font-black text-lg uppercase tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>Colaborador</h3><p className="text-[8px] text-slate-500 font-bold uppercase">Acesso Profissional</p></div>
             </button>
             <button onClick={() => { setRole('admin'); setScreen('email'); }} className={`group border-2 p-6 rounded-[32px] transition-all duration-300 shadow-xl text-left flex items-center gap-4 ${isLight ? 'bg-white border-slate-100 hover:border-indigo-500' : 'bg-slate-900/40 border-slate-800 hover:border-indigo-500'}`}>
                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center border border-indigo-500/20"><Building2 size={24} /></div>
                <div><h3 className={`font-black text-lg uppercase tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>Empresa</h3><p className="text-[8px] text-slate-500 font-bold uppercase">Gestão da Unidade</p></div>
             </button>
          </div>
        ) : (
          <form onSubmit={handleEmailAuth} className="space-y-4">
             {isRegistering && (
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Seu Nome</label>
                   <input required value={name} onChange={e => setName(e.target.value.toUpperCase())} className={`w-full border p-4 rounded-2xl text-sm font-bold outline-none ${isLight ? 'bg-white border-slate-200 text-slate-950' : 'bg-slate-900 border-slate-800 text-white'}`} />
                </div>
             )}
             <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail ou Celular</label>
                <input required value={identifier} onChange={e => setIdentifier(e.target.value)} className={`w-full border p-4 rounded-2xl text-sm font-bold outline-none ${isLight ? 'bg-white border-slate-200 text-slate-950' : 'bg-slate-900 border-slate-800 text-white'}`} />
             </div>
             <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className={`w-full border p-4 rounded-2xl text-sm font-bold outline-none ${isLight ? 'bg-white border-slate-200 text-slate-950' : 'bg-slate-900 border-slate-800 text-white'}`} />
             </div>
             <button disabled={isLoading} className={`w-full py-5 rounded-2xl font-black text-[10px] tracking-widest transition-all active:scale-95 ${role === 'admin' ? 'bg-indigo-600 text-white' : role === 'staff' ? 'bg-amber-500 text-slate-950' : 'bg-teal-500 text-slate-950'}`}>
                {isLoading ? <Loader2 className="animate-spin mx-auto" /> : (isRegistering ? 'CADASTRAR CONTA' : 'ENTRAR NO APP')}
             </button>
             <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full text-center text-[9px] font-black text-slate-500 uppercase tracking-widest py-2">
                {isRegistering ? 'Já tenho conta? Entrar' : 'Não tem conta? Criar Agora'}
             </button>
          </form>
        )}
      </div>
    </div>
  );
};
