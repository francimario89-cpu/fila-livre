
import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, BarChart3, Users2, UserCircle, Clock, Zap, Gift, FileText, Store, Save, ToggleLeft, ToggleRight, Monitor, UserPlus, Coffee, DoorClosed, CheckCircle2, UserMinus, Timer, Scissors, Calendar, ListOrdered, Settings, QrCode, DollarSign, BellRing, UserX
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
  onUpdateStatus: (s: EstStatus) => void;
  onSetBookingModel: (model: BookingModel) => void;
  onSetLoyaltyEnabled: (enabled: boolean) => void;
  onCallNext: () => void;
  onNoShow: () => void;
  onUpdateServices: (s: Service[]) => void;
  onUpdatePros: (p: Professional[]) => void;
  onManualJoin: (data: any) => void;
  onToggleTVMode: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  establishment, queue, services, professionals, estStatus, bookingModel, plan, loyaltyEnabled, revenue, pixKey,
  onUpdateEstablishment, onSetPixKey, onUpdateStatus, onSetBookingModel, onSetLoyaltyEnabled, onCallNext, onNoShow, onUpdateServices, onUpdatePros, onManualJoin, onToggleTVMode
}) => {
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [isAddingManual, setIsAddingManual] = useState(false);
  
  const [isAddingService, setIsAddingService] = useState(false);
  const [newSName, setNewSName] = useState('');
  const [newSPrice, setNewSPrice] = useState('');
  const [newSDuration, setNewSDuration] = useState('30');

  const [isAddingPro, setIsAddingPro] = useState(false);
  const [newProName, setNewProName] = useState('');

  const [manualName, setManualName] = useState('');
  const [manualService, setManualService] = useState(services[0]?.name || '');

  const totalEarnings = useMemo(() => revenue.reduce((acc, curr) => acc + curr.amount, 0), [revenue]);
  const serving = useMemo(() => queue.find(i => i.status === 'serving'), [queue]);
  const nextInLine = useMemo(() => queue.find(i => i.status === 'waiting'), [queue]);

  const handleAddService = () => {
    if (!newSName || !newSPrice) return;
    const newService: Service = {
      id: `srv-${Date.now()}`,
      name: newSName.toUpperCase(),
      price: newSPrice,
      duration: parseInt(newSDuration) || 30,
      establishmentId: establishment.id
    };
    onUpdateServices([...services, newService]);
    setNewSName(''); setNewSPrice(''); setNewSDuration('30'); setIsAddingService(false);
  };

  const handleAddProfessional = () => {
    if (!newProName) return;
    const newPro: Professional = {
      id: `pro-${Date.now()}`,
      name: newProName.toUpperCase(),
      status: 'available',
      establishmentId: establishment.id
    };
    onUpdatePros([...professionals, newPro]);
    setNewProName(''); setIsAddingPro(false);
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500">
      
      {/* 1. CONTROLE DE CHAMADA (PRIORIDADE) */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <BellRing size={14} className="text-teal-400" /> Atendimento em Tempo Real
        </h3>
        
        <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-6 shadow-2xl">
          {serving ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                  <UserCircle size={32} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white uppercase leading-none">{serving.name}</h4>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase mt-1.5">{serving.service}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={onNoShow} className="p-4 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                  <UserX size={20} />
                </button>
                <button onClick={onCallNext} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                  Finalizar
                </button>
              </div>
            </div>
          ) : nextInLine ? (
            <div className="flex flex-col items-center py-4 space-y-4">
              <div className="flex flex-col items-center">
                 <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Próximo na Espera</p>
                 <h4 className="text-xl font-black text-white uppercase mt-1">{nextInLine.name}</h4>
              </div>
              <button onClick={onCallNext} className="w-full bg-teal-500 text-slate-950 py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                <Zap size={20} /> Chamar Agora
              </button>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Ninguém aguardando na fila</p>
            </div>
          )}
        </div>
      </section>

      {/* 2. OPERAÇÃO RÁPIDA & TV */}
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
          <button onClick={onToggleTVMode} className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex items-center justify-center gap-3 shadow-xl hover:border-teal-500/30 transition-all active:scale-95">
            <Monitor size={22} className="text-teal-400" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Painel TV</span>
          </button>
          <button onClick={() => setIsAddingManual(true)} className="bg-indigo-600 p-6 rounded-[32px] flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">
            <UserPlus size={22} className="text-white" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Inserir Manual</span>
          </button>
        </div>
      </section>

      {/* 3. FINANCEIRO & PIX */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <BarChart3 size={14} className="text-emerald-500" /> Gestão Financeira
        </h3>
        <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 space-y-8 shadow-2xl">
           <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Total Acumulado</p>
                <h4 className="text-3xl font-black text-white mt-1 font-orbitron">R$ {totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
              </div>
              <button onClick={() => setIsFinancialModalOpen(true)} className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all">
                <FileText size={24} />
              </button>
           </div>
           
           <div className="space-y-3">
             <div className="flex items-center gap-2 ml-1">
                <QrCode size={12} className="text-emerald-500" />
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sua Chave PIX</label>
             </div>
             <input 
                value={pixKey}
                onChange={(e) => onSetPixKey(e.target.value)}
                placeholder="Ex: seuemail@pix.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 px-6 text-white text-xs font-bold outline-none focus:border-emerald-500 transition-all placeholder:text-slate-800"
             />
           </div>
        </div>
      </section>

      {/* 4. GESTÃO DE SERVIÇOS (RESTAURADO) */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Scissors size={14} className="text-indigo-400" /> Serviços Ofertados
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {services.map(s => (
            <div key={s.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex items-center justify-between group shadow-xl">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center">
                    <Scissors size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase">{s.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">R$ {s.price}</span>
                       <span className="w-1 h-1 bg-slate-700 rounded-full" />
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{s.duration} MIN</span>
                    </div>
                  </div>
               </div>
               <button onClick={() => onUpdateServices(services.filter(x => x.id !== s.id))} className="p-2 text-slate-700 hover:text-red-500 transition-colors">
                 <Trash2 size={18} />
               </button>
            </div>
          ))}

          {isAddingService ? (
            <div className="bg-slate-900 border border-indigo-500/30 p-8 rounded-[40px] space-y-4 animate-in slide-in-from-bottom-4">
               <input placeholder="NOME DO SERVIÇO" value={newSName} onChange={e => setNewSName(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none" />
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Preço (R$)</label>
                     <input placeholder="Ex: 25,00" value={newSPrice} onChange={e => setNewSPrice(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Tempo Médio (Min)</label>
                     <input type="number" placeholder="30" value={newSDuration} onChange={e => setNewSDuration(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none" />
                  </div>
               </div>
               <div className="flex gap-2 pt-2">
                 <button onClick={() => setIsAddingService(false)} className="flex-1 py-4 text-[9px] font-black text-slate-500 uppercase">Voltar</button>
                 <button onClick={handleAddService} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl text-[9px] font-black uppercase shadow-lg shadow-indigo-500/20">Salvar Serviço</button>
               </div>
            </div>
          ) : (
            <button onClick={() => setIsAddingService(true)} className="w-full border-2 border-dashed border-slate-800 p-8 rounded-[32px] text-slate-600 hover:text-indigo-400 hover:border-indigo-500/30 transition-all flex flex-col items-center gap-2">
               <Plus size={24} />
               <span className="text-[9px] font-black uppercase tracking-widest">Adicionar Serviço</span>
            </button>
          )}
        </div>
      </section>

      {/* 5. GESTÃO DE PROFISSIONAIS */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Users2 size={14} className="text-indigo-400" /> Equipe de Barbeiros
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {professionals.map(p => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${p.status === 'available' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                  <UserCircle size={24} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase">{p.name}</h4>
                  <p className="text-[8px] text-slate-600 font-bold uppercase">{p.status === 'available' ? 'Ativo' : 'Pausa/Ausente'}</p>
                </div>
              </div>
              <button onClick={() => onUpdatePros(professionals.filter(x => x.id !== p.id))} className="p-2 text-slate-800 hover:text-red-500 transition-colors">
                <Trash2 size={18}/>
              </button>
            </div>
          ))}

          {isAddingPro ? (
            <div className="bg-slate-900 border border-indigo-500/30 p-8 rounded-[40px] space-y-4 animate-in slide-in-from-bottom-4">
               <input placeholder="NOME COMPLETO" value={newProName} onChange={e => setNewProName(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none" />
               <div className="flex gap-2 pt-2">
                 <button onClick={() => setIsAddingPro(false)} className="flex-1 py-4 text-[9px] font-black text-slate-500 uppercase">Voltar</button>
                 <button onClick={handleAddProfessional} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl text-[9px] font-black uppercase shadow-lg shadow-indigo-500/20">Cadastrar</button>
               </div>
            </div>
          ) : (
            <button onClick={() => setIsAddingPro(true)} className="w-full border-2 border-dashed border-slate-800 p-8 rounded-[32px] text-slate-600 hover:text-indigo-400 hover:border-indigo-500/30 transition-all flex flex-col items-center gap-2">
               <Plus size={24} />
               <span className="text-[9px] font-black uppercase tracking-widest">Novo Barbeiro</span>
            </button>
          )}
        </div>
      </section>

      {/* 6. CONFIGURAÇÕES DO SISTEMA */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Settings size={14} className="text-indigo-400" /> Regras do Negócio
        </h3>
        <div className="bg-slate-900 border border-slate-800 rounded-[40px] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-slate-800 space-y-5">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl"><ListOrdered size={18} /></div>
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Fluxo de Atendimento</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'queue', label: 'Só Fila' },
                { id: 'appointment', label: 'Agendar' },
                { id: 'both', label: 'Híbrido' }
              ].map(m => (
                <button 
                  key={m.id} 
                  onClick={() => onSetBookingModel(m.id as BookingModel)}
                  className={`py-3 rounded-xl text-[7px] font-black uppercase border transition-all ${bookingModel === m.id ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-8 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl"><Gift size={18} /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Fidelidade VIP</span>
                  <span className="text-[7px] font-bold text-slate-500 uppercase mt-1.5">{loyaltyEnabled ? 'Ativado' : 'Desativado'}</span>
                </div>
             </div>
             <button 
              onClick={() => onSetLoyaltyEnabled(!loyaltyEnabled)}
              className={`w-16 h-9 rounded-full relative transition-all ${loyaltyEnabled ? 'bg-emerald-500' : 'bg-slate-800'}`}
             >
                <div className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow-lg transition-all ${loyaltyEnabled ? 'left-8' : 'left-1'}`} />
             </button>
          </div>
        </div>
      </section>

      {isAddingManual && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md" onClick={() => setIsAddingManual(false)} />
          <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 p-8 rounded-[40px] space-y-6 shadow-2xl">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Entrada de Balcão</h3>
            <div className="space-y-4">
              <input placeholder="NOME DO CLIENTE" value={manualName} onChange={e => setManualName(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-xs font-bold text-white uppercase outline-none" />
              <select value={manualService} onChange={e => setManualService(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-xs font-bold text-white uppercase outline-none">
                {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <button 
              onClick={() => { if(!manualName) return; onManualJoin({ name: manualName, service: manualService, professionalId: 'any', type: 'walk-in' }); setManualName(''); setIsAddingManual(false); }} 
              className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black text-[10px] uppercase shadow-xl active:scale-95 transition-all"
            >
              Inserir na Fila
            </button>
          </div>
        </div>
      )}

      {isFinancialModalOpen && <FinancialDetailModal revenue={revenue} onClose={() => setIsFinancialModalOpen(false)} />}
    </div>
  );
};
