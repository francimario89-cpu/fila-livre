
export type ProfStatus = 'available' | 'lunch' | 'absent' | 'busy';
export type EstStatus = 'open' | 'closed' | 'lunch';
export type BookingModel = 'queue' | 'appointment' | 'both';
export type PaymentMethod = 'pix' | 'card' | 'cash';
export type PlanType = 'free' | 'pro';
export type AuthProvider = 'google' | 'phone' | 'email';

export interface DaySchedule {
  isOpen: boolean;
  start: string; // "08:00"
  end: string;   // "18:00"
  hasLunch?: boolean;
  lunchStart?: string; // "12:00"
  lunchEnd?: string;   // "13:00"
}

export interface Establishment {
  id: string;
  name: string;
  ownerEmail: string;
  status: EstStatus;
  statusUpdatedAt?: number; // Timestamp da última alteração de status
  bookingModel: BookingModel;
  pixKey?: string;
  openingHours?: string;
  workingDays?: number[]; // [0,1,2,3,4,5,6] onde 0 é domingo
  dailySchedules?: Record<number, DaySchedule>;
  plan: PlanType;
  trialStartedAt: number; 
  loyaltyEnabled: boolean; 
}

export interface Professional {
  id: string;
  name: string;
  status: ProfStatus;
  establishmentId: string;
  email?: string; // Vinculado para login de colaborador
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
  scheduledTime?: string; 
  userEmail?: string;
  missedCount?: number; // Contador de faltas
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'client';
  activeBooking?: {
    establishmentId: string;
    queueId: string;
  } | null;
}
