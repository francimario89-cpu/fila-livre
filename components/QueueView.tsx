
import React, { useState, useEffect, useMemo } from 'react';
import { QueueItem, EstStatus, Professional, Service, BookingModel } from '../types';
import { CheckCircle, Coffee, DoorClosed, Zap, UserPlus, Trash2, BellRing, RefreshCw, Scissors, ArrowRight } from 'lucide-react';

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
  onSwitchQueue?: (queueId: string, newProId: string) => void;
}

export const QueueView: React.FC<QueueViewProps> = ({ 
  queue, isAdmin, currentUserEmail, estStatus, professionals, services, onCallNext, onNoShow, onOpenJoinModal, onLeaveQueue, onSwitchQueue 
}) => {
  const [now, setNow] = useState(Date.now());
  const [filterPro, setFilterPro] = useState<'all' | string>('all');

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Identificar se o usuário logado está na fila e qual barbeiro escolheu
  const myQueueItem = useMemo(() => queue.find(i => i.userEmail === currentUserEmail && i.status === 'waiting'), [queue, currentUserEmail]);

  // Lógica de Sugestão de Troca: Se eu estou esperando Barbeiro A, mas Barbeiro B está livre e sem fila.
  const switchSuggestion = useMemo(() => {
    if (!myQueueItem || isAdmin) return null;
    
    // Procura por profissionais que: não estão atendendo ninguém E não tem ninguém na sua fila específica E não são o meu barbeiro atual
    const freePros = professionals.filter(pro => {
      if (pro.id === myQueueItem.professionalId || pro.status === 'absent') return false;
      const isServing = queue.some(i => i.status === 'serving' && i.professionalId === pro.id);
      const hasWaiting = queue.some(i => i.status === 'waiting' && i.professionalId === pro.id);
      return !isServing && !hasWaiting;
    });

    return freePros.length > 0 ? freePros[0] : null;
  }, [myQueueItem, professionals, queue, isAdmin]);

  const filteredQueue = useMemo(() => {
    if (filterPro === 'all') return queue;
    return queue.filter(i => i.professionalId === filterPro || i.professionalId === 'any');
  }, [queue, filterPro]);

  const currentTurn = filteredQueue.find(item => item.status === 'serving');
  const waitingList = filteredQueue.filter(item => item.status === 'waiting');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32">
      
      {/* SELETOR DE FILA (PARA CLIENTE VER SÓ O DELE OU TUDO) */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
         <button 
          onClick={() => setFilterPro('all')} 
          className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterPro === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}
         >
           Visão Geral
         </button>
         {professionals.filter(p => p.status !== 'absent').map(pro => (
           <button 
            key={pro.id} 
            onClick={() => setFilterPro(pro.id)}
            className={`flex-shrink-0 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filterPro === pro.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}
           >
             {pro.name}
           </button>
         ))}
      </div>

      {/* BANNER DE SUGESTÃO DE TROCA */}
      {switchSuggestion && myQueueItem && (
        <div className="bg-amber-500 rounded-[32px] p-6 shadow-2xl animate-bounce-subtle flex items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-slate-950">
                 <Scissors size={24} />
              </div>
              <div>
                 <h4 className="text-sm font-black text-slate-950 uppercase leading-none">Vaga Aberta!</h4>
                 <p className="text-[10px] text-slate-900 font-bold uppercase mt-1">O Barbeiro {switchSuggestion.name} está livre.</p>
              </div>
           </div>
           <button 
            onClick={() => onSwitchQueue?.(myQueueItem.id, switchSuggestion.id)}
            className="bg-slate-950 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2"
           >
             Mudar Fila <ArrowRight size={14} />
           </button>
        </div>
      )}

      {/* STATUS BANNER */}
      <div className={`p-5 rounded-[32px] border-2 flex items-center justify-between shadow-lg transition-all ${estStatus === 'open' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : estStatus === 'lunch' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/5 rounded-2xl">
            {estStatus === 'open' ? <CheckCircle size={22} /> : estStatus === 'lunch' ? <Coffee size={22} /> : <DoorClosed size={22} />}
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest">{estStatus === 'open' ? 'Estamos Abertos' : estStatus === 'lunch' ? 'Pausa' : 'Fechado'}</h4>
            <p className="text-[8px] font-bold uppercase opacity-60 tracking-tighter">
              {estStatus === 'open' ? (filterPro === 'all' ? 'Todas as filas disponíveis' : `Fila de ${professionals.find(p => p.id === filterPro)?.name}`) : 'Volte mais tarde'}
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
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">
          {filterPro === 'all' ? 'Próximos na Fila Geral' : `Próximos para ${professionals.find(p => p.id === filterPro)?.name}`}
        </h2>
        <div className="space-y-3">
          {waitingList.map((item, index) => {
            const isMe = item.userEmail === currentUserEmail;

            return (
              <div key={item.id} className={`bg-slate-900 border ${isMe ? 'border-teal-500/50 bg-teal-500/5' : 'border-slate-800'} rounded-[32px] p-6 flex items-center justify-between shadow-lg`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${index === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-teal-400'}`}>{index + 1}</div>
                  <div>
                    <h4 className="font-black text-white text-lg uppercase leading-none">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[9px] text-slate-500 font-bold uppercase">{item.service}</p>
                      <span className="w-1 h-1 bg-slate-800 rounded-full" />
                      <p className="text-[9px] text-indigo-400 font-bold uppercase">
                        {item.professionalId === 'any' ? 'Qualquer um' : professionals.find(p => p.id === item.professionalId)?.name}
                      </p>
                    </div>
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
                    isMe && (
                      <button onClick={() => onLeaveQueue?.(item.id)} className="text-red-500 text-[8px] font-black uppercase tracking-widest border border-red-500/20 px-3 py-1.5 rounded-lg">Sair da Fila</button>
                    )
                  )}
                </div>
              </div>
            );
          })}
          {waitingList.length === 0 && <p className="text-center py-10 text-slate-700 text-[10px] font-black uppercase tracking-widest">Ninguém esperando {filterPro === 'all' ? 'nesta loja' : 'este barbeiro'}</p>}
        </div>
      </section>

      {/* BOTÃO DE AÇÃO FLUTUANTE */}
      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40">
        {isAdmin ? (
          <div className="flex gap-3">
            <button 
              onClick={onOpenJoinModal} 
              className="w-16 h-16 bg-teal-500 text-slate-950 rounded-[24px] shadow-2xl flex items-center justify-center transition-all active:scale-90 border-2 border-slate-950"
            >
              <UserPlus size={24} />
            </button>
            <button 
              onClick={() => onCallNext?.()} 
              className="flex-1 bg-indigo-600 text-white font-black py-6 rounded-[32px] shadow-2xl shadow-indigo-500/20 uppercase text-[11px] tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <BellRing size={20} /> Chamar Próximo
            </button>
          </div>
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
