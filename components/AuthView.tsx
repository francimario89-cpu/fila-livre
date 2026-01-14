
import React, { useState } from 'react';
import { LOGO_SVG } from '../constants';
import { auth, db, sendPasswordResetEmail } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Mail, User, Building2, ChevronLeft, Lock, Eye, EyeOff, KeyRound, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthViewProps {
  onLogin: (email: string, role: 'admin' | 'client') => void;
}

type AuthScreen = 'selection' | 'email' | 'forgot_password';

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [screen, setScreen] = useState<AuthScreen>('selection');
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'admin' | 'client' | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const syncUserProfile = async (user: any, userRole: 'admin' | 'client', displayName?: string) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists() || isRegistering) {
      const profile = {
        uid: user.uid,
        email: user.email,
        name: displayName || user.displayName || 'Usuário',
        role: userRole,
        createdAt: Date.now()
      };
      await setDoc(userRef, profile, { merge: true });
      return profile;
    }
    return userSnap.data();
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setError('');
    setIsLoading(true);
    
    try {
      if (isRegistering) {
        if (!name) throw new Error('name-required');
        const result = await createUserWithEmailAndPassword(auth, identifier, password);
        await updateProfile(result.user, { displayName: name });
        await syncUserProfile(result.user, role, name);
        onLogin(result.user.email!, role);
      } else {
        const result = await signInWithEmailAndPassword(auth, identifier, password);
        const userRef = doc(db, "users", result.user.uid);
        const userSnap = await getDoc(userRef);
        const userRoleResult = userSnap.exists() ? userSnap.data().role : role;
        onLogin(result.user.email!, userRoleResult);
      }
    } catch (err: any) {
      if (err.message === 'name-required') setError('Informe seu nome completo.');
      else if (err.code === 'auth/invalid-credential') setError('E-mail ou senha incorretos.');
      else if (err.code === 'auth/email-already-in-use') setError('E-mail já cadastrado.');
      else setError(`Erro: ${err.code}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return setError('Informe seu e-mail.');
    setIsLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, identifier);
      setSuccessMsg('Link de recuperação enviado!');
      setTimeout(() => { setScreen('email'); setSuccessMsg(''); }, 3000);
    } catch (err: any) {
      setError('E-mail não encontrado.');
    } finally {
      setIsLoading(false);
    }
  };

  if (screen === 'selection' || !role) {
    return (
      <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-6 text-center space-y-12 animate-in fade-in duration-700">
        <div className="space-y-4">
          <div className="w-24 h-24 mx-auto animate-float drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]">
            {LOGO_SVG}
          </div>
          <h1 className="text-3xl font-black font-orbitron tracking-tighter text-white uppercase leading-none">FILA LIVRE</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Gestão de Fila Profissional</p>
        </div>

        <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
          <button
            onClick={() => { setRole('client'); setScreen('email'); }}
            className="group relative bg-slate-900/40 border-2 border-slate-800 p-8 rounded-[40px] hover:border-teal-500 transition-all duration-500 shadow-2xl"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-teal-500/10 text-teal-400 rounded-2xl flex items-center justify-center border border-teal-500/20 group-hover:bg-teal-500 group-hover:text-slate-950 transition-all">
                <User size={32} />
              </div>
              <div>
                <h3 className="text-white font-black text-xl uppercase font-orbitron tracking-tight">Sou Cliente</h3>
                <p className="text-[9px] text-slate-500 font-black uppercase mt-1 tracking-widest">Entrar na fila</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { setRole('admin'); setScreen('email'); }}
            className="group relative bg-slate-900/40 border-2 border-slate-800 p-8 rounded-[40px] hover:border-indigo-500 transition-all duration-500 shadow-2xl"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Building2 size={32} />
              </div>
              <div>
                <h3 className="text-white font-black text-xl uppercase font-orbitron tracking-tight">Sou Empresa</h3>
                <p className="text-[9px] text-slate-500 font-black uppercase mt-1 tracking-widest">Gerir minha fila</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-6 relative">
      <div className={`absolute inset-0 blur-[150px] opacity-10 ${role === 'admin' ? 'bg-indigo-600' : 'bg-teal-600'}`} />
      
      <div className="w-full max-w-sm relative z-10 space-y-6">
        <button onClick={() => { setScreen('selection'); setRole(null); setError(''); }} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
          <ChevronLeft size={16} /> Voltar
        </button>

        <div className="text-center space-y-2">
          <h2 className={`text-2xl font-black uppercase font-orbitron ${role === 'admin' ? 'text-indigo-400' : 'text-teal-400'}`}>
            {screen === 'forgot_password' ? 'Recuperar Senha' : (isRegistering ? 'Criar Cadastro' : 'Acessar')}
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{role === 'admin' ? 'Acesso Administrativo' : 'Acesso do Cliente'}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 text-[10px] font-black uppercase text-center animate-in slide-in-from-top-2">
            <AlertCircle size={14} className="inline mr-2" /> {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-emerald-500 text-[10px] font-black uppercase text-center animate-in zoom-in">
            <CheckCircle2 size={14} className="inline mr-2" /> {successMsg}
          </div>
        )}

        {screen === 'email' ? (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <input required type="text" placeholder="JOÃO SILVA" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input required type="email" placeholder="seu@email.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none" />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input required type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-12 text-white text-sm outline-none" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="button" onClick={() => setScreen('forgot_password')} className="text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-300 py-1">Esqueceu a senha?</button>

            <button disabled={isLoading} type="submit" className={`w-full py-5 rounded-2xl font-black text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
              role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-teal-500 text-slate-950'
            }`}>
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? "CONFIRMAR CADASTRO" : "ENTRAR")}
            </button>

            <button type="button" onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="w-full text-center text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-300 py-2">
              {isRegistering ? 'Já tem conta? Login' : 'Novo por aqui? Criar Conta'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
             <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail de recuperação</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <input required type="email" placeholder="seu@email.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none" />
                </div>
              </div>
              <button disabled={isLoading} type="submit" className="w-full py-5 bg-slate-100 text-slate-950 rounded-2xl font-black text-[10px] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><KeyRound size={18} /> ENVIAR LINK</>}
              </button>
              <button type="button" onClick={() => setScreen('email')} className="w-full text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-2">Voltar</button>
          </form>
        )}
      </div>
    </div>
  );
};
