
import React, { useState, useEffect } from 'react';
import { db, auth, isConfigured } from './services/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, orderBy, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { UserCircle, Settings, ExternalLink } from 'lucide-react';
import { Layout } from './components/Layout';
import { QueueView } from './components/QueueView';
import { AdminPanel } from './components/AdminPanel';
import { LoyaltyView } from './components/LoyaltyView';
import { AuthView } from './components/AuthView';
import { BusinessSelect } from './components/BusinessSelect';
import { JoinQueueModal } from './components/JoinQueueModal';
import { ServiceCompletionModal } from './components/ServiceCompletionModal';
import { QueueItem, Service, Professional, Establishment, RevenueRecord, AuthProvider, PaymentMethod } from './types';

const App: React.FC = () => {
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'client'>('client');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
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

  useEffect(() => {
    if (!currentEst || !isConfigured) return;

    const qQueue = query(collection(db, "establishments", currentEst.id, "queue"), orderBy("timestamp", "asc"));
    const unsubscribeQueue = onSnapshot(qQueue, (snapshot) => {
      setQueue(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QueueItem)));
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
  }, [currentEst]);

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-[#050810] flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="w-20 h-20 bg-teal-500/10 rounded-[32px] flex items-center justify-center text-teal-500 border border-teal-500/20 animate-pulse">
          <Settings size={40} />
        </div>
        <div className="space-y-3 max-w-md">
          <h1 className="text-2xl font-black text-white font-orbitron uppercase tracking-tighter">Conexão Pendente</h1>
          <p className="text-slate-400 text-xs leading-relaxed">
            Verificamos suas chaves do Firebase, mas você ainda não atualizou o arquivo <code>services/firebase.ts</code>.
          </p>
        </div>
        <a href="https://console.firebase.google.com/project/fila-livre-5d28d/settings/general" target="_blank" className="w-full max-w-sm py-4 bg-teal-500 text-slate-950 font-black rounded-2xl text-[10px] uppercase flex items-center justify-center gap-2">Ir para o Firebase <ExternalLink size={14} /></a>
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
      alert("Erro ao entrar na fila.");
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
        amount,
        method,
        serviceName: selectedQueueItem.service,
        clientName: selectedQueueItem.name,
        date: new Date().toISOString(),
        establishmentId: currentEst.id
      });

      await deleteDoc(doc(db, "establishments", currentEst.id, "queue", selectedQueueItem.id));
      setIsCompletionModalOpen(false);
      setSelectedQueueItem(null);

      const nextIdx = queue.findIndex(i => i.status === 'waiting');
      if (nextIdx !== -1) {
        await updateDoc(doc(db, "establishments", currentEst.id, "queue", queue[nextIdx].id), {
          status: 'serving',
          timestamp: Date.now()
        });
      }
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
             // Sincroniza o catálogo no Firestore
             const lastService = sList[sList.length - 1];
             if (sList.length > services.length) {
                await setDoc(doc(db, "establishments", currentEst.id, "services", lastService.id), lastService);
             } else {
                // Lógica de remoção (simplificada)
                const removed = services.find(s => !sList.find(sl => sl.id === s.id));
                if (removed) await deleteDoc(doc(db, "establishments", currentEst.id, "services", removed.id));
             }
          }}
          onUpdatePros={async (pList) => {
             // Sincroniza a equipe no Firestore
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
           <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-slate-900 border-2 border-white/5 rounded-[40px] flex items-center justify-center text-teal-400 shadow-2xl">
                <UserCircle size={48} />
              </div>
              <h2 className="text-2xl font-black text-white font-orbitron uppercase tracking-tighter">Minha Conta</h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{userEmail}</p>
           </div>
           <div className="w-full max-w-sm space-y-3">
              <button onClick={() => auth.signOut()} className="w-full py-5 bg-red-500/10 border border-red-500/20 rounded-3xl text-[10px] font-black uppercase text-red-500">Sair da Conta</button>
           </div>
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
