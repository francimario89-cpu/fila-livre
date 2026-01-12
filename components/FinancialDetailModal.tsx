
import React from 'react';
import { X, TrendingUp, Download, Calendar, ArrowUpRight, Award } from 'lucide-react';
import { RevenueRecord } from '../types';

interface FinancialDetailModalProps {
  revenue: RevenueRecord[];
  onClose: () => void;
}

// Fixed: Define interface for service statistics to resolve 'unknown' type errors during mapping and sorting
interface ServiceStats {
  count: number;
  total: number;
}

export const FinancialDetailModal: React.FC<FinancialDetailModalProps> = ({ revenue, onClose }) => {
  const sortedRevenue = [...revenue].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Fixed: Typing the accumulator to ensure count and total properties are recognized
  const serviceStats = revenue.reduce((acc, curr) => {
    if (!acc[curr.serviceName]) {
      acc[curr.serviceName] = { count: 0, total: 0 };
    }
    acc[curr.serviceName].count += 1;
    acc[curr.serviceName].total += curr.amount;
    return acc;
  }, {} as Record<string, ServiceStats>);

  // Fixed: Casting Object.entries to prevent 'unknown' property access errors in .sort() and .map()
  const topServices = (Object.entries(serviceStats) as [string, ServiceStats][])
    .sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl glass-card rounded-[40px] flex flex-col max-h-[90vh] overflow-hidden border border-white/10 shadow-2xl">
        <header className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
              <TrendingUp className="text-emerald-500" size={24} /> Extrato Detalhado
            </h2>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Histórico e Popularidade de Serviços</p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-800 border border-slate-700 rounded-2xl text-slate-400 hover:text-white transition-all"><X size={20} /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {/* RANKING DE SERVIÇOS */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Award size={14} className="text-amber-500" /> Serviços Mais Solicitados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topServices.map(([name, stats], index) => (
                <div key={name} className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center text-xs font-black text-teal-400">#{index + 1}</div>
                    <div>
                      <p className="text-xs font-black text-white uppercase truncate max-w-[120px]">{name}</p>
                      {/* Fixed: stats is now properly typed as ServiceStats */}
                      <p className="text-[9px] text-slate-500 font-bold uppercase">{stats.count} Atendimentos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {/* Fixed: stats is now properly typed as ServiceStats */}
                    <p className="text-xs font-black text-emerald-400">R$ {stats.total.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* LISTA DE TRANSAÇÕES */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={14} className="text-indigo-500" /> Movimentações Recentes
            </h3>
            <div className="space-y-2">
              {sortedRevenue.map((rec) => (
                <div key={rec.id} className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:bg-slate-900 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-slate-600">
                       <ArrowUpRight size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white uppercase">{rec.clientName || 'CLIENTE'}</span>
                        <span className="text-[8px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold">{rec.method}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">{rec.serviceName} • {new Date(rec.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">R$ {rec.amount.toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {revenue.length === 0 && (
                <div className="text-center py-12 text-slate-700 text-[10px] font-black uppercase tracking-widest">Nenhuma movimentação registrada</div>
              )}
            </div>
          </section>
        </div>

        <footer className="p-8 border-t border-white/5 bg-slate-900/30">
          <button className="w-full bg-slate-100 text-slate-950 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-white/5">
            <Download size={18} /> Exportar Relatório (PDF)
          </button>
        </footer>
      </div>
    </div>
  );
};
