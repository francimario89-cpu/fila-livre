
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      <header className="text-center py-4 space-y-2">
         <h1 className={`text-3xl font-black font-orbitron uppercase tracking-tighter leading-none ${isLight ? 'text-slate-900' : 'text-white neon-text'}`}>
            {establishmentName}
         </h1>
         <div className="flex items-center justify-center gap-1.5 text-slate-500">
            <MapPin size={10} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Painel de Atendimentos</span>
         </div>
      </header>

      {/* LISTA EM ATENDIMENTO */}
      {servingList.length > 0 && (
        <section className="space-y-4">
          <div className="flex justify-between items-center px-3">
             <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Em Atendimento</h2>
          </div>
          <div className="space-y-3">
            {servingList.map(item => (
              <div key={item.id} className="bg-indigo-600 rounded-[32px] p-6 shadow-2xl animate-in zoom-in">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{item.name}</h3>
                <p className="text-[10px] font-bold text-indigo-100 uppercase">{item.service}</p>
                {(isAdmin || (isStaff && item.professionalId === myProId)) && (
                  <div className="flex gap-2 pt-4">
                    <button onClick={() => onNoShow?.(item.id)} className="p-3 bg-red-500 text-white rounded-xl"><UserX size={18} /></button>
                    <button onClick={() => onFinish?.(item)} className="flex-1 bg-white text-indigo-600 font-black py-3 rounded-xl uppercase text-[9px] tracking-widest">Finalizar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* LISTA DE ESPERA - ESTÉTICA AJUSTADA AQUI */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-3">
           <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aguardando</h2>
        </div>
        <div className="space-y-3">
          {waitingList.map((item, index) => {
            const isMe = item.userEmail && currentUserEmail && item.userEmail.toLowerCase() === currentUserEmail.toLowerCase();
            return (
              <div 
                key={item.id} 
                className={`border rounded-[32px] p-6 flex items-center justify-between transition-all ${
                  isMe 
                    ? 'border-teal-500 bg-teal-500/5' 
                    : isLight 
                      ? 'bg-transparent border-slate-400' 
                      : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${
                    index === 0 ? 'bg-amber-500 text-slate-950' : (isLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-teal-400')
                  }`}>{index + 1}</div>
                  <div>
                    <h4 className={`font-black text-lg uppercase leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.name}</h4>
                    <p className={`text-[9px] font-bold uppercase mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.service}</p>
                  </div>
                </div>
                {(isAdmin || (isStaff && (item.professionalId === 'any' || item.professionalId === myProId))) && (
                  <button onClick={() => onCallNext?.(item.id)} className="bg-teal-500 text-slate-950 p-3 rounded-xl shadow-lg active:scale-90 transition-all">
                    <Zap size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40">
        {(isAdmin || isStaff) ? (
          <button onClick={onOpenJoinModal} className="w-full bg-indigo-600 text-white font-black py-6 rounded-[32px] shadow-2xl uppercase text-[11px] tracking-widest flex items-center justify-center gap-3"><UserPlus size={20} /> Adicionar Cliente</button>
        ) : (
          displayStatus === 'open' && <button onClick={onOpenJoinModal} className="w-full bg-teal-500 text-slate-950 font-black py-7 rounded-[32px] shadow-2xl uppercase text-[11px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3"><Zap size={20} /> Entrar na Lista</button>
        )}
      </div>
    </div>
  );
};
