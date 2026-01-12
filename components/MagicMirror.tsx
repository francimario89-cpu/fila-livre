
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { Sparkles, Camera, Send, Loader2, Lock, ShoppingCart, Coins, Share2, Download, Check } from 'lucide-react';
import { PlanType } from '../types';

interface MagicMirrorProps {
  plan: PlanType;
  aiCredits: number;
  onPurchaseRequest: () => void;
  onUseCredit: () => void;
}

export const MagicMirror: React.FC<MagicMirrorProps> = ({ plan, aiCredits, onPurchaseRequest, onUseCredit }) => {
  const [prompt, setPrompt] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleConsult = async () => {
    if (!prompt) return;
    if (plan === 'free' && aiCredits <= 0) return;

    setLoading(true);
    try {
      const result = await geminiService.getStyleRecommendation(prompt, image?.split(',')[1]);
      setRecommendation(result);
      if (plan === 'free') onUseCredit();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleShare = async () => {
    if (!recommendation) return;
    
    const shareText = `✨ Minha Recomendação de Estilo no Fila Livre:\n\n${recommendation}\n\nConsulte sua IA também!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meu Novo Estilo - Fila Livre',
          text: shareText,
          url: window.location.href
        });
      } catch (err) {
        console.error('Erro ao compartilhar:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(shareText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!recommendation) return;
    
    const element = document.createElement("a");
    const file = new Blob([recommendation], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "meu_estilo_fila_livre.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Estado de Bloqueio por falta de créditos no plano Free
  if (plan === 'free' && aiCredits <= 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <header className="text-center space-y-2">
          <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
            <Sparkles className="text-indigo-400" />
            Espelho Mágico IA
          </h2>
        </header>
        <div className="bg-slate-900 border-2 border-dashed border-indigo-500/20 rounded-[40px] p-10 flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-500 shadow-2xl shadow-indigo-500/10">
            <Lock size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-white uppercase tracking-tighter">Recurso Premium</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed px-4">
              Este estabelecimento usa a versão básica. <br/> 
              Libere seu acesso individual para consultar nossa IA.
            </p>
          </div>
          <button 
            onClick={onPurchaseRequest}
            className="w-full bg-indigo-600 text-white font-black py-5 px-8 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-3 transition-transform active:scale-95"
          >
            <ShoppingCart size={18} />
            Liberar 5 Consultas (R$ 10,00)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="text-teal-400 animate-pulse" />
            Espelho Mágico IA
          </h2>
          <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest">Estilo & Visagismo Digital</p>
        </div>
        {plan === 'free' && (
          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 rounded-full">
            <Coins size={12} className="text-indigo-400" />
            <span className="text-[9px] font-black text-white">{aiCredits} CONSULTAS RESTANTES</span>
          </div>
        )}
      </header>

      <div className="glass-card rounded-[40px] p-8 space-y-8 border-white/5">
        <div className="aspect-square bg-slate-950 rounded-[32px] relative overflow-hidden border-2 border-dashed border-slate-800 flex flex-col items-center justify-center group cursor-pointer transition-all hover:border-teal-500/50">
          {image ? (
            <img src={image} alt="Selfie" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-700 group-hover:text-teal-400 transition-colors">
                <Camera size={32} />
              </div>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Tirar ou enviar Selfie</p>
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={handleImageChange}
          />
        </div>

        <div className="space-y-3">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Como você quer ficar?</label>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Quero um degradê moderno que combine com barba..."
              className="w-full bg-slate-950 border border-slate-800 rounded-3xl p-5 text-sm text-white focus:border-teal-500 focus:outline-none transition-all min-h-[120px] placeholder:text-slate-800"
            />
            <button
              onClick={handleConsult}
              disabled={loading || !prompt}
              className="absolute bottom-4 right-4 bg-teal-500 p-3 rounded-2xl text-slate-950 shadow-2xl disabled:opacity-50 transition-all active:scale-90"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
            </button>
          </div>
        </div>
      </div>

      {recommendation && (
        <div className="glass-card rounded-[40px] p-8 border-l-4 border-amber-500 animate-in slide-in-from-bottom-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-amber-500 font-black flex items-center gap-2 uppercase text-[10px] tracking-widest">
              <Sparkles size={16} /> Recomendação do Mestre
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={handleDownload}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                title="Salvar como arquivo"
              >
                <Download size={16} />
              </button>
              <button 
                onClick={handleShare}
                className={`p-2 bg-slate-900 border border-slate-800 rounded-xl transition-colors ${copySuccess ? 'text-teal-400' : 'text-slate-400 hover:text-white'}`}
                title="Compartilhar estilo"
              >
                {copySuccess ? <Check size={16} /> : <Share2 size={16} />}
              </button>
            </div>
          </div>
          <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
            {recommendation}
          </div>
        </div>
      )}
    </div>
  );
};
