
import React from 'react';
import { QueueItem } from '../types';
import { Layers, Zap, Clock, Trash2, ArrowRight, Building2, MapPin, ListOrdered, CheckCircle2 } from 'lucide-react';

interface MyQueuesViewProps {
  userQueues: QueueItem[];
  onLeaveQueue: (estId: string, queueId: string) => void;
  onSelectEstablishment: (id: string) => void;
}

export const MyQueuesView: React.FC<MyQueuesViewProps> = ({ userQueues, onLeaveQueue, onSelectEstablishment }) => {
  const activeCount = userQueues.length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      <header className="text-center space-y-2">
        <div className="w-16 h-16 bg-teal-500/10 text-teal-400 rounded-[28px] flex items-center justify-center mx-auto border border-teal-500/20 mb-4">
           <Layers size={32} />
        </div>
        <h2 className="text-2xl font-black font-orbitron uppercase tracking-tighter">MEUS ATENDIMENTOS</h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Você está em {activeCount} {activeCount === 1 ? 'fila' : 'filas'} simultâneas</p>
      </header>

      {activeCount === 0 ? (
        <div className="bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[40px] p-12 text-center space-y-4">
           <p className="text-slate-600 font-black uppercase text-xs tracking-widest">Nenhuma fila ativa no momento</p>
           <p className="text-[10px] text-slate-700 font-bold uppercase">Conecte-se a uma unidade para começar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {userQueues.map((item) => {
            const isServing = item.status === 'serving';
            
            return (
              <div key={item.id} className={`bg-slate-900 border ${isServing ? 'border-teal-500 shadow-lg shadow-teal-500/10' : 'border-slate-800'} rounded-[32px] p-6 space-y-6 animate-in slide-in-from-right-4`}>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${isServing ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-teal-400'}`}>
                          {isServing ? <Zap size={24} className="animate-pulse" /> : <ListOrdered size={24} />}
                       </div>
                       <div>
                          <h3 className="font-black text-white text-lg uppercase leading-none">{item.establishmentName || 'Unidade'}</h3>
                          <div className="flex items-center gap-1.5 mt-1.5 text-slate-500">
                             <MapPin size={10} />
                             <span className="text-[8px] font-black uppercase tracking-widest">ID: {item.establishmentId}</span>
                          </div>
                       </div>
                    </div>
                    <button 
                      onClick={() => onLeaveQueue(item.establishmentId, item.id)}
                      className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
                    >
                       <Trash2 size={18} />
                    </button>
                 </div>

                 <div className="p-5 bg-slate-950 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div>
                       <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Serviço Solicitado</p>
                       <p className="text-xs font-black text-white uppercase">{item.service}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Status Atual</p>
                       <span className={`text-[10px] font-black uppercase tracking-tighter ${isServing ? 'text-teal-400' : 'text-amber-500'}`}>
                          {isServing ? 'EM ATENDIMENTO!' : 'AGUARDANDO NA LISTA'}
                       </span>
                    </div>
                 </div>

                 {isServing && (
                   <div className="bg-teal-500/10 border border-teal-500/30 p-4 rounded-2xl flex items-center gap-3">
                      <CheckCircle2 size={16} className="text-teal-400" />
                      <p className="text-[10px] text-white font-bold uppercase">Dirija-se ao local, é a sua vez!</p>
                   </div>
                 )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
