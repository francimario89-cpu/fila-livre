
import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, BarChart3, Users2, QrCode, UserCircle, Clock, Zap, Gift, Lock, Timer, FileText, Settings2, Rocket, ArrowRight, Share2, Copy, Check
} from 'lucide-react';
import { Professional, Service, QueueItem, EstStatus, BookingModel, RevenueRecord, ProfStatus, PlanType, ServiceRating } from '../types';
import { FinancialDetailModal } from './FinancialDetailModal';

interface AdminPanelProps {
  queue: QueueItem[];
  services: Service[];
  professionals: Professional[];
  estStatus: EstStatus;
  bookingModel: BookingModel;
  plan: PlanType;
  trialStartedAt: number;
  loyaltyEnabled: boolean;
  openingHours?: string;
  revenue: RevenueRecord[];
  ratings?: ServiceRating[];
  pixKey: string;
  establishmentId: string; // Adicionado
  onSetPixKey: (key: string) => void;
  onSetOpeningHours: (hours: string) => void;
  onSetBookingModel: (model: BookingModel) => void;
  onSetLoyaltyEnabled: (enabled: boolean) => void;
  onCallNext: () => void;
  onNoShow: () => void;
  onUpdateStatus: (s: EstStatus) => void;
  onUpdateServices: (s: Service[]) => void;
  onUpdatePros: (p: Professional[]) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  queue, services, professionals, estStatus, bookingModel, plan, trialStartedAt, loyaltyEnabled, revenue, ratings = [], pixKey,
  establishmentId, onSetPixKey, onSetBookingModel, onCallNext, onNoShow, onUpdateStatus, onUpdateServices, onUpdatePros, onSetLoyaltyEnabled
}) => {
  const [newProName, setNewProName] = useState('');
  const [isAddingPro, setIsAddingPro] = useState(false);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [isAddingService, setIsAddingService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('30');

  const trialDaysRemaining = useMemo(() => {
    const fifteenDaysInMs = 15 * 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - trialStartedAt;
    const remaining = Math.ceil((fifteenDaysInMs - elapsed) / (1000 * 60 * 60 * 24));
    return Math.max(0, remaining);
  }, [trialStartedAt]);

  const canAccessProFeatures = plan === 'pro' || trialDaysRemaining > 0;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(establishmentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddPro = () => {
    if (!canAccessProFeatures && professionals.length >= 1) {
      alert("⚠️ Limite Atingido: O Plano Grátis permite apenas 1 profissional.");
      return;
    }
    if (!newProName) return;
    const newPro: Professional = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProName.toUpperCase().trim(),
      status: 'available',
      establishmentId: 'current'
    };
    onUpdatePros([...professionals, newPro]);
    setNewProName('');
    setIsAddingPro(false);
  };

  const handleAddService = () => {
    if (!newServiceName || !newServicePrice) return;
    const newSrv: Service = {
      id: Math.random().toString(36).substr(2, 9),
      name: newServiceName.toUpperCase().trim(),
      price: newServicePrice,
      duration: parseInt(newServiceDuration),
      establishmentId: 'current'
    };
    onUpdateServices([...services, newSrv]);
    setNewServiceName('');
    setNewServicePrice('');
    setIsAddingService(false);
  };

  const totalEarnings = useMemo(() => {
    return revenue.reduce((acc, curr) => acc + curr.amount, 0);
  }, [revenue]);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      
      {/* CARD DO CÓDIGO DA LOJA */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] space-y-4 shadow-xl relative overflow-hidden group">
         <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform">
            <Share2 size={100} />
         </div>
         <div className="space-y-1">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Código da sua Barbebaria</h3>
            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Passe para seus clientes acessarem</p>
         </div>
         <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-950 border border-white/5 py-4 rounded-2xl text-center text-2xl font-black text-teal-400 font-orbitron tracking-widest">
               {establishmentId}
            </div>
            <button 
              onClick={handleCopyCode}
              className={`p-5 rounded-2xl transition-all ${copied ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </button>
         </div>
      </div>

      {/* CONFIGURAÇÃO DE FIDELIDADE */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Gift size={14} className="text-amber-500" /> Programa VIP / Fidelidade
        </h3>
        <button 
          onClick={() => onSetLoyaltyEnabled(!loyaltyEnabled)}
          className={`w-full p-6 rounded-[32px] border-2 flex items-center justify-between transition-all ${loyaltyEnabled ? 'bg-amber-500/10 border-amber-500/30 text-white' : 'bg-slate-900/40 border-slate-800 text-slate-500'}`}
        >
          <div className="flex items-center gap-4 text-left">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${loyaltyEnabled ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-600'}`}>
              <Gift size={24} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-tighter">Cartão Fidelidade</p>
              <p className="text-[9px] font-bold uppercase opacity-60">{loyaltyEnabled ? 'Ativado: Clientes ganham o 10º corte' : 'Desativado: Toque para habilitar'}</p>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full relative transition-all ${loyaltyEnabled ? 'bg-amber-500' : 'bg-slate-800'}`}>
             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${loyaltyEnabled ? 'right-1' : 'left-1'}`} />
          </div>
        </button>
      </section>

      {/* FINANCEIRO */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <BarChart3 size={14} className="text-emerald-500" /> Painel de Faturamento
        </h3>

        {canAccessProFeatures ? (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] relative overflow-hidden space-y-6 shadow-xl">
            <div className="relative z-10">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Faturamento Total</p>
              <h4 className="text-4xl font-black text-white neon-text mt-1">R$ {totalEarnings.toFixed(2)}</h4>
            </div>
            <button onClick={() => setIsFinancialModalOpen(true)} className="w-full bg-slate-950 border border-slate-800 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-900 transition-all">
              <FileText size={16} className="text-emerald-500" /> Ver Detalhes
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 p-10 rounded-[40px] text-center space-y-4">
            <Lock className="mx-auto text-slate-700" size={32} />
            <div className="space-y-2">
              <p className="text-[11px] text-white font-black uppercase tracking-tighter">Financeiro Restrito</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Assine o Plano Pro para acompanhar seus ganhos em tempo real.</p>
            </div>
          </div>
        )}
      </section>

      {/* PROFISSIONAIS */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Users2 size={14} className="text-indigo-400" /> Equipe de Trabalho
          </h3>
        </div>
        
        <div className="space-y-3">
          {professionals.map(p => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 p-5 rounded-[32px] shadow-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400 border border-white/5"><UserCircle size={24} /></div>
                <span className="text-sm font-black text-white uppercase tracking-tighter">{p.name}</span>
              </div>
              <button onClick={() => onUpdatePros(professionals.filter(x => x.id !== p.id))} className="text-red-500/20 hover:text-red-500 p-2 transition-colors"><Trash2 size={16}/></button>
            </div>
          ))}

          {!isAddingPro ? (
            <button 
              onClick={() => setIsAddingPro(true)} 
              className={`w-full border-2 border-dashed p-7 rounded-[32px] uppercase text-[10px] font-black flex items-center justify-center gap-3 transition-all ${(!canAccessProFeatures && professionals.length >= 1) ? 'border-slate-900 text-slate-800 cursor-not-allowed bg-slate-900/10' : 'border-slate-800 text-slate-600 hover:border-indigo-500 hover:text-indigo-400'}`}
            >
              <Plus size={16}/> Adicionar Profissional
            </button>
          ) : (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] space-y-4 animate-in slide-in-from-top-4 shadow-2xl">
              <input autoFocus placeholder="NOME DO PROFISSIONAL" value={newProName} onChange={e => setNewProName(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-xs text-white uppercase font-black outline-none ring-1 ring-white/5" />
              <div className="flex gap-2 pt-2">
                <button onClick={() => setIsAddingPro(false)} className="flex-1 py-4 text-slate-500 font-black text-[10px] uppercase">Cancelar</button>
                <button onClick={handleAddPro} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-indigo-600/20">Confirmar</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SERVIÇOS */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Zap size={14} className="text-teal-400" /> Catálogo de Serviços
        </h3>
        <div className="space-y-3">
          {services.map(s => (
            <div key={s.id} className="bg-slate-900 border border-slate-800 p-4 rounded-[28px] flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-teal-400 border border-white/5"><Clock size={20} /></div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-tighter">{s.name}</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">R$ {s.price} • {s.duration} min</p>
                </div>
              </div>
              <button onClick={() => onUpdateServices(services.filter(x => x.id !== s.id))} className="text-red-500/20 hover:text-red-500 p-3"><Trash2 size={16}/></button>
            </div>
          ))}
          {!isAddingService ? (
            <button onClick={() => setIsAddingService(true)} className="w-full border-2 border-dashed border-slate-800 p-7 rounded-[32px] text-slate-600 uppercase text-[10px] font-black flex items-center justify-center gap-3 hover:border-teal-500 hover:text-teal-400 transition-all">
              <Plus size={16}/> Novo Serviço
            </button>
          ) : (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] space-y-4 animate-in slide-in-from-top-4 shadow-2xl">
              <input autoFocus placeholder="NOME DO SERVIÇO" value={newServiceName} onChange={e => setNewServiceName(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-xs text-white uppercase font-black outline-none ring-1 ring-white/5" />
              <input type="number" placeholder="PREÇO (EX: 30)" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-xs text-white font-black outline-none ring-1 ring-white/5" />
              <div className="flex gap-2 pt-2">
                <button onClick={() => setIsAddingService(false)} className="flex-1 py-4 text-slate-500 font-black text-[10px] uppercase">Cancelar</button>
                <button onClick={handleAddService} className="flex-1 bg-teal-500 text-slate-950 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-teal-500/20">Confirmar</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {isFinancialModalOpen && <FinancialDetailModal revenue={revenue} onClose={() => setIsFinancialModalOpen(false)} />}
    </div>
  );
};
