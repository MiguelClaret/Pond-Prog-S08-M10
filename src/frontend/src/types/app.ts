export type Screen =
  | 'login'
  | 'register'
  | 'first-access'
  | 'p-home'
  | 'p-diary-create'
  | 'p-diary-list'
  | 'p-diary-detail'
  | 'p-sessions'
  | 'p-profile'
  | 'psy-home'
  | 'psy-patients'
  | 'psy-patient-register'
  | 'psy-patient-confirm'
  | 'psy-patient-detail'
  | 'psy-session-create'
  | 'psy-session-detail';

export type Flow = 'patient' | 'psychologist';

export type Mood = {
  id: string;
  label: string;
  emoji: string;
  color: string;
};

export type Diary = {
  id: string;
  title: string;
  text: string;
  mood: string;
  intensity: number;
  isShared: boolean;
  weather: { temp: number | null; desc: string | null };
  audioUrl?: string | null;
  createdAt: string;
};

export type PatientSession = {
  id: string;
  patientId?: string;
  patientName?: string;
  patientInitials?: string;
  date: string;
  type: 'ONLINE' | 'IN_PERSON';
  status: 'SCHEDULED' | 'DONE' | 'CANCELED';
  psych?: string | null;
  notes: string;
  durationMinutes?: number;
};

export type Patient = {
  id: string;
  patientId: string;
  patientProfileId?: string;
  name: string;
  initials: string;
  email: string;
  phone?: string | null;
  nextSession: string | null;
  provisionalPassword?: string;
};
