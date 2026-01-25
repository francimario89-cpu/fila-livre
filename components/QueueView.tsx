
import React, { useState, useEffect, useMemo } from 'react';
import { QueueItem, EstStatus, Professional, Service, BookingModel, DaySchedule } from '../types';
import { CheckCircle, Coffee, DoorClosed, Zap, UserPlus, Trash2, BellRing, RefreshCw, Scissors, ArrowRight, CheckCircle2, UserX, Clock, Calendar, QrCode, Copy, Check, AlertCircle, UserCog, Sparkles, Megaphone, Wifi, Users, MapPin } from 'lucide-react';

interface QueueViewProps {
  queue: QueueItem[];
  isAdmin: boolean;
  isStaff?: boolean;
  userRole?: 'admin' | 'staff' | 'client';
  myProId?: string;
  currentUserEmail?: string;
  establishmentName: string;
  estStatus: EstStatus;
  autoStatusEnabled?: boolean;
  openingHours?: string;
  pixKey?: string;
  bookingModel?: BookingModel;
  professionals: Professional[];
  services: Service[];
  dailySchedules?: Record<number, DaySchedule>;
  onCallNext?: (id?: string) => void;
  onFinish?: (item: QueueItem) => void;
  onNoShow?: (id: string) => void;
  onCallNextWithItem?: (item: QueueItem) => void;
  onOpenJoinModal?: () => void;
  onLeaveQueue?: (id: string) => void;
  onUpdateProfessional?: (itemId: string, proId: string) => void;
}

export const QueueView: React.FC<QueueViewProps> = ({ 
  queue, isAdmin, isStaff, userRole, myProId, currentUserEmail, establishmentName, estStatus, autoStatusEnabled, openingHours, pixKey, professionals, services, dailySchedules, onCallNext, onFinish, onNoShow, onOpenJoinModal, onLeaveQueue, onUpdateProfessional
}) => {
  const [filterPro, setFilterPro] = useState<'all' | string>('all');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentDaySchedule = useMemo(() => {
    const today = now.getDay();
    return dailySchedules ? dailySchedules[today] : null;
  }, [dailySchedules, now]);

  // Lógica de Status: Se autoStatusEnabled for false, manda o estStatus (manual).
  // Se for true, calcula baseado no horário.
  const displayStatus = useMemo(() => {
    if (!autoStatusEnabled) return estStatus;
    if (!currentDaySchedule || !currentDaySchedule.isOpen) return 'closed' as EstStatus;

    const currentTimeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
    const { start, end, hasLunch, lunchStart, lunchEnd } = currentDaySchedule;

    if (currentTimeStr < start || currentTimeStr >= end) return 'closed' as EstStatus;
    if (hasLunch && lunchStart && lunchEnd) {
      if (currentTimeStr >= lunchStart && currentTimeStr < lunchEnd) return 'lunch' as EstStatus;
    }
    return 'open' as EstStatus;
  }, [autoStatusEnabled, estStatus, currentDaySchedule, now]);

  const availableProsList = useMemo(() => {
    const servingProIds = queue
      .filter(item => item.status === 'serving')
      .map(item => item.professionalId);

    return professionals.filter(p => p.status === 'available' && !servingProIds.includes(p.id));
  }, [professionals, queue]);

  const availableProsNames = useMemo(() => {
    return availableProsList.map(p => p.name).join(', ');
  }, [availableProsList]);

  const filteredQueue = useMemo(() => {
    let list = [...queue];
    if (filterPro !== 'all') {
      list = list.filter(i => i.professionalId === filterPro || i.professionalId === 'any');
    }
    return list.sort((a, b) => {
      if (a.status === 'serving') return -1;
      if (b.status === 'serving') return 1;
      return a.timestamp - b.timestamp;
    });
  }, [queue, filterPro]);

  const servingList = useMemo(() => {
    return filteredQueue.filter(item => item.status === 'serving');
  }, [filteredQueue]);

  const waitingList = filteredQueue.filter(item => item.status === 'waiting');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      
      <header className="text-center py-4 space-y-2">
         <div className="flex items-center justify-center gap-2 mb-1">
            <div className={`w-1.5 h-1.5 rounded-full ${displayStatus === 'open' ? 'bg-teal-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">Unidade Selecionada</span>
         </div>
         <h1 className="text-3xl font-black text-white font-orbitron uppercase tracking-tighter leading-none neon-text">
            {establishmentName}
         </h1>
         <div className="flex items-center justify-center gap-1.5 text-slate-500">
            <MapPin size={10} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Painel de Atendimentos</span>
         </div>
      </header>
      
      <section className={`rounded-[32px] p-4 border-2 shadow-lg transition-all duration-700 ${
        displayStatus === 'open' ? 'bg-emerald-500 border-emerald-400 shadow-emerald-500/5' : 
        displayStatus === 'lunch' ? 'bg-amber-500 border-amber-400 shadow-amber-500/5' : 
        'bg-slate-900 border-red-500/50 shadow-red-500/5'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center shadow-inner ${
              displayStatus === 'closed' ? 'bg-red-500/20 text-red-500' :
              displayStatus === 'open' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-950 text-amber-500'
            }`}>
              {displayStatus === 'open' ? <div className="relative"><Wifi size={20} className="animate-pulse" /></div> : 
               displayStatus === 'lunch' ? <Coffee size={20} /> : 
               <DoorClosed size={20} />}
            </div>
            <div>
              <h2 className={`text-sm font-black uppercase font-orbitron tracking-tight leading-none ${
                displayStatus === 'open' ? 'text-slate-950' : 
                displayStatus === 'lunch' ? 'text-slate-950' : 'text-white'
              }`}>
                {displayStatus === 'open' ? 'ABERTO' : 
                 displayStatus === 'lunch' ? 'ALMOÇO' : 'FECHADO'}
              </h2>
              <p className={`text-[8px] font-black uppercase tracking-widest mt-1 ${
                displayStatus === 'open' ? 'text-slate-900/60' : 
                displayStatus === 'lunch' ? 'text-slate-900/60' : 'text-slate-500'
              }`}>
                {displayStatus === 'open' ? 'PODE ENTRAR NA LISTA' :
                 displayStatus === 'lunch' ? 'VOLTAMOS JÁ' : 'LOJA FECHADA'}
              </p>
            </div>
          </div>
          {autoStatusEnabled && (
             <div className="bg-slate-950/20 px-3 py-1 rounded-full border border-white/5">
                <span className="text-[7px] font-black uppercase tracking-widest text-slate-100/40">Modo Automático</span>
             </div>
          )}
        </div>
      </section>

      {availableProsList.length > 0 && displayStatus === 'open' && (
        <div className="bg-yellow-400 p-6 rounded-[32px] shadow-2xl shadow-yellow-500/20 flex items-center gap-4 animate-in slide-in-from-top-4 border-2 border-slate-950">
           <div className="w-12 h-12 bg-slate-950 text-yellow-400 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
              <Megaphone size={24} className="animate-bounce" />
           </div>
           <div className="flex-1">
              <p className="text-[10px] font-black text-slate-950 uppercase tracking-[0.2em]">Cadeira Livre Agora!</p>
              <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight leading-tight">
                {availableProsNames} {availableProsList.length > 1 ? 'estão aguardando' : 'está aguardando'} por você!
              </p>
           </div>
           <button onClick={onOpenJoinModal} className="px-6 py-3 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl active:scale-95 transition-all border border-white/10">ENTRAR</button>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
         <button onClick={() => setFilterPro('all')} className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterPro === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>Visão Geral</button>
         {professionals.filter(p => p.status !== 'absent').map(pro => {
           const isTrulyFree = pro.status === 'available' && !queue.some(i => i.status === 'serving' && i.professionalId === pro.id);
           return (
             <button 
               key={pro.id} 
               onClick={() => setFilterPro(pro.id)} 
               className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all relative border ${
                 filterPro === pro.id 
                 ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 border-amber-400' 
                 : isTrulyFree 
                   ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                   : 'bg-slate-900 text-slate-500 border-slate-800'
               }`}
             >
               {pro.name}
               {isTrulyFree && (
                 <span className="absolute -top-1 -right-1 flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                 </span>
               )}
             </button>
           );
         })}
      </div>

      {servingList.length > 0 && (
        <section className="space-y-4">
          <div className="flex justify-between items-center px-3">
             <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Em Atendimento</h2>
             <div className="h-[1px] flex-1 bg-indigo-500/20 ml-4" />
          </div>
          <div className="space-y-3">
            {servingList.map(item => (
              <div key={item.id} className="bg-indigo-600 rounded-[32px] p-6 shadow-2xl relative overflow-hidden animate-in zoom-in duration-500">
                <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><Zap size={80} /></div>
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-indigo-100 uppercase">{item.service}</span>
                        <span className="w-1 h-1 bg-white/30 rounded-full"/>
                        <span className="text-[10px] font-black text-white uppercase">
                          {professionals.find(p => p.id === item.professionalId)?.name || 'Livre'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {(isAdmin || (isStaff && item.professionalId === myProId)) && (
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => onNoShow?.(item.id)} className="p-3 bg-red-500 text-white rounded-xl shadow-lg active:scale-95 transition-all"><UserX size={18} /></button>
                      <button onClick={() => onFinish?.(item)} className="flex-1 bg-white text-indigo-600 font-black py-3 rounded-xl uppercase text-[9px] tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"><CheckCircle2 size={16} /> Finalizar Atendimento</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex justify-between items-center px-3">
           <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Próximos na Lista</h2>
           <div className="h-[1px] flex-1 bg-slate-800 ml-4" />
        </div>
        <div className="space-y-3">
          {waitingList.map((item, index) => {
            const isMe = item.userEmail && currentUserEmail && item.userEmail.toLowerCase() === currentUserEmail.toLowerCase();
            const isMyTurn = (isStaff || isAdmin) && (item.professionalId === 'any' || item.professionalId === myProId);
            const canAction = isAdmin || isMyTurn;

            return (
              <div key={item.id} className={`bg-slate-900 border ${isMe ? 'border-teal-500/50 bg-teal-500/5' : 'border-slate-800'} rounded-[32px] p-6 flex flex-col gap-4 shadow-lg transition-all`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${item.type === 'appointment' ? 'bg-indigo-600 text-white' : index === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-teal-400'}`}>{index + 1}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-white text-lg uppercase leading-none">{item.name}</h4>
                        {isMe && <span className="text-[8px] bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full font-black">VOCÊ</span>}
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">
                        {item.service} • {item.professionalId === 'any' ? 'Livre' : professionals.find(p => p.id === item.professionalId)?.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(isAdmin || (isMe && !isAdmin)) && (
                      <button onClick={() => onLeaveQueue?.(item.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                    )}
                    {canAction && (
                       <>
                          <button onClick={() => onNoShow?.(item.id)} className="p-3 bg-red-600/20 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all" title="Registrar Falta"><UserX size={16} /></button>
                          <button onClick={() => onCallNext?.(item.id)} className="bg-teal-500 text-slate-950 p-3 rounded-xl shadow-lg hover:bg-teal-400 active:scale-90 transition-all"><Zap size={16} /></button>
                       </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {waitingList.length === 0 && servingList.length === 0 && (
             <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-800">
                   <Users size={32} />
                </div>
                <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.3em]">Ninguém na lista no momento</p>
             </div>
          )}
        </div>
      </section>

      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40">
        {(isAdmin || isStaff) ? (
          <div className="flex gap-3">
            <button onClick={onOpenJoinModal} className="w-16 h-16 bg-slate-100 text-slate-950 rounded-[24px] shadow-2xl flex items-center justify-center transition-all border-2 border-slate-950"><UserPlus size={24} /></button>
            <button onClick={() => onCallNext?.()} className="flex-1 bg-indigo-600 text-white font-black py-6 rounded-[32px] shadow-2xl uppercase text-[11px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3"><BellRing size={20} /> Chamar Próximo</button>
          </div>
        ) : (
          displayStatus === 'open' && <button onClick={onOpenJoinModal} className="w-full bg-teal-500 text-slate-950 font-black py-7 rounded-[32px] shadow-2xl uppercase text-[11px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3"><Zap size={20} /> Entrar na Lista</button>
        )}
      </div>
    </div>
  );
};
