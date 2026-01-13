
import React, { useState, useEffect } from 'react';
import { db, auth } from './services/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, orderBy, setDoc, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { AlertTriangle, Loader2, Database, Settings, LogOut, Monitor } from 'lucide-react';
import { Layout } from './components/Layout';
import { QueueView } from './components/QueueView';
import { AdminPanel } from './components/AdminPanel';
import { LoyaltyView } from './components/LoyaltyView';
import { AuthView } from './components/AuthView';
import { BusinessSelect } from './components/BusinessSelect';
import { JoinQueueModal } from './components/JoinQueueModal';
import { ServiceCompletionModal } from './components/ServiceCompletionModal';
import { DataStatus } from './components/DataStatus';
import { DisplayMode } from './components/DisplayMode';
import { QueueItem, Service, Professional, Establishment, RevenueRecord, PaymentMethod } from './types';
import { LOGO_SVG, NAVIGATION_ITEMS } from './constants';

const App: React.FC = () => {
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'client'>('client');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadStatus, setLoadStatus] = useState('Conectando ao Firebase...');
  const [isDisplayMode, setIsDisplayMode] = useState(false);
  
  const [currentEst, setCurrentEst] = useState<Establishment | null>(null);
  const [activeTab, setActiveTab] = useState('fila');
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [selectedQueueItem, setSelectedQueueItem] = useState<QueueItem | null>(null);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [revenue, setRevenue] = useState<RevenueRecord[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email || user.uid);
        setIsLoggedIn(true);
        const savedRole = localStorage.getItem('user_role') as 'admin' | 'client';
        if (savedRole) setUserRole(savedRole);
      } else {
        setIsLoggedIn(false);
      }
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentEst) return;

    if (isLocalMode) {
      const loadLocalData = () => {
        setQueue(JSON.parse(localStorage.getItem(`local_queue_${currentEst.id}`) || '[]'));
        setServices(JSON.parse(localStorage.getItem(`local_services_${currentEst.id}`) || '[]'));
        setProfessionals(JSON.parse(localStorage.getItem(`local_pros_${currentEst.id}`) || '[]'));
        setRevenue(JSON.parse(localStorage.getItem(`local_revenue_${currentEst.id}`) || '[]'));
      };
      loadLocalData();
      return;
    }

    const handleError = (err: any) => {
      if (err.code === 'permission-denied') setIsLocalMode(true);
    };

    try {
      const unsubscribeQueue = onSnapshot(query(collection(db, "establishments", currentEst.id, "queue"), orderBy("timestamp", "asc")), (snapshot) => {
        setQueue(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QueueItem)));
      }, handleError);

      const unsubscribeServices = onSnapshot(collection(db, "establishments", currentEst.id, "services"), (snapshot) => {
        setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
      }, handleError);

      const unsubscribePros = onSnapshot(collection(db, "establishments", currentEst.id, "professionals"), (snapshot) => {
        setProfessionals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Professional)));
      }, handleError);

      const unsubscribeRevenue = onSnapshot(collection(db, "establishments", currentEst.id, "revenue"), (snapshot) => {
        setRevenue(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RevenueRecord)));
      }, handleError);

      return () => {
        unsubscribeQueue(); unsubscribeServices(); unsubscribePros(); unsubscribeRevenue();
      };
    } catch (e) {
      setIsLocalMode(true);
    }
  }, [currentEst, isLocalMode]);

  const handleManualSync = async () => {
    if (!currentEst) return;
    try {
      await getDocs(collection(db, "establishments"));
      setIsLocalMode(false);
      window.location.reload();
    } catch (e) {
      alert("Erro ao sincronizar. Verifique suas regras no Firebase.");
    }
  };

  const handleJoinQueue = async (data: any) => {
    if (!currentEst) return;
    const newItem = { ...data, id: Math.random().toString(36).substr(2, 9), establishmentId: currentEst.id, status: 'waiting', timestamp: Date.now() };
    if (isLocalMode) {
      const newQueue = [...queue, newItem];
      setQueue(newQueue);
      localStorage.setItem(`local_queue_${currentEst.id}`, JSON.stringify(newQueue));
      setIsJoinModalOpen(false);
    } else {
      await addDoc(collection(db, "establishments", currentEst.id, "queue"), newItem);
      setIsJoinModalOpen(false);
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
        if (isLocalMode) {
          const newQueue = [...queue];
          newQueue[nextIdx].status = 'serving';
          newQueue[nextIdx].timestamp = Date.now();
          setQueue(newQueue);
        } else {
          await updateDoc(doc(db, "establishments", currentEst.id, "queue", queue[nextIdx].id), { status: 'serving', timestamp: Date.now() });
        }
      }
    }
  };

  const handleFinishService = async (method: PaymentMethod, amount: number) => {
    if (!currentEst || !selectedQueueItem) return;
    const newRec = { id: Math.random().toString(36).substr(2, 9), amount, method, serviceName: selectedQueueItem.service, clientName: selectedQueueItem.name, date: new Date().toISOString(), establishmentId: currentEst.id };
    if (isLocalMode) {
      const newRev = [...revenue, newRec];
      const newQ = queue.filter(i => i.id !== selectedQueueItem.id);
      setRevenue(newRev); setQueue(newQ);
      setIsCompletionModalOpen(false); setSelectedQueueItem(null);
    } else {
      await addDoc(collection(db, "establishments", currentEst.id, "revenue"), newRec);
      await deleteDoc(doc(db, "establishments", currentEst.id, "queue", selectedQueueItem.id));
      setIsCompletionModalOpen(false); setSelectedQueueItem(null);
    }
  };

  if (isDisplayMode) {
    return <DisplayMode queue={queue} professionals={professionals} onExit={() => setIsDisplayMode(false)} />;
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-10 text-center">
        <Loader2 className="animate-spin text-teal-500 mb-4" size={32} />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{loadStatus}</span>
      </div>
    );
  }

  if (!isLoggedIn) return <AuthView onLogin={(email, role) => { setUserEmail(email); setUserRole(role); setIsLoggedIn(true); localStorage.setItem('user_role', role); }} />;
  if (!currentEst) return <BusinessSelect userEmail={userEmail} userRole={userRole} onSelect={setCurrentEst} onLogout={() => auth.signOut()} />;

  return (
    <Layout 
      activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} 
      establishmentCode={currentEst.id} isLocalMode={isLocalMode} onBackToDashboard={() => setCurrentEst(null)}
      loyaltyEnabled={currentEst.loyaltyEnabled}
    >
      {activeTab === 'fila' && (
        <QueueView 
          queue={queue} isAdmin={userRole === 'admin'} estStatus={currentEst.status} 
          bookingModel={currentEst.bookingModel || 'both'} professionals={professionals} services={services} 
          onCallNext={handleCallNext} 
          onNoShow={() => {
            const first = queue.find(i => i.status === 'serving') || queue.find(i => i.status === 'waiting');
            if (!first) return;
            if (isLocalMode) {
               const newQ = queue.filter(i => i.id !== first.id);
               setQueue(newQ);
            } else {
               deleteDoc(doc(db, "establishments", currentEst.id, "queue", first.id));
            }
          }} 
          onOpenJoinModal={() => setIsJoinModalOpen(true)} 
        />
      )}
      
      {activeTab === 'fidelidade' && <LoyaltyView cutsCount={revenue.filter(r => r.clientName === userEmail).length} />}

      {activeTab === 'admin' && userRole === 'admin' && (
        <div className="space-y-6">
          <button 
            onClick={() => setIsDisplayMode(true)}
            className="w-full bg-indigo-600/10 border border-indigo-500/30 p-5 rounded-[32px] flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white"><Monitor size={24} /></div>
              <div className="text-left">
                <h4 className="text-sm font-black uppercase tracking-tighter text-white">Painel da recepção</h4>
                <p className="text-[9px] font-bold uppercase opacity-60 text-slate-400">Transmitir para Smart TV</p>
              </div>
            </div>
            <Monitor size={20} className="text-slate-500" />
          </button>

          <AdminPanel 
            queue={queue} services={services} professionals={professionals} 
            estStatus={currentEst.status} bookingModel={currentEst.bookingModel || 'both'} 
            plan={currentEst.plan || 'free'} trialStartedAt={currentEst.trialStartedAt || Date.now()} 
            loyaltyEnabled={currentEst.loyaltyEnabled} revenue={revenue} 
            pixKey={currentEst.pixKey || ''} establishmentId={currentEst.id}
            onSetPixKey={async (k) => await updateDoc(doc(db, "establishments", currentEst.id!), { pixKey: k })} 
            onUpdateStatus={async (s) => await updateDoc(doc(db, "establishments", currentEst.id!), { status: s })}
            onSetBookingModel={async (m) => await updateDoc(doc(db, "establishments", currentEst.id!), { bookingModel: m })}
            onSetLoyaltyEnabled={async (e) => await updateDoc(doc(db, "establishments", currentEst.id!), { loyaltyEnabled: e })}
            onCallNext={handleCallNext} onNoShow={handleCallNext}
            onUpdateServices={async (sList) => {
               if (isLocalMode) return;
               const lastService = sList[sList.length - 1];
               if (sList.length > services.length) await setDoc(doc(db, "establishments", currentEst.id, "services", lastService.id), lastService);
               else { const removed = services.find(s => !sList.find(sl => sl.id === s.id)); if (removed) await deleteDoc(doc(db, "establishments", currentEst.id, "services", removed.id)); }
            }}
            onUpdatePros={async (pList) => {
               if (isLocalMode) return;
               const lastPro = pList[pList.length - 1];
               // Fixed: corrected "sl" to "pl" in find callback to resolve "Cannot find name 'sl'" error
               if (pList.length > professionals.length) await setDoc(doc(db, "establishments", currentEst.id, "professionals", lastPro.id), lastPro);
               else { const removed = professionals.find(p => !pList.find(pl => pl.id === p.id)); if (removed) await deleteDoc(doc(db, "establishments", currentEst.id, "professionals", removed.id)); }
            }}
          />
        </div>
      )}

      {activeTab === 'config' && (
        <div className="space-y-10">
          <section className="space-y-4">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Sincronização</h3>
             <DataStatus isLocalMode={isLocalMode} localCount={queue.length} cloudCount={queue.length} onSync={handleManualSync} />
          </section>
          <button onClick={() => auth.signOut()} className="w-full py-5 bg-red-500/10 border border-red-500/20 rounded-3xl text-[10px] font-black uppercase text-red-500 flex items-center justify-center gap-2">
             <LogOut size={16} /> Encerrar Sessão
          </button>
        </div>
      )}

      {isJoinModalOpen && <JoinQueueModal services={services} currentQueue={queue} professionals={professionals} bookingModel={currentEst.bookingModel || 'both'} onClose={() => setIsJoinModalOpen(false)} onSubmit={handleJoinQueue} />}
      {isCompletionModalOpen && selectedQueueItem && (
        <ServiceCompletionModal item={selectedQueueItem} services={services} onClose={() => setIsCompletionModalOpen(false)} onConfirm={handleFinishService} />
      )}
    </Layout>
  );
};

export default App;
