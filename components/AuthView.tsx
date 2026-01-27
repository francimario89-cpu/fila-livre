
import React, { useState } from 'react';
import { LOGO_SVG } from '../constants';
import { auth, db, sendPasswordResetEmail } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Mail, User, Building2, ChevronLeft, Lock, Eye, EyeOff, KeyRound, Loader2, AlertCircle, CheckCircle2, Scissors, ArrowRight, UserPlus, Phone, MessageCircle } from 'lucide-react';

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

  const isPhoneFormat = (input: string) => {
    const digitsOnly = input.replace(/\D/g, '');
    return /^\d+$/.test(digitsOnly) && !input.includes('@') && digitsOnly.length >= 8;
  };

  const findEmailByIdentifier = async (input: string) => {
    const clean = input.trim().toLowerCase();
    
    // Se for formato de telefone, busca no Firestore quem tem esse número vinculado
    if (isPhoneFormat(clean)) {
      const digits = clean.replace(/\D/g, '');
      const q = query(collection(db, "users"), where("phone", "==", digits));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        // Retorna o e-mail real vinculado a esse telefone
        return snap.docs[0].data().email;
      }
      // Se não achar vínculo, assume o alias padrão de contas só de telefone
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
      console.error(err);
      if (err.message === 'phone-missing-ddd') setError('O número deve conter o DDD (Ex: 11999999999)');
      else if (err.message === 'name-required') setError('Informe seu nome completo.');
      else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') 
        setError('E-mail/Telefone ou senha incorretos.');
      else if (err.code === 'auth/email-already-in-use') setError('Este E-mail ou Celular já está cadastrado.');
      else setError(`Erro: Dados inválidos ou sem conexão.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const finalIdentifier = await findEmailByIdentifier(identifier);

      if (finalIdentifier.includes('@telefone.com')) {
        setError('Esta conta não possui e-mail vinculado para recuperação automática. Fale com o suporte.');
        setIsLoading(false);
        return;
      }

      await sendPasswordResetEmail(auth, finalIdentifier);
      setSuccessMsg('Link enviado para o seu E-mail!');
      setTimeout(() => { setScreen('email'); setSuccessMsg(''); }, 3000);
    } catch (err: any) {
      setError('E-mail não encontrado ou inválido.');
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
          <button onClick={() => { setRole('client'); setScreen('email'); }} className="group bg-slate-900/40 border-2 border-slate-800 p-6 rounded-[32px] hover:border-teal-500 transition-all duration-500 shadow-2xl">
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

          <button onClick={() => { setRole('staff'); setScreen('email'); }} className="group bg-slate-900/40 border-2 border-slate-800 p-6 rounded-[32px] hover:border-amber-500 transition-all duration-500 shadow-2xl">
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

          <button onClick={() => { setRole('admin'); setScreen('email'); }} className="group bg-slate-900/40 border-2 border-slate-800 p-6 rounded-[32px] hover:border-indigo-500 transition-all duration-500 shadow-2xl">
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

  const isIdentifierPhone = isPhoneFormat(identifier);

  return (
    <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-6 relative">
      <div className={`absolute inset-0 blur-[150px] opacity-10 ${role === 'admin' ? 'bg-indigo-600' : role === 'staff' ? 'bg-amber-600' : 'bg-teal-600'}`} />
      
      <div className="w-full max-w-sm relative z-10 space-y-6">
        <button onClick={() => { setScreen('selection'); setRole(null); setError(''); setIsRegistering(false); }} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
          <ChevronLeft size={16} /> Voltar
        </button>

        <div className="text-center space-y-2">
          <h2 className={`text-2xl font-black uppercase font-orbitron ${role === 'admin' ? 'text-indigo-400' : role === 'staff' ? 'text-amber-400' : 'text-teal-400'}`}>
            {screen === 'forgot_password' ? 'Recuperar Acesso' : (isRegistering ? 'Novo Cadastro' : 'Entrar')}
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
            {role === 'admin' ? 'Acesso Administrativo' : role === 'staff' ? 'Painel do Colaborador' : 'Portal do Cliente'}
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
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <input required type="text" placeholder="EX: MARCOS SILVA" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail ou Celular (COM DDD)</label>
              <div className="relative">
                {isIdentifierPhone ? <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500" size={18} /> : <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />}
                <input required type="text" placeholder="EX: 11999999999" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none" />
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
              role === 'admin' ? 'bg-indigo-600 text-white shadow-indigo-600/20' : role === 'staff' ? 'bg-amber-500 text-slate-950 shadow-amber-500/20' : 'bg-teal-500 text-slate-950 shadow-teal-500/20'
            } shadow-xl`}>
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? "CONFIRMAR E CADASTRAR" : "ENTRAR NO SISTEMA")}
            </button>

            <div className="pt-8 mt-4 border-t border-slate-800/50 text-center">
              <button 
                type="button" 
                onClick={() => { setIsRegistering(!isRegistering); setError(''); }} 
                className={`w-full py-6 rounded-[32px] border-2 transition-all duration-500 flex flex-col items-center justify-center gap-2 group relative overflow-hidden ${
                  isRegistering 
                  ? 'border-slate-800 bg-slate-900/40 text-slate-400' 
                  : 'border-teal-500 bg-teal-500/10 text-teal-400 animate-pulse'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isRegistering ? <ChevronLeft size={20} /> : <UserPlus size={24} />}
                  <span className="text-xs font-black uppercase tracking-[0.1em]">
                    {isRegistering ? 'VOLTAR PARA O LOGIN' : 'SOU NOVO POR AQUI (CRIAR CONTA)'}
                  </span>
                  {!isRegistering && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </div>
                {!isRegistering && <span className="text-[8px] font-bold uppercase opacity-70 tracking-widest mt-1 text-center">Cadastro rápido por E-mail ou Celular</span>}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
             <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail ou Celular (DDD)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                  <input required type="text" placeholder="EX: 11999999999" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none" />
                </div>
              </div>

              {isPhoneFormat(identifier) ? (
                <div className="space-y-4">
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                    Contas sem e-mail vinculado precisam de suporte manual. Se você vinculou um e-mail no seu perfil, use-o para recuperar agora.
                  </p>
                  <a 
                    href={`https://wa.me/?text=Olá, preciso resetar minha senha no app Fila Livre. Meu número é ${identifier}.`}
                    target="_blank"
                    className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                  >
                    <MessageCircle size={20} /> SUPORTE VIA WHATSAPP
                  </a>
                </div>
              ) : (
                <button disabled={isLoading} type="submit" className="w-full py-5 bg-slate-100 text-slate-950 rounded-2xl font-black text-[10px] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><KeyRound size={18} /> RECUPERAR POR E-MAIL</>}
                </button>
              )}
              
              <button type="button" onClick={() => { setScreen('email'); setError(''); }} className="w-full text-center text-[10px] font-black text-slate-500 uppercase tracking-widest py-2">Voltar ao Login</button>
          </form>
        )}
      </div>
    </div>
  );
};
