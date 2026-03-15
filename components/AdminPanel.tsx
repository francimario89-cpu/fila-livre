
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Trash2, BarChart3, Users2, UserCircle, Zap, FileText, Store, Monitor, UserPlus, Coffee, DoorClosed, CheckCircle2, Scissors, ListOrdered, Settings, QrCode, BellRing, UserX, Mail, Link as LinkIcon, CheckCircle, Clock, Save, Building2, CalendarDays, ChevronDown, ChevronUp, Maximize2, Minimize2, Play, Moon, Power, ToggleLeft, ToggleRight, Loader2, Gift, Fingerprint, RefreshCcw, Calendar, LayoutList, Sparkles, HelpCircle, ToggleRight as ToggleActive
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
  theme?: 'dark' | 'light';
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
  establishment, queue, services, professionals, estStatus, bookingModel, loyaltyEnabled, revenue, pixKey, theme = 'dark',
  onUpdateEstablishment, onDeleteEstablishment, onUpdateAccessCode, onSetPixKey, onUpdateStatus, onSetBookingModel, onSetLoyaltyEnabled, onCallNext, onFinish, onNoShow, onUpdateServices, onUpdatePros, onManualJoin, onToggleTVMode
}) => {
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [isIdentityExpanded, setIsIdentityExpanded] = useState(false);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);
  const [isServicesExpanded, setIsServicesExpanded] = useState(false);
  const [isStaffExpanded, setIsStaffExpanded] = useState(false);
  const [isLoyaltyExpanded, setIsLoyaltyExpanded] = useState(false);
  const [isFinancialExpanded, setIsFinancialExpanded] = useState(false);
  const [isPreferenceExpanded, setIsPreferenceExpanded] = useState(false);
  
  const [tempName, setTempName] = useState(establishment.name);
  const [tempId, setTempId] = useState(establishment.id);
  const [isChangingId, setIsChangingId] = useState(false);
  const [tempReward, setTempReward] = useState(establishment.loyaltyReward || 'Corte Grátis');
  const [tempAnyLabel, setTempAnyLabel] = useState(establishment.anyProfessionalLabel || 'Qualquer Atendente');
  const [tempPrefix, setTempPrefix] = useState(establishment.codePrefix || 'A');
  const [tempNextNum, setTempNextNum] = useState(establishment.nextCodeNumber?.toString() || '1');
  
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

  const isLight = theme === 'light';

  useEffect(() => {
    setTempName(establishment.name);
    setTempId(establishment.id);
    if (establishment.loyaltyReward) setTempReward(establishment.loyaltyReward);
    if (establishment.dailySchedules) setDailySchedules(establishment.dailySchedules);
    if (establishment.anyProfessionalLabel) setTempAnyLabel(establishment.anyProfessionalLabel);
    if (establishment.codePrefix) setTempPrefix(establishment.codePrefix);
    if (establishment.nextCodeNumber) setTempNextNum(establishment.nextCodeNumber.toString());
  }, [establishment]);

  const updateDaySchedule = (dayId: number, field: keyof DaySchedule, value: any) => {
    setDailySchedules(prev => ({
      ...prev,
      [dayId]: { ...prev[dayId], [field]: value }
    }));
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    await onUpdateEstablishment({ 
      name: tempName, 
      dailySchedules, 
      loyaltyReward: tempReward,
      anyProfessionalLabel: tempAnyLabel,
      codePrefix: tempPrefix,
      nextCodeNumber: parseInt(tempNextNum) || 1
    });
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
  const isAnyProEnabled = establishment.anyProfessionalEnabled ?? true;

  const sectionClass = `rounded-[40px] p-8 space-y-6 shadow-2xl transition-colors duration-300 border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-indigo-500/20'}`;
  const inputClass = `w-full border rounded-2xl p-4 text-xs font-bold uppercase outline-none focus:border-teal-500 transition-all ${isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'}`;
  const labelClass = `text-[9px] font-black uppercase tracking-widest ml-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`;

  return (
    <div className={`space-y-8 pb-32 animate-in fade-in duration-500 ${isLight ? 'text-slate-900' : ''}`}>
      
      {/* MODO DE ATENDIMENTO */}
      <section className={sectionClass}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center">
             <LayoutList size={20} />
          </div>
          <div>
             <h3 className={`text-sm font-black uppercase tracking-tighter ${isLight ? 'text-slate-900' : 'text-white'}`}>Modo de Funcionamento</h3>
             <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Configuração de entrada de clientes</p>
          </div>
        </div>

        <div className={`grid grid-cols-3 gap-2 p-1.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-slate-950 border-slate-800'}`}>
           <button onClick={() => onSetBookingModel('queue')} className={`flex flex-col items-center gap-1 py-4 rounded-xl text-[8px] font-black uppercase transition-all ${bookingModel === 'queue' ? (isLight ? 'bg-teal-500 text-slate-900' : 'bg-teal-500 text-slate-950 shadow-lg') : 'text-slate-400'}`}>
              <ListOrdered size={16} className="mb-1" /> Fila
           </button>
           <button onClick={() => onSetBookingModel('appointment')} className={`flex flex-col items-center gap-1 py-4 rounded-xl text-[8px] font-black uppercase transition-all ${bookingModel === 'appointment' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
              <Calendar size={16} className="mb-1" /> Hora
           </button>
           <button onClick={() => onSetBookingModel('both')} className={`flex flex-col items-center gap-1 py-4 rounded-xl text-[8px] font-black uppercase transition-all ${bookingModel === 'both' ? (isLight ? 'bg-slate-300 text-slate-900' : 'bg-slate-100 text-slate-950 shadow-lg') : 'text-slate-400'}`}>
              <Zap size={16} className="mb-1" /> Ambos
           </button>
        </div>
      </section>

      {/* PREFERÊNCIA DE ATENDIMENTO */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <HelpCircle size={14} className="text-teal-400" /> Preferência de Atendimento
           </h3>
           <button onClick={() => setIsPreferenceExpanded(!isPreferenceExpanded)} className={`p-2 border rounded-xl text-teal-400 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
              {isPreferenceExpanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
           </button>
        </div>

        {isPreferenceExpanded && (
          <div className={sectionClass}>
             <div className={`flex items-center justify-between p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-slate-950 border-white/5'}`}>
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-xl ${isAnyProEnabled ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-800 text-slate-600'}`}>
                      <Users2 size={20} />
                   </div>
                   <div>
                      <h4 className={`text-[10px] font-black uppercase tracking-widest ${isLight ? 'text-slate-900' : 'text-white'}`}>Opção "Qualquer um"</h4>
                      <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">Ativar botão de triagem geral na fila</p>
                   </div>
                </div>
                <button 
                  onClick={() => onUpdateEstablishment({ anyProfessionalEnabled: !isAnyProEnabled })}
                  className={`w-12 h-6 rounded-full relative transition-all ${isAnyProEnabled ? 'bg-teal-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAnyProEnabled ? 'left-7' : 'left-1'}`} />
                </button>
             </div>

             {isAnyProEnabled && (
               <div className="space-y-4 animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className={labelClass}>Nome para o botão "Qualquer um"</label>
                    <input 
                      value={tempAnyLabel} 
                      onChange={(e) => setTempAnyLabel(e.target.value.toUpperCase())} 
                      placeholder="EX: QUALQUER ATENDENTE / TRIAGEM" 
                      className={inputClass} 
                    />
                  </div>
                  <button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full bg-teal-500 text-slate-950 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95">
                     {isSavingProfile ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} Salvar Nome do Botão
                  </button>
               </div>
             )}
          </div>
        )}
      </section>

      {/* IDENTIDADE DA UNIDADE */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <Store size={14} className="text-teal-400" /> Identidade da Unidade
           </h3>
           <button onClick={() => setIsIdentityExpanded(!isIdentityExpanded)} className={`p-2 border rounded-xl text-teal-400 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
              {isIdentityExpanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
           </button>
        </div>

        {isIdentityExpanded && (
          <div className={sectionClass}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className={labelClass}>Nome Comercial</label>
                <div className="flex gap-2">
                  <input value={tempName} onChange={(e) => setTempName(e.target.value.toUpperCase())} className={inputClass} />
                  <button onClick={handleSaveProfile} disabled={isSavingProfile} className="px-6 bg-teal-500 text-slate-950 rounded-2xl text-[9px] font-black uppercase flex items-center gap-2 transition-all shadow-lg active:scale-95">
                    {isSavingProfile ? <Loader2 size={14} className="animate-spin"/> : <Save size={14} />} Salvar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-500/10">
                <div className="space-y-2">
                   <label className={labelClass}>Prefixo das Senhas</label>
                   <input value={tempPrefix} onChange={(e) => setTempPrefix(e.target.value.toUpperCase().slice(0, 2))} placeholder="EX: A, P, B" className={inputClass} />
                </div>
                <div className="space-y-2">
                   <label className={labelClass}>Próximo Número</label>
                   <input type="number" value={tempNextNum} onChange={(e) => setTempNextNum(e.target.value)} className={inputClass} />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <Fingerprint size={12} className="text-teal-500" />
                  <label className={labelClass}>Código de Acesso (ID)</label>
                </div>
                <div className="flex gap-2">
                  <input value={tempId} onChange={(e) => setTempId(e.target.value.toUpperCase().replace(/\s/g, ''))} className={`${inputClass} font-orbitron`} />
                  <button onClick={handleChangeAccessCode} disabled={isChangingId || tempId.toUpperCase() === establishment.id} className="px-6 bg-indigo-600 text-white rounded-2xl text-[9px] font-black uppercase disabled:opacity-30 flex items-center gap-2 transition-all shadow-lg active:scale-95">
                    {isChangingId ? <Loader2 size={14} className="animate-spin"/> : <RefreshCcw size={14} />} Trocar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* AGENDA & STATUS DA LOJA */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <CalendarDays size={14} className="text-teal-400" /> Agenda & Status
           </h3>
           <button onClick={() => setIsScheduleExpanded(!isScheduleExpanded)} className={`p-2 border rounded-xl text-teal-400 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
              {isScheduleExpanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
           </button>
        </div>

        {isScheduleExpanded && (
          <div className={sectionClass}>
            <div className="space-y-6">
               <div className={`flex items-center justify-between p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-slate-950 border-white/5'}`}>
                  <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-xl ${isAutoMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-300 text-slate-500'}`}>
                        <Power size={20} />
                     </div>
                     <div>
                        <h4 className={`text-[10px] font-black uppercase tracking-widest ${isLight ? 'text-slate-900' : 'text-white'}`}>Modo Automático</h4>
                        <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">Abre/Fecha sozinho conforme horário</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => onUpdateEstablishment({ autoStatusEnabled: !isAutoMode })}
                    className={`w-12 h-6 rounded-full relative transition-all ${isAutoMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAutoMode ? 'left-7' : 'left-1'}`} />
                  </button>
               </div>

               <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1 ml-1">
                     <Settings size={11} className="text-slate-500" />
                     <label className={labelClass}>Controle Manual</label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                     <button onClick={() => onUpdateStatus('open')} className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${estStatus === 'open' ? 'bg-emerald-500 border-emerald-400 text-slate-950' : (isLight ? 'bg-white border-slate-100 text-slate-400' : 'bg-slate-950 border-slate-800 text-slate-500')}`}><CheckCircle size={14} /><span className="text-[7px] font-black uppercase">Abrir</span></button>
                     <button onClick={() => onUpdateStatus('lunch')} className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${estStatus === 'lunch' ? 'bg-amber-500 border-amber-400 text-slate-950' : (isLight ? 'bg-white border-slate-100 text-slate-400' : 'bg-slate-950 border-slate-800 text-slate-500')}`}><Coffee size={14} /><span className="text-[7px] font-black uppercase">Almoço</span></button>
                     <button onClick={() => onUpdateStatus('closed')} className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${estStatus === 'closed' ? 'bg-red-500 border-red-400 text-white' : (isLight ? 'bg-white border-slate-100 text-slate-400' : 'bg-slate-950 border-slate-800 text-slate-500')}`}><DoorClosed size={14} /><span className="text-[7px] font-black uppercase">Fechar</span></button>
                  </div>
               </div>
            </div>

            <div className={`space-y-4 pt-6 border-t ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
               <div className="flex items-center justify-between px-1">
                  <span className={labelClass}>Configuração de Horários</span>
                  <button onClick={handleSaveProfile} disabled={isSavingProfile} className="text-[9px] font-black text-teal-400 uppercase tracking-widest flex items-center gap-2 hover:opacity-70">
                    {isSavingProfile ? <Loader2 className="animate-spin" size={12}/> : <Save size={12}/>} Salvar Horários
                  </button>
               </div>

               <div className="space-y-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const sched = dailySchedules[day.id];
                    return (
                      <div key={day.id} className={`p-3 rounded-2xl border flex items-center justify-between ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-slate-950/50 border-white/5'}`}>
                        <span className={`text-[9px] font-black uppercase tracking-widest w-20 ${isLight ? 'text-slate-900' : 'text-white'}`}>{day.label}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateDaySchedule(day.id, 'isOpen', !sched.isOpen)} className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase ${sched.isOpen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                            {sched.isOpen ? 'Aberto' : 'Fechado'}
                          </button>
                          {sched.isOpen && (
                            <div className="flex items-center gap-1">
                               <input type="time" value={sched.start} onChange={e => updateDaySchedule(day.id, 'start', e.target.value)} className={`border rounded-lg p-1 text-[8px] outline-none ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`} />
                               <span className="text-slate-600 text-[8px]">-</span>
                               <input type="time" value={sched.end} onChange={e => updateDaySchedule(day.id, 'end', e.target.value)} className={`border rounded-lg p-1 text-[8px] outline-none ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'}`} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>
        )}
      </section>

      {/* CLUBE VIP / FIDELIDADE */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <Gift size={14} className="text-amber-500" /> Clube VIP / Fidelidade
           </h3>
           <button onClick={() => setIsLoyaltyExpanded(!isLoyaltyExpanded)} className={`p-2 border rounded-xl text-amber-500 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
              {isLoyaltyExpanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
           </button>
        </div>

        {isLoyaltyExpanded && (
          <div className={sectionClass}>
             <div className={`flex items-center justify-between p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-slate-950 border-white/5'}`}>
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-xl ${loyaltyEnabled ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-300 text-slate-500'}`}>
                      <Gift size={20} />
                   </div>
                   <div>
                      <h4 className={`text-[10px] font-black uppercase tracking-widest ${isLight ? 'text-slate-900' : 'text-white'}`}>Programa Fidelidade</h4>
                      <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">Ativar cartão virtual de 10 selos</p>
                   </div>
                </div>
                <button 
                  onClick={() => onSetLoyaltyEnabled(!loyaltyEnabled)}
                  className={`w-12 h-6 rounded-full relative transition-all ${loyaltyEnabled ? 'bg-amber-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${loyaltyEnabled ? 'left-7' : 'left-1'}`} />
                </button>
             </div>

             {loyaltyEnabled && (
               <div className="space-y-4 animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className={labelClass}>O que o cliente ganha ao completar 10 selos?</label>
                    <input value={tempReward} onChange={(e) => setTempReward(e.target.value.toUpperCase())} placeholder="EX: UM CORTE GRÁTIS" className={inputClass} />
                  </div>
                  <button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full bg-amber-500 text-slate-950 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95">
                     {isSavingProfile ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} Salvar Recompensa
                  </button>
               </div>
             )}
          </div>
        )}
      </section>

      {/* EQUIPE PROFISSIONAL */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <Users2 size={14} className="text-amber-400" /> Equipe de Trabalho
           </h3>
           <button onClick={() => setIsStaffExpanded(!isStaffExpanded)} className={`p-2 border rounded-xl text-amber-400 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
              {isStaffExpanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
           </button>
        </div>

        {isStaffExpanded && (
          <div className="space-y-3 animate-in fade-in">
            {professionals.map(p => (
              <div key={p.id} className={`p-5 rounded-[32px] shadow-xl flex items-center justify-between border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center"><UserCircle size={20}/></div>
                    <div><h4 className={`text-xs font-black uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>{p.name}</h4><p className="text-[7px] text-slate-500 font-bold uppercase">{p.email}</p></div>
                 </div>
                 <button onClick={() => { if(confirm("Remover este profissional?")) onUpdatePros(professionals.filter(x => x.id !== p.id)) }} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                    <Trash2 size={16}/>
                 </button>
              </div>
            ))}
            {isAddingPro ? (
              <div className={sectionClass}>
                <input placeholder="NOME DO PROFISSIONAL" value={newProName} onChange={e => setNewProName(e.target.value.toUpperCase())} className={inputClass} />
                <input placeholder="E-MAIL (OPCIONAL)" value={newProEmail} onChange={e => setNewProEmail(e.target.value.toLowerCase())} className={inputClass.replace('uppercase', '')} />
                <div className="flex gap-2">
                   <button onClick={() => setIsAddingPro(false)} className="flex-1 py-4 text-slate-500 text-[10px] font-black uppercase">Cancelar</button>
                   <button onClick={() => { if(!newProName) return; onUpdatePros([...professionals, { id: `pro-${Date.now()}`, name: newProName, status: 'available', establishmentId: establishment.id, email: newProEmail }]); setIsAddingPro(false); setNewProName(''); }} className="flex-[2] bg-amber-500 text-slate-950 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg">Cadastrar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsAddingPro(true)} className={`w-full border-2 border-dashed p-8 rounded-[32px] transition-all flex flex-col items-center gap-2 ${isLight ? 'bg-white border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-500/30' : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-amber-400 hover:border-amber-500/30'}`}>
                <Plus size={24} /><span className="text-[9px] font-black uppercase tracking-widest">Novo Profissional</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* CATÁLOGO DE SERVIÇOS */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <Scissors size={14} className="text-indigo-400" /> Catálogo de Serviços
           </h3>
           <button onClick={() => setIsServicesExpanded(!isServicesExpanded)} className={`p-2 border rounded-xl text-indigo-400 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
              {isServicesExpanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
           </button>
        </div>

        {isServicesExpanded && (
          <div className="space-y-3 animate-in fade-in">
            {services.map(s => (
              <div key={s.id} className={`p-6 rounded-[32px] flex items-center justify-between shadow-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center"><Scissors size={18}/></div>
                    <div><h4 className={`text-xs font-black uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>{s.name}</h4><p className="text-[7px] text-slate-500 font-bold uppercase">R$ {s.price} • {s.duration} min</p></div>
                 </div>
                 <button onClick={() => { if(confirm("Remover este serviço?")) onUpdateServices(services.filter(x => x.id !== s.id)) }} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                    <Trash2 size={16}/>
                 </button>
              </div>
            ))}
            {isAddingService ? (
              <div className={sectionClass}>
                <input placeholder="NOME DO SERVIÇO" value={newSName} onChange={e => setNewSName(e.target.value.toUpperCase())} className={inputClass} />
                <div className="grid grid-cols-2 gap-4">
                   <input placeholder="PREÇO" value={newSPrice} onChange={e => setNewSPrice(e.target.value)} className={inputClass} />
                   <input placeholder="MINUTOS" value={newSDuration} onChange={e => setNewSDuration(e.target.value)} className={inputClass} />
                </div>
                <div className="flex gap-2">
                   <button onClick={() => setIsAddingService(false)} className="flex-1 py-4 text-slate-500 text-[10px] font-black uppercase">Cancelar</button>
                   <button onClick={() => { if(!newSName) return; onUpdateServices([...services, { id: `srv-${Date.now()}`, name: newSName, price: newSPrice, duration: Number(newSDuration) || 30, establishmentId: establishment.id }]); setIsAddingService(false); setNewSName(''); }} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg">Cadastrar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsAddingService(true)} className={`w-full border-2 border-dashed p-8 rounded-[32px] transition-all flex flex-col items-center gap-2 ${isLight ? 'bg-white border-slate-200 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30' : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-indigo-400 hover:border-indigo-500/30'}`}>
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
             <BarChart3 size={14} className="text-emerald-500" /> Financeiro & PIX
           </h3>
           <button onClick={() => setIsFinancialExpanded(!isFinancialExpanded)} className={`p-2 border rounded-xl text-emerald-500 ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
              {isFinancialExpanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
           </button>
        </div>
        {isFinancialExpanded && (
          <div className={sectionClass}>
             <div className="flex items-center justify-between">
                <div><p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Total Acumulado</p><h4 className={`text-3xl font-black font-orbitron ${isLight ? 'text-slate-900' : 'text-white'}`}>R$ {totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4></div>
                <button onClick={() => setIsFinancialModalOpen(true)} className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-lg active:scale-95"><FileText size={24}/></button>
             </div>
             <div className={`pt-6 border-t space-y-3 ${isLight ? 'border-slate-100' : 'border-white/5'}`}><label className={labelClass}>Chave PIX para Recebimentos</label><input value={pixKey} onChange={(e) => onSetPixKey(e.target.value)} placeholder="Celular, E-mail ou CNPJ" className={inputClass} /></div>
          </div>
        )}
      </section>

      {/* TV */}
      <section className="space-y-4">
        <div className="flex justify-center"><button onClick={onToggleTVMode} className={`border py-3 px-8 rounded-[40px] flex items-center gap-2.5 shadow-xl transition-all active:scale-95 ${isLight ? 'bg-white border-slate-200 hover:border-teal-500/50' : 'bg-slate-900 border-slate-800 hover:border-teal-500/30'}`}><Monitor size={18} className="text-teal-400" /><span className={`text-[9px] font-black uppercase tracking-widest ${isLight ? 'text-slate-900' : 'text-white'}`}>Abrir Painel TV</span></button></div>
      </section>

      {isFinancialModalOpen && <FinancialDetailModal revenue={revenue} onClose={() => setIsFinancialModalOpen(false)} />}
    </div>
  );
};
