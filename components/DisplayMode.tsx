
import React, { useEffect, useState } from 'react';
import { QueueItem, Professional } from '../types';
import { LOGO_SVG } from '../constants';
import { Monitor, Users, Clock, Zap, Maximize, Minimize } from 'lucide-react';

interface DisplayModeProps {
  queue: QueueItem[];
  professionals: Professional[];
  onExit: () => void;
}

export const DisplayMode: React.FC<DisplayModeProps> = ({ queue, professionals, onExit }) => {
  const [time, setTime] = useState(new Date());
  const serving = queue.filter(i => i.status === 'serving');
  const waiting = queue.filter(i => i.status === 'waiting').slice(0, 5);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] bg-[#050810] flex flex-col p-10 overflow-hidden font-orbitron">
      {/* BACKGROUND DECORATION */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-500/5 blur-[150px] rounded-full -mr-40 -mt-40" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[150px] rounded-full -ml-40 -mb-40" />

      {/* HEADER */}
      <header className="relative z-10 flex justify-between items-center mb-16 border-b border-white/5 pb-10">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 drop-shadow-[0_0_15px_rgba(45,212,191,0.4)]">
            {LOGO_SVG}
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase">FILA LIVRE</h1>
            <p className="text-teal-500 text-sm font-black uppercase tracking-[0.5em]">Painel de Atendimento</p>
          </div>
        </div>

        <div className="flex items-center gap-12 text-right">
          <div className="space-y-1">
             <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Data & Hora</p>
             <h2 className="text-3xl font-black text-white">
                {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
             </h2>
          </div>
          <button onClick={onExit} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all">
            <Minimize size={24} />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex-1 grid grid-cols-12 gap-10">
        
        {/* SERVING NOW (LEFT) */}
        <div className="col-span-7 space-y-8">
          <h3 className="text-slate-500 text-sm font-black uppercase tracking-[0.4em] flex items-center gap-3">
             <Zap size={18} className="text-amber-500" /> Atendendo Agora
          </h3>
          
          <div className="grid grid-cols-1 gap-6">
            {serving.length > 0 ? (
              serving.map((item) => (
                <div key={item.id} className="bg-gradient-to-r from-teal-500/20 to-transparent border-l-8 border-teal-500 p-12 rounded-r-[40px] animate-in slide-in-from-left-8 duration-700 shadow-2xl">
                  <div className="flex justify-between items-start">
                    <div className="space-y-4">
                      <h4 className="text-7xl font-black text-white uppercase tracking-tighter leading-none">{item.name}</h4>
                      <p className="text-2xl font-black text-teal-400 uppercase tracking-widest">{item.service}</p>
                    </div>
                    <div className="text-right space-y-2">
                       <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Profissional</p>
                       <p className="text-2xl font-black text-white uppercase">{professionals.find(p => p.id === item.professionalId)?.name.split(' ')[0] || '---'}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-[40px] text-slate-800">
                 <Clock size={80} strokeWidth={1} />
                 <p className="text-xl font-black uppercase tracking-widest mt-6">Aguardando Próximo...</p>
              </div>
            )}
          </div>
        </div>

        {/* WAITING LIST (RIGHT) */}
        <div className="col-span-5 space-y-8">
          <h3 className="text-slate-500 text-sm font-black uppercase tracking-[0.4em] flex items-center gap-3">
             <Users size={18} className="text-indigo-400" /> Próximos da Fila
          </h3>
          
          <div className="space-y-4">
            {waiting.map((item, index) => (
              <div key={item.id} className="bg-slate-900/50 border border-slate-800 p-8 rounded-[32px] flex items-center justify-between group">
                <div className="flex items-center gap-8">
                  <span className="text-4xl font-black text-slate-800 group-hover:text-teal-500/50 transition-colors">{index + 1}</span>
                  <div>
                    <h5 className="text-2xl font-black text-white uppercase tracking-tighter">{item.name}</h5>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mt-1">{item.service}</p>
                  </div>
                </div>
                <div className="px-5 py-2 bg-slate-950 border border-white/5 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Em Espera
                </div>
              </div>
            ))}

            {waiting.length === 0 && (
              <div className="py-20 text-center text-slate-800 space-y-4">
                <Users size={48} className="mx-auto" />
                <p className="text-xs font-black uppercase tracking-widest">Ninguém na espera no momento</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="relative z-10 pt-10 border-t border-white/5 flex justify-between items-center">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Sistema Cloud Sincronizado</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-800 font-black uppercase tracking-[0.5em]">Fila Livre Display Engine v1.0</p>
      </footer>
    </div>
  );
};
