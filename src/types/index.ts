export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  address: string;
  region: string;
  phone?: string;
}

export interface HealthData {
  id: string;
  userId: string;
  symptoms: string[];
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
  previousConditions: string[];
  medications: string[];
  createdAt: Date;
}

export interface Disease {
  id: string;
  name: string;
  relatedSymptoms: string[];
  description: string;
  recommendedActions: string[];
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  region: string;
  address: string;
  availability?: {
    day: string;
    slots: string[];
  }[];
  rating?: number;
  degrees?: string;
  experience?: number;
  verified?: boolean;
  available?: boolean;
}

export interface Appointment {
  id: string;
  userId: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reason: string;
  notes?: string;
  createdAt?: Date;
}

export interface AppointmentSlot {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  maxPatients: number;
  status: 'available' | 'booked' | 'cancelled';
}

export type SymptomCategory = {
  category: string;
  symptoms: string[];
};
