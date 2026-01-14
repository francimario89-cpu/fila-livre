
import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, BarChart3, Users2, UserCircle, Clock, Zap, Gift, Lock, FileText, Store, Save, ToggleLeft, ToggleRight
} from 'lucide-react';
import { Professional, Service, QueueItem, EstStatus, BookingModel, RevenueRecord, PlanType, Establishment } from '../types';
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
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  establishment, queue, services, professionals, estStatus, bookingModel, plan, loyaltyEnabled, revenue, pixKey,
  onUpdateEstablishment, onDeleteEstablishment, onSetPixKey, onSetBookingModel, onSetLoyaltyEnabled, onCallNext, onNoShow, onUpdateStatus, onUpdateServices, onUpdatePros
}) => {
  const [newProName, setNewProName] = useState('');
  const [isAddingPro, setIsAddingPro] = useState(false);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  
  const [isAddingService, setIsAddingService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('30');

  const [editEstName, setEditEstName] = useState(establishment.name);

  const totalEarnings = useMemo(() => revenue.reduce((acc, curr) => acc + curr.amount, 0), [revenue]);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      
      {/* FINANCEIRO RÁPIDO */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <BarChart3 size={14} className="text-emerald-500" /> Resumo Financeiro
        </h3>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] space-y-4 shadow-xl">
          <div>
            <h4 className="text-4xl font-black text-white neon-text">R$ {totalEarnings.toFixed(2)}</h4>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{revenue.length} Cortes realizados no total</p>
          </div>
          <button onClick={() => setIsFinancialModalOpen(true)} className="w-full bg-slate-950 border border-slate-800 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-300 flex items-center justify-center gap-2">
            <FileText size={16} className="text-emerald-500" /> Ver Relatório Semanal/Mensal
          </button>
        </div>
      </section>

      {/* CONFIGURAÇÃO VIP */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Gift size={14} className="text-amber-500" /> Programa VIP / Fidelidade
        </h3>
        <button 
          onClick={() => onSetLoyaltyEnabled(!loyaltyEnabled)}
          className={`w-full p-6 rounded-[32px] border transition-all flex items-center justify-between ${loyaltyEnabled ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-900 border-slate-800'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${loyaltyEnabled ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
              <Gift size={24} />
            </div>
            <div className="text-left">
              <h4 className={`text-sm font-black uppercase ${loyaltyEnabled ? 'text-white' : 'text-slate-500'}`}>
                {loyaltyEnabled ? 'Programa VIP Ativado' : 'Programa VIP Desativado'}
              </h4>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">
                {loyaltyEnabled ? 'Clientes acumulam cortes automaticamente' : 'Habilite para atrair mais clientes'}
              </p>
            </div>
          </div>
          {loyaltyEnabled ? <ToggleRight size={32} className="text-amber-500" /> : <ToggleLeft size={32} className="text-slate-700" />}
        </button>
      </section>

      {/* PROFISSIONAIS */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Users2 size={14} className="text-indigo-400" /> Profissionais
        </h3>
        <div className="space-y-3">
          {professionals.map(p => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 p-5 rounded-[32px] flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400"><UserCircle size={24} /></div>
                <span className="text-sm font-black text-white uppercase">{p.name}</span>
              </div>
              <button onClick={() => onUpdatePros(professionals.filter(x => x.id !== p.id))} className="text-red-500/20 hover:text-red-500 p-2"><Trash2 size={16}/></button>
            </div>
          ))}
          {!isAddingPro ? (
            <button onClick={() => setIsAddingPro(true)} className="w-full border-2 border-dashed border-slate-800 p-7 rounded-[32px] text-slate-600 uppercase text-[10px] font-black flex items-center justify-center gap-3">
              <Plus size={16}/> Adicionar Profissional
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

      {/* SERVIÇOS */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Zap size={14} className="text-teal-400" /> Serviços
        </h3>
        <div className="space-y-3">
          {services.map(s => (
            <div key={s.id} className="bg-slate-900 border border-slate-800 p-4 rounded-[28px] flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-teal-400"><Clock size={20} /></div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase">{s.name}</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">R$ {s.price} • {s.duration} min</p>
                </div>
              </div>
              <button onClick={() => onUpdateServices(services.filter(x => x.id !== s.id))} className="text-red-500/20 hover:text-red-500 p-3"><Trash2 size={16}/></button>
            </div>
          ))}
          {!isAddingService ? (
            <button onClick={() => setIsAddingService(true)} className="w-full border-2 border-dashed border-slate-800 p-7 rounded-[32px] text-slate-600 uppercase text-[10px] font-black flex items-center justify-center gap-3">
              <Plus size={16}/> Novo Serviço
            </button>
          ) : (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] space-y-4 animate-in slide-in-from-top-4">
              <input autoFocus placeholder="EX: CORTE SOCIAL" value={newServiceName} onChange={e => setNewServiceName(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-xs text-white font-black" />
              <input type="number" placeholder="VALOR (EX: 30)" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-xs text-white font-black" />
              <div className="flex gap-2">
                <button onClick={() => setIsAddingService(false)} className="flex-1 py-4 text-slate-500 font-black text-[10px] uppercase">Cancelar</button>
                <button onClick={() => { if(newServiceName && newServicePrice) { onUpdateServices([...services, {id: Math.random().toString(36).substr(2, 9), name: newServiceName, price: newServicePrice, duration: parseInt(newServiceDuration), establishmentId: establishment.id}]); setIsAddingService(false); setNewServiceName(''); setNewServicePrice(''); } }} className="flex-1 bg-teal-500 text-slate-950 py-4 rounded-2xl font-black text-[10px] uppercase">Salvar</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CONFIGURAÇÕES */}
      <section className="space-y-4 pt-10">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Store size={14} className="text-indigo-400" /> Dados da Unidade
        </h3>
        <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Nome da Barbearia/Salão</label>
            <div className="flex gap-2">
              <input value={editEstName} onChange={e => setEditEstName(e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-xs text-white font-bold uppercase focus:border-indigo-500" />
              <button onClick={() => onUpdateEstablishment({ name: editEstName.toUpperCase() })} className="bg-indigo-600 text-white p-4 rounded-2xl"><Save size={18} /></button>
            </div>
          </div>
          <button onClick={onDeleteEstablishment} className="w-full bg-red-500/10 border border-red-500/20 text-red-500 py-5 rounded-2xl text-[10px] font-black uppercase">Excluir Unidade Permanentemente</button>
        </div>
      </section>

      {isFinancialModalOpen && <FinancialDetailModal revenue={revenue} onClose={() => setIsFinancialModalOpen(false)} />}
    </div>
  );
};
