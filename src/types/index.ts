
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
  doctor_id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  maxPatients: number;
  status: 'available' | 'booked' | 'cancelled';
  patient_name?: string;
  reason?: string;
  user_id?: string;
}

export interface UnifiedAppointment {
  id: string;
  date: string;
  time: string;
  patientName: string;
  reason: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'available' | 'booked';
  notes?: string;
  type: 'direct' | 'slot';
  userId?: string;
  doctorId?: string;
  doctorName?: string;
  startTime?: string;
  endTime?: string;
}

export type SymptomCategory = {
  category: string;
  symptoms: string[];
};

export interface AnalysisCondition {
  name: string;
  description: string;
  matchedSymptoms: string[];
  matchScore: number;
  recommendedActions: string[];
  seekMedicalAttention?: string;
  visualDiagnosticFeatures?: string[]; // Visual features identified in photos
  photoAnalysisMethod?: string; // Description of the photo analysis method used
  medicalHistoryRelevance?: string; // How this condition relates to patient's medical history
  medicationConsiderations?: string; // Drug interactions or medication-related factors
}
