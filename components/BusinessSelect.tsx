
import React, { useState, useEffect } from 'react';
import { LOGO_SVG } from '../constants';
import { Plus, LogOut, ArrowRight, Loader2, AlertCircle, RefreshCw, ExternalLink, Search } from 'lucide-react';
import { Establishment } from '../types';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

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
        // Para clientes, carrega do histórico local
        const saved = JSON.parse(localStorage.getItem(`client_history_${userEmail}`) || '[]');
        setConnections(saved);
      }
    } catch (e: any) {
      console.error("Load Connections Error:", e);
      if (e.code === 'permission-denied') {
        setError("Erro de permissão no Firebase. Verifique as Regras.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!newCode) return setError('O código é obrigatório.');
    // Normaliza o código: remove espaços e deixa em maiúsculo
    const cleanCode = newCode.trim().toUpperCase();
    setActionLoading(true);
    setError('');

    try {
      const docRef = doc(db, "establishments", cleanCode);
      const docSnap = await getDoc(docRef);

      if (userRole === 'admin') {
        if (docSnap.exists() && docSnap.data().ownerEmail !== userEmail) {
          setError("Este código já pertence a outra empresa.");
        } else {
          const estData: Establishment = {
            id: cleanCode,
            name: newName || 'Minha Unidade',
            ownerEmail: userEmail,
            status: 'open',
            bookingModel: 'both',
            plan: 'free',
            trialStartedAt: Date.now(),
            loyaltyEnabled: false
          };
          await setDoc(docRef, estData);
          onSelect(estData);
        }
      } else {
        // Lógica de Cliente: Entrar em um salão existente
        if (docSnap.exists()) {
          const estData = { id: docSnap.id, ...docSnap.data() } as Establishment;
          
          // Atualiza histórico local do cliente
          const saved = JSON.parse(localStorage.getItem(`client_history_${userEmail}`) || '[]');
          const updated = [estData, ...saved.filter((s: Establishment) => s.id !== estData.id)].slice(0, 5);
          localStorage.setItem(`client_history_${userEmail}`, JSON.stringify(updated));
          
          onSelect(estData);
        } else {
          setError(`Código "${cleanCode}" não encontrado. Verifique com o estabelecimento.`);
        }
      }
    } catch (e: any) {
      console.error("Action Error:", e);
      if (e.code === 'permission-denied') {
        setError("Acesso Negado: Verifique se você publicou as regras 'allow read, write: if true' no Firebase.");
      } else if (e.code === 'unavailable') {
        setError("Banco de dados offline. Verifique sua conexão ou se criou o banco Firestore.");
      } else {
        setError(`Erro inesperado: ${e.code || e.message}`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050810] p-6 flex flex-col max-w-xl mx-auto w-full">
      <header className="flex justify-between items-center mb-12">
        <div className="w-12 h-12">{LOGO_SVG}</div>
        <button onClick={onLogout} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-red-500 hover:bg-red-500/10 transition-colors">
          <LogOut size={20}/>
        </button>
      </header>

      <div className="space-y-3 mb-10">
        <h1 className="text-3xl font-black text-white font-orbitron uppercase tracking-tighter">
          {userRole === 'admin' ? 'Minhas Unidades' : 'Minhas Filas'}
        </h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{userEmail}</p>
      </div>

      <div className="space-y-4 flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-teal-500" size={32} />
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Sincronizando...</p>
          </div>
        ) : (
          <>
            {connections.length > 0 && (
              <div className="space-y-3">
                <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest ml-4">Recentes</p>
                {connections.map(est => (
                  <button 
                    key={est.id} 
                    onClick={() => onSelect(est)} 
                    className="w-full bg-slate-900/40 border border-slate-800 p-7 rounded-[40px] flex items-center justify-between group hover:border-teal-500/50 transition-all shadow-xl"
                  >
                    <div className="text-left">
                      <span className="text-white font-black uppercase font-orbitron block">{est.name}</span>
                      <span className="text-[8px] text-slate-500 font-bold uppercase mt-1">ID: {est.id}</span>
                    </div>
                    <ArrowRight size={20} className="text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            )}

            {isAdding ? (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] space-y-6 shadow-2xl animate-in slide-in-from-bottom-4">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-red-500">
                      <AlertCircle size={16}/>
                      <p className="text-[10px] font-black uppercase">Falha na Comunicação</p>
                    </div>
                    <p className="text-[10px] text-white/70 font-bold">{error}</p>
                    <button onClick={() => window.location.reload()} className="text-[9px] text-red-500 underline font-black uppercase text-left mt-1">Recarregar App</button>
                  </div>
                )}
                
                {userRole === 'admin' && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Empresa</label>
                    <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="EX: BARBEARIA DO JAPA" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold uppercase focus:border-teal-500 outline-none" />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    {userRole === 'admin' ? 'Crie seu Código de Acesso' : 'Código do Estabelecimento'}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                    <input 
                      value={newCode} 
                      onChange={e => setNewCode(e.target.value.toUpperCase())} 
                      placeholder="EX: BARBER-01" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-white font-orbitron focus:border-teal-500 outline-none" 
                    />
                  </div>
                  <p className="text-[8px] text-slate-600 font-bold uppercase ml-1">O código deve ser idêntico ao informado pela empresa.</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={() => { setIsAdding(false); setError(''); }} className="flex-1 py-4 text-slate-500 font-black text-[10px] uppercase">Cancelar</button>
                  <button 
                    disabled={actionLoading}
                    onClick={handleAction} 
                    className="flex-[2] bg-teal-500 text-slate-950 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : (userRole === 'admin' ? 'Confirmar Criação' : 'Conectar à Fila')}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsAdding(true)} className="w-full border-2 border-dashed border-slate-800 p-12 rounded-[40px] flex flex-col items-center gap-4 text-slate-600 hover:text-teal-400 hover:border-teal-500/50 transition-all bg-slate-900/10">
                <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center">
                  <Plus size={32}/>
                </div>
                <div className="text-center">
                  <span className="text-[11px] font-black uppercase tracking-widest block">
                    {userRole === 'admin' ? 'Criar Nova Unidade' : 'Digitar Novo Código'}
                  </span>
                  <span className="text-[8px] text-slate-700 font-bold uppercase mt-1 tracking-tighter">Sincronização imediata</span>
                </div>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
