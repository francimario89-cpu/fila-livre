
import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, BarChart3, Users2, UserCircle, Clock, Zap, Gift, FileText, Store, Save, ToggleLeft, ToggleRight, Monitor, UserPlus, Coffee, DoorClosed, CheckCircle2, UserMinus, Timer, Scissors
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
  
  const [isAddingService, setIsAddingService] = useState(false);
  const [newSName, setNewSName] = useState('');
  const [newSPrice, setNewSPrice] = useState('');
  const [newSDuration, setNewSDuration] = useState('30');

  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [isAddingManual, setIsAddingManual] = useState(false);
  
  const [manualName, setManualName] = useState('');
  const [manualService, setManualService] = useState(services[0]?.name || '');
  const [manualPro, setManualPro] = useState('any');

  const totalEarnings = useMemo(() => revenue.reduce((acc, curr) => acc + curr.amount, 0), [revenue]);
  
  const avgServiceTime = useMemo(() => {
    if (services.length === 0) return 0;
    return Math.round(services.reduce((acc, s) => acc + (Number(s.duration) || 30), 0) / services.length);
  }, [services]);

  const handleUpdateProStatus = (proId: string, status: ProfStatus) => {
    const updated = professionals.map(p => p.id === proId ? { ...p, status } : p);
    onUpdatePros(updated);
  };

  const handleAddService = () => {
    if (!newSName || !newSPrice) return;
    const newService: Service = {
      id: Math.random().toString(36).substr(2, 9),
      name: newSName.toUpperCase(),
      price: newSPrice,
      duration: Number(newSDuration),
      establishmentId: establishment.id
    };
    onUpdateServices([...services, newService]);
    setNewSName('');
    setNewSPrice('');
    setNewSDuration('30');
    setIsAddingService(false);
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

      {/* MÉTRICAS RÁPIDAS */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] space-y-2">
            <div className="flex items-center gap-2 text-emerald-500 mb-1">
                <BarChart3 size={16} />
                <span className="text-[8px] font-black uppercase tracking-widest">Faturamento</span>
            </div>
            <h4 className="text-xl font-black text-white">R$ {totalEarnings.toFixed(0)}</h4>
            <p className="text-[8px] text-slate-500 font-bold uppercase">{revenue.length} atendimentos</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 mb-1">
                <Timer size={16} />
                <span className="text-[8px] font-black uppercase tracking-widest">Média de Tempo</span>
            </div>
            <h4 className="text-xl font-black text-white">{avgServiceTime} min</h4>
            <p className="text-[8px] text-slate-500 font-bold uppercase">por procedimento</p>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Scissors size={14} className="text-teal-400" /> Tabela de Serviços
        </h3>
        <div className="space-y-3">
          {services.map(s => (
            <div key={s.id} className="bg-slate-900 border border-slate-800 p-5 rounded-[32px] flex items-center justify-between shadow-lg">
              <div className="flex flex-col">
                <span className="text-sm font-black text-white uppercase">{s.name}</span>
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase">
                   <span>R$ {s.price}</span>
                   <span className="w-1 h-1 bg-slate-700 rounded-full"/>
                   <span className="text-teal-500">{s.duration} min</span>
                </div>
              </div>
              <button onClick={() => onUpdateServices(services.filter(x => x.id !== s.id))} className="text-slate-800 hover:text-red-500 p-2"><Trash2 size={16}/></button>
            </div>
          ))}

          {!isAddingService ? (
            <button onClick={() => setIsAddingService(true)} className="w-full border-2 border-dashed border-slate-800 p-7 rounded-[32px] text-slate-600 uppercase text-[10px] font-black flex items-center justify-center gap-3">
              <Plus size={16}/> Novo Serviço
            </button>
          ) : (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] space-y-4 animate-in slide-in-from-top-4">
              <input placeholder="NOME DO SERVIÇO" value={newSName} onChange={e => setNewSName(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-xs text-white font-black" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Preço (R$)</label>
                  <input placeholder="Ex: 50,00" value={newSPrice} onChange={e => setNewSPrice(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-xs text-white font-black" />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Duração (Min)</label>
                  <input type="number" value={newSDuration} onChange={e => setNewSDuration(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-xs text-white font-black" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsAddingService(false)} className="flex-1 py-4 text-slate-500 font-black text-[10px] uppercase">Cancelar</button>
                <button onClick={handleAddService} className="flex-1 bg-teal-500 text-slate-950 py-4 rounded-2xl font-black text-[10px] uppercase">Salvar Serviço</button>
              </div>
            </div>
          )}
        </div>
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
                      {p.status === 'available' ? 'Ativo / Online' : p.status === 'lunch' || p.status === 'busy' ? 'Em Pausa' : 'Offline / Ausente'}
                    </span>
                  </div>
                </div>
                <button onClick={() => onUpdatePros(professionals.filter(x => x.id !== p.id))} className="text-slate-800 hover:text-red-500 p-2"><Trash2 size={16}/></button>
              </div>

              {/* CONTROLES DE STATUS DO BARBEIRO */}
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => handleUpdateProStatus(p.id, 'available')}
                  className={`py-3 rounded-xl text-[7px] font-black uppercase tracking-widest border transition-all ${p.status === 'available' ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/10' : 'bg-slate-950 border-slate-800 text-slate-600'}`}
                >
                  Online
                </button>
                <button 
                  onClick={() => handleUpdateProStatus(p.id, 'lunch')}
                  className={`py-3 rounded-xl text-[7px] font-black uppercase tracking-widest border transition-all ${p.status === 'lunch' || p.status === 'busy' ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-lg shadow-amber-500/10' : 'bg-slate-950 border-slate-800 text-slate-600'}`}
                >
                  Pausa
                </button>
                <button 
                  onClick={() => handleUpdateProStatus(p.id, 'absent')}
                  className={`py-3 rounded-xl text-[7px] font-black uppercase tracking-widest border transition-all ${p.status === 'absent' ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/10' : 'bg-slate-950 border-slate-800 text-slate-600'}`}
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
          <FileText size={14} className="text-emerald-500" /> Detalhes Financeiros
        </h3>
        <button onClick={() => setIsFinancialModalOpen(true)} className="w-full bg-slate-900 border border-slate-800 p-8 rounded-[32px] text-[10px] font-black uppercase text-slate-300 flex items-center justify-center gap-3 shadow-xl hover:bg-slate-800 transition-colors">
          <FileText size={18} className="text-emerald-500" /> Abrir Relatório Completo
        </button>
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
                {services.map(s => <option key={s.id} value={s.name}>{s.name} ({s.duration} min)</option>)}
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
