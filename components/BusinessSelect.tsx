
import React, { useState, useEffect } from 'react';
import { LOGO_SVG } from '../constants';
import { Plus, LogOut, ArrowRight, Loader2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
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
  const [diagnose, setDiagnose] = useState<'permissions' | 'other' | null>(null);

  useEffect(() => {
    loadConnections();
  }, [userEmail, userRole]);

  const loadConnections = async () => {
    setLoading(true);
    setError('');
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
      if (e.code === 'permission-denied') {
        setDiagnose('permissions');
        setError("O Firebase negou o acesso. Você precisa liberar as 'Regras' no seu painel.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!newCode) return setError('O código é obrigatório.');
    const cleanCode = newCode.toUpperCase().trim().replace(/[^A-Z0-9-]/g, '');
    setActionLoading(true);
    setError('');

    try {
      const docRef = doc(db, "establishments", cleanCode);
      const docSnap = await getDoc(docRef);

      if (userRole === 'admin') {
        if (docSnap.exists() && docSnap.data().ownerEmail !== userEmail) {
          setError("Este código já pertence a outra empresa.");
        } else {
          const newEst: Establishment = {
            id: cleanCode,
            name: newName || 'Minha Unidade',
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
          onSelect({ id: docSnap.id, ...docSnap.data() } as Establishment);
        } else {
          setError("Unidade não encontrada.");
        }
      }
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        setDiagnose('permissions');
        setError("Acesso Negado. Verifique as Regras do Firestore.");
      } else {
        setError(e.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050810] p-6 flex flex-col max-w-xl mx-auto w-full">
      <header className="flex justify-between items-center mb-12">
        <div className="w-12 h-12">{LOGO_SVG}</div>
        <button onClick={onLogout} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-red-500"><LogOut size={20}/></button>
      </header>

      <div className="space-y-3 mb-10">
        <h1 className="text-3xl font-black text-white font-orbitron uppercase">Seus Locais</h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{userEmail}</p>
      </div>

      <div className="space-y-4 flex-1">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-teal-500" /></div>
        ) : (
          connections.map(est => (
            <button key={est.id} onClick={() => onSelect(est)} className="w-full bg-slate-900/40 border border-slate-800 p-7 rounded-[40px] flex items-center justify-between group">
              <span className="text-white font-black uppercase font-orbitron">{est.name}</span>
              <ArrowRight size={20} className="text-slate-500 group-hover:text-teal-400" />
            </button>
          ))
        )}

        {isAdding ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <p className="text-[10px] text-red-500 font-black uppercase text-center">{error}</p>
                {diagnose === 'permissions' && (
                  <a href="https://console.firebase.google.com/project/_/database/firestore/rules" target="_blank" className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg">Abrir Console <ExternalLink size={12}/></a>
                )}
              </div>
            )}
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="NOME DA EMPRESA" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold uppercase" />
            <input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="CÓDIGO (EX: BARBER-01)" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-orbitron" />
            <div className="flex gap-3">
              <button onClick={() => setIsAdding(false)} className="flex-1 py-4 text-slate-500 font-black text-[10px] uppercase">Cancelar</button>
              <button onClick={handleAction} className="flex-[2] bg-teal-500 text-slate-950 py-4 rounded-2xl font-black text-[10px] uppercase">Confirmar</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsAdding(true)} className="w-full border-2 border-dashed border-slate-800 p-10 rounded-[40px] flex flex-col items-center gap-4 text-slate-600 hover:text-teal-400">
            <Plus size={32}/>
            <span className="text-[11px] font-black uppercase tracking-widest">Adicionar Unidade</span>
          </button>
        )}
      </div>
    </div>
  );
};
