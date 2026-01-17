
import React, { useState, useMemo } from 'react';
import { X, TrendingUp, Calendar, DollarSign, Wallet, CreditCard, ChevronRight, BarChart, History, Calculator, ArrowUpRight, QrCode, Filter, ChevronLeft } from 'lucide-react';
import { RevenueRecord } from '../types';

interface FinancialDetailModalProps {
  revenue: RevenueRecord[];
  onClose: () => void;
}

type Period = 'semana' | 'mes' | 'ano';

export const FinancialDetailModal: React.FC<FinancialDetailModalProps> = ({ revenue, onClose }) => {
  const [period, setPeriod] = useState<Period>('semana');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // 0-11
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null); // 0-3 (Semana 1 a 4)

  const DAYS_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const MONTHS_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // Helper para definir as faixas de dias de cada semana
  const getWeekRanges = (month: number, year: number) => [
    { label: 'Semana 1', sub: 'Dias 1 a 7', start: 1, end: 7 },
    { label: 'Semana 2', sub: 'Dias 8 a 14', start: 8, end: 14 },
    { label: 'Semana 3', sub: 'Dias 15 a 21', start: 15, end: 21 },
    { label: 'Semana 4', sub: `Dias 22 a ${new Date(year, month + 1, 0).getDate()}`, start: 22, end: 31 }
  ];

  // 1. VISÃO SEMANA ATUAL (Direto nos Dias)
  const weeklyData = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); 
    startOfWeek.setHours(0, 0, 0, 0);

    return DAYS_NAMES.map((label, index) => {
      const dayTotal = revenue.filter(rec => {
        const d = new Date(rec.date);
        return d.getDay() === index && d >= startOfWeek;
      }).reduce((acc, curr) => acc + curr.amount, 0);
      return { label, value: dayTotal, type: 'day' };
    });
  }, [revenue]);

  // 2. VISÃO MENSAL (Semanas -> Dias)
  const monthlyData = useMemo(() => {
    const month = currentMonth;
    const year = currentYear;
    const ranges = getWeekRanges(month, year);

    if (selectedWeek === null) {
      // Retorna as Semanas
      return ranges.map((range, idx) => {
        const total = revenue.filter(rec => {
          const d = new Date(rec.date);
          return d.getMonth() === month && d.getFullYear() === year && d.getDate() >= range.start && d.getDate() <= range.end;
        }).reduce((acc, curr) => acc + curr.amount, 0);
        return { label: range.label, subLabel: range.sub, value: total, type: 'week', index: idx };
      });
    } else {
      // Retorna os Dias da Semana Selecionada
      const range = ranges[selectedWeek];
      const daysCount = range.end - range.start + 1;
      return Array.from({ length: daysCount }).map((_, i) => {
        const dayNum = range.start + i;
        const total = revenue.filter(rec => {
          const d = new Date(rec.date);
          return d.getMonth() === month && d.getFullYear() === year && d.getDate() === dayNum;
        }).reduce((acc, curr) => acc + curr.amount, 0);
        return { label: `Dia ${dayNum}`, value: total, type: 'day' };
      });
    }
  }, [revenue, selectedWeek, currentMonth, currentYear]);

  // 3. VISÃO ANUAL (Meses -> Semanas -> Dias)
  const annualData = useMemo(() => {
    const year = currentYear;

    if (selectedMonth === null) {
      // Nível 1: Meses
      return MONTHS_NAMES.map((label, index) => {
        const total = revenue.filter(rec => {
          const d = new Date(rec.date);
          return d.getMonth() === index && d.getFullYear() === year;
        }).reduce((acc, curr) => acc + curr.amount, 0);
        return { label, value: total, type: 'month', index };
      });
    } else if (selectedWeek === null) {
      // Nível 2: Semanas do Mês Selecionado
      const ranges = getWeekRanges(selectedMonth, year);
      return ranges.map((range, idx) => {
        const total = revenue.filter(rec => {
          const d = new Date(rec.date);
          return d.getMonth() === selectedMonth && d.getFullYear() === year && d.getDate() >= range.start && d.getDate() <= range.end;
        }).reduce((acc, curr) => acc + curr.amount, 0);
        return { label: range.label, subLabel: range.sub, value: total, type: 'week', index: idx };
      });
    } else {
      // Nível 3: Dias da Semana Selecionada no Mês Selecionado
      const ranges = getWeekRanges(selectedMonth, year);
      const range = ranges[selectedWeek];
      const daysCount = Math.min(range.end, new Date(year, selectedMonth + 1, 0).getDate()) - range.start + 1;
      
      return Array.from({ length: daysCount }).map((_, i) => {
        const dayNum = range.start + i;
        const total = revenue.filter(rec => {
          const d = new Date(rec.date);
          return d.getMonth() === selectedMonth && d.getFullYear() === year && d.getDate() === dayNum;
        }).reduce((acc, curr) => acc + curr.amount, 0);
        return { label: `Dia ${dayNum}`, value: total, type: 'day' };
      });
    }
  }, [revenue, selectedMonth, selectedWeek, currentYear]);

  const listItems = useMemo(() => {
    if (period === 'semana') return weeklyData;
    if (period === 'mes') return monthlyData;
    return annualData;
  }, [period, weeklyData, monthlyData, annualData]);

  const totalValue = useMemo(() => {
    // Valor exibido no card principal depende do nível de drill-down
    if (period === 'semana') return weeklyData.reduce((a, b) => a + b.value, 0);
    
    if (period === 'mes') {
      if (selectedWeek !== null) return monthlyData.reduce((a, b) => a + b.value, 0);
      return monthlyData.reduce((a, b) => a + b.value, 0);
    }

    if (period === 'ano') {
      if (selectedMonth !== null && selectedWeek !== null) return annualData.reduce((a, b) => a + b.value, 0);
      if (selectedMonth !== null) return annualData.reduce((a, b) => a + b.value, 0);
      return annualData.reduce((a, b) => a + b.value, 0);
    }
    return 0;
  }, [period, weeklyData, monthlyData, annualData, selectedMonth, selectedWeek]);

  const maxValInList = useMemo(() => Math.max(...listItems.map((d: any) => d.value), 1), [listItems]);

  const handleBack = () => {
    if (selectedWeek !== null) setSelectedWeek(null);
    else if (selectedMonth !== null) setSelectedMonth(null);
  };

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    setSelectedMonth(null);
    setSelectedWeek(null);
  };

  const handleItemClick = (item: any) => {
    if (item.type === 'month') setSelectedMonth(item.index);
    if (item.type === 'week') setSelectedWeek(item.index);
  };

  const breadcrumbLabel = useMemo(() => {
    if (period === 'semana') return 'Extrato Semanal';
    if (period === 'mes') {
      if (selectedWeek !== null) return `Mês Atual > Semana ${selectedWeek + 1}`;
      return 'Mês Atual';
    }
    if (period === 'ano') {
      if (selectedMonth !== null && selectedWeek !== null) return `${MONTHS_NAMES[selectedMonth]} > Semana ${selectedWeek + 1}`;
      if (selectedMonth !== null) return `Ano Atual > ${MONTHS_NAMES[selectedMonth]}`;
      return 'Ano Atual';
    }
    return '';
  }, [period, selectedMonth, selectedWeek]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-2xl" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[40px] flex flex-col max-h-[95vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <header className="p-8 pb-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3 font-orbitron">
                <Wallet className="text-emerald-500" size={28} /> Minhas Finanças
              </h2>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Gestão de Faturamento Profissional</p>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
          </div>

          <div className="flex gap-2 bg-slate-950 p-1.5 rounded-[24px] border border-white/5">
            {[
              { id: 'semana', label: 'Semana', icon: <BarChart size={14}/> },
              { id: 'mes', label: 'Mês', icon: <Calendar size={14}/> },
              { id: 'ano', label: 'Ano', icon: <History size={14}/> }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePeriodChange(p.id as Period)}
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
          
          <section className="bg-slate-950 border border-white/5 p-8 rounded-[40px] flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 rotate-12 transition-transform group-hover:scale-110"><TrendingUp size={160} /></div>
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em] mb-3">
              {breadcrumbLabel}
            </p>
            <div className="flex items-baseline gap-2">
               <span className="text-xl font-bold text-slate-600">R$</span>
               <h3 className="text-5xl font-black text-white font-orbitron transition-all duration-300">
                 {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
               </h3>
            </div>
            {(selectedMonth !== null || selectedWeek !== null) && (
              <button 
                onClick={handleBack}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl flex items-center gap-2 text-[8px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
              >
                <ChevronLeft size={10} /> Voltar Nível
              </button>
            )}
          </section>

          <section className="space-y-4">
             <div className="flex justify-between items-center px-4">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  {selectedWeek !== null ? 'Detalhamento Diário' : selectedMonth !== null ? 'Detalhamento por Semana' : 'Visão Geral'}
                </p>
                <div className="w-10 h-0.5 bg-slate-800 rounded-full" />
             </div>

             <div className="space-y-3">
                {listItems.map((d: any, i: number) => {
                  const barWidth = maxValInList > 0 ? (d.value / maxValInList) * 100 : 0;
                  const canDrill = d.type !== 'day';
                  
                  return (
                    <button 
                      key={i} 
                      onClick={() => handleItemClick(d)}
                      disabled={!canDrill}
                      className={`w-full text-left bg-slate-950 border p-5 rounded-[28px] space-y-3 transition-all group relative overflow-hidden border-white/5 ${canDrill ? 'hover:border-emerald-500/30' : 'cursor-default'}`}
                    >
                      <div className="flex items-center justify-between relative z-10">
                        <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">
                            {d.subLabel || (d.type === 'month' ? 'Faturamento Mensal' : 'Registrado')}
                          </p>
                          <h4 className="text-xs font-black text-white uppercase">{d.label}</h4>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-black font-mono text-white">
                             R$ {d.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                           </p>
                        </div>
                      </div>
                      
                      <div className="h-2 bg-slate-900 rounded-full overflow-hidden relative z-10">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 opacity-60 transition-all duration-1000 ease-out"
                          style={{ width: `${Math.max(barWidth, 1)}%` }}
                        />
                      </div>

                      {canDrill && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight size={16} className="text-teal-400" />
                        </div>
                      )}
                    </button>
                  );
                })}
             </div>
          </section>

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
