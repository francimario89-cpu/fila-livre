
import React, { useState, useEffect } from 'react';
import { db, auth, isConfigured } from './services/firebase.ts';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, orderBy, setDoc, getDoc, where, collectionGroup } from 'firebase/firestore';
import { onAuthStateChanged, updatePassword } from 'firebase/auth';
import { Settings, User, Zap, Download, Smartphone, Apple, Moon, Sun, Building2, Plus, RefreshCw } from 'lucide-react';
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

// Main App Component - Sync Trigger
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
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else {
      alert("Para instalar, use a opção 'Adicionar à tela de início' do seu navegador.");
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
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserProfile(data);
          setUserRole(data.role || 'client');
        }
      } else {
        setIsLoggedIn(false); setCurrentEst(null); setUserEmail(''); setUserRole('client');
      }
    });
  }, []);

  // SINCRONIZAÇÃO DE PERMISSÕES AO SELECIONAR UNIDADE
  useEffect(() => {
    if (!currentEst?.id || !isLoggedIn || !userEmail) return;
    const unsubEst = onSnapshot(doc(db, "establishments", currentEst.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Establishment;
        setCurrentEst(data);
        // Se o e-mail logado for o dono, sobe para Admin
        if (userEmail.toLowerCase() === data.ownerEmail.toLowerCase()) {
          setUserRole('admin');
        }
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
    return () => { unsubQueue(); unsubServices(); unsubPros(); unsubRevenue(); };
  }, [currentEst?.id, isLoggedIn]);

  const handleRemoveFromQueue = async (id: string) => {
    if (!currentEst) return;
    const confirmMsg = userRole === 'client' ? "Deseja sair da fila?" : "Remover este cliente da lista?";
    if (!confirm(confirmMsg)) return;
    try {
      await deleteDoc(doc(db, "establishments", currentEst.id, "queue", id));
    } catch (e) {
      alert("Erro ao remover: " + e);
    }
  };

  const handleUpdateServices = async (newServices: Service[]) => {
    if (!currentEst) return;
    try {
      // Deletar os que sumiram da lista
      const oldServices = services;
      const removed = oldServices.filter(s => !newServices.find(ns => ns.id === s.id));
      for (const s of removed) {
        await deleteDoc(doc(db, "establishments", currentEst.id, "services", s.id));
      }
      // Adicionar ou atualizar novos
      for (const s of newServices) {
        await setDoc(doc(db, "establishments", currentEst.id, "services", s.id), s);
      }
    } catch (e) { alert("Erro ao salvar serviços"); }
  };

  const handleUpdateProfessionals = async (newPros: Professional[]) => {
    if (!currentEst) return;
    try {
      const removed = professionals.filter(p => !newPros.find(np => np.id === p.id));
      for (const p of removed) {
        await deleteDoc(doc(db, "establishments", currentEst.id, "professionals", p.id));
      }
      for (const p of newPros) {
        await setDoc(doc(db, "establishments", currentEst.id, "professionals", p.id), p);
      }
    } catch (e) { alert("Erro ao salvar equipe"); }
  };

  const handleJoinQueue = async (data: any) => {
    if (!currentEst) return;
    try {
      // Gerar código de privacidade aleatório (ex: AB1234)
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const randomLetters = letters[Math.floor(Math.random() * letters.length)] + letters[Math.floor(Math.random() * letters.length)];
      const randomNumbers = Math.floor(1000 + Math.random() * 9000).toString();
      const queueCode = `${randomLetters}${randomNumbers}`;

      const payload: any = {
        name: data.mainPerson.name, 
        professionalId: data.professionalId, 
        service: data.mainPerson.service,
        type: data.type, 
        isPriority: data.isPriority || false, 
        userEmail: userEmail,
        code: queueCode,
        establishmentId: currentEst.id, 
        establishmentName: currentEst.name, 
        status: 'waiting', 
        timestamp: Date.now()
      };
      await addDoc(collection(db, "establishments", currentEst.id, "queue"), payload);
      setIsJoinModalOpen(false);
    } catch (e) { alert("Erro ao entrar: " + e); }
  };

  const handleCallNext = async (id: string) => {
    if (!currentEst) return;
    try {
      await updateDoc(doc(db, "establishments", currentEst.id, "queue", id), { status: 'serving' });
    } catch (e) { console.error(e); }
  };

  if (isTVMode && currentEst) return <TVView queue={queue} professionals={professionals} establishmentName={currentEst.name} onClose={() => setIsTVMode(false)} theme={theme} />;
  if (!isLoggedIn) return <AuthView onLogin={(email, role) => { setUserEmail(email.toLowerCase()); setUserRole(role); setIsLoggedIn(true); setActiveTab('fila'); }} theme={theme} onToggleTheme={toggleTheme} />;
  if (!currentEst) return <BusinessSelect userEmail={userEmail} userRole={userRole} userQueues={globalUserQueues} onSelect={(est) => { setCurrentEst(est); setActiveTab('fila'); }} onLogout={() => auth.signOut()} theme={theme} />;

  return (
    <Layout 
      activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole === 'staff' ? 'client' : userRole} 
      establishmentCode={currentEst.id} establishmentName={currentEst.name} onBackToDashboard={() => setCurrentEst(null)} 
      loyaltyEnabled={currentEst.loyaltyEnabled} theme={theme} onToggleTheme={toggleTheme}
    >
      {activeTab === 'fila' && (
        <QueueView 
          queue={queue} isAdmin={userRole === 'admin'} isStaff={userRole === 'staff'} userRole={userRole} myProId={myProId} currentUserEmail={userEmail} 
          establishmentName={currentEst.name} estStatus={currentEst.status} professionals={professionals} 
          services={services} theme={theme} onOpenJoinModal={() => setIsJoinModalOpen(true)}
          onCallNext={handleCallNext} 
          onFinish={(item) => { setSelectedQueueItem(item); setIsCompletionModalOpen(true); }} 
          onNoShow={handleRemoveFromQueue} 
          onLeaveQueue={handleRemoveFromQueue}
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
          onUpdateEstablishment={(d) => updateDoc(doc(db, "establishments", currentEst.id), { ...d })} onDeleteEstablishment={() => deleteDoc(doc(db, "establishments", currentEst.id))} onUpdateAccessCode={(c) => Promise.resolve(true)} onSetPixKey={(k) => updateDoc(doc(db, "establishments", currentEst.id), { pixKey: k })} onUpdateStatus={(s) => updateDoc(doc(db, "establishments", currentEst.id), { status: s })} onSetBookingModel={(m) => updateDoc(doc(db, "establishments", currentEst.id), { bookingModel: m })} onSetLoyaltyEnabled={(e) => updateDoc(doc(db, "establishments", currentEst.id), { loyaltyEnabled: e })}
          onCallNext={handleCallNext} onFinish={(item) => { setSelectedQueueItem(item); setIsCompletionModalOpen(true); }} onNoShow={handleRemoveFromQueue} 
          onUpdateServices={handleUpdateServices} onUpdatePros={handleUpdateProfessionals} onManualJoin={handleJoinQueue} onToggleTVMode={() => setIsTVMode(true)}
        />
      )}
      {activeTab === 'config' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
           <div className="text-center space-y-4">
             <div className="w-20 h-20 bg-teal-500/10 rounded-[32px] flex items-center justify-center mx-auto border border-teal-500/20">
                <User className="text-teal-400" size={40} />
             </div>
             <div>
               <h2 className="text-2xl font-black font-orbitron uppercase tracking-tighter">Meu Perfil</h2>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{userEmail}</p>
             </div>
           </div>
           
           <div className="space-y-4">
             <div className="flex items-center gap-2 ml-4">
                <Building2 size={12} className="text-slate-500" />
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Unidade Atual</p>
             </div>
             <div className={`p-6 rounded-[32px] flex items-center justify-between border ${theme === 'dark' ? 'bg-slate-900/50 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div>
                  <h3 className={`font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{currentEst.name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold">ID: {currentEst.id}</p>
                </div>
                <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-1.5">
                   <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                   <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Ativo</span>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setCurrentEst(null)} 
                  className={`flex items-center justify-center gap-2 p-5 rounded-[24px] border font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 ${theme === 'dark' ? 'bg-slate-900/50 border-white/5 text-slate-300 hover:text-white' : 'bg-white border-slate-100 text-slate-600 shadow-sm'}`}
                >
                  <RefreshCw size={14} /> Trocar Unidade
                </button>
                <button 
                  onClick={() => setCurrentEst(null)} 
                  className="flex items-center justify-center gap-2 p-5 bg-teal-500 text-slate-950 rounded-[24px] font-black text-[9px] uppercase tracking-widest shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
                >
                  <Plus size={14} /> Nova Unidade
                </button>
             </div>
           </div>

           <div className="pt-4">
             <button 
               onClick={() => auth.signOut()} 
               className={`w-full py-5 rounded-[32px] font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 border ${
                 theme === 'dark' 
                   ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                   : 'bg-red-50 bg-red-100 text-red-600'
               }`}
             >
               Sair da Conta
             </button>
           </div>
        </div>
      )}
      {isJoinModalOpen && <JoinQueueModal establishment={currentEst} services={services} professionals={professionals} currentQueue={queue} userProfile={userProfile} onClose={() => setIsJoinModalOpen(false)} onSubmit={handleJoinQueue} bookingModel={currentEst.bookingModel} />}
      {isCompletionModalOpen && selectedQueueItem && (
        <ServiceCompletionModal 
          item={selectedQueueItem} services={services} pixKey={currentEst?.pixKey} onClose={() => setIsCompletionModalOpen(false)} 
          onConfirm={async (method, amount) => {
            if (!currentEst) return;
            if (amount > 0) { await addDoc(collection(db, "establishments", currentEst.id, "revenue"), { amount, method, serviceName: selectedQueueItem.service, clientName: selectedQueueItem.name, clientCode: selectedQueueItem.code || null, date: new Date().toISOString(), establishmentId: currentEst.id }); }
            await deleteDoc(doc(db, "establishments", currentEst.id, "queue", selectedQueueItem.id)); setIsCompletionModalOpen(false);
          }} 
        />
      )}
    </Layout>
  );
};
export default App;
