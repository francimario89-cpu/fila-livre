
import React, { useState, useMemo } from 'react';
// Added QrCode to imports to fix "Cannot find name 'QrCode'" error.
import { X, TrendingUp, Calendar, DollarSign, Wallet, CreditCard, ChevronRight, BarChart, History, Calculator, ArrowUpRight, QrCode } from 'lucide-react';
import { RevenueRecord } from '../types';

interface FinancialDetailModalProps {
  revenue: RevenueRecord[];
  onClose: () => void;
}

type Period = 'semana' | 'mes' | 'ano';

export const FinancialDetailModal: React.FC<FinancialDetailModalProps> = ({ revenue, onClose }) => {
  const [period, setPeriod] = useState<Period>('semana');

  const DAYS_NAMES = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  const MONTHS_NAMES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  // Dados da Semana Atual (Dia a Dia)
  const weeklyData = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Início no Domingo
    startOfWeek.setHours(0, 0, 0, 0);

    return DAYS_NAMES.map((label, index) => {
      const dayTotal = revenue.filter(rec => {
        const d = new Date(rec.date);
        return d.getDay() === index && d >= startOfWeek;
      }).reduce((acc, curr) => acc + curr.amount, 0);
      return { label, value: dayTotal };
    });
  }, [revenue]);

  // Dados do Mês Atual (Dividido por SEMANAS do mês)
  const monthlyByWeeksData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const weekRanges = [
      { label: 'SEM 1 (1-7)', start: 1, end: 7 },
      { label: 'SEM 2 (8-14)', start: 8, end: 14 },
      { label: 'SEM 3 (15-21)', start: 15, end: 21 },
      { label: 'SEM 4 (22-31)', start: 22, end: 31 }
    ];

    return weekRanges.map(range => {
      const total = revenue.filter(rec => {
        const d = new Date(rec.date);
        return d.getMonth() === currentMonth && 
               d.getFullYear() === currentYear && 
               d.getDate() >= range.start && 
               d.getDate() <= range.end;
      }).reduce((acc, curr) => acc + curr.amount, 0);
      return { label: range.label, value: total };
    });
  }, [revenue]);

  // Dados do Ano (Mês a Mês)
  const annualData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return MONTHS_NAMES.map((label, index) => {
      const monthTotal = revenue.filter(rec => {
        const d = new Date(rec.date);
        return d.getMonth() === index && d.getFullYear() === currentYear;
      }).reduce((acc, curr) => acc + curr.amount, 0);
      return { label, value: monthTotal };
    });
  }, [revenue]);

  const activeData = useMemo(() => {
    if (period === 'semana') return weeklyData;
    if (period === 'mes') return monthlyByWeeksData;
    return annualData;
  }, [period, weeklyData, monthlyByWeeksData, annualData]);

  const totalPeriodValue = useMemo(() => activeData.reduce((acc, curr) => acc + curr.value, 0), [activeData]);
  const maxVal = useMemo(() => Math.max(...activeData.map(d => d.value), 1), [activeData]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-2xl" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[40px] flex flex-col max-h-[95vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <header className="p-8 pb-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3 font-orbitron">
                <Calculator className="text-emerald-500" size={28} /> Inteligência Financeira
              </h2>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Desempenho e Faturamento Estratégico</p>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
          </div>

          <div className="flex gap-2 bg-slate-950 p-1.5 rounded-[24px] border border-white/5">
            {[
              { id: 'semana', label: 'Semana', icon: <BarChart size={14}/> },
              { id: 'mes', label: 'Mês (Semanas)', icon: <Calendar size={14}/> },
              { id: 'ano', label: 'Ano (Meses)', icon: <History size={14}/> }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as Period)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  period === p.id ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-8 custom-scrollbar">
          
          {/* Card do Resumo do Período */}
          <section className="bg-slate-950 border border-white/5 p-8 rounded-[40px] flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 rotate-12 transition-transform group-hover:scale-110"><TrendingUp size={160} /></div>
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em] mb-3">Faturamento Bruto Total</p>
            <div className="flex items-baseline gap-2">
               <span className="text-xl font-bold text-slate-600">R$</span>
               <h3 className="text-5xl font-black text-white font-orbitron">{totalPeriodValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="mt-4 px-4 py-1.5 bg-emerald-500/10 rounded-full flex items-center gap-2 border border-emerald-500/20">
               <ArrowUpRight size={14} className="text-emerald-500" />
               <span className="text-[9px] font-black text-emerald-400 uppercase">Performance em Tempo Real</span>
            </div>
          </section>

          {/* GRÁFICO VERTICAL DINÂMICO */}
          <section className="space-y-4">
             <div className="flex justify-between items-center px-2">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Análise de Comparação</h3>
                <span className="text-[8px] font-bold text-slate-600 uppercase">Frequência Financeira</span>
             </div>
             
             <div className="bg-slate-950/50 border border-white/5 rounded-[40px] p-8">
                <div className="flex items-end justify-between gap-2 h-48">
                  {activeData.map((d, i) => {
                    const heightPercent = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center group gap-3">
                         {/* Valor Flutuante (Hover) */}
                         <div className={`opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-white text-slate-950 text-[8px] font-black py-1 px-2 rounded-lg shadow-xl pointer-events-none`}>
                           R${d.value.toFixed(0)}
                         </div>
                         {/* Barra Vertical */}
                         <div className="w-full max-w-[30px] relative">
                            <div 
                              className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-xl transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                              style={{ height: `${Math.max(heightPercent, 2)}%` }}
                            />
                         </div>
                         <span className="text-[7px] font-black text-slate-500 uppercase rotate-[-45deg] mt-1 group-hover:text-emerald-400 transition-colors">{d.label}</span>
                      </div>
                    );
                  })}
                </div>
             </div>
          </section>

          {/* LISTA DETALHADA COM VALORES REAIS */}
          <section className="space-y-3">
             <div className="flex justify-between items-center px-4">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Extrato do Período</p>
                <div className="w-10 h-0.5 bg-slate-800 rounded-full" />
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeData.map((d, i) => (
                  <div key={i} className="bg-slate-950 border border-white/5 p-5 rounded-[28px] flex items-center justify-between hover:border-emerald-500/30 transition-all">
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">{period === 'semana' ? 'DIA' : period === 'mes' ? 'SEMANA' : 'MÊS'}</p>
                      <h4 className="text-xs font-black text-white uppercase">{d.label}</h4>
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] font-black text-emerald-500/50 uppercase mb-1">Arrecadado</p>
                       <p className="text-sm font-black text-white font-mono">R$ {d.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                ))}
             </div>
          </section>

          {/* DIVISÃO POR MÉTODOS */}
          <section className="grid grid-cols-3 gap-3">
             <div className="bg-slate-900 p-5 rounded-[32px] border border-teal-500/10 text-center flex flex-col items-center">
                <div className="w-8 h-8 bg-teal-500/10 rounded-xl flex items-center justify-center mb-2"><QrCode size={16} className="text-teal-400" /></div>
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">PIX</p>
                <p className="text-xs font-black text-white">R$ {revenue.filter(r => r.method === 'pix').reduce((a,b) => a+b.amount, 0).toFixed(0)}</p>
             </div>
             <div className="bg-slate-900 p-5 rounded-[32px] border border-emerald-500/10 text-center flex flex-col items-center">
                <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-2"><DollarSign size={16} className="text-emerald-400" /></div>
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Dinheiro</p>
                <p className="text-xs font-black text-white">R$ {revenue.filter(r => r.method === 'cash').reduce((a,b) => a+b.amount, 0).toFixed(0)}</p>
             </div>
             <div className="bg-slate-900 p-5 rounded-[32px] border border-indigo-500/10 text-center flex flex-col items-center">
                <div className="w-8 h-8 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-2"><CreditCard size={16} className="text-indigo-400" /></div>
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Cartão</p>
                <p className="text-xs font-black text-white">R$ {revenue.filter(r => r.method === 'card').reduce((a,b) => a+b.amount, 0).toFixed(0)}</p>
             </div>
          </section>

        </div>
        
        <footer className="p-8 pt-4 border-t border-white/5 bg-slate-900 flex justify-between items-center">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sincronizado na Nuvem</p>
           </div>
           <button 
             className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 rounded-xl text-[9px] font-black text-teal-400 uppercase tracking-widest hover:bg-slate-700 transition-colors"
             onClick={() => window.print()}
           >
              Relatório PDF <ChevronRight size={12} />
           </button>
        </footer>
      </div>
    </div>
  );
};
