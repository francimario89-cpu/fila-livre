
import React, { useState, useEffect } from 'react';
import { db, auth, isConfigured } from './services/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, orderBy, setDoc, getDoc, where, getDocs, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged, updatePassword, updateEmail } from 'firebase/auth';
import { Settings, RefreshCw, LogOut, Trash2, Scissors, UserCheck, ArrowRight, Coffee, UserX, CheckCircle2, Lock, Phone, ShieldCheck, Loader2, Mail, User } from 'lucide-react';
import { Layout } from './components/Layout';
import { QueueView } from './components/QueueView';
import { AdminPanel } from './components/AdminPanel';
import { LoyaltyView } from './components/LoyaltyView';
import { AuthView } from './components/AuthView';
import { BusinessSelect } from './components/BusinessSelect';
import { JoinQueueModal } from './components/JoinQueueModal';
import { ServiceCompletionModal } from './components/ServiceCompletionModal';
import { TVView } from './components/TVView';
import { QueueItem, Service, Professional, Establishment, RevenueRecord, UserProfile, ProfStatus } from './types';

const App: React.FC = () => {
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'staff' | 'client'>('client');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const [currentEst, setCurrentEst] = useState<Establishment | null>(null);
  const [activeTab, setActiveTab] = useState('fila');
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isTVMode, setIsTVMode] = useState(false);
  const [selectedQueueItem, setSelectedQueueItem] = useState<QueueItem | null>(null);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [revenue, setRevenue] = useState<RevenueRecord[]>([]);
  const [loyaltyCount, setLoyaltyCount] = useState(0);

  // Estados para Perfil
  const [newPassword, setNewPassword] = useState('');
  const [linkPhone, setLinkPhone] = useState('');
  const [linkEmail, setLinkEmail] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (!isConfigured) return;
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const email = user.email || user.uid;
        setUserEmail(email.toLowerCase());
        setIsLoggedIn(true);
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile(data);
            setUserRole(data.role || 'client');
          } else {
            setUserRole('client');
          }
        } catch (e) { setUserRole('client'); }
      } else {
        setIsLoggedIn(false); setCurrentEst(null); setUserEmail(''); setUserRole('client'); setUserProfile(null);
      }
    });
  }, []);

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) return alert("A senha deve ter no mínimo 6 caracteres.");
    setIsUpdatingProfile(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setProfileMessage({ text: 'Senha alterada com sucesso!', type: 'success' });
        setNewPassword('');
      }
    } catch (e: any) {
      alert("Para alterar a senha, você precisa ter feito login recentemente. Saia e entre de novo.");
    } finally {
      setIsUpdatingProfile(false);
      setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleLinkPhone = async () => {
    const digits = linkPhone.replace(/\D/g, '');
    if (digits.length < 10) return alert("Informe o número com DDD (ex: 11999999999)");
    setIsUpdatingProfile(true);
    try {
      if (auth.currentUser) {
        const q = query(collection(db, "users"), where("phone", "==", digits));
        const snap = await getDocs(q);
        if (!snap.empty && snap.docs[0].id !== auth.currentUser.uid) {
          alert("Este número já está vinculado a outra conta.");
          return;
        }

        await updateDoc(doc(db, "users", auth.currentUser.uid), { phone: digits });
        setUserProfile({ ...userProfile, phone: digits });
        setProfileMessage({ text: 'Celular vinculado com sucesso!', type: 'success' });
        setLinkPhone('');
      }
    } catch (e: any) {
      alert("Erro ao vincular celular.");
    } finally {
      setIsUpdatingProfile(false);
      setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleLinkRealEmail = async () => {
    if (!linkEmail.includes('@') || !linkEmail.includes('.')) return alert("E-mail inválido.");
    setIsUpdatingProfile(true);
    try {
      if (auth.currentUser) {
        const targetEmail = linkEmail.toLowerCase().trim();
        const q = query(collection(db, "users"), where("email", "==", targetEmail));
        const snap = await getDocs(q);
        if (!snap.empty) {
          alert("Este e-mail já está sendo usado por outra conta.");
          return;
        }
        await updateEmail(auth.currentUser, targetEmail);
        await updateDoc(doc(db, "users", auth.currentUser.uid), { email: targetEmail });
        setUserProfile({ ...userProfile, email: targetEmail });
        setUserEmail(targetEmail);
        setProfileMessage({ text: 'E-mail vinculado! Use-o para recuperar sua senha.', type: 'success' });
        setLinkEmail('');
      }
    } catch (e: any) {
      console.error(e);
      alert("Para vincular um novo e-mail, você deve ter feito login recentemente. Saia e entre novamente por segurança.");
    } finally {
      setIsUpdatingProfile(false);
      setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
    }
  };

  useEffect(() => {
    if (!currentEst?.id || !isLoggedIn) return;
    const unsubEst = onSnapshot(doc(db, "establishments", currentEst.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Establishment;
        setCurrentEst({ id: docSnap.id, ...data });
        if (userEmail && data.ownerEmail && userEmail.toLowerCase() === data.ownerEmail.toLowerCase()) {
          setUserRole('admin');
        } 
      }
    });
    return () => unsubEst();
  }, [currentEst?.id, isLoggedIn, userEmail]);

  useEffect(() => {
    if (!currentEst?.id || !isConfigured || !isLoggedIn) {
      setQueue([]); setServices([]); setProfessionals([]); setRevenue([]); setLoyaltyCount(0);
      return;
    }
    const unsubQueue = onSnapshot(query(collection(db, "establishments", currentEst.id, "queue"), orderBy("timestamp", "asc")), (snapshot) => {
      setQueue(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QueueItem)));
    });
    const unsubServices = onSnapshot(collection(db, "establishments", currentEst.id, "services"), (snap) => {
      setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
    });
    const unsubPros = onSnapshot(collection(db, "establishments", currentEst.id, "professionals"), (snap) => {
      setProfessionals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Professional)));
    });
    const unsubRevenue = onSnapshot(collection(db, "establishments", currentEst.id, "revenue"), (snap) => {
      setRevenue(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RevenueRecord)));
    });
    const unsubLoyalty = onSnapshot(doc(db, "establishments", currentEst.id, "loyalty", userEmail), (doc) => {
      if (doc.exists()) setLoyaltyCount(doc.data().count || 0);
      else setLoyaltyCount(0);
    });
    return () => { unsubQueue(); unsubServices(); unsubPros(); unsubRevenue(); unsubLoyalty(); };
  }, [currentEst?.id, isLoggedIn, userEmail]);

  const handleJoinQueue = async (data: any) => {
    if (!currentEst || !auth.currentUser) return;
    try {
      // Se for cliente, verifica se já tem algo ativo
      if (userRole === 'client') {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        const userData = userSnap.data() as UserProfile;
        if (userData?.activeBooking) { 
           alert("Você já possui agendamentos ativos. Finalize ou saia da fila para fazer novos."); 
           return; 
        }
      }

      const baseTime = Date.now();
      const allPeople = [data.mainPerson, ...(data.companions || [])];
      const batch = [];
      const createdIds = [];

      for (let i = 0; i < allPeople.length; i++) {
        const person = allPeople[i];
        const payload: any = {
          name: person.name,
          professionalId: data.professionalId,
          service: person.service,
          type: data.type,
          userEmail: userRole === 'client' ? userEmail : null,
          establishmentId: currentEst.id,
          status: 'waiting',
          timestamp: baseTime + (i * 10), // Pequeno delay para manter ordem exata no Firestore
          missedCount: 0
        };
        if (data.scheduledTime) payload.scheduledTime = data.scheduledTime;
        
        const docRef = await addDoc(collection(db, "establishments", currentEst.id, "queue"), payload);
        createdIds.push(docRef.id);
      }

      // Se for cliente, vincula o PRIMEIRO ID como o booking ativo (ou poderíamos vincular a lista)
      if (userRole === 'client') {
        await setDoc(doc(db, "users", auth.currentUser.uid), { 
          activeBooking: { 
            establishmentId: currentEst.id, 
            queueId: createdIds[0] // Referência para gerenciar o grupo
          } 
        }, { merge: true });
      }
      
      setIsJoinModalOpen(false);
    } catch (e: any) { alert(`Erro: ${e.message}`); }
  };

  const handleRemoveFromQueue = async (id: string, clientEmail?: string) => {
    if (!currentEst) return;
    if (userRole === 'staff') return alert("Operação não permitida.");
    try {
      await deleteDoc(doc(db, "establishments", currentEst.id, "queue", id));
      if (clientEmail) {
        // Verifica se ainda restam itens desse mesmo e-mail na fila
        const qRemaining = query(collection(db, "establishments", currentEst.id, "queue"), where("userEmail", "==", clientEmail));
        const snap = await getDocs(qRemaining);
        if (snap.empty) {
          const qUser = query(collection(db, "users"), where("email", "==", clientEmail));
          const snapUser = await getDocs(qUser);
          if (!snapUser.empty) await setDoc(doc(db, "users", snapUser.docs[0].id), { activeBooking: null }, { merge: true });
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleNoShow = async (id: string) => {
    if (!currentEst) return;
    const item = queue.find(i => i.id === id);
    if (!item) return;
    const currentMissed = item.missedCount || 0;
    if (currentMissed + 1 >= 2) {
      if (confirm(`${item.name} faltou pela 2ª vez. Remover?`)) {
        await handleRemoveFromQueue(id, item.userEmail);
      }
      return;
    }
    if (confirm(`${item.name} faltou. Mover para o final?`)) {
      await updateDoc(doc(db, "establishments", currentEst.id, "queue", id), {
        timestamp: Date.now() + 500,
        status: 'waiting',
        missedCount: currentMissed + 1
      });
    }
  };

  const handleCallNext = async (specificId?: string) => {
    if (!currentEst) return;
    const myPro = professionals.find(p => p.email?.toLowerCase() === userEmail.toLowerCase());
    const myProId = myPro?.id;

    if (specificId) {
      const item = queue.find(i => i.id === specificId);
      if (!item) return;
      await updateDoc(doc(db, "establishments", currentEst.id, "queue", specificId), { 
        status: 'serving', 
        professionalId: item.professionalId === 'any' ? (myProId || professionals[0]?.id) : item.professionalId,
        timestamp: Date.now() 
      });
      return;
    }

    const nextItem = queue.find(i => i.status === 'waiting' && (userRole === 'admin' ? true : (i.professionalId === 'any' || i.professionalId === myProId)));
    if (nextItem) {
      await updateDoc(doc(db, "establishments", currentEst.id, "queue", nextItem.id), { 
        status: 'serving', 
        professionalId: nextItem.professionalId !== 'any' ? nextItem.professionalId : (myProId || professionals[0]?.id),
        timestamp: Date.now() 
      });
    }
  };

  const handleFinish = (item: QueueItem) => {
    setSelectedQueueItem(item);
    setIsCompletionModalOpen(true);
  };

  if (isTVMode && currentEst) {
    return <TVView queue={queue} professionals={professionals} establishmentName={currentEst.name} onClose={() => setIsTVMode(false)} />;
  }

  if (!isConfigured) return <div className="min-h-screen bg-[#050810] flex items-center justify-center"><Settings className="text-teal-500 animate-spin" /></div>;
  if (!isLoggedIn) return <AuthView onLogin={(email, role) => { setUserEmail(email.toLowerCase()); setUserRole(role); setIsLoggedIn(true); setActiveTab('fila'); }} />;
  if (!currentEst) return <BusinessSelect userEmail={userEmail} userRole={userRole} onSelect={setCurrentEst} onLogout={() => auth.signOut()} />;

  const myOnDutyPro = (userRole === 'staff' || userRole === 'admin') ? professionals.find(p => p.email?.toLowerCase() === userEmail.toLowerCase()) : null;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole === 'staff' ? 'admin' : userRole} establishmentCode={currentEst.id} onBackToDashboard={() => setCurrentEst(null)} loyaltyEnabled={currentEst.loyaltyEnabled}>
      {userRole === 'staff' && !myOnDutyPro ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
           <Scissors size={40} className="text-amber-500 mb-4" />
           <h2 className="text-xl font-black text-white uppercase">Vincular Cadeira</h2>
           <div className="w-full space-y-3 max-w-xs mx-auto mt-6">
              {professionals.filter(p => !p.email).map(pro => (
                <button key={pro.id} onClick={() => updateDoc(doc(db, "establishments", currentEst.id, "professionals", pro.id), { email: userEmail })} className="w-full bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex items-center justify-between">
                  <span className="text-sm font-black text-white uppercase">{pro.name}</span>
                  <ArrowRight size={20} className="text-slate-700" />
                </button>
              ))}
           </div>
        </div>
      ) : (
        <>
          {myOnDutyPro && (
            <div className="mb-6 bg-slate-900/50 border border-slate-800 rounded-[32px] p-2 flex items-center gap-2">
               {[{ id: 'available', label: 'Livre', icon: <CheckCircle2 size={14} />, color: 'emerald' }, { id: 'lunch', label: 'Pausa', icon: <Coffee size={14} />, color: 'amber' }, { id: 'absent', label: 'Sair', icon: <UserX size={14} />, color: 'red' }].map((st) => (
                 <button key={st.id} onClick={() => updateDoc(doc(db, "establishments", currentEst.id, "professionals", myOnDutyPro.id), { status: st.id })} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[24px] text-[9px] font-black uppercase transition-all ${myOnDutyPro.status === st.id ? `bg-${st.color}-500 text-slate-950` : 'text-slate-500'}`}>
                   {st.icon} {st.label}
                 </button>
               ))}
            </div>
          )}
          {activeTab === 'fila' && (
            <QueueView 
              queue={queue} isAdmin={userRole === 'admin'} isStaff={userRole === 'staff'} userRole={userRole} myProId={myOnDutyPro?.id} currentUserEmail={userEmail} estStatus={currentEst.status} openingHours={currentEst.openingHours} bookingModel={currentEst.bookingModel || 'both'} professionals={professionals} services={services} onCallNext={handleCallNext} onFinish={handleFinish} onNoShow={handleNoShow} onOpenJoinModal={() => setIsJoinModalOpen(true)} 
              onLeaveQueue={(id) => { const item = queue.find(i => i.id === id); if(confirm(`Remover "${item?.name}" da fila?`)) handleRemoveFromQueue(id, item?.userEmail); }}
            />
          )}
          {activeTab === 'fidelidade' && <LoyaltyView cutsCount={loyaltyCount} />}
          {activeTab === 'admin' && userRole === 'admin' && (
            <AdminPanel 
              establishment={currentEst} queue={queue} services={services} professionals={professionals} estStatus={currentEst.status} bookingModel={currentEst.bookingModel || 'both'} plan={currentEst.plan || 'free'} trialStartedAt={currentEst.trialStartedAt || Date.now()} loyaltyEnabled={currentEst.loyaltyEnabled} revenue={revenue} pixKey={currentEst.pixKey || ''} 
              onUpdateEstablishment={(d) => updateDoc(doc(db, "establishments", currentEst.id), d)} onDeleteEstablishment={() => deleteDoc(doc(db, "establishments", currentEst.id))} onSetPixKey={(k) => updateDoc(doc(db, "establishments", currentEst.id), { pixKey: k })} onUpdateStatus={(s) => updateDoc(doc(db, "establishments", currentEst.id), { status: s })} onSetBookingModel={(m) => updateDoc(doc(db, "establishments", currentEst.id), { bookingModel: m })} onSetLoyaltyEnabled={(e) => updateDoc(doc(db, "establishments", currentEst.id), { loyaltyEnabled: e })}
              onCallNext={() => handleCallNext()} onFinish={handleFinish} onNoShow={handleNoShow} onUpdateServices={async (s) => { for(const sv of s) await setDoc(doc(db, "establishments", currentEst.id, "services", sv.id), sv, { merge: true }); }} onUpdatePros={async (p) => { for(const pr of p) await setDoc(doc(db, "establishments", currentEst.id, "professionals", pr.id), pr, { merge: true }); }} 
              onManualJoin={(d) => handleJoinQueue({ mainPerson: { name: d.name, service: d.service }, professionalId: d.professionalId, type: d.type })} onToggleTVMode={() => setIsTVMode(true)}
            />
          )}
          {activeTab === 'config' && (
            <div className="space-y-8 pb-32 animate-in fade-in duration-500">
               <div className="text-center space-y-4">
                 <div className="w-20 h-20 bg-slate-900 rounded-[32px] flex items-center justify-center mx-auto border border-white/5 shadow-2xl">
                    <User className="text-teal-400" size={32} />
                 </div>
                 <div>
                   <h2 className="text-2xl font-black text-white font-orbitron uppercase tracking-tighter">MEU PERFIL</h2>
                   <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Gerenciamento de Acesso</p>
                 </div>
               </div>

               {profileMessage.text && (
                 <div className={`p-5 rounded-[24px] text-center text-[10px] font-black uppercase animate-in zoom-in shadow-xl ${profileMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                    {profileMessage.text}
                 </div>
               )}

               <div className="space-y-4">
                  <section className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 space-y-8 shadow-2xl">
                    <div className="flex items-center gap-3 text-indigo-400">
                      <ShieldCheck size={18} />
                      <h3 className="text-[10px] font-black uppercase tracking-widest">Segurança da Conta</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
                          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="NOVA SENHA" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white text-xs font-bold outline-none focus:border-indigo-500 transition-all" />
                        </div>
                      </div>
                      <button disabled={isUpdatingProfile} onClick={handleUpdatePassword} className="w-full bg-slate-100 text-slate-950 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                        {isUpdatingProfile ? <Loader2 size={16} className="animate-spin" /> : "ATUALIZAR SENHA"}
                      </button>
                    </div>
                  </section>

                  <section className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 space-y-8 shadow-2xl">
                    <div className="flex items-center gap-3 text-teal-400">
                      <RefreshCw size={18} />
                      <h3 className="text-[10px] font-black uppercase tracking-widest">Vínculos de Acesso</h3>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Seu Telefone</label>
                          {userProfile?.phone && <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-black">VINCULADO</span>}
                        </div>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
                          <input type="text" value={linkPhone} onChange={(e) => setLinkPhone(e.target.value)} placeholder={userProfile?.phone || "DDD + NÚMERO"} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white text-xs font-bold outline-none focus:border-teal-500 transition-all" />
                        </div>
                        <button disabled={isUpdatingProfile} onClick={handleLinkPhone} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-700 hover:bg-slate-700 transition-all">
                           {isUpdatingProfile ? <Loader2 size={16} className="animate-spin" /> : "SALVAR TELEFONE"}
                        </button>
                      </div>
                      <div className="space-y-3 pt-6 border-t border-slate-800/50">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Seu E-mail</label>
                          {!userEmail.includes('@telefone.com') && <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-black">VINCULADO</span>}
                        </div>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
                          <input type="email" value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} placeholder={userEmail.includes('@telefone.com') ? "ADICIONAR E-MAIL REAL" : userEmail} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white text-xs font-bold outline-none focus:border-indigo-500 transition-all" />
                        </div>
                        {userEmail.includes('@telefone.com') && (
                          <button disabled={isUpdatingProfile} onClick={handleLinkRealEmail} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                             {isUpdatingProfile ? <Loader2 size={16} className="animate-spin" /> : "VINCULAR E-MAIL REAL"}
                          </button>
                        )}
                      </div>
                    </div>
                  </section>
               </div>

               <div className="space-y-3">
                  <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-800/50 text-slate-400 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase border border-white/5"><RefreshCw size={14} /> Sincronizar Dados</button>
                  <button onClick={() => auth.signOut()} className="w-full py-5 bg-red-500 text-white rounded-[32px] text-[10px] font-black uppercase shadow-2xl shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"><LogOut size={16} /> Encerrar Sessão</button>
               </div>
            </div>
          )}
        </>
      )}
      {isJoinModalOpen && <JoinQueueModal services={services} currentQueue={queue} professionals={professionals} bookingModel={currentEst?.bookingModel || 'both'} onClose={() => setIsJoinModalOpen(false)} onSubmit={handleJoinQueue} />}
      {isCompletionModalOpen && selectedQueueItem && (
        <ServiceCompletionModal 
          item={selectedQueueItem} services={services} pixKey={currentEst?.pixKey} onClose={() => setIsCompletionModalOpen(false)} 
          onConfirm={async (method, amount) => {
            if (!currentEst) return;
            await addDoc(collection(db, "establishments", currentEst.id, "revenue"), { amount, method, serviceName: selectedQueueItem.service, clientName: selectedQueueItem.name, date: new Date().toISOString(), establishmentId: currentEst.id });
            if (selectedQueueItem.userEmail) {
              const q = query(collection(db, "users"), where("email", "==", selectedQueueItem.userEmail));
              const snap = await getDocs(q);
              if (!snap.empty) {
                  // Acompanhantes podem não ter perfil individual, então limpamos o activeBooking do responsável
                  // apenas se não houver mais nada dele na fila
                  const qRemaining = query(collection(db, "establishments", currentEst.id, "queue"), where("userEmail", "==", selectedQueueItem.userEmail));
                  const snapRemaining = await getDocs(qRemaining);
                  if (snapRemaining.size <= 1) { // Só restou esse que está sendo finalizado agora
                     await setDoc(doc(db, "users", snap.docs[0].id), { activeBooking: null }, { merge: true });
                  }
              }
              if (currentEst.loyaltyEnabled) {
                const lRef = doc(db, "establishments", currentEst.id, "loyalty", selectedQueueItem.userEmail);
                const lSnap = await getDoc(lRef);
                const count = lSnap.exists() ? (lSnap.data().count || 0) + 1 : 1;
                await setDoc(lRef, { count: count > 10 ? 1 : count }, { merge: true });
              }
            }
            await deleteDoc(doc(db, "establishments", currentEst.id, "queue", selectedQueueItem.id));
            setIsCompletionModalOpen(false);
          }} 
        />
      )}
    </Layout>
  );
};

export default App;
