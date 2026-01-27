
import React, { useState, useMemo } from 'react';
import { QueueItem, Service, PaymentMethod } from '../types';
import { X, CreditCard, Banknote, QrCode, CheckCircle2, Copy, HeartPulse, UserCheck } from 'lucide-react';

interface ServiceCompletionModalProps {
  item: QueueItem;
  services: Service[];
  pixKey?: string;
  onClose: () => void;
  onConfirm: (method: PaymentMethod, amount: number) => void;
}

export const ServiceCompletionModal: React.FC<ServiceCompletionModalProps> = ({
  item, services, pixKey, onClose, onConfirm
}) => {
  const serviceData = services.find(s => s.name === item.service);
  
  // Lógica para detectar se é gratuito (PSF / Hospital Público)
  const isFreeService = useMemo(() => {
    if (!serviceData || !serviceData.price) return true;
    const priceNum = parseFloat(serviceData.price.replace(',', '.'));
    return isNaN(priceNum) || priceNum <= 0;
  }, [serviceData]);

  const defaultPrice = serviceData ? parseFloat(serviceData.price.replace(',', '.')) : 0;
  
  const [amount, setAmount] = useState(isNaN(defaultPrice) ? "0" : defaultPrice.toString());
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [copied, setCopied] = useState(false);

  const copyPix = () => {
    if (!pixKey) return;
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose} />
      
      <div className={`relative w-full max-w-sm glass-card rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-200 border-t-4 ${isFreeService ? 'border-teal-500' : 'border-indigo-500'}`}>
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">
            {isFreeService ? 'Concluir Atendimento' : 'Finalizar Atendimento'}
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {isFreeService ? 'Registrar término de consulta/procedimento' : `Registrar recebimento de ${item.name}`}
          </p>
        </div>

        {isFreeService ? (
          <div className="space-y-8">
            <div className="bg-teal-500/10 border border-teal-500/20 p-6 rounded-[32px] flex flex-col items-center gap-4 text-center">
               <div className="w-16 h-16 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center shadow-lg">
                  <HeartPulse size={32} />
               </div>
               <div>
                  <h4 className="text-white font-black text-sm uppercase">{item.name}</h4>
                  <p className="text-[10px] text-teal-400 font-bold uppercase mt-1">Serviço Público / Gratuito</p>
               </div>
            </div>

            <button
              onClick={() => onConfirm('cash', 0)}
              className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-5 rounded-[24px] shadow-xl shadow-teal-500/20 flex items-center justify-center gap-3 transform active:scale-95 transition-all uppercase text-xs tracking-widest"
            >
              <UserCheck size={18} />
              Confirmar Finalização
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Valor Cobrado (R$)</label>
              <input 
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white text-2xl font-black text-center focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>

            {method === 'pix' && pixKey && (
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                 <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Chave PIX</span>
                    <button onClick={copyPix} className="text-indigo-400 p-1">
                      {copied ? <span className="text-[8px] font-black">COPIADO!</span> : <Copy size={14} />}
                    </button>
                 </div>
                 <p className="text-xs font-mono font-bold text-white break-all">{pixKey}</p>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Método de Pagamento</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'pix', label: 'Pix', icon: <QrCode size={18} /> },
                  { id: 'card', label: 'Cartão', icon: <CreditCard size={18} /> },
                  { id: 'cash', label: 'Dinheiro', icon: <Banknote size={18} /> },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id as PaymentMethod)}
                    className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${
                      method === m.id 
                      ? 'border-indigo-500 bg-indigo-500/10 text-white' 
                      : 'border-slate-800 text-slate-500 bg-slate-900'
                    }`}
                  >
                    {m.icon}
                    <span className="text-[8px] font-black uppercase tracking-widest">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => onConfirm(method, parseFloat(amount))}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 transform active:scale-95 transition-all uppercase text-xs tracking-widest"
            >
              <CheckCircle2 size={18} />
              Confirmar Recebimento
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
