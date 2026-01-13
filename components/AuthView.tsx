
import React, { useState } from 'react';
import { LOGO_SVG } from '../constants';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Mail, User, Building2, ChevronLeft, Lock, Eye, EyeOff, Smartphone, LogIn, UserPlus, AlertCircle, Globe, Loader2 } from 'lucide-react';
import { FirebaseHelper } from './FirebaseHelper';

interface AuthViewProps {
  onLogin: (emailOrPhone: string, role: 'admin' | 'client', method: 'google' | 'phone' | 'email') => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<'email' | 'social'>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'client' | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    setErrorCode('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onLogin(result.user.email || result.user.uid, role || 'client', 'google');
    } catch (err: any) {
      console.error("Firebase Auth Error:", err.code);
      setErrorCode(err.code);
      if (err.code === 'auth/unauthorized-domain') {
        setError('Domínio não autorizado no Firebase.');
      } else {
        setError(`Falha na autenticação: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return setError('Preencha e-mail e senha.');
    setError('');
    setIsLoading(true);
    
    try {
      if (isRegistering) {
        const result = await createUserWithEmailAndPassword(auth, identifier, password);
        onLogin(result.user.email!, role || 'client', 'email');
      } else {
        const result = await signInWithEmailAndPassword(auth, identifier, password);
        onLogin(result.user.email!, role || 'client', 'email');
      }
    } catch (err: any) {
      setError('E-mail ou senha inválidos.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-6 text-center space-y-12 animate-in fade-in duration-700">
        <div className="space-y-4">
          <div className="w-24 h-24 mx-auto drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]">
            {LOGO_SVG}
          </div>
          <h1 className="text-3xl font-black font-orbitron tracking-tighter text-white uppercase">FILA LIVRE</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Gestão Inteligente</p>
        </div>

        <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
          <button
            onClick={() => setRole('client')}
            className="group relative bg-slate-900/40 border-2 border-slate-800 p-8 rounded-[40px] hover:border-teal-500 transition-all duration-500 shadow-2xl"
          >
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-teal-500/10 text-teal-400 rounded-2xl flex items-center justify-center border border-teal-500/20 group-hover:bg-teal-500 group-hover:text-slate-950 transition-all">
                <User size={32} />
              </div>
              <div>
                <h3 className="text-white font-black text-xl uppercase font-orbitron tracking-tight">Sou Cliente</h3>
                <p className="text-[9px] text-slate-500 font-black uppercase mt-1 tracking-widest">Fila & Fidelidade</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setRole('admin')}
            className="group relative bg-slate-900/40 border-2 border-slate-800 p-8 rounded-[40px] hover:border-indigo-500 transition-all duration-500 shadow-2xl"
          >
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Building2 size={32} />
              </div>
              <div>
                <h3 className="text-white font-black text-xl uppercase font-orbitron tracking-tight">Sou Empresa</h3>
                <p className="text-[9px] text-slate-500 font-black uppercase mt-1 tracking-widest">Painel de Gestão</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className={`absolute inset-0 blur-[150px] opacity-10 ${role === 'admin' ? 'bg-indigo-600' : 'bg-teal-600'}`} />
      
      <div className="w-full max-w-sm relative z-10 space-y-6">
        <button onClick={() => { setRole(null); setError(''); setErrorCode(''); }} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
          <ChevronLeft size={16} /> Voltar
        </button>

        {errorCode === 'auth/unauthorized-domain' ? (
          <FirebaseHelper error={error} type="domain" />
        ) : (
          <>
            <div className="text-center space-y-2">
              <h2 className={`text-2xl font-black uppercase font-orbitron ${role === 'admin' ? 'text-indigo-400' : 'text-teal-400'}`}>
                {role === 'admin' ? 'Acesso Empresa' : 'Acesso Cliente'}
              </h2>
            </div>

            <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800">
              <button 
                onClick={() => setActiveTab('email')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'email' ? (role === 'admin' ? 'bg-indigo-600' : 'bg-teal-600') + ' text-white' : 'text-slate-500'}`}
              >
                E-mail
              </button>
              <button 
                onClick={() => setActiveTab('social')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'social' ? (role === 'admin' ? 'bg-indigo-600' : 'bg-teal-600') + ' text-white' : 'text-slate-500'}`}
              >
                Google
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                {error}
              </div>
            )}

            {activeTab === 'email' ? (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <input required type="email" placeholder="E-MAIL" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4.5 px-6 text-white text-sm outline-none focus:border-teal-500 transition-all" />
                <input required type="password" placeholder="SENHA" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4.5 px-6 text-white text-sm outline-none focus:border-teal-500 transition-all" />
                <button disabled={isLoading} type="submit" className={`w-full py-5 rounded-2xl font-black text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl ${role === 'admin' ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-teal-500 text-slate-950 shadow-teal-500/20'}`}>
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : (isRegistering ? "CRIAR MINHA CONTA" : "ENTRAR AGORA")}
                </button>
                <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full text-center text-[10px] font-black text-slate-500 uppercase py-2">
                  {isRegistering ? 'Já tem conta? Login' : 'Não tem conta? Cadastrar'}
                </button>
              </form>
            ) : (
              <button disabled={isLoading} onClick={handleGoogleLogin} className="w-full bg-white text-slate-950 py-5 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase shadow-xl hover:bg-slate-100 transition-all">
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Entrar com Google"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
