export type SessionType = 'ONLINE' | 'IN_PERSON';
export type SessionStatus = 'SCHEDULED' | 'DONE' | 'CANCELED';

export type Session = {
  id: string;
  patientProfileId: string;
  patientId: string;
  psychologistId: string;
  scheduledAt: string;
  durationMinutes: number;
  type: SessionType;
  status: SessionStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SessionsListResponse = {
  past: Session[];
  future: Session[];
};
