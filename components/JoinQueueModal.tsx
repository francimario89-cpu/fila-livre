
import React, { useState, useMemo } from 'react';
import { Service, Professional, BookingModel, QueueItem } from '../types';
import { X, User, ClipboardList, Clock, CalendarCheck, UserCheck, Timer, ChevronRight, Zap, Circle, Calendar, Plus, Trash2, Users } from 'lucide-react';

interface Companion {
  id: string;
  name: string;
  service: string;
}

interface JoinQueueModalProps {
  services: Service[];
  professionals: Professional[];
  bookingModel: BookingModel;
  currentQueue: QueueItem[];
  onClose: () => void;
  onSubmit: (data: { 
    mainPerson: { name: string; service: string };
    companions: { name: string; service: string }[];
    professionalId: string; 
    type: 'walk-in' | 'appointment';
    scheduledTime?: string;
  }) => void;
}

export const formatDuration = (totalMinutes: number) => {
  if (totalMinutes < 5) return "Agora mesmo";
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
};

export const JoinQueueModal: React.FC<JoinQueueModalProps> = ({ 
  services, professionals, bookingModel, currentQueue, onClose, onSubmit 
}) => {
  const [name, setName] = useState('');
  const [serviceName, setServiceName] = useState(services[0]?.name || '');
  const [companions, setCompanions] = useState<Companion[]>([]);
  
  const [professionalId, setProfessionalId] = useState('any');
  const [type, setType] = useState<'walk-in' | 'appointment'>(bookingModel === 'appointment' ? 'appointment' : 'walk-in');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('');

  const addCompanion = () => {
    const newCompanion: Companion = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      service: services[0]?.name || ''
    };
    setCompanions([...companions, newCompanion]);
  };

  const removeCompanion = (id: string) => {
    setCompanions(companions.filter(c => c.id !== id));
  };

  const updateCompanion = (id: string, field: 'name' | 'service', value: string) => {
    setCompanions(companions.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const calculateWait = (proId: string) => {
    const proServing = currentQueue.find(i => i.status === 'serving' && i.professionalId === proId);
    const proWaiting = currentQueue.filter(i => i.status === 'waiting' && i.professionalId === proId);
    
    let totalMinutes = 0;
    if (proServing) {
      const srv = services.find(s => s.name === proServing.service);
      const elapsed = Math.floor((Date.now() - proServing.timestamp) / 60000);
      totalMinutes += Math.max(5, (srv?.duration || 30) - elapsed);
    }
    proWaiting.forEach(item => {
      const srv = services.find(s => s.name === item.service);
      totalMinutes += (srv?.duration || 30);
    });
    return totalMinutes;
  };

  const estimatedWait = useMemo(() => {
    if (type === 'appointment') return null;
    const activePros = professionals.filter(p => p.status !== 'absent');
    if (activePros.length === 0) return 999;
    
    let baseWait = 0;
    if (professionalId === 'any') {
      baseWait = Math.min(...activePros.map(p => calculateWait(p.id)));
    } else {
      baseWait = calculateWait(professionalId);
    }

    // Soma a duração do serviço principal + acompanhantes para a previsão de término, 
    // mas a previsão de INÍCIO é baseada no que já está na fila.
    return baseWait;
  }, [currentQueue, type, services, professionalId, professionals]);

  const callPredictedTime = useMemo(() => {
    if (estimatedWait === null || estimatedWait === 999) return null;
    const date = new Date(Date.now() + estimatedWait * 60000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [estimatedWait]);

  const handleAction = () => {
    if (!name.trim()) return alert("Por favor, informe seu nome.");
    const invalidCompanion = companions.find(c => !c.name.trim());
    if (invalidCompanion) return alert("Por favor, informe o nome de todos os acompanhantes.");
    
    if (type === 'appointment' && (!scheduledDate || !scheduledTime)) return alert("Escolha data e hora do agendamento.");
    
    const payload: any = {
      mainPerson: { name: name.toUpperCase().trim(), service: serviceName },
      companions: companions.map(c => ({ name: c.name.toUpperCase().trim(), service: c.service })),
      professionalId,
      type
    };

    if (type === 'appointment') {
      payload.scheduledTime = `${scheduledDate} ${scheduledTime}`;
    }

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 rounded-[40px] p-8 border border-white/5 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
        <header className="flex justify-between items-center mb-6">
           <div>
             <h2 className="text-xl font-black text-white uppercase tracking-tighter">Reservar Vaga</h2>
             <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">Sua vez com inteligência</p>
           </div>
           <button onClick={onClose} className="p-3 bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
        </header>

        <div className="space-y-6">
          {bookingModel === 'both' && (
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
               <button onClick={() => setType('walk-in')} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all ${type === 'walk-in' ? 'bg-teal-500 text-slate-950' : 'text-slate-500'}`}>Fila Agora</button>
               <button onClick={() => setType('appointment')} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all ${type === 'appointment' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Agendar Hora</button>
            </div>
          )}

          <div className="space-y-4">
            {/* Pessoa Principal */}
            <div className="bg-slate-950/40 p-6 rounded-[32px] border border-white/5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                 <User size={14} className="text-teal-400" />
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Responsável / Pai</span>
              </div>
              <div className="space-y-4">
                <input value={name} onChange={e => setName(e.target.value.toUpperCase())} placeholder="SEU NOME" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none focus:border-teal-500 transition-all" />
                <select value={serviceName} onChange={e => setServiceName(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none appearance-none">
                  {services.map(s => <option key={s.id} value={s.name}>{s.name} - R$ {s.price}</option>)}
                </select>
              </div>
            </div>

            {/* Acompanhantes */}
            {companions.length > 0 && (
              <div className="space-y-3">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Acompanhantes (Filhos/Amigos)</p>
                {companions.map((comp, idx) => (
                  <div key={comp.id} className="bg-indigo-600/5 border border-indigo-500/10 p-5 rounded-[32px] space-y-3 animate-in slide-in-from-right-4">
                    <div className="flex justify-between items-center">
                       <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{idx + 1}º Acompanhante</span>
                       <button onClick={() => removeCompanion(comp.id)} className="text-red-500/50 hover:text-red-500"><Trash2 size={14}/></button>
                    </div>
                    <input 
                      value={comp.name} 
                      onChange={e => updateCompanion(comp.id, 'name', e.target.value.toUpperCase())} 
                      placeholder="NOME DO ACOMPANHANTE" 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[10px] font-bold text-white uppercase outline-none focus:border-indigo-500" 
                    />
                    <select 
                      value={comp.service} 
                      onChange={e => updateCompanion(comp.id, 'service', e.target.value)} 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[10px] font-bold text-white uppercase outline-none appearance-none"
                    >
                      {services.map(s => <option key={s.id} value={s.name}>{s.name} - R$ {s.price}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={addCompanion}
              className="w-full py-4 border-2 border-dashed border-slate-800 rounded-[24px] text-slate-600 hover:text-teal-400 hover:border-teal-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              <span className="text-[9px] font-black uppercase tracking-widest">Adicionar Acompanhante</span>
            </button>

            <div className="pt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Com quem?</label>
                <select value={professionalId} onChange={e => setProfessionalId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none appearance-none">
                  <option value="any">Primeiro Disponível</option>
                  {professionals.filter(p => p.status !== 'absent').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {type === 'appointment' && (
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white outline-none" />
                  <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white outline-none" />
                </div>
              )}
            </div>
          </div>

          {type === 'walk-in' && callPredictedTime && (
            <div className="bg-teal-500/10 border border-teal-500/20 rounded-[32px] p-6 flex items-center gap-5 shadow-2xl">
               <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg">
                  <Timer size={24} />
               </div>
               <div>
                  <p className="text-[10px] text-teal-400 font-black uppercase tracking-widest leading-none">Previsão de Chamada</p>
                  <p className="text-xl font-black text-white mt-1.5 uppercase tracking-tighter">Será chamado às {callPredictedTime}</p>
               </div>
            </div>
          )}

          <button onClick={handleAction} className={`w-full py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 ${type === 'walk-in' ? 'bg-teal-500 text-slate-950 shadow-teal-500/20' : 'bg-indigo-600 text-white shadow-indigo-600/20'}`}>
            <Users size={18} />
            {type === 'walk-in' 
              ? `Confirmar ${companions.length + 1} Entrada${companions.length > 0 ? 's' : ''}` 
              : 'Agendar Horário'}
          </button>
        </div>
      </div>
    </div>
  );
};
