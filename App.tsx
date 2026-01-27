
import React, { useState, useEffect, useRef } from 'react';
import { db, auth, isConfigured } from './services/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, orderBy, setDoc, getDoc, where, getDocs, writeBatch, increment, collectionGroup } from 'firebase/firestore';
import { onAuthStateChanged, updatePassword } from 'firebase/auth';
import { Settings, RefreshCw, LogOut, Trash2, Scissors, UserCheck, ArrowRight, Coffee, UserX, CheckCircle2, Lock, Phone, ShieldCheck, Loader2, Mail, User, BellRing, Sparkles, X, UserCog, Power, CheckCircle, DoorClosed, Zap, Layers, Sun, Moon } from 'lucide-react';
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

const playBeep = (type: 'entry' | 'alert' | 'available') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (type === 'alert') {
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + start + duration);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + duration);
      };
      playTone(440, 0, 0.2); 
      playTone(880, 0.25, 0.3);
    } else {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      if (type === 'entry') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
      } else if (type === 'available') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(660, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      }
    }
  } catch (e) {}
};

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

  const prevQueueLength = useRef(0);
  const notifiedNearCalling = useRef(false);

  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

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
    const q = query(
      collectionGroup(db, "queue"), 
      where("userEmail", "==", userEmail),
      where("status", "in", ["waiting", "serving"])
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as QueueItem));
      setGlobalUserQueues(items);
    });
    return () => unsub();
  }, [userEmail, userRole]);

  useEffect(() => {
    if (!currentEst || !isLoggedIn) return;
    if (userRole === 'admin' || userRole === 'staff') {
      if (queue.length > prevQueueLength.current && prevQueueLength.current !== 0) {
        playBeep('entry');
        if (navigator.vibrate) navigator.vibrate(200);
      }
    }
    prevQueueLength.current = queue.length;
    if (userRole === 'client') {
      const myItem = queue.filter(i => i.status === 'waiting').find(i => i.userEmail === userEmail);
      const firstWaiting = queue.filter(i => i.status === 'waiting')[0];
      if (myItem && firstWaiting && myItem.id === firstWaiting.id) {
        if (!notifiedNearCalling.current) {
          playBeep('alert');
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          notifiedNearCalling.current = true;
        }
      } else { notifiedNearCalling.current = false; }
    }
  }, [queue, professionals, userRole, userEmail, isLoggedIn, currentEst]);

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) return alert("A senha deve ter no mínimo 6 caracteres.");
    setIsUpdatingProfile(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setNewPassword(''); alert("Senha atualizada!");
      }
    } catch (e) { alert("Sessão expirada."); } finally { setIsUpdatingProfile(false); }
  };

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

  const handleUpdateAccessCode = async (newId: string): Promise<boolean> => {
    if (!currentEst) return false;
    const cleanId = newId.trim().toUpperCase().replace(/\s/g, '');
    if (cleanId === currentEst.id) return true;
    try {
      const newDocRef = doc(db, "establishments", cleanId);
      const newDocSnap = await getDoc(newDocRef);
      if (newDocSnap.exists()) { alert("Este código já pertence a outra unidade."); return false; }
      const oldDocRef = doc(db, "establishments", currentEst.id);
      const oldDocSnap = await getDoc(oldDocRef);
      if (oldDocSnap.exists()) { await setDoc(newDocRef, { ...oldDocSnap.data(), id: cleanId }); }
      const srvSnap = await getDocs(collection(db, "establishments", currentEst.id, "services"));
      for (const d of srvSnap.docs) { await setDoc(doc(db, "establishments", cleanId, "services", d.id), d.data()); }
      const proSnap = await getDocs(collection(db, "establishments", currentEst.id, "professionals"));
      for (const d of proSnap.docs) { await setDoc(doc(db, "establishments", cleanId, "professionals", d.id), d.data()); }
      await deleteDoc(oldDocRef);
      setCurrentEst({ ...currentEst, id: cleanId });
      alert("Código de acesso alterado!"); return true;
    } catch (e) { alert("Erro ao migrar dados."); return false; }
  };

  const handleJoinQueue = async (data: any) => {
    if (!currentEst || !auth.currentUser) return;
    try {
      const baseTime = Date.now();
      const person = data.mainPerson;
      const payload: any = {
        name: person.name, professionalId: data.professionalId, service: person.service, type: data.type,
        userEmail: userRole === 'client' ? userEmail : null, establishmentId: currentEst.id,
        establishmentName: currentEst.name, status: 'waiting', timestamp: baseTime, missedCount: 0
      };
      if (data.scheduledTime) payload.scheduledTime = data.scheduledTime;
      await addDoc(collection(db, "establishments", currentEst.id, "queue"), payload);
      setIsJoinModalOpen(false);
    } catch (e: any) { alert(`Erro: ${e.message}`); }
  };

  const handleCallNext = async (specificId?: string) => {
    if (!currentEst) return;
    const myPro = professionals.find(p => p.email?.toLowerCase() === userEmail.toLowerCase());
    const myProId = myPro?.id;
    if (specificId) {
      const item = queue.find(i => i.id === specificId);
      if (!item) return;
      const targetProId = item.professionalId !== 'any' ? item.professionalId : (myProId || professionals[0]?.id || 'any');
      if (targetProId !== 'any' && currentEst.autoStatusEnabled) {
        await updateDoc(doc(db, "establishments", currentEst.id, "professionals", targetProId), { status: 'busy' });
      }
      await updateDoc(doc(db, "establishments", currentEst.id, "queue", specificId), { status: 'serving', professionalId: targetProId, timestamp: Date.now() });
      return;
    }
    let nextItem = userRole === 'staff' && myProId ? queue.find(i => i.status === 'waiting' && (i.professionalId === myProId || i.professionalId === 'any')) : queue.find(i => i.status === 'waiting');
    if (nextItem) {
      const targetProId = nextItem.professionalId !== 'any' ? nextItem.professionalId : (myProId || professionals[0]?.id || 'any');
      if (targetProId !== 'any' && currentEst.autoStatusEnabled) {
        await updateDoc(doc(db, "establishments", currentEst.id, "professionals", targetProId), { status: 'busy' });
      }
      await updateDoc(doc(db, "establishments", currentEst.id, "queue", nextItem.id), { status: 'serving', professionalId: targetProId, timestamp: Date.now() });
    } else { alert("Ninguém aguardando."); }
  };

  const handleNoShow = async (itemId: string) => {
    if (!currentEst) return;
    if (confirm("Remover cliente da lista?")) {
      const item = queue.find(i => i.id === itemId);
      if (item && item.status === 'serving' && item.professionalId !== 'any' && currentEst.autoStatusEnabled) {
        await updateDoc(doc(db, "establishments", currentEst.id, "professionals", item.professionalId), { status: 'available' });
      }
      await deleteDoc(doc(db, "establishments", currentEst.id, "queue", itemId));
    }
  };

  const handleLeaveQueue = async (estId: string, queueId: string) => {
    if(confirm("Tem certeza que deseja sair da fila?")) { await deleteDoc(doc(db, "establishments", estId, "queue", queueId)); }
  };

  const myProRecord = professionals.find(p => p.email?.toLowerCase() === userEmail.toLowerCase());
  const myProId = myProRecord?.id;

  if (isTVMode && currentEst) return <TVView queue={queue} professionals={professionals} establishmentName={currentEst.name} onClose={() => setIsTVMode(false)} theme={theme} />;
  if (!isConfigured) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><Settings className="text-teal-500 animate-spin" /></div>;
  if (!isLoggedIn) return <AuthView onLogin={(email, role) => { setUserEmail(email.toLowerCase()); setUserRole(role); setIsLoggedIn(true); setActiveTab('fila'); }} theme={theme} onToggleTheme={toggleTheme} />;
  if (!currentEst) return <BusinessSelect userEmail={userEmail} userRole={userRole} userQueues={globalUserQueues} onSelect={setCurrentEst} onLogout={() => auth.signOut()} />;

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      userRole={userRole === 'staff' ? 'client' : userRole} 
      establishmentCode={currentEst.id} 
      establishmentName={currentEst.name}
      onBackToDashboard={() => setCurrentEst(null)} 
      loyaltyEnabled={currentEst.loyaltyEnabled}
      userActiveQueues={globalUserQueues}
      theme={theme}
      onToggleTheme={toggleTheme}
    >
      {activeTab === 'fila' && (
        <QueueView 
          queue={queue} isAdmin={userRole === 'admin'} isStaff={userRole === 'staff'} userRole={userRole} myProId={myProId} currentUserEmail={userEmail} establishmentName={currentEst.name} estStatus={currentEst.status} autoStatusEnabled={currentEst.autoStatusEnabled} professionals={professionals} services={services} dailySchedules={currentEst.dailySchedules} pixKey={currentEst.pixKey} theme={theme}
          onCallNext={handleCallNext} onFinish={(item) => { setSelectedQueueItem(item); setIsCompletionModalOpen(true); }} 
          onNoShow={handleNoShow} onOpenJoinModal={() => setIsJoinModalOpen(true)} onLeaveQueue={(id) => handleLeaveQueue(currentEst.id, id)}
          onUpdateProfessional={(itemId, proId) => updateDoc(doc(db, "establishments", currentEst.id, "queue", itemId), { professionalId: proId })}
        />
      )}
      {activeTab === 'fidelidade' && <LoyaltyView cutsCount={loyaltyCount} reward={currentEst.loyaltyReward} />}
      {activeTab === 'admin' && userRole === 'admin' && (
        <AdminPanel 
          establishment={currentEst} queue={queue} services={services} professionals={professionals} estStatus={currentEst.status} bookingModel={currentEst.bookingModel || 'both'} plan={currentEst.plan || 'free'} trialStartedAt={currentEst.trialStartedAt || Date.now()} loyaltyEnabled={currentEst.loyaltyEnabled} revenue={revenue} pixKey={currentEst.pixKey || ''} 
          onUpdateEstablishment={(d) => updateDoc(doc(db, "establishments", currentEst.id), { ...d })} onDeleteEstablishment={() => deleteDoc(doc(db, "establishments", currentEst.id))} onUpdateAccessCode={handleUpdateAccessCode} onSetPixKey={(k) => updateDoc(doc(db, "establishments", currentEst.id), { pixKey: k })} onUpdateStatus={(s) => updateDoc(doc(db, "establishments", currentEst.id), { status: s, statusUpdatedAt: Date.now() })} onSetBookingModel={(m) => updateDoc(doc(db, "establishments", currentEst.id), { bookingModel: m })} onSetLoyaltyEnabled={(e) => updateDoc(doc(db, "establishments", currentEst.id), { loyaltyEnabled: e })}
          onCallNext={() => handleCallNext()} onFinish={(item) => { setSelectedQueueItem(item); setIsCompletionModalOpen(true); }} onNoShow={handleNoShow} 
          onUpdateServices={handleUpdateServices} onUpdatePros={handleUpdatePros} onManualJoin={(d) => handleJoinQueue({ mainPerson: { name: d.name, service: d.service }, professionalId: d.professionalId, type: d.type })} onToggleTVMode={() => setIsTVMode(true)}
        />
      )}
      {activeTab === 'config' && (
        <div className="space-y-8 pb-32">
           <div className="text-center space-y-4">
             <div className="w-20 h-20 bg-slate-900 rounded-[32px] flex items-center justify-center mx-auto border border-white/5 shadow-2xl"><User className="text-teal-400" size={32} /></div>
             <h2 className="text-2xl font-black uppercase tracking-tighter font-orbitron">MEU PERFIL</h2>
           </div>
           <div className="space-y-4">
              <section className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Trocar Senha</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white outline-none" /></div>
                    <button onClick={handleUpdatePassword} disabled={isUpdatingProfile} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase">Confirmar Troca</button>
                 </div>
              </section>
              <button onClick={() => auth.signOut()} className="w-full py-5 bg-red-500 text-white rounded-[32px] text-[10px] font-black uppercase">Sair do App</button>
           </div>
        </div>
      )}
      {isJoinModalOpen && <JoinQueueModal establishment={currentEst} services={services} currentQueue={queue} professionals={professionals} dailySchedules={currentEst?.dailySchedules} bookingModel={currentEst?.bookingModel || 'both'} initialName={userProfile?.name || ''} onClose={() => setIsJoinModalOpen(false)} onSubmit={handleJoinQueue} />}
      {isCompletionModalOpen && selectedQueueItem && (
        <ServiceCompletionModal 
          item={selectedQueueItem} services={services} pixKey={currentEst?.pixKey} onClose={() => setIsCompletionModalOpen(false)} 
          onConfirm={async (method, amount) => {
            if (!currentEst) return;
            if (amount > 0) {
              await addDoc(collection(db, "establishments", currentEst.id, "revenue"), { amount, method, serviceName: selectedQueueItem.service, clientName: selectedQueueItem.name, date: new Date().toISOString(), establishmentId: currentEst.id });
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
