
import React, { useState, useEffect, useMemo } from 'react';
import { QueueItem, EstStatus, Professional, Service, DaySchedule } from '../types.ts';
import { Coffee, DoorClosed, Zap, Trash2, CheckCircle2, MapPin, Wifi, LogOut, AlertCircle, ShieldAlert, Users2, Download, SmartphoneNfc } from 'lucide-react';

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
  isStandalone?: boolean;
  onCallNext?: (id?: string) => void;
  onFinish?: (item: QueueItem) => void;
  onNoShow?: (id: string) => void;
  onOpenJoinModal?: () => void;
  onLeaveQueue?: (id: string) => void;
  onUpdateProfessional?: (itemId: string, proId: string) => void;
  onTogglePriority?: (itemId: string, currentStatus: boolean) => void;
  onInstallRequest?: () => void;
}

export const QueueView: React.FC<QueueViewProps> = ({ 
  queue, isAdmin, isStaff, userRole, myProId, currentUserEmail, establishmentName, estStatus, autoStatusEnabled, professionals, dailySchedules, theme = 'dark', isStandalone, onCallNext, onFinish, onNoShow, onOpenJoinModal, onLeaveQueue, onUpdateProfessional, onTogglePriority, onInstallRequest
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

  const filteredProfessionals = useMemo(() => {
    if (userRole === 'staff' && myProId) {
      return professionals.filter(p => p.id === myProId);
    }
    return professionals.filter(p => p.status !== 'absent');
  }, [professionals, userRole, myProId]);

  return (
    <div className={`space-y-8 animate-in fade-in duration-500 pb-32 ${isLight ? 'bg-slate-50 min-h-screen -mx-4 px-4' : ''}`}>
      <header className="text-center py-6 space-y-2">
         <h1 className={`text-3xl font-black font-orbitron uppercase tracking-tighter leading-none ${isLight ? 'text-slate-900' : 'text-white neon-text'}`}>
            {establishmentName}
         </h1>
         <div className="flex items-center justify-center gap-1.5 text-slate-500">
            <MapPin size={10} />
            <span className="text-[9px] font-bold uppercase tracking-widest">
              {userRole === 'staff' ? 'Meu Guichê de Atendimento' : 'Painel Geral de Filas'}
            </span>
         </div>
      </header>

      {!isStandalone && (
        <section onClick={onInstallRequest} className="cursor-pointer group relative overflow-hidden rounded-[40px] p-6 border-2 transition-all duration-500 shadow-2xl animate-bounce-short bg-indigo-600 border-indigo-400">
           <div className="flex items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-white text-indigo-600 rounded-[20px] flex items-center justify-center shadow-2xl">
                    <SmartphoneNfc size={28} className="animate-pulse" />
                 </div>
                 <div className="text-white">
                    <h3 className="text-sm font-black uppercase tracking-tight">Instalar Aplicativo</h3>
                    <p className="text-[9px] text-white/70 font-bold uppercase tracking-widest mt-0.5">Clique para salvar no celular</p>
                 </div>
              </div>
              <div className="bg-white/20 p-2.5 rounded-2xl text-white"><Download size={20} /></div>
           </div>
        </section>
      )}
      
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
              {displayStatus === 'open' ? 'ATENDIMENTO ATIVO' : displayStatus === 'lunch' ? 'INTERVALO' : 'SISTEMA INDISPONÍVEL'}
            </h2>
          </div>
        </div>
      </section>

      <div className="space-y-12">
        {filteredProfessionals.map(pro => {
          const proQueue = queue.filter(item => item.professionalId === pro.id || (item.professionalId === 'any' && (userRole === 'admin' || myProId === pro.id)));
          const serving = proQueue.find(item => item.status === 'serving');
          const waiting = proQueue.filter(item => item.status === 'waiting').sort((a,b) => (a.isPriority ? -1 : 1) || a.timestamp - b.timestamp);
          const canActionPro = isAdmin || (isStaff && myProId === pro.id);

          return (
            <div key={pro.id} className="space-y-4">
              <div className="flex items-center justify-between opacity-50 px-4">
                 <h3 className={`text-[8px] font-black uppercase tracking-[0.2em] ${isLight ? 'text-slate-900' : 'text-slate-400'}`}>{pro.name}</h3>
                 <span className="text-[7px] font-black text-slate-500 uppercase">{waiting.length} NA FILA</span>
              </div>

              {serving ? (
                <div className={`bg-indigo-600 rounded-[32px] p-6 shadow-2xl border-2 relative overflow-hidden ${serving.isPriority ? 'border-red-500' : 'border-white/5'}`}>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{serving.name}</h3>
                  <p className="text-[10px] font-bold text-indigo-100 uppercase mt-1">{serving.service}</p>
                  {canActionPro && (
                    <div className="flex gap-2 pt-4">
                      <button onClick={() => onNoShow?.(serving.id)} className="p-3 bg-red-500 text-white rounded-xl"><Trash2 size={18} /></button>
                      <button onClick={() => onFinish?.(serving)} className="flex-1 bg-white text-indigo-600 font-black py-3 rounded-xl uppercase text-[9px] tracking-widest flex items-center justify-center gap-2"><CheckCircle2 size={16} /> Finalizar</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`border-2 border-dashed rounded-[32px] p-8 text-center opacity-20 ${isLight ? 'border-slate-300' : 'border-slate-800'}`}>
                   <p className="text-xl font-black uppercase tracking-[0.3em]">LIVRE</p>
                </div>
              )}

              <div className="space-y-3">
                {waiting.map((item, index) => {
                  const isMe = item.userEmail && currentUserEmail && item.userEmail.toLowerCase() === currentUserEmail.toLowerCase();
                  const canActionItem = isAdmin || (isStaff && (item.professionalId === 'any' || item.professionalId === myProId));
                  return (
                    <div key={item.id} className={`border-2 rounded-[32px] p-5 flex flex-col gap-4 ${item.isPriority ? 'border-red-500/40 bg-red-500/5' : isMe ? 'border-teal-500 bg-teal-500/10' : isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${item.isPriority ? 'bg-red-500 text-white' : index === 0 ? 'bg-amber-500' : 'bg-slate-800 text-teal-400'}`}>
                             {item.isPriority ? '!' : `${index + 1}º`}
                          </div>
                          <div>
                            <h4 className={`font-black text-base uppercase leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.name}</h4>
                          </div>
                        </div>
                        {canActionItem && (
                          <div className="flex gap-2">
                             <button onClick={() => onTogglePriority?.(item.id, !!item.isPriority)} className={`p-2.5 rounded-xl border ${item.isPriority ? 'bg-red-500 text-white' : 'bg-slate-800/10 text-slate-500'}`}><ShieldAlert size={16} /></button>
                             <button onClick={() => onCallNext?.(item.id)} className="bg-teal-500 text-slate-950 p-2.5 rounded-xl"><Zap size={16} /></button>
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

      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40">
        <button onClick={onOpenJoinModal} className="w-full bg-teal-500 text-slate-950 font-black py-7 rounded-[32px] shadow-2xl uppercase text-[11px] tracking-widest flex items-center justify-center gap-3"><Zap size={22} /> Entrar na Fila</button>
      </div>
    </div>
  );
};
