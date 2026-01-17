
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Trash2, BarChart3, Users2, UserCircle, Zap, FileText, Store, Monitor, UserPlus, Coffee, DoorClosed, CheckCircle2, Scissors, ListOrdered, Settings, QrCode, BellRing, UserX, Mail, Link as LinkIcon, CheckCircle, Clock, Save, Building2, CalendarDays, ChevronDown, ChevronUp, Maximize2, Minimize2, Play, Moon, Power, ToggleLeft, ToggleRight, Loader2, Gift
} from 'lucide-react';
import { Professional, Service, QueueItem, EstStatus, BookingModel, RevenueRecord, PlanType, Establishment, DaySchedule } from '../types';
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
  onFinish: (item: QueueItem) => void;
  onNoShow: (id?: string) => void;
  onUpdateServices: (serviceArray: Service[]) => void;
  onUpdatePros: (professionalArray: Professional[]) => void;
  onManualJoin: (data: any) => void;
  onToggleTVMode: () => void;
}

const DAYS_OF_WEEK = [
  { id: 0, label: 'Domingo' },
  { id: 1, label: 'Segunda' },
  { id: 2, label: 'Terça' },
  { id: 3, label: 'Quarta' },
  { id: 4, label: 'Quinta' },
  { id: 5, label: 'Sexta' },
  { id: 6, label: 'Sábado' }
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  establishment, queue, services, professionals, estStatus, bookingModel, loyaltyEnabled, revenue, pixKey,
  onUpdateEstablishment, onDeleteEstablishment, onSetPixKey, onUpdateStatus, onSetBookingModel, onSetLoyaltyEnabled, onCallNext, onFinish, onNoShow, onUpdateServices, onUpdatePros, onManualJoin, onToggleTVMode
}) => {
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [isAddingManual, setIsAddingManual] = useState(false);
  
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);
  const [isServicesExpanded, setIsServicesExpanded] = useState(false);
  const [isStaffExpanded, setIsStaffExpanded] = useState(false);
  const [isModelExpanded, setIsModelExpanded] = useState(false);
  const [isLoyaltyExpanded, setIsLoyaltyExpanded] = useState(false);
  const [isFinancialExpanded, setIsFinancialExpanded] = useState(false);
  
  const [tempName, setTempName] = useState(establishment.name);
  const [tempReward, setTempReward] = useState(establishment.loyaltyReward || 'Corte Grátis');
  const [dailySchedules, setDailySchedules] = useState<Record<number, DaySchedule>>(
    establishment.dailySchedules || {
      1: { isOpen: true, start: "08:00", end: "18:00", hasLunch: true, lunchStart: "12:00", lunchEnd: "13:00" },
      2: { isOpen: true, start: "08:00", end: "18:00", hasLunch: true, lunchStart: "12:00", lunchEnd: "13:00" },
      3: { isOpen: true, start: "08:00", end: "18:00", hasLunch: true, lunchStart: "12:00", lunchEnd: "13:00" },
      4: { isOpen: true, start: "08:00", end: "18:00", hasLunch: true, lunchStart: "12:00", lunchEnd: "13:00" },
      5: { isOpen: true, start: "08:00", end: "18:00", hasLunch: true, lunchStart: "12:00", lunchEnd: "13:00" },
      6: { isOpen: true, start: "08:00", end: "13:00", hasLunch: false, lunchStart: "12:00", lunchEnd: "13:00" },
      0: { isOpen: false, start: "08:00", end: "12:00", hasLunch: false, lunchStart: "12:00", lunchEnd: "13:00" },
    }
  );

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isAddingService, setIsAddingService] = useState(false);
  const [newSName, setNewSName] = useState('');
  const [newSPrice, setNewSPrice] = useState('');
  const [newSDuration, setNewSDuration] = useState('30');
  
  const [isAddingPro, setIsAddingPro] = useState(false);
  const [newProName, setNewProName] = useState('');
  const [newProEmail, setNewProEmail] = useState('');
  
  const [manualName, setManualName] = useState('');
  const [manualService, setManualService] = useState(services[0]?.name || '');
  const [manualProId, setManualProId] = useState('any');

  useEffect(() => {
    setTempName(establishment.name);
    if (establishment.loyaltyReward) setTempReward(establishment.loyaltyReward);
    if (establishment.dailySchedules) setDailySchedules(establishment.dailySchedules);
  }, [establishment]);

  const updateDaySchedule = (dayId: number, field: keyof DaySchedule, value: any) => {
    setDailySchedules(prev => ({
      ...prev,
      [dayId]: { ...prev[dayId], [field]: value }
    }));
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    await onUpdateEstablishment({ name: tempName, dailySchedules, loyaltyReward: tempReward });
    setTimeout(() => {
      setIsSavingProfile(false);
      setIsScheduleExpanded(false);
    }, 800);
  };

  const totalEarnings = useMemo(() => revenue.reduce((acc, curr) => acc + curr.amount, 0), [revenue]);
  const servingList = useMemo(() => queue.filter(i => i.status === 'serving'), [queue]);
  const nextInLine = useMemo(() => queue.find(i => i.status === 'waiting'), [queue]);

  const isAutoMode = establishment.autoStatusEnabled || false;

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      
      {/* 0. CABEÇALHO & AUTOMAÇÃO */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
           <Store size={14} className="text-teal-400" /> Identidade & Automação
        </h3>
        <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 space-y-6 shadow-2xl">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Unidade</label>
            <input 
              value={tempName} 
              onChange={(e) => setTempName(e.target.value.toUpperCase())} 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-xs font-bold uppercase outline-none focus:border-teal-500 transition-all"
            />
          </div>

          <button 
            onClick={() => onUpdateEstablishment({ autoStatusEnabled: !isAutoMode })}
            className={`w-full py-6 rounded-[32px] border-2 transition-all duration-500 flex flex-col items-center justify-center gap-1 shadow-xl ${
              isAutoMode ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'bg-red-500/10 border-red-500/40 text-red-500'
            }`}
          >
            <div className="flex items-center gap-3">
               {isAutoMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">MODO INTELIGENTE: {isAutoMode ? 'ATIVO' : 'DESLIGADO'}</span>
            </div>
            <p className="text-[7px] font-black uppercase opacity-70">O status muda conforme os horários abaixo</p>
          </button>
        </div>
      </section>

      {/* 1. AGENDA DE TRABALHO */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <CalendarDays size={14} className="text-teal-400" /> Agenda de Trabalho
           </h3>
           <button onClick={() => setIsScheduleExpanded(!isScheduleExpanded)} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-teal-400">
              {isScheduleExpanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
           </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 space-y-6 shadow-2xl">
          {isAutoMode ? (
             <div className="flex items-center gap-4 bg-slate-950 border border-emerald-500/20 p-5 rounded-3xl mb-2">
                <div className="w-10 h-10 bg-emerald-500 text-slate-950 rounded-xl flex items-center justify-center"><CheckCircle2 size={24}/></div>
                <div>
                   <p className="text-[10px] text-white font-black uppercase tracking-widest">Operação Automática</p>
                   <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Status Atual: <span className="text-emerald-400 font-black">{estStatus === 'open' ? 'ABERTO' : estStatus === 'lunch' ? 'PAUSA' : 'FECHADO'}</span></p>
                </div>
             </div>
          ) : (
             <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-3xl mb-2">
                <p className="text-[8px] text-amber-500 font-black uppercase tracking-widest text-center leading-relaxed">
                   Atenção: O Modo Inteligente está desligado. <br/> Ative acima para automatizar o status da loja.
                </p>
             </div>
          )}

          {isScheduleExpanded && (
            <div className="space-y-4 animate-in fade-in duration-300">
               {DAYS_OF_WEEK.map(day => {
                  const sched = dailySchedules[day.id];
                  return (
                    <div key={day.id} className="bg-slate-950 p-5 rounded-[32px] border border-slate-800 space-y-4">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <button onClick={() => updateDaySchedule(day.id, 'isOpen', !sched.isOpen)} className={`w-10 h-6 rounded-full relative transition-all ${sched.isOpen ? 'bg-teal-500' : 'bg-slate-800'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${sched.isOpen ? 'left-5' : 'left-1'}`} />
                             </button>
                             <span className="text-[10px] font-black text-white uppercase">{day.label}</span>
                          </div>
                          {sched.isOpen && (
                             <button onClick={() => updateDaySchedule(day.id, 'hasLunch', !sched.hasLunch)} className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase border ${sched.hasLunch ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                               <Coffee size={10} className="inline mr-1"/> Almoço
                             </button>
                          )}
                       </div>
                       {sched.isOpen && (
                         <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                            <div className="space-y-1"><p className="text-[7px] font-black text-slate-600 uppercase ml-1">Abertura</p><input type="time" value={sched.start} onChange={e => updateDaySchedule(day.id, 'start', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-[10px] text-white outline-none"/></div>
                            <div className="space-y-1"><p className="text-[7px] font-black text-slate-600 uppercase ml-1">Fechamento</p><input type="time" value={sched.end} onChange={e => updateDaySchedule(day.id, 'end', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-[10px] text-white outline-none"/></div>
                            {sched.hasLunch && (
                               <div className="col-span-2 grid grid-cols-2 gap-4 mt-2 p-3 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                                  <div className="space-y-1"><p className="text-[7px] font-black text-amber-600 uppercase ml-1">Início Almoço</p><input type="time" value={sched.lunchStart || "12:00"} onChange={e => updateDaySchedule(day.id, 'lunchStart', e.target.value)} className="w-full bg-slate-900 border border-amber-500/10 rounded-xl py-2 px-3 text-[10px] text-amber-100 outline-none"/></div>
                                  <div className="space-y-1"><p className="text-[7px] font-black text-amber-600 uppercase ml-1">Fim Almoço</p><input type="time" value={sched.lunchEnd || "13:00"} onChange={e => updateDaySchedule(day.id, 'lunchEnd', e.target.value)} className="w-full bg-slate-900 border border-amber-500/10 rounded-xl py-2 px-3 text-[10px] text-amber-100 outline-none"/></div>
                               </div>
                            )}
                         </div>
                       )}
                    </div>
                  );
               })}
               <button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full bg-teal-500 text-slate-950 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                  {isSavingProfile ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Salvar Alterações
               </button>
            </div>
          )}
        </div>
      </section>

      {/* 2. GESTÃO DE SERVIÇOS */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <Scissors size={14} className="text-indigo-400" /> Catálogo de Serviços
           </h3>
           <button onClick={() => setIsServicesExpanded(!isServicesExpanded)} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-indigo-400">
              {isServicesExpanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
           </button>
        </div>

        {isServicesExpanded && (
          <div className="space-y-3 animate-in fade-in">
            {services.map(s => (
              <div key={s.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex items-center justify-between shadow-xl">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center"><Scissors size={20}/></div>
                    <div><h4 className="text-sm font-black text-white uppercase">{s.name}</h4><p className="text-[8px] text-slate-500 font-bold uppercase">R$ {s.price} • {s.duration} min</p></div>
                 </div>
                 <button onClick={() => onUpdateServices(services.filter(x => x.id !== s.id))} className="p-3 text-slate-700 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
              </div>
            ))}
            {isAddingService ? (
              <div className="bg-slate-900 border border-indigo-500/30 p-8 rounded-[40px] space-y-4 shadow-2xl">
                <input placeholder="NOME DO SERVIÇO" value={newSName} onChange={e => setNewSName(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none focus:border-indigo-500" />
                <div className="grid grid-cols-2 gap-4">
                   <input placeholder="PREÇO" value={newSPrice} onChange={e => setNewSPrice(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white outline-none" />
                   <input placeholder="MINUTOS" value={newSDuration} onChange={e => setNewSDuration(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white outline-none" />
                </div>
                <div className="flex gap-2">
                   <button onClick={() => setIsAddingService(false)} className="flex-1 py-4 text-slate-500 text-[10px] font-black uppercase">Cancelar</button>
                   <button onClick={() => { if(!newSName) return; onUpdateServices([...services, { id: `srv-${Date.now()}`, name: newSName, price: newSPrice, duration: Number(newSDuration) || 30, establishmentId: establishment.id }]); setIsAddingService(false); setNewSName(''); }} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase">Cadastrar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsAddingService(true)} className="w-full border-2 border-dashed border-slate-800 p-8 rounded-[32px] text-slate-600 hover:text-indigo-400 hover:border-indigo-500/30 transition-all flex flex-col items-center gap-2">
                <Plus size={24} /><span className="text-[9px] font-black uppercase tracking-widest">Novo Serviço</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* 3. GESTÃO DE EQUIPE */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <Users2 size={14} className="text-amber-400" /> Equipe Profissional
           </h3>
           <button onClick={() => setIsStaffExpanded(!isStaffExpanded)} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-amber-400">
              {isStaffExpanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
           </button>
        </div>

        {isStaffExpanded && (
          <div className="space-y-3 animate-in fade-in">
            {professionals.map(p => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex items-center justify-between shadow-xl">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center"><UserCircle size={24}/></div>
                    <div><h4 className="text-sm font-black text-white uppercase">{p.name}</h4><p className="text-[8px] text-slate-500 font-bold uppercase">{p.email || 'Sem e-mail vinculado'}</p></div>
                 </div>
                 <button onClick={() => onUpdatePros(professionals.filter(x => x.id !== p.id))} className="p-3 text-slate-700 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
              </div>
            ))}
            {isAddingPro ? (
              <div className="bg-slate-900 border border-amber-500/30 p-8 rounded-[40px] space-y-4 shadow-2xl">
                <input placeholder="NOME DO PROFISSIONAL" value={newProName} onChange={e => setNewProName(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none focus:border-amber-500" />
                <input placeholder="E-MAIL DE ACESSO" value={newProEmail} onChange={e => setNewProEmail(e.target.value.toLowerCase())} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white outline-none" />
                <div className="flex gap-2">
                   <button onClick={() => setIsAddingPro(false)} className="flex-1 py-4 text-slate-500 text-[10px] font-black uppercase">Cancelar</button>
                   <button onClick={() => { if(!newProName) return; onUpdatePros([...professionals, { id: `pro-${Date.now()}`, name: newProName, status: 'available', establishmentId: establishment.id, email: newProEmail }]); setIsAddingPro(false); setNewProName(''); }} className="flex-[2] bg-amber-500 text-slate-950 py-4 rounded-2xl font-black text-[10px] uppercase">Cadastrar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsAddingPro(true)} className="w-full border-2 border-dashed border-slate-800 p-8 rounded-[32px] text-slate-600 hover:text-amber-400 hover:border-amber-500/30 transition-all flex flex-col items-center gap-2">
                <Plus size={24} /><span className="text-[9px] font-black uppercase tracking-widest">Novo Profissional</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* 4. FIDELIDADE VIP */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <Gift size={14} className="text-amber-500" /> Fidelidade & Regras
           </h3>
           <button onClick={() => setIsLoyaltyExpanded(!isLoyaltyExpanded)} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-amber-400">
              {isLoyaltyExpanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
           </button>
        </div>

        {isLoyaltyExpanded && (
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 shadow-2xl space-y-6 animate-in fade-in">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center"><Settings size={20}/></div>
                   <div><p className="text-[10px] text-white font-black uppercase tracking-widest">Cartão Fidelidade</p><p className="text-[8px] text-slate-500 font-bold uppercase">{loyaltyEnabled ? 'Ativo' : 'Desativado'}</p></div>
                </div>
                <button onClick={() => onSetLoyaltyEnabled(!loyaltyEnabled)} className={`w-14 h-8 rounded-full relative transition-all ${loyaltyEnabled ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                   <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${loyaltyEnabled ? 'left-7' : 'left-1'}`} />
                </button>
             </div>
             
             {loyaltyEnabled && (
               <div className="space-y-3 animate-in slide-in-from-top-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">O que o cliente ganha ao completar 10 selos?</label>
                  <div className="relative">
                     <input 
                       value={tempReward} 
                       onChange={(e) => setTempReward(e.target.value)} 
                       placeholder="Ex: Corte Grátis, Cerveja, 50% OFF" 
                       className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white text-xs font-bold outline-none focus:border-amber-500 transition-all"
                     />
                     <button onClick={handleSaveProfile} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-amber-500 rounded-xl text-slate-950 hover:scale-105 active:scale-95 transition-all">
                        <Save size={14} />
                     </button>
                  </div>
               </div>
             )}
          </div>
        )}
      </section>

      {/* 5. FINANCEIRO & PIX */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <BarChart3 size={14} className="text-emerald-500" /> Faturamento & PIX
           </h3>
           <button onClick={() => setIsFinancialExpanded(!isFinancialExpanded)} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-emerald-500">
              {isFinancialExpanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
           </button>
        </div>

        {isFinancialExpanded && (
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 space-y-6 shadow-2xl animate-in fade-in">
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Total Acumulado</p>
                   <h4 className="text-3xl font-black text-white font-orbitron">R$ {totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                </div>
                <button onClick={() => setIsFinancialModalOpen(true)} className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20"><FileText size={24}/></button>
             </div>

             <div className="pt-6 border-t border-white/5 space-y-3">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Chave PIX (Para pagamento do cliente)</label>
                <input value={pixKey} onChange={(e) => onSetPixKey(e.target.value)} placeholder="Celular, E-mail ou CNPJ" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 px-6 text-white text-xs font-bold outline-none focus:border-emerald-500 transition-all" />
             </div>
          </div>
        )}
      </section>

      {/* 6. FERRAMENTAS */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Store size={14} className="text-indigo-400" /> Painel & TV
        </h3>
        <div className="grid grid-cols-2 gap-4">
           <button onClick={onToggleTVMode} className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] flex flex-col items-center gap-3 shadow-xl">
              <Monitor size={28} className="text-teal-400" />
              <span className="text-[9px] font-black text-white uppercase tracking-widest">Painel TV</span>
           </button>
           <button onClick={() => setIsAddingManual(true)} className="bg-indigo-600 p-8 rounded-[40px] flex flex-col items-center gap-3 shadow-xl">
              <UserPlus size={28} className="text-white" />
              <span className="text-[9px] font-black text-white uppercase tracking-widest">Manual</span>
           </button>
        </div>
      </section>

      {isAddingManual && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md" onClick={() => setIsAddingManual(false)} />
          <div className="relative w-full max-sm bg-slate-900 border border-white/10 p-8 rounded-[40px] space-y-6 shadow-2xl animate-in zoom-in">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Entrada de Balcão</h3>
            <div className="space-y-4">
              <input placeholder="NOME DO CLIENTE" value={manualName} onChange={e => setManualName(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-xs font-bold text-white uppercase outline-none focus:border-indigo-500" />
              <select value={manualService} onChange={e => setManualService(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-xs font-bold text-white uppercase outline-none">
                 {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <select value={manualProId} onChange={e => setManualProId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-xs font-bold text-white uppercase outline-none">
                 <option value="any">Primeiro Livre</option>
                 {professionals.filter(p => p.status !== 'absent').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <button onClick={() => { if(!manualName) return; onManualJoin({ name: manualName, service: manualService, professionalId: manualProId, type: 'walk-in' }); setManualName(''); setIsAddingManual(false); }} className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center justify-center gap-2"><CheckCircle size={16} /> Confirmar</button>
          </div>
        </div>
      )}

      {isFinancialModalOpen && <FinancialDetailModal revenue={revenue} onClose={() => setIsFinancialModalOpen(false)} />}
    </div>
  );
};
