
import React, { useState, useMemo } from 'react';
import { Service, Professional, BookingModel, QueueItem } from '../types';
import { X, User, ClipboardList, Clock, CalendarCheck, UserCheck, Timer, ChevronRight, Zap, Circle } from 'lucide-react';

interface JoinQueueModalProps {
  services: Service[];
  professionals: Professional[];
  bookingModel: BookingModel;
  currentQueue: QueueItem[];
  onClose: () => void;
  onSubmit: (data: { 
    name: string; 
    professionalId: string; 
    service: string; 
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
  const [professionalId, setProfessionalId] = useState('any');
  const [serviceName, setServiceName] = useState(services[0]?.name || '');
  const [isAppointment, setIsAppointment] = useState(bookingModel === 'appointment');
  const [scheduledTime, setScheduledTime] = useState('');

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

  const estimatedStartIn = useMemo(() => {
    if (isAppointment) return null;
    const activePros = professionals.filter(p => p.status !== 'absent');
    if (activePros.length === 0) return 999;

    if (professionalId === 'any') {
      const allTimes = activePros.map(p => calculateWait(p.id));
      return Math.min(...allTimes);
    }
    return calculateWait(professionalId);
  }, [currentQueue, isAppointment, services, professionalId, professionals]);

  const handleAction = () => {
    if (!name.trim()) return alert("Por favor, informe seu nome.");
    
    const targetPro = professionals.find(p => p.id === professionalId);
    if (professionalId !== 'any' && targetPro?.status === 'absent') {
      return alert("Este profissional não está disponível no momento.");
    }

    const payload: any = {
      name: name.toUpperCase().trim(),
      professionalId,
      service: serviceName,
      type: isAppointment ? 'appointment' : 'walk-in'
    };

    if (isAppointment && scheduledTime) {
      payload.scheduledTime = scheduledTime;
    }

    onSubmit(payload);
  };

  const availablePros = professionals.filter(p => p.status !== 'absent');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-md glass-card rounded-[40px] p-8 shadow-2xl border border-white/5 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Reservar Lugar</h2>
          <button onClick={onClose} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all"><X size={20} /></button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Como devemos te chamar?</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
              <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value.toUpperCase())} placeholder="NOME DO CLIENTE" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-800 focus:border-teal-500 outline-none text-sm font-bold uppercase" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Escolha o Profissional</label>
            <div className="grid grid-cols-1 gap-2">
              <button
                disabled={availablePros.length === 0}
                onClick={() => setProfessionalId('any')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  professionalId === 'any' 
                  ? 'border-teal-500 bg-teal-500/10 text-white' 
                  : 'border-slate-800 bg-slate-900 text-slate-500 hover:border-slate-700'
                } disabled:opacity-50`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${professionalId === 'any' ? 'bg-teal-500 text-slate-950' : 'bg-slate-800'}`}>
                    <Zap size={16} />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-black uppercase block">Qualquer um</span>
                    <span className="text-[8px] opacity-50 font-bold uppercase">Mais rápido disponível</span>
                  </div>
                </div>
              </button>

              {professionals.map((pro) => (
                <button
                  key={pro.id}
                  disabled={pro.status === 'absent'}
                  onClick={() => setProfessionalId(pro.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                    professionalId === pro.id 
                    ? 'border-indigo-500 bg-indigo-500/10 text-white' 
                    : 'border-slate-800 bg-slate-900 text-slate-500 hover:border-slate-700 disabled:opacity-20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${professionalId === pro.id ? 'bg-indigo-500 text-white' : 'bg-slate-800'}`}>
                      <User size={16} />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-black uppercase block">{pro.name}</span>
                      <div className="flex items-center gap-1">
                        <Circle size={6} fill={pro.status === 'available' ? '#10b981' : pro.status === 'absent' ? '#ef4444' : '#f59e0b'} className="text-transparent" />
                        <span className="text-[7px] font-bold uppercase opacity-60">
                          {pro.status === 'available' ? 'Online' : pro.status === 'absent' ? 'Ausente' : 'Pausa'}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Selecione o Serviço</label>
            <div className="relative">
              <ClipboardList className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
              <select value={serviceName} onChange={(e) => setServiceName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-teal-500 outline-none appearance-none text-sm font-bold">
                {services.map((s) => (
                  <option key={s.id} value={s.name}>{s.name} - R$ {s.price}</option>
                ))}
              </select>
            </div>
          </div>

          {estimatedStartIn !== null && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-4">
               <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Timer size={20} />
               </div>
               <div>
                  <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">Espera Prevista</p>
                  <p className="text-sm font-black text-white uppercase">{formatDuration(estimatedStartIn)}</p>
               </div>
            </div>
          )}

          <button 
            disabled={availablePros.length === 0}
            onClick={handleAction} 
            className="w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] bg-teal-500 text-slate-950 shadow-teal-500/20 shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale"
          >
            {availablePros.length === 0 ? 'SEM ATENDENTES DISPONÍVEIS' : 'CONFIRMAR ENTRADA'} <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
