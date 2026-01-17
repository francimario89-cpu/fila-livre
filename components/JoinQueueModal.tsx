
import React, { useState, useMemo, useEffect } from 'react';
import { Service, Professional, BookingModel, QueueItem, DaySchedule } from '../types';
import { X, User, Clock, Timer, Plus, Trash2, Users, Calendar, AlertCircle, CheckCircle2, Coffee } from 'lucide-react';

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

  // Sincroniza o nome inicial caso ele mude ou chegue após o carregamento
  useEffect(() => {
    if (initialName && !name) {
      setName(initialName);
    }
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

    // Lógica de Almoço
    let lunchStartMinutes = -1;
    let lunchEndMinutes = -1;
    if (currentDaySchedule.hasLunch && currentDaySchedule.lunchStart && currentDaySchedule.lunchEnd) {
      const [lh1, lm1] = currentDaySchedule.lunchStart.split(':').map(Number);
      const [lh2, lm2] = currentDaySchedule.lunchEnd.split(':').map(Number);
      lunchStartMinutes = lh1 * 60 + lm1;
      lunchEndMinutes = lh2 * 60 + lm2;
    }

    const proAppointments = currentQueue.filter(item => 
      item.type === 'appointment' && 
      item.professionalId === professionalId &&
      item.scheduledTime?.startsWith(scheduledDate)
    );

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

      // 1. Verifica se conflita com o almoço
      if (lunchStartMinutes !== -1) {
        // Se o slot começa ou termina dentro do horário de almoço, ou engloba o almoço
        const conflictsWithLunch = 
          (slotStart >= lunchStartMinutes && slotStart < lunchEndMinutes) || 
          (slotEnd > lunchStartMinutes && slotEnd <= lunchEndMinutes) ||
          (slotStart <= lunchStartMinutes && slotEnd >= lunchEndMinutes);
        
        if (conflictsWithLunch) continue;
      }

      // 2. Verifica se já está ocupado por outro agendamento
      const isOverlap = busyBlocks.some(busy => 
        (slotStart >= busy.start && slotStart < busy.end) || 
        (slotEnd > busy.start && slotEnd <= busy.end) ||
        (slotStart <= busy.start && slotEnd >= busy.end)
      );

      if (isToday && slotStart < nowMinutes + 10) continue; 
      if (!isOverlap) {
        const h = Math.floor(minutes / 60).toString().padStart(2, '0');
        const m = (minutes % 60).toString().padStart(2, '0');
        slots.push(`${h}:${m}`);
      }
    }
    return slots;
  }, [type, professionalId, scheduledDate, currentQueue, totalDuration, services, currentDaySchedule]);

  const estimatedWait = useMemo(() => {
    if (type === 'appointment') return null;
    const activePros = professionals.filter(p => p.status !== 'absent');
    if (activePros.length === 0) return 999;
    
    const calculateWait = (proId: string) => {
      const proServing = currentQueue.find(i => i.status === 'serving' && i.professionalId === proId);
      const proWaiting = currentQueue.filter(i => i.status === 'waiting' && i.professionalId === proId);
      let totalMinutes = 0;
      if (proServing) {
        const srv = services.find(s => s.name === proServing.service);
        const elapsed = Math.floor((Date.now() - proServing.timestamp) / 60000);
        totalMinutes += Math.max(5, (Number(srv?.duration) || 30) - elapsed);
      }
      proWaiting.forEach(item => {
        const srv = services.find(s => s.name === item.service);
        totalMinutes += (Number(srv?.duration) || 30);
      });
      return totalMinutes;
    };

    return professionalId === 'any' ? Math.min(...activePros.map(p => calculateWait(p.id))) : calculateWait(professionalId);
  }, [currentQueue, type, services, professionalId, professionals]);

  const callPredictedTime = useMemo(() => {
    if (estimatedWait === null || estimatedWait === 999) return null;
    return new Date(Date.now() + estimatedWait * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [estimatedWait]);

  const handleAction = () => {
    if (!name.trim()) return alert("Por favor, informe seu nome.");
    if (type === 'appointment') {
      if (!currentDaySchedule.isOpen) return alert("Desculpe, não abrimos neste dia.");
      if (professionalId === 'any') return alert("Escolha um profissional específico.");
      if (!selectedTime) return alert("Selecione um horário.");
    }
    if (companions.find(c => !c.name.trim())) return alert("Informe o nome de todos.");
    
    onSubmit({
      mainPerson: { name: name.toUpperCase().trim(), service: serviceName },
      companions: companions.map(c => ({ name: c.name.toUpperCase().trim(), service: c.service })),
      professionalId,
      type,
      scheduledTime: type === 'appointment' ? `${scheduledDate} ${selectedTime}` : undefined
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 rounded-[40px] p-8 border border-white/5 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
        <header className="flex justify-between items-center mb-6">
           <div><h2 className="text-xl font-black text-white uppercase tracking-tighter">Reservar Vaga</h2><p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">Sua vez com inteligência</p></div>
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
            <div className="bg-slate-950/40 p-6 rounded-[32px] border border-white/5 space-y-4">
              <div className="flex items-center gap-2 mb-2"><User size={14} className="text-teal-400" /><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Responsável</span></div>
              <input value={name} onChange={e => setName(e.target.value.toUpperCase())} placeholder="SEU NOME" className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none focus:border-teal-500 transition-all" />
              <select value={serviceName} onChange={e => { setServiceName(e.target.value); setSelectedTime(''); }} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none appearance-none">{services.map(s => <option key={s.id} value={s.name}>{s.name} - R$ {s.price}</option>)}</select>
            </div>

            {companions.map((comp, idx) => (
              <div key={comp.id} className="bg-indigo-600/5 border border-indigo-500/10 p-5 rounded-[32px] space-y-3 animate-in slide-in-from-right-4">
                <div className="flex justify-between items-center"><span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{idx + 1}º Acompanhante</span><button onClick={() => removeCompanion(comp.id)} className="text-red-500/50 hover:text-red-500"><Trash2 size={14}/></button></div>
                <input value={comp.name} onChange={e => updateCompanion(comp.id, 'name', e.target.value.toUpperCase())} placeholder="NOME" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[10px] font-bold text-white uppercase outline-none" />
                <select value={comp.service} onChange={e => { updateCompanion(comp.id, 'service', e.target.value); setSelectedTime(''); }} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[10px] font-bold text-white uppercase outline-none">{services.map(s => <option key={s.id} value={s.name}>{s.name} - R$ {s.price}</option>)}</select>
              </div>
            ))}

            <button onClick={addCompanion} className="w-full py-4 border-2 border-dashed border-slate-800 rounded-[24px] text-slate-600 hover:text-teal-400 hover:border-teal-500/30 transition-all flex items-center justify-center gap-2"><Plus size={16} /><span className="text-[9px] font-black uppercase tracking-widest">Adicionar Acompanhante</span></button>

            <div className="pt-4 space-y-4">
              <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Com quem?</label><select value={professionalId} onChange={e => { setProfessionalId(e.target.value); setSelectedTime(''); }} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none"><option value="any">{type === 'appointment' ? 'Selecione um Profissional' : 'Primeiro Disponível'}</option>{professionals.filter(p => p.status !== 'absent').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              {type === 'appointment' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Escolha o Dia</label><input type="date" value={scheduledDate} onChange={e => { setScheduledDate(e.target.value); setSelectedTime(''); }} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white outline-none" /></div>
                  {!currentDaySchedule.isOpen ? (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-3 text-amber-500"><AlertCircle size={16} /><p className="text-[9px] font-black uppercase">Não abrimos neste dia.</p></div>
                  ) : professionalId !== 'any' ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Vagas ({totalDuration} min)</label>
                        <div className="flex flex-col items-end">
                           <span className="text-[8px] font-bold text-teal-400 uppercase">{currentDaySchedule.start} às {currentDaySchedule.end}</span>
                           {currentDaySchedule.hasLunch && <span className="text-[7px] font-black text-amber-500 uppercase flex items-center gap-1"><Coffee size={8}/> Pausa: {currentDaySchedule.lunchStart}-{currentDaySchedule.lunchEnd}</span>}
                        </div>
                      </div>
                      {availableSlots.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">{availableSlots.map(slot => (<button key={slot} onClick={() => setSelectedTime(slot)} className={`py-3 rounded-xl text-[10px] font-black transition-all ${selectedTime === slot ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-950 text-slate-500 border border-slate-800 hover:border-indigo-500'}`}>{slot}</button>))}</div>
                      ) : (<div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500"><AlertCircle size={16} /><p className="text-[9px] font-black uppercase">Sem vagas neste dia.</p></div>)}
                    </div>
                  ) : <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl text-center"><p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Escolha um profissional</p></div>}
                </div>
              )}
            </div>
          </div>

          {type === 'walk-in' && callPredictedTime && (
            <div className="bg-teal-500/10 border border-teal-500/20 rounded-[32px] p-6 flex items-center gap-5 shadow-2xl"><div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg"><Timer size={24} /></div><div><p className="text-[10px] text-teal-400 font-black uppercase tracking-widest leading-none">Previsão</p><p className="text-xl font-black text-white mt-1.5 uppercase tracking-tighter">Às {callPredictedTime}</p></div></div>
          )}

          <button onClick={handleAction} className={`w-full py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 ${type === 'walk-in' ? 'bg-teal-500 text-slate-950 shadow-teal-500/20' : 'bg-indigo-600 text-white shadow-indigo-600/20'}`}><Users size={18} />{type === 'walk-in' ? `Confirmar ${companions.length + 1} Entrada${companions.length > 0 ? 's' : ''}` : 'Agendar Horário'}</button>
        </div>
      </div>
    </div>
  );
};
