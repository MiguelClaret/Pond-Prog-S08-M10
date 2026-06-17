import { SessionType } from '../enums/session-type.enum';

export class CreateSessionInput {
  patientProfileId: string;
  scheduledAt: string;
  durationMinutes: number;
  type: SessionType;
  notes: string | null;
}
