
import React, { useState, useEffect } from 'react';
import { LOGO_SVG } from '../constants';
import { Plus, LogOut, Building2, ArrowRight, Loader2, AlertCircle, Database, Zap, Clock } from 'lucide-react';
import { Establishment } from '../types';
import { db } from '../services/firebase';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { FirebaseHelper } from './FirebaseHelper';

interface BusinessSelectProps {
  userEmail: string;
  userRole: 'admin' | 'client';
  onSelect: (est: Establishment) => void;
  onLogout: () => void;
}

export const BusinessSelect: React.FC<BusinessSelectProps> = ({ userEmail, userRole, onSelect, onLogout }) => {
  const [connections, setConnections] = useState<Establishment[]>([]);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [showHelper, setShowHelper] = useState(false);

  useEffect(() => {
    loadConnections();
  }, [userEmail, userRole]);

  const loadConnections = async () => {
    setLoading(true);
    setIsActivating(false);
    setShowHelper(false);
    try {
      if (userRole === 'admin') {
        const q = query(collection(db, "establishments"), where("ownerEmail", "==", userEmail));
        const snap = await getDocs(q);
        const cloudData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Establishment));
        
        const localData = JSON.parse(localStorage.getItem(`local_establishments_${userEmail}`) || '[]');
        const merged = [...cloudData];
        localData.forEach((l: Establishment) => {
          if (!merged.find(m => m.id === l.id)) merged.push(l);
        });
        
        setConnections(merged);
      } else {
        const saved = JSON.parse(localStorage.getItem(`client_history_${userEmail}`) || '[]');
        setConnections(saved);
      }
    } catch (e: any) {
      console.warn("Status do Banco:", e.message);
      if (e.code === 'permission-denied') setShowHelper(true);
      if (e.message?.toLowerCase().includes('activating') || e.code === 'unavailable') {
        setIsActivating(true);
      }
      const localData = JSON.parse(localStorage.getItem(`local_establishments_${userEmail}`) || '[]');
      setConnections(localData);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (forceLocal = false) => {
    if (!newCode) return setError('O código é obrigatório.');
    if (userRole === 'admin' && !newName) return setError('O nome da empresa é obrigatório.');
    
    const cleanCode = newCode.toUpperCase().trim().replace(/[^A-Z0-9-]/g, '');
    setActionLoading(true);
    setError('');

    const newEst: Establishment = {
      id: cleanCode,
      name: newName.trim() || 'Barbearia Sem Nome',
      ownerEmail: userEmail,
      status: 'open',
      bookingModel: 'both',
      plan: 'free',
      trialStartedAt: Date.now(),
      loyaltyEnabled: false
    };

    if (forceLocal) {
      saveLocalAndContinue(newEst);
      return;
    }

    try {
      const docRef = doc(db, "establishments", cleanCode);
      await setDoc(docRef, newEst);
      onSelect(newEst);
    } catch (e: any) {
      console.error("Erro no Cloud Save:", e.code);
      if (e.code === 'permission-denied') setShowHelper(true);
      if (e.message?.toLowerCase().includes('activating') || e.code === 'unavailable') {
        setIsActivating(true);
        setError("O Google está ativando seu banco de dados (leva ~2 min).");
      } else {
        setError("Falha na nuvem. Verifique suas regras ou conexão.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const saveLocalAndContinue = (est: Establishment) => {
    const currentLocal = JSON.parse(localStorage.getItem(`local_establishments_${userEmail}`) || '[]');
    if (!currentLocal.find((l: any) => l.id === est.id)) {
      localStorage.setItem(`local_establishments_${userEmail}`, JSON.stringify([...currentLocal, est]));
    }
    onSelect(est);
  };

  return (
    <div className="min-h-screen bg-[#050810] p-6 flex flex-col max-w-xl mx-auto w-full animate-in fade-in duration-700">
      <header className="flex justify-between items-center mb-12">
        <div className="w-12 h-12 drop-shadow-[0_0_8px_rgba(45,212,191,0.4)]">{LOGO_SVG}</div>
        <button onClick={onLogout} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-red-500 hover:bg-red-500/10 transition-colors shadow-xl">
          <LogOut size={20}/>
        </button>
      </header>

      <div className="space-y-3 mb-10">
        <h1 className="text-3xl font-black text-white font-orbitron uppercase tracking-tighter">
          {userRole === 'admin' ? 'Suas Unidades' : 'Buscar Unidade'}
        </h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">{userEmail}</p>
      </div>

      {showHelper && <div className="mb-8"><FirebaseHelper error="Acesso Negado" /></div>}

      {isActivating && !showHelper && (
        <div className="mb-8 bg-amber-500/10 border border-amber-500/30 p-5 rounded-[32px] space-y-4 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4 text-amber-500">
            <Clock size={24} className="animate-pulse" />
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest">Ativando Servidor Google</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">Isso ocorre apenas na primeira vez. Você pode aguardar 2 minutos ou usar o Modo Local agora.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full py-4 bg-amber-500 text-slate-950 rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-amber-500/10 flex items-center justify-center gap-2"
          >
            <Zap size={14} /> Usar Modo Local agora
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 flex-1 overflow-y-auto pb-10 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={32} className="animate-spin text-teal-500" />
            <span className="text-[10px] font-black uppercase text-slate-500">Sincronizando Cloud...</span>
          </div>
        ) : (
          connections.map(est => (
            <button key={est.id} onClick={() => onSelect(est)} className="bg-slate-900/40 border border-slate-800 p-8 rounded-[40px] flex items-center justify-between text-left group hover:border-teal-500/50 transition-all shadow-2xl">
              <div>
                <h3 className="text-white font-black text-xl uppercase font-orbitron mb-2">{est.name}</h3>
                <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-3 py-1.5 rounded-xl border border-teal-500/20">{est.id}</span>
              </div>
              <ArrowRight size={20} className="text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
            </button>
          ))
        )}

        {isAdding ? (
          <div className="bg-slate-900 border-2 border-dashed border-slate-800 p-8 rounded-[40px] space-y-6 animate-in zoom-in duration-300">
             {error && (
               <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-3xl">
                 <div className="flex gap-3 text-red-500 items-start">
                   <AlertCircle size={20} className="shrink-0 mt-0.5" />
                   <p className="text-[11px] font-bold leading-relaxed">{error}</p>
                 </div>
               </div>
             )}

             <div className="space-y-4">
               {userRole === 'admin' && (
                 <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Barbearia</label>
                   <input autoFocus value={newName} onChange={e => setNewName(e.target.value.toUpperCase())} placeholder="EX: BARBA E CIA" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4.5 px-6 text-white font-bold uppercase outline-none focus:border-teal-500 transition-all" />
                 </div>
               )}
               <div className="space-y-1.5">
                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Crie um Código Único</label>
                 <input value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} placeholder="EX: BARBER-01" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4.5 px-6 text-white font-orbitron font-bold uppercase outline-none focus:border-teal-500 transition-all" />
               </div>
             </div>

             <div className="flex gap-3 pt-2">
               <button onClick={() => setIsAdding(false)} className="flex-1 py-4 text-slate-500 font-black text-[10px] uppercase">Cancelar</button>
               <button 
                onClick={() => handleAction(isActivating)} 
                disabled={actionLoading} 
                className={`flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-xl ${isActivating ? 'bg-amber-500 text-slate-950 shadow-amber-500/20' : 'bg-teal-500 text-slate-950 shadow-teal-500/20'}`}
               >
                 {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <><Database size={18}/> {isActivating ? 'Ativar Localmente' : 'Confirmar e Iniciar'}</>}
               </button>
             </div>
          </div>
        ) : (
          <button onClick={() => setIsAdding(true)} className="w-full border-2 border-dashed border-slate-800 p-12 rounded-[40px] flex flex-col items-center justify-center gap-4 text-slate-600 hover:text-teal-400 hover:border-teal-500/50 hover:bg-teal-500/5 transition-all group shadow-inner">
            <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-slate-700 group-hover:text-teal-400 group-hover:scale-110 transition-all shadow-xl">
              <Plus size={32}/>
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">{userRole === 'admin' ? 'Nova Unidade' : 'Conectar Barbearia'}</span>
          </button>
        )}
      </div>
      
      <p className="text-center py-6 text-[8px] text-slate-800 font-black uppercase tracking-[0.5em]">Fila Livre Core v2.6 • Sistema Híbrido</p>
    </div>
  );
};
