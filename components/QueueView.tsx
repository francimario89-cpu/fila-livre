
import React, { useMemo, useState, useEffect } from 'react';
import { QueueItem, EstStatus, Professional, Service, BookingModel } from '../types';
import { Clock, User as UserIcon, CheckCircle, ClipboardList, Coffee, DoorClosed, UserX, Lock, Timer, Calendar, Zap, ArrowRightLeft } from 'lucide-react';
import { formatDuration } from './JoinQueueModal';

interface QueueViewProps {
  queue: QueueItem[];
  isAdmin: boolean;
  estStatus: EstStatus;
  bookingModel: BookingModel;
  openingHours?: string;
  professionals: Professional[];
  services: Service[];
  onCallNext?: () => void;
  onNoShow?: () => void;
  onOpenJoinModal?: () => void;
}

export const QueueView: React.FC<QueueViewProps> = ({ 
  queue, isAdmin, estStatus, bookingModel, openingHours, professionals, services, onCallNext, onNoShow, onOpenJoinModal 
}) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const currentTurn = queue.find(item => item.status === 'serving');
  const waitingList = queue.filter(item => item.status === 'waiting');

  // Identifica se há um desequilíbrio nas filas para notificar o cliente
  const queueSuggestion = useMemo(() => {
    if (isAdmin || waitingList.length < 2) return null;

    const proStats = professionals.map(pro => {
      const wait = queue.filter(i => i.status === 'waiting' && i.professionalId === pro.id).length;
      const isServing = queue.some(i => i.status === 'serving' && i.professionalId === pro.id);
      return { id: pro.id, name: pro.name, wait, active: isServing };
    });

    const busyPro = proStats.find(p => p.wait >= 2);
    const freePro = proStats.find(p => p.wait === 0 && !p.active);

    if (busyPro && freePro) {
      return { from: busyPro.name, to: freePro.name };
    }
    return null;
  }, [queue, professionals, isAdmin, waitingList.length]);

  const getClientWaitTime = (item: QueueItem) => {
    if (item.professionalId === 'any') {
      const allTimes = professionals.map(pro => {
        let wait = 0;
        const serving = queue.find(i => i.status === 'serving' && i.professionalId === pro.id);
        const waiting = waitingList.filter(i => i.professionalId === pro.id);
        if (serving) {
          const srv = services.find(s => s.name === serving.service);
          const elapsed = Math.floor((now - serving.timestamp) / 60000);
          wait += Math.max(0, (srv?.duration || 30) - elapsed);
        }
        waiting.forEach(w => { wait += (services.find(s => s.name === w.service)?.duration || 30); });
        return wait;
      });
      return Math.min(...allTimes);
    }

    let wait = 0;
    const proServing = queue.find(i => i.status === 'serving' && i.professionalId === item.professionalId);
    if (proServing) {
      const srv = services.find(s => s.name === proServing.service);
      const elapsed = Math.floor((now - proServing.timestamp) / 60000);
      wait += Math.max(0, (srv?.duration || 30) - elapsed);
    }
    const proWaiting = waitingList.filter(i => i.professionalId === item.professionalId);
    const myIndex = proWaiting.findIndex(i => i.id === item.id);
    for (let i = 0; i < myIndex; i++) {
      const srv = services.find(s => s.name === proWaiting[i].service);
      wait += (srv?.duration || 30);
    }
    return wait;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* NOTIFICAÇÃO DE OTIMIZAÇÃO DE FILA */}
      {queueSuggestion && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-[32px] flex items-center gap-4 animate-bounce-subtle">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
            <ArrowRightLeft size={24} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Dica de Atendimento</p>
            <p className="text-[11px] text-white font-medium leading-tight">A fila de <span className="font-bold">{queueSuggestion.to.split(' ')[0]}</span> está vazia! Avise no balcão se quiser trocar.</p>
          </div>
        </div>
      )}

      {/* ESTIMATIVA DE TEMPO GLOBAL */}
      <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-7 flex items-center justify-between relative overflow-hidden group shadow-2xl">
        <div className="absolute -right-6 -top-6 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
           <Timer size={120} />
        </div>
        <div className="flex items-center gap-5">
          <div className="px-4 py-3 bg-teal-500/10 rounded-2xl flex flex-col items-center justify-center border border-teal-500/20 shadow-inner min-w-[100px]">
             <span className="text-teal-400 font-black text-xl leading-none">FLUXO</span>
             <span className="text-teal-400/50 text-[8px] font-black uppercase tracking-tighter mt-1">Tempo Real</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-white font-black text-sm uppercase tracking-tighter">Status da Unidade</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Zap size={10} className="text-amber-500" /> {professionals.length} Atendentes Ativos
            </p>
          </div>
        </div>
        <div className="text-right">
           <div className="text-[18px] font-black text-white">{waitingList.length}</div>
           <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Aguardando</p>
        </div>
      </div>

      {/* CLIENTE SENDO ATENDIDO AGORA */}
      {currentTurn && (
        <section className="space-y-4">
          <div className={`bg-gradient-to-br rounded-[40px] p-8 shadow-2xl relative overflow-hidden transition-all duration-700 ${currentTurn.type === 'appointment' ? 'from-indigo-600/90 to-slate-950 border border-indigo-500/30 shadow-indigo-500/20' : 'from-teal-600/90 to-slate-950 border border-teal-500/30 shadow-teal-500/20'}`}>
            <div className="relative z-10 space-y-7">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${currentTurn.type === 'appointment' ? 'bg-indigo-500 text-white' : 'bg-teal-500 text-slate-950'}`}>
                    EM ATENDIMENTO
                  </div>
                </div>
                <h3 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">{currentTurn.name}</h3>
                <div className="flex flex-wrap gap-2 mt-5">
                  <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-slate-300">{currentTurn.service}</span>
                  <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-teal-400">Com: {professionals.find(p => p.id === currentTurn.professionalId)?.name.split(' ')[0]}</span>
                </div>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <button onClick={onNoShow} className="flex-1 bg-slate-950 border border-red-500/30 text-red-500 font-black py-4.5 rounded-2xl text-[10px] uppercase tracking-widest">Faltou</button>
                  <button onClick={onCallNext} className="flex-[2.5] bg-white text-slate-950 font-black py-4.5 rounded-2xl shadow-2xl text-[11px] uppercase tracking-widest active:scale-95 transition-all">Concluir & Próximo</button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* LISTA DE ESPERA */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-3">Fila de Espera</h2>
        <div className="space-y-3.5">
          {waitingList.map((item, index) => {
            const clientWait = getClientWaitTime(item);
            const pro = professionals.find(p => p.id === item.professionalId);
            const proName = pro ? pro.name.split(' ')[0] : 'Qualquer um';
            
            return (
              <div key={item.id} className={`bg-slate-900 border border-slate-800 rounded-[32px] p-6 flex items-center justify-between transition-all group hover:border-slate-700 shadow-lg ${item.professionalId === 'any' ? 'border-teal-500/30' : ''}`}>
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${item.professionalId === 'any' ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-teal-400'}`}>{index + 1}</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-[17px] leading-none uppercase tracking-tight">{item.name}</h4>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{item.service}</p>
                      <span className="w-1 h-1 bg-slate-700 rounded-full" />
                      <div className="flex items-center gap-1.5">
                        {item.professionalId === 'any' ? <Zap size={11} className="text-teal-500" /> : <UserIcon size={11} className="text-indigo-400" />}
                        <span className="text-[10px] text-slate-400 font-black uppercase">{proName}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="text-[11px] text-white font-black">{formatDuration(clientWait)}</span>
                  <p className="text-[8px] text-slate-600 font-black uppercase tracking-tighter">Espera</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {!isAdmin && estStatus === 'open' && (
        <button 
          onClick={onOpenJoinModal} 
          className="w-full font-black py-7 rounded-[32px] flex items-center justify-center gap-4 shadow-2xl transition-all uppercase text-[11px] tracking-[0.2em] bg-teal-500 text-slate-950 shadow-teal-500/20 hover:bg-teal-400 active:scale-95"
        >
          <CheckCircle size={22} /> Entrar no Portal do Cliente
        </button>
      )}
    </div>
  );
};
