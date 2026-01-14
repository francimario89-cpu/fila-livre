
import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, BarChart3, Users2, UserCircle, Clock, Zap, Gift, FileText, Store, Save, ToggleLeft, ToggleRight, Monitor, UserPlus, Coffee, DoorClosed, CheckCircle2, UserMinus
} from 'lucide-react';
import { Professional, Service, QueueItem, EstStatus, BookingModel, RevenueRecord, PlanType, Establishment, ProfStatus } from '../types';
import { FinancialDetailModal } from './FinancialDetailModal';

interface AdminPanelProps {
  establishment: Establishment;
  queue: QueueItem[];
  services: Service[];
  professionals: Professional[];
  estStatus: EstStatus;
  bookingModel: BookingModel;
  plan: PlanType;
  trialStartedAt: number;
  loyaltyEnabled: boolean;
  revenue: RevenueRecord[];
  pixKey: string;
  onUpdateEstablishment: (data: Partial<Establishment>) => void;
  onDeleteEstablishment: () => void;
  onSetPixKey: (key: string) => void;
  onSetBookingModel: (model: BookingModel) => void;
  onSetLoyaltyEnabled: (enabled: boolean) => void;
  onCallNext: () => void;
  onNoShow: () => void;
  onUpdateStatus: (s: EstStatus) => void;
  onUpdateServices: (s: Service[]) => void;
  onUpdatePros: (p: Professional[]) => void;
  onManualJoin: (data: any) => void;
  onToggleTVMode: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  establishment, queue, services, professionals, estStatus, bookingModel, plan, loyaltyEnabled, revenue, pixKey,
  onUpdateEstablishment, onDeleteEstablishment, onSetPixKey, onSetBookingModel, onSetLoyaltyEnabled, onCallNext, onNoShow, onUpdateStatus, onUpdateServices, onUpdatePros, onManualJoin, onToggleTVMode
}) => {
  const [newProName, setNewProName] = useState('');
  const [isAddingPro, setIsAddingPro] = useState(false);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [isAddingManual, setIsAddingManual] = useState(false);
  
  const [manualName, setManualName] = useState('');
  const [manualService, setManualService] = useState(services[0]?.name || '');
  const [manualPro, setManualPro] = useState('any');

  const [editEstName, setEditEstName] = useState(establishment.name);

  const totalEarnings = useMemo(() => revenue.reduce((acc, curr) => acc + curr.amount, 0), [revenue]);

  const handleUpdateProStatus = (proId: string, status: ProfStatus) => {
    const updated = professionals.map(p => p.id === proId ? { ...p, status } : p);
    onUpdatePros(updated);
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      
      {/* STATUS DO ESTABELECIMENTO */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Store size={14} className="text-indigo-400" /> Funcionamento da Loja
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'open', label: 'Aberto', icon: <CheckCircle2 size={16}/>, color: 'emerald' },
            { id: 'lunch', label: 'Almoço', icon: <Coffee size={16}/>, color: 'amber' },
            { id: 'closed', label: 'Fechado', icon: <DoorClosed size={16}/>, color: 'red' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => onUpdateStatus(s.id as EstStatus)}
              className={`flex flex-col items-center gap-2 py-4 rounded-3xl border-2 transition-all ${
                estStatus === s.id 
                ? `border-${s.color}-500 bg-${s.color}-500/10 text-${s.color}-400 shadow-lg shadow-${s.color}-500/10` 
                : 'border-slate-800 bg-slate-900 text-slate-600'
              }`}
            >
              {s.icon}
              <span className="text-[8px] font-black uppercase tracking-widest">{s.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ATALHOS RÁPIDOS */}
      <section className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setIsAddingManual(true)}
          className="bg-indigo-600 p-6 rounded-[32px] flex flex-col items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
        >
          <UserPlus size={24} className="text-white" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Entrada Manual</span>
        </button>
        <button 
          onClick={onToggleTVMode}
          className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex flex-col items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
        >
          <Monitor size={24} className="text-teal-400" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Painel TV</span>
        </button>
      </section>

      {/* PROFISSIONAIS E SEUS STATUS */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Users2 size={14} className="text-indigo-400" /> Gestão de Equipe
        </h3>
        <div className="space-y-3">
          {professionals.map(p => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 p-5 rounded-[32px] space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    p.status === 'available' ? 'bg-emerald-500/10 text-emerald-500' :
                    p.status === 'absent' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    <UserCircle size={24} />
                  </div>
                  <div>
                    <span className="text-sm font-black text-white uppercase block">{p.name}</span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase">
                      {p.status === 'available' ? 'Disponível' : p.status === 'lunch' || p.status === 'busy' ? 'Pausa' : 'Ausente'}
                    </span>
                  </div>
                </div>
                <button onClick={() => onUpdatePros(professionals.filter(x => x.id !== p.id))} className="text-slate-800 hover:text-red-500 p-2"><Trash2 size={16}/></button>
              </div>

              {/* CONTROLES DE STATUS DO BARBEIRO */}
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => handleUpdateProStatus(p.id, 'available')}
                  className={`py-2 rounded-xl text-[7px] font-black uppercase tracking-widest border transition-all ${p.status === 'available' ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-600'}`}
                >
                  Online
                </button>
                <button 
                  onClick={() => handleUpdateProStatus(p.id, 'lunch')}
                  className={`py-2 rounded-xl text-[7px] font-black uppercase tracking-widest border transition-all ${p.status === 'lunch' || p.status === 'busy' ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-600'}`}
                >
                  Pausa
                </button>
                <button 
                  onClick={() => handleUpdateProStatus(p.id, 'absent')}
                  className={`py-2 rounded-xl text-[7px] font-black uppercase tracking-widest border transition-all ${p.status === 'absent' ? 'bg-red-500 border-red-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-600'}`}
                >
                  Offline
                </button>
              </div>
            </div>
          ))}
          {!isAddingPro ? (
            <button onClick={() => setIsAddingPro(true)} className="w-full border-2 border-dashed border-slate-800 p-7 rounded-[32px] text-slate-600 uppercase text-[10px] font-black flex items-center justify-center gap-3">
              <Plus size={16}/> Novo Profissional
            </button>
          ) : (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] space-y-4 animate-in slide-in-from-top-4">
              <input autoFocus placeholder="NOME DO BARBEIRO" value={newProName} onChange={e => setNewProName(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-xs text-white font-black" />
              <div className="flex gap-2">
                <button onClick={() => setIsAddingPro(false)} className="flex-1 py-4 text-slate-500 font-black text-[10px] uppercase">Cancelar</button>
                <button onClick={() => { if(newProName) { onUpdatePros([...professionals, {id: Math.random().toString(36).substr(2, 9), name: newProName, status: 'available', establishmentId: establishment.id}]); setIsAddingPro(false); setNewProName(''); } }} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase">Salvar</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FINANCEIRO RÁPIDO */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <BarChart3 size={14} className="text-emerald-500" /> Resumo Financeiro
        </h3>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] space-y-4 shadow-xl">
          <div>
            <h4 className="text-4xl font-black text-white neon-text">R$ {totalEarnings.toFixed(2)}</h4>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{revenue.length} Atendimentos concluídos</p>
          </div>
          <button onClick={() => setIsFinancialModalOpen(true)} className="w-full bg-slate-950 border border-slate-800 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-300 flex items-center justify-center gap-2">
            <FileText size={16} className="text-emerald-500" /> Ver Relatório Completo
          </button>
        </div>
      </section>

      {/* MODAL ADICIONAR MANUAL */}
      {isAddingManual && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md" onClick={() => setIsAddingManual(false)} />
          <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 p-8 rounded-[40px] space-y-6">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Entrada Manual</h3>
            <div className="space-y-4">
              <input 
                placeholder="NOME DO CLIENTE" 
                value={manualName} 
                onChange={e => setManualName(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase"
              />
              <select 
                value={manualService} 
                onChange={e => setManualService(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase"
              >
                {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <select 
                value={manualPro} 
                onChange={e => setManualPro(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase"
              >
                <option value="any">SEM PREFERÊNCIA</option>
                {professionals.filter(p => p.status !== 'absent').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsAddingManual(false)} className="flex-1 text-slate-500 font-black text-[10px] uppercase">Cancelar</button>
              <button 
                onClick={() => {
                  if(!manualName) return;
                  onManualJoin({ name: manualName, service: manualService, professionalId: manualPro, type: 'walk-in' });
                  setManualName('');
                  setIsAddingManual(false);
                }}
                className="flex-[2] bg-indigo-600 text-white p-4 rounded-2xl font-black text-[10px] uppercase"
              >
                Inserir na Fila
              </button>
            </div>
          </div>
        </div>
      )}

      {isFinancialModalOpen && <FinancialDetailModal revenue={revenue} onClose={() => setIsFinancialModalOpen(false)} />}
    </div>
  );
};
