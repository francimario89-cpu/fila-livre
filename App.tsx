
import React, { useState, useEffect, useRef } from 'react';
import { db, auth, isConfigured } from './services/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, orderBy, setDoc, getDoc, where, getDocs, writeBatch, increment } from 'firebase/firestore';
import { onAuthStateChanged, updatePassword, updateEmail } from 'firebase/auth';
import { Settings, RefreshCw, LogOut, Trash2, Scissors, UserCheck, ArrowRight, Coffee, UserX, CheckCircle2, Lock, Phone, ShieldCheck, Loader2, Mail, User } from 'lucide-react';
import { Layout } from './components/Layout';
import { QueueView } from './components/QueueView';
import { AdminPanel } from './components/AdminPanel';
import { LoyaltyView } from './components/LoyaltyView';
import { AuthView } from './components/AuthView';
import { BusinessSelect } from './components/BusinessSelect';
import { JoinQueueModal } from './components/JoinQueueModal';
import { ServiceCompletionModal } from './components/ServiceCompletionModal';
import { TVView } from './components/TVView';
import { QueueItem, Service, Professional, Establishment, RevenueRecord, UserProfile, ProfStatus, EstStatus } from './types';

const playBeep = (type: 'entry' | 'alert') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    } else {
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    }
  } catch (e) {}
};

const App: React.FC = () => {
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

  const prevQueueLength = useRef(0);
  const notifiedNearCalling = useRef(false);

  const [newPassword, setNewPassword] = useState('');
  const [linkPhone, setLinkPhone] = useState('');
  const [linkEmail, setLinkEmail] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });

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

  // Monitor de Alertas
  useEffect(() => {
    if (!queue.length || !isLoggedIn) return;
    const waitingList = queue.filter(i => i.status === 'waiting');
    if (userRole === 'admin' || userRole === 'staff') {
      if (queue.length > prevQueueLength.current && prevQueueLength.current !== 0) {
        playBeep('entry');
        if (navigator.vibrate) navigator.vibrate(200);
      }
    }
    if (userRole === 'client' && userEmail) {
      const myItem = waitingList.find(i => i.userEmail === userEmail);
      const firstWaiting = waitingList[0];
      if (myItem && firstWaiting && myItem.id === firstWaiting.id) {
        if (!notifiedNearCalling.current) {
          playBeep('alert');
          if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
          notifiedNearCalling.current = true;
        }
      } else {
        notifiedNearCalling.current = false;
      }
    }
    prevQueueLength.current = queue.length;
  }, [queue, userRole, userEmail, isLoggedIn]);

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) return alert("A senha deve ter no mínimo 6 caracteres.");
    setIsUpdatingProfile(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setProfileMessage({ text: 'Senha alterada!', type: 'success' });
        setNewPassword('');
      }
    } catch (e) { alert("Sessão expirada."); } finally {
      setIsUpdatingProfile(false);
      setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleLinkPhone = async () => {
    const digits = linkPhone.replace(/\D/g, '');
    if (digits.length < 10) return alert("Informe o DDD.");
    setIsUpdatingProfile(true);
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), { phone: digits });
        setUserProfile({ ...userProfile, phone: digits });
        setProfileMessage({ text: 'Celular vinculado!', type: 'success' });
        setLinkPhone('');
      }
    } catch (e) { alert("Erro ao vincular."); } finally {
      setIsUpdatingProfile(false);
      setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
    }
  };

  // --- LÓGICA DE AUTOMAÇÃO DE STATUS ---
  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const syncAutoStatus = async (est: Establishment) => {
    if (!est.autoStatusEnabled || !est.dailySchedules) return;

    const now = new Date();
    const dayId = now.getDay();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const schedule = est.dailySchedules[dayId];

    let targetStatus: EstStatus = 'closed';

    if (schedule && schedule.isOpen) {
      const startMins = timeToMinutes(schedule.start);
      const endMins = timeToMinutes(schedule.end);

      if (currentMins >= startMins && currentMins < endMins) {
        targetStatus = 'open';
        if (schedule.hasLunch && schedule.lunchStart && schedule.lunchEnd) {
          const lStart = timeToMinutes(schedule.lunchStart);
          const lEnd = timeToMinutes(schedule.lunchEnd);
          if (currentMins >= lStart && currentMins < lEnd) {
            targetStatus = 'lunch';
          }
        }
      }
    }

    if (est.status !== targetStatus) {
      await updateDoc(doc(db, "establishments", est.id), { status: targetStatus, statusUpdatedAt: Date.now() });
    }
  };

  useEffect(() => {
    if (!currentEst?.id || !isLoggedIn) return;
    const unsubEst = onSnapshot(doc(db, "establishments", currentEst.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Establishment;
        setCurrentEst(data);
        if (userEmail && data.ownerEmail && userEmail.toLowerCase() === data.ownerEmail.toLowerCase()) setUserRole('admin');
        syncAutoStatus(data);
      }
    });
    const interval = setInterval(() => { if (currentEst) syncAutoStatus(currentEst); }, 30000);
    return () => { unsubEst(); clearInterval(interval); };
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

  const handleJoinQueue = async (data: any) => {
    if (!currentEst || !auth.currentUser) return;
    try {
      if (userRole === 'client') {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        const userData = userSnap.data() as UserProfile;
        if (userData?.activeBooking) { alert("Você já possui agendamentos."); return; }
      }
      const baseTime = Date.now();
      const allPeople = [data.mainPerson, ...(data.companions || [])];
      const createdIds = [];
      for (let i = 0; i < allPeople.length; i++) {
        const person = allPeople[i];
        const payload: any = {
          name: person.name, professionalId: data.professionalId, service: person.service, type: data.type,
          userEmail: userRole === 'client' ? userEmail : null, establishmentId: currentEst.id,
          status: 'waiting', timestamp: baseTime + (i * 10), missedCount: 0
        };
        if (data.scheduledTime) payload.scheduledTime = data.scheduledTime;
        const docRef = await addDoc(collection(db, "establishments", currentEst.id, "queue"), payload);
        createdIds.push(docRef.id);
      }
      if (userRole === 'client') {
        await setDoc(doc(db, "users", auth.currentUser.uid), { activeBooking: { establishmentId: currentEst.id, queueId: createdIds[0] } }, { merge: true });
      }
      setIsJoinModalOpen(false);
    } catch (e: any) { alert(`Erro: ${e.message}`); }
  };

  const handleFinish = (item: QueueItem) => { setSelectedQueueItem(item); setIsCompletionModalOpen(true); };

  const handleCallNext = async (specificId?: string) => {
    if (!currentEst) return;
    const myPro = professionals.find(p => p.email?.toLowerCase() === userEmail.toLowerCase());
    const myProId = myPro?.id;
    if (specificId) {
      await updateDoc(doc(db, "establishments", currentEst.id, "queue", specificId), { status: 'serving', professionalId: myProId || professionals[0]?.id, timestamp: Date.now() });
      return;
    }
    const nextItem = queue.find(i => i.status === 'waiting');
    if (nextItem) await updateDoc(doc(db, "establishments", currentEst.id, "queue", nextItem.id), { status: 'serving', professionalId: myProId || professionals[0]?.id, timestamp: Date.now() });
  };

  if (isTVMode && currentEst) return <TVView queue={queue} professionals={professionals} establishmentName={currentEst.name} onClose={() => setIsTVMode(false)} />;
  if (!isConfigured) return <div className="min-h-screen bg-[#050810] flex items-center justify-center"><Settings className="text-teal-500 animate-spin" /></div>;
  if (!isLoggedIn) return <AuthView onLogin={(email, role) => { setUserEmail(email.toLowerCase()); setUserRole(role); setIsLoggedIn(true); setActiveTab('fila'); }} />;
  if (!currentEst) return <BusinessSelect userEmail={userEmail} userRole={userRole} onSelect={setCurrentEst} onLogout={() => auth.signOut()} />;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole === 'staff' ? 'admin' : userRole} establishmentCode={currentEst.id} onBackToDashboard={() => setCurrentEst(null)} loyaltyEnabled={currentEst.loyaltyEnabled}>
      {activeTab === 'fila' && (
        <QueueView 
          queue={queue} isAdmin={userRole === 'admin'} userRole={userRole} estStatus={currentEst.status} professionals={professionals} services={services} dailySchedules={currentEst.dailySchedules}
          onCallNext={handleCallNext} onFinish={handleFinish} onOpenJoinModal={() => setIsJoinModalOpen(true)}
          onLeaveQueue={async (id) => { if(confirm("Remover da fila?")) await deleteDoc(doc(db, "establishments", currentEst.id, "queue", id)); }}
        />
      )}
      {activeTab === 'fidelidade' && <LoyaltyView cutsCount={loyaltyCount} />}
      {activeTab === 'admin' && userRole === 'admin' && (
        <AdminPanel 
          establishment={currentEst} queue={queue} services={services} professionals={professionals} estStatus={currentEst.status} bookingModel={currentEst.bookingModel || 'both'} plan={currentEst.plan || 'free'} trialStartedAt={currentEst.trialStartedAt || Date.now()} loyaltyEnabled={currentEst.loyaltyEnabled} revenue={revenue} pixKey={currentEst.pixKey || ''} 
          onUpdateEstablishment={(d) => updateDoc(doc(db, "establishments", currentEst.id), { ...d })} onDeleteEstablishment={() => deleteDoc(doc(db, "establishments", currentEst.id))} onSetPixKey={(k) => updateDoc(doc(db, "establishments", currentEst.id), { pixKey: k })} onUpdateStatus={(s) => updateDoc(doc(db, "establishments", currentEst.id), { status: s, statusUpdatedAt: Date.now() })} onSetBookingModel={(m) => updateDoc(doc(db, "establishments", currentEst.id), { bookingModel: m })} onSetLoyaltyEnabled={(e) => updateDoc(doc(db, "establishments", currentEst.id), { loyaltyEnabled: e })}
          onCallNext={() => handleCallNext()} onFinish={handleFinish} onUpdateServices={async (s) => { for(const sv of s) await setDoc(doc(db, "establishments", currentEst.id, "services", sv.id), sv, { merge: true }); }} onUpdatePros={async (p) => { for(const pr of p) await setDoc(doc(db, "establishments", currentEst.id, "professionals", pr.id), pr, { merge: true }); }} 
          onManualJoin={(d) => handleJoinQueue({ mainPerson: { name: d.name, service: d.service }, professionalId: d.professionalId, type: d.type })} onToggleTVMode={() => setIsTVMode(true)}
        />
      )}
      {activeTab === 'config' && (
        <div className="space-y-8 pb-32">
           <div className="text-center space-y-4">
             <div className="w-20 h-20 bg-slate-900 rounded-[32px] flex items-center justify-center mx-auto border border-white/5 shadow-2xl"><User className="text-teal-400" size={32} /></div>
             <div><h2 className="text-2xl font-black text-white font-orbitron uppercase tracking-tighter">MEU PERFIL</h2></div>
           </div>
           <div className="space-y-4">
              <section className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 space-y-6">
                 {profileMessage.text && <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl text-center text-[10px] font-black uppercase">{profileMessage.text}</div>}
                 <div className="space-y-4">
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="NOVA SENHA" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white outline-none focus:border-indigo-500" />
                    <button onClick={handleUpdatePassword} disabled={isUpdatingProfile} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase">Trocar Senha</button>
                 </div>
                 <div className="pt-6 border-t border-white/5 space-y-4">
                    <input type="text" value={linkPhone} onChange={e => setLinkPhone(e.target.value)} placeholder={userProfile?.phone || "DDD + CELULAR"} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white outline-none focus:border-teal-500" />
                    <button onClick={handleLinkPhone} disabled={isUpdatingProfile} className="w-full bg-slate-100 text-slate-950 py-4 rounded-2xl font-black text-[10px] uppercase">Vincular Celular</button>
                 </div>
              </section>
              <button onClick={() => auth.signOut()} className="w-full py-5 bg-red-500 text-white rounded-[32px] text-[10px] font-black uppercase shadow-xl shadow-red-500/20">Sair da Conta</button>
           </div>
        </div>
      )}
      {isJoinModalOpen && <JoinQueueModal services={services} currentQueue={queue} professionals={professionals} dailySchedules={currentEst?.dailySchedules} bookingModel={currentEst?.bookingModel || 'both'} initialName={userProfile?.name || ''} onClose={() => setIsJoinModalOpen(false)} onSubmit={handleJoinQueue} />}
      {isCompletionModalOpen && selectedQueueItem && (
        <ServiceCompletionModal 
          item={selectedQueueItem} services={services} pixKey={currentEst?.pixKey} onClose={() => setIsCompletionModalOpen(false)} 
          onConfirm={async (method, amount) => {
            if (!currentEst) return;
            await addDoc(collection(db, "establishments", currentEst.id, "revenue"), { amount, method, serviceName: selectedQueueItem.service, clientName: selectedQueueItem.name, date: new Date().toISOString(), establishmentId: currentEst.id });
            if (currentEst.loyaltyEnabled && selectedQueueItem.userEmail) {
              await setDoc(doc(db, "establishments", currentEst.id, "loyalty", selectedQueueItem.userEmail), { count: increment(1) }, { merge: true });
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
