
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { QueueItem, EstStatus, Professional, Service, BookingModel } from '../types';
import { Clock, User as UserIcon, CheckCircle, ClipboardList, Coffee, DoorClosed, UserX, Lock, Timer, Calendar, Zap, ArrowRightLeft, LogOut, BellRing, Volume2, Info } from 'lucide-react';
import { formatDuration } from './JoinQueueModal';

interface QueueViewProps {
  queue: QueueItem[];
  isAdmin: boolean;
  currentUserEmail?: string;
  estStatus: EstStatus;
  bookingModel: BookingModel;
  openingHours?: string;
  professionals: Professional[];
  services: Service[];
  onCallNext?: () => void;
  onNoShow?: () => void;
  onOpenJoinModal?: () => void;
  onLeaveQueue?: (id: string) => void;
}

export const QueueView: React.FC<QueueViewProps> = ({ 
  queue, isAdmin, currentUserEmail, estStatus, bookingModel, professionals, services, onCallNext, onNoShow, onOpenJoinModal, onLeaveQueue 
}) => {
  const [now, setNow] = useState(Date.now());
  const lastStatusRef = useRef<Record<string, string>>({});
  const lastPositionRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Ativar Wake Lock para tentar manter a tela acesa
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          console.log("Wake Lock bloqueado pelo sistema.");
        }
      }
    };
    if (!isAdmin) requestWakeLock();
    return () => {
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, [isAdmin]);

  const playAlert = (type: 'called' | 'next_soon') => {
    if (!audioContextRef.current || audioContextRef.current.state === 'suspended') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    
    const playTone = (freq: number, delay: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration + 0.1);
    };

    if (type === 'called') {
      // 3 Toques fortes (Sua Vez)
      playTone(880, 0, 0.6);
      playTone(880, 0.8, 0.6);
      playTone(880, 1.6, 0.6);
      if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
    } else {
      // 2 Toques suaves (Falta 1)
      playTone(660, 0, 0.3);
      playTone(660, 0.4, 0.3);
      if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
    }
  };

  useEffect(() => {
    const waitingList = queue.filter(i => i.status === 'waiting');
    const myIndex = waitingList.findIndex(i => i.userEmail === currentUserEmail);
    const myItem = queue.find(i => i.userEmail === currentUserEmail);

    // Lógica de Notificação
    if (myItem) {
      // 1. Chamado agora (mudou de waiting para serving)
      if (lastStatusRef.current[myItem.id] === 'waiting' && myItem.status === 'serving') {
        playAlert('called');
        alert("🔔 SUA VEZ! O profissional está te aguardando.");
      }

      // 2. Alerta de "Próximo" (quando chega na posição 2 da fila de espera, ou seja, índice 1)
      if (myIndex === 1 && lastPositionRef.current !== 1) {
        playAlert('next_soon');
        alert("🏃 PREPARE-SE! Falta apenas 1 pessoa para a sua vez. Dirija-se ao local.");
      }

      lastPositionRef.current = myIndex;
    }
    
    queue.forEach(item => { lastStatusRef.current[item.id] = item.status; });
  }, [queue, currentUserEmail]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const currentTurn = queue.find(item => item.status === 'serving');
  const waitingList = queue.filter(item => item.status === 'waiting');

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
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      
      {!isAdmin && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex items-start gap-3">
          <Info size={16} className="text-indigo-400 mt-0.5 shrink-0" />
          <p className="text-[9px] text-slate-400 font-bold uppercase leading-tight">
            Para garantir que o alarme toque, mantenha esta aba do navegador aberta. Evite desligar a tela totalmente.
          </p>
        </div>
      )}

      {isAdmin && waitingList.length > 0 && !currentTurn && (
        <button 
          onClick={onCallNext}
          className="w-full bg-emerald-500 text-slate-950 font-black py-8 rounded-[40px] flex flex-col items-center justify-center gap-2 shadow-2xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all group"
        >
          <BellRing size={32} className="group-hover:animate-bounce" />
          <span className="text-[14px] uppercase tracking-widest">Chamar Próximo Cliente</span>
          <span className="text-[9px] opacity-60 uppercase font-black">Fila: {waitingList.length} aguardando</span>
        </button>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-7 flex items-center justify-between relative overflow-hidden group shadow-2xl">
        <div className="absolute -right-6 -top-6 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
           <Timer size={120} />
        </div>
        <div className="flex items-center gap-5">
          <div className="px-4 py-3 bg-teal-500/10 rounded-2xl flex flex-col items-center justify-center border border-teal-500/20 min-w-[100px]">
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

      {currentTurn && (
        <section className="space-y-4">
          <div className={`bg-gradient-to-br rounded-[40px] p-8 shadow-2xl relative overflow-hidden transition-all duration-700 ${currentTurn.type === 'appointment' ? 'from-indigo-600/90 to-slate-950 border border-indigo-500/30 shadow-indigo-500/20' : 'from-teal-600/90 to-slate-950 border border-teal-500/30 shadow-teal-500/20'}`}>
            <div className="relative z-10 space-y-7">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${currentTurn.type === 'appointment' ? 'bg-indigo-500 text-white' : 'bg-teal-500 text-slate-950'}`}>
                    EM ATENDIMENTO
                  </div>
                  {isAdmin && <Volume2 size={20} className="text-white/20 hover:text-white cursor-pointer" onClick={() => playAlert('called')} />}
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
                  <button onClick={onCallNext} className="flex-[2.5] bg-white text-slate-950 font-black py-4.5 rounded-2xl shadow-2xl text-[11px] uppercase tracking-widest active:scale-95 transition-all">Finalizar & Próximo</button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-3">Fila de Espera</h2>
        <div className="space-y-3.5">
          {waitingList.map((item, index) => {
            const clientWait = getClientWaitTime(item);
            const pro = professionals.find(p => p.id === item.professionalId);
            const proName = pro ? pro.name.split(' ')[0] : 'Qualquer um';
            const isMe = item.userEmail === currentUserEmail;
            const isNext = index === 0;
            const isSoon = index === 1;
            
            return (
              <div key={item.id} className={`bg-slate-900 border border-slate-800 rounded-[32px] p-6 flex items-center justify-between transition-all group hover:border-slate-700 shadow-lg ${isMe ? 'border-teal-500/50 bg-teal-500/5' : ''}`}>
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${isNext ? 'bg-amber-500 text-slate-950 animate-pulse' : (item.professionalId === 'any' ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-teal-400')}`}>
                    {index + 1}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-[17px] leading-none uppercase tracking-tight">
                      {item.name} {isMe && <span className="text-[8px] bg-teal-500 text-slate-950 px-1.5 py-0.5 rounded ml-2 font-black">VOCÊ</span>}
                    </h4>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{item.service}</p>
                      <span className="w-1 h-1 bg-slate-700 rounded-full" />
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-black uppercase ${isNext ? 'text-amber-500' : (isSoon ? 'text-indigo-400' : 'text-slate-400')}`}>
                          {isNext ? 'PRÓXIMO' : (isSoon ? 'PREPARE-SE' : proName)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  {isMe ? (
                    <button 
                      onClick={() => onLeaveQueue?.(item.id)}
                      className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all group"
                      title="Sair da Fila"
                    >
                      <LogOut size={16} />
                      <span className="text-[8px] font-black block mt-1">SAIR</span>
                    </button>
                  ) : (
                    <>
                      <span className="text-[11px] text-white font-black">{formatDuration(clientWait)}</span>
                      <p className="text-[8px] text-slate-600 font-black uppercase tracking-tighter">Espera</p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {waitingList.length === 0 && (
            <div className="text-center py-10 opacity-20 flex flex-col items-center">
              <Coffee size={48} className="mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">Ninguém na fila. Momento de descanso!</p>
            </div>
          )}
        </div>
      </section>

      {!isAdmin && estStatus === 'open' && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40">
           <button 
            onClick={onOpenJoinModal} 
            className="w-full font-black py-7 rounded-[32px] flex items-center justify-center gap-4 shadow-2xl transition-all uppercase text-[11px] tracking-[0.2em] bg-teal-500 text-slate-950 shadow-teal-500/20 hover:bg-teal-400 active:scale-95"
          >
            <CheckCircle size={22} /> Entrar na Fila
          </button>
        </div>
      )}
    </div>
  );
};
