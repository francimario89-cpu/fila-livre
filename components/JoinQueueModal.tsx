
import React, { useState, useMemo, useEffect } from 'react';
import { Service, Professional, BookingModel, QueueItem, DaySchedule, Establishment } from '../types';
import { X, User, Clock, Timer, Plus, Trash2, Users, Calendar, AlertCircle, CheckCircle2, Coffee, Scissors, ShieldAlert, Check, MapPin } from 'lucide-react';

interface JoinQueueModalProps {
  establishment: Establishment; 
  services: Service[];
  professionals: Professional[];
  bookingModel: BookingModel;
  currentQueue: QueueItem[];
  userProfile?: any;
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
  establishment, services, professionals, bookingModel, currentQueue, userProfile, workingDays = [1,2,3,4,5,6], dailySchedules, initialName = '', onClose, onSubmit 
}) => {
  const [name, setName] = useState(initialName || userProfile?.name || '');
  const [serviceName, setServiceName] = useState(services[0]?.name || '');
  const [isPriority, setIsPriority] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const anyEnabled = establishment.anyProfessionalEnabled ?? true;
  const anyLabel = establishment.anyProfessionalLabel || 'Qualquer Atendente';
  
  const [professionalId, setProfessionalId] = useState(anyEnabled ? 'any' : (professionals[0]?.id || ''));
  const [type, setType] = useState<'walk-in' | 'appointment'>(bookingModel === 'appointment' ? 'appointment' : 'walk-in');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');

  const selectedProfessionalName = useMemo(() => {
    if (professionalId === 'any') return anyLabel;
    return professionals.find(p => p.id === professionalId)?.name || 'Profissional';
  }, [professionalId, professionals, anyLabel]);

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

  const currentDaySchedule = useMemo(() => {
    const d = new Date(`${scheduledDate}T12:00:00`);
    const dayId = d.getDay();
    if (dailySchedules && dailySchedules[dayId]) return dailySchedules[dayId];
    return { isOpen: workingDays.includes(dayId), start: "08:00", end: "19:00", hasLunch: false };
  }, [scheduledDate, dailySchedules, workingDays]);

  const availableSlots = useMemo(() => {
    if (type !== 'appointment' || !currentDaySchedule.isOpen) return [];
    const slots: string[] = [];
    const [startH, startM] = currentDaySchedule.start.split(':').map(Number);
    const [endH, endM] = currentDaySchedule.end.split(':').map(Number);
    const dayStartMinutes = startH * 60 + startM;
    const dayEndMinutes = endH * 60 + endM;
    
    const isToday = scheduledDate === new Date().toISOString().split('T')[0];
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    
    // Intervalo de 15 min para agendamento
    for (let minutes = dayStartMinutes; minutes <= dayEndMinutes - 30; minutes += 15) {
      if (isToday && minutes < nowMinutes + 15) continue; 
      const h = Math.floor(minutes / 60).toString().padStart(2, '0');
      const m = (minutes % 60).toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
    return slots;
  }, [type, scheduledDate, currentDaySchedule]);

  const isAppointment = type === 'appointment';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-white/5 rounded-[40px] p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
        <header className="flex justify-between items-center mb-6">
           <div>
             <h2 className="text-xl font-black text-white uppercase tracking-tighter">
               {showConfirmation 
                 ? (isAppointment ? 'CONFIRMAR AGENDAMENTO' : 'REVISAR ENTRADA') 
                 : (isAppointment ? 'NOVO AGENDAMENTO' : 'FICHA DE ENTRADA')}
             </h2>
             <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">
               {showConfirmation ? 'Revise os dados abaixo antes de confirmar' : 'Preencha os dados do atendimento'}
             </p>
           </div>
           {!showConfirmation && (
             <button onClick={onClose} className="p-3 bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
           )}
        </header>

        {showConfirmation ? (
          <div className="space-y-8 animate-in zoom-in-95 duration-200">
             <div className="bg-slate-950/60 p-8 rounded-[32px] border border-teal-500/20 space-y-6">
                <div className="text-center space-y-2">
                   {isAppointment ? <Calendar size={48} className="text-indigo-400 mx-auto" /> : <Users size={48} className="text-teal-400 mx-auto" />}
                   <h3 className="text-lg font-black text-white uppercase tracking-tight">
                     {isAppointment ? 'RESERVAR HORÁRIO' : 'ENTRAR NA LISTA AGORA'}
                   </h3>
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                     ATENDENTE SELECIONADO:
                   </p>
                   <div className={`py-3 px-6 rounded-2xl border inline-block ${isAppointment ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-teal-500/10 border-teal-500/20'}`}>
                      <p className={`text-xl font-black uppercase tracking-tighter ${isAppointment ? 'text-indigo-400' : 'text-teal-400'}`}>
                         {selectedProfessionalName}
                      </p>
                   </div>
                </div>

                {isAppointment && (
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-1">
                     <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">DATA E HORA</p>
                     <p className="text-sm font-bold text-white uppercase">{new Date(scheduledDate + 'T12:00:00').toLocaleDateString('pt-BR')} às {selectedTime}</p>
                  </div>
                )}
                
                <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                   <div>
                     <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Paciente</p>
                     <p className="text-xs font-bold text-white uppercase truncate">{name}</p>
                   </div>
                   <div>
                     <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Serviço</p>
                     <p className="text-xs font-bold text-white uppercase truncate">{serviceName}</p>
                   </div>
                </div>

                {isPriority && (
                   <div className="flex items-center justify-center gap-2 text-red-500 py-2 bg-red-500/5 rounded-xl border border-red-500/10">
                      <ShieldAlert size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Atendimento Prioritário</span>
                   </div>
                )}
             </div>

             <div className="flex gap-3">
                <button onClick={() => setShowConfirmation(false)} className="flex-1 py-5 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Voltar</button>
                <button 
                  onClick={handleFinalSubmit} 
                  className={`flex-[2] py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all ${isAppointment ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-teal-500 text-slate-950 shadow-teal-500/20'}`}
                >
                  <Check size={18} /> {isAppointment ? 'Agendar este Horário' : 'Entrar na Fila Agora'}
                </button>
             </div>
          </div>
        ) : (
          <div className="space-y-6">
            {bookingModel === 'both' && (
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-3xl border border-white/5">
                <button 
                  onClick={() => setType('walk-in')} 
                  className={`py-4 rounded-2xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${type === 'walk-in' ? 'bg-teal-500 text-slate-950' : 'text-slate-500'}`}
                >
                  <Users size={14} /> Fila de Agora
                </button>
                <button 
                  onClick={() => setType('appointment')} 
                  className={`py-4 rounded-2xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${type === 'appointment' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                >
                  <Calendar size={14} /> Agendar
                </button>
              </div>
            )}

            <div className="bg-slate-950/40 p-6 rounded-[32px] border border-white/5 space-y-4">
              <div className="space-y-1">
                 <div className="flex justify-between items-center mb-1">
                   <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Nome do Paciente</label>
                   {userProfile?.name && name !== userProfile.name && (
                     <button 
                       onClick={() => setName(userProfile.name)} 
                       className="text-[8px] font-black text-teal-500 uppercase tracking-widest flex items-center gap-1"
                     >
                       <User size={10} /> Usar meu nome
                     </button>
                   )}
                 </div>
                 <input 
                   value={name} 
                   onChange={e => setName(e.target.value.toUpperCase())} 
                   placeholder="NOME DO PACIENTE" 
                   className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none focus:border-teal-500" 
                 />
              </div>
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Procedimento/Serviço</label>
                 <select value={serviceName} onChange={e => { setServiceName(e.target.value); }} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none appearance-none">{services.map(s => <option key={s.id} value={s.name}>{s.name} - R$ {s.price}</option>)}</select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-2xl">
               <div className="flex items-center gap-3">
                  <ShieldAlert className="text-red-500" size={20} />
                  <div>
                     <h4 className="text-[10px] font-black text-white uppercase">Prioridade</h4>
                     <p className="text-[7px] text-slate-500 font-bold uppercase">Idoso ou Gestante</p>
                  </div>
               </div>
               <button onClick={() => setIsPriority(!isPriority)} className={`w-12 h-6 rounded-full relative transition-all ${isPriority ? 'bg-red-500' : 'bg-slate-800'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPriority ? 'left-7' : 'left-1'}`} />
               </button>
            </div>
            
            <div className="space-y-4">
               <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Escolher Atendente:</label>
                 <select value={professionalId} onChange={e => { setProfessionalId(e.target.value); }} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none focus:border-teal-500">
                   {anyEnabled && <option value="any">{anyLabel}</option>}
                   {professionals.filter(p => p.status !== 'absent').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </select>
               </div>

               {isAppointment && (
                 <div className="space-y-4 animate-in slide-in-from-top-2">
                   <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Data</label>
                      <input type="date" value={scheduledDate} onChange={e => { setScheduledDate(e.target.value); setSelectedTime(''); }} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none" />
                   </div>
                   <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map(time => (
                        <button key={time} onClick={() => setSelectedTime(time)} className={`py-3 rounded-xl text-[10px] font-black transition-all ${selectedTime === time ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-900 border border-slate-800 text-slate-500'} border`}>
                          {time}
                        </button>
                      ))}
                      {availableSlots.length === 0 && <p className="col-span-4 text-center text-[8px] text-red-500 font-black uppercase">Loja fechada nesta data.</p>}
                   </div>
                 </div>
               )}
            </div>

            <button 
              onClick={handleAction} 
              className={`w-full py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 ${isAppointment ? 'bg-indigo-600 text-white' : 'bg-teal-500 text-slate-950'}`}
            >
              {isAppointment ? <Calendar size={18} /> : <Users size={18} />} 
              {isAppointment ? 'Escolher Horário' : 'Revisar Pedido'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
