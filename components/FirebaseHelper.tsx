
import React from 'react';
import { AlertCircle, Code, Copy, Check, ExternalLink, Database } from 'lucide-react';

interface FirebaseHelperProps {
  error: string;
}

export const FirebaseHelper: React.FC<FirebaseHelperProps> = ({ error }) => {
  const [copied, setCopied] = React.useState(false);

  const rulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const copyRules = () => {
    navigator.clipboard.writeText(rulesCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-[32px] p-6 space-y-6 animate-in zoom-in duration-300">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-500/20">
          <AlertCircle size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Erro de Banco Detectado</h4>
          <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed">
            O Google negou o acesso. Você precisa liberar as "Regras" no seu painel do Firebase.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Copie e cole isso na aba "Rules" do Firestore:</p>
        <div className="relative group">
          <pre className="bg-slate-950 p-4 rounded-2xl text-[10px] font-mono text-teal-400 overflow-x-auto border border-white/5">
            {rulesCode}
          </pre>
          <button 
            onClick={copyRules}
            className="absolute top-2 right-2 p-2 bg-slate-800 rounded-lg text-white hover:bg-teal-500 hover:text-slate-950 transition-all"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      <a 
        href="https://console.firebase.google.com/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-full py-4 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-xl"
      >
        <ExternalLink size={14} /> Abrir Console do Firebase
      </a>
    </div>
  );
};
