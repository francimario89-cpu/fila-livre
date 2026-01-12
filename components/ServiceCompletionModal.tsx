
import React, { useState } from 'react';
import { QueueItem, Service, PaymentMethod } from '../types';
import { X, CreditCard, Banknote, QrCode, CheckCircle2 } from 'lucide-react';

interface ServiceCompletionModalProps {
  item: QueueItem;
  services: Service[];
  onClose: () => void;
  onConfirm: (method: PaymentMethod, amount: number) => void;
}

export const ServiceCompletionModal: React.FC<ServiceCompletionModalProps> = ({
  item, services, onClose, onConfirm
}) => {
  const serviceData = services.find(s => s.name === item.service);
  const defaultPrice = serviceData ? parseFloat(serviceData.price.replace(',', '.')) : 0;
  
  const [amount, setAmount] = useState(defaultPrice.toString());
  const [method, setMethod] = useState<PaymentMethod>('pix');

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-sm glass-card rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200 border-t-4 border-indigo-500">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Finalizar Atendimento</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Registrar recebimento de {item.name}</p>
        </div>

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
            Confirmar e Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
