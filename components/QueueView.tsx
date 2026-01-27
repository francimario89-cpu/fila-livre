
import React, { useState, useEffect, useMemo } from 'react';
import { QueueItem, EstStatus, Professional, Service, BookingModel, DaySchedule } from '../types';
import { Coffee, DoorClosed, Zap, UserPlus, Trash2, BellRing, CheckCircle2, UserX, MapPin, Wifi, LogOut } from 'lucide-react';

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
  professionals: Professional[];
  services: Service[];
  dailySchedules?: Record<number, DaySchedule>;
  theme?: 'dark' | 'light';
  onCallNext?: (id?: string) => void;
  onFinish?: (item: QueueItem) => void;
  onNoShow?: (id: string) => void;
  onCallNextWithItem?: (item: QueueItem) => void;
  onOpenJoinModal?: () => void;
  onLeaveQueue?: (id: string) => void;
  onUpdateProfessional?: (itemId: string, proId: string) => void;
}

export const QueueView: React.FC<QueueViewProps> = ({ 
  queue, isAdmin, isStaff, userRole, myProId, currentUserEmail, establishmentName, estStatus, autoStatusEnabled, professionals, services, dailySchedules, theme = 'dark', onCallNext, onFinish, onNoShow, onOpenJoinModal, onLeaveQueue, onUpdateProfessional
}) => {
  const [filterPro, setFilterPro] = useState<'all' | string>('all');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isLight = theme === 'light';

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

  const servingList = useMemo(() => filteredQueue.filter(item => item.status === 'serving'), [filteredQueue]);
  const waitingList = filteredQueue.filter(item => item.status === 'waiting');

  const displayStatus = useMemo(() => {
    if (!autoStatusEnabled) return estStatus;
    const today = now.getDay();
    const sched = dailySchedules?.[today];
    if (!sched || !sched.isOpen) return 'closed' as EstStatus;
    const currentTimeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (currentTimeStr < sched.start || currentTimeStr >= sched.end) return 'closed' as EstStatus;
    return 'open' as EstStatus;
  }, [autoStatusEnabled, estStatus, dailySchedules, now]);

  return (
    <div className={`space-y-6 animate-in fade-in duration-500 pb-32 ${isLight ? 'bg-slate-50 min-h-screen -mx-4 px-4' : ''}`}>
      
      <header className="text-center py-6 space-y-2">
         <h1 className={`text-3xl font-black font-orbitron uppercase tracking-tighter leading-none ${isLight ? 'text-slate-900' : 'text-white neon-text'}`}>
            {establishmentName}
         </h1>
         <div className="flex items-center justify-center gap-1.5 text-slate-500">
            <MapPin size={10} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Painel de Atendimentos</span>
         </div>
      </header>
      
      {/* FILTROS POR PROFISSIONAL */}
      <div className="space-y-3">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Filas por Profissional</p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
           <button onClick={() => setFilterPro('all')} className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterPro === 'all' ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : (isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-900 text-slate-500 border-slate-800')}`}>Visão Geral</button>
           {professionals.filter(p => p.status !== 'absent').map(pro => (
             <button key={pro.id} onClick={() => setFilterPro(pro.id)} className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterPro === pro.id ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg' : (isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-900 text-slate-500 border-slate-800')}`}>{pro.name}</button>
           ))}
        </div>
      </div>

      {/* EM ATENDIMENTO */}
      {servingList.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3">Sendo Atendidos no Momento</h2>
          <div className="space-y-3">
            {servingList.map(item => (
              <div key={item.id} className="bg-indigo-600 rounded-[32px] p-6 shadow-2xl animate-in zoom-in border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20"><Zap size={40} className="text-white" /></div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{item.name}</h3>
                <p className="text-[10px] font-bold text-indigo-100 uppercase mt-1">EM CONSULTA COM: {professionals.find(p => p.id === item.professionalId)?.name}</p>
                <div className="mt-4 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                   <span className="text-[9px] font-black text-teal-400 uppercase tracking-widest">Sendo atendido no momento</span>
                </div>
                {(isAdmin || (isStaff && item.professionalId === myProId)) && (
                  <div className="flex gap-2 pt-4 relative z-10">
                    <button onClick={() => onNoShow?.(item.id)} className="p-3 bg-red-500 text-white rounded-xl active:scale-95"><UserX size={18} /></button>
                    <button onClick={() => onFinish?.(item)} className="flex-1 bg-white text-indigo-600 font-black py-3 rounded-xl uppercase text-[9px] tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95"><CheckCircle2 size={16} /> Finalizar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* LISTA DE ESPERA */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3">Aguardando na Lista</h2>
        <div className="space-y-3">
          {waitingList.map((item, index) => {
            const isMe = item.userEmail && currentUserEmail && item.userEmail.toLowerCase() === currentUserEmail.toLowerCase();
            const canAction = isAdmin || (isStaff && (item.professionalId === 'any' || item.professionalId === myProId));

            return (
              <div 
                key={item.id} 
                className={`border rounded-[32px] p-6 flex items-center justify-between transition-all ${
                  isMe 
                    ? 'border-teal-500 bg-teal-500/10 shadow-lg' 
                    : isLight 
                      ? 'bg-white border-slate-200 shadow-sm' 
                      : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-amber-500 text-slate-950 shadow-md' : (isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-teal-400')}`}>{index + 1}</div>
                  <div>
                    <div className="flex items-center gap-2">
                       <h4 className={`font-black text-lg uppercase leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.name}</h4>
                       {isMe && <span className="text-[7px] font-black bg-teal-500 text-slate-950 px-1.5 py-0.5 rounded-full uppercase">Você</span>}
                    </div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">{item.service}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                   {isMe && (
                     <button 
                       onClick={() => onLeaveQueue?.(item.id)} 
                       className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
                       title="Sair da Fila"
                     >
                       <LogOut size={18} />
                     </button>
                   )}
                   {canAction && (
                     <button onClick={() => onCallNext?.(item.id)} className="bg-teal-500 text-slate-950 p-3 rounded-xl shadow-lg active:scale-90 transition-all hover:bg-teal-400">
                       <Zap size={18} />
                     </button>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* BOTÃO FLUTUANTE ADICIONAR */}
      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40">
        {(isAdmin || isStaff) ? (
          <button onClick={onOpenJoinModal} className="w-full bg-indigo-600 text-white font-black py-6 rounded-[32px] shadow-2xl uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"><UserPlus size={22} /> Novo Cliente</button>
        ) : (
          displayStatus === 'open' && <button onClick={onOpenJoinModal} className="w-full bg-teal-500 text-slate-950 font-black py-7 rounded-[32px] shadow-2xl uppercase text-[11px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3"><Zap size={22} /> Entrar na Lista</button>
        )}
      </div>
    </div>
  );
};
