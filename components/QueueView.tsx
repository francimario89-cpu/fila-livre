
import React, { useState, useEffect, useMemo } from 'react';
import { QueueItem, EstStatus, Professional, Service, BookingModel, DaySchedule } from '../types';
import { CheckCircle, Coffee, DoorClosed, Zap, UserPlus, Trash2, BellRing, RefreshCw, Scissors, ArrowRight, CheckCircle2, UserX, Clock, Calendar, QrCode, Copy, Check, AlertCircle, UserCog, Sparkles, Megaphone } from 'lucide-react';

interface QueueViewProps {
  queue: QueueItem[];
  isAdmin: boolean;
  isStaff?: boolean;
  userRole?: 'admin' | 'staff' | 'client';
  myProId?: string;
  currentUserEmail?: string;
  estStatus: EstStatus;
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
  queue, isAdmin, isStaff, userRole, myProId, currentUserEmail, estStatus, openingHours, pixKey, professionals, services, dailySchedules, onCallNext, onFinish, onNoShow, onOpenJoinModal, onLeaveQueue, onUpdateProfessional
}) => {
  const [filterPro, setFilterPro] = useState<'all' | string>('all');
  const [copied, setCopied] = useState(false);
  const [isChangingPro, setIsChangingPro] = useState<string | null>(null);

  const availableProsNames = useMemo(() => {
    return professionals
      .filter(p => p.status === 'available')
      .map(p => p.name)
      .join(', ');
  }, [professionals]);

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

  const currentTurn = filteredQueue.find(item => item.status === 'serving');
  const waitingList = filteredQueue.filter(item => item.status === 'waiting');

  const todaySchedule = useMemo(() => {
    const today = new Date().getDay();
    if (dailySchedules && dailySchedules[today]) return dailySchedules[today];
    return null;
  }, [dailySchedules]);

  const handleCopyPix = () => {
    if (!pixKey) return;
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isTodayClosed = todaySchedule && !todaySchedule.isOpen;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      
      {/* AVISO GLOBAL DE DISPONIBILIDADE COM NOMES - ATUALIZA DINAMICAMENTE */}
      {availableProsNames.length > 0 && estStatus === 'open' && (
        <div className="bg-amber-400 border-2 border-amber-300 p-4 rounded-[24px] shadow-lg shadow-amber-500/10 flex items-center gap-4 animate-bounce-subtle">
           <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-amber-400 shrink-0">
              <Megaphone size={20} />
           </div>
           <div className="flex-1">
              <p className="text-[10px] font-black text-slate-950 uppercase tracking-tighter leading-none">Vaga Aberta!</p>
              <p className="text-xs font-black text-slate-900 uppercase tracking-widest leading-tight">
                {availableProsNames} {professionals.filter(p => p.status === 'available').length > 1 ? 'estão disponíveis' : 'está disponível'} agora!
              </p>
           </div>
           <Sparkles size={18} className="text-slate-900 opacity-30 shrink-0" />
        </div>
      )}

      {/* Filtros de Atendentes */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
         <button onClick={() => setFilterPro('all')} className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterPro === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}>Visão Geral</button>
         {professionals.filter(p => p.status !== 'absent').map(pro => {
           const isAvailable = pro.status === 'available';
           return (
             <button 
               key={pro.id} 
               onClick={() => setFilterPro(pro.id)} 
               className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all relative border ${
                 filterPro === pro.id 
                 ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 border-amber-400' 
                 : isAvailable 
                   ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                   : 'bg-slate-900 text-slate-500 border-slate-800'
               }`}
             >
               {pro.name}
               {isAvailable && (
                 <span className="absolute -top-1 -right-1 flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                 </span>
               )}
             </button>
           );
         })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-5 rounded-[32px] border-2 flex flex-col shadow-lg transition-all ${
          isTodayClosed ? 'bg-red-500/10 border-red-500/20 text-red-500' :
          estStatus === 'open' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
          estStatus === 'lunch' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 
          'bg-slate-800/10 border-slate-800 text-slate-600'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/5 rounded-2xl">
                {isTodayClosed ? <UserX size={22} /> : 
                 estStatus === 'open' ? <CheckCircle size={22} /> : 
                 estStatus === 'lunch' ? <Coffee size={22} /> : 
                 <DoorClosed size={22} />}
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest leading-none">
                  {isTodayClosed ? 'Fechado Hoje' : estStatus === 'open' ? 'Em Atendimento' : estStatus === 'lunch' ? 'Pausa Almoço' : 'Fechado'}
                </h4>
              </div>
            </div>
          </div>
        </div>

        {pixKey && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-[32px] flex items-center justify-between shadow-lg group">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-2xl"><QrCode size={22} /></div>
              <div><h4 className="text-[10px] font-black text-white uppercase tracking-widest">Pagamento</h4></div>
            </div>
            <button onClick={handleCopyPix} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${copied ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-teal-400'}`}>
              {copied ? 'OK!' : 'Chave PIX'}
            </button>
          </div>
        )}
      </div>

      {currentTurn && (
        <section className="bg-indigo-600 rounded-[40px] p-8 shadow-2xl relative overflow-hidden animate-in zoom-in duration-500">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Zap size={120} /></div>
          <div className="relative z-10 space-y-5">
            <span className="bg-white/20 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Atendimento Atual</span>
            <h3 className="text-4xl font-black text-white uppercase tracking-tighter">{currentTurn.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-100 uppercase">{currentTurn.service}</span>
              <span className="w-1 h-1 bg-white/30 rounded-full"/>
              <span className="text-xs font-black text-white uppercase">{professionals.find(p => p.id === currentTurn.professionalId)?.name}</span>
            </div>
            {(isAdmin || (isStaff && currentTurn.professionalId === myProId)) && (
              <div className="flex gap-2 pt-2">
                <button onClick={() => onNoShow?.(currentTurn.id)} className="p-4 bg-red-500 text-white rounded-2xl shadow-lg active:scale-95 transition-all"><UserX size={20} /></button>
                <button onClick={() => onFinish?.(currentTurn)} className="flex-1 bg-white text-indigo-600 font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2"><CheckCircle2 size={18} /> Finalizar Serviço</button>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">Próximos na Lista</h2>
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
                      {item.missedCount && item.missedCount > 0 && (
                        <p className="text-[8px] text-red-400 font-black uppercase mt-1 animate-pulse">
                          {item.missedCount} {item.missedCount === 1 ? 'Ausência' : 'Ausências'} registrada(s)
                        </p>
                      )}
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

                {isMe && item.status === 'waiting' && (
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><Sparkles size={10} className="text-teal-400" /> Opções de Migração</p>
                    <button onClick={() => setIsChangingPro(isChangingPro === item.id ? null : item.id)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${isChangingPro === item.id ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-teal-400'}`}>
                      Mudar Atendente
                    </button>
                    {isChangingPro === item.id && (
                      <div className="absolute top-full left-0 right-0 mt-2 grid grid-cols-2 gap-2 bg-slate-900 p-4 rounded-3xl z-50 shadow-2xl border border-white/5">
                        <button onClick={() => { onUpdateProfessional?.(item.id, 'any'); setIsChangingPro(null); }} className="py-2 rounded-xl text-[8px] font-black uppercase border border-slate-800 text-white">Primeiro Livre</button>
                        {professionals.filter(p => p.status !== 'absent').map(p => (
                          <button key={p.id} onClick={() => { onUpdateProfessional?.(item.id, p.id); setIsChangingPro(null); }} className="py-2 rounded-xl text-[8px] font-black uppercase border border-slate-800 text-white">{p.name}</button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40">
        {(isAdmin || isStaff) ? (
          <div className="flex gap-3">
            <button onClick={onOpenJoinModal} className="w-16 h-16 bg-slate-100 text-slate-950 rounded-[24px] shadow-2xl flex items-center justify-center transition-all border-2 border-slate-950"><UserPlus size={24} /></button>
            <button onClick={() => onCallNext?.()} className="flex-1 bg-indigo-600 text-white font-black py-6 rounded-[32px] shadow-2xl uppercase text-[11px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3"><BellRing size={20} /> Chamar Próximo</button>
          </div>
        ) : (
          !isTodayClosed && estStatus === 'open' && <button onClick={onOpenJoinModal} className="w-full bg-teal-500 text-slate-950 font-black py-7 rounded-[32px] shadow-2xl uppercase text-[11px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3"><Zap size={20} /> Entrar na Lista</button>
        )}
      </div>
    </div>
  );
};
