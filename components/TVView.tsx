
import React, { useEffect, useState } from 'react';
import { LOGO_SVG } from '../constants';
import { QueueItem, Professional } from '../types';
import { User, Timer, QrCode, MonitorOff, BellRing, ChevronRight } from 'lucide-react';

interface TVViewProps {
  queue: QueueItem[];
  professionals: Professional[];
  establishmentName: string;
  onClose: () => void;
}

export const TVView: React.FC<TVViewProps> = ({ queue, professionals, establishmentName, onClose }) => {
  const [now, setNow] = useState(Date.now());
  const serving = queue.find(i => i.status === 'serving');
  const waiting = queue.filter(i => i.status === 'waiting').slice(0, 5);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    // Tentar entrar em fullscreen automaticamente
    try { document.documentElement.requestFullscreen(); } catch(e) {}
    return () => {
      clearInterval(timer);
      try { if (document.fullscreenElement) document.exitFullscreen(); } catch(e) {}
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] bg-[#050810] flex flex-col p-12 text-white animate-in fade-in duration-1000 overflow-hidden">
      
      {/* HEADER TV */}
      <header className="flex items-center justify-between mb-20">
        <div className="flex items-center gap-8">
          <div className="w-24 h-24">{LOGO_SVG}</div>
          <div>
            <h1 className="text-4xl font-black font-orbitron tracking-tighter neon-text uppercase leading-none">{establishmentName}</h1>
            <p className="text-xl text-slate-500 font-bold uppercase tracking-[0.5em] mt-2">Painel de Atendimento</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-6xl font-black font-mono tracking-tighter">
            {new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button onClick={onClose} className="mt-4 p-2 bg-slate-900 rounded-xl text-slate-700 hover:text-red-500 transition-colors">
            <MonitorOff size={24} />
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-16">
        
        {/* LADO ESQUERDO: AGORA / SERVING */}
        <div className="col-span-7 flex flex-col gap-8">
          <h2 className="text-2xl font-black text-slate-500 uppercase tracking-[0.4em]">Em Atendimento</h2>
          
          {serving ? (
            <div className="flex-1 bg-gradient-to-br from-teal-500 to-teal-700 rounded-[60px] p-16 flex flex-col justify-center shadow-[0_0_100px_rgba(45,212,191,0.2)] animate-pulse-subtle">
              <div className="flex items-center gap-6 mb-10">
                <div className="w-20 h-20 bg-white/20 rounded-[30px] flex items-center justify-center">
                  <BellRing size={48} className="text-white" />
                </div>
                <span className="text-2xl font-black text-white/50 uppercase tracking-widest">Sua Vez!</span>
              </div>
              <h3 className="text-[120px] font-black text-white leading-none uppercase tracking-tighter mb-10">
                {serving.name.split(' ')[0]}
              </h3>
              <div className="flex items-center gap-6">
                 <div className="px-10 py-4 bg-slate-950/40 rounded-3xl border border-white/10">
                    <span className="text-xl font-black text-teal-200 uppercase tracking-widest">{serving.service}</span>
                 </div>
                 <div className="px-10 py-4 bg-slate-950/40 rounded-3xl border border-white/10">
                    <span className="text-xl font-black text-white/60 uppercase tracking-widest">
                      Barbeiro: {professionals.find(p => p.id === serving.professionalId)?.name}
                    </span>
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-slate-900/30 border-4 border-dashed border-slate-800 rounded-[60px] flex flex-col items-center justify-center text-slate-700">
               <Timer size={100} className="mb-8" />
               <p className="text-4xl font-black uppercase tracking-widest">Aguardando Próximo</p>
            </div>
          )}
        </div>

        {/* LADO DIREITO: PRÓXIMOS / QR CODE */}
        <div className="col-span-5 flex flex-col gap-12">
          
          <div className="flex-1 space-y-8">
            <h2 className="text-2xl font-black text-slate-500 uppercase tracking-[0.4em]">Próximos da Fila</h2>
            <div className="space-y-4">
              {waiting.map((item, index) => (
                <div key={item.id} className="bg-slate-900/50 border border-slate-800/50 p-10 rounded-[40px] flex items-center justify-between">
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center text-4xl font-black text-teal-400">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="text-5xl font-black text-white uppercase tracking-tighter">{item.name.split(' ')[0]}</h4>
                      <p className="text-xl text-slate-500 font-bold uppercase mt-2">{item.service}</p>
                    </div>
                  </div>
                  <ChevronRight size={48} className="text-slate-800" />
                </div>
              ))}
              {waiting.length === 0 && (
                <p className="text-2xl text-slate-800 font-black uppercase text-center py-20">Fila Vazia</p>
              )}
            </div>
          </div>

          {/* QR CODE PARA CLIENTES */}
          <div className="bg-indigo-600 rounded-[50px] p-12 flex items-center gap-10 shadow-2xl">
            <div className="bg-white p-6 rounded-[30px]">
              <QrCode size={140} className="text-slate-950" />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-white uppercase leading-tight tracking-tighter">Entre na fila<br/>pelo celular</h3>
              <p className="text-lg text-indigo-200 font-bold uppercase tracking-widest">Escaneie para agendar agora</p>
            </div>
          </div>

        </div>
      </div>

      <footer className="mt-20 border-t border-slate-800 pt-10 flex justify-between items-center opacity-30">
        <p className="text-xl font-bold uppercase tracking-widest font-orbitron">FILA LIVRE v2.5 • SISTEMA DE GESTÃO INTELIGENTE</p>
        <p className="text-xl font-bold uppercase tracking-widest">STATUS: CONECTADO AO CLOUD</p>
      </footer>
    </div>
  );
};
