
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Trash2, BarChart3, Users2, UserCircle, Zap, FileText, Store, Monitor, UserPlus, Coffee, DoorClosed, CheckCircle2, Scissors, ListOrdered, Settings, QrCode, BellRing, UserX, Mail, Link as LinkIcon, CheckCircle, Clock, Save, Building2
} from 'lucide-react';
import { Professional, Service, QueueItem, EstStatus, BookingModel, RevenueRecord, PlanType, Establishment } from '../types';
import { FinancialDetailModal } from './FinancialDetailModal';

interface AdminPanelProps {
  establishment: Establishment;
  queue: QueueItem[];
  services: Service[];
  professionals: Professional[];
  estStatus: EstStatus;
  bookingModel: BookingModel;
  plan: PlanType;
  trialStartedAt: number;
  loyaltyEnabled: boolean;
  revenue: RevenueRecord[];
  pixKey: string;
  onUpdateEstablishment: (data: Partial<Establishment>) => void;
  onDeleteEstablishment: () => void;
  onSetPixKey: (key: string) => void;
  onUpdateStatus: (s: EstStatus) => void;
  onSetBookingModel: (model: BookingModel) => void;
  onSetLoyaltyEnabled: (enabled: boolean) => void;
  onCallNext: () => void;
  onFinish: (item: QueueItem) => void;
  onNoShow: (id?: string) => void;
  onUpdateServices: (s: Service[]) => void;
  onUpdatePros: (p: Professional[]) => void;
  onManualJoin: (data: any) => void;
  onToggleTVMode: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  establishment, queue, services, professionals, estStatus, bookingModel, loyaltyEnabled, revenue, pixKey,
  onUpdateEstablishment, onDeleteEstablishment, onSetPixKey, onUpdateStatus, onSetBookingModel, onSetLoyaltyEnabled, onCallNext, onFinish, onNoShow, onUpdateServices, onUpdatePros, onManualJoin, onToggleTVMode
}) => {
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [isAddingManual, setIsAddingManual] = useState(false);
  
  // Estados para edição do perfil (evita saves em tempo real enquanto digita)
  const [tempName, setTempName] = useState(establishment.name);
  const [tempHours, setTempHours] = useState(establishment.openingHours || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [isAddingService, setIsAddingService] = useState(false);
  const [newSName, setNewSName] = useState('');
  const [newSPrice, setNewSPrice] = useState('');
  const [newSDuration, setNewSDuration] = useState('30');

  const [isAddingPro, setIsAddingPro] = useState(false);
  const [newProName, setNewProName] = useState('');
  const [newProEmail, setNewProEmail] = useState('');

  const [manualName, setManualName] = useState('');
  const [manualService, setManualService] = useState(services[0]?.name || '');

  // Sincroniza se o estabelecimento mudar externamente
  useEffect(() => {
    setTempName(establishment.name);
    setTempHours(establishment.openingHours || '');
  }, [establishment.name, establishment.openingHours]);

  const totalEarnings = useMemo(() => revenue.reduce((acc, curr) => acc + curr.amount, 0), [revenue]);
  const servingList = useMemo(() => queue.filter(i => i.status === 'serving'), [queue]);
  const nextInLine = useMemo(() => queue.find(i => i.status === 'waiting'), [queue]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    await onUpdateEstablishment({ name: tempName, openingHours: tempHours });
    setTimeout(() => setIsSavingProfile(false), 1000);
  };

  const handleAddService = () => {
    if (!newSName || !newSPrice) return;
    const newService: Service = {
      id: `srv-${Date.now()}`,
      name: newSName.toUpperCase(),
      price: newSPrice,
      duration: parseInt(newSDuration) || 30,
      establishmentId: establishment.id
    };
    onUpdateServices([...services, newService]);
    setNewSName(''); setNewSPrice(''); setNewSDuration('30'); setIsAddingService(false);
  };

  const handleUpdateServiceField = (id: string, field: 'price' | 'duration', value: string) => {
    const updated = services.map(s => {
      if (s.id === id) {
        return { 
          ...s, 
          [field]: field === 'duration' ? (parseInt(value) || 0) : value 
        };
      }
      return s;
    });
    onUpdateServices(updated);
  };

  const handleAddProfessional = () => {
    if (!newProName) return;
    const newPro: Professional = {
      id: `pro-${Date.now()}`,
      name: newProName.toUpperCase(),
      status: 'available',
      establishmentId: establishment.id,
      email: newProEmail.toLowerCase() || undefined
    };
    onUpdatePros([...professionals, newPro]);
    setNewProName(''); setNewProEmail(''); setIsAddingPro(false);
  };

  const handleUpdateProEmail = (id: string, email: string) => {
    const updated = professionals.map(p => p.id === id ? { ...p, email: email.toLowerCase() } : p);
    onUpdatePros(updated);
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      
      {/* 0. PERFIL DO NEGÓCIO */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Building2 size={14} className="text-teal-400" /> Perfil do Negócio
        </h3>
        <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 space-y-6 shadow-2xl">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Unidade</label>
            <div className="relative">
              <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
              <input 
                value={tempName} 
                onChange={(e) => setTempName(e.target.value.toUpperCase())} 
                placeholder="NOME DA LOJA" 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white text-xs font-bold outline-none focus:border-teal-500 transition-all uppercase"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Horário de Funcionamento</label>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
              <input 
                value={tempHours} 
                onChange={(e) => setTempHours(e.target.value)} 
                placeholder="EX: SEG A SEX, 08H ÀS 20H" 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white text-xs font-bold outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
          
          <button 
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
            className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${isSavingProfile ? 'bg-emerald-500 text-slate-950' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'}`}
          >
            {isSavingProfile ? <CheckCircle2 size={18} /> : <Save size={18} />}
            {isSavingProfile ? 'Alterações Salvas!' : 'Salvar Perfil'}
          </button>
        </div>
      </section>

      {/* 1. MÓDULO DE GESTÃO DE ATENDIMENTOS ATIVOS */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <BellRing size={14} className="text-teal-400" /> Atendimentos em Curso
        </h3>
        
        <div className="space-y-3">
          {servingList.length > 0 ? servingList.map(serving => (
            <div key={serving.id} className="bg-slate-900 border border-slate-800 rounded-[32px] p-5 shadow-xl flex items-center justify-between gap-4 animate-in slide-in-from-right-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-500/10 text-teal-400 rounded-2xl flex items-center justify-center">
                  <UserCircle size={28} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase leading-none">{serving.name}</h4>
                  <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">
                    {serving.service} • <span className="text-teal-400 font-black">{professionals.find(p => p.id === serving.professionalId)?.name || 'Barbeiro'}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  title="Faltou / No-show"
                  onClick={(e) => { e.stopPropagation(); onNoShow(serving.id); }} 
                  className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                >
                  <UserX size={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onFinish(serving); }} 
                  className="bg-teal-500 text-slate-950 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-teal-500/10 active:scale-95 transition-all flex items-center gap-2"
                >
                  <CheckCircle size={14} /> Finalizar
                </button>
              </div>
            </div>
          )) : (
            <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-[32px] p-8 text-center">
              <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest">Nenhum atendimento no momento</p>
            </div>
          )}

          {/* Botão Chamar Próximo */}
          {nextInLine && (
            <button onClick={onCallNext} className="w-full bg-indigo-600 text-white py-5 rounded-[32px] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4">
              <Zap size={20} /> Chamar {nextInLine.name}
            </button>
          )}
        </div>
      </section>

      {/* 2. OPERAÇÃO RÁPIDA & TV */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Store size={14} className="text-indigo-400" /> Painel de Controle
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => onUpdateStatus('open')} className={`flex flex-col items-center gap-2 py-4 rounded-3xl border-2 transition-all ${estStatus === 'open' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 bg-slate-900 text-slate-600'}`}>
            <CheckCircle2 size={18}/>
            <span className="text-[8px] font-black uppercase">Aberto</span>
          </button>
          <button onClick={() => onUpdateStatus('lunch')} className={`flex flex-col items-center gap-2 py-4 rounded-3xl border-2 transition-all ${estStatus === 'lunch' ? 'border-amber-500 bg-emerald-500/10 text-amber-400' : 'border-slate-800 bg-slate-900 text-slate-600'}`}>
            <Coffee size={18}/>
            <span className="text-[8px] font-black uppercase">Pausa</span>
          </button>
          <button onClick={() => onUpdateStatus('closed')} className={`flex flex-col items-center gap-2 py-4 rounded-3xl border-2 transition-all ${estStatus === 'closed' ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-slate-800 bg-slate-900 text-slate-600'}`}>
            <DoorClosed size={18}/>
            <span className="text-[8px] font-black uppercase">Fechado</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={onToggleTVMode} className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex items-center justify-center gap-3 shadow-xl hover:border-teal-500/30 transition-all active:scale-95">
            <Monitor size={22} className="text-teal-400" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Painel TV</span>
          </button>
          <button onClick={() => setIsAddingManual(true)} className="bg-indigo-600 p-6 rounded-[32px] flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">
            <UserPlus size={22} className="text-white" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Manual</span>
          </button>
        </div>
      </section>

      {/* 3. FINANCEIRO & PIX */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <BarChart3 size={14} className="text-emerald-500" /> Módulo Financeiro
        </h3>
        <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 space-y-8 shadow-2xl">
           <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Faturamento Acumulado</p>
                <h4 className="text-3xl font-black text-white mt-1 font-orbitron">R$ {totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
              </div>
              <button onClick={() => setIsFinancialModalOpen(true)} className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all">
                <FileText size={24} />
              </button>
           </div>
           
           <div className="space-y-3">
             <div className="flex items-center gap-2 ml-1">
                <QrCode size={12} className="text-emerald-500" />
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Chave PIX do Negócio</label>
             </div>
             <input 
                value={pixKey}
                onChange={(e) => onSetPixKey(e.target.value)}
                placeholder="Informe sua chave para receber pagamentos"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 px-6 text-white text-xs font-bold outline-none focus:border-emerald-500 transition-all placeholder:text-slate-800"
             />
           </div>
        </div>
      </section>

      {/* 4. GESTÃO DE SERVIÇOS - EDITÁVEL */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Scissors size={14} className="text-indigo-400" /> Catálogo de Serviços
          </h3>
          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">Ajuste o tempo para mudar a agenda</p>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {services.map(s => (
            <div key={s.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex flex-col gap-4 group shadow-xl transition-all hover:border-indigo-500/20">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center">
                      <Scissors size={20} />
                    </div>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight">{s.name}</h4>
                 </div>
                 <button onClick={() => onUpdateServices(services.filter(x => x.id !== s.id))} className="p-2 text-slate-700 hover:text-red-500 transition-colors">
                   <Trash2 size={18} />
                 </button>
               </div>

               <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Preço Sugerido</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-500">R$</span>
                      <input 
                        type="text" 
                        value={s.price} 
                        onChange={(e) => handleUpdateServiceField(s.id, 'price', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-8 pr-3 text-[10px] font-black text-white outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Duração da Sessão</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" size={12} />
                      <input 
                        type="number" 
                        value={s.duration} 
                        onChange={(e) => handleUpdateServiceField(s.id, 'duration', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-8 pr-12 text-[10px] font-black text-white outline-none focus:border-indigo-500 transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-600 uppercase">Min</span>
                    </div>
                  </div>
               </div>
            </div>
          ))}
          
          {isAddingService ? (
            <div className="bg-slate-900 border border-indigo-500/30 p-8 rounded-[40px] space-y-4 animate-in slide-in-from-bottom-4">
               <input placeholder="NOME (EX: CORTE SOCIAL)" value={newSName} onChange={e => setNewSName(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none" />
               <div className="grid grid-cols-2 gap-4">
                  <input placeholder="VALOR (EX: 30,00)" value={newSPrice} onChange={e => setNewSPrice(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none" />
                  <input type="number" placeholder="TEMPO (MIN)" value={newSDuration} onChange={e => setNewSDuration(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none" />
               </div>
               <div className="flex gap-2 pt-2">
                 <button onClick={() => setIsAddingService(false)} className="flex-1 py-4 text-[9px] font-black text-slate-500 uppercase">Voltar</button>
                 <button onClick={handleAddService} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl text-[9px] font-black uppercase shadow-lg shadow-indigo-500/20">Salvar Serviço</button>
               </div>
            </div>
          ) : (
            <button onClick={() => setIsAddingService(true)} className="w-full border-2 border-dashed border-slate-800 p-8 rounded-[32px] text-slate-600 hover:text-indigo-400 hover:border-indigo-500/30 transition-all flex flex-col items-center gap-2">
               <Plus size={24} />
               <span className="text-[9px] font-black uppercase tracking-widest">Novo Serviço</span>
            </button>
          )}
        </div>
      </section>

      {/* 5. GESTÃO DE PROFISSIONAIS */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Users2 size={14} className="text-indigo-400" /> Equipe Profissional
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {professionals.map(p => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex flex-col gap-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${p.status === 'available' ? 'bg-emerald-500/10 text-emerald-500' : p.status === 'busy' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-red-500/10 text-red-500'}`}>
                    <UserCircle size={24} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase">{p.name}</h4>
                    <p className="text-[8px] text-slate-600 font-bold uppercase">{p.status === 'available' ? 'Ativo' : p.status === 'busy' ? 'Atendendo' : 'Pausa'}</p>
                  </div>
                </div>
                <button onClick={() => onUpdatePros(professionals.filter(x => x.id !== p.id))} className="p-2 text-slate-800 hover:text-red-500 transition-colors">
                  <Trash2 size={18}/>
                </button>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                 <LinkIcon size={12} className="text-indigo-400" />
                 <input placeholder="Vincular E-mail do Colaborador" value={p.email || ''} onChange={(e) => handleUpdateProEmail(p.id, e.target.value)} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2 px-4 text-[9px] text-white focus:border-indigo-500 outline-none" />
              </div>
            </div>
          ))}
          {isAddingPro ? (
            <div className="bg-slate-900 border border-indigo-500/30 p-8 rounded-[40px] space-y-4 animate-in slide-in-from-bottom-4">
               <input placeholder="NOME DO PROFISSIONAL" value={newProName} onChange={e => setNewProName(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white uppercase outline-none" />
               <input placeholder="E-MAIL (OPCIONAL)" value={newProEmail} onChange={e => setNewProEmail(e.target.value.toLowerCase())} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white outline-none" />
               <div className="flex gap-2 pt-2">
                 <button onClick={() => setIsAddingPro(false)} className="flex-1 py-4 text-[9px] font-black text-slate-500 uppercase">Voltar</button>
                 <button onClick={handleAddProfessional} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl text-[9px] font-black uppercase shadow-lg shadow-indigo-500/20">Cadastrar</button>
               </div>
            </div>
          ) : (
            <button onClick={() => setIsAddingPro(true)} className="w-full border-2 border-dashed border-slate-800 p-8 rounded-[32px] text-slate-600 hover:text-indigo-400 hover:border-indigo-500/30 transition-all flex flex-col items-center gap-2">
               <Plus size={24} />
               <span className="text-[9px] font-black uppercase tracking-widest">Novo Barbeiro</span>
            </button>
          )}
        </div>
      </section>

      {/* 6. CONFIGURAÇÕES DE REGRA */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Settings size={14} className="text-indigo-400" /> Configurações de Regra
        </h3>
        <div className="bg-slate-900 border border-slate-800 rounded-[40px] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-slate-800 space-y-5">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl"><ListOrdered size={18} /></div>
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Modelo de Fila</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[{ id: 'queue', label: 'Só Fila' }, { id: 'appointment', label: 'Só Agenda' }, { id: 'both', label: 'Híbrido' }].map(m => (
                <button key={m.id} onClick={() => onSetBookingModel(m.id as BookingModel)} className={`py-3 rounded-xl text-[7px] font-black uppercase border transition-all ${bookingModel === m.id ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-8 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl"><Settings size={18} /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Fidelidade VIP</span>
                  <span className="text-[7px] font-bold text-slate-500 uppercase mt-1.5">{loyaltyEnabled ? 'Ativo' : 'Desativado'}</span>
                </div>
             </div>
             <button onClick={() => onSetLoyaltyEnabled(!loyaltyEnabled)} className={`w-16 h-9 rounded-full relative transition-all ${loyaltyEnabled ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                <div className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow-lg transition-all ${loyaltyEnabled ? 'left-8' : 'left-1'}`} />
             </button>
          </div>
        </div>
      </section>

      {isAddingManual && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md" onClick={() => setIsAddingManual(false)} />
          <div className="relative w-full max-sm bg-slate-900 border border-white/10 p-8 rounded-[40px] space-y-6 shadow-2xl">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Entrada de Balcão</h3>
            <div className="space-y-4">
              <input placeholder="NOME DO CLIENTE" value={manualName} onChange={e => setManualName(e.target.value.toUpperCase())} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-xs font-bold text-white uppercase outline-none" />
              <select value={manualService} onChange={e => setManualService(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-xs font-bold text-white uppercase outline-none">
                {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <button onClick={() => { if(!manualName) return; onManualJoin({ name: manualName, service: manualService, professionalId: 'any', type: 'walk-in' }); setManualName(''); setIsAddingManual(false); }} className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black text-[10px] uppercase shadow-xl active:scale-95 transition-all">Inserir Agora</button>
          </div>
        </div>
      )}

      {isFinancialModalOpen && <FinancialDetailModal revenue={revenue} onClose={() => setIsFinancialModalOpen(false)} />}
    </div>
  );
};
