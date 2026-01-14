
import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, BarChart3, Users2, UserCircle, Clock, Zap, Gift, FileText, Store, Save, ToggleLeft, ToggleRight, Monitor, UserPlus, Coffee, DoorClosed, CheckCircle2, UserMinus, Timer, Scissors, Calendar, ListOrdered, Settings
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
    onUpdatePros(professionals.map(p => p.id === proId ? { ...p, status } : p));
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500">
      
      {/* STATUS DA LOJA E ATALHOS */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Store size={14} className="text-indigo-400" /> Operação & Visibilidade
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => onUpdateStatus('open')} className={`flex flex-col items-center gap-2 py-4 rounded-3xl border-2 transition-all ${estStatus === 'open' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 bg-slate-900 text-slate-600'}`}>
            <CheckCircle2 size={18}/>
            <span className="text-[8px] font-black uppercase">Aberto</span>
          </button>
          <button onClick={() => onUpdateStatus('lunch')} className={`flex flex-col items-center gap-2 py-4 rounded-3xl border-2 transition-all ${estStatus === 'lunch' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-slate-800 bg-slate-900 text-slate-600'}`}>
            <Coffee size={18}/>
            <span className="text-[8px] font-black uppercase">Pausa</span>
          </button>
          <button onClick={() => onUpdateStatus('closed')} className={`flex flex-col items-center gap-2 py-4 rounded-3xl border-2 transition-all ${estStatus === 'closed' ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-slate-800 bg-slate-900 text-slate-600'}`}>
            <DoorClosed size={18}/>
            <span className="text-[8px] font-black uppercase">Fechado</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={onToggleTVMode} className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex items-center justify-center gap-3 shadow-xl hover:border-teal-500/30 transition-all">
            <Monitor size={22} className="text-teal-400" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Ativar Modo TV</span>
          </button>
          <button onClick={() => setIsAddingManual(true)} className="bg-indigo-600 p-6 rounded-[32px] flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">
            <UserPlus size={22} className="text-white" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Entrada Manual</span>
          </button>
        </div>
      </section>

      {/* AJUSTES DE NEGÓCIO */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          {/* Fix: Added missing Settings import from lucide-react */}
          <Settings size={14} className="text-indigo-400" /> Ajustes do Sistema
        </h3>
        <div className="bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden">
          {/* MODELO DE ATENDIMENTO */}
          <div className="p-6 border-b border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl"><ListOrdered size={18} /></div>
                  <span className="text-[10px] font-black text-white uppercase">Modelo de Atendimento</span>
               </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['queue', 'appointment', 'both'].map(m => (
                <button 
                  key={m} 
                  onClick={() => onSetBookingModel(m as BookingModel)}
                  className={`py-3 rounded-xl text-[7px] font-black uppercase tracking-widest border transition-all ${bookingModel === m ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                >
                  {m === 'queue' ? 'Fila' : m === 'appointment' ? 'Agendamento' : 'Ambos'}
                </button>
              ))}
            </div>
          </div>

          {/* FIDELIDADE */}
          <div className="p-6 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl"><Gift size={18} /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white uppercase leading-none">Programa Fidelidade</span>
                  <span className="text-[7px] font-bold text-slate-500 uppercase mt-1">{loyaltyEnabled ? 'Cartão Digital Ativo' : 'Desativado'}</span>
                </div>
             </div>
             <button 
              onClick={() => onSetLoyaltyEnabled(!loyaltyEnabled)}
              className={`w-14 h-8 rounded-full transition-all relative ${loyaltyEnabled ? 'bg-emerald-500' : 'bg-slate-800'}`}
             >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${loyaltyEnabled ? 'left-7' : 'left-1'}`} />
             </button>
          </div>
        </div>
      </section>

      {/* PROFISSIONAIS */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Users2 size={14} className="text-indigo-400" /> Equipe & Status
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {professionals.map(p => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 p-5 rounded-[32px] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${p.status === 'available' ? 'bg-emerald-500/10 text-emerald-500' : p.status === 'absent' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    <UserCircle size={22} />
                  </div>
                  <span className="text-xs font-black text-white uppercase">{p.name}</span>
                </div>
                <button onClick={() => onUpdatePros(professionals.filter(x => x.id !== p.id))} className="text-slate-800 hover:text-red-500"><Trash2 size={16}/></button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['available', 'lunch', 'absent'].map(s => (
                  <button key={s} onClick={() => handleUpdateProStatus(p.id, s as ProfStatus)} className={`py-2 rounded-xl text-[7px] font-black uppercase border transition-all ${p.status === s ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                    {s === 'available' ? 'Online' : s === 'lunch' ? 'Pausa' : 'Offline'}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => setIsAddingPro(true)} className="w-full border-2 border-dashed border-slate-800 p-6 rounded-[32px] text-slate-600 uppercase text-[9px] font-black flex items-center justify-center gap-2">
            <Plus size={14}/> Adicionar Profissional
          </button>
        </div>
      </section>

      {/* MODAL MANUAL */}
      {isAddingManual && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md" onClick={() => setIsAddingManual(false)} />
          <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 p-8 rounded-[40px] space-y-6">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Entrada Manual</h3>
            <div className="space-y-4">
              <input placeholder="NOME DO CLIENTE" value={manualName} onChange={e => setManualName(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase" />
              <select value={manualService} onChange={e => setManualService(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase">
                {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <button onClick={() => { if(!manualName) return; onManualJoin({ name: manualName, service: manualService, professionalId: manualPro, type: 'walk-in' }); setManualName(''); setIsAddingManual(false); }} className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black text-[10px] uppercase">Inserir na Fila</button>
          </div>
        </div>
      )}

      {isFinancialModalOpen && <FinancialDetailModal revenue={revenue} onClose={() => setIsFinancialModalOpen(false)} />}
    </div>
  );
};
