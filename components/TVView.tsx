
import React, { useEffect, useState, useMemo } from 'react';
import { LOGO_SVG } from '../constants';
import { QueueItem, Professional } from '../types';
import { User, Timer, QrCode, MonitorOff, BellRing, ChevronRight, Zap, Clock, TrendingUp } from 'lucide-react';

interface TVViewProps {
  queue: QueueItem[];
  professionals: Professional[];
  establishmentName: string;
  onClose: () => void;
}

export const TVView: React.FC<TVViewProps> = ({ queue, professionals, establishmentName, onClose }) => {
  const [now, setNow] = useState(Date.now());
  const [lastCalledId, setLastCalledId] = useState<string | null>(null);

  const activePros = professionals.filter(p => p.status !== 'absent');
  const generalWaiting = queue.filter(i => i.status === 'waiting' && i.professionalId === 'any');

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    try { document.documentElement.requestFullscreen(); } catch(e) {}
    return () => {
      clearInterval(timer);
      try { if (document.fullscreenElement) document.exitFullscreen(); } catch(e) {}
    };
  }, []);

  // Monitorar quem foi chamado por último para efeito visual
  useEffect(() => {
    const serving = queue.filter(i => i.status === 'serving').sort((a,b) => b.timestamp - a.timestamp);
    if (serving.length > 0) {
      setLastCalledId(serving[0].id);
      // O destaque dura 10 segundos
      const timeout = setTimeout(() => setLastCalledId(null), 10000);
      return () => clearTimeout(timeout);
    }
  }, [queue]);

  const averageWaitTime = useMemo(() => {
    const waitingCount = queue.filter(i => i.status === 'waiting').length;
    if (waitingCount === 0) return 0;
    const proCount = activePros.length || 1;
    return Math.round((waitingCount * 25) / proCount);
  }, [queue, activePros]);

  return (
    <div className="fixed inset-0 z-[1000] bg-[#020408] flex flex-col p-6 text-white animate-in fade-in duration-1000 overflow-hidden">
      
      {/* HEADER TV - MAIS COMPACTO */}
      <header className="flex items-center justify-between mb-6 bg-slate-900/20 p-4 rounded-[24px] border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12">{LOGO_SVG}</div>
          <div>
            <h1 className="text-2xl font-black font-orbitron tracking-tighter neon-text uppercase leading-none">{establishmentName}</h1>
            <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.4em] mt-1">Sincronização em tempo real</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[7px] font-black uppercase tracking-widest text-teal-400">Espera Estimada</span>
            <div className="text-xl font-black text-white font-orbitron">
              {averageWaitTime === 0 ? 'LIVRE' : `${averageWaitTime} MIN`}
            </div>
          </div>

          <div className="text-3xl font-black font-mono tracking-tighter text-indigo-400 bg-slate-950 px-5 py-2 rounded-xl border border-white/5">
            {new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          <button onClick={onClose} className="p-2 bg-slate-800 rounded-xl text-slate-600 hover:text-red-500 transition-colors">
            <MonitorOff size={18} />
          </button>
        </div>
      </header>

      {/* GRADE DE PROFISSIONAIS - MAIS COLUNAS, FONTES MENORES */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-hidden">
        {activePros.map(pro => {
          const serving = queue.find(i => i.status === 'serving' && i.professionalId === pro.id);
          const waiting = queue.filter(i => i.status === 'waiting' && (i.professionalId === pro.id || (i.professionalId === 'any' && !serving))).slice(0, 6);
          const isBusy = !!serving;
          const isLastCalled = serving && serving.id === lastCalledId;

          return (
            <div key={pro.id} className={`flex flex-col h-full bg-slate-900/10 border rounded-[32px] overflow-hidden transition-all duration-700 ${isBusy ? 'border-teal-500/20' : 'border-slate-800/40'}`}>
               
               {/* Cabeçalho Profissional - Compacto */}
               <div className={`p-4 flex items-center gap-3 ${isBusy ? 'bg-teal-500/5' : 'bg-slate-800/20'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isBusy ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
                    <User size={16} />
                  </div>
                  <h3 className="font-black text-sm uppercase tracking-tighter truncate">{pro.name}</h3>
               </div>

               {/* Área de Atendimento - MUDA DE COR QUANDO CHAMA */}
               <div className="p-3 flex-1 flex flex-col gap-3">
                 <div className="text-[7px] font-black text-slate-600 uppercase tracking-widest px-1">Atendimento:</div>
                 
                 {serving ? (
                   <div className={`p-4 rounded-[20px] shadow-xl relative overflow-hidden transition-all duration-1000 ${
                     isLastCalled 
                     ? 'bg-yellow-400 text-slate-950 animate-pulse scale-[1.02] shadow-yellow-500/40' 
                     : 'bg-indigo-600 text-white'
                   }`}>
                      <div className="relative z-10">
                        <h4 className="text-lg font-black uppercase tracking-tighter truncate">{serving.name}</h4>
                        <p className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${isLastCalled ? 'text-slate-900/60' : 'text-indigo-200'}`}>
                          {serving.service}
                        </p>
                      </div>
                      {isLastCalled && (
                        <div className="absolute -right-2 -bottom-2 opacity-20">
                           <BellRing size={40} />
                        </div>
                      )}
                   </div>
                 ) : (
                   <div className="h-16 flex flex-col items-center justify-center text-slate-800 border-2 border-dashed border-slate-800/40 rounded-[20px]">
                      <span className="text-[7px] font-black uppercase tracking-widest opacity-20">LIVRE</span>
                   </div>
                 )}

                 {/* Próximos - Lista Resumida */}
                 <div className="space-y-1.5 mt-1 overflow-y-auto custom-scrollbar">
                    {waiting.map((item, idx) => (
                      <div key={item.id} className="bg-slate-900/40 p-2.5 rounded-xl flex items-center justify-between border border-white/5 animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 truncate">
                           <span className="text-[9px] font-black text-slate-600">{idx + 1}º</span>
                           <span className="text-[11px] font-bold uppercase text-white/80 truncate">{item.name}</span>
                        </div>
                        <span className="text-[7px] text-slate-500 font-black uppercase whitespace-nowrap ml-2">{item.service.slice(0, 10)}</span>
                      </div>
                    ))}
                    {waiting.length === 0 && !serving && (
                      <p className="text-center text-[7px] text-slate-800 font-black uppercase py-4">Vazio</p>
                    )}
                 </div>
               </div>
            </div>
          );
        })}
      </div>

      <footer className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center opacity-30">
        <div className="flex items-center gap-3">
           <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
           <p className="text-[8px] font-black uppercase tracking-[0.4em] font-orbitron">FILA LIVRE PERFORMANCE</p>
        </div>
        <p className="text-[8px] font-bold uppercase tracking-[0.2em]">Sincronização Cloud • {activePros.length} atendentes ativos</p>
      </footer>
    </div>
  );
};
