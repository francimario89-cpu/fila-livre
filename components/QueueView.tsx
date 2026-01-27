
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
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isLight = theme === 'light';

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
    <div className={`space-y-8 animate-in fade-in duration-500 pb-32 ${isLight ? 'bg-slate-50 min-h-screen -mx-4 px-4' : ''}`}>
      
      <header className="text-center py-6 space-y-2">
         <h1 className={`text-3xl font-black font-orbitron uppercase tracking-tighter leading-none ${isLight ? 'text-slate-900' : 'text-white neon-text'}`}>
            {establishmentName}
         </h1>
         <div className="flex items-center justify-center gap-1.5 text-slate-500">
            <MapPin size={10} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Atendimento Profissional</span>
         </div>
      </header>
      
      {/* STATUS CARD */}
      <section className={`rounded-[32px] p-5 border-2 transition-all duration-700 shadow-xl ${
        displayStatus === 'open' ? 'bg-emerald-500 border-emerald-400' : 
        displayStatus === 'lunch' ? 'bg-amber-500 border-amber-400' : 
        (isLight ? 'bg-white border-red-100 shadow-sm' : 'bg-slate-900 border-red-500/20')
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[18px] flex items-center justify-center bg-black/10 text-white">
            {displayStatus === 'open' ? <Wifi size={24} className="animate-pulse" /> : displayStatus === 'lunch' ? <Coffee size={24} /> : <DoorClosed size={24} />}
          </div>
          <div>
            <h2 className={`text-base font-black uppercase font-orbitron tracking-tight leading-none ${isLight && displayStatus === 'closed' ? 'text-red-500' : 'text-white'}`}>
              {displayStatus === 'open' ? 'ESTAMOS ABERTOS' : displayStatus === 'lunch' ? 'PAUSA ALMOÇO' : 'FECHADO'}
            </h2>
            <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isLight && displayStatus === 'closed' ? 'text-slate-400' : 'text-white/70'}`}>
              {displayStatus === 'open' ? 'PODE ENTRAR' : 'VOLTAMOS EM BREVE'}
            </p>
          </div>
        </div>
      </section>

      {/* FILAS INDIVIDUAIS POR PROFISSIONAL */}
      <div className="space-y-12">
        {professionals.filter(p => p.status !== 'absent').map(pro => {
          const proQueue = queue.filter(item => item.professionalId === pro.id || item.professionalId === 'any');
          const serving = proQueue.find(item => item.status === 'serving');
          const waiting = proQueue.filter(item => item.status === 'waiting').sort((a,b) => a.timestamp - b.timestamp);
          const canActionPro = isAdmin || (isStaff && myProId === pro.id);

          return (
            <div key={pro.id} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-500/20 pb-2 px-2">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-teal-400" />
                    <h3 className={`text-sm font-black uppercase tracking-widest ${isLight ? 'text-slate-900' : 'text-white'}`}>{pro.name}</h3>
                 </div>
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{waiting.length} EM ESPERA</span>
              </div>

              {/* SENDO ATENDIDO (TOPO) */}
              {serving ? (
                <div className="bg-indigo-600 rounded-[32px] p-6 shadow-2xl border border-white/5 relative overflow-hidden animate-in zoom-in">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={40} className="text-white" /></div>
                  <div className="flex items-center gap-2 mb-3">
                     <span className="text-[10px] font-black bg-teal-400 text-slate-950 px-2 py-0.5 rounded-full uppercase">Sendo atendido no momento</span>
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{serving.name}</h3>
                  <p className="text-[10px] font-bold text-indigo-100 uppercase mt-1">{serving.service}</p>
                  
                  {canActionPro && (
                    <div className="flex gap-2 pt-4 relative z-10">
                      <button onClick={() => onNoShow?.(serving.id)} className="p-3 bg-red-500 text-white rounded-xl active:scale-95 shadow-lg" title="Excluir"><Trash2 size={18} /></button>
                      <button onClick={() => onFinish?.(serving)} className="flex-1 bg-white text-indigo-600 font-black py-3 rounded-xl uppercase text-[9px] tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95"><CheckCircle2 size={16} /> Finalizar</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`border-2 border-dashed rounded-[32px] p-8 text-center opacity-30 ${isLight ? 'border-slate-300' : 'border-slate-800'}`}>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em]">LIVRE PARA ATENDIMENTO</p>
                </div>
              )}

              {/* LISTA DE ESPERA (EMBAIXO) */}
              <div className="space-y-3">
                {waiting.map((item, index) => {
                  const isMe = item.userEmail && currentUserEmail && item.userEmail.toLowerCase() === currentUserEmail.toLowerCase();
                  const canActionItem = isAdmin || (isStaff && (item.professionalId === 'any' || item.professionalId === myProId));

                  return (
                    <div 
                      key={item.id} 
                      className={`border rounded-[32px] p-5 flex items-center justify-between transition-all ${
                        isMe 
                          ? 'border-teal-500 bg-teal-500/10 shadow-lg' 
                          : isLight 
                            ? 'bg-white border-slate-200 shadow-sm' 
                            : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${index === 0 ? 'bg-amber-500 text-slate-950 shadow-md' : (isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-teal-400')}`}>
                           {index + 1}º
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <h4 className={`font-black text-base uppercase leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.name}</h4>
                             {isMe && <span className="text-[7px] font-black bg-teal-500 text-slate-950 px-1.5 py-0.5 rounded-full uppercase">VOCÊ</span>}
                          </div>
                          <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">{item.service}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                         {isMe && (
                           <button onClick={() => onLeaveQueue?.(item.id)} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all" title="Sair da Fila">
                             <LogOut size={16} />
                           </button>
                         )}
                         {canActionItem && (
                           <div className="flex gap-2">
                              <button onClick={() => onNoShow?.(item.id)} className="p-2.5 bg-slate-800/10 text-slate-500 rounded-xl hover:bg-red-500 hover:text-white transition-all" title="Excluir da Lista">
                                <Trash2 size={16} />
                              </button>
                              <button onClick={() => onCallNext?.(item.id)} className="bg-teal-500 text-slate-950 p-2.5 rounded-xl shadow-lg active:scale-90 transition-all hover:bg-teal-400" title="Chamar Próximo">
                                <Zap size={16} />
                              </button>
                           </div>
                         )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* BOTÃO FLUTUANTE ADICIONAR */}
      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40">
        {(isAdmin || isStaff) ? (
          <button onClick={onOpenJoinModal} className="w-full bg-indigo-600 text-white font-black py-6 rounded-[32px] shadow-2xl uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"><UserPlus size={22} /> Adicionar Cliente</button>
        ) : (
          displayStatus === 'open' && <button onClick={onOpenJoinModal} className="w-full bg-teal-500 text-slate-950 font-black py-7 rounded-[32px] shadow-2xl uppercase text-[11px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3"><Zap size={22} /> Entrar na Lista</button>
        )}
      </div>
    </div>
  );
};
