import { SessionType } from '../enums/session-type.enum';

export class UpdateSessionInput {
  scheduledAt?: string;
  durationMinutes?: number;
  type?: SessionType;
  notes?: string | null;
}
