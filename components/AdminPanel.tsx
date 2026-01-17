
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Trash2, BarChart3, Users2, UserCircle, Zap, FileText, Store, Monitor, UserPlus, Coffee, DoorClosed, CheckCircle2, Scissors, ListOrdered, Settings, QrCode, BellRing, UserX, Mail, Link as LinkIcon, CheckCircle, Clock, Save, Building2, CalendarDays, ChevronDown, ChevronUp, Maximize2, Minimize2, Play, Moon, Power, AlertTriangle, ToggleLeft, ToggleRight
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
  
  const [tempName, setTempName] = useState(establishment.name);
  const [tempHours, setTempHours] = useState(establishment.openingHours || '');
  
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
    setTempHours(establishment.openingHours || '');
    if (establishment.dailySchedules) {
      setDailySchedules(establishment.dailySchedules);
    }
  }, [establishment]);

  useEffect(() => {
    if (services.length > 0 && !manualService) {
      setManualService(services[0].name);
    }
  }, [services]);

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
      dailySchedules 
    });
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
      
      {/* 0. PERFIL DO NEGÓCIO */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Building2 size={14} className="text-teal-400" /> Perfil do Negócio
        </h3>
        <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 space-y-8 shadow-2xl">
          
          {/* BOTÃO MESTRE AUTOMÁTICO */}
          <div className="space-y-3">
             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 block text-center">Automação de Fila</label>
             <button 
                onClick={() => onUpdateEstablishment({ autoStatusEnabled: !isAutoMode })}
                className={`w-full py-6 rounded-[32px] border-2 transition-all duration-500 flex flex-col items-center justify-center gap-2 shadow-2xl ${
                  isAutoMode 
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                    : 'bg-red-500/10 border-red-500/50 text-red-500'
                }`}
             >
                <div className="flex items-center gap-3">
                   {isAutoMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                   <span className="text-xs font-black uppercase tracking-[0.2em]">
                      Modo Automático: {isAutoMode ? 'LIGADO' : 'DESLIGADO'}
                   </span>
                </div>
                <p className="text-[8px] font-bold uppercase opacity-60 px-8 text-center leading-relaxed">
                   {isAutoMode 
                     ? 'O sistema abrirá e fechará a fila sozinho seguindo sua agenda.' 
                     : 'Você precisa abrir e fechar a fila manualmente.'}
                </p>
             </button>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex flex-col gap-6">
               <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <CalendarDays size={12} className="text-teal-400" /> Agenda de Trabalho
                  </label>
                  <button 
                    onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-xl text-[8px] font-black uppercase text-teal-400 hover:bg-slate-700 transition-all"
                  >
                    {isScheduleExpanded ? <><Minimize2 size={12}/> Minimizar</> : <><Maximize2 size={12}/> Maximizar Editor</>}
                  </button>
               </div>

               {/* CONTROLES MANUAIS (SÓ APARECEM SE O AUTO ESTIVER DESLIGADO) */}
               {!isAutoMode && (
                  <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                    <button 
                      onClick={() => onUpdateStatus(estStatus === 'open' ? 'closed' : 'open')}
                      className={`flex items-center justify-center gap-3 py-5 rounded-2xl text-[10px] font-black uppercase transition-all shadow-xl ${
                        estStatus === 'open' 
                          ? 'bg-emerald-500 text-slate-950' 
                          : 'bg-slate-800 text-emerald-400'
                      }`}
                    >
                      <Power size={14} />
                      {estStatus === 'open' ? 'Estabelecimento Aberto' : 'Abrir Agora'}
                    </button>
                    <button 
                      onClick={() => onUpdateStatus(estStatus === 'lunch' ? 'open' : 'lunch')}
                      className={`flex items-center justify-center gap-3 py-5 rounded-2xl text-[10px] font-black uppercase transition-all shadow-xl ${
                        estStatus === 'lunch' 
                          ? 'bg-amber-500 text-slate-950' 
                          : 'bg-slate-800 text-amber-500'
                      }`}
                    >
                      <Coffee size={14} />
                      {estStatus === 'lunch' ? 'Em Almoço' : 'Pausa Almoço'}
                    </button>
                  </div>
               )}

               {isAutoMode && (
                 <div className="bg-slate-950/50 p-6 rounded-[32px] border border-emerald-500/20 flex items-center gap-5">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                       <CheckCircle2 size={24} />
                    </div>
                    <div>
                       <p className="text-[10px] text-white font-black uppercase tracking-widest">Status Atual: <span className={estStatus === 'open' ? 'text-emerald-400' : estStatus === 'lunch' ? 'text-amber-500' : 'text-red-500'}>{estStatus === 'open' ? 'ABERTO' : estStatus === 'lunch' ? 'ALMOÇO' : 'FECHADO'}</span></p>
                       <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">Sincronizado com sua agenda diária.</p>
                    </div>
                 </div>
               )}
            </div>

            {isScheduleExpanded && (
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                {DAYS_OF_WEEK.map(day => {
                  const sched = dailySchedules[day.id] || { isOpen: false, start: "08:00", end: "18:00", hasLunch: false };
                  return (
                    <div key={day.id} className="bg-slate-950/50 border border-slate-800/50 rounded-3xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <button 
                             onClick={() => updateDaySchedule(day.id, 'isOpen', !sched.isOpen)}
                             className={`w-10 h-6 rounded-full relative transition-all ${sched.isOpen ? 'bg-teal-500' : 'bg-slate-800'}`}
                           >
                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${sched.isOpen ? 'left-5' : 'left-1'}`} />
                           </button>
                           <span className={`text-[10px] font-black uppercase tracking-widest ${sched.isOpen ? 'text-white' : 'text-slate-600'}`}>{day.label}</span>
                        </div>
                        {sched.isOpen && (
                          <button 
                            onClick={() => updateDaySchedule(day.id, 'hasLunch', !sched.hasLunch)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase border transition-all ${sched.hasLunch ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-slate-900 border-slate-800 text-slate-600'}`}
                          >
                            <Coffee size={10} /> Almoço: {sched.hasLunch ? 'Ativo' : 'Não'}
                          </button>
                        )}
                      </div>
                      
                      {sched.isOpen && (
                        <div className="space-y-4 animate-in fade-in">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 space-y-1">
                               <p className="text-[7px] font-black text-slate-600 uppercase ml-1">Abertura</p>
                               <input type="time" value={sched.start} onChange={(e) => updateDaySchedule(day.id, 'start', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-[10px] text-white font-bold outline-none" />
                            </div>
                            <div className="flex-1 space-y-1">
                               <p className="text-[7px] font-black text-slate-600 uppercase ml-1">Fechamento</p>
                               <input type="time" value={sched.end} onChange={(e) => updateDaySchedule(day.id, 'end', e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-[10px] text-white font-bold outline-none" />
                            </div>
                          </div>

                          {sched.hasLunch && (
                            <div className="flex items-center gap-4 pt-2 border-t border-white/5 bg-amber-500/5 -mx-5 px-5 pb-2">
                              <div className="flex-1 space-y-1">
                                 <p className="text-[7px] font-black text-amber-600/70 uppercase ml-1">Início Almoço</p>
                                 <input type="time" value={sched.lunchStart || "12:00"} onChange={(e) => updateDaySchedule(day.id, 'lunchStart', e.target.value)} className="w-full bg-slate-900 border border-amber-500/10 rounded-xl py-2 px-3 text-[10px] text-amber-100 font-bold outline-none" />
                              </div>
                              <div className="flex-1 space-y-1">
                                 <p className="text-[7px] font-black text-amber-600/70 uppercase ml-1">Fim Almoço</p>
                                 <input type="time" value={sched.lunchEnd || "13:00"} onChange={(e) => updateDaySchedule(day.id, 'lunchEnd', e.target.value)} className="w-full bg-slate-900 border border-amber-500/10 rounded-xl py-2 px-3 text-[10px] text-amber-100 font-bold outline-none" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <button 
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
            className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${isSavingProfile ? 'bg-emerald-500 text-slate-950' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'}`}
          >
            {isSavingProfile ? <CheckCircle2 size={18} /> : (isScheduleExpanded ? <><Minimize2 size={18} /> Concluir Agenda</> : <Save size={18} />)}
            {!isSavingProfile && !isScheduleExpanded && 'Salvar Alterações de Agenda'}
          </button>
        </div>
      </section>

      {/* 1. MÓDULO DE GESTÃO DE ATENDIMENTOS ATIVOS */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <BellRing size={14} className="text-teal-400" /> Atendimentos em Curso
        </h3>
        
        <div className="space-y-3">
          {servingList.length > 0 ? servingList.map(serving => (
            <div key={serving.id} className="bg-slate-900 border border-slate-800 rounded-[32px] p-5 shadow-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-500/10 text-teal-400 rounded-2xl flex items-center justify-center">
                  <UserCircle size={28} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase leading-none">{serving.name}</h4>
                  <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">
                    {serving.service} • <span className="text-teal-400 font-black">{professionals.find(p => p.id === serving.professionalId)?.name || 'Barbeiro'}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onNoShow(serving.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl"><UserX size={16} /></button>
                <button onClick={() => onFinish(serving)} className="bg-teal-500 text-slate-950 px-6 py-3 rounded-xl text-[9px] font-black uppercase">Finalizar</button>
              </div>
            </div>
          )) : (
            <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-[32px] p-8 text-center">
              <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest">Nenhum atendimento no momento</p>
            </div>
          )}
          {nextInLine && (
            <button onClick={onCallNext} className="w-full bg-indigo-600 text-white py-5 rounded-[32px] font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 mt-4">
              <Zap size={20} /> Chamar {nextInLine.name}
            </button>
          )}
        </div>
      </section>

      {/* 2. OPERAÇÃO RÁPIDA & TV */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Store size={14} className="text-indigo-400" /> Painel de Controle
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={onToggleTVMode} className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex items-center justify-center gap-3 shadow-xl">
            <Monitor size={22} className="text-teal-400" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Painel TV</span>
          </button>
          <button onClick={() => setIsAddingManual(true)} className="bg-indigo-600 p-6 rounded-[32px] flex items-center justify-center gap-3 shadow-xl">
            <UserPlus size={22} className="text-white" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Manual</span>
          </button>
        </div>
      </section>

      {/* 3. FINANCEIRO & PIX */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <BarChart3 size={14} className="text-emerald-500" /> Módulo Financeiro
        </h3>
        <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 space-y-8 shadow-2xl">
           <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Faturamento Acumulado</p>
                <h4 className="text-3xl font-black text-white mt-1 font-orbitron">R$ {totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
              </div>
              <button onClick={() => setIsFinancialModalOpen(true)} className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400"><FileText size={24} /></button>
           </div>
           <input value={pixKey} onChange={(e) => onSetPixKey(e.target.value)} placeholder="Chave PIX do Negócio" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 px-6 text-white text-xs font-bold outline-none" />
        </div>
      </section>

      {isAddingManual && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md" onClick={() => setIsAddingManual(false)} />
          <div className="relative w-full max-sm bg-slate-900 border border-white/10 p-8 rounded-[40px] space-y-6 shadow-2xl">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Entrada de Balcão</h3>
            <div className="space-y-4">
              <input placeholder="NOME DO CLIENTE" value={manualName} onChange={e => setManualName(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-xs font-bold text-white uppercase outline-none" />
              <select value={manualService} onChange={e => setManualService(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-xs font-bold text-white uppercase outline-none">{services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select>
            </div>
            <button onClick={() => { if(!manualName) return; onManualJoin({ name: manualName, service: manualService, professionalId: manualProId, type: 'walk-in' }); setManualName(''); setIsAddingManual(false); }} className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center justify-center gap-2"><CheckCircle size={16} /> Inserir Agora</button>
          </div>
        </div>
      )}

      {isFinancialModalOpen && <FinancialDetailModal revenue={revenue} onClose={() => setIsFinancialModalOpen(false)} />}
    </div>
  );
};
