
import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, BarChart3, Users2, QrCode, UserCircle, Clock, Zap, Gift, Lock, Timer, FileText, Settings2, Rocket, ArrowRight, Store, AlertTriangle, Save
} from 'lucide-react';
import { Professional, Service, QueueItem, EstStatus, BookingModel, RevenueRecord, ProfStatus, PlanType, ServiceRating, Establishment } from '../types';
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
  openingHours?: string;
  revenue: RevenueRecord[];
  ratings?: ServiceRating[];
  pixKey: string;
  onUpdateEstablishment: (data: Partial<Establishment>) => void;
  onDeleteEstablishment: () => void;
  onSetPixKey: (key: string) => void;
  onSetOpeningHours?: (hours: string) => void;
  onSetBookingModel: (model: BookingModel) => void;
  onSetLoyaltyEnabled: (enabled: boolean) => void;
  onCallNext: () => void;
  onNoShow: () => void;
  onUpdateStatus: (s: EstStatus) => void;
  onUpdateServices: (s: Service[]) => void;
  onUpdatePros: (p: Professional[]) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  establishment, queue, services, professionals, estStatus, bookingModel, plan, trialStartedAt, loyaltyEnabled, revenue, ratings = [], pixKey,
  onUpdateEstablishment, onDeleteEstablishment, onSetPixKey, onSetBookingModel, onCallNext, onNoShow, onUpdateStatus, onUpdateServices, onUpdatePros
}) => {
  const [newProName, setNewProName] = useState('');
  const [isAddingPro, setIsAddingPro] = useState(false);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  
  const [isAddingService, setIsAddingService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('30');

  const [editEstName, setEditEstName] = useState(establishment.name);
  const [isSavingEst, setIsSavingEst] = useState(false);

  const trialDaysRemaining = useMemo(() => {
    const fifteenDaysInMs = 15 * 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - trialStartedAt;
    const remaining = Math.ceil((fifteenDaysInMs - elapsed) / (1000 * 60 * 60 * 24));
    return Math.max(0, remaining);
  }, [trialStartedAt]);

  const isTrialActive = trialDaysRemaining > 0;
  const canAccessProFeatures = plan === 'pro' || isTrialActive;

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
      establishmentId: establishment.id
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
      establishmentId: establishment.id
    };
    onUpdateServices([...services, newSrv]);
    setNewServiceName('');
    setNewServicePrice('');
    setIsAddingService(false);
  };

  const handleSaveEstSettings = async () => {
    setIsSavingEst(true);
    await onUpdateEstablishment({ name: editEstName.toUpperCase() });
    setIsSavingEst(false);
    alert("Nome da empresa atualizado!");
  };

  const totalEarnings = useMemo(() => {
    return revenue.reduce((acc, curr) => acc + curr.amount, 0);
  }, [revenue]);

  const showTutorial = professionals.length === 0 && services.length === 0;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      
      {showTutorial && (
        <div className="bg-teal-500/10 border-2 border-dashed border-teal-500/30 p-8 rounded-[40px] space-y-6 animate-pulse-slow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/20">
              <Rocket size={24} />
            </div>
            <div>
              <h3 className="text-white font-black text-sm uppercase tracking-tighter">Guia de Teste Rápido</h3>
              <p className="text-[9px] text-teal-400 font-bold uppercase">Siga os passos abaixo para configurar</p>
            </div>
          </div>
        </div>
      )}

      {/* BANNER DE PLANO / TRIAL */}
      <div className={`p-5 rounded-[28px] border-2 flex items-center justify-between ${canAccessProFeatures ? 'bg-indigo-500/10 border-indigo-500/20 shadow-lg shadow-indigo-500/5' : 'bg-slate-900 border-slate-800'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${canAccessProFeatures ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
            <Gift size={24} />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest">
              {plan === 'pro' ? 'Assinatura Pro Ativa' : 'Degustação Plano Pro'}
            </h4>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">
              {plan === 'pro' ? 'Recursos ilimitados liberados' : `${trialDaysRemaining} dias restantes de acesso total`}
            </p>
          </div>
        </div>
        {plan !== 'pro' && (
          <button className="bg-indigo-600 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase text-white shadow-xl shadow-indigo-600/30">Upgrade</button>
        )}
      </div>

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
            <div key={p.id} className="bg-slate-900 border border-slate-800 p-5 rounded-[32px] space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400 border border-white/5"><UserCircle size={24} /></div>
                  <span className="text-sm font-black text-white uppercase tracking-tighter">{p.name}</span>
                </div>
                <button onClick={() => onUpdatePros(professionals.filter(x => x.id !== p.id))} className="text-red-500/20 hover:text-red-500 p-2 transition-colors"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
          {!isAddingPro ? (
            <button onClick={() => setIsAddingPro(true)} className="w-full border-2 border-dashed border-slate-800 p-7 rounded-[32px] text-slate-600 uppercase text-[10px] font-black flex items-center justify-center gap-3 hover:border-indigo-500 hover:text-indigo-400 transition-all">
              <Plus size={16}/> Adicionar Profissional
            </button>
          ) : (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] space-y-4 shadow-2xl animate-in slide-in-from-top-4">
              <input autoFocus placeholder="NOME DO PROFISSIONAL" value={newProName} onChange={e => setNewProName(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-xs text-white uppercase font-black outline-none ring-1 ring-white/5" />
              <div className="flex gap-2">
                <button onClick={() => setIsAddingPro(false)} className="flex-1 py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                <button onClick={handleAddPro} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20">Confirmar</button>
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
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] space-y-4 shadow-2xl animate-in slide-in-from-top-4">
              <input autoFocus placeholder="NOME DO SERVIÇO" value={newServiceName} onChange={e => setNewServiceName(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-xs text-white uppercase font-black outline-none ring-1 ring-white/5" />
              <input type="number" placeholder="PREÇO (EX: 30)" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-xs text-white font-black outline-none ring-1 ring-white/5" />
              <div className="flex gap-2">
                <button onClick={() => setIsAddingService(false)} className="flex-1 py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
                <button onClick={handleAddService} className="flex-1 bg-teal-500 text-slate-950 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-teal-500/20">Confirmar</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* AJUSTES DA UNIDADE */}
      <section className="space-y-4 pt-10">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Store size={14} className="text-indigo-400" /> Ajustes da Unidade
        </h3>
        <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 space-y-6 shadow-2xl">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Empresa</label>
            <div className="flex gap-2">
              <input 
                value={editEstName} 
                onChange={e => setEditEstName(e.target.value)} 
                className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-xs text-white font-bold uppercase outline-none focus:border-indigo-500" 
              />
              <button 
                onClick={handleSaveEstSettings}
                disabled={isSavingEst}
                className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
              >
                <Save size={18} />
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Código de Acesso (ID)</label>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-xs text-slate-500 font-mono flex items-center justify-between">
              {establishment.id}
              <Lock size={12} className="opacity-30" />
            </div>
            <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Este código é único e não pode ser alterado após criado.</p>
          </div>

          <div className="pt-6 border-t border-white/5 space-y-4">
             <div className="flex items-center gap-3 text-red-500/50">
                <AlertTriangle size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest">Zona de Perigo</span>
             </div>
             <button 
              onClick={onDeleteEstablishment}
              className="w-full bg-red-500/10 border border-red-500/20 text-red-500 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/5"
             >
                Excluir Unidade Permanentemente
             </button>
          </div>
        </div>
      </section>

      {isFinancialModalOpen && <FinancialDetailModal revenue={revenue} onClose={() => setIsFinancialModalOpen(false)} />}
    </div>
  );
};
