
import React from 'react';
import { Gift, Check, Star, PartyPopper, Trophy, Sparkles, Crown } from 'lucide-react';

interface LoyaltyViewProps {
  cutsCount: number;
}

export const LoyaltyView: React.FC<LoyaltyViewProps> = ({ cutsCount }) => {
  const totalSlots = 10;
  const isDayOfGlory = cutsCount >= 10;
  
  if (isDayOfGlory) {
    return (
      <div className="fixed inset-0 z-[60] bg-[#050810] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-10 animate-pulse opacity-20"><Sparkles size={100} className="text-teal-400" /></div>
          <div className="absolute bottom-1/4 right-10 opacity-20"><Star size={120} className="text-amber-500" /></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 space-y-10 max-w-sm">
          <div className="relative mx-auto w-32 h-32">
            <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-30 animate-pulse" />
            <div className="relative w-full h-full bg-gradient-to-tr from-amber-600 to-amber-300 rounded-[40px] flex items-center justify-center text-slate-950 shadow-2xl transform rotate-3 scale-110">
              <Trophy size={64} />
            </div>
            <div className="absolute -top-4 -right-4 bg-white text-slate-950 p-2 rounded-full shadow-xl">
              <Crown size={24} />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-5xl font-black text-white font-orbitron uppercase tracking-tighter leading-none">
              DIA DE <span className="text-amber-500">GLÓRIA!</span>
            </h2>
            <p className="text-xl font-black text-teal-400 uppercase tracking-widest">
              PRÓXIMO CORTE 100% GRÁTIS
            </p>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.3em] leading-relaxed">
              PARABÉNS! VOCÊ COMPLETOU O CARTÃO. <br/> 
              MOSTRE ESTA TELA AO ATENDENTE <br/> PARA GARANTIR SUA RECOMPENSA.
            </p>
          </div>

          <div className="pt-8">
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl px-10 py-6 rounded-[32px] inline-flex items-center gap-4 group">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg group-hover:scale-110 transition-transform">
                <Check size={24} />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Selo de Verificação</p>
                <p className="text-xl font-mono font-black text-white tracking-widest">CLIENTE-VIP</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="text-center space-y-2">
        <h2 className="text-2xl font-black font-orbitron uppercase tracking-tight flex items-center justify-center gap-2">
          <Gift className="text-amber-500" />
          Clube Fidelidade
        </h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Caminho para o Corte Grátis</p>
      </header>

      <div className="glass-card rounded-[40px] p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <Gift size={120} className="text-amber-500 rotate-12" />
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-end mb-8">
            <div>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Seu Progresso</p>
              <h3 className="text-4xl font-black text-white font-orbitron">{cutsCount} <span className="text-slate-700 text-2xl">/ {totalSlots}</span></h3>
            </div>
            <div className="text-right">
              <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-full font-black uppercase tracking-widest">
                Faltam {totalSlots - cutsCount}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: totalSlots }).map((_, i) => {
              const isFilled = i < cutsCount;
              const isLast = i === totalSlots - 1;
              
              return (
                <div 
                  key={i}
                  className={`aspect-square rounded-2xl flex items-center justify-center border-2 transition-all duration-700 ${
                    isFilled 
                      ? 'bg-gradient-to-tr from-teal-500 to-teal-400 border-transparent shadow-[0_0_20px_rgba(45,212,191,0.3)]' 
                      : isLast 
                        ? 'bg-slate-900 border-amber-500/30 border-dashed' 
                        : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  {isFilled ? (
                    <Check size={20} className="text-slate-950" />
                  ) : isLast ? (
                    <Star size={20} className="text-amber-500/50" />
                  ) : (
                    <span className="text-slate-700 font-black text-sm">{i + 1}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-10 p-5 bg-slate-950/50 rounded-3xl border border-white/5 flex items-start gap-4">
             <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <Sparkles size={18} />
             </div>
             <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Complete os 10 selos para desbloquear o <span className="text-amber-500 font-black uppercase">Dia de Glória</span> e não pagar nada no seu próximo corte.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
