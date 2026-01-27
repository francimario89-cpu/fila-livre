
import React, { useState, useEffect } from 'react';
import { db, auth, isConfigured } from './services/firebase.ts';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, orderBy, setDoc, getDoc, where, collectionGroup } from 'firebase/firestore';
import { onAuthStateChanged, updatePassword } from 'firebase/auth';
import { Settings, User, Zap, Download, Smartphone, Apple, Moon, Sun } from 'lucide-react';
import { Layout } from './components/Layout.tsx';
import { QueueView } from './components/QueueView.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { LoyaltyView } from './components/LoyaltyView.tsx';
import { AuthView } from './components/AuthView.tsx';
import { BusinessSelect } from './components/BusinessSelect.tsx';
import { JoinQueueModal } from './components/JoinQueueModal.tsx';
import { ServiceCompletionModal } from './components/ServiceCompletionModal.tsx';
import { TVView } from './components/TVView.tsx';
import { QueueItem, Service, Professional, Establishment, RevenueRecord } from './types.ts';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app-theme') as 'dark' | 'light') || 'dark';
  });
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
  const [globalUserQueues, setGlobalUserQueues] = useState<QueueItem[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(!!checkStandalone);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsStandalone(true);
      }
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        alert("PARA INSTALAR NO IPHONE:\n\n1. Toque no ícone de 'Compartilhar' (quadrado com seta pra cima no centro da barra inferior).\n2. Role para baixo e toque em 'Adicionar à Tela de Início'.\n3. Toque em 'Adicionar' no canto superior direito.");
      } else {
        alert("PARA INSTALAR NO ANDROID:\n\n1. Toque nos 3 pontinhos no canto superior direito do Chrome.\n2. Selecione 'Instalar aplicativo' ou 'Adicionar à tela inicial'.");
      }
    }
  };

  const myProId = professionals.find(p => p.email?.toLowerCase() === userEmail?.toLowerCase())?.id;

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    document.body.className = `theme-${theme}`;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

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

  useEffect(() => {
    if (!userEmail || userRole !== 'client') {
      setGlobalUserQueues([]);
      return;
    }
    const q = query(collectionGroup(db, "queue"), where("userEmail", "==", userEmail), where("status", "in", ["waiting", "serving"]));
    const unsub = onSnapshot(q, (snap) => {
      setGlobalUserQueues(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as QueueItem)));
    });
    return () => unsub();
  }, [userEmail, userRole]);

  useEffect(() => {
    if (!currentEst?.id || !isLoggedIn) return;
    const unsubEst = onSnapshot(doc(db, "establishments", currentEst.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Establishment;
        setCurrentEst(data);
        if (userEmail && data.ownerEmail && userEmail.toLowerCase() === data.ownerEmail.toLowerCase()) setUserRole('admin');
      }
    });
    return () => unsubEst();
  }, [currentEst?.id, isLoggedIn, userEmail]);

  useEffect(() => {
    if (!currentEst?.id || !isConfigured || !isLoggedIn) return;
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
      if (doc.exists()) setLoyaltyCount(doc.data().count || 0); else setLoyaltyCount(0);
    });
    return () => { unsubQueue(); unsubServices(); unsubPros(); unsubRevenue(); unsubLoyalty(); };
  }, [currentEst?.id, isLoggedIn, userEmail]);

  const handleUpdateServices = async (newServiceArray: Service[]) => {
    if (!currentEst) return;
    try {
      const toDelete = services.filter(s => !newServiceArray.find(ns => ns.id === s.id));
      for (const s of toDelete) { await deleteDoc(doc(db, "establishments", currentEst.id, "services", s.id)); }
      for (const s of newServiceArray) { await setDoc(doc(db, "establishments", currentEst.id, "services", s.id), s); }
    } catch (e) { alert("Erro ao salvar serviços."); }
  };

  const handleUpdatePros = async (newProArray: Professional[]) => {
    if (!currentEst) return;
    try {
      const toDelete = professionals.filter(p => !newProArray.find(np => np.id === p.id));
      for (const p of toDelete) { await deleteDoc(doc(db, "establishments", currentEst.id, "professionals", p.id)); }
      for (const p of newProArray) { await setDoc(doc(db, "establishments", currentEst.id, "professionals", p.id), p); }
    } catch (e) { console.error(e); }
  };

  const handleJoinQueue = async (data: any) => {
    if (!currentEst || !auth.currentUser) return;
    try {
      const baseTime = Date.now();
      const person = data.mainPerson;
      const payload: any = {
        name: person.name, professionalId: data.professionalId, service: person.service, type: data.type,
        isPriority: data.isPriority || false, userEmail: userRole === 'client' ? userEmail : null, 
        establishmentId: currentEst.id, establishmentName: currentEst.name, status: 'waiting', timestamp: baseTime, missedCount: 0
      };
      await addDoc(collection(db, "establishments", currentEst.id, "queue"), payload);
      setIsJoinModalOpen(false);
    } catch (e: any) { alert(`Erro: ${e.message}`); }
  };

  const handleUpdatePassword = async (newPass: string) => {
    if (newPass.length < 6) return alert("A senha deve ter no mínimo 6 caracteres.");
    try {
      if (auth.currentUser) { await updatePassword(auth.currentUser, newPass); alert("Senha atualizada!"); }
    } catch (e) { alert("Sessão expirada."); }
  };

  if (isTVMode && currentEst) return <TVView queue={queue} professionals={professionals} establishmentName={currentEst.name} onClose={() => setIsTVMode(false)} theme={theme} />;
  if (!isConfigured) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><Settings className="text-teal-500 animate-spin" /></div>;
  if (!isLoggedIn) return <AuthView onLogin={(email, role) => { setUserEmail(email.toLowerCase()); setUserRole(role); setIsLoggedIn(true); setActiveTab('fila'); }} theme={theme} onToggleTheme={toggleTheme} />;
  if (!currentEst) return <BusinessSelect userEmail={userEmail} userRole={userRole} userQueues={globalUserQueues} onSelect={setCurrentEst} onLogout={() => auth.signOut()} theme={theme} />;

  return (
    <Layout 
      activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole === 'staff' ? 'client' : userRole} 
      establishmentCode={currentEst.id} establishmentName={currentEst.name} onBackToDashboard={() => setCurrentEst(null)} 
      loyaltyEnabled={currentEst.loyaltyEnabled} userActiveQueues={globalUserQueues} theme={theme} onToggleTheme={toggleTheme}
    >
      {activeTab === 'fila' && (
        <QueueView 
          queue={queue} isAdmin={userRole === 'admin'} isStaff={userRole === 'staff'} userRole={userRole} myProId={myProId} currentUserEmail={userEmail} 
          establishmentName={currentEst.name} estStatus={currentEst.status} autoStatusEnabled={currentEst.autoStatusEnabled} professionals={professionals} 
          services={services} dailySchedules={currentEst.dailySchedules} theme={theme} onOpenJoinModal={() => setIsJoinModalOpen(true)}
          onCallNext={(id) => {}} onFinish={(item) => { setSelectedQueueItem(item); setIsCompletionModalOpen(true); }} onNoShow={(id) => {}} 
          onTogglePriority={(id, status) => updateDoc(doc(db, "establishments", currentEst.id, "queue", id), { isPriority: !status })}
          onUpdateProfessional={(itemId, proId) => updateDoc(doc(db, "establishments", currentEst.id, "queue", itemId), { professionalId: proId })}
          isStandalone={isStandalone}
          onInstallRequest={handleInstallApp}
        />
      )}
      {activeTab === 'fidelidade' && <LoyaltyView cutsCount={loyaltyCount} reward={currentEst.loyaltyReward} />}
      {activeTab === 'admin' && userRole === 'admin' && (
        <AdminPanel 
          establishment={currentEst} queue={queue} services={services} professionals={professionals} estStatus={currentEst.status} bookingModel={currentEst.bookingModel || 'both'} plan={currentEst.plan || 'free'} trialStartedAt={currentEst.trialStartedAt || Date.now()} loyaltyEnabled={currentEst.loyaltyEnabled} revenue={revenue} pixKey={currentEst.pixKey || ''} 
          onUpdateEstablishment={(d) => updateDoc(doc(db, "establishments", currentEst.id), { ...d })} onDeleteEstablishment={() => deleteDoc(doc(db, "establishments", currentEst.id))} onUpdateAccessCode={(c) => Promise.resolve(true)} onSetPixKey={(k) => updateDoc(doc(db, "establishments", currentEst.id), { pixKey: k })} onUpdateStatus={(s) => updateDoc(doc(db, "establishments", currentEst.id), { status: s, statusUpdatedAt: Date.now() })} onSetBookingModel={(m) => updateDoc(doc(db, "establishments", currentEst.id), { bookingModel: m })} onSetLoyaltyEnabled={(e) => updateDoc(doc(db, "establishments", currentEst.id), { loyaltyEnabled: e })}
          onCallNext={() => {}} onFinish={(item) => { setSelectedQueueItem(item); setIsCompletionModalOpen(true); }} onNoShow={() => {}} 
          onUpdateServices={handleUpdateServices} onUpdatePros={handleUpdatePros} onManualJoin={(d) => handleJoinQueue(d)} onToggleTVMode={() => setIsTVMode(true)}
        />
      )}
      {activeTab === 'config' && (
        <div className="space-y-8 pb-32">
           <div className="text-center space-y-4">
             <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto border shadow-2xl ${theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}><User className="text-teal-400" size={32} /></div>
             <h2 className="text-2xl font-black uppercase tracking-tighter font-orbitron">MEU PERFIL</h2>
           </div>

           <div className="space-y-6">
              {!isStandalone && (
                <section className={`p-8 rounded-[40px] border shadow-xl ${theme === 'dark' ? 'bg-slate-900 border-teal-500/20' : 'bg-white border-slate-200'}`}>
                   <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-teal-500/10 text-teal-400 rounded-2xl flex items-center justify-center"><Smartphone size={24} /></div>
                      <div>
                         <h3 className="text-sm font-black uppercase tracking-tighter">App no seu Celular</h3>
                         <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Acesso rápido sem usar o navegador</p>
                      </div>
                   </div>
                   <button onClick={handleInstallApp} className="w-full bg-teal-500 text-slate-950 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3">
                      <Download size={18} /> Instalar Agora
                   </button>
                </section>
              )}
              <button onClick={() => auth.signOut()} className="w-full py-5 bg-red-500 text-white rounded-[32px] text-[10px] font-black uppercase shadow-lg shadow-red-500/20">Sair do App</button>
           </div>
        </div>
      )}
      {isJoinModalOpen && <JoinQueueModal establishment={currentEst} services={services} professionals={professionals} dailySchedules={currentEst?.dailySchedules} bookingModel={currentEst?.bookingModel || 'both'} currentQueue={queue} initialName={userProfile?.name || ''} onClose={() => setIsJoinModalOpen(false)} onSubmit={handleJoinQueue} />}
      {isCompletionModalOpen && selectedQueueItem && (
        <ServiceCompletionModal 
          item={selectedQueueItem} services={services} pixKey={currentEst?.pixKey} onClose={() => setIsCompletionModalOpen(false)} 
          onConfirm={async (method, amount) => {
            if (!currentEst) return;
            if (amount > 0) { await addDoc(collection(db, "establishments", currentEst.id, "revenue"), { amount, method, serviceName: selectedQueueItem.service, clientName: selectedQueueItem.name, date: new Date().toISOString(), establishmentId: currentEst.id }); }
            await deleteDoc(doc(db, "establishments", currentEst.id, "queue", selectedQueueItem.id)); setIsCompletionModalOpen(false);
          }} 
        />
      )}
    </Layout>
  );
};
export default App;
