import { SessionStatus } from '../enums/session-status.enum';
import { SessionType } from '../enums/session-type.enum';

export class SessionAccessRecord {
  id: string;
  patientProfileId: string;
  patientId: string;
  psychologistId: string;
  scheduledAt: Date | string;
  durationMinutes: number;
  type: SessionType;
  status: SessionStatus;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}
