
import React, { useState } from 'react';
import { LOGO_SVG } from '../constants';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Mail, User, Building2, ChevronLeft, Lock, Eye, EyeOff, Smartphone, LogIn, UserPlus, AlertCircle, Globe } from 'lucide-react';

interface AuthViewProps {
  onLogin: (emailOrPhone: string, role: 'admin' | 'client', method: 'google' | 'phone' | 'email') => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<'email' | 'social'>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'admin' | 'client' | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onLogin(result.user.email || result.user.uid, role || 'client', 'google');
    } catch (err: any) {
      console.error("Firebase Auth Error:", err.code, err.message);
      
      if (err.code === 'auth/operation-not-allowed') {
        setError('O Login Google não está ativado no seu Console Firebase. Ative em Authentication > Sign-in Method.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Este domínio não está autorizado no Firebase. Adicione o URL atual em "Domínios Autorizados" no console.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('A janela de login foi fechada antes de concluir.');
      } else {
        setError(`Falha na autenticação Google: ${err.code}`);
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
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já possui uma conta registrada.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError('Erro ao autenticar. Verifique sua conexão.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-6 text-center space-y-12 animate-in fade-in duration-700">
        <div className="space-y-4">
          <div className="w-24 h-24 mx-auto animate-float drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]">
            {LOGO_SVG}
          </div>
          <h1 className="text-3xl font-black font-orbitron tracking-tighter text-white uppercase">FILA LIVRE</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Sincronização em Tempo Real</p>
        </div>

        <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
          <button
            onClick={() => setRole('client')}
            className="group relative bg-slate-900/40 border-2 border-slate-800 p-8 rounded-[40px] hover:border-teal-500 transition-all duration-500 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 blur-3xl -mr-10 -mt-10" />
            <div className="relative z-10 flex flex-col items-center gap-4">
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
            onClick={() => setRole('admin')}
            className="group relative bg-slate-900/40 border-2 border-slate-800 p-8 rounded-[40px] hover:border-indigo-500 transition-all duration-500 shadow-2xl overflow-hidden"
          >
             <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-3xl -mr-10 -mt-10" />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Building2 size={32} />
              </div>
              <div>
                <h3 className="text-white font-black text-xl uppercase font-orbitron tracking-tight">Sou Empresa</h3>
                <p className="text-[9px] text-slate-500 font-black uppercase mt-1 tracking-widest">Gerir minha unidade</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  const themeColor = role === 'admin' ? 'indigo' : 'teal';
  const colorHex = role === 'admin' ? '#6366f1' : '#14b8a6';

  return (
    <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className={`absolute inset-0 blur-[150px] opacity-10 ${role === 'admin' ? 'bg-indigo-600' : 'bg-teal-600'}`} />
      
      <div className="w-full max-w-sm relative z-10 space-y-6">
        <button onClick={() => { setRole(null); setError(''); }} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
          <ChevronLeft size={16} /> Voltar ao Início
        </button>

        <div className="text-center space-y-2">
          <h2 className={`text-2xl font-black uppercase font-orbitron ${role === 'admin' ? 'text-indigo-400' : 'text-teal-400'}`}>
            {role === 'admin' ? 'Acesso Empresa' : 'Acesso Cliente'}
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Sincronização Cloud em tempo real</p>
        </div>

        {/* Interface de Abas */}
        <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800">
          <button 
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'email' ? `bg-${themeColor}-600 text-white shadow-lg` : 'text-slate-500'}`}
          >
            E-mail & Senha
          </button>
          <button 
            onClick={() => setActiveTab('social')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'social' ? `bg-${themeColor}-600 text-white shadow-lg` : 'text-slate-500'}`}
          >
            Social / Google
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-in slide-in-from-top-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertCircle size={16} />
              <span>ALERTA DE SISTEMA</span>
            </div>
            {error}
          </div>
        )}

        {activeTab === 'email' ? (
          <form onSubmit={handleEmailAuth} className="space-y-4 animate-in fade-in duration-300">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Usuário / E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input
                  required
                  type="email"
                  placeholder="seu@email.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4.5 pl-12 pr-4 text-white text-sm focus:border-white/20 outline-none transition-all"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha Digital</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4.5 pl-12 pr-12 text-white text-sm focus:border-white/20 outline-none transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className={`w-full py-5 rounded-2xl font-black text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.98] ${
                role === 'admin' ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-teal-500 text-slate-950 shadow-teal-500/20'
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />}
                  {isRegistering ? "CONFIRMAR CADASTRO" : "ENTRAR NO SISTEMA"}
                </>
              )}
            </button>

            <button 
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="w-full text-center text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors py-2"
            >
              {isRegistering ? 'Já tem conta? Fazer Login' : 'Novo por aqui? Criar Conta'}
            </button>
          </form>
        ) : (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <button 
              disabled={isLoading}
              onClick={handleGoogleLogin} 
              className="w-full bg-white text-slate-950 py-5 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase hover:brightness-90 transition-all shadow-xl disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Entrar com Google
            </button>
            
            <button 
              type="button"
              onClick={() => alert("Login via Telefone em manutenção.")}
              className="w-full bg-slate-900 border border-slate-800 text-slate-400 py-5 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase hover:border-slate-700 transition-all"
            >
              <Smartphone size={20} />
              Usar Número de Celular
            </button>

            <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl text-[9px] text-amber-500/70 font-black uppercase text-center tracking-widest leading-relaxed">
              <Globe className="mx-auto mb-2 opacity-50" size={16} />
              Certifique-se que o login social está ativo no console firebase.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
