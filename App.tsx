
import React, { useState, useEffect } from 'react';
import { db, auth, isConfigured } from './services/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, orderBy, setDoc, getDoc, collectionGroup, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Settings, WifiOff, AlertTriangle } from 'lucide-react';
import { Layout } from './components/Layout';
import { QueueView } from './components/QueueView';
import { AdminPanel } from './components/AdminPanel';
import { LoyaltyView } from './components/LoyaltyView';
import { AuthView } from './components/AuthView';
import { BusinessSelect } from './components/BusinessSelect';
import { JoinQueueModal } from './components/JoinQueueModal';
import { ServiceCompletionModal } from './components/ServiceCompletionModal';
import { TVView } from './components/TVView';
import { QueueItem, Service, Professional, Establishment, RevenueRecord, PaymentMethod, BookingModel, UserProfile } from './types';

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
            setUserRole(userDoc.data().role);
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

  const handleJoinQueue = async (data: any) => {
    if (!currentEst || !auth.currentUser) return;
    
    try {
      if (userRole === 'client') {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        const userData = userSnap.data() as UserProfile;

        if (userData?.activeBooking) {
          alert("Atenção: Você já está em uma fila ou possui um agendamento ativo.");
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
      if (data.scheduledTime) payload.scheduledTime = data.scheduledTime;
      
      const docRef = await addDoc(collection(db, "establishments", currentEst.id, "queue"), payload);

      if (userRole === 'client') {
        // CORREÇÃO CRÍTICA: setDoc com merge: true evita erro se o doc não existir
        await setDoc(doc(db, "users", auth.currentUser.uid), {
          activeBooking: { establishmentId: currentEst.id, queueId: docRef.id }
        }, { merge: true });
      }

      setIsJoinModalOpen(false);
    } catch (e: any) {
      alert(`Erro ao processar reserva: ${e.message}`);
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
    } catch (e) {
      console.error("Erro ao remover:", e);
    }
  };

  const handleCallNext = async () => {
    if (!currentEst) return;
    const serving = queue.find(i => i.status === 'serving');
    if (serving) { 
      setSelectedQueueItem(serving); 
      setIsCompletionModalOpen(true); 
    } else {
      const next = queue.find(i => i.status === 'waiting');
      if (next) {
        await updateDoc(doc(db, "establishments", currentEst.id, "queue", next.id), { status: 'serving', timestamp: Date.now() });
      }
    }
  };

  const handleNoShow = () => {
    const serving = queue.find(i => i.status === 'serving');
    if (serving) handleRemoveFromQueue(serving.id, serving.userEmail);
  };

  const handleUpdateEstablishment = async (data: Partial<Establishment>) => {
    if (!currentEst) return;
    await updateDoc(doc(db, "establishments", currentEst.id), data);
  };

  if (isTVMode && currentEst) {
    return <TVView queue={queue} professionals={professionals} establishmentName={currentEst.name} onClose={() => setIsTVMode(false)} />;
  }

  if (!isConfigured) return <div className="min-h-screen bg-[#050810] flex items-center justify-center"><Settings className="text-teal-500 animate-spin" /></div>;
  if (!isLoggedIn) return <AuthView onLogin={(email, role) => { setUserEmail(email); setUserRole(role); setIsLoggedIn(true); }} />;
  if (!currentEst) return <BusinessSelect userEmail={userEmail} userRole={userRole} onSelect={setCurrentEst} onLogout={() => auth.signOut()} />;

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
          onCallNext={handleCallNext} 
          onNoShow={handleNoShow} 
          onOpenJoinModal={() => setIsJoinModalOpen(true)}
          onLeaveQueue={(id) => { if(confirm("Deseja sair da fila?")) handleRemoveFromQueue(id, userEmail); }}
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
          onCallNext={handleCallNext} 
          onNoShow={handleNoShow}
          onUpdateServices={async (sList) => {
             for (const s of sList) await setDoc(doc(db, "establishments", currentEst.id, "services", s.id), s);
             const ids = sList.map(x => x.id);
             services.forEach(async (s) => { if (!ids.includes(s.id)) await deleteDoc(doc(db, "establishments", currentEst.id, "services", s.id)); });
          }}
          onUpdatePros={async (pList) => {
             for (const p of pList) await setDoc(doc(db, "establishments", currentEst.id, "professionals", p.id), p);
             const ids = pList.map(x => x.id);
             professionals.forEach(async (p) => { if (!ids.includes(p.id)) await deleteDoc(doc(db, "establishments", currentEst.id, "professionals", p.id)); });
          }}
          onManualJoin={handleJoinQueue}
          onToggleTVMode={() => setIsTVMode(true)}
        />
      )}

      {activeTab === 'config' && (
        <div className="flex flex-col items-center py-12 space-y-10">
           <h2 className="text-2xl font-black text-white font-orbitron uppercase tracking-tighter text-center">Configurações de Perfil</h2>
           <div className="w-full max-w-xs space-y-4">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] text-center">
                  <p className="text-[10px] text-slate-500 font-black uppercase">Logado como</p>
                  <p className="text-sm font-bold text-white mt-1">{userEmail}</p>
              </div>
              <button onClick={() => auth.signOut()} className="w-full py-5 bg-red-500/10 border border-red-500/20 rounded-[32px] text-[10px] font-black uppercase text-red-500 shadow-xl active:scale-95 transition-all">Sair da Conta</button>
           </div>
        </div>
      )}

      {isJoinModalOpen && <JoinQueueModal services={services} currentQueue={queue} professionals={professionals} bookingModel={currentEst.bookingModel || 'both'} onClose={() => setIsJoinModalOpen(false)} onSubmit={handleJoinQueue} />}
      {isCompletionModalOpen && selectedQueueItem && (
        <ServiceCompletionModal 
          item={selectedQueueItem} 
          services={services} 
          pixKey={currentEst.pixKey}
          onClose={() => setIsCompletionModalOpen(false)} 
          onConfirm={async (method, amount) => {
            await addDoc(collection(db, "establishments", currentEst.id, "revenue"), { amount, method, serviceName: selectedQueueItem.service, clientName: selectedQueueItem.name, date: new Date().toISOString(), establishmentId: currentEst.id });
            
            if (selectedQueueItem.userEmail) {
              const q = query(collection(db, "users"), where("email", "==", selectedQueueItem.userEmail));
              const snap = await getDocs(q);
              if (!snap.empty) {
                await setDoc(doc(db, "users", snap.docs[0].id), { activeBooking: null }, { merge: true });
              }
              if (currentEst.loyaltyEnabled) {
                const lRef = doc(db, "establishments", currentEst.id, "loyalty", selectedQueueItem.userEmail);
                const lSnap = await getDoc(lRef);
                const count = lSnap.exists() ? (lSnap.data().count || 0) + 1 : 1;
                await setDoc(lRef, { count: count > 10 ? 1 : count });
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
