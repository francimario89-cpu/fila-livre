
import React, { useState, useEffect } from 'react';
import { LOGO_SVG } from '../constants';
import { 
  ChevronRight, 
  CreditCard, 
  Banknote, 
  QrCode, 
  X, 
  Copy, 
  CheckCircle2, 
  Loader2,
  ShieldCheck
} from 'lucide-react';

interface PaymentViewProps {
  userName: string;
  amount: string;
  onClose: () => void;
  onConfirm: (method: string) => void;
}

type PaymentStep = 'selection' | 'pix_pending' | 'card_form' | 'processing' | 'success';

export const PaymentView: React.FC<PaymentViewProps> = ({ userName, amount, onClose, onConfirm }) => {
  const [step, setStep] = useState<PaymentStep>('selection');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [copied, setCopied] = useState(false);

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    if (method === 'Pix') {
      setStep('processing');
      setTimeout(() => setStep('pix_pending'), 1500);
    } else if (method === 'Cartão') {
      setStep('card_form');
    } else {
      // Dinheiro apenas fecha e avisa o barbeiro
      onConfirm('Dinheiro');
    }
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    setTimeout(() => setStep('success'), 2000);
  };

  const copyPix = () => {
    const pixCode = "00020126580014BR.GOV.BCB.PIX01364958302-3948-4930-bcde-fila-livre-8500";
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const finalize = () => {
    onConfirm(selectedMethod);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0F172A]/98 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-md flex flex-col items-center relative py-6">
        
        {step !== 'processing' && step !== 'success' && (
          <button 
            onClick={onClose}
            className="absolute top-0 right-0 p-2 bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        )}

        <div className="w-20 h-20 mb-6">
          {LOGO_SVG}
        </div>

        {/* Step: Selection */}
        {step === 'selection' && (
          <div className="w-full space-y-8 animate-in slide-in-from-bottom-4 duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-light text-slate-100">Checkout</h2>
              <p className="text-slate-400 text-sm">Olá {userName}, total a pagar:</p>
              <h3 className="text-4xl font-bold text-white pt-1">R$ {amount}</h3>
            </div>

            <div className="space-y-4">
              <p className="text-center text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Escolha o método de pagamento</p>
              
              <button 
                onClick={() => handleMethodSelect('Pix')}
                className="w-full bg-[#E2F2F0] rounded-3xl p-5 flex items-center justify-between group hover:brightness-105 transition-all shadow-lg shadow-teal-500/5"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-[#2DD4BF] p-3 rounded-2xl text-white shadow-md">
                    <QrCode size={24} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-slate-900 font-bold text-lg">Pix</h4>
                    <p className="text-slate-600 text-xs">Liberação imediata na fila</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-400" />
              </button>

              <button 
                onClick={() => handleMethodSelect('Cartão')}
                className="w-full bg-white rounded-3xl p-5 flex items-center justify-between group hover:brightness-105 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-slate-800 p-3 rounded-2xl text-white">
                    <CreditCard size={24} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-slate-900 font-bold text-lg">Cartão de Crédito</h4>
                    <p className="text-slate-600 text-xs">Pague em até 2x sem juros</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-400" />
              </button>

              <button 
                onClick={() => handleMethodSelect('Dinheiro')}
                className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center justify-between group hover:bg-slate-800 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-600/20 p-3 rounded-2xl text-emerald-400">
                    <Banknote size={24} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-slate-100 font-bold text-lg">Pagar no Local</h4>
                    <p className="text-slate-500 text-xs">Dinheiro ou maquininha</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-600" />
              </button>
            </div>
          </div>
        )}

        {/* Step: Pix Pending */}
        {step === 'pix_pending' && (
          <div className="w-full space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-xl font-bold text-white">Escaneie o QR Code</h2>
            <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl shadow-teal-500/20">
              {/* Mock QR Code */}
              <div className="w-48 h-48 bg-slate-100 flex items-center justify-center relative overflow-hidden rounded-xl">
                 <QrCode size={160} className="text-slate-900 opacity-80" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-white rounded-lg p-1 shadow-md">
                      {LOGO_SVG}
                    </div>
                 </div>
              </div>
            </div>
            
            <div className="space-y-4 px-2">
              <p className="text-slate-400 text-sm">Ou use o Pix Copia e Cola:</p>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                <code className="text-[10px] text-teal-400 truncate font-mono">00020126580014BR.GOV.BCB.PIX0136...</code>
                <button 
                  onClick={copyPix}
                  className="bg-teal-500 text-slate-950 p-2 rounded-xl flex-shrink-0 hover:bg-teal-400 transition-colors"
                >
                  {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <button 
              onClick={() => setStep('processing')}
              className="w-full bg-teal-500 text-slate-950 font-bold py-4 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Já realizei o pagamento
            </button>
          </div>
        )}

        {/* Step: Card Form */}
        {step === 'card_form' && (
          <form onSubmit={handleCardSubmit} className="w-full space-y-6 animate-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-white text-center">Dados do Cartão</h2>
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
                <input type="text" placeholder="Número do Cartão" className="w-full bg-transparent border-b border-slate-800 py-2 focus:outline-none focus:border-teal-500" required />
                <input type="text" placeholder="Nome Impresso" className="w-full bg-transparent border-b border-slate-800 py-2 focus:outline-none focus:border-teal-500 uppercase" required />
                <div className="flex gap-4">
                  <input type="text" placeholder="MM/AA" className="w-1/2 bg-transparent border-b border-slate-800 py-2 focus:outline-none focus:border-teal-500" required />
                  <input type="text" placeholder="CVV" className="w-1/2 bg-transparent border-b border-slate-800 py-2 focus:outline-none focus:border-teal-500" required />
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-bold tracking-widest justify-center">
                <ShieldCheck size={14} className="text-emerald-500" /> Pagamento 100% Seguro
              </div>
            </div>
            <button 
              type="submit"
              className="w-full bg-slate-100 text-slate-950 font-black py-4 rounded-2xl shadow-lg hover:brightness-90 transition-all"
            >
              Pagar R$ {amount}
            </button>
          </form>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center space-y-6 py-10 animate-in fade-in duration-300">
            <div className="relative">
              <Loader2 size={64} className="text-teal-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6">{LOGO_SVG}</div>
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">Processando...</h3>
              <p className="text-slate-500 text-sm">Estamos confirmando sua transação com o banco.</p>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center space-y-6 py-10 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 size={48} className="text-white" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-white">Pagamento Confirmado!</h3>
              <p className="text-slate-400 text-sm">Sua vaga está garantida. Veja sua posição na fila.</p>
            </div>
            <button 
              onClick={finalize}
              className="w-full bg-slate-100 text-slate-950 font-bold py-4 rounded-2xl"
            >
              Ver Minha Posição
            </button>
          </div>
        )}

        {step !== 'processing' && step !== 'success' && (
          <p className="text-[10px] text-slate-600 font-medium tracking-tighter uppercase mt-12">Powered by Fila Livre Pay</p>
        )}
      </div>
    </div>
  );
};
