
import React, { useState } from 'react';
import { NAVIGATION_ITEMS } from '../constants';
import { Bell, Building2, User, MapPin, LayoutGrid, Wifi, Zap, ListOrdered, ChevronUp } from 'lucide-react';
import { QueueItem } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notificationsCount?: number;
  userRole: 'admin' | 'client' | 'staff';
  establishmentCode: string;
  establishmentName?: string;
  loyaltyEnabled: boolean;
  onBackToDashboard: () => void;
  onClearNotifications?: () => void;
  userActiveQueues?: QueueItem[];
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, notificationsCount = 0, userRole, establishmentCode, establishmentName, loyaltyEnabled, onBackToDashboard, onClearNotifications, userActiveQueues = []
}) => {
  const [isStatusExpanded, setIsStatusExpanded] = useState(false);
  const filteredNav = NAVIGATION_ITEMS.filter(item => {
    if (item.id === 'fidelidade' && !loyaltyEnabled) return false;
    return item.roles.includes(userRole as any);
  });

  const mainActiveQueue = userActiveQueues.sort((a,b) => a.timestamp - b.timestamp)[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#050810] text-white">
      <header className="p-4 flex items-center justify-between sticky top-0 z-50 glass-card border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={onBackToDashboard} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-teal-400 hover:bg-slate-800 transition-colors">
            <LayoutGrid size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[10px] font-black font-orbitron tracking-tighter neon-text leading-none uppercase max-w-[150px] truncate">
                {establishmentName || 'FILA LIVRE'}
              </h1>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900 border border-white/5">
                <Wifi size={8} className="text-emerald-500" />
                <span className="text-[6px] font-black uppercase tracking-tighter text-slate-500">Online</span>
              </div>
            </div>
            <p className="text-[7px] text-slate-500 font-black tracking-widest uppercase mt-0.5">
              ID: {establishmentCode}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl p-[1.5px] shadow-lg ${
            userRole === 'admin' ? 'bg-indigo-600' : 'bg-teal-600'
          }`}>
            <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center">
              {userRole === 'admin' ? <Building2 size={14} className="text-indigo-400" /> : <User size={14} className="text-teal-400" />}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-40 overflow-y-auto px-4 py-8 max-w-2xl mx-auto w-full animate-in fade-in duration-500">
        {children}
      </main>

      {/* INDICADOR FLUTUANTE DE STATUS */}
      {mainActiveQueue && userRole === 'client' && (
        <div className="fixed bottom-24 right-4 z-[60] flex flex-col items-end gap-3 pointer-events-none">
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-3 border border-teal-500/30">
            <div className="flex flex-col items-end">
              <span className="text-[7px] font-black uppercase tracking-widest text-teal-400">Status da sua Fila</span>
              <span className="text-xs font-black uppercase tracking-tight">{mainActiveQueue.establishmentName || 'Loja Atual'}</span>
            </div>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-inner ${mainActiveQueue.status === 'serving' ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-teal-400'}`}>
               {mainActiveQueue.status === 'serving' ? <Zap size={18} className="animate-pulse" /> : <ListOrdered size={18} />}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-lg z-50">
        <div className="glass-card rounded-[32px] flex items-center justify-between p-2 shadow-2xl border border-white/10">
          {filteredNav.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1.5 flex-1 py-3 rounded-[24px] transition-all duration-400 ${
                  isActive 
                    ? userRole === 'admin' ? 'bg-indigo-600 text-white' : 'bg-teal-500 text-slate-950' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {item.icon}
                <span className="text-[8px] font-black tracking-widest font-orbitron uppercase">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
