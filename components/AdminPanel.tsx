
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Trash2, BarChart3, Users2, UserCircle, Zap, FileText, Store, Monitor, UserPlus, Coffee, DoorClosed, CheckCircle2, Scissors, ListOrdered, Settings, QrCode, BellRing, UserX, Mail, Link as LinkIcon, CheckCircle, Clock, Save, Building2, CalendarDays, ChevronDown, ChevronUp, Maximize2, Minimize2, Play, Moon, Power, ToggleLeft, ToggleRight, Loader2, Gift, Fingerprint, RefreshCcw, Calendar, LayoutList, Sparkles
} from 'lucide-react';
import { Professional, Service, QueueItem, EstStatus, BookingModel, RevenueRecord, PlanType, Establishment, DaySchedule, ProfStatus } from '../types';
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
  onUpdateAccessCode: (newCode: string) => Promise<boolean>;
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
  { id: 1, label: 'Segunda' },
  { id: 2, label: 'Terça' },
  { id: 3, label: 'Quarta' },
  { id: 4, label: 'Quinta' },
  { id: 5, label: 'Sexta' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' }
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  establishment, queue, services, professionals, estStatus, bookingModel, loyaltyEnabled, revenue, pixKey,
  onUpdateEstablishment, onDeleteEstablishment, onUpdateAccessCode, onSetPixKey, onUpdateStatus, onSetBookingModel, onSetLoyaltyEnabled, onCallNext, onFinish, onNoShow, onUpdateServices, onUpdatePros, onManualJoin, onToggleTVMode
}) => {
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [isIdentityExpanded, setIsIdentityExpanded] = useState(false);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);
  const [isServicesExpanded, setIsServicesExpanded] = useState(false);
  const [isStaffExpanded, setIsStaffExpanded] = useState(false);
  const [isLoyaltyExpanded, setIsLoyaltyExpanded] = useState(false);
  const [isFinancialExpanded, setIsFinancialExpanded] = useState(false);
  
  const [tempName, setTempName] = useState(establishment.name);
  const [tempId, setTempId] = useState(establishment.id);
  const [isChangingId, setIsChangingId] = useState(false);
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

  useEffect(() => {
    setTempName(establishment.name);
    setTempId(establishment.id);
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
    }, 800);
  };

  const handleChangeAccessCode = async () => {
    if (!tempId.trim()) return alert("O código de acesso não pode ser vazio.");
    if (tempId.trim().toUpperCase() === establishment.id) return alert("O código é o mesmo atual.");
    setIsChangingId(true);
    const success = await onUpdateAccessCode(tempId.trim().toUpperCase());
    setIsChangingId(false);
  };

  const totalEarnings = useMemo(() => revenue.reduce((acc, curr) => acc + curr.amount, 0), [revenue]);
  const isAutoMode = establishment.autoStatusEnabled || false;

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      
      {/* SEÇÃO DESTAQUE: MODO DE ATENDIMENTO */}
      <section className="bg-slate-900 border border-indigo-500/20 rounded-[40px] p-8 space-y-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center">
             <LayoutList size={20} />
          </div>
          <div>
             <h3 className="text-sm font-black text-white uppercase tracking-tighter">Modo de Funcionamento</h3>
             <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Como os clientes entram na lista</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
           <button onClick={() => onSetBookingModel('queue')} className={`flex flex-col items-center gap-1 py-4 rounded-xl text-[8px] font-black uppercase transition-all ${bookingModel === 'queue' ? 'bg-teal-500 text-slate-950 shadow-lg' : 'text-slate-600'}`}>
              <ListOrdered size={16} className="mb-1" /> Fila
           </button>
           <button onClick={() => onSetBookingModel('appointment')} className={`flex flex-col items-center gap-1 py-4 rounded-xl text-[8px] font-black uppercase transition-all ${bookingModel === 'appointment' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600'}`}>
              <Calendar size={16} className="mb-1" /> Hora
           </button>
           <button onClick={() => onSetBookingModel('both')} className={`flex flex-col items-center gap-1 py-4 rounded-xl text-[8px] font-black uppercase transition-all ${bookingModel === 'both' ? 'bg-slate-100 text-slate-950 shadow-lg' : 'text-slate-600'}`}>
              <Zap size={16} className="mb-1" /> Ambos
           </button>
        </div>
      </section>

      {/* AGENDA DE TRABALHO E AUTOMAÇÃO */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <CalendarDays size={14} className="text-teal-400" /> Agenda & Automação
           </h3>
           <button onClick={() => setIsScheduleExpanded(!isScheduleExpanded)} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-teal-400">
              {isScheduleExpanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
           </button>
        </div>

        {isScheduleExpanded && (
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 space-y-8 shadow-2xl animate-in fade-in">
            
            {/* Status Manual e Automação */}
            <div className="space-y-6">
               <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-xl ${isAutoMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-600'}`}>
                        <Power size={20} />
                     </div>
                     <div>
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Ativação Automática</h4>
                        <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">Abre/Fecha sozinho pelos horários</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => onUpdateEstablishment({ autoStatusEnabled: !isAutoMode })}
                    className={`w-12 h-6 rounded-full relative transition-all ${isAutoMode ? 'bg-indigo-600' : 'bg-slate-800'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAutoMode ? 'left-7' : 'left-1'}`} />
                  </button>
               </div>

               <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1 ml-1">
                     <Settings size={11} className="text-slate-500" />
                     <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Status Forçado (Manual)</label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                     <button onClick={() => onUpdateStatus('open')} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${estStatus === 'open' ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-500'}`}><CheckCircle size={14} /><span className="text-[7px] font-black uppercase">Abrir</span></button>
                     <button onClick={() => onUpdateStatus('lunch')} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${estStatus === 'lunch' ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-500'}`}><Coffee size={14} /><span className="text-[7px] font-black uppercase">Almoço</span></button>
                     <button onClick={() => onUpdateStatus('closed')} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${estStatus === 'closed' ? 'bg-red-500 border-red-400 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-500'}`}><DoorClosed size={14} /><span className="text-[7px] font-black uppercase">Fechar</span></button>
                  </div>
               </div>
            </div>

            {/* Configuração de Horários Diários */}
            <div className="space-y-4 pt-6 border-t border-white/5">
               <div className="flex items-center justify-between px-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Configuração Semanal</span>
                  <button onClick={handleSaveProfile} disabled={isSavingProfile} className="text-[9px] font-black text-teal-400 uppercase tracking-widest flex items-center gap-2 hover:opacity-70">
                    {isSavingProfile ? <Loader2 className="animate-spin" size={12}/> : <Save size={12}/>} Salvar Alterações
                  </button>
               </div>

               <div className="space-y-3">
                  {DAYS_OF_WEEK.map((day) => {
                    const sched = dailySchedules[day.id];
                    return (
                      <div key={day.id} className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">{day.label}</span>
                          <button 
                            onClick={() => updateDaySchedule(day.id, 'isOpen', !sched.isOpen)}
                            className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${sched.isOpen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}
                          >
                            {sched.isOpen ? 'ABERTO' : 'FECHADO'}
                          </button>
                        </div>
                        
                        {sched.isOpen && (
                          <div className="grid grid-cols-2 gap-3 animate-in fade-in">
                            <div className="space-y-1.5">
                               <label className="text-[7px] font-bold text-slate-500 uppercase ml-1">Entrada</label>
                               <input type="time" value={sched.start} onChange={e => updateDaySchedule(day.id, 'start', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-[10px] text-white outline-none focus:border-indigo-500" />
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-[7px] font-bold text-slate-500 uppercase ml-1">Saída</label>
                               <input type="time" value={sched.end} onChange={e => updateDaySchedule(day.id, 'end', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-[10px] text-white outline-none focus:border-indigo-500" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>
        )}
      </section>

      {/* GESTÃO DE SERVIÇOS - RECOLHIMENTO TOTAL */}
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
                 <button onClick={() => { if(confirm("Deseja realmente excluir este serviço?")) onUpdateServices(services.filter(x => x.id !== s.id)) }} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                    <Trash2 size={20}/>
                 </button>
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

      {/* FINANCEIRO */}
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
                <div><p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Total Acumulado</p><h4 className="text-3xl font-black text-white font-orbitron">R$ {totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4></div>
                <button onClick={() => setIsFinancialModalOpen(true)} className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 transition-all"><FileText size={24}/></button>
             </div>
             <div className="pt-6 border-t border-white/5 space-y-3"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Chave PIX</label><input value={pixKey} onChange={(e) => onSetPixKey(e.target.value)} placeholder="Celular, E-mail ou CNPJ" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 px-6 text-white text-xs font-bold outline-none focus:border-emerald-500 transition-all" /></div>
          </div>
        )}
      </section>

      {/* TV */}
      <section className="space-y-4">
        <div className="flex justify-center"><button onClick={onToggleTVMode} className="bg-slate-900 border border-slate-800 py-3 px-8 rounded-[40px] flex items-center gap-2.5 shadow-xl hover:border-teal-500/30 transition-all active:scale-95"><Monitor size={18} className="text-teal-400" /><span className="text-[9px] font-black text-white uppercase tracking-widest">Painel TV</span></button></div>
      </section>

      {isFinancialModalOpen && <FinancialDetailModal revenue={revenue} onClose={() => setIsFinancialModalOpen(false)} />}
    </div>
  );
};
