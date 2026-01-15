
import React, { useEffect, useState } from 'react';
import { LOGO_SVG } from '../constants';
import { QueueItem, Professional } from '../types';
import { User, Timer, QrCode, MonitorOff, BellRing, ChevronRight, Zap } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 z-[1000] bg-[#050810] flex flex-col p-8 text-white animate-in fade-in duration-1000 overflow-hidden">
      
      {/* HEADER TV REDUZIDO */}
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16">{LOGO_SVG}</div>
          <div>
            <h1 className="text-3xl font-black font-orbitron tracking-tighter neon-text uppercase leading-none">{establishmentName}</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.5em] mt-1">Painel Multi-Profissionais</p>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-4xl font-black font-mono tracking-tighter opacity-80">
            {new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button onClick={onClose} className="p-2 bg-slate-900 rounded-xl text-slate-700 hover:text-red-500 transition-colors">
            <MonitorOff size={20} />
          </button>
        </div>
      </header>

      {/* GRADE DE PROFISSIONAIS */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-hidden">
        {activePros.map(pro => {
          const serving = queue.find(i => i.status === 'serving' && i.professionalId === pro.id);
          const waiting = queue.filter(i => i.status === 'waiting' && i.professionalId === pro.id).slice(0, 3);
          const isBusy = pro.status === 'busy' || serving;

          return (
            <div key={pro.id} className="flex flex-col h-full bg-slate-900/20 border border-slate-800 rounded-[40px] overflow-hidden">
               {/* Cabeçalho do Barbeiro */}
               <div className={`p-6 border-b border-slate-800 flex items-center justify-between ${isBusy ? 'bg-indigo-600/10' : 'bg-emerald-500/10'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBusy ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-slate-950'}`}>
                      <User size={20} />
                    </div>
                    <h3 className="font-black text-lg uppercase tracking-tighter">{pro.name}</h3>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${isBusy ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-slate-950'}`}>
                    {isBusy ? 'Em Serviço' : 'Disponível'}
                  </div>
               </div>

               {/* Área de Atendimento Atual */}
               <div className="p-6 flex-1 flex flex-col gap-4">
                 <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Agora:</div>
                 {serving ? (
                   <div className="bg-white/5 border border-white/10 p-6 rounded-3xl animate-pulse">
                      <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{serving.name.split(' ')[0]}</h4>
                      <p className="text-[10px] text-teal-400 font-bold uppercase mt-1">{serving.service}</p>
                   </div>
                 ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-slate-800 border-2 border-dashed border-slate-800 rounded-3xl p-6">
                      <Zap size={32} className="mb-2 opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Vazio</p>
                   </div>
                 )}

                 {/* Lista de Espera do Barbeiro */}
                 <div className="mt-4 space-y-2">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Próximos:</div>
                    {waiting.map((item, idx) => (
                      <div key={item.id} className="bg-slate-900/50 p-4 rounded-2xl flex items-center justify-between border border-slate-800/50">
                        <div className="flex items-center gap-3">
                           <span className="text-teal-500 font-black text-xs">{idx + 1}º</span>
                           <span className="text-sm font-bold uppercase text-white/80">{item.name.split(' ')[0]}</span>
                        </div>
                        <span className="text-[8px] text-slate-600 font-black uppercase">{item.service}</span>
                      </div>
                    ))}
                    {waiting.length === 0 && !serving && (
                      <p className="text-center text-[8px] text-slate-700 font-black uppercase py-4">Fila Vazia</p>
                    )}
                 </div>
               </div>
            </div>
          );
        })}

        {/* COLUNA DE FILA GERAL (Sempre visível se houver gente) */}
        {generalWaiting.length > 0 && (
          <div className="flex flex-col h-full bg-amber-500/5 border-2 border-dashed border-amber-500/20 rounded-[40px] overflow-hidden">
             <div className="p-6 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center">
                    <BellRing size={20} />
                  </div>
                  <h3 className="font-black text-lg uppercase tracking-tighter">Fila Geral</h3>
                </div>
                <span className="bg-amber-500 text-slate-950 px-3 py-1 rounded-full text-[8px] font-black uppercase">Sem Preferência</span>
             </div>
             <div className="p-6 space-y-3">
                {generalWaiting.slice(0, 8).map((item, idx) => (
                  <div key={item.id} className="bg-slate-900 p-4 rounded-2xl flex items-center justify-between border border-slate-800 animate-in slide-in-from-right">
                    <div className="flex items-center gap-4">
                       <span className="w-6 h-6 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                       <span className="text-sm font-bold uppercase text-white">{item.name.split(' ')[0]}</span>
                    </div>
                    <span className="text-[8px] text-slate-500 font-black uppercase">{item.service}</span>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      <footer className="mt-8 border-t border-slate-800 pt-6 flex justify-between items-center opacity-30">
        <p className="text-xs font-bold uppercase tracking-widest font-orbitron">FILA LIVRE • MULTI-PROFISSIONAL SYSTEM</p>
        <p className="text-xs font-bold uppercase tracking-widest">Aguardando Próximo Barbeiro Livre</p>
      </footer>
    </div>
  );
};
