
import React, { useState, useEffect } from 'react';
import { db, auth, isConfigured } from './services/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, orderBy, setDoc, getDoc, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Settings, RefreshCw, LogOut, Trash2, Scissors, UserCheck, ArrowRight, Coffee, UserX, CheckCircle2 } from 'lucide-react';
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

  useEffect(() => {
    if (!isConfigured) return;
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const email = user.email || user.uid;
        setUserEmail(email.toLowerCase());
        setIsLoggedIn(true);
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) setUserRole(userDoc.data().role || 'client');
          else setUserRole('client');
        } catch (e) { setUserRole('client'); }
      } else {
        setIsLoggedIn(false); setCurrentEst(null); setUserEmail(''); setUserRole('client');
      }
    });
  }, []);

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
      if (userRole === 'client') {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        const userData = userSnap.data() as UserProfile;
        if (userData?.activeBooking) { alert("Você já está na fila."); return; }
      }
      const payload: any = {
        name: data.name,
        professionalId: data.professionalId,
        service: data.service,
        type: data.type,
        userEmail: userRole === 'client' ? userEmail : (data.userEmail || null),
        establishmentId: currentEst.id,
        status: 'waiting',
        timestamp: Date.now(),
        missedCount: 0
      };
      const docRef = await addDoc(collection(db, "establishments", currentEst.id, "queue"), payload);
      if (userRole === 'client') {
        await setDoc(doc(db, "users", auth.currentUser.uid), { activeBooking: { establishmentId: currentEst.id, queueId: docRef.id } }, { merge: true });
      }
      setIsJoinModalOpen(false);
    } catch (e: any) { alert(`Erro: ${e.message}`); }
  };

  const handleRemoveFromQueue = async (id: string, clientEmail?: string) => {
    if (!currentEst) return;
    if (userRole === 'staff') return alert("Operação não permitida. Apenas o gestor pode remover clientes manualmente.");
    
    try {
      await deleteDoc(doc(db, "establishments", currentEst.id, "queue", id));
      if (clientEmail) {
        const q = query(collection(db, "users"), where("email", "==", clientEmail));
        const snap = await getDocs(q);
        if (!snap.empty) await setDoc(doc(db, "users", snap.docs[0].id), { activeBooking: null }, { merge: true });
      }
    } catch (e) { console.error(e); }
  };

  const handleNoShow = async (id: string) => {
    if (!currentEst) return;
    const item = queue.find(i => i.id === id);
    if (!item) return;

    if (userRole === 'staff' || userRole === 'admin') {
      const myPro = professionals.find(p => p.email?.toLowerCase() === userEmail.toLowerCase());
      if (userRole === 'staff' && item.professionalId !== 'any' && item.professionalId !== myPro?.id) {
        return alert("Você só pode dar falta em clientes da sua cadeira ou da fila geral.");
      }
    }

    const currentMissed = item.missedCount || 0;
    
    if (currentMissed + 1 >= 2) {
      if (confirm(`${item.name} faltou pela 2ª vez. Remover da fila agora?`)) {
        try {
          await deleteDoc(doc(db, "establishments", currentEst.id, "queue", id));
          if (item.userEmail) {
            const q = query(collection(db, "users"), where("email", "==", item.userEmail));
            const snap = await getDocs(q);
            if (!snap.empty) await setDoc(doc(db, "users", snap.docs[0].id), { activeBooking: null }, { merge: true });
          }
          alert("Cliente removido por excesso de faltas.");
        } catch (e: any) {
          alert(`Erro ao remover: ${e.message}`);
        }
      }
      return;
    }

    if (confirm(`${item.name} faltou. Ele será movido para o final da fila.`)) {
      await updateDoc(doc(db, "establishments", currentEst.id, "queue", id), {
        timestamp: Date.now() + 500,
        status: 'waiting',
        missedCount: currentMissed + 1
      });
    }
  };

  const handleDeleteEstablishment = async () => {
    if (!currentEst) return;
    if (!confirm("⚠️ ATENÇÃO: Deseja realmente DELETAR permanentemente esta unidade? Todos os dados de serviços, profissionais e faturamento serão perdidos!")) return;
    
    try {
      // Deletar o documento principal do estabelecimento
      await deleteDoc(doc(db, "establishments", currentEst.id));
      // Nota: Subcoleções no Firestore não são deletadas automaticamente ao deletar o pai, 
      // mas para este MVP, o acesso será cortado pois o doc principal não existirá mais.
      setCurrentEst(null);
      alert("Unidade deletada com sucesso.");
    } catch (e: any) {
      alert("Erro ao deletar: " + e.message);
    }
  };

  const handleCallNext = async (specificId?: string) => {
    if (!currentEst || professionals.length === 0) return;
    
    let myProId: string | null = null;
    const myPro = professionals.find(p => p.email?.toLowerCase() === userEmail.toLowerCase());
    if (myPro) myProId = myPro.id;

    if (specificId) {
      const item = queue.find(i => i.id === specificId);
      if (!item) return;

      if (userRole === 'staff' && myProId) {
        if (item.professionalId !== 'any' && item.professionalId !== myProId) {
          return alert("Este cliente escolheu outro profissional.");
        }
      }

      await updateDoc(doc(db, "establishments", currentEst.id, "queue", specificId), { 
        status: 'serving', 
        professionalId: item.professionalId === 'any' ? (myProId || professionals[0].id) : item.professionalId,
        timestamp: Date.now() 
      });
      return;
    }

    const nextItem = queue.find(i => 
      i.status === 'waiting' && 
      (userRole === 'admin' ? true : (i.professionalId === 'any' || i.professionalId === myProId))
    );
    
    if (nextItem) {
      let finalProId = nextItem.professionalId !== 'any' ? nextItem.professionalId : (myProId || professionals[0].id);
      await updateDoc(doc(db, "establishments", currentEst.id, "queue", nextItem.id), { 
        status: 'serving', 
        professionalId: finalProId,
        timestamp: Date.now() 
      });
    } else {
      alert("Não há clientes aguardando.");
    }
  };

  const handleFinish = (item: QueueItem) => {
    if (userRole === 'staff') {
      const myPro = professionals.find(p => p.email?.toLowerCase() === userEmail.toLowerCase());
      if (item.professionalId !== myPro?.id) return alert("Ação não permitida para esta cadeira.");
    }
    setSelectedQueueItem(item);
    setIsCompletionModalOpen(true);
  };

  const handleStaffAssign = async (proId: string) => {
    if (!currentEst) return;
    try {
      await updateDoc(doc(db, "establishments", currentEst.id, "professionals", proId), { 
        email: userEmail.toLowerCase() 
      });
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    }
  };

  const handleUpdateStaffStatus = async (newStatus: ProfStatus) => {
    if (!currentEst) return;
    const myPro = professionals.find(p => p.email?.toLowerCase() === userEmail.toLowerCase());
    if (myPro) await updateDoc(doc(db, "establishments", currentEst.id, "professionals", myPro.id), { status: newStatus });
  };

  if (isTVMode && currentEst) {
    return <TVView queue={queue} professionals={professionals} establishmentName={currentEst.name} onClose={() => setIsTVMode(false)} />;
  }

  if (!isConfigured) return <div className="min-h-screen bg-[#050810] flex items-center justify-center"><Settings className="text-teal-500 animate-spin" /></div>;
  if (!isLoggedIn) return <AuthView onLogin={(email, role) => { setUserEmail(email.toLowerCase()); setUserRole(role); setIsLoggedIn(true); setActiveTab('fila'); }} />;
  if (!currentEst) return <BusinessSelect userEmail={userEmail} userRole={userRole} onSelect={setCurrentEst} onLogout={() => auth.signOut()} />;

  const myOnDutyPro = (userRole === 'staff' || userRole === 'admin') ? professionals.find(p => p.email?.toLowerCase() === userEmail.toLowerCase()) : null;
  const isStaffNotLinked = userRole === 'staff' && !myOnDutyPro;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole === 'staff' ? 'admin' : userRole} establishmentCode={currentEst.id} onBackToDashboard={() => setCurrentEst(null)} loyaltyEnabled={currentEst.loyaltyEnabled}>
      {isStaffNotLinked ? (
        <div className="flex flex-col items-center justify-center py-20">
           <Scissors size={40} className="text-amber-500 mb-4" />
           <h2 className="text-xl font-black text-white uppercase">Vincular Cadeira</h2>
           <div className="w-full mt-6 space-y-3">
              {professionals.filter(p => !p.email).map(pro => (
                <button key={pro.id} onClick={() => handleStaffAssign(pro.id)} className="w-full bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex items-center justify-between">
                  <span className="text-sm font-black text-white uppercase">{pro.name}</span>
                  <ArrowRight size={20} className="text-slate-700" />
                </button>
              ))}
           </div>
        </div>
      ) : (
        <>
          {(userRole === 'staff' || userRole === 'admin') && myOnDutyPro && (
            <div className="mb-6 bg-slate-900/50 border border-slate-800 rounded-[32px] p-2 flex items-center gap-2">
               {[{ id: 'available', label: 'Disponível', icon: <CheckCircle2 size={14} />, color: 'emerald' }, { id: 'lunch', label: 'Almoço', icon: <Coffee size={14} />, color: 'amber' }, { id: 'absent', label: 'Ausente', icon: <UserX size={14} />, color: 'red' }].map((st) => (
                 <button key={st.id} onClick={() => handleUpdateStaffStatus(st.id as ProfStatus)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[24px] text-[9px] font-black uppercase tracking-widest transition-all ${myOnDutyPro.status === st.id ? `bg-${st.color}-500 text-slate-950` : 'text-slate-500'}`}>
                   {st.icon} {st.label}
                 </button>
               ))}
            </div>
          )}
          {activeTab === 'fila' && (
            <QueueView 
              queue={queue} 
              isAdmin={userRole === 'admin'} 
              isStaff={userRole === 'staff'}
              userRole={userRole}
              myProId={myOnDutyPro?.id}
              currentUserEmail={userEmail} 
              estStatus={currentEst.status} 
              openingHours={currentEst.openingHours}
              bookingModel={currentEst.bookingModel || 'both'} 
              professionals={professionals} 
              services={services} 
              onCallNext={handleCallNext} 
              onFinish={handleFinish}
              onNoShow={handleNoShow} 
              onOpenJoinModal={() => setIsJoinModalOpen(true)} 
              onLeaveQueue={(id) => { const item = queue.find(i => i.id === id); if(confirm(userRole === 'admin' ? `Remover ${item?.name}?` : "Sair da fila?")) handleRemoveFromQueue(id, item?.userEmail); }}
            />
          )}
          {activeTab === 'fidelidade' && <LoyaltyView cutsCount={loyaltyCount} />}
          {activeTab === 'admin' && userRole === 'admin' && (
            <AdminPanel 
              establishment={currentEst} queue={queue} services={services} professionals={professionals} estStatus={currentEst.status} bookingModel={currentEst.bookingModel || 'both'} plan={currentEst.plan || 'free'} trialStartedAt={currentEst.trialStartedAt || Date.now()} loyaltyEnabled={currentEst.loyaltyEnabled} revenue={revenue} pixKey={currentEst.pixKey || ''} 
              onUpdateEstablishment={(d) => updateDoc(doc(db, "establishments", currentEst.id), d)} 
              onDeleteEstablishment={handleDeleteEstablishment} 
              onSetPixKey={(k) => updateDoc(doc(db, "establishments", currentEst.id), { pixKey: k })} onUpdateStatus={(s) => updateDoc(doc(db, "establishments", currentEst.id), { status: s })} onSetBookingModel={(m) => updateDoc(doc(db, "establishments", currentEst.id), { bookingModel: m })} onSetLoyaltyEnabled={(e) => updateDoc(doc(db, "establishments", currentEst.id), { loyaltyEnabled: e })}
              onCallNext={() => handleCallNext()} onFinish={handleFinish} onNoShow={handleNoShow}
              onUpdateServices={async (sList) => { for (const s of sList) await setDoc(doc(db, "establishments", currentEst.id, "services", s.id), s, { merge: true }); }}
              onUpdatePros={async (pList) => { for (const p of pList) await setDoc(doc(db, "establishments", currentEst.id, "professionals", p.id), p, { merge: true }); }}
              onManualJoin={handleJoinQueue} onToggleTVMode={() => setIsTVMode(true)}
            />
          )}
          {activeTab === 'config' && (
            <div className="flex flex-col items-center py-12 space-y-10">
               <h2 className="text-2xl font-black text-white font-orbitron uppercase tracking-tighter text-center">Configurações</h2>
               <div className="w-full max-w-xs space-y-4">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] text-center">
                      <p className="text-[10px] text-slate-500 font-black uppercase">E-mail</p>
                      <p className="text-sm font-bold text-white mt-1">{userEmail}</p>
                      <p className="text-[8px] text-indigo-400 font-black uppercase mt-2">Permissão: {userRole === 'admin' ? 'Gestor' : userRole === 'staff' ? 'Colaborador' : 'Cliente'}</p>
                      {myOnDutyPro && <p className="text-[7px] text-amber-500 font-black uppercase mt-1">Cadeira: {myOnDutyPro.name}</p>}
                  </div>
                  <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-800 text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase"><RefreshCw size={14} /> Atualizar App</button>
                  <button onClick={() => auth.signOut()} className="w-full py-5 bg-red-500/10 border border-red-500/20 rounded-[32px] text-[10px] font-black uppercase text-red-500 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"><LogOut size={16} /> Sair da Conta</button>
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
              if (!snap.empty) await setDoc(doc(db, "users", snap.docs[0].id), { activeBooking: null }, { merge: true });
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
