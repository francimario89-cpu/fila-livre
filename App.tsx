
import React, { useState, useEffect } from 'react';
import { db, auth, isConfigured } from './services/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, orderBy, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Settings, WifiOff } from 'lucide-react';
import { Layout } from './components/Layout';
import { QueueView } from './components/QueueView';
import { AdminPanel } from './components/AdminPanel';
import { LoyaltyView } from './components/LoyaltyView';
import { AuthView } from './components/AuthView';
import { BusinessSelect } from './components/BusinessSelect';
import { JoinQueueModal } from './components/JoinQueueModal';
import { ServiceCompletionModal } from './components/ServiceCompletionModal';
import { TVView } from './components/TVView';
import { QueueItem, Service, Professional, Establishment, RevenueRecord, PaymentMethod } from './types';

const App: React.FC = () => {
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'client'>('client');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dbError, setDbError] = useState<{code: string, message: string} | null>(null);
  
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
        setUserEmail(user.email || user.uid);
        setIsLoggedIn(true);
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserRole(data.role);
            localStorage.setItem('user_role', data.role);
          }
        } catch (e) {
          console.error("Erro ao carregar perfil:", e);
        }
      } else {
        setIsLoggedIn(false);
        setCurrentEst(null);
        setUserEmail('');
      }
    });
  }, []);

  useEffect(() => {
    if (!currentEst?.id || !isLoggedIn) return;
    const unsubEst = onSnapshot(doc(db, "establishments", currentEst.id), (docSnap) => {
      if (docSnap.exists()) {
        setCurrentEst({ id: docSnap.id, ...docSnap.data() } as Establishment);
      }
    });
    return () => unsubEst();
  }, [currentEst?.id, isLoggedIn]);

  useEffect(() => {
    if (!currentEst?.id || !isConfigured || !isLoggedIn) {
      setQueue([]); setServices([]); setProfessionals([]); setRevenue([]); setLoyaltyCount(0);
      return;
    }

    const unsubQueue = onSnapshot(query(collection(db, "establishments", currentEst.id, "queue"), orderBy("timestamp", "asc")), (snapshot) => {
      setQueue(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QueueItem)));
      setDbError(null);
    }, (err) => setDbError({ code: err.code, message: err.message }));

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

  const handleLogout = async () => {
    await auth.signOut();
    setCurrentEst(null);
    setIsLoggedIn(false);
    setActiveTab('fila');
  };

  const handleUpdateEstablishment = async (data: Partial<Establishment>) => {
    if (!currentEst) return;
    try {
      await updateDoc(doc(db, "establishments", currentEst.id), data);
    } catch (e) {
      alert("Erro ao atualizar unidade.");
    }
  };

  const handleJoinQueue = async (data: any) => {
    if (!currentEst) return;
    try {
      const payload: any = {
        name: data.name,
        professionalId: data.professionalId,
        service: data.service,
        type: data.type,
        userEmail: data.userEmail || (userRole === 'client' ? userEmail : null),
        establishmentId: currentEst.id,
        status: 'waiting',
        timestamp: Date.now()
      };
      if (data.scheduledTime) payload.scheduledTime = data.scheduledTime;
      await addDoc(collection(db, "establishments", currentEst.id, "queue"), payload);
      setIsJoinModalOpen(false);
    } catch (e: any) {
      alert(`Erro ao entrar na fila: ${e.message}`);
    }
  };

  const handleFinishService = async (method: PaymentMethod, amount: number) => {
    if (!currentEst || !selectedQueueItem) return;
    try {
      await addDoc(collection(db, "establishments", currentEst.id, "revenue"), {
        amount, method, serviceName: selectedQueueItem.service,
        clientName: selectedQueueItem.name, date: new Date().toISOString(),
        establishmentId: currentEst.id
      });

      if (selectedQueueItem.userEmail && currentEst.loyaltyEnabled) {
        const loyaltyRef = doc(db, "establishments", currentEst.id, "loyalty", selectedQueueItem.userEmail);
        const loyaltySnap = await getDoc(loyaltyRef);
        if (loyaltySnap.exists()) {
          const newCount = (loyaltySnap.data().count || 0) + 1;
          await updateDoc(loyaltyRef, { count: newCount > 10 ? 1 : newCount });
        } else {
          await setDoc(loyaltyRef, { count: 1 });
        }
      }

      await deleteDoc(doc(db, "establishments", currentEst.id, "queue", selectedQueueItem.id));
      setIsCompletionModalOpen(false);
      setSelectedQueueItem(null);
    } catch (e) {
      alert("Erro ao finalizar atendimento.");
    }
  };

  if (isTVMode && currentEst) {
    return (
      <TVView 
        queue={queue} 
        professionals={professionals} 
        establishmentName={currentEst.name} 
        onClose={() => setIsTVMode(false)} 
      />
    );
  }

  if (!isConfigured) return <div className="min-h-screen bg-[#050810] flex items-center justify-center"><Settings className="text-teal-500 animate-spin" /></div>;
  if (!isLoggedIn) return <AuthView onLogin={(email, role) => { setUserEmail(email); setUserRole(role); setIsLoggedIn(true); }} />;
  if (!currentEst) return <BusinessSelect userEmail={userEmail} userRole={userRole} onSelect={setCurrentEst} onLogout={handleLogout} />;

  return (
    <Layout 
      activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} 
      establishmentCode={currentEst.id} onBackToDashboard={() => setCurrentEst(null)}
      loyaltyEnabled={currentEst.loyaltyEnabled}
    >
      {activeTab === 'fila' && (
        <QueueView 
          queue={queue} isAdmin={userRole === 'admin'} currentUserEmail={userEmail}
          estStatus={currentEst.status} bookingModel={currentEst.bookingModel || 'both'} 
          professionals={professionals} services={services} 
          onCallNext={async () => {
            const serving = queue.find(i => i.status === 'serving');
            if (serving) { setSelectedQueueItem(serving); setIsCompletionModalOpen(true); }
            else {
              const next = queue.find(i => i.status === 'waiting');
              if (next) await updateDoc(doc(db, "establishments", currentEst.id, "queue", next.id), { status: 'serving', timestamp: Date.now() });
            }
          }} 
          onNoShow={() => {
            const serving = queue.find(i => i.status === 'serving');
            if (serving) deleteDoc(doc(db, "establishments", currentEst.id, "queue", serving.id));
          }} 
          onOpenJoinModal={() => setIsJoinModalOpen(true)}
          onLeaveQueue={async (id) => { if(confirm("Deseja sair da fila?")) await deleteDoc(doc(db, "establishments", currentEst.id, "queue", id)); }}
        />
      )}

      {activeTab === 'fidelidade' && <LoyaltyView cutsCount={loyaltyCount} />}

      {activeTab === 'admin' && userRole === 'admin' && (
        <AdminPanel 
          establishment={currentEst} queue={queue} services={services} professionals={professionals} 
          estStatus={currentEst.status} bookingModel={currentEst.bookingModel || 'both'} 
          plan={currentEst.plan || 'free'} trialStartedAt={currentEst.trialStartedAt || Date.now()} 
          loyaltyEnabled={currentEst.loyaltyEnabled} revenue={revenue} pixKey={currentEst.pixKey || ''} 
          onUpdateEstablishment={handleUpdateEstablishment} onDeleteEstablishment={() => {}}
          onSetPixKey={(k) => handleUpdateEstablishment({ pixKey: k })}
          onUpdateStatus={(s) => handleUpdateEstablishment({ status: s })}
          onSetBookingModel={(m) => handleUpdateEstablishment({ bookingModel: m })}
          onSetLoyaltyEnabled={(e) => handleUpdateEstablishment({ loyaltyEnabled: e })}
          onCallNext={() => {}} onNoShow={() => {}}
          onUpdateServices={async (sList) => {
            const last = sList[sList.length - 1];
            if (sList.length > services.length) await setDoc(doc(db, "establishments", currentEst.id, "services", last.id), last);
            else if (sList.length < services.length) { 
              const rem = services.find(s => !sList.find(sl => sl.id === s.id)); 
              if (rem) await deleteDoc(doc(db, "establishments", currentEst.id, "services", rem.id)); 
            } else {
              // Atualização de serviço existente
              sList.forEach(async (s) => await setDoc(doc(db, "establishments", currentEst.id, "services", s.id), s));
            }
          }}
          onUpdatePros={async (pList) => {
            if (pList.length > professionals.length) {
              const last = pList[pList.length - 1];
              await setDoc(doc(db, "establishments", currentEst.id, "professionals", last.id), last);
            } else if (pList.length < professionals.length) {
              const rem = professionals.find(p => !pList.find(pl => pl.id === p.id));
              if (rem) await deleteDoc(doc(db, "establishments", currentEst.id, "professionals", rem.id));
            } else {
              // Sincroniza todos os profissionais para garantir que o status seja salvo
              for (const p of pList) {
                await setDoc(doc(db, "establishments", currentEst.id, "professionals", p.id), p);
              }
            }
          }}
          onManualJoin={handleJoinQueue}
          onToggleTVMode={() => setIsTVMode(true)}
        />
      )}

      {activeTab === 'config' && (
        <div className="flex flex-col items-center py-12 space-y-10">
           <h2 className="text-2xl font-black text-white font-orbitron uppercase tracking-tighter">Perfil</h2>
           <button onClick={handleLogout} className="w-full max-w-xs py-5 bg-red-500/10 border border-red-500/20 rounded-3xl text-[10px] font-black uppercase text-red-500">Encerrar Sessão</button>
        </div>
      )}

      {isJoinModalOpen && <JoinQueueModal services={services} currentQueue={queue} professionals={professionals} bookingModel={currentEst.bookingModel || 'both'} onClose={() => setIsJoinModalOpen(false)} onSubmit={handleJoinQueue} />}
      {isCompletionModalOpen && selectedQueueItem && <ServiceCompletionModal item={selectedQueueItem} services={services} onClose={() => setIsCompletionModalOpen(false)} onConfirm={handleFinishService} />}
    </Layout>
  );
};

export default App;
