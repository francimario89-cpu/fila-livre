
import React, { useState, useEffect, useMemo } from 'react';
import { QueueItem, EstStatus, Professional, Service, BookingModel } from '../types';
import { CheckCircle, Coffee, DoorClosed, Zap, UserPlus, Trash2, BellRing, RefreshCw, Scissors, ArrowRight, CheckCircle2, UserX } from 'lucide-react';

interface QueueViewProps {
  queue: QueueItem[];
  isAdmin: boolean;
  isStaff?: boolean;
  userRole?: 'admin' | 'staff' | 'client';
  myProId?: string;
  currentUserEmail?: string;
  estStatus: EstStatus;
  bookingModel: BookingModel;
  professionals: Professional[];
  services: Service[];
  onCallNext?: (id?: string) => void;
  onFinish?: (item: QueueItem) => void;
  onNoShow?: (id: string) => void;
  onOpenJoinModal?: () => void;
  onLeaveQueue?: (id: string) => void;
  onSwitchQueue?: (queueId: string, newProId: string) => void;
}

export const QueueView: React.FC<QueueViewProps> = ({ 
  queue, isAdmin, isStaff, userRole, myProId, currentUserEmail, estStatus, professionals, services, onCallNext, onFinish, onNoShow, onOpenJoinModal, onLeaveQueue, onSwitchQueue 
}) => {
  const [now, setNow] = useState(Date.now());
  const [filterPro, setFilterPro] = useState<'all' | string>('all');

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const myQueueItem = useMemo(() => queue.find(i => i.userEmail === currentUserEmail && i.status === 'waiting'), [queue, currentUserEmail]);

  const filteredQueue = useMemo(() => {
    if (filterPro === 'all') return queue;
    return queue.filter(i => i.professionalId === filterPro || i.professionalId === 'any');
  }, [queue, filterPro]);

  const currentTurn = filteredQueue.find(item => item.status === 'serving');
  const waitingList = filteredQueue.filter(item => item.status === 'waiting');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
         <button onClick={() => setFilterPro('all')} className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterPro === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>Visão Geral</button>
         {professionals.filter(p => p.status !== 'absent').map(pro => (
           <button key={pro.id} onClick={() => setFilterPro(pro.id)} className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterPro === pro.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>{pro.name}</button>
         ))}
      </div>

      <div className={`p-5 rounded-[32px] border-2 flex items-center justify-between shadow-lg transition-all ${estStatus === 'open' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : estStatus === 'lunch' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/5 rounded-2xl">{estStatus === 'open' ? <CheckCircle size={22} /> : estStatus === 'lunch' ? <Coffee size={22} /> : <DoorClosed size={22} />}</div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest">{estStatus === 'open' ? 'Aberto' : estStatus === 'lunch' ? 'Pausa' : 'Fechado'}</h4>
            <p className="text-[8px] font-bold uppercase opacity-60">{estStatus === 'open' ? 'Sua vez está chegando' : 'Volte mais tarde'}</p>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full animate-pulse ${estStatus === 'open' ? 'bg-emerald-500' : 'bg-red-500'}`} />
      </div>

      {currentTurn && (
        <section className="bg-indigo-600 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-5">
            <span className="bg-white/20 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Em Atendimento</span>
            <h3 className="text-4xl font-black text-white uppercase tracking-tighter">{currentTurn.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-100 uppercase">{currentTurn.service}</span>
              <span className="w-1 h-1 bg-white/30 rounded-full"/>
              <span className="text-xs font-black text-white uppercase">{professionals.find(p => p.id === currentTurn.professionalId)?.name}</span>
            </div>
            
            {(isAdmin || (isStaff && currentTurn.professionalId === myProId)) && (
              <div className="flex gap-2">
                <button onClick={() => onNoShow?.(currentTurn.id)} className="p-4 bg-red-500 text-white rounded-2xl shadow-lg active:scale-95 transition-all">
                  <UserX size={20} />
                </button>
                <button 
                  onClick={() => onFinish?.(currentTurn)} 
                  className="flex-1 bg-white text-indigo-600 font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl"
                >
                  <CheckCircle2 size={18} /> Finalizar Serviço
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">Lista de Espera</h2>
        <div className="space-y-3">
          {waitingList.map((item, index) => {
            const isMe = item.userEmail === currentUserEmail;
            const isMyTurn = isStaff && (item.professionalId === 'any' || item.professionalId === myProId);
            const canAction = isAdmin || isMyTurn;

            return (
              <div key={item.id} className={`bg-slate-900 border ${isMe ? 'border-teal-500/50 bg-teal-500/5' : 'border-slate-800'} rounded-[32px] p-6 flex items-center justify-between shadow-lg`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${index === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-teal-400'}`}>{index + 1}</div>
                  <div>
                    <h4 className="font-black text-white text-lg uppercase leading-none">{item.name}</h4>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{item.service} • {item.professionalId === 'any' ? 'Qualquer' : professionals.find(p => p.id === item.professionalId)?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isAdmin || isMe ? (
                    <div className="flex gap-2">
                       {isAdmin && (
                         <button onClick={() => onLeaveQueue?.(item.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                           <Trash2 size={16} />
                         </button>
                       )}
                       {canAction && (
                         <>
                           <button onClick={() => onNoShow?.(item.id)} className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                             <UserX size={16} />
                           </button>
                           <button onClick={() => onCallNext?.(item.id)} className="bg-teal-500 text-slate-950 p-3 rounded-xl shadow-lg">
                             <Zap size={16} />
                           </button>
                         </>
                       )}
                       {isMe && !isAdmin && <button onClick={() => onLeaveQueue?.(item.id)} className="text-red-500 text-[8px] font-black uppercase border border-red-500/20 px-3 py-1.5 rounded-lg">Sair</button>}
                    </div>
                  ) : (
                    isMyTurn && (
                      <div className="flex gap-2">
                        <button onClick={() => onNoShow?.(item.id)} className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                          <UserX size={16} />
                        </button>
                        <button onClick={() => onCallNext?.(item.id)} className="bg-teal-500 text-slate-950 p-3 rounded-xl">
                           <Zap size={16} />
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
          {waitingList.length === 0 && <p className="text-center py-10 text-slate-700 text-[10px] font-black uppercase">Fila Vazia</p>}
        </div>
      </section>

      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40">
        {(isAdmin || isStaff) ? (
          <div className="flex gap-3">
            <button onClick={onOpenJoinModal} className="w-16 h-16 bg-teal-500 text-slate-950 rounded-[24px] shadow-2xl flex items-center justify-center transition-all active:scale-90 border-2 border-slate-950">
              <UserPlus size={24} />
            </button>
            <button onClick={() => onCallNext?.()} className="flex-1 bg-indigo-600 text-white font-black py-6 rounded-[32px] shadow-2xl shadow-indigo-500/20 uppercase text-[11px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3">
              <BellRing size={20} /> Chamar Próximo
            </button>
          </div>
        ) : (
          estStatus === 'open' && <button onClick={onOpenJoinModal} className="w-full bg-teal-500 text-slate-950 font-black py-7 rounded-[32px] shadow-2xl shadow-teal-500/20 uppercase text-[11px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3">
            <Zap size={20} /> Entrar na Fila
          </button>
        )}
      </div>
    </div>
  );
};
