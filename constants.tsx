
import React from 'react';
import { 
  Users, 
  LayoutDashboard, 
  Settings, 
  Gift,
  UserCircle,
  Layers
} from 'lucide-react';

export const APP_THEME = {
  primary: '#2DD4BF', 
  secondary: '#1E293B', 
  background: '#0B0F1A', 
  accent: '#F59E0B', 
};

export const LOGO_SVG = (
  <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible drop-shadow-[0_0_12px_rgba(45,212,191,0.9)]">
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <g filter="url(#glow)">
      <circle cx="50" cy="50" r="40" fill="none" stroke="#2DD4BF" strokeWidth="6" strokeDasharray="180 60" />
      <path d="M 50 20 V 50 L 70 65" fill="none" stroke="#2DD4BF" strokeWidth="6" strokeLinecap="round" />
      <circle cx="50" cy="50" r="6" fill="#2DD4BF" />
    </g>
  </svg>
);

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  isPro?: boolean;
  roles: ('admin' | 'client' | 'staff')[];
}

export const NAVIGATION_ITEMS: NavItem[] = [
  { id: 'fila', label: 'FILA', icon: <Users size={20} />, roles: ['admin', 'client', 'staff'] },
  { id: 'fidelidade', label: 'VIP', icon: <Gift size={20} />, roles: ['admin', 'client', 'staff'] },
  { id: 'admin', label: 'GESTÃO', icon: <LayoutDashboard size={20} />, roles: ['admin'] },
  { id: 'config', label: 'PERFIL', icon: <UserCircle size={20} />, roles: ['admin', 'client', 'staff'] },
];
