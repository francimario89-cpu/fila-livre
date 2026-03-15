
export type ProfStatus = 'available' | 'lunch' | 'absent' | 'busy';
export type EstStatus = 'open' | 'closed' | 'lunch';
export type BookingModel = 'queue' | 'appointment' | 'both';
export type PaymentMethod = 'pix' | 'card' | 'cash';
export type PlanType = 'free' | 'pro';
export type AuthProvider = 'google' | 'phone' | 'email';

export interface DaySchedule {
  isOpen: boolean;
  start: string;
  end: string;
  hasLunch?: boolean;
  lunchStart?: string;
  lunchEnd?: string;
}

export interface Establishment {
  id: string;
  name: string;
  ownerEmail: string;
  status: EstStatus;
  statusUpdatedAt?: number; 
  bookingModel: BookingModel;
  pixKey?: string;
  openingHours?: string;
  workingDays?: number[];
  dailySchedules?: Record<number, DaySchedule>;
  plan: PlanType;
  trialStartedAt: number; 
  loyaltyEnabled: boolean;
  loyaltyReward?: string;
  autoStatusEnabled?: boolean;
  anyProfessionalEnabled?: boolean;
  anyProfessionalLabel?: string;
  nextCodeNumber?: number; // Contador para códigos sequenciais
  codePrefix?: string; // Prefixo para códigos sequenciais (ex: A, B, P)
}

export interface Professional {
  id: string;
  name: string;
  status: ProfStatus;
  establishmentId: string;
  email?: string; 
}

export interface Service {
  id: string;
  name: string;
  price: string;
  duration: number; 
  establishmentId: string;
}

export interface RevenueRecord {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  serviceName: string;
  clientName?: string;
  clientCode?: string;
  establishmentId: string;
}

export interface QueueItem {
  id: string;
  name: string;
  service: string;
  professionalId: string;
  establishmentId: string;
  status: 'waiting' | 'serving' | 'completed';
  timestamp: number;
  type: 'walk-in' | 'appointment';
  isPriority?: boolean; // Novo: Identificador de prioridade
  scheduledTime?: string; 
  userEmail?: string;
  code?: string; // Novo: Código de privacidade (ex: AB0002)
  missedCount?: number; 
  establishmentName?: string; 
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'client';
  activeBookings?: { 
    establishmentId: string;
    queueId: string;
  }[];
}
