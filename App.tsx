
import React, { useState, useEffect } from 'react';
import { db, auth, isConfigured } from './services/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, orderBy, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Settings, RefreshCcw } from 'lucide-react';
import { Layout } from './components/Layout';
import { QueueView } from './components/QueueView';
import { AdminPanel } from './components/AdminPanel';
import { LoyaltyView } from './components/LoyaltyView';
import { AuthView } from './components/AuthView';
import { BusinessSelect } from './components/BusinessSelect';
import { JoinQueueModal } from './components/JoinQueueModal';
import { ServiceCompletionModal } from './components/ServiceCompletionModal';
import { QueueItem, Service, Professional, Establishment, RevenueRecord, PaymentMethod } from './types';

const App: React.FC = () => {
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'client'>('client');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  
  const [currentEst, setCurrentEst] = useState<Establishment | null>(null);
  const [activeTab, setActiveTab] = useState('fila');
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [selectedQueueItem, setSelectedQueueItem] = useState<QueueItem | null>(null);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [revenue, setRevenue] = useState<RevenueRecord[]>([]);

  // Monitorar estado de autenticação - Vital para o Firebase liberar o banco
  useEffect(() => {
    if (!isConfigured) return;
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email || user.uid);
        setIsLoggedIn(true);
        const savedRole = localStorage.getItem('user_role') as 'admin' | 'client';
        if (savedRole) setUserRole(savedRole);
      } else {
        setIsLoggedIn(false);
      }
    });
  }, []);

  // Escutar dados do Firestore
  useEffect(() => {
    if (!currentEst || !isConfigured || !isLoggedIn) return;

    const qQueue = query(collection(db, "establishments", currentEst.id, "queue"), orderBy("timestamp", "asc"));
    const unsubscribeQueue = onSnapshot(qQueue, (snapshot) => {
      setQueue(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QueueItem)));
      setDbError(null);
    }, (err) => {
      console.error("Firestore Error:", err.code);
      if (err.code === 'permission-denied') {
        setDbError("Acesso Negado: Verifique as Regras no Console do Firebase.");
      }
    });

    const unsubscribeServices = onSnapshot(collection(db, "establishments", currentEst.id, "services"), (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
    });

    const unsubscribePros = onSnapshot(collection(db, "establishments", currentEst.id, "professionals"), (snapshot) => {
      setProfessionals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Professional)));
    });

    const unsubscribeRevenue = onSnapshot(collection(db, "establishments", currentEst.id, "revenue"), (snapshot) => {
      setRevenue(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RevenueRecord)));
    });

    return () => {
      unsubscribeQueue();
      unsubscribeServices();
      unsubscribePros();
      unsubscribeRevenue();
    };
  }, [currentEst, isLoggedIn]);

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-6 text-center space-y-8">
        <Settings size={48} className="text-teal-500 animate-spin-slow" />
        <h1 className="text-xl font-bold text-white uppercase font-orbitron">Inicializando...</h1>
      </div>
    );
  }

  const handleLogin = (id: string, role: 'admin' | 'client') => {
    setUserRole(role);
    localStorage.setItem('user_role', role);
  };

  const handleJoinQueue = async (data: any) => {
    if (!currentEst) return;
    try {
      await addDoc(collection(db, "establishments", currentEst.id, "queue"), {
        ...data,
        establishmentId: currentEst.id,
        status: 'waiting',
        timestamp: Date.now()
      });
      setIsJoinModalOpen(false);
    } catch (e) {
      alert("Erro ao entrar na fila. O banco de dados recusou a gravação.");
    }
  };

  const handleCallNext = async () => {
    if (!currentEst) return;
    const servingItem = queue.find(i => i.status === 'serving');
    if (servingItem) {
      setSelectedQueueItem(servingItem);
      setIsCompletionModalOpen(true);
    } else {
      const nextIdx = queue.findIndex(i => i.status === 'waiting');
      if (nextIdx !== -1) {
        await updateDoc(doc(db, "establishments", currentEst.id, "queue", queue[nextIdx].id), {
          status: 'serving',
          timestamp: Date.now()
        });
      }
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
      await deleteDoc(doc(db, "establishments", currentEst.id, "queue", selectedQueueItem.id));
      setIsCompletionModalOpen(false);
      setSelectedQueueItem(null);
    } catch (e) {
      alert("Erro ao finalizar atendimento.");
    }
  };

  if (!isLoggedIn) return <AuthView onLogin={handleLogin} />;
  
  if (!currentEst) return <BusinessSelect userEmail={userEmail} userRole={userRole} onSelect={setCurrentEst} onLogout={() => auth.signOut()} />;

  return (
    <Layout 
      activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} 
      establishmentCode={currentEst.id} onBackToDashboard={() => setCurrentEst(null)}
    >
      {dbError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between">
          <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">{dbError}</p>
          <button onClick={() => window.location.reload()} className="p-2 bg-red-500 text-white rounded-lg"><RefreshCcw size={14}/></button>
        </div>
      )}

      {activeTab === 'fila' && (
        <QueueView 
          queue={queue} isAdmin={userRole === 'admin'} estStatus={currentEst.status} 
          bookingModel={currentEst.bookingModel || 'both'} professionals={professionals} services={services} 
          onCallNext={handleCallNext} 
          onNoShow={() => queue[0] && deleteDoc(doc(db, "establishments", currentEst.id, "queue", queue[0].id))} 
          onOpenJoinModal={() => setIsJoinModalOpen(true)} 
        />
      )}
      
      {activeTab === 'fidelidade' && <LoyaltyView cutsCount={5} />}

      {activeTab === 'admin' && userRole === 'admin' && (
        <AdminPanel 
          queue={queue} services={services} professionals={professionals} 
          estStatus={currentEst.status} bookingModel={currentEst.bookingModel || 'both'} 
          plan={currentEst.plan || 'free'} trialStartedAt={currentEst.trialStartedAt || Date.now()} 
          loyaltyEnabled={currentEst.loyaltyEnabled} revenue={revenue} 
          pixKey={currentEst.pixKey || ''} 
          onSetPixKey={async (k) => {
            await updateDoc(doc(db, "establishments", currentEst.id!), { pixKey: k });
          }} 
          onUpdateStatus={async (s) => {
            await updateDoc(doc(db, "establishments", currentEst.id!), { status: s });
          }}
          onSetBookingModel={async (m) => {
             await updateDoc(doc(db, "establishments", currentEst.id!), { bookingModel: m });
          }}
          onSetLoyaltyEnabled={async (e) => {
             await updateDoc(doc(db, "establishments", currentEst.id!), { loyaltyEnabled: e });
          }}
          onCallNext={handleCallNext} 
          onNoShow={() => queue[0] && deleteDoc(doc(db, "establishments", currentEst.id, "queue", queue[0].id))} 
          onUpdateServices={async (sList) => {
             const lastService = sList[sList.length - 1];
             if (sList.length > services.length) {
                await setDoc(doc(db, "establishments", currentEst.id, "services", lastService.id), lastService);
             } else {
                const removed = services.find(s => !sList.find(sl => sl.id === s.id));
                if (removed) await deleteDoc(doc(db, "establishments", currentEst.id, "services", removed.id));
             }
          }}
          onUpdatePros={async (pList) => {
             const lastPro = pList[pList.length - 1];
             if (pList.length > professionals.length) {
                await setDoc(doc(db, "establishments", currentEst.id, "professionals", lastPro.id), lastPro);
             } else {
                const removed = professionals.find(p => !pList.find(pl => pl.id === p.id));
                if (removed) await deleteDoc(doc(db, "establishments", currentEst.id, "professionals", removed.id));
             }
          }}
        />
      )}

      {activeTab === 'config' && (
        <div className="flex flex-col items-center py-12 space-y-10">
           <h2 className="text-2xl font-black text-white font-orbitron uppercase tracking-tighter">Perfil</h2>
           <button onClick={() => auth.signOut()} className="w-full max-w-xs py-5 bg-red-500/10 border border-red-500/20 rounded-3xl text-[10px] font-black uppercase text-red-500">Encerrar Sessão</button>
        </div>
      )}

      {isJoinModalOpen && <JoinQueueModal services={services} currentQueue={queue} professionals={professionals} bookingModel={currentEst.bookingModel || 'both'} onClose={() => setIsJoinModalOpen(false)} onSubmit={handleJoinQueue} />}
      
      {isCompletionModalOpen && selectedQueueItem && (
        <ServiceCompletionModal 
          item={selectedQueueItem} 
          services={services} 
          onClose={() => setIsCompletionModalOpen(false)} 
          onConfirm={handleFinishService} 
        />
      )}
    </Layout>
  );
};

export default App;
