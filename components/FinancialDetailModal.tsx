
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
  const [selectedSubIndex, setSelectedSubIndex] = useState<number | null>(null);

  const DAYS_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const MONTHS_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  // Dados da Semana Atual (Dia a Dia)
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
      return { label, value: dayTotal };
    });
  }, [revenue]);

  // Dados do Mês Atual (Dividido por SEMANAS do mês)
  const monthlyByWeeksData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const weekRanges = [
      { label: 'Semana 1', sub: 'Dias 1 a 7', start: 1, end: 7 },
      { label: 'Semana 2', sub: 'Dias 8 a 14', start: 8, end: 14 },
      { label: 'Semana 3', sub: 'Dias 15 a 21', start: 15, end: 21 },
      { label: 'Semana 4', sub: 'Dias 22 a 31', start: 22, end: 31 }
    ];

    return weekRanges.map(range => {
      const recordsInWeek = revenue.filter(rec => {
        const d = new Date(rec.date);
        return d.getMonth() === currentMonth && 
               d.getFullYear() === currentYear && 
               d.getDate() >= range.start && 
               d.getDate() <= range.end;
      });

      const total = recordsInWeek.reduce((acc, curr) => acc + curr.amount, 0);

      // Gerar faturamento DIA A DIA dentro desta semana específica
      const dailyBreakdown = Array.from({ length: range.end - range.start + 1 }, (_, i) => {
        const dayNum = range.start + i;
        const dayTotal = recordsInWeek
          .filter(r => new Date(r.date).getDate() === dayNum)
          .reduce((acc, curr) => acc + curr.amount, 0);
        
        return { 
          label: `Dia ${dayNum}`, 
          value: dayTotal,
          dateLabel: `Faturamento do dia ${dayNum}`
        };
      });

      return { label: range.label, subLabel: range.sub, value: total, dailyBreakdown };
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

  // Dados que serão renderizados na lista (Se houver drill-down, mostra os dias da semana)
  const listItems = useMemo(() => {
    if (period === 'mes' && selectedSubIndex !== null) {
      return (activeData[selectedSubIndex] as any).dailyBreakdown;
    }
    return activeData;
  }, [period, selectedSubIndex, activeData]);

  const displayValue = useMemo(() => {
    if (period === 'mes' && selectedSubIndex !== null) {
      return (activeData[selectedSubIndex] as any).value;
    }
    return activeData.reduce((acc, curr) => acc + curr.value, 0);
  }, [selectedSubIndex, activeData, period]);

  const maxValInList = useMemo(() => Math.max(...listItems.map((d: any) => d.value), 1), [listItems]);

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    setSelectedSubIndex(null);
  };

  const handleSubSelect = (index: number) => {
    if (period !== 'mes') return; // Drill-down apenas no mês
    if (selectedSubIndex === index) setSelectedSubIndex(null);
    else setSelectedSubIndex(index);
  };

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
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Toque nos itens para detalhar</p>
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
          
          {/* Card do Resumo do Período */}
          <section className="bg-slate-950 border border-white/5 p-8 rounded-[40px] flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 rotate-12 transition-transform group-hover:scale-110"><TrendingUp size={160} /></div>
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em] mb-3">
              {selectedSubIndex !== null && period === 'mes'
                ? `Total Detalhado: ${activeData[selectedSubIndex].label}`
                : period === 'semana' ? 'Faturamento da Semana' : period === 'mes' ? 'Faturamento do Mês' : 'Faturamento do Ano'}
            </p>
            <div className="flex items-baseline gap-2">
               <span className="text-xl font-bold text-slate-600">R$</span>
               <h3 className="text-5xl font-black text-white font-orbitron transition-all duration-300">
                 {displayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
               </h3>
            </div>
            {selectedSubIndex !== null && (
              <button 
                onClick={() => setSelectedSubIndex(null)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl flex items-center gap-2 text-[8px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
              >
                <ChevronLeft size={10} /> Voltar para Visão Mensal
              </button>
            )}
          </section>

          {/* LISTAGEM COM GRÁFICOS HORIZONTAIS INTERATIVOS */}
          <section className="space-y-4">
             <div className="flex justify-between items-center px-4">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  {selectedSubIndex !== null ? `Detalhes por Dia da ${activeData[selectedSubIndex].label}` : 'Extrato por Período'}
                </p>
                <div className="w-10 h-0.5 bg-slate-800 rounded-full" />
             </div>

             <div className="space-y-3">
                {listItems.map((d: any, i: number) => {
                  const barWidth = maxValInList > 0 ? (d.value / maxValInList) * 100 : 0;
                  const isSelected = selectedSubIndex === i && period === 'mes';
                  
                  return (
                    <button 
                      key={i} 
                      onClick={() => handleSubSelect(i)}
                      disabled={selectedSubIndex !== null} // Trava clique se já estiver em drill-down (para evitar confusão)
                      className={`w-full text-left bg-slate-950 border p-5 rounded-[28px] space-y-3 transition-all group relative overflow-hidden ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/5 scale-[1.02]' 
                          : 'border-white/5 hover:border-emerald-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between relative z-10">
                        <div>
                          <p className={`text-[8px] font-black uppercase mb-0.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {d.subLabel || d.dateLabel || 'Registrado'}
                          </p>
                          <h4 className="text-xs font-black text-white uppercase">{d.label}</h4>
                        </div>
                        <div className="text-right">
                           <p className={`text-sm font-black font-mono ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                             R$ {d.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                           </p>
                        </div>
                      </div>
                      
                      {/* Barra Horizontal */}
                      <div className="h-2 bg-slate-900 rounded-full overflow-hidden relative z-10">
                        <div 
                          className={`h-full bg-gradient-to-r transition-all duration-1000 ease-out ${
                            isSelected ? 'from-emerald-400 to-teal-200' : 'from-emerald-600 to-teal-400 opacity-60'
                          }`}
                          style={{ width: `${Math.max(barWidth, 1)}%` }}
                        />
                      </div>

                      {/* Indicador de Clique (Apenas na visão principal do mês) */}
                      {period === 'mes' && selectedSubIndex === null && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight size={16} className="text-teal-400" />
                        </div>
                      )}
                    </button>
                  );
                })}
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
