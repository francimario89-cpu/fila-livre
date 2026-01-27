
import React, { useState, useEffect } from 'react';
import { LOGO_SVG } from '../constants.tsx';
import { Plus, LogOut, ArrowRight, Loader2, AlertCircle, Trash2, Zap, Coffee, DoorClosed } from 'lucide-react';
import { Establishment, EstStatus, QueueItem } from '../types.ts';
import { db } from '../services/firebase.ts';
import { doc, getDoc, setDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';

interface BusinessSelectProps {
  userEmail: string;
  userRole: 'admin' | 'client';
  userQueues: QueueItem[];
  onSelect: (est: Establishment) => void;
  onLogout: () => void;
  theme?: 'dark' | 'light';
}

export const BusinessSelect: React.FC<BusinessSelectProps> = ({ userEmail, userRole, userQueues, onSelect, onLogout, theme = 'dark' }) => {
  const [connections, setConnections] = useState<Establishment[]>([]);
  const [liveStatuses, setLiveStatuses] = useState<Record<string, EstStatus>>({});
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<{code: string, message: string} | null>(null);

  useEffect(() => {
    loadConnections();
  }, [userEmail, userRole]);

  useEffect(() => {
    if (connections.length === 0) return;
    const unsubs = connections.map(est => {
      return onSnapshot(doc(db, "establishments", est.id), (snap) => {
        if (snap.exists()) {
          setLiveStatuses(prev => ({ ...prev, [est.id]: snap.data().status as EstStatus }));
        }
      });
    });
    return () => unsubs.forEach(unsub => unsub());
  }, [connections]);

  const loadConnections = async () => {
    setLoading(true);
    try {
      if (userRole === 'admin') {
        const q = query(collection(db, "establishments"), where("ownerEmail", "==", userEmail));
        const snap = await getDocs(q);
        setConnections(snap.docs.map(d => ({ id: d.id, ...d.data() } as Establishment)));
      } else {
        const saved = JSON.parse(localStorage.getItem(`client_history_${userEmail}`) || '[]');
        setConnections(saved);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleAction = async () => {
    if (!newCode) return;
    const cleanCode = newCode.trim().toUpperCase();
    setActionLoading(true);
    try {
      const docRef = doc(db, "establishments", cleanCode);
      const docSnap = await getDoc(docRef);
      if (userRole === 'admin') {
        const estData: Establishment = { id: cleanCode, name: newName || 'Unidade', ownerEmail: userEmail, status: 'open', bookingModel: 'both', plan: 'free', trialStartedAt: Date.now(), loyaltyEnabled: false };
        await setDoc(docRef, estData);
        onSelect(estData);
      } else {
        if (docSnap.exists()) {
          const estData = { id: docSnap.id, ...docSnap.data() } as Establishment;
          const saved = JSON.parse(localStorage.getItem(`client_history_${userEmail}`) || '[]');
          const updated = [estData, ...saved.filter((s: Establishment) => s.id !== estData.id)].slice(0, 5);
          localStorage.setItem(`client_history_${userEmail}`, JSON.stringify(updated));
          onSelect(estData);
        } else {
          setError({ code: '404', message: 'Unidade não encontrada.' });
        }
      }
    } catch (e) { console.error(e); } finally { setActionLoading(false); }
  };

  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen p-6 flex flex-col max-w-xl mx-auto w-full ${isLight ? 'bg-slate-50' : 'bg-[#050810]'}`}>
      <header className="flex justify-between items-center mb-12">
        <div className="w-12 h-12">{LOGO_SVG}</div>
        <button onClick={onLogout} className="p-3 border rounded-2xl text-red-500"><LogOut size={20}/></button>
      </header>
      <div className="space-y-6 flex-1">
        {loading ? <Loader2 className="animate-spin text-teal-500 mx-auto mt-20" size={32} /> : (
          connections.map(est => (
            <button key={est.id} onClick={() => onSelect(est)} className={`w-full border-2 p-6 rounded-[40px] flex items-center justify-between ${isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
              <div className="text-left"><span className={`font-black uppercase font-orbitron text-lg block ${isLight ? 'text-slate-900' : 'text-white'}`}>{est.name}</span><p className="text-[8px] text-slate-500 uppercase">ID: {est.id}</p></div>
              <ArrowRight size={24} className="text-teal-400" />
            </button>
          ))
        )}
        <button onClick={() => setIsAdding(true)} className="w-full border-2 border-dashed p-12 rounded-[40px] text-slate-600 flex flex-col items-center gap-4"><Plus size={32}/> <span className="text-[11px] font-black uppercase">Novo Código</span></button>
      </div>
      {isAdding && (
        <div className="fixed inset-0 bg-black/90 z-50 p-6 flex items-center justify-center">
          <div className="bg-slate-900 p-8 rounded-[40px] w-full max-w-sm space-y-4">
            <input placeholder="CÓDIGO" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white font-orbitron" />
            <button onClick={handleAction} disabled={actionLoading} className="w-full bg-teal-500 py-4 rounded-2xl font-black">{actionLoading ? 'Sincronizando...' : 'Conectar'}</button>
            <button onClick={() => setIsAdding(false)} className="w-full text-slate-500 text-xs py-2">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};
