
import React, { useState, useEffect } from 'react';
import { NAVIGATION_ITEMS } from '../constants';
import { Bell, Building2, User, MapPin, LayoutGrid, Wifi } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notificationsCount?: number;
  userRole: 'admin' | 'client';
  establishmentCode: string;
  loyaltyEnabled: boolean;
  onBackToDashboard: () => void;
  onClearNotifications?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, notificationsCount = 0, userRole, establishmentCode, loyaltyEnabled, onBackToDashboard, onClearNotifications
}) => {
  const filteredNav = NAVIGATION_ITEMS.filter(item => {
    const roleAllowed = item.roles.includes(userRole);
    if (item.id === 'fidelidade' && !loyaltyEnabled) return false;
    return roleAllowed;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#050810] text-white">
      <header className="p-4 flex items-center justify-between sticky top-0 z-50 glass-card border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={onBackToDashboard} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-teal-400"><LayoutGrid size={20} /></button>
          <div>
            <h1 className="text-xs font-black font-orbitron tracking-tighter neon-text leading-none uppercase">FILA LIVRE</h1>
            <p className="text-[8px] text-slate-500 font-black tracking-widest uppercase mt-1">ID: <span className="text-white font-mono">{establishmentCode}</span></p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={onClearNotifications} className="relative p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
            <Bell size={18} />
            {notificationsCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#050810] animate-bounce">{notificationsCount}</span>}
          </button>
          <div className={`w-9 h-9 rounded-xl p-[1.5px] ${userRole === 'admin' ? 'bg-indigo-600' : 'bg-teal-600'}`}>
            <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center">
              {userRole === 'admin' ? <Building2 size={14} className="text-indigo-400" /> : <User size={14} className="text-teal-400" />}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-32 overflow-y-auto px-4 py-8 max-w-2xl mx-auto w-full animate-in fade-in duration-500">
        {children}
      </main>

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
                    : 'text-slate-500'
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
