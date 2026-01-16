
import React, { useState } from 'react';
import { LOGO_SVG } from '../constants';
import { auth, db, sendPasswordResetEmail } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Mail, User, Building2, ChevronLeft, Lock, Eye, EyeOff, KeyRound, Loader2, AlertCircle, CheckCircle2, Scissors, ArrowRight, UserPlus, Phone } from 'lucide-react';

interface AuthViewProps {
  onLogin: (email: string, role: 'admin' | 'staff' | 'client') => void;
}

type AuthScreen = 'selection' | 'email' | 'forgot_password';

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
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

  // Função para tratar o identificador (se for número, transforma em e-mail fake para o Firebase)
  const processIdentifier = (input: string) => {
    const clean = input.trim().toLowerCase();
    const isPhone = /^\d+$/.test(clean.replace(/\D/g, ''));
    if (isPhone && !clean.includes('@')) {
      // Se for apenas números (mínimo 8 dígitos), trata como telefone
      const digits = clean.replace(/\D/g, '');
      if (digits.length >= 8) return `${digits}@telefone.com`;
    }
    return clean;
  };

  const syncUserProfile = async (user: any, userRole: 'admin' | 'staff' | 'client', displayName?: string) => {
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
    
    const finalIdentifier = processIdentifier(identifier);
    
    try {
      if (isRegistering) {
        if (!name) throw new Error('name-required');
        const result = await createUserWithEmailAndPassword(auth, finalIdentifier, password);
        await updateProfile(result.user, { displayName: name });
        await syncUserProfile(result.user, role, name);
        onLogin(result.user.email!, role);
      } else {
        const result = await signInWithEmailAndPassword(auth, finalIdentifier, password);
        const userRef = doc(db, "users", result.user.uid);
        const userSnap = await getDoc(userRef);
        const userRoleResult = userSnap.exists() ? userSnap.data().role : role;
        onLogin(result.user.email!, userRoleResult);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === 'name-required') setError('Informe seu nome completo.');
      else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') setError('E-mail/Celular ou senha incorretos.');
      else if (err.code === 'auth/email-already-in-use') setError('Este E-mail ou Celular já está cadastrado.');
      else if (err.code === 'auth/invalid-email') setError('Formato de E-mail ou Celular inválido.');
      else setError(`Erro ao acessar: Verifique seus dados.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalIdentifier = processIdentifier(identifier);
    if (!identifier) return setError('Informe seu e-mail ou celular.');
    setIsLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, finalIdentifier);
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
            className="group relative bg-slate-900/40 border-2 border-slate-800 p-6 rounded-[32px] hover:border-teal-500 transition-all duration-500 shadow-2xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-teal-500/10 text-teal-400 rounded-2xl flex items-center justify-center border border-teal-500/20 group-hover:bg-teal-500 group-hover:text-slate-950 transition-all">
                <User size={24} />
              </div>
              <div className="text-left">
                <h3 className="text-white font-black text-lg uppercase font-orbitron tracking-tight">Sou Cliente</h3>
                <p className="text-[8px] text-slate-500 font-black uppercase mt-1 tracking-widest">Entrar na fila</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { setRole('staff'); setScreen('email'); }}
            className="group relative bg-slate-900/40 border-2 border-slate-800 p-6 rounded-[32px] hover:border-amber-500 transition-all duration-500 shadow-2xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
                <Scissors size={24} />
              </div>
              <div className="text-left">
                <h3 className="text-white font-black text-lg uppercase font-orbitron tracking-tight">Colaborador</h3>
                <p className="text-[8px] text-slate-500 font-black uppercase mt-1 tracking-widest">Acesso à cadeira</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { setRole('admin'); setScreen('email'); }}
            className="group relative bg-slate-900/40 border-2 border-slate-800 p-6 rounded-[32px] hover:border-indigo-500 transition-all duration-500 shadow-2xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Building2 size={24} />
              </div>
              <div className="text-left">
                <h3 className="text-white font-black text-lg uppercase font-orbitron tracking-tight">Empresa</h3>
                <p className="text-[8px] text-slate-500 font-black uppercase mt-1 tracking-widest">Gerir minha loja</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  const isIdentifierPhone = /^\d+$/.test(identifier.replace(/\D/g, '')) && identifier.length > 5;

  return (
    <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-6 relative">
      <div className={`absolute inset-0 blur-[150px] opacity-10 ${role === 'admin' ? 'bg-indigo-600' : role === 'staff' ? 'bg-amber-600' : 'bg-teal-600'}`} />
      
      <div className="w-full max-w-sm relative z-10 space-y-6">
        <button onClick={() => { setScreen('selection'); setRole(null); setError(''); setIsRegistering(false); }} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
          <ChevronLeft size={16} /> Voltar
        </button>

        <div className="text-center space-y-2">
          <h2 className={`text-2xl font-black uppercase font-orbitron ${role === 'admin' ? 'text-indigo-400' : role === 'staff' ? 'text-amber-400' : 'text-teal-400'}`}>
            {screen === 'forgot_password' ? 'Recuperar Senha' : (isRegistering ? 'Criar Cadastro' : 'Acessar')}
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
            {role === 'admin' ? 'Acesso Administrativo' : role === 'staff' ? 'Painel do Barbeiro' : 'Acesso do Cliente'}
          </p>
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
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Seu Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <input required type="text" placeholder="EX: MARCOS SILVA" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-white/20" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail ou Celular</label>
              <div className="relative">
                {isIdentifierPhone ? (
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500 transition-colors" size={18} />
                ) : (
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                )}
                <input 
                  required 
                  type="text" 
                  placeholder="email@site.com ou 11999999999" 
                  value={identifier} 
                  onChange={(e) => setIdentifier(e.target.value)} 
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-white/20" 
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input required type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-12 text-white text-sm outline-none focus:border-white/20" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="button" onClick={() => setScreen('forgot_password')} className="text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-300 py-1">Esqueceu a senha?</button>

            <button disabled={isLoading} type="submit" className={`w-full py-5 rounded-2xl font-black text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
              role === 'admin' ? 'bg-indigo-600 text-white shadow-indigo-600/20' : role === 'staff' ? 'bg-amber-500 text-slate-950 shadow-amber-500/20' : 'bg-teal-500 text-slate-950 shadow-teal-500/20'
            } shadow-xl`}>
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? "FINALIZAR MEU CADASTRO" : "ENTRAR NO APP")}
            </button>

            {/* DESTAQUE MÁXIMO PARA "NOVO POR AQUI" */}
            <div className="pt-8 mt-4 border-t border-slate-800/50">
              <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest text-center mb-4">Primeira vez acessando?</p>
              
              <button 
                type="button" 
                onClick={() => { setIsRegistering(!isRegistering); setError(''); }} 
                className={`w-full py-6 rounded-[32px] border-2 transition-all duration-500 flex flex-col items-center justify-center gap-2 group relative overflow-hidden ${
                  isRegistering 
                  ? 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white' 
                  : role === 'admin' 
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)] animate-pulse' 
                    : role === 'staff'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-pulse'
                      : 'border-teal-500 bg-teal-500/10 text-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.2)] animate-pulse'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isRegistering ? <ChevronLeft size={20} /> : <UserPlus size={24} className="animate-bounce" />}
                  <span className="text-xs font-black uppercase tracking-[0.1em]">
                    {isRegistering ? 'VOLTAR PARA O LOGIN' : 'SOU NOVO POR AQUI (CRIAR CONTA)'}
                  </span>
                  {!isRegistering && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </div>
                
                {!isRegistering && (
                  <span className="text-[8px] font-bold uppercase opacity-70 tracking-widest mt-1">Crie sua conta grátis em 10 segundos</span>
                )}
                
                {/* Efeito de brilho neon no hover */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
             <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail ou Celular cadastrado</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <input required type="text" placeholder="email@site.com ou celular" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-white/20" />
                </div>
              </div>
              <button disabled={isLoading} type="submit" className="w-full py-5 bg-slate-100 text-slate-950 rounded-2xl font-black text-[10px] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><KeyRound size={18} /> RECUPERAR SENHA</>}
              </button>
              <button type="button" onClick={() => setScreen('email')} className="w-full text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-2">Voltar ao Login</button>
          </form>
        )}
      </div>
    </div>
  );
};
