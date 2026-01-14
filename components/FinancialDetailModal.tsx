import React, { useState, useMemo } from 'react';
import { X, TrendingUp, Download, Calendar, ArrowUpRight, Award, DollarSign, Wallet, CreditCard } from 'lucide-react';
import { RevenueRecord } from '../types';

interface FinancialDetailModalProps {
  revenue: RevenueRecord[];
  onClose: () => void;
}

interface ServiceStats {
  count: number;
  total: number;
}

type Period = 'semana' | 'mes' | 'ano' | 'tudo';

export const FinancialDetailModal: React.FC<FinancialDetailModalProps> = ({ revenue, onClose }) => {
  const [period, setPeriod] = useState<Period>('tudo');

  const filteredRevenue = useMemo(() => {
    const now = new Date();
    return revenue.filter(rec => {
      const recDate = new Date(rec.date);
      if (period === 'semana') {
        const diff = now.getTime() - recDate.getTime();
        return diff <= 7 * 24 * 60 * 60 * 1000;
      }
      if (period === 'mes') {
        return recDate.getMonth() === now.getMonth() && recDate.getFullYear() === now.getFullYear();
      }
      if (period === 'ano') {
        return recDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [revenue, period]);

  const statsByMethod = useMemo(() => {
    return filteredRevenue.reduce((acc, curr) => {
      const method = curr.method || 'cash';
      if (!acc[method]) acc[method] = { count: 0, total: 0 };
      acc[method].count += 1;
      acc[method].total += curr.amount;
      return acc;
    }, {} as Record<string, { count: number, total: number }>);
  }, [filteredRevenue]);

  const totalEarnings = useMemo(() => filteredRevenue.reduce((acc, curr) => acc + curr.amount, 0), [filteredRevenue]);

  const topServices = useMemo(() => {
    const stats = filteredRevenue.reduce((acc, curr) => {
      if (!acc[curr.serviceName]) acc[curr.serviceName] = { count: 0, total: 0 };
      acc[curr.serviceName].count += 1;
      acc[curr.serviceName].total += curr.amount;
      return acc;
    }, {} as Record<string, ServiceStats>);
    
    // Fix: Explicitly type entries to [string, ServiceStats][] to fix 'count' property not existing on type 'unknown'
    const entries = Object.entries(stats) as [string, ServiceStats][];
    return entries.sort((a, b) => b[1].count - a[1].count);
  }, [filteredRevenue]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl glass-card rounded-[40px] flex flex-col max-h-[90vh] overflow-hidden border border-white/10 shadow-2xl">
        <header className="p-8 border-b border-white/5 bg-slate-900/50">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                <TrendingUp className="text-emerald-500" size={24} /> Balanço Financeiro
              </h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Dados de Atendimento e Receita</p>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-800 rounded-2xl text-slate-400"><X size={20} /></button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {['tudo', 'semana', 'mes', 'ano'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p as Period)}
                className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                  period === p ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {/* RESUMO POR MÉTODO */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 p-5 rounded-3xl border border-teal-500/10">
              <div className="flex items-center gap-3 mb-3 text-teal-400">
                <Wallet size={16} /> <span className="text-[9px] font-black uppercase">PIX</span>
              </div>
              <h4 className="text-xl font-black text-white">R$ {(statsByMethod.pix?.total || 0).toFixed(2)}</h4>
              <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">{(statsByMethod.pix?.count || 0)} cortes</p>
            </div>
            <div className="bg-slate-900 p-5 rounded-3xl border border-emerald-500/10">
              <div className="flex items-center gap-3 mb-3 text-emerald-400">
                <DollarSign size={16} /> <span className="text-[9px] font-black uppercase">Dinheiro</span>
              </div>
              <h4 className="text-xl font-black text-white">R$ {(statsByMethod.cash?.total || 0).toFixed(2)}</h4>
              <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">{(statsByMethod.cash?.count || 0)} cortes</p>
            </div>
            <div className="bg-slate-900 p-5 rounded-3xl border border-indigo-500/10">
              <div className="flex items-center gap-3 mb-3 text-indigo-400">
                <CreditCard size={16} /> <span className="text-[9px] font-black uppercase">Cartão</span>
              </div>
              <h4 className="text-xl font-black text-white">R$ {(statsByMethod.card?.total || 0).toFixed(2)}</h4>
              <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">{(statsByMethod.card?.count || 0)} cortes</p>
            </div>
          </section>

          <section className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[40px] text-center space-y-2">
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em]">Receita Total do Período</p>
            <h3 className="text-5xl font-black text-white font-orbitron">R$ {totalEarnings.toFixed(2)}</h3>
            <p className="text-xs text-slate-400 font-bold uppercase">{filteredRevenue.length} Atendimentos realizados</p>
          </section>

          {/* RANKING */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Award size={14} className="text-amber-500" /> Serviços Mais Lucrativos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topServices.map(([name, stats], index) => (
                <div key={name} className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center text-xs font-black text-teal-400">#{index + 1}</div>
                    <div className="truncate max-w-[120px]">
                      <p className="text-xs font-black text-white uppercase truncate">{name}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">{stats.count} cortes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-400">R$ {stats.total.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* LISTA */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={14} className="text-indigo-500" /> Fluxo de Caixa Recente
            </h3>
            <div className="space-y-2">
              {filteredRevenue.slice(0, 20).map((rec) => (
                <div key={rec.id} className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-slate-600 group-hover:text-emerald-500 transition-colors">
                       <ArrowUpRight size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white uppercase">{rec.clientName || 'CONVIDADO'}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-bold ${
                          rec.method === 'pix' ? 'bg-teal-500/20 text-teal-400' : 
                          rec.method === 'card' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>{rec.method}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">{rec.serviceName} • {new Date(rec.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">R$ {rec.amount.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="p-8 border-t border-white/5 bg-slate-900/30">
          <button className="w-full bg-slate-100 text-slate-950 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
            <Download size={18} /> Exportar Extrato Completo
          </button>
        </footer>
      </div>
    </div>
  );
};