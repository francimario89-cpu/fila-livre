
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
      <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <g filter="url(#neon-glow)">
      {/* Círculo Principal */}
      <circle cx="50" cy="50" r="40" fill="none" stroke="#2DD4BF" strokeWidth="5" strokeDasharray="180 60" />
      
      {/* Linhas de Movimento (Esquerda) */}
      <line x1="15" y1="40" x2="35" y2="40" stroke="#2DD4BF" strokeWidth="3" strokeLinecap="round" />
      <line x1="20" y1="50" x2="35" y2="50" stroke="#2DD4BF" strokeWidth="3" strokeLinecap="round" />
      <line x1="15" y1="60" x2="35" y2="60" stroke="#2DD4BF" strokeWidth="3" strokeLinecap="round" />

      {/* Letras FL Estilizadas */}
      <path 
        d="M 45 35 L 65 35 M 45 35 L 45 65 M 45 50 L 60 50 M 55 65 L 75 65" 
        fill="none" 
        stroke="#2DD4BF" 
        strokeWidth="7" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Ponteiro de Velocidade */}
      <path d="M 55 55 L 85 25" fill="none" stroke="#2DD4BF" strokeWidth="4" strokeLinecap="round" />
      <circle cx="55" cy="55" r="4" fill="#2DD4BF" />
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
  { id: 'fidelidade', label: 'VIP', icon: <Gift size={20} />, roles: ['client'] },
  { id: 'admin', label: 'GESTÃO', icon: <LayoutDashboard size={20} />, roles: ['admin'] },
  { id: 'config', label: 'PERFIL', icon: <UserCircle size={20} />, roles: ['admin', 'client', 'staff'] },
];
