
import React, { useState, useEffect, useMemo } from 'react';
import { QueueItem, EstStatus, Professional, Service, BookingModel } from '../types';
import { CheckCircle, Coffee, DoorClosed, Zap, UserPlus, Trash2, BellRing, RefreshCw, Scissors, ArrowRight, CheckCircle2, UserX, Clock, Calendar } from 'lucide-react';

interface QueueViewProps {
  queue: QueueItem[];
  isAdmin: boolean;
  isStaff?: boolean;
  userRole?: 'admin' | 'staff' | 'client';
  myProId?: string;
  currentUserEmail?: string;
  estStatus: EstStatus;
  openingHours?: string;
  bookingModel: BookingModel;
  professionals: Professional[];
  services: Service[];
  onCallNext?: (id?: string) => void;
  onFinish?: (item: QueueItem) => void;
  onNoShow?: (id: string) => void;
  onOpenJoinModal?: () => void;
  onLeaveQueue?: (id: string) => void;
}

export const QueueView: React.FC<QueueViewProps> = ({ 
  queue, isAdmin, isStaff, userRole, myProId, currentUserEmail, estStatus, openingHours, professionals, services, onCallNext, onFinish, onNoShow, onOpenJoinModal, onLeaveQueue
}) => {
  const [filterPro, setFilterPro] = useState<'all' | string>('all');

  const filteredQueue = useMemo(() => {
    let list = [...queue];
    if (filterPro !== 'all') {
      list = list.filter(i => i.professionalId === filterPro || i.professionalId === 'any');
    }
    // Ordenação: 1. Serving primeiro, 2. Waiting (por timestamp ou agendamento)
    return list.sort((a, b) => {
      if (a.status === 'serving') return -1;
      if (b.status === 'serving') return 1;
      return a.timestamp - b.timestamp;
    });
  }, [queue, filterPro]);

  const currentTurn = filteredQueue.find(item => item.status === 'serving');
  const waitingList = filteredQueue.filter(item => item.status === 'waiting');

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const [date, time] = isoString.split(' ');
      return time;
    } catch (e) { return isoString; }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      {/* Filtros de Barbeiro */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
         <button onClick={() => setFilterPro('all')} className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterPro === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>Visão Geral</button>
         {professionals.filter(p => p.status !== 'absent').map(pro => (
           <button key={pro.id} onClick={() => setFilterPro(pro.id)} className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterPro === pro.id ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>{pro.name}</button>
         ))}
      </div>

      {/* Status da Loja */}
      <div className={`p-5 rounded-[32px] border-2 flex flex-col shadow-lg transition-all ${estStatus === 'open' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : estStatus === 'lunch' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/5 rounded-2xl">{estStatus === 'open' ? <CheckCircle size={22} /> : estStatus === 'lunch' ? <Coffee size={22} /> : <DoorClosed size={22} />}</div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest">{estStatus === 'open' ? 'Aberto' : estStatus === 'lunch' ? 'Pausa' : 'Fechado'}</h4>
              <p className="text-[8px] font-bold uppercase opacity-60">{estStatus === 'open' ? 'Atendimento em tempo real' : 'Pausa para almoço'}</p>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full animate-pulse ${estStatus === 'open' ? 'bg-emerald-500' : 'bg-red-500'}`} />
        </div>
      </div>

      {/* Atendimento Atual */}
      {currentTurn && (
        <section className="bg-indigo-600 rounded-[40px] p-8 shadow-2xl relative overflow-hidden animate-in zoom-in duration-500">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <Scissors size={120} />
          </div>
          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Em Atendimento</span>
              {currentTurn.type === 'appointment' && <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1"><Clock size={10} /> Agenda</span>}
            </div>
            <h3 className="text-4xl font-black text-white uppercase tracking-tighter">{currentTurn.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-100 uppercase">{currentTurn.service}</span>
              <span className="w-1 h-1 bg-white/30 rounded-full"/>
              <span className="text-xs font-black text-white uppercase">{professionals.find(p => p.id === currentTurn.professionalId)?.name}</span>
            </div>
            
            {(isAdmin || (isStaff && currentTurn.professionalId === myProId)) && (
              <div className="flex gap-2 pt-2">
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

      {/* Lista de Espera */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">Próximos da Lista</h2>
        <div className="space-y-3">
          {waitingList.map((item, index) => {
            const isMe = item.userEmail === currentUserEmail;
            const isMyTurn = (isStaff || isAdmin) && (item.professionalId === 'any' || item.professionalId === myProId);
            const canAction = isAdmin || isMyTurn;
            const isAppointment = item.type === 'appointment';

            return (
              <div key={item.id} className={`bg-slate-900 border ${isMe ? 'border-teal-500/50 bg-teal-500/5 shadow-teal-500/5' : 'border-slate-800'} rounded-[32px] p-6 flex items-center justify-between shadow-lg relative overflow-hidden group transition-all hover:border-slate-700`}>
                {isAppointment && <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity"><Calendar size={40} /></div>}
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${
                    isAppointment 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                      : index === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-teal-400'
                  }`}>
                    {isAppointment ? <Clock size={18} /> : index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-white text-lg uppercase leading-none">{item.name}</h4>
                      {isAppointment && <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-black tracking-widest">AGENDADO</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <p className="text-[9px] text-slate-500 font-bold uppercase">{item.service} • {item.professionalId === 'any' ? 'Barbeiro Livre' : professionals.find(p => p.id === item.professionalId)?.name}</p>
                      {isAppointment && (
                        <span className="text-[9px] font-black text-indigo-400 uppercase flex items-center gap-1">
                          <span className="w-1 h-1 bg-slate-700 rounded-full" /> {formatTime(item.scheduledTime)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                  {canAction || isMe ? (
                    <div className="flex gap-2">
                       {isAdmin && (
                         <button onClick={() => onLeaveQueue?.(item.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                           <Trash2 size={16} />
                         </button>
                       )}
                       {canAction && (
                         <>
                           <button onClick={() => onNoShow?.(item.id)} className="p-3 bg-amber-500/10 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-white transition-all">
                             <UserX size={16} />
                           </button>
                           <button onClick={() => onCallNext?.(item.id)} className="bg-teal-500 text-slate-950 p-3 rounded-xl shadow-lg hover:bg-teal-400 active:scale-90 transition-all">
                             <Zap size={16} />
                           </button>
                         </>
                       )}
                       {isMe && !isAdmin && <button onClick={() => onLeaveQueue?.(item.id)} className="text-red-500 text-[8px] font-black uppercase border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-all">Sair da Fila</button>}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
          {waitingList.length === 0 && <div className="text-center py-16 bg-slate-950/30 rounded-[40px] border border-dashed border-slate-900"><p className="text-slate-700 text-[10px] font-black uppercase tracking-widest">Ninguém aguardando no momento</p></div>}
        </div>
      </section>

      {/* Botões de Ação Fixos */}
      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40">
        {(isAdmin || isStaff) ? (
          <div className="flex gap-3">
            <button onClick={onOpenJoinModal} className="w-16 h-16 bg-slate-100 text-slate-950 rounded-[24px] shadow-2xl flex items-center justify-center transition-all active:scale-90 border-2 border-slate-950">
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
