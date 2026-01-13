
import React from 'react';
import { AlertCircle, Code, Copy, Check, ExternalLink, Globe, ShieldAlert } from 'lucide-react';

interface FirebaseHelperProps {
  error: string;
  type?: 'rules' | 'domain';
}

export const FirebaseHelper: React.FC<FirebaseHelperProps> = ({ error, type = 'rules' }) => {
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

  const currentDomain = window.location.hostname;

  return (
    <div className="bg-slate-900 border border-white/10 rounded-[32px] p-6 space-y-6 animate-in zoom-in duration-300 shadow-2xl">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${type === 'domain' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-red-500 shadow-red-500/20'}`}>
          {type === 'domain' ? <Globe size={24} /> : <ShieldAlert size={24} />}
        </div>
        <div className="space-y-1">
          <h4 className="text-[11px] font-black text-white uppercase tracking-widest">
            {type === 'domain' ? 'Domínio não Autorizado' : 'Acesso ao Banco Negado'}
          </h4>
          <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed">
            {type === 'domain' 
              ? `O Google precisa que você autorize este endereço para permitir o login.`
              : `O Google negou o acesso. Você precisa liberar as "Regras" no seu painel do Firebase.`}
          </p>
        </div>
      </div>

      {type === 'domain' ? (
        <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-white/5">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Siga estes passos:</p>
          <ol className="text-[9px] text-slate-300 space-y-2 list-decimal ml-4 font-bold uppercase tracking-tight">
            <li>Vá no Console do Firebase &gt; Authentication</li>
            <li>Clique na aba <span className="text-amber-500">Settings (Configurações)</span></li>
            <li>Menu lateral: <span className="text-amber-500">Authorized domains</span></li>
            <li>Clique em "Add domain" e cole: <br/><span className="text-teal-400 font-mono lowercase">{currentDomain}</span></li>
          </ol>
        </div>
      ) : (
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
      )}

      <a 
        href="https://console.firebase.google.com/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-full py-4 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-xl hover:bg-slate-200 transition-colors"
      >
        <ExternalLink size={14} /> Abrir Console do Firebase
      </a>
    </div>
  );
};
