
import React, { useState, useMemo, useEffect } from 'react';
import { Service, Professional, BookingModel, QueueItem, DaySchedule, Establishment } from '../types';
import { X, User, Clock, Timer, Plus, Trash2, Users, Calendar, AlertCircle, CheckCircle2, Coffee, Scissors, ShieldAlert, Check } from 'lucide-react';

interface Companion {
  id: string;
  name: string;
  service: string;
}

interface JoinQueueModalProps {
  establishment: Establishment; 
  services: Service[];
  professionals: Professional[];
  bookingModel: BookingModel;
  currentQueue: QueueItem[];
  workingDays?: number[];
  dailySchedules?: Record<number, DaySchedule>;
  initialName?: string;
  onClose: () => void;
  onSubmit: (data: { 
    mainPerson: { name: string; service: string };
    companions: { name: string; service: string }[];
    professionalId: string; 
    type: 'walk-in' | 'appointment';
    isPriority: boolean;
    scheduledTime?: string;
  }) => void;
}

export const JoinQueueModal: React.FC<JoinQueueModalProps> = ({ 
  establishment, services, professionals, bookingModel, currentQueue, workingDays = [1,2,3,4,5,6], dailySchedules, initialName = '', onClose, onSubmit 
}) => {
  const [name, setName] = useState(initialName);
  const [serviceName, setServiceName] = useState(services[0]?.name || '');
  const [isPriority, setIsPriority] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const anyEnabled = establishment.anyProfessionalEnabled ?? true;
  const anyLabel = establishment.anyProfessionalLabel || 'Qualquer Atendente';
  
  const [professionalId, setProfessionalId] = useState(anyEnabled ? 'any' : (professionals[0]?.id || ''));
  const [type, setType] = useState<'walk-in' | 'appointment'>(bookingModel === 'appointment' ? 'appointment' : 'walk-in');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');

  useEffect(() => {
    if (initialName && !name) setName(initialName);
  }, [initialName]);

  const INTERVAL = 15;   

  const totalDuration = useMemo(() => {
    const mainSrv = services.find(s => s.name === serviceName);
    let duration = Number(mainSrv?.duration) || 30;
    return duration;
  }, [serviceName, services]);

  const currentDaySchedule = useMemo(() => {
    const d = new Date(`${scheduledDate}T12:00:00`);
    const dayId = d.getDay();
    if (dailySchedules && dailySchedules[dayId]) return dailySchedules[dayId];
    return { isOpen: workingDays.includes(dayId), start: "08:00", end: "19:00", hasLunch: false };
  }, [scheduledDate, dailySchedules, workingDays]);

  const availableSlots = useMemo(() => {
    if (type !== 'appointment' || professionalId === 'any' || !currentDaySchedule.isOpen) return [];
    const slots: string[] = [];
    const [startH, startM] = currentDaySchedule.start.split(':').map(Number);
    const [endH, endM] = currentDaySchedule.end.split(':').map(Number);
    const dayStartMinutes = startH * 60 + startM;
    const dayEndMinutes = endH * 60 + endM;
    
    const isToday = scheduledDate === new Date().toISOString().split('T')[0];
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    
    for (let minutes = dayStartMinutes; minutes <= dayEndMinutes - totalDuration; minutes += INTERVAL) {
      if (isToday && minutes < nowMinutes + 10) continue; 
      const h = Math.floor(minutes / 60).toString().padStart(2, '0');
      const m = (minutes % 60).toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
    return slots;
  }, [type, professionalId, scheduledDate, totalDuration, currentDaySchedule]);

  const handleAction = () => {
    if (!name.trim()) return alert("Por favor, informe o nome.");
    if (type === 'appointment' && !selectedTime) return alert("Selecione um horário.");
    setShowConfirmation(true);
  };

  const handleFinalSubmit = () => {
    onSubmit({
      mainPerson: { name: name.toUpperCase().trim(), service: serviceName },
      companions: [],
      professionalId,
      type,
      isPriority,
      scheduledTime: type === 'appointment' ? `${scheduledDate} ${selectedTime}` : undefined
    });
  };

  const selectedProfessionalName = useMemo(() => {
    if (professionalId === 'any') return anyLabel;
    return professionals.find(p => p.id === professionalId)?.name || 'Profissional';
  }, [professionalId, professionals, anyLabel]);

  const showAppointmentToggle = bookingModel === 'both';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-white/5 rounded-[40px] p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
        <header className="flex justify-between items-center mb-6">
           <div>
             <h2 className="text-xl font-black text-white uppercase tracking-tighter">
               {showConfirmation ? 'Confirmar Dados' : 'Ficha de Atendimento'}
             </h2>
             <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">
               {showConfirmation ? 'Revise os dados antes de entrar' : 'Preencha os dados abaixo'}
             </p>
           </div>
           {!showConfirmation && (
             <button onClick={onClose} className="p-3 bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
           )}
        </header>

        {showConfirmation ? (
          <div className="space-y-8 animate-in zoom-in-95 duration-200">
             <div className="bg-slate-950/60 p-6 rounded-[32px] border border-teal-500/20 space-y-6">
                <div className="space-y-1">
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Paciente / Cliente</p>
                   <p className="text-lg font-black text-white uppercase">{name}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Procedimento</p>
                      <p className="text-xs font-bold text-teal-400 uppercase">{serviceName}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Atendente</p>
                      <p className="text-xs font-bold text-indigo-400 uppercase">{selectedProfessionalName}</p>
                   </div>
                </div>

                {type === 'appointment' && (
                  <div className="space-y-1 pt-2 border-t border-slate-800">
                     <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Horário Agendado</p>
                     <p className="text-xs font-bold text-white uppercase">{new Date(scheduledDate).toLocaleDateString('pt-BR')} às {selectedTime}</p>
                  </div>
                )}

                {isPriority && (
                   <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 rounded-xl border border-red-500/20">
                      <ShieldAlert size={12} className="text-red-500" />
                      <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Atendimento Prioritário Ativado</span>
                   </div>
                )}
             </div>

             <div className="flex gap-3">
                <button onClick={() => setShowConfirmation(false)} className="flex-1 py-5 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Voltar</button>
                <button onClick={handleFinalSubmit} className="flex-[2] bg-teal-500 text-slate-950 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-teal-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <Check size={18} /> Confirmar e Entrar
                </button>
             </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-950/40 p-6 rounded-[32px] border border-white/5 space-y-4">
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Nome Completo</label>
                 <input value={name} onChange={e => setName(e.target.value.toUpperCase())} placeholder="NOME DO PACIENTE" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none focus:border-teal-500" />
              </div>
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Procedimento/Serviço</label>
                 <select value={serviceName} onChange={e => { setServiceName(e.target.value); setSelectedTime(''); }} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none appearance-none">{services.map(s => <option key={s.id} value={s.name}>{s.name} - R$ {s.price}</option>)}</select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-2xl">
               <div className="flex items-center gap-3">
                  <ShieldAlert className="text-red-500" size={20} />
                  <div>
                     <h4 className="text-[10px] font-black text-white uppercase">Atendimento Prioritário</h4>
                     <p className="text-[7px] text-slate-500 font-bold uppercase">Idoso, Gestante ou Deficiente</p>
                  </div>
               </div>
               <button 
                  onClick={() => setIsPriority(!isPriority)}
                  className={`w-12 h-6 rounded-full relative transition-all ${isPriority ? 'bg-red-500' : 'bg-slate-800'}`}
               >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPriority ? 'left-7' : 'left-1'}`} />
               </button>
            </div>
            
            <div className="space-y-4">
               {showAppointmentToggle && (
                 <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                   <button onClick={() => setType('walk-in')} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all ${type === 'walk-in' ? 'bg-teal-500 text-slate-950' : 'text-slate-500'}`}>Agora</button>
                   <button onClick={() => setType('appointment')} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all ${type === 'appointment' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Agendar</button>
                 </div>
               )}

               <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Direcionar para:</label>
                 <select value={professionalId} onChange={e => { setProfessionalId(e.target.value); setSelectedTime(''); }} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none focus:border-teal-500">
                   {anyEnabled && <option value="any">{anyLabel}</option>}
                   {professionals.filter(p => p.status !== 'absent').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </select>
               </div>

               {type === 'appointment' && (
                 <div className="space-y-4 animate-in slide-in-from-top-2">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Data</label>
                      <input type="date" value={scheduledDate} onChange={e => { setScheduledDate(e.target.value); setSelectedTime(''); }} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none focus:border-indigo-500" />
                   </div>
                   <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map(time => (
                        <button key={time} onClick={() => setSelectedTime(time)} className={`py-3 rounded-xl text-[10px] font-black transition-all ${selectedTime === time ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-950 border border-slate-800 text-slate-400'} border`}>
                          {time}
                        </button>
                      ))}
                   </div>
                 </div>
               )}
            </div>

            <button onClick={handleAction} className={`w-full py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 ${type === 'walk-in' ? 'bg-teal-500 text-slate-950' : 'bg-indigo-600 text-white'}`}>
              {type === 'walk-in' ? <Users size={18} /> : <Calendar size={18} />} 
              {type === 'walk-in' ? 'Próxima Etapa' : 'Verificar Horários'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
