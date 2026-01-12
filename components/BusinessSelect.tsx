
import React, { useState, useEffect } from 'react';
import { LOGO_SVG } from '../constants';
import { Plus, LogOut, Building2, UserCircle, ArrowRight, Search, Loader2, AlertCircle, RefreshCw, Clock, ExternalLink } from 'lucide-react';
import { Establishment } from '../types';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, terminate, clearIndexedDbPersistence } from 'firebase/firestore';

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
  const [diagnose, setDiagnose] = useState<'propagation' | 'permissions' | 'wrong_db' | null>(null);

  useEffect(() => {
    loadConnections();
  }, [userEmail, userRole]);

  const loadConnections = async () => {
    setLoading(true);
    setError('');
    setDiagnose(null);
    try {
      if (userRole === 'admin') {
        const q = query(collection(db, "establishments"), where("ownerEmail", "==", userEmail));
        const snap = await getDocs(q);
        setConnections(snap.docs.map(d => ({ id: d.id, ...d.data() } as Establishment)));
      } else {
        const saved = JSON.parse(localStorage.getItem(`client_history_${userEmail}`) || '[]');
        setConnections(saved);
      }
    } catch (e: any) {
      handleFirebaseError(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseError = (e: any) => {
    console.error("Firebase Error:", e.code, e.message);
    if (e.code === 'unavailable') {
      setError("O Google ainda está ativando seu banco. Isso leva 2 minutos.");
      setDiagnose('propagation');
    } else if (e.code === 'permission-denied') {
      setError("Regras de segurança negadas ou banco não inicializado.");
      setDiagnose('permissions');
    } else {
      setError(`Erro: ${e.message}`);
    }
  };

  const handleAction = async () => {
    if (!newCode) return setError('O código é obrigatório.');
    if (userRole === 'admin' && !newName) return setError('O nome da empresa é obrigatório.');
    
    const cleanCode = newCode.toUpperCase().trim().replace(/[^A-Z0-9-]/g, '');
    setActionLoading(true);
    setError('');
    setDiagnose(null);

    try {
      const docRef = doc(db, "establishments", cleanCode);
      const docSnap = await getDoc(docRef);

      if (userRole === 'admin') {
        if (docSnap.exists() && docSnap.data().ownerEmail !== userEmail) {
          setError("Este código já pertence a outra empresa.");
        } else {
          const newEst: Establishment = {
            id: cleanCode,
            name: newName.trim(),
            ownerEmail: userEmail,
            status: 'open',
            bookingModel: 'both',
            plan: 'free',
            trialStartedAt: Date.now(),
            loyaltyEnabled: false
          };
          await setDoc(docRef, newEst);
          onSelect(newEst);
        }
      } else {
        if (docSnap.exists()) {
          const estData = { id: docSnap.id, ...docSnap.data() } as Establishment;
          onSelect(estData);
        } else {
          setError("Código não encontrado.");
        }
      }
    } catch (e: any) {
      handleFirebaseError(e);
    } finally {
      setActionLoading(false);
    }
  };

  const forceRetry = async () => {
    try {
      await terminate(db);
      await clearIndexedDbPersistence(db);
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#050810] p-6 flex flex-col max-w-xl mx-auto w-full">
      <header className="flex justify-between items-center mb-12">
        <div className="w-12 h-12">{LOGO_SVG}</div>
        <button onClick={onLogout} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-red-500"><LogOut size={20}/></button>
      </header>

      <div className="space-y-3 mb-10">
        <h1 className="text-3xl font-black text-white font-orbitron uppercase tracking-tighter">
          {userRole === 'admin' ? 'Meu Negócio' : 'Escolha o Local'}
        </h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{userEmail}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 flex-1 overflow-y-auto pb-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-700 gap-4">
            <Loader2 size={32} className="animate-spin text-teal-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Conectando ao Firestore...</span>
          </div>
        ) : (
          connections.map(est => (
            <button key={est.id} onClick={() => onSelect(est)} className="bg-slate-900/40 border border-slate-800 p-7 rounded-[40px] flex items-center justify-between text-left group">
              <div>
                <h3 className="text-white font-black text-xl uppercase font-orbitron mb-2">{est.name}</h3>
                <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-3 py-1 rounded-xl border border-teal-500/20">{est.id}</span>
              </div>
              <ArrowRight size={20} className="text-slate-500 group-hover:text-teal-400" />
            </button>
          ))
        )}

        {isAdding ? (
          <div className="bg-slate-900 border-2 border-dashed border-slate-800 p-8 rounded-[40px] space-y-6">
             {error && (
               <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl space-y-4">
                 <div className="flex gap-3 text-red-500 items-start">
                   <AlertCircle size={20} className="shrink-0" />
                   <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-widest">Erro Detectado</p>
                     <p className="text-[11px] font-medium leading-relaxed">{error}</p>
                   </div>
                 </div>

                 {diagnose === 'permissions' && (
                   <div className="p-4 bg-slate-950 rounded-xl space-y-3 border border-white/5">
                     <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed">
                       Siga estes passos no console do Firebase:
                     </p>
                     <ol className="text-[9px] text-white space-y-2 list-decimal ml-4 uppercase font-black">
                       <li>Clique em "Firestore Database" (Triângulo Laranja)</li>
                       <li>Vá na aba "Rules" (Regras)</li>
                       <li>Cole a regra que te mandei e clique em PUBLISH</li>
                     </ol>
                     <a href="https://console.firebase.google.com/project/_/database/firestore/rules" target="_blank" className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-600 text-[8px] font-black uppercase rounded-lg">Abrir Firestore Rules <ExternalLink size={12}/></a>
                   </div>
                 )}

                 {diagnose === 'propagation' && (
                   <button onClick={forceRetry} className="w-full py-3 bg-amber-500 text-slate-950 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2">
                     <RefreshCw size={14} /> Tentar Agora
                   </button>
                 )}
               </div>
             )}

             <div className="space-y-4">
               {userRole === 'admin' && (
                 <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="NOME DA EMPRESA" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold uppercase outline-none" />
               )}
               <input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="CÓDIGO (EX: BARBER-01)" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-orbitron font-bold uppercase outline-none" />
             </div>

             <div className="flex gap-3">
               <button onClick={() => { setIsAdding(false); setError(''); }} className="flex-1 py-4 text-slate-500 font-black text-[10px] uppercase">Cancelar</button>
               <button onClick={handleAction} disabled={actionLoading} className="flex-[2] bg-teal-500 text-slate-950 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2">
                 {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16}/> {userRole === 'admin' ? 'Criar Unidade' : 'Vincular'}</>}
               </button>
             </div>
          </div>
        ) : (
          <button onClick={() => setIsAdding(true)} className="w-full border-2 border-dashed border-slate-800 p-10 rounded-[40px] flex flex-col items-center justify-center gap-4 text-slate-600 hover:text-teal-400 hover:border-teal-500/50 transition-all">
            <Plus size={32}/>
            <span className="text-[11px] font-black uppercase tracking-widest">{userRole === 'admin' ? 'Nova Unidade' : 'Vincular Unidade'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
