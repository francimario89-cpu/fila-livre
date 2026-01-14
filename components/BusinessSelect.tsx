
import React, { useState, useEffect } from 'react';
import { LOGO_SVG } from '../constants';
import { Plus, LogOut, ArrowRight, Loader2, AlertCircle, RefreshCw, ExternalLink, Search, Database, Trash2 } from 'lucide-react';
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
  const [error, setError] = useState<{code: string, message: string} | null>(null);

  useEffect(() => {
    loadConnections();
  }, [userEmail, userRole]);

  const loadConnections = async () => {
    setLoading(true);
    setError(null);
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
      console.error("Load Connections Error:", e);
      setError({ code: e.code, message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveConnection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Evita entrar na loja ao clicar na lixeira
    if (confirm("Deseja remover esta loja do seu histórico?")) {
      const updated = connections.filter(c => c.id !== id);
      setConnections(updated);
      localStorage.setItem(`client_history_${userEmail}`, JSON.stringify(updated));
    }
  };

  const handleAction = async () => {
    if (!newCode) return setError({ code: 'required', message: 'O código é obrigatório.' });
    const cleanCode = newCode.trim().toUpperCase();
    setActionLoading(true);
    setError(null);

    try {
      const docRef = doc(db, "establishments", cleanCode);
      const docSnap = await getDoc(docRef);

      if (userRole === 'admin') {
        if (docSnap.exists() && docSnap.data().ownerEmail !== userEmail) {
          setError({ code: 'taken', message: "Este código já pertence a outra empresa." });
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
        if (docSnap.exists()) {
          const estData = { id: docSnap.id, ...docSnap.data() } as Establishment;
          const saved = JSON.parse(localStorage.getItem(`client_history_${userEmail}`) || '[]');
          const updated = [estData, ...saved.filter((s: Establishment) => s.id !== estData.id)].slice(0, 5);
          localStorage.setItem(`client_history_${userEmail}`, JSON.stringify(updated));
          onSelect(estData);
        } else {
          setError({ code: 'not-found', message: `Código "${cleanCode}" não encontrado.` });
        }
      }
    } catch (e: any) {
      console.error("Action Error:", e);
      setError({ code: e.code, message: e.message });
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
        {error && (error.code === 'unavailable' || error.code === 'permission-denied') && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[32px] space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-4 text-amber-500">
              <Database size={24} />
              <h4 className="text-xs font-black uppercase tracking-widest">Banco de Dados não Iniciado</h4>
            </div>
            <p className="text-[10px] text-white/70 font-bold uppercase leading-relaxed">
              O Google Cloud informou que seu banco de dados ainda não foi criado ou está com as regras bloqueadas.
            </p>
            <div className="space-y-2">
              <p className="text-[8px] text-slate-500 font-black uppercase">Como resolver agora:</p>
              <ul className="text-[9px] text-white font-medium space-y-1 ml-4 list-disc">
                <li>Acesse o Console do Firebase</li>
                <li>Clique em "Cloud Firestore" no menu lateral</li>
                <li>Clique no botão azul "Criar banco de dados"</li>
                <li>Escolha "Modo de Teste" e finalize</li>
              </ul>
            </div>
            <a 
              href="https://console.firebase.google.com/project/fila-livre-5d28d/firestore" 
              target="_blank" 
              className="flex items-center justify-center gap-2 w-full py-3 bg-amber-500 text-slate-950 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-amber-500/20"
            >
              Abrir Console do Firebase <ExternalLink size={14} />
            </a>
            <button onClick={() => window.location.reload()} className="w-full text-[9px] text-amber-500 font-black uppercase py-2">Já criei, tentar novamente</button>
          </div>
        )}

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
                  <div key={est.id} className="relative group">
                    <button 
                      onClick={() => onSelect(est)} 
                      className="w-full bg-slate-900/40 border border-slate-800 p-7 rounded-[40px] flex items-center justify-between group-hover:border-teal-500/50 transition-all shadow-xl"
                    >
                      <div className="text-left">
                        <span className="text-white font-black uppercase font-orbitron block">{est.name}</span>
                        <span className="text-[8px] text-slate-500 font-bold uppercase mt-1">ID: {est.id}</span>
                      </div>
                      <ArrowRight size={20} className="text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
                    </button>
                    
                    {userRole === 'client' && (
                      <button 
                        onClick={(e) => handleRemoveConnection(e, est.id)}
                        className="absolute -top-2 -right-2 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-lg backdrop-blur-md"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isAdding ? (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] space-y-6 shadow-2xl animate-in slide-in-from-bottom-4">
                {error && error.code !== 'unavailable' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500">
                    <AlertCircle size={16}/>
                    <p className="text-[10px] font-black uppercase">{error.message}</p>
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
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={() => { setIsAdding(false); setError(null); }} className="flex-1 py-4 text-slate-500 font-black text-[10px] uppercase">Cancelar</button>
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
