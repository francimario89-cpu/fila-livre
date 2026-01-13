
import React from 'react';
import { Database, Cloud, CloudOff, Zap, ShieldCheck, RefreshCw, HardDrive } from 'lucide-react';

interface DataStatusProps {
  isLocalMode: boolean;
  localCount: number;
  cloudCount: number;
  onSync?: () => void;
}

export const DataStatus: React.FC<DataStatusProps> = ({ isLocalMode, localCount, cloudCount, onSync }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 gap-4">
        {/* Banco Local */}
        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-[32px] space-y-3 relative overflow-hidden group">
          <div className="absolute -right-2 -top-2 opacity-5 group-hover:rotate-12 transition-transform">
            <HardDrive size={60} />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Banco Local</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-2xl font-black text-white font-orbitron">{localCount}</h4>
            <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">Registros em Cache</p>
          </div>
          <div className="pt-2">
             <span className="text-[7px] px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg font-black uppercase border border-emerald-500/20">Ativo</span>
          </div>
        </div>

        {/* Banco Cloud */}
        <div className={`bg-slate-900/50 border p-5 rounded-[32px] space-y-3 relative overflow-hidden group transition-colors ${isLocalMode ? 'border-amber-500/30' : 'border-slate-800'}`}>
          <div className="absolute -right-2 -top-2 opacity-5 group-hover:rotate-12 transition-transform">
            <Cloud size={60} />
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLocalMode ? 'bg-amber-500' : 'bg-teal-500 animate-pulse'}`} />
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Banco Cloud</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-2xl font-black text-white font-orbitron">{isLocalMode ? '---' : cloudCount}</h4>
            <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">Registros na Nuvem</p>
          </div>
          <div className="pt-2">
             <span className={`text-[7px] px-2 py-1 rounded-lg font-black uppercase border ${isLocalMode ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-teal-500/10 text-teal-500 border-teal-500/20'}`}>
                {isLocalMode ? 'Ativando...' : 'Sincronizado'}
             </span>
          </div>
        </div>
      </div>

      <div className="bg-indigo-600/10 border border-indigo-500/20 p-6 rounded-[32px] space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <RefreshCw size={20} className={isLocalMode ? '' : 'animate-spin-slow'} />
          </div>
          <div className="flex-1">
            <h5 className="text-[10px] font-black text-white uppercase tracking-widest">Tecnologia Híbrida Ativa</h5>
            <p className="text-[8px] text-slate-500 font-medium uppercase leading-relaxed">
              Seus dados são salvos no celular primeiro. A sincronização com o Google acontece automaticamente em segundo plano.
            </p>
          </div>
        </div>
        
        {isLocalMode && (
          <button 
            onClick={onSync}
            className="w-full py-4 bg-white text-slate-950 rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
          >
            <Zap size={14} className="text-amber-500" /> Tentar Sincronizar Agora
          </button>
        )}
      </div>
    </div>
  );
};
