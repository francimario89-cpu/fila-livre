
import React, { useState, useEffect, useRef } from 'react';
import { db, auth, isConfigured } from './services/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, orderBy, setDoc, getDoc, where, getDocs, writeBatch, increment, collectionGroup } from 'firebase/firestore';
import { onAuthStateChanged, updatePassword } from 'firebase/auth';
import { Settings, RefreshCw, LogOut, Trash2, Scissors, UserCheck, ArrowRight, Coffee, UserX, CheckCircle2, Lock, Phone, ShieldCheck, Loader2, Mail, User, BellRing, Sparkles, X, UserCog, Power, CheckCircle, DoorClosed, Zap, Layers, Sun, Moon, Download, Smartphone, Share, Apple } from 'lucide-react';
import { Layout } from './components/Layout';
import { QueueView } from './components/QueueView';
import { AdminPanel } from './components/AdminPanel';
import { LoyaltyView } from './components/LoyaltyView';
import { AuthView } from './components/AuthView';
import { BusinessSelect } from './components/BusinessSelect';
import { JoinQueueModal } from './components/JoinQueueModal';
import { ServiceCompletionModal } from './components/ServiceCompletionModal';
import { TVView } from './components/TVView';
import { QueueItem, Service, Professional, Establishment, RevenueRecord, UserProfile, ProfStatus, EstStatus, BookingModel } from './types';

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

  // Added to fix "Cannot find name 'myProId'" error: Identify the professional ID if user is staff
  const myProId = professionals.find(p => p.email?.toLowerCase() === userEmail?.toLowerCase())?.id;

  useEffect(() => {
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
      alert("Para instalar:\n\nNo iPhone: Toque no botão de compartilhar (ícone do meio) e 'Adicionar à Tela de Início'.\n\nNo Android: Toque nos três pontinhos do Chrome e 'Instalar Aplicativo'.");
    }
  };

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

  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) return alert("A senha deve ter no mínimo 6 caracteres.");
    setIsUpdatingProfile(true);
    try {
      if (auth.currentUser) { await updatePassword(auth.currentUser, newPassword); setNewPassword(''); alert("Senha atualizada!"); }
    } catch (e) { alert("Sessão expirada."); } finally { setIsUpdatingProfile(false); }
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
              {/* Seção de Instalação do Aplicativo */}
              <section className={`p-8 rounded-[40px] border shadow-xl ${theme === 'dark' ? 'bg-slate-900 border-teal-500/20' : 'bg-white border-slate-200'}`}>
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-teal-500/10 text-teal-400 rounded-2xl flex items-center justify-center"><Smartphone size={24} /></div>
                    <div>
                       <h3 className="text-sm font-black uppercase tracking-tighter">App no seu Celular</h3>
                       <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Acesso rápido sem usar o navegador</p>
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                    <button onClick={handleInstallApp} className="w-full bg-teal-500 text-slate-950 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3">
                       <Download size={18} /> Instalar Agora
                    </button>
                    
                    <div className="flex items-center justify-center gap-6 pt-2 opacity-50">
                       <div className="flex items-center gap-2"><Apple size={14}/><span className="text-[7px] font-black uppercase">iOS</span></div>
                       <div className="flex items-center gap-2"><Smartphone size={14}/><span className="text-[7px] font-black uppercase">Android</span></div>
                    </div>
                 </div>
              </section>

              <section className={`p-8 rounded-[40px] border shadow-lg ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                 <div className="space-y-4">
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Trocar Senha</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className={`w-full border rounded-2xl py-4 px-6 outline-none ${theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div>
                    <button onClick={handleUpdatePassword} disabled={isUpdatingProfile} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase">Atualizar Senha</button>
                 </div>
              </section>

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
