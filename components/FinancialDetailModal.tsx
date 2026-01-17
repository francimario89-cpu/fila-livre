
import React, { useState, useMemo } from 'react';
import { X, TrendingUp, Calendar, DollarSign, Wallet, CreditCard, ChevronRight, BarChart, History, Calculator } from 'lucide-react';
import { RevenueRecord } from '../types';

interface FinancialDetailModalProps {
  revenue: RevenueRecord[];
  onClose: () => void;
}

type Period = 'semana' | 'mes' | 'ano';

export const FinancialDetailModal: React.FC<FinancialDetailModalProps> = ({ revenue, onClose }) => {
  const [period, setPeriod] = useState<Period>('semana');

  const DAYS_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const MONTHS_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Dados da Semana Atual (Dia a Dia)
  const weeklyData = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Início no Domingo
    startOfWeek.setHours(0, 0, 0, 0);

    const data = DAYS_NAMES.map((label, index) => {
      const dayTotal = revenue.filter(rec => {
        const d = new Date(rec.date);
        return d.getDay() === index && d >= startOfWeek;
      }).reduce((acc, curr) => acc + curr.amount, 0);
      return { label, value: dayTotal };
    });

    return data;
  }, [revenue]);

  // Dados por Mês (Histórico do Ano Atual)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();

    const data = MONTHS_NAMES.map((label, index) => {
      const monthTotal = revenue.filter(rec => {
        const d = new Date(rec.date);
        return d.getMonth() === index && d.getFullYear() === currentYear;
      }).reduce((acc, curr) => acc + curr.amount, 0);
      return { label, value: monthTotal };
    });

    return data;
  }, [revenue]);

  const totalPeriod = useMemo(() => {
    if (period === 'semana') return weeklyData.reduce((acc, curr) => acc + curr.value, 0);
    if (period === 'mes') return monthlyData[new Date().getMonth()].value;
    return monthlyData.reduce((acc, curr) => acc + curr.value, 0);
  }, [period, weeklyData, monthlyData]);

  const maxVal = useMemo(() => {
    const dataset = period === 'semana' ? weeklyData : monthlyData;
    return Math.max(...dataset.map(d => d.value), 1);
  }, [period, weeklyData, monthlyData]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[40px] flex flex-col max-h-[90vh] overflow-hidden shadow-2xl">
        <header className="p-8 border-b border-white/5 bg-slate-900/50">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3 font-orbitron">
                <Calculator className="text-emerald-500" size={28} /> Inteligência Financeira
              </h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Gestão de Performance e Faturamento</p>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
          </div>

          <div className="flex gap-2 bg-slate-950/50 p-1.5 rounded-[20px] border border-white/5">
            {[
              { id: 'semana', label: 'Esta Semana', icon: <BarChart size={14}/> },
              { id: 'mes', label: 'Mês Atual', icon: <Calendar size={14}/> },
              { id: 'ano', label: 'Fechamento Anual', icon: <History size={14}/> }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as Period)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  period === p.id ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-slate-950/20">
          
          {/* Card de Faturamento Total do Período */}
          <section className="bg-gradient-to-br from-emerald-600/20 to-teal-900/20 border border-emerald-500/20 p-8 rounded-[40px] text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp size={120} /></div>
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em] mb-2">Total no Período Selecionado</p>
            <h3 className="text-5xl font-black text-white font-orbitron">R$ {totalPeriod.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </section>

          {/* Listagem de Dados Detalhada */}
          <section className="space-y-4">
            <div className="flex justify-between items-center px-4">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {period === 'semana' ? 'Desempenho Diário' : period === 'mes' ? 'Detalhe Mensal' : 'Resumo por Meses'}
               </h3>
               <span className="text-[8px] font-black text-emerald-500 uppercase">Valores Brutos</span>
            </div>

            <div className="space-y-2">
              {(period === 'semana' ? weeklyData : monthlyData).map((data, idx) => (
                <div key={idx} className="bg-slate-900/40 border border-white/5 p-4 rounded-3xl flex items-center justify-between group hover:bg-slate-800 transition-all">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16">
                      <p className="text-[10px] font-black text-white uppercase">{data.label}</p>
                    </div>
                    {/* Mini Gráfico de Barras */}
                    <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                         style={{ width: `${(data.value / maxVal) * 100}%` }}
                       />
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs font-black text-white font-mono">R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Divisão por Métodos de Pagamento */}
          <section className="grid grid-cols-3 gap-3">
             <div className="bg-slate-900 p-5 rounded-[32px] border border-teal-500/10 text-center">
                <Wallet size={16} className="text-teal-400 mx-auto mb-2" />
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">PIX</p>
                <p className="text-xs font-black text-white">R$ {revenue.filter(r => r.method === 'pix').reduce((a,b) => a+b.amount, 0).toFixed(0)}</p>
             </div>
             <div className="bg-slate-900 p-5 rounded-[32px] border border-emerald-500/10 text-center">
                <DollarSign size={16} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Cash</p>
                <p className="text-xs font-black text-white">R$ {revenue.filter(r => r.method === 'cash').reduce((a,b) => a+b.amount, 0).toFixed(0)}</p>
             </div>
             <div className="bg-slate-900 p-5 rounded-[32px] border border-indigo-500/10 text-center">
                <CreditCard size={16} className="text-indigo-400 mx-auto mb-2" />
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Card</p>
                <p className="text-xs font-black text-white">R$ {revenue.filter(r => r.method === 'card').reduce((a,b) => a+b.amount, 0).toFixed(0)}</p>
             </div>
          </section>

        </div>
        
        <footer className="p-8 border-t border-white/5 bg-slate-950/50 flex justify-between items-center">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sincronizado com Nuvem</p>
           </div>
           <button 
             className="flex items-center gap-2 text-[9px] font-black text-teal-400 uppercase tracking-widest hover:text-white transition-colors"
             onClick={() => window.print()}
           >
              Exportar PDF <ChevronRight size={12} />
           </button>
        </footer>
      </div>
    </div>
  );
};
