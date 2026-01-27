
import React from 'react';
import { 
  Users, 
  LayoutDashboard, 
  Settings, 
  Gift,
  UserCircle
} from 'lucide-react';

export const APP_THEME = {
  primary: '#2DD4BF', 
  secondary: '#1E293B', 
  background: '#0B0F1A', 
  accent: '#F59E0B', 
};

export const LOGO_SVG = (
  <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]">
    <circle cx="50" cy="40" r="30" fill="none" stroke="#2DD4BF" strokeWidth="6" strokeDasharray="160 40" />
    <path d="M 40 32 L 60 32 M 40 32 L 40 50 M 40 40 L 55 40" fill="none" stroke="#2DD4BF" strokeWidth="6" strokeLinecap="round" />
    <text x="50" y="90" textAnchor="middle" fill="#2DD4BF" className="font-orbitron font-black" style={{ fontSize: '22px', letterSpacing: '2px' }}>FILA</text>
  </svg>
);

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles: ('admin' | 'client' | 'staff')[];
}

export const NAVIGATION_ITEMS: NavItem[] = [
  { id: 'fila', label: 'FILA', icon: <Users size={20} />, roles: ['admin', 'client', 'staff'] },
  { id: 'fidelidade', label: 'VIP', icon: <Gift size={20} />, roles: ['client'] },
  { id: 'admin', label: 'GESTÃO', icon: <LayoutDashboard size={20} />, roles: ['admin'] },
  { id: 'config', label: 'PERFIL', icon: <UserCircle size={20} />, roles: ['admin', 'client', 'staff'] },
];
