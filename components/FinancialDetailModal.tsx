
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
    return (Object.entries(stats) as [string, ServiceStats][]).sort((a, b) => b[1].count - a[1].count);
  }, [filteredRevenue]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl glass-card rounded-[40px] flex flex-col max-h-[90vh] overflow-hidden border border-white/10 shadow-2xl">
        <header className="p-8 border-b border-white/5 bg-slate-900/50">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                <TrendingUp className="text-emerald-500" size={24} /> Relatório Estratégico
              </h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Visão Geral de Desempenho</p>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-800 rounded-2xl text-slate-400"><X size={20} /></button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'tudo', label: 'Histórico Total' },
              { id: 'semana', label: 'Últimos 7 Dias' },
              { id: 'mes', label: 'Mês Atual' },
              { id: 'ano', label: 'Este Ano' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as Period)}
                className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                  period === p.id ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 p-5 rounded-3xl border border-teal-500/10">
              <div className="flex items-center gap-3 mb-3 text-teal-400"><Wallet size={16} /> <span className="text-[9px] font-black uppercase">PIX</span></div>
              <h4 className="text-xl font-black text-white">R$ {(statsByMethod.pix?.total || 0).toFixed(2)}</h4>
              <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">{(statsByMethod.pix?.count || 0)} cortes</p>
            </div>
            <div className="bg-slate-900 p-5 rounded-3xl border border-emerald-500/10">
              <div className="flex items-center gap-3 mb-3 text-emerald-400"><DollarSign size={16} /> <span className="text-[9px] font-black uppercase">Dinheiro</span></div>
              <h4 className="text-xl font-black text-white">R$ {(statsByMethod.cash?.total || 0).toFixed(2)}</h4>
              <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">{(statsByMethod.cash?.count || 0)} cortes</p>
            </div>
            <div className="bg-slate-900 p-5 rounded-3xl border border-indigo-500/10">
              <div className="flex items-center gap-3 mb-3 text-indigo-400"><CreditCard size={16} /> <span className="text-[9px] font-black uppercase">Cartão</span></div>
              <h4 className="text-xl font-black text-white">R$ {(statsByMethod.card?.total || 0).toFixed(2)}</h4>
              <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">{(statsByMethod.card?.count || 0)} cortes</p>
            </div>
          </section>

          <section className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[40px] text-center space-y-2">
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em]">Lucro Líquido no Período</p>
            <h3 className="text-5xl font-black text-white font-orbitron">R$ {totalEarnings.toFixed(2)}</h3>
            <p className="text-xs text-slate-400 font-bold uppercase">{filteredRevenue.length} atendimentos concluídos</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Award size={14} className="text-amber-500" /> Rankings por Serviço</h3>
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
                  <div className="text-right"><p className="text-xs font-black text-emerald-400">R$ {stats.total.toFixed(2)}</p></div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
