
import React, { useState, useEffect } from 'react';
import { NAVIGATION_ITEMS } from '../constants';
import { Bell, Building2, User, MapPin, LayoutGrid, Wifi, WifiOff, Database, Download } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notificationsCount?: number;
  userRole: 'admin' | 'client';
  establishmentCode: string;
  isLocalMode?: boolean;
  onBackToDashboard: () => void;
  onClearNotifications?: () => void;
  loyaltyEnabled?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  notificationsCount = 0, 
  userRole,
  establishmentCode,
  isLocalMode = false,
  onBackToDashboard,
  onClearNotifications,
  loyaltyEnabled = true
}) => {
  const filteredNav = NAVIGATION_ITEMS.filter(item => {
    const roleMatch = item.roles.includes(userRole);
    if (item.id === 'fidelidade' && !loyaltyEnabled) return false;
    return roleMatch;
  });

  const [syncStatus, setSyncStatus] = useState<'syncing' | 'online'>('online');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (!isStandalone) {
      const timer = setTimeout(() => setShowInstallPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (isLocalMode) return;
    const interval = setInterval(() => {
      setSyncStatus('syncing');
      setTimeout(() => setSyncStatus('online'), 800);
    }, 10000);
    return () => clearInterval(interval);
  }, [isLocalMode]);

  return (
    <div className="min-h-screen flex flex-col bg-[#050810] text-white overflow-hidden">
      <header className="px-4 py-4 pt-[env(safe-area-inset-top,1rem)] flex items-center justify-between sticky top-0 z-50 glass-card border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={onBackToDashboard} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-teal-400">
            <LayoutGrid size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-black font-orbitron tracking-tighter text-white uppercase">FILA LIVRE</h1>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-950 border border-white/5">
                {isLocalMode ? (
                  <><Database size={8} className="text-amber-500" /><span className="text-[6px] font-black uppercase text-amber-500/70">Local</span></>
                ) : (
                  <><Wifi size={8} className={syncStatus === 'syncing' ? 'text-amber-500' : 'text-emerald-500'} /><span className="text-[6px] font-black uppercase text-slate-500">Cloud</span></>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={onClearNotifications} className="relative p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
            <Bell size={18} />
            {notificationsCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-[#050810]">{notificationsCount}</span>}
          </button>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-slate-950 border ${userRole === 'admin' ? 'border-indigo-500/30' : 'border-teal-500/30'}`}>
            {userRole === 'admin' ? <Building2 size={14} className="text-indigo-400" /> : <User size={14} className="text-teal-400" />}
          </div>
        </div>
      </header>

      {showInstallPrompt && (
        <div className="mx-4 mt-4 bg-indigo-600 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top-4 duration-500 z-[100] shadow-2xl">
          <div className="flex items-center gap-3">
            <Download size={20} className="text-white" />
            <p className="text-[10px] font-black uppercase tracking-tight">Instale no seu Celular</p>
          </div>
          <button onClick={() => setShowInstallPrompt(false)} className="text-[9px] bg-white/20 px-3 py-1.5 rounded-lg font-black uppercase">Fechar</button>
        </div>
      )}

      <main className="flex-1 pb-32 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[env(safe-area-inset-bottom,1.5rem)] pt-2 bg-gradient-to-t from-[#050810] to-transparent">
        <div className="glass-card rounded-full flex items-center justify-between p-1.5 shadow-2xl border border-white/10 max-w-lg mx-auto">
          {filteredNav.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 flex-1 py-3 rounded-full transition-all ${
                  isActive 
                    ? userRole === 'admin' ? 'bg-indigo-600 text-white' : 'bg-teal-500 text-slate-950' 
                    : 'text-slate-500'
                }`}
              >
                {item.icon}
                <span className="text-[7px] font-black font-orbitron uppercase">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
