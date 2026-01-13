
import React, { useState, useEffect } from 'react';
import { LOGO_SVG } from '../constants';
import { Plus, LogOut, Building2, ArrowRight, Loader2, AlertCircle, Database, Zap, Clock, Hash, Search, Trash2, Edit2, X, Check, PlusCircle } from 'lucide-react';
import { Establishment } from '../types';
import { db } from '../services/firebase';
import { doc, setDoc, collection, query, where, getDocs, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHelper, setShowHelper] = useState(false);
  const [helperType, setHelperType] = useState<'rules' | 'domain'>('rules');

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
        const cloudData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Establishment));
        setConnections(cloudData);
      } else {
        const saved = JSON.parse(localStorage.getItem(`client_history_${userEmail}`) || '[]');
        setConnections(saved.slice(0, 6));
      }
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        setShowHelper(true);
        setHelperType('rules');
      }
      const localData = JSON.parse(localStorage.getItem(`local_establishments_${userEmail}`) || '[]');
      setConnections(localData);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = async () => {
    const cleanCode = newCode.toUpperCase().trim();
    if (!cleanCode) return setError('Digite o código do salão.');
    
    setActionLoading(true);
    setError('');
    setShowHelper(false);

    try {
      const docRef = doc(db, "establishments", cleanCode);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const estData = { id: docSnap.id, ...docSnap.data() } as Establishment;
        
        const history = JSON.parse(localStorage.getItem(`client_history_${userEmail}`) || '[]');
        const filtered = history.filter((h: any) => h.id !== estData.id);
        const newHistory = [estData, ...filtered].slice(0, 6);
        localStorage.setItem(`client_history_${userEmail}`, JSON.stringify(newHistory));
        
        onSelect(estData);
      } else {
        setError(`O código "${cleanCode}" não foi encontrado.`);
      }
    } catch (e: any) {
      console.error("Join Error:", e);
      if (e.code === 'permission-denied') {
        setError('Acesso negado pelo Firebase. Verifique as Regras de Segurança.');
        setShowHelper(true);
        setHelperType('rules');
      } else {
        setError('Falha na conexão. Verifique sua internet ou o código.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBusiness = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir esta unidade? Todos os dados da fila e histórico desta unidade serão perdidos.')) return;
    
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "establishments", id));
      setConnections(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError('Erro ao excluir unidade.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateBusiness = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editName.trim()) return;
    
    setActionLoading(true);
    try {
      const docRef = doc(db, "establishments", id);
      await updateDoc(docRef, { name: editName.toUpperCase().trim() });
      setConnections(prev => prev.map(c => c.id === id ? { ...c, name: editName.toUpperCase().trim() } : c));
      setEditingId(null);
    } catch (err) {
      setError('Erro ao atualizar unidade.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateBusiness = async () => {
    setError('');
    if (!newCode.trim() || !newName.trim()) {
      return setError('Nome e Código são obrigatórios.');
    }

    setActionLoading(true);
    const cleanCode = newCode.toUpperCase().trim().replace(/[^A-Z0-9-]/g, '');
    
    if (cleanCode.length < 3) {
      setActionLoading(false);
      return setError('O código deve ter pelo menos 3 caracteres.');
    }

    const newEst: Establishment = {
      id: cleanCode,
      name: newName.trim().toUpperCase(),
      ownerEmail: userEmail,
      status: 'open',
      bookingModel: 'both',
      plan: 'free',
      trialStartedAt: Date.now(),
      loyaltyEnabled: true
    };

    try {
      const checkDoc = await getDoc(doc(db, "establishments", cleanCode));
      if (checkDoc.exists()) {
        setError('Este código já está em uso por outro estabelecimento.');
        setActionLoading(false);
        return;
      }

      await setDoc(doc(db, "establishments", cleanCode), newEst);
      onSelect(newEst);
    } catch (e: any) {
      console.error("Create Error:", e);
      if (e.code === 'permission-denied') {
        setShowHelper(true);
        setHelperType('rules');
        setError('Acesso negado ao criar. Verifique suas Regras de Segurança.');
      } else {
        setError('Erro ao criar barbearia. Tente novamente mais tarde.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const openAddForm = () => {
    setError('');
    setIsAdding(true);
  };

  return (
    <div className="min-h-screen bg-[#050810] p-6 flex flex-col max-w-xl mx-auto w-full animate-in fade-in duration-700">
      <header className="flex justify-between items-center mb-10">
        <div className="w-12 h-12 drop-shadow-[0_0_8px_rgba(45,212,191,0.4)]">{LOGO_SVG}</div>
        <button onClick={onLogout} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-red-500 shadow-xl active:scale-95 transition-all">
          <LogOut size={20}/>
        </button>
      </header>

      <div className="space-y-3 mb-8">
        <h1 className="text-3xl font-black text-white font-orbitron uppercase tracking-tighter">
          {userRole === 'admin' ? 'Suas Unidades' : 'Entrar no Salão'}
        </h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">
          {userRole === 'admin' ? 'Gerencie seus negócios' : 'Acesse sua barbearia favorita'}
        </p>
      </div>

      {showHelper && (
        <div className="mb-8">
          <FirebaseHelper error={error} type={helperType} />
        </div>
      )}

      {/* BARRA DE BUSCA OU BOTÃO DE ADICIONAR */}
      {!isAdding && !editingId && (
        <div className="mb-10 space-y-4">
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-teal-500 group-focus-within:scale-110 transition-transform">
              {userRole === 'admin' ? <Search size={20} /> : <Hash size={20} />}
            </div>
            <input 
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder={userRole === 'admin' ? "BUSCAR UNIDADE PELO CÓDIGO" : "DIGITE O CÓDIGO DO SALÃO"} 
              className="w-full bg-slate-900/50 border-2 border-slate-800 rounded-3xl py-6 pl-14 pr-6 text-white font-orbitron font-bold placeholder:text-slate-700 focus:border-teal-500 outline-none transition-all shadow-2xl"
            />
            <button 
              onClick={handleJoinByCode}
              disabled={actionLoading}
              className="absolute right-3 top-3 bottom-3 bg-teal-500 text-slate-950 px-6 rounded-2xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all flex items-center gap-2"
            >
              {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Entrar'}
            </button>
          </div>
          
          {userRole === 'admin' && (
            <button 
              onClick={openAddForm}
              className="w-full py-5 bg-indigo-600/10 border border-indigo-500/30 rounded-3xl flex items-center justify-center gap-3 text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600/20 transition-all active:scale-95"
            >
              <PlusCircle size={18} /> Cadastrar Nova Barbearia
            </button>
          )}

          {error && !showHelper && <p className="text-red-500 text-[10px] font-black uppercase text-center tracking-widest bg-red-500/10 py-3 rounded-xl">{error}</p>}
        </div>
      )}

      {/* LISTA DE CONEXÕES / HISTÓRICO */}
      <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pb-10">
        {!isAdding && (
          <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">
            {userRole === 'admin' ? 'Unidades Registradas' : 'Acessos Recentes'}
          </h3>
        )}
        
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-teal-500" size={32} /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {connections.length === 0 && !isAdding && (
              <div className="py-12 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-[32px]">
                 <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Nenhuma unidade encontrada</p>
              </div>
            )}
            
            {!isAdding && connections.map(est => (
              <div key={est.id} className="relative group">
                {editingId === est.id ? (
                  <form onSubmit={(e) => handleUpdateBusiness(e, est.id)} className="bg-slate-900 border-2 border-teal-500 p-4 rounded-[32px] flex items-center gap-3 animate-in zoom-in duration-200 shadow-2xl">
                    <input 
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white font-bold uppercase text-xs outline-none focus:border-teal-500"
                    />
                    <button type="button" onClick={() => setEditingId(null)} className="p-2 text-slate-500"><X size={20}/></button>
                    <button type="submit" disabled={actionLoading} className="p-2 text-teal-500">
                      {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20}/>}
                    </button>
                  </form>
                ) : (
                  <div className="relative">
                    <button 
                      onClick={() => onSelect(est)} 
                      className="w-full bg-slate-900/40 border border-slate-800 p-6 rounded-[32px] flex items-center justify-between text-left group hover:border-teal-500/50 transition-all shadow-xl"
                    >
                      <div className="flex items-center gap-5">
                         <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-950 transition-all shadow-lg">
                            <Building2 size={24} />
                         </div>
                         <div>
                            <h4 className="text-white font-black text-sm uppercase font-orbitron">{est.name}</h4>
                            <span className="text-[9px] font-mono text-slate-500">{est.id}</span>
                         </div>
                      </div>
                      <ArrowRight size={18} className="text-slate-700 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
                    </button>

                    {userRole === 'admin' && (
                      <div className="absolute right-14 top-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingId(est.id); setEditName(est.name); }}
                          className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all shadow-lg"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteBusiness(e, est.id)}
                          className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {userRole === 'admin' && isAdding && (
              <div className="bg-slate-900 border-2 border-indigo-500/30 p-8 rounded-[40px] space-y-6 animate-in zoom-in duration-300 shadow-[0_20px_50px_rgba(79,70,229,0.15)]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-tighter">Nova Unidade</h3>
                  <button onClick={() => setIsAdding(false)} className="text-slate-500"><X size={20}/></button>
                </div>
                
                <div className="space-y-5">
                   <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Barbearia</label>
                     <input value={newName} onChange={e => setNewName(e.target.value.toUpperCase())} placeholder="EX: BARBA E CIA" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4.5 px-6 text-white font-bold uppercase outline-none focus:border-indigo-500 transition-all" />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Código Único de Acesso</label>
                     <input value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} placeholder="EX: BARBER-01" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4.5 px-6 text-white font-orbitron font-bold uppercase outline-none focus:border-indigo-500 transition-all" />
                     <p className="text-[8px] text-slate-600 font-bold uppercase mt-1 px-1">Este código será usado pelos seus clientes.</p>
                   </div>
                </div>

                {error && <p className="text-red-500 text-[9px] font-black uppercase tracking-widest text-center py-2 bg-red-500/5 rounded-lg">{error}</p>}

                <div className="flex gap-3">
                   <button onClick={() => setIsAdding(false)} className="flex-1 py-4 text-slate-500 font-black text-[10px] uppercase">Cancelar</button>
                   <button onClick={handleCreateBusiness} disabled={actionLoading} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                     {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirmar e Criar'}
                   </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <p className="text-center py-6 text-[8px] text-slate-800 font-black uppercase tracking-[0.5em]">Fila Livre Core v3.0 • Google Cloud Active</p>
    </div>
  );
};
