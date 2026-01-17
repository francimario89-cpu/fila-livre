
import React, { useState, useEffect, useRef } from 'react';
import { db, auth, isConfigured } from './services/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, orderBy, setDoc, getDoc, where, getDocs, writeBatch, increment } from 'firebase/firestore';
import { onAuthStateChanged, updatePassword } from 'firebase/auth';
import { Settings, RefreshCw, LogOut, Trash2, Scissors, UserCheck, ArrowRight, Coffee, UserX, CheckCircle2, Lock, Phone, ShieldCheck, Loader2, Mail, User, BellRing, Sparkles, X, UserCog, Power, CheckCircle, DoorClosed, Zap } from 'lucide-react';
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

const playBeep = (type: 'entry' | 'alert' | 'available') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (type === 'alert') {
      // Som Dinâmico: Dois bips em frequência crescente
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
      playTone(440, 0, 0.2); // Nota Lá (grave)
      playTone(880, 0.25, 0.3); // Nota Lá (agudo)
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
  const [availabilityAlert, setAvailabilityAlert] = useState<string | null>(null);

  const prevQueueLength = useRef(0);
  const prevProStatuses = useRef<Record<string, ProfStatus>>({});
  const notifiedNearCalling = useRef(false);

  const [newPassword, setNewPassword] = useState('');
  const [linkPhone, setLinkPhone] = useState('');
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
      const servingProIds = queue
        .filter(item => item.status === 'serving')
        .map(item => item.professionalId);

      professionals.forEach(pro => {
        const prevStatus = prevProStatuses.current[pro.id];
        const isTrulyAvailable = pro.status === 'available' && !servingProIds.includes(pro.id);
        const wasTrulyAvailable = prevStatus === 'available';

        if (isTrulyAvailable && !wasTrulyAvailable) {
          setAvailabilityAlert(`Cadeira do(a) ${pro.name} disponível!`);
          playBeep('available');
          setTimeout(() => setAvailabilityAlert(null), 8000);
        }
        prevProStatuses.current[pro.id] = pro.status;
      });

      const waitingList = queue.filter(i => i.status === 'waiting');
      const myItem = waitingList.find(i => i.userEmail === userEmail);
      const firstWaiting = waitingList[0];
      
      // ALERTA DINÂMICO DE PRÓXIMO DA FILA
      if (myItem && firstWaiting && myItem.id === firstWaiting.id) {
        if (!notifiedNearCalling.current) {
          playBeep('alert');
          if (navigator.vibrate) {
            // Padrão de vibração dinâmico: vibra, para, vibra
            navigator.vibrate([200, 100, 200]);
          }
          notifiedNearCalling.current = true;
        }
      } else {
        notifiedNearCalling.current = false;
      }
    }
  }, [queue, professionals, userRole, userEmail, isLoggedIn, currentEst]);

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) return alert("A senha deve ter no mínimo 6 caracteres.");
    setIsUpdatingProfile(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setProfileMessage({ text: 'Senha alterada com sucesso!', type: 'success' });
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
        setProfileMessage({ text: 'Celular vinculado com sucesso!', type: 'success' });
        setLinkPhone('');
      }
    } catch (e) { alert("Erro ao vincular celular."); } finally {
      setIsUpdatingProfile(false);
      setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
    }
  };

  const handleUpdateSelfStatus = async (newStatus: ProfStatus) => {
    if (!currentEst) return;
    const myProRecord = professionals.find(p => p.email?.toLowerCase() === userEmail.toLowerCase());
    if (myProRecord) {
      try {
        await updateDoc(doc(db, "establishments", currentEst.id, "professionals", myProRecord.id), { status: newStatus });
        setProfileMessage({ text: 'Seu status foi atualizado!', type: 'success' });
        setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
      } catch (e) {
        alert("Erro ao atualizar status.");
      }
    }
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

  const handleNoShow = async (id: string) => {
    if (!currentEst) return;
    const item = queue.find(i => i.id === id);
    if (!item) return;

    const newMissedCount = (item.missedCount || 0) + 1;
    const itemRef = doc(db, "establishments", currentEst.id, "queue", id);

    if (newMissedCount >= 3) {
      if(confirm("Cliente faltou 3 vezes. Será removido automaticamente. Confirmar?")) {
        await deleteDoc(itemRef);
        if (item.userEmail) {
          const q = query(collection(db, "users"), where("email", "==", item.userEmail));
          const userSnap = await getDocs(q);
          if (!userSnap.empty) await updateDoc(doc(db, "users", userSnap.docs[0].id), { activeBooking: null });
        }
      }
      return;
    }

    let newTimestamp = item.timestamp;
    const waitingList = queue.filter(i => i.status === 'waiting' && i.id !== id);

    if (newMissedCount === 1) {
      if (waitingList.length > 0) newTimestamp = waitingList[0].timestamp + 1;
      alert("1ª Falta: Movido para o 2º lugar da fila.");
    } else if (newMissedCount === 2) {
      newTimestamp = Date.now();
      alert("2ª Falta: Movido para o final da fila.");
    }

    await updateDoc(itemRef, { 
      missedCount: newMissedCount, 
      timestamp: newTimestamp,
      status: 'waiting'
    });
  };

  const handleCallNext = async (specificId?: string) => {
    if (!currentEst) return;
    const myPro = professionals.find(p => p.email?.toLowerCase() === userEmail.toLowerCase());
    const myProId = myPro?.id;
    
    if (specificId) {
      const item = queue.find(i => i.id === specificId);
      const targetProId = item?.professionalId !== 'any' ? item?.professionalId : (myProId || professionals[0]?.id);
      
      if (targetProId && currentEst.autoStatusEnabled) {
         await updateDoc(doc(db, "establishments", currentEst.id, "professionals", targetProId), { status: 'busy' });
      }

      await updateDoc(doc(db, "establishments", currentEst.id, "queue", specificId), { status: 'serving', professionalId: targetProId, timestamp: Date.now() });
      return;
    }

    const nextItem = queue.find(i => i.status === 'waiting');
    if (nextItem) {
      const targetProId = nextItem.professionalId !== 'any' ? nextItem.professionalId : (myProId || professionals[0]?.id);
      
      if (targetProId && currentEst.autoStatusEnabled) {
         await updateDoc(doc(db, "establishments", currentEst.id, "professionals", targetProId), { status: 'busy' });
      }

      await updateDoc(doc(db, "establishments", currentEst.id, "queue", nextItem.id), { status: 'serving', professionalId: targetProId, timestamp: Date.now() });
    }
  };

  const handleUpdateProfessional = async (itemId: string, proId: string) => {
    if (!currentEst) return;
    try {
      await updateDoc(doc(db, "establishments", currentEst.id, "queue", itemId), { professionalId: proId });
    } catch (e: any) { alert("Erro ao trocar de profissional."); }
  };

  const handleUpdateAccessCode = async (newCode: string): Promise<boolean> => {
    if (!currentEst) return false;
    const cleanCode = newCode.trim().toUpperCase();
    if (cleanCode === currentEst.id) return true;

    try {
      const newDocRef = doc(db, "establishments", cleanCode);
      const newDocSnap = await getDoc(newDocRef);
      if (newDocSnap.exists()) {
        alert("Este código de acesso já está em uso.");
        return false;
      }
      if (!confirm(`Confirmar mudança de código para ${cleanCode}?`)) return false;
      const batch = writeBatch(db);
      const oldDocRef = doc(db, "establishments", currentEst.id);
      batch.set(newDocRef, { ...currentEst, id: cleanCode });
      const subCollections = ['services', 'professionals', 'queue', 'revenue', 'loyalty'];
      for (const sub of subCollections) {
        const subSnap = await getDocs(collection(db, "establishments", currentEst.id, sub));
        subSnap.docs.forEach(subDoc => {
          batch.set(doc(db, "establishments", cleanCode, sub, subDoc.id), subDoc.data());
          batch.delete(doc(db, "establishments", currentEst.id, sub, subDoc.id));
        });
      }
      batch.delete(oldDocRef);
      await batch.commit();
      setCurrentEst({ ...currentEst, id: cleanCode });
      alert("Código atualizado!");
      return true;
    } catch (e: any) { alert("Erro: " + e.message); return false; }
  };

  const myProRecord = professionals.find(p => p.email?.toLowerCase() === userEmail.toLowerCase());
  const myProId = myProRecord?.id;

  if (isTVMode && currentEst) return <TVView queue={queue} professionals={professionals} establishmentName={currentEst.name} onClose={() => setIsTVMode(false)} />;
  if (!isConfigured) return <div className="min-h-screen bg-[#050810] flex items-center justify-center"><Settings className="text-teal-500 animate-spin" /></div>;
  if (!isLoggedIn) return <AuthView onLogin={(email, role) => { setUserEmail(email.toLowerCase()); setUserRole(role); setIsLoggedIn(true); setActiveTab('fila'); }} />;
  if (!currentEst) return <BusinessSelect userEmail={userEmail} userRole={userRole} onSelect={setCurrentEst} onLogout={() => auth.signOut()} />;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole === 'staff' ? 'admin' : userRole} establishmentCode={currentEst.id} onBackToDashboard={() => setCurrentEst(null)} loyaltyEnabled={currentEst.loyaltyEnabled}>
      {activeTab === 'fila' && (
        <QueueView 
          queue={queue} isAdmin={userRole === 'admin'} isStaff={userRole === 'staff'} userRole={userRole} myProId={myProId} currentUserEmail={userEmail} estStatus={currentEst.status} professionals={professionals} services={services} dailySchedules={currentEst.dailySchedules} pixKey={currentEst.pixKey}
          onCallNext={handleCallNext} onFinish={handleFinish} onNoShow={handleNoShow} onOpenJoinModal={() => setIsJoinModalOpen(true)}
          onLeaveQueue={async (id) => { 
            if(confirm("Remover da fila?")) {
              await deleteDoc(doc(db, "establishments", currentEst.id, "queue", id));
              if (userRole === 'client' && auth.currentUser) await updateDoc(doc(db, "users", auth.currentUser.uid), { activeBooking: null });
            }
          }}
          onUpdateProfessional={handleUpdateProfessional}
        />
      )}
      {activeTab === 'fidelidade' && <LoyaltyView cutsCount={loyaltyCount} reward={currentEst.loyaltyReward} />}
      {activeTab === 'admin' && userRole === 'admin' && (
        <AdminPanel 
          establishment={currentEst} queue={queue} services={services} professionals={professionals} estStatus={currentEst.status} bookingModel={currentEst.bookingModel || 'both'} plan={currentEst.plan || 'free'} trialStartedAt={currentEst.trialStartedAt || Date.now()} loyaltyEnabled={currentEst.loyaltyEnabled} revenue={revenue} pixKey={currentEst.pixKey || ''} 
          onUpdateEstablishment={(d) => updateDoc(doc(db, "establishments", currentEst.id), { ...d })} onDeleteEstablishment={() => deleteDoc(doc(db, "establishments", currentEst.id))} onUpdateAccessCode={handleUpdateAccessCode} onSetPixKey={(k) => updateDoc(doc(db, "establishments", currentEst.id), { pixKey: k })} onUpdateStatus={(s) => updateDoc(doc(db, "establishments", currentEst.id), { status: s, statusUpdatedAt: Date.now() })} onSetBookingModel={(m) => updateDoc(doc(db, "establishments", currentEst.id), { bookingModel: m })} onSetLoyaltyEnabled={(e) => updateDoc(doc(db, "establishments", currentEst.id), { loyaltyEnabled: e })}
          onCallNext={() => handleCallNext()} onFinish={handleFinish} onNoShow={handleNoShow} onUpdateServices={async (s) => { for(const sv of s) await setDoc(doc(db, "establishments", currentEst.id, "services", sv.id), sv, { merge: true }); }} onUpdatePros={async (p) => { for(const pr of p) await setDoc(doc(db, "establishments", currentEst.id, "professionals", pr.id), pr, { merge: true }); }} 
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
              {profileMessage.text && <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl text-center text-[10px] font-black uppercase animate-in slide-in-from-top-2">{profileMessage.text}</div>}
              
              {userRole === 'staff' && myProRecord && (
                <section className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 space-y-4 shadow-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Power size={18} className="text-amber-500" />
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meu Status</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleUpdateSelfStatus('available')} className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all ${myProRecord.status === 'available' ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                      <CheckCircle size={18} />
                      <span className="text-[8px] font-black uppercase">Livre</span>
                    </button>
                    <button onClick={() => handleUpdateSelfStatus('lunch')} className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all ${myProRecord.status === 'lunch' ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                      <Coffee size={18} />
                      <span className="text-[8px] font-black uppercase">Pausa</span>
                    </button>
                    <button onClick={() => handleUpdateSelfStatus('absent')} className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all ${myProRecord.status === 'absent' ? 'bg-red-500 border-red-400 text-slate-950 shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                      <DoorClosed size={18} />
                      <span className="text-[8px] font-black uppercase">Fora</span>
                    </button>
                  </div>
                </section>
              )}

              <section className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha de Acesso</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white outline-none focus:border-indigo-500" /></div>
                    <button onClick={handleUpdatePassword} disabled={isUpdatingProfile} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase">Trocar Senha</button>
                 </div>
                 <div className="pt-6 border-t border-white/5 space-y-4">
                    <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Celular</label><input type="text" value={linkPhone} onChange={e => setLinkPhone(e.target.value)} placeholder={userProfile?.phone || "DDD + CELULAR"} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white outline-none focus:border-teal-500" /></div>
                    <button onClick={handleLinkPhone} disabled={isUpdatingProfile} className="w-full bg-slate-100 text-slate-950 py-4 rounded-2xl font-black text-[10px] uppercase">Salvar Celular</button>
                 </div>
              </section>
              <button onClick={() => auth.signOut()} className="w-full py-5 bg-red-500 text-white rounded-[32px] text-[10px] font-black uppercase shadow-xl">Sair da Conta</button>
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
            if (currentEst.loyaltyEnabled && selectedQueueItem.userEmail) await setDoc(doc(db, "establishments", currentEst.id, "loyalty", selectedQueueItem.userEmail), { count: increment(1) }, { merge: true });
            
            const myPro = professionals.find(p => p.email?.toLowerCase() === userEmail.toLowerCase());
            if (myPro && currentEst.autoStatusEnabled) {
               await updateDoc(doc(db, "establishments", currentEst.id, "professionals", myPro.id), { status: 'available' });
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
