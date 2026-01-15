
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

  // 1. Monitorar Autenticação e Definir Role Inicial do Perfil
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
            setUserRole(userDoc.data().role || 'client');
          } else {
            setUserRole('client');
          }
        } catch (e) {
          console.error("Erro ao ler perfil:", e);
          setUserRole('client');
        }
      } else {
        setIsLoggedIn(false);
        setCurrentEst(null);
        setUserEmail('');
        setUserRole('client');
      }
    });
  }, []);

  // 2. Sincronização em tempo real do estabelecimento e Role de Dono/Staff
  useEffect(() => {
    if (!currentEst?.id || !isLoggedIn) return;
    
    const unsubEst = onSnapshot(doc(db, "establishments", currentEst.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Establishment;
        setCurrentEst({ id: docSnap.id, ...data });
        
        // Se for o dono, assume Admin
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

    return () => {
      unsubQueue(); unsubServices(); unsubPros(); unsubRevenue(); unsubLoyalty();
    };
  }, [currentEst?.id, isLoggedIn, userEmail]);

  const handleJoinQueue = async (data: any) => {
    if (!currentEst || !auth.currentUser) return;
    try {
      if (userRole === 'client') {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        const userData = userSnap.data() as UserProfile;
        if (userData?.activeBooking) {
          alert("Você já está na fila desta ou de outra loja.");
          return;
        }
      }

      const payload: any = {
        name: data.name,
        professionalId: data.professionalId,
        service: data.service,
        type: data.type,
        userEmail: userRole === 'client' ? userEmail : (data.userEmail || null),
        establishmentId: currentEst.id,
        status: 'waiting',
        timestamp: Date.now()
      };
      
      const docRef = await addDoc(collection(db, "establishments", currentEst.id, "queue"), payload);

      if (userRole === 'client') {
        await setDoc(doc(db, "users", auth.currentUser.uid), {
          activeBooking: { establishmentId: currentEst.id, queueId: docRef.id }
        }, { merge: true });
      }
      setIsJoinModalOpen(false);
    } catch (e: any) {
      alert(`Erro: ${e.message}`);
    }
  };

  const handleRemoveFromQueue = async (id: string, clientEmail?: string) => {
    if (!currentEst) return;
    try {
      await deleteDoc(doc(db, "establishments", currentEst.id, "queue", id));
      if (clientEmail) {
        const q = query(collection(db, "users"), where("email", "==", clientEmail));
        const snap = await getDocs(q);
        if (!snap.empty) {
          await setDoc(doc(db, "users", snap.docs[0].id), { activeBooking: null }, { merge: true });
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleCallNext = async (specificId?: string) => {
    if (!currentEst) return;
    
    let proId = 'any';
    if (userRole === 'staff') {
      const myPro = professionals.find(p => p.email?.toLowerCase() === userEmail.toLowerCase());
      if (myPro) proId = myPro.id;
      else return alert("Você precisa vincular sua cadeira primeiro.");
    }

    const serving = queue.find(i => i.status === 'serving' && (userRole === 'admin' ? true : i.professionalId === proId));
    
    if (serving && !specificId) { 
      setSelectedQueueItem(serving); 
      setIsCompletionModalOpen(true); 
      return;
    }

    const myNext = queue.find(i => i.status === 'waiting' && i.professionalId === proId);
    const generalNext = queue.find(i => i.status === 'waiting' && i.professionalId === 'any');
    
    const nextId = specificId || myNext?.id || generalNext?.id;
    
    if (nextId) {
      await updateDoc(doc(db, "establishments", currentEst.id, "queue", nextId), { 
        status: 'serving', 
        professionalId: proId === 'any' ? professionals[0].id : proId,
        timestamp: Date.now() 
      });
    }
  };

  const handleUpdateStaffStatus = async (newStatus: ProfStatus) => {
    if (!currentEst || userRole !== 'staff') return;
    const myPro = professionals.find(p => p.email?.toLowerCase() === userEmail.toLowerCase());
    if (myPro) {
      await updateDoc(doc(db, "establishments", currentEst.id, "professionals", myPro.id), {
        status: newStatus
      });
    }
  };

  const handleNoShow = (id?: string) => {
    const item = id ? queue.find(i => i.id === id) : queue.find(i => i.status === 'serving');
    if (item) handleRemoveFromQueue(item.id, item.userEmail);
  };

  const handleSwitchQueue = async (queueId: string, newProId: string) => {
    if (!currentEst) return;
    if (confirm("Deseja mudar para este barbeiro e ser atendido agora?")) {
      await updateDoc(doc(db, "establishments", currentEst.id, "queue", queueId), {
        professionalId: newProId
      });
    }
  };

  const handleStaffAssign = async (proId: string) => {
    if (!currentEst) return;
    const pro = professionals.find(p => p.id === proId);
    if (pro?.email) return alert("Esta cadeira já está vinculada.");
    
    if (confirm(`Deseja unificar seu acesso à cadeira "${pro?.name}"?`)) {
       await updateDoc(doc(db, "establishments", currentEst.id, "professionals", proId), {
         email: userEmail.toLowerCase()
       });
    }
  };

  const handleRemoveEstFromHistory = () => {
    if (!currentEst) return;
    if (confirm(`Deseja remover "${currentEst.name}" do seu histórico?`)) {
      const saved = JSON.parse(localStorage.getItem(`client_history_${userEmail}`) || '[]');
      const updated = saved.filter((s: Establishment) => s.id !== currentEst.id);
      localStorage.setItem(`client_history_${userEmail}`, JSON.stringify(updated));
      setCurrentEst(null);
    }
  };

  if (isTVMode && currentEst) {
    return <TVView queue={queue} professionals={professionals} establishmentName={currentEst.name} onClose={() => setIsTVMode(false)} />;
  }

  if (!isConfigured) return <div className="min-h-screen bg-[#050810] flex items-center justify-center"><Settings className="text-teal-500 animate-spin" /></div>;
  if (!isLoggedIn) return <AuthView onLogin={(email, role) => { setUserEmail(email.toLowerCase()); setUserRole(role); setIsLoggedIn(true); }} />;
  if (!currentEst) return <BusinessSelect userEmail={userEmail} userRole={userRole} onSelect={setCurrentEst} onLogout={() => auth.signOut()} />;

  const myStaffPro = userRole === 'staff' ? professionals.find(p => p.email?.toLowerCase() === userEmail.toLowerCase()) : null;
  const isStaffNotLinked = userRole === 'staff' && !myStaffPro;
  const isStaffOrAdmin = userRole === 'admin' || !!myStaffPro;

  return (
    <Layout 
      activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole === 'staff' ? 'admin' : userRole} 
      establishmentCode={currentEst.id} onBackToDashboard={() => setCurrentEst(null)}
      loyaltyEnabled={currentEst.loyaltyEnabled}
    >
      {isStaffNotLinked ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-in fade-in zoom-in">
           <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-[32px] flex items-center justify-center border border-amber-500/20 shadow-2xl">
              <Scissors size={40} />
           </div>
           <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Vincular Profissional</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-10 leading-relaxed">
                Você ainda não está unificado a uma cadeira. Selecione abaixo para gerenciar sua fila.
              </p>
           </div>
           <div className="w-full space-y-3">
              {professionals.filter(p => !p.email).map(pro => (
                <button 
                  key={pro.id} 
                  onClick={() => handleStaffAssign(pro.id)}
                  className="w-full bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex items-center justify-between hover:border-amber-500 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-amber-500">
                        <UserCheck size={20} />
                     </div>
                     <span className="text-sm font-black text-white uppercase">{pro.name}</span>
                  </div>
                  <ArrowRight size={20} className="text-slate-700" />
                </button>
              ))}
              {professionals.filter(p => !p.email).length === 0 && (
                <div className="p-10 text-center bg-slate-900 rounded-[40px] border-2 border-dashed border-slate-800">
                   <p className="text-[10px] text-slate-600 font-black uppercase">Nenhuma cadeira livre disponível.</p>
                   <p className="text-[8px] text-slate-700 font-bold uppercase mt-2">Peça ao administrador para criar sua vaga no painel gestão.</p>
                </div>
              )}
           </div>
        </div>
      ) : (
        <>
          {/* BARRA DE STATUS PARA STAFF (BARBEIRO) */}
          {userRole === 'staff' && myStaffPro && (
            <div className="mb-6 bg-slate-900/50 border border-slate-800 rounded-[32px] p-2 flex items-center gap-2 animate-in slide-in-from-top-4">
               {[
                 { id: 'available', label: 'Disponível', icon: <CheckCircle2 size={14} />, color: 'emerald' },
                 { id: 'lunch', label: 'Almoço', icon: <Coffee size={14} />, color: 'amber' },
                 { id: 'absent', label: 'Ausente', icon: <UserX size={14} />, color: 'red' }
               ].map((st) => (
                 <button 
                  key={st.id}
                  onClick={() => handleUpdateStaffStatus(st.id as ProfStatus)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[24px] text-[9px] font-black uppercase tracking-widest transition-all ${
                    myStaffPro.status === st.id 
                    ? `bg-${st.color}-500 text-slate-950 shadow-lg shadow-${st.color}-500/20` 
                    : 'text-slate-500 hover:text-slate-300'
                  }`}
                 >
                   {st.icon} {st.label}
                 </button>
               ))}
            </div>
          )}

          {activeTab === 'fila' && (
            <QueueView 
              queue={queue} isAdmin={isStaffOrAdmin} currentUserEmail={userEmail}
              estStatus={currentEst.status} bookingModel={currentEst.bookingModel || 'both'} 
              professionals={professionals} services={services} 
              onCallNext={handleCallNext} 
              onNoShow={handleNoShow} 
              onOpenJoinModal={() => setIsJoinModalOpen(true)}
              onSwitchQueue={handleSwitchQueue}
              onLeaveQueue={(id) => { 
                const item = queue.find(i => i.id === id);
                if(confirm(isStaffOrAdmin ? `Remover ${item?.name}?` : "Deseja sair da fila?")) handleRemoveFromQueue(id, item?.userEmail); 
              }}
            />
          )}

          {activeTab === 'fidelidade' && <LoyaltyView cutsCount={loyaltyCount} />}

          {activeTab === 'admin' && userRole === 'admin' && (
            <AdminPanel 
              establishment={currentEst} queue={queue} services={services} professionals={professionals} 
              estStatus={currentEst.status} bookingModel={currentEst.bookingModel || 'both'} 
              plan={currentEst.plan || 'free'} trialStartedAt={currentEst.trialStartedAt || Date.now()} 
              loyaltyEnabled={currentEst.loyaltyEnabled} revenue={revenue} pixKey={currentEst.pixKey || ''} 
              onUpdateEstablishment={(d) => updateDoc(doc(db, "establishments", currentEst.id), d)} 
              onDeleteEstablishment={() => {}}
              onSetPixKey={(k) => updateDoc(doc(db, "establishments", currentEst.id), { pixKey: k })}
              onUpdateStatus={(s) => updateDoc(doc(db, "establishments", currentEst.id), { status: s })}
              onSetBookingModel={(m) => updateDoc(doc(db, "establishments", currentEst.id), { bookingModel: m })}
              onSetLoyaltyEnabled={(e) => updateDoc(doc(db, "establishments", currentEst.id), { loyaltyEnabled: e })}
              onCallNext={() => handleCallNext()} 
              onNoShow={() => handleNoShow()}
              onUpdateServices={async (sList) => {
                 for (const s of sList) await setDoc(doc(db, "establishments", currentEst.id, "services", s.id), s, { merge: true });
                 const ids = sList.map(x => x.id);
                 services.forEach(async (s) => { if (!ids.includes(s.id)) await deleteDoc(doc(db, "establishments", currentEst.id, "services", s.id)); });
              }}
              onUpdatePros={async (pList) => {
                 for (const p of pList) await setDoc(doc(db, "establishments", currentEst.id, "professionals", p.id), p, { merge: true });
                 const ids = pList.map(x => x.id);
                 professionals.forEach(async (p) => { if (!ids.includes(p.id)) await deleteDoc(doc(db, "establishments", currentEst.id, "professionals", p.id)); });
              }}
              onManualJoin={handleJoinQueue}
              onToggleTVMode={() => setIsTVMode(true)}
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
                      {myStaffPro && <p className="text-[7px] text-amber-500 font-black uppercase mt-1">Cadeira: {myStaffPro.name}</p>}
                  </div>
                  
                  <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-800 text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase">
                    <RefreshCw size={14} /> Atualizar App
                  </button>

                  {userRole === 'client' && (
                    <button 
                      onClick={handleRemoveEstFromHistory}
                      className="w-full py-5 bg-orange-500/10 border border-orange-500/20 rounded-[32px] text-[10px] font-black uppercase text-orange-500 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} /> Remover Loja do Histórico
                    </button>
                  )}

                  <button onClick={() => auth.signOut()} className="w-full py-5 bg-red-500/10 border border-red-500/20 rounded-[32px] text-[10px] font-black uppercase text-red-500 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                    <LogOut size={16} /> Sair da Conta
                  </button>
               </div>
            </div>
          )}
        </>
      )}

      {isJoinModalOpen && <JoinQueueModal services={services} currentQueue={queue} professionals={professionals} bookingModel={currentEst?.bookingModel || 'both'} onClose={() => setIsJoinModalOpen(false)} onSubmit={handleJoinQueue} />}
      {isCompletionModalOpen && selectedQueueItem && (
        <ServiceCompletionModal 
          item={selectedQueueItem} services={services} pixKey={currentEst?.pixKey}
          onClose={() => setIsCompletionModalOpen(false)} 
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
