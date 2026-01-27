
import React, { useState, useMemo, useEffect } from 'react';
import { Service, Professional, BookingModel, QueueItem, DaySchedule } from '../types';
import { X, User, Clock, Timer, Plus, Trash2, Users, Calendar, AlertCircle, CheckCircle2, Coffee, Scissors } from 'lucide-react';

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
  workingDays?: number[];
  dailySchedules?: Record<number, DaySchedule>;
  initialName?: string;
  onClose: () => void;
  onSubmit: (data: { 
    mainPerson: { name: string; service: string };
    companions: { name: string; service: string }[];
    professionalId: string; 
    type: 'walk-in' | 'appointment';
    scheduledTime?: string;
  }) => void;
}

export const JoinQueueModal: React.FC<JoinQueueModalProps> = ({ 
  services, professionals, bookingModel, currentQueue, workingDays = [1,2,3,4,5,6], dailySchedules, initialName = '', onClose, onSubmit 
}) => {
  const [name, setName] = useState(initialName);
  const [serviceName, setServiceName] = useState(services[0]?.name || '');
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [professionalId, setProfessionalId] = useState('any');
  const [type, setType] = useState<'walk-in' | 'appointment'>(bookingModel === 'appointment' ? 'appointment' : 'walk-in');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');

  useEffect(() => {
    if (initialName && !name) setName(initialName);
  }, [initialName]);

  const INTERVAL = 15;   

  const addCompanion = () => {
    setCompanions([...companions, { id: Math.random().toString(36).substr(2, 9), name: '', service: services[0]?.name || '' }]);
  };

  const removeCompanion = (id: string) => setCompanions(companions.filter(c => c.id !== id));
  const updateCompanion = (id: string, field: 'name' | 'service', value: string) => setCompanions(companions.map(c => c.id === id ? { ...c, [field]: value } : c));

  const totalDuration = useMemo(() => {
    const mainSrv = services.find(s => s.name === serviceName);
    let duration = Number(mainSrv?.duration) || 30;
    companions.forEach(c => {
      const srv = services.find(s => s.name === c.service);
      duration += Number(srv?.duration || 30);
    });
    return duration;
  }, [serviceName, companions, services]);

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
    let lunchStartMinutes = -1;
    let lunchEndMinutes = -1;
    if (currentDaySchedule.hasLunch && currentDaySchedule.lunchStart && currentDaySchedule.lunchEnd) {
      const [lh1, lm1] = currentDaySchedule.lunchStart.split(':').map(Number);
      const [lh2, lm2] = currentDaySchedule.lunchEnd.split(':').map(Number);
      lunchStartMinutes = lh1 * 60 + lm1;
      lunchEndMinutes = lh2 * 60 + lm2;
    }
    const proAppointments = currentQueue.filter(item => item.type === 'appointment' && item.professionalId === professionalId && item.scheduledTime?.startsWith(scheduledDate));
    const busyBlocks = proAppointments.map(ap => {
      const timeStr = ap.scheduledTime?.split(' ')[1] || '00:00';
      const [h, m] = timeStr.split(':').map(Number);
      const start = h * 60 + m;
      const srv = services.find(s => s.name === ap.service);
      return { start, end: start + (Number(srv?.duration) || 30) };
    });
    const isToday = scheduledDate === new Date().toISOString().split('T')[0];
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    for (let minutes = dayStartMinutes; minutes <= dayEndMinutes - totalDuration; minutes += INTERVAL) {
      const slotStart = minutes;
      const slotEnd = minutes + totalDuration;
      if (lunchStartMinutes !== -1) {
        const conflictsWithLunch = (slotStart >= lunchStartMinutes && slotStart < lunchEndMinutes) || (slotEnd > lunchStartMinutes && slotEnd <= lunchEndMinutes) || (slotStart <= lunchStartMinutes && slotEnd >= lunchEndMinutes);
        if (conflictsWithLunch) continue;
      }
      const isOverlap = busyBlocks.some(busy => (slotStart >= busy.start && slotStart < busy.end) || (slotEnd > busy.start && slotEnd <= busy.end) || (slotStart <= busy.start && slotEnd >= busy.end));
      if (isToday && slotStart < nowMinutes + 10) continue; 
      if (!isOverlap) {
        const h = Math.floor(minutes / 60).toString().padStart(2, '0');
        const m = (minutes % 60).toString().padStart(2, '0');
        slots.push(`${h}:${m}`);
      }
    }
    return slots;
  }, [type, professionalId, scheduledDate, currentQueue, totalDuration, services, currentDaySchedule]);

  const handleAction = () => {
    if (!name.trim()) return alert("Por favor, informe seu nome.");
    if (type === 'appointment') {
      if (!currentDaySchedule.isOpen) return alert("Desculpe, não abrimos neste dia.");
      if (professionalId === 'any') return alert("Escolha um profissional específico.");
      if (!selectedTime) return alert("Selecione um horário.");
    }
    onSubmit({
      mainPerson: { name: name.toUpperCase().trim(), service: serviceName },
      companions: companions.map(c => ({ name: c.name.toUpperCase().trim(), service: c.service })),
      professionalId,
      type,
      scheduledTime: type === 'appointment' ? `${scheduledDate} ${selectedTime}` : undefined
    });
  };

  const showAppointmentToggle = bookingModel === 'both';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-white/5 rounded-[40px] p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
        <header className="flex justify-between items-center mb-6">
           <div><h2 className="text-xl font-black text-white uppercase tracking-tighter">Entrar na Lista</h2><p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">Multi-atendimento liberado</p></div>
           <button onClick={onClose} className="p-3 bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
        </header>
        <div className="space-y-6">
          <div className="bg-slate-950/40 p-6 rounded-[32px] border border-white/5 space-y-4">
            <input value={name} onChange={e => setName(e.target.value.toUpperCase())} placeholder="SEU NOME" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none focus:border-teal-500" />
            <select value={serviceName} onChange={e => { setServiceName(e.target.value); setSelectedTime(''); }} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none appearance-none">{services.map(s => <option key={s.id} value={s.name}>{s.name} - R$ {s.price}</option>)}</select>
          </div>
          
          <div className="space-y-4">
             {showAppointmentToggle && (
               <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                 <button onClick={() => setType('walk-in')} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all ${type === 'walk-in' ? 'bg-teal-500 text-slate-950' : 'text-slate-500'}`}>Agora</button>
                 <button onClick={() => setType('appointment')} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all ${type === 'appointment' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>Agendar</button>
               </div>
             )}

             <div className="space-y-3">
               <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Atendimento com:</label>
               <select value={professionalId} onChange={e => { setProfessionalId(e.target.value); setSelectedTime(''); }} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none focus:border-teal-500">
                 <option value="any">Qualquer Atendente</option>
                 {professionals.filter(p => p.status !== 'absent').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
               </select>
             </div>

             {type === 'appointment' && (
               <div className="space-y-4 animate-in slide-in-from-top-2">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Data e Horário</label>
                    <input type="date" value={scheduledDate} onChange={e => { setScheduledDate(e.target.value); setSelectedTime(''); }} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none focus:border-indigo-500" />
                 </div>
                 <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map(time => (
                      <button key={time} onClick={() => setSelectedTime(time)} className={`py-3 rounded-xl text-[10px] font-black transition-all ${selectedTime === time ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-950 border border-slate-800 text-slate-400'} border`}>
                        {time}
                      </button>
                    ))}
                    {availableSlots.length === 0 && (
                      <div className="col-span-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                         <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">Nenhum horário disponível para este dia</p>
                      </div>
                    )}
                 </div>
               </div>
             )}
          </div>

          <button onClick={handleAction} className={`w-full py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 ${type === 'walk-in' ? 'bg-teal-500 text-slate-950' : 'bg-indigo-600 text-white'}`}>
            {type === 'walk-in' ? <Users size={18} /> : <Calendar size={18} />} 
            {type === 'walk-in' ? 'Confirmar Entrada' : 'Confirmar Agendamento'}
          </button>
        </div>
      </div>
    </div>
  );
};
