
export type ProfStatus = 'available' | 'lunch' | 'absent' | 'busy';
export type EstStatus = 'open' | 'closed' | 'lunch';
export type BookingModel = 'queue' | 'appointment' | 'both';
export type PaymentMethod = 'pix' | 'card' | 'cash';
export type PlanType = 'free' | 'pro';
export type AuthProvider = 'google' | 'phone' | 'email';

export interface Establishment {
  id: string;
  name: string;
  ownerEmail: string;
  status: EstStatus;
  bookingModel: BookingModel;
  pixKey?: string;
  openingHours?: string;
  plan: PlanType;
  trialStartedAt: number; 
  loyaltyEnabled: boolean; 
}

export interface Professional {
  id: string;
  name: string;
  status: ProfStatus;
  establishmentId: string;
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

export interface ServiceRating {
  id: string;
  timestamp: number;
  rating: number; // 1 a 5
  comment: string;
  serviceName: string;
  clientName: string;
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
  userEmail?: string; // Para identificar dono do registro
}

export interface UserProfile {
  email: string;
  name: string;
  photoURL?: string;
  phoneNumber?: string;
  provider: AuthProvider;
  joinedCodes: string[]; 
  role: 'admin' | 'client';
}
