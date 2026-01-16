
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

  // Cálculo de tempo médio de espera (25 mins por cliente na fila dividido pelos barbeiros ativos)
  const averageWaitTime = useMemo(() => {
    const waitingCount = queue.filter(i => i.status === 'waiting').length;
    if (waitingCount === 0) return 0;
    const proCount = activePros.length || 1;
    return Math.round((waitingCount * 25) / proCount);
  }, [queue, activePros]);

  return (
    <div className="fixed inset-0 z-[1000] bg-[#050810] flex flex-col p-10 text-white animate-in fade-in duration-1000 overflow-hidden">
      
      {/* HEADER TV - MODERNO E GRANDE */}
      <header className="flex items-center justify-between mb-12 bg-slate-900/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 animate-float">{LOGO_SVG}</div>
          <div>
            <h1 className="text-4xl font-black font-orbitron tracking-tighter neon-text uppercase leading-none">{establishmentName}</h1>
            <p className="text-sm text-slate-500 font-black uppercase tracking-[0.5em] mt-2">Painel de Monitoramento de Fila</p>
          </div>
        </div>

        <div className="flex items-center gap-12">
          {/* TEMPO DE ESPERA */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-3 text-teal-400 mb-1">
               <TrendingUp size={20} />
               <span className="text-xs font-black uppercase tracking-widest">Espera Estimada</span>
            </div>
            <div className="text-4xl font-black text-white font-orbitron">
              {averageWaitTime === 0 ? 'SEM FILA' : `${averageWaitTime} MIN`}
            </div>
          </div>

          {/* RELÓGIO */}
          <div className="flex items-center gap-4 bg-slate-950 px-8 py-5 rounded-[32px] border border-white/10 shadow-2xl">
            <Clock className="text-indigo-400" size={32} />
            <div className="text-5xl font-black font-mono tracking-tighter text-indigo-100">
              {new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>

          <button onClick={onClose} className="p-3 bg-slate-800 rounded-2xl text-slate-600 hover:text-red-500 transition-colors">
            <MonitorOff size={24} />
          </button>
        </div>
      </header>

      {/* GRADE DE PROFISSIONAIS */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 overflow-hidden">
        {activePros.map(pro => {
          const serving = queue.find(i => i.status === 'serving' && i.professionalId === pro.id);
          const waiting = queue.filter(i => i.status === 'waiting' && i.professionalId === pro.id).slice(0, 3);
          const isBusy = pro.status === 'busy' || !!serving;

          return (
            <div key={pro.id} className={`flex flex-col h-full bg-slate-900/30 border-2 rounded-[50px] overflow-hidden transition-all duration-500 ${isBusy ? 'border-teal-500/30 shadow-[0_0_40px_rgba(45,212,191,0.05)]' : 'border-slate-800'}`}>
               
               {/* Cabeçalho do Barbeiro */}
               <div className={`p-8 flex items-center justify-between ${isBusy ? 'bg-teal-500/10' : 'bg-slate-800/50'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isBusy ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20' : 'bg-slate-700 text-white'}`}>
                      <User size={24} />
                    </div>
                    <h3 className="font-black text-2xl uppercase tracking-tighter">{pro.name}</h3>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isBusy ? 'bg-teal-500 text-slate-950' : 'bg-slate-700 text-white'}`}>
                    {isBusy ? 'Ativo' : 'Livre'}
                  </div>
               </div>

               {/* Área de Atendimento Atual - DESTAQUE TOTAL */}
               <div className="p-8 flex-1 flex flex-col gap-6">
                 <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={14} className="text-teal-400" /> Atendimento Agora:
                 </div>
                 
                 {serving ? (
                   <div className="bg-gradient-to-br from-teal-500 to-indigo-600 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group animate-in zoom-in duration-500">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                         <User size={80} />
                      </div>
                      <div className="relative z-10">
                        <h4 className="text-4xl font-black text-white uppercase tracking-tighter drop-shadow-lg">{serving.name.split(' ')[0]}</h4>
                        <div className="flex items-center gap-2 mt-2">
                           <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{serving.service}</span>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 h-1 bg-white/40 animate-pulse w-full" />
                   </div>
                 ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-slate-800 border-2 border-dashed border-slate-800 rounded-[40px] p-8">
                      <Zap size={48} className="mb-4 opacity-10" />
                      <p className="text-xs font-black uppercase tracking-[0.3em] opacity-30">Cadeira Livre</p>
                   </div>
                 )}

                 {/* Próximos na Fila do Profissional */}
                 <div className="space-y-3">
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Próximos:</div>
                    {waiting.map((item, idx) => (
                      <div key={item.id} className="bg-slate-900/50 p-5 rounded-3xl flex items-center justify-between border border-white/5 transition-all hover:bg-slate-900">
                        <div className="flex items-center gap-4">
                           <span className="w-8 h-8 bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center text-xs font-black">{idx + 1}º</span>
                           <span className="text-lg font-bold uppercase text-white/90">{item.name.split(' ')[0]}</span>
                        </div>
                        <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{item.service}</span>
                      </div>
                    ))}
                    {waiting.length === 0 && !serving && (
                      <p className="text-center text-[10px] text-slate-700 font-black uppercase py-6 tracking-widest">Nenhum agendamento</p>
                    )}
                 </div>
               </div>
            </div>
          );
        })}

        {/* FILA GERAL - SEM PREFERÊNCIA */}
        {generalWaiting.length > 0 && (
          <div className="flex flex-col h-full bg-indigo-600/5 border-2 border-dashed border-indigo-500/20 rounded-[50px] overflow-hidden">
             <div className="p-8 bg-indigo-600/10 border-b border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                    <BellRing size={24} />
                  </div>
                  <h3 className="font-black text-2xl uppercase tracking-tighter">Fila Geral</h3>
                </div>
                <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Sem Preferência</span>
             </div>
             <div className="p-8 space-y-4">
                {generalWaiting.slice(0, 8).map((item, idx) => (
                  <div key={item.id} className="bg-slate-900 p-5 rounded-3xl flex items-center justify-between border border-white/5 animate-in slide-in-from-right duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="flex items-center gap-5">
                       <span className="w-8 h-8 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center text-xs font-black">{idx + 1}º</span>
                       <span className="text-xl font-bold uppercase text-white">{item.name.split(' ')[0]}</span>
                    </div>
                    <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{item.service}</span>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      <footer className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center opacity-40">
        <div className="flex items-center gap-4">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <p className="text-xs font-black uppercase tracking-[0.4em] font-orbitron">FILA LIVRE • PERFORMANCE SYSTEM</p>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em]">Sincronização em Tempo Real • Atendimento Inteligente</p>
      </footer>
    </div>
  );
};
