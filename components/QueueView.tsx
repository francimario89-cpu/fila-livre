
import React, { useState, useEffect } from 'react';
import { QueueItem, EstStatus, Professional, Service, BookingModel } from '../types';
import { CheckCircle, Coffee, DoorClosed, Zap, UserPlus, Trash2, BellRing } from 'lucide-react';

interface QueueViewProps {
  queue: QueueItem[];
  isAdmin: boolean;
  currentUserEmail?: string;
  estStatus: EstStatus;
  bookingModel: BookingModel;
  professionals: Professional[];
  services: Service[];
  onCallNext?: (id?: string) => void;
  onNoShow?: (id?: string) => void;
  onOpenJoinModal?: () => void;
  onLeaveQueue?: (id: string) => void;
}

export const QueueView: React.FC<QueueViewProps> = ({ 
  queue, isAdmin, currentUserEmail, estStatus, professionals, services, onCallNext, onNoShow, onOpenJoinModal, onLeaveQueue 
}) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const currentTurn = queue.find(item => item.status === 'serving');
  const waitingList = queue.filter(item => item.status === 'waiting');

  const getClientWaitTime = (item: QueueItem) => {
    const activePros = professionals.filter(p => p.status !== 'absent');
    if (activePros.length === 0) return 0;

    const calculateForPro = (proId: string, currentItem: QueueItem) => {
      let wait = 0;
      const serving = queue.find(i => i.status === 'serving' && i.professionalId === proId);
      const waiting = waitingList.filter(i => i.professionalId === proId || i.professionalId === 'any');
      
      if (serving) {
        const srv = services.find(s => s.name === serving.service);
        const elapsed = Math.floor((now - serving.timestamp) / 60000);
        wait += Math.max(0, (srv?.duration || 30) - elapsed);
      }

      const myIdx = waiting.findIndex(i => i.id === currentItem.id);
      if (myIdx === -1) return 999;

      for (let i = 0; i < myIdx; i++) {
        const srv = services.find(s => s.name === waiting[i].service);
        wait += (srv?.duration || 30);
      }
      return wait;
    };

    if (item.professionalId === 'any') {
      const waits = activePros.map(p => calculateForPro(p.id, item));
      return Math.min(...waits);
    }
    return calculateForPro(item.professionalId, item);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      {/* STATUS BANNER */}
      <div className={`p-5 rounded-[32px] border-2 flex items-center justify-between shadow-lg transition-all ${estStatus === 'open' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : estStatus === 'lunch' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/5 rounded-2xl">
            {estStatus === 'open' ? <CheckCircle size={22} /> : estStatus === 'lunch' ? <Coffee size={22} /> : <DoorClosed size={22} />}
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest">{estStatus === 'open' ? 'Estamos Abertos' : estStatus === 'lunch' ? 'Pausa' : 'Fechado'}</h4>
            <p className="text-[8px] font-bold uppercase opacity-60 tracking-tighter">
              {estStatus === 'open' ? 'Fila disponível' : 'Volte mais tarde'}
            </p>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full animate-pulse ${estStatus === 'open' ? 'bg-emerald-500' : 'bg-red-500'}`} />
      </div>

      {currentTurn && (
        <section className="bg-indigo-600 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-5">
            <span className="bg-white/20 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Atendimento Agora</span>
            <h3 className="text-4xl font-black text-white uppercase tracking-tighter">{currentTurn.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-100 uppercase">{currentTurn.service}</span>
              <span className="w-1 h-1 bg-white/30 rounded-full"/>
              <span className="text-xs font-black text-white uppercase">Com {professionals.find(p => p.id === currentTurn.professionalId)?.name || 'Qualquer um'}</span>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <button onClick={() => onNoShow?.(currentTurn.id)} className="p-4 bg-red-500 text-white rounded-2xl shadow-lg active:scale-95 transition-all">
                  <Trash2 size={20} />
                </button>
                <button onClick={() => onCallNext?.()} className="flex-1 bg-white text-indigo-600 font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-xl">
                  Finalizar & Chamar Próximo
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">Próximos da Fila</h2>
        <div className="space-y-3">
          {waitingList.map((item, index) => {
            const wait = getClientWaitTime(item);
            const callTime = new Date(now + wait * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const isMe = item.userEmail === currentUserEmail;

            return (
              <div key={item.id} className={`bg-slate-900 border ${isMe ? 'border-teal-500/50 bg-teal-500/5' : 'border-slate-800'} rounded-[32px] p-6 flex items-center justify-between shadow-lg relative overflow-hidden`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${index === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-teal-400'}`}>{index + 1}</div>
                  <div>
                    <h4 className="font-black text-white text-lg uppercase leading-none">{item.name}</h4>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{item.service}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isAdmin ? (
                    <div className="flex gap-2">
                       <button onClick={() => onLeaveQueue?.(item.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                         <Trash2 size={16} />
                       </button>
                       <button onClick={() => onCallNext?.(item.id)} className="bg-teal-500 text-slate-950 p-3 rounded-xl shadow-lg active:scale-90 transition-all">
                         <Zap size={16} />
                       </button>
                    </div>
                  ) : (
                    <div className="text-right">
                      {isMe ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] text-teal-400 font-black uppercase tracking-widest">Previsão: {callTime}</span>
                          <button onClick={() => onLeaveQueue?.(item.id)} className="text-red-500 text-[8px] font-black uppercase tracking-widest border border-red-500/20 px-2 py-1 rounded-lg">Sair</button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-black uppercase">~{wait} min</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {waitingList.length === 0 && <p className="text-center py-10 text-slate-700 text-[10px] font-black uppercase tracking-widest">Ninguém esperando</p>}
        </div>
      </section>

      {/* BOTÃO DE AÇÃO FLUTUANTE */}
      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40">
        {isAdmin ? (
          <button onClick={() => onCallNext?.()} className="w-full bg-indigo-600 text-white font-black py-6 rounded-[32px] shadow-2xl shadow-indigo-500/20 uppercase text-[11px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3">
            <BellRing size={20} /> Chamar Próximo
          </button>
        ) : (
          estStatus === 'open' && (
            <button onClick={onOpenJoinModal} className="w-full bg-teal-500 text-slate-950 font-black py-7 rounded-[32px] shadow-2xl shadow-teal-500/20 uppercase text-[11px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3">
              <Zap size={20} /> Entrar na Fila
            </button>
          )
        )}
      </div>
    </div>
  );
};
