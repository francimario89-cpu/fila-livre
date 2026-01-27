
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
      {/* Círculo Principal - Subido um pouco para dar espaço ao texto */}
      <circle cx="50" cy="42" r="35" fill="none" stroke="#2DD4BF" strokeWidth="5" strokeDasharray="180 60" />
      
      {/* Linhas de Movimento */}
      <line x1="15" y1="35" x2="30" y2="35" stroke="#2DD4BF" strokeWidth="3" strokeLinecap="round" />
      <line x1="20" y1="42" x2="32" y2="42" stroke="#2DD4BF" strokeWidth="3" strokeLinecap="round" />
      <line x1="15" y1="49" x2="30" y2="49" stroke="#2DD4BF" strokeWidth="3" strokeLinecap="round" />

      {/* Letras FL Estilizadas */}
      <path 
        d="M 45 32 L 60 32 M 45 32 L 45 52 M 45 42 L 55 42 M 52 52 L 65 52" 
        fill="none" 
        stroke="#2DD4BF" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Ponteiro */}
      <path d="M 55 45 L 80 20" fill="none" stroke="#2DD4BF" strokeWidth="3" strokeLinecap="round" />
      <circle cx="55" cy="45" r="3" fill="#2DD4BF" />

      {/* TEXTO FILA NO ÍCONE */}
      <text 
        x="50" 
        y="88" 
        textAnchor="middle" 
        fill="#2DD4BF" 
        className="font-orbitron font-black" 
        style={{ fontSize: '18px', letterSpacing: '4px' }}
      >
        FILA
      </text>
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
