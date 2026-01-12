
import React, { useState } from 'react';
import { Star, MessageSquare, Send, X, CheckCircle2 } from 'lucide-react';

interface ServiceRatingModalProps {
  clientName: string;
  serviceName: string;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}

export const ServiceRatingModal: React.FC<ServiceRatingModalProps> = ({ clientName, serviceName, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSend = () => {
    if (rating === 0) return alert("Por favor, selecione uma nota.");
    onSubmit(rating, comment);
    setIsSent(true);
    setTimeout(onClose, 2000);
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl" onClick={onClose} />
      
      <div className="relative w-full max-w-sm glass-card rounded-[40px] p-8 shadow-2xl border border-teal-500/20 text-center space-y-8 animate-in zoom-in duration-300">
        {!isSent ? (
          <>
            <header className="space-y-2">
              <div className="w-16 h-16 bg-teal-500/10 rounded-3xl flex items-center justify-center text-teal-400 mx-auto border border-teal-500/20">
                <Star size={32} />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">O que achou?</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-4">
                Olá {clientName}, como foi seu atendimento de <span className="text-teal-400">{serviceName}</span>?
              </p>
            </header>

            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setRating(num)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    rating >= num 
                    ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/30' 
                    : 'bg-slate-900 text-slate-600'
                  }`}
                >
                  <Star size={24} fill={rating >= num ? "currentColor" : "none"} />
                </button>
              ))}
            </div>

            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2">
                <MessageSquare size={12} /> Alguma sugestão ou elogio?
               </label>
               <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ex: Adorei o corte, ambiente muito bom!"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:border-teal-400 focus:outline-none transition-all h-24 placeholder:text-slate-800"
               />
            </div>

            <button
              onClick={handleSend}
              className="w-full bg-teal-500 text-slate-950 font-black py-4 rounded-2xl shadow-xl shadow-teal-500/20 flex items-center justify-center gap-3 transition-transform active:scale-95 uppercase text-xs tracking-widest"
            >
              <Send size={18} /> Enviar Feedback
            </button>
          </>
        ) : (
          <div className="py-12 flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <CheckCircle2 size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Muito Obrigado!</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">Sua opinião ajuda a melhorar nosso serviço.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
