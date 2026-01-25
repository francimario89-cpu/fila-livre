
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

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    try { document.documentElement.requestFullscreen(); } catch(e) {}
    return () => {
      clearInterval(timer);
      try { if (document.fullscreenElement) document.exitFullscreen(); } catch(e) {}
    };
  }, []);

  // Monitorar quem foi chamado por último para efeito visual de 10 segundos
  useEffect(() => {
    const serving = queue.filter(i => i.status === 'serving').sort((a,b) => b.timestamp - a.timestamp);
    if (serving.length > 0) {
      const topServing = serving[0];
      // Verifica se o timestamp de serving é recente (últimos 10 segundos)
      if (Date.now() - topServing.timestamp < 10000) {
        setLastCalledId(topServing.id);
        const timeout = setTimeout(() => setLastCalledId(null), 10000);
        return () => clearTimeout(timeout);
      }
    }
  }, [queue]);

  const averageWaitTime = useMemo(() => {
    const waitingCount = queue.filter(i => i.status === 'waiting').length;
    if (waitingCount === 0) return 0;
    const proCount = activePros.length || 1;
    return Math.round((waitingCount * 25) / proCount);
  }, [queue, activePros]);

  return (
    <div className="fixed inset-0 z-[1000] bg-[#020408] flex flex-col p-4 text-white animate-in fade-in duration-1000 overflow-hidden">
      
      {/* HEADER TV - ULTRACACTO */}
      <header className="flex items-center justify-between mb-4 bg-slate-900/40 p-3 rounded-[20px] border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10">{LOGO_SVG}</div>
          <div>
            <h1 className="text-xl font-black font-orbitron tracking-tighter neon-text uppercase leading-none">{establishmentName}</h1>
            <p className="text-[7px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Status em tempo real</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[6px] font-black uppercase tracking-widest text-teal-400">Espera</span>
            <div className="text-base font-black text-white font-orbitron">
              {averageWaitTime === 0 ? 'LIVRE' : `${averageWaitTime} MIN`}
            </div>
          </div>

          <div className="text-2xl font-black font-mono tracking-tighter text-indigo-400 bg-slate-950 px-4 py-1.5 rounded-lg border border-white/5">
            {new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          <button onClick={onClose} className="p-1.5 bg-slate-800 rounded-lg text-slate-600 hover:text-red-500 transition-colors">
            <MonitorOff size={14} />
          </button>
        </div>
      </header>

      {/* GRADE DE PROFISSIONAIS - ALTA DENSIDADE */}
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 overflow-hidden">
        {activePros.map(pro => {
          const serving = queue.find(i => i.status === 'serving' && i.professionalId === pro.id);
          const waiting = queue.filter(i => i.status === 'waiting' && (i.professionalId === pro.id || (i.professionalId === 'any' && !serving))).slice(0, 8);
          const isBusy = !!serving;
          const isLastCalled = serving && serving.id === lastCalledId;

          return (
            <div key={pro.id} className={`flex flex-col h-full bg-slate-900/10 border rounded-[24px] overflow-hidden transition-all duration-700 ${isBusy ? 'border-teal-500/20' : 'border-slate-800/20'}`}>
               
               {/* Cabeçalho Profissional - Super Compacto */}
               <div className={`p-2.5 flex items-center gap-2 ${isBusy ? 'bg-teal-500/5' : 'bg-slate-800/20'}`}>
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isBusy ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
                    <User size={12} />
                  </div>
                  <h3 className="font-black text-[10px] uppercase tracking-tighter truncate">{pro.name}</h3>
               </div>

               {/* Área de Atendimento - DESTAQUE AMARELO AO CHAMAR */}
               <div className="p-2 flex-1 flex flex-col gap-2">
                 <div className="text-[6px] font-black text-slate-600 uppercase tracking-widest px-1">Agora:</div>
                 
                 {serving ? (
                   <div className={`p-3 rounded-[16px] shadow-lg relative overflow-hidden transition-all duration-1000 ${
                     isLastCalled 
                     ? 'bg-yellow-400 text-slate-950 animate-pulse scale-[1.02] shadow-yellow-500/50' 
                     : 'bg-indigo-600 text-white'
                   }`}>
                      <div className="relative z-10">
                        <h4 className="text-sm font-black uppercase tracking-tighter truncate">{serving.name}</h4>
                        <p className={`text-[7px] font-black uppercase tracking-widest mt-0.5 ${isLastCalled ? 'text-slate-900/60' : 'text-indigo-200'}`}>
                          {serving.service}
                        </p>
                      </div>
                      {isLastCalled && (
                        <div className="absolute -right-1 -bottom-1 opacity-20">
                           <BellRing size={32} />
                        </div>
                      )}
                   </div>
                 ) : (
                   <div className="h-12 flex flex-col items-center justify-center text-slate-800 border-2 border-dashed border-slate-800/20 rounded-[16px]">
                      <span className="text-[6px] font-black uppercase tracking-widest opacity-20">LIVRE</span>
                   </div>
                 )}

                 {/* Próximos - Lista Super Reduzida */}
                 <div className="space-y-1 mt-1 overflow-y-auto custom-scrollbar">
                    {waiting.map((item, idx) => (
                      <div key={item.id} className="bg-slate-900/40 p-2 rounded-lg flex items-center justify-between border border-white/5 animate-in slide-in-from-bottom-1">
                        <div className="flex items-center gap-1.5 truncate">
                           <span className="text-[7px] font-black text-slate-600">{idx + 1}º</span>
                           <span className="text-[9px] font-bold uppercase text-white/70 truncate">{item.name}</span>
                        </div>
                        <span className="text-[6px] text-slate-500 font-black uppercase whitespace-nowrap ml-1">{item.service.slice(0, 8)}</span>
                      </div>
                    ))}
                    {waiting.length === 0 && !serving && (
                      <p className="text-center text-[6px] text-slate-800 font-black uppercase py-4">Vazio</p>
                    )}
                 </div>
               </div>
            </div>
          );
        })}
      </div>

      <footer className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center opacity-20">
        <div className="flex items-center gap-2">
           <div className="w-1 h-1 rounded-full bg-teal-500 animate-pulse" />
           <p className="text-[7px] font-black uppercase tracking-[0.3em] font-orbitron">FILA LIVRE</p>
        </div>
        <p className="text-[6px] font-bold uppercase tracking-[0.1em]">{activePros.length} atendentes online</p>
      </footer>
    </div>
  );
};
