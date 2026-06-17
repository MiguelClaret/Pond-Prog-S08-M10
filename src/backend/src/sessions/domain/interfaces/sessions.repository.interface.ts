import { SessionStatus } from '../enums/session-status.enum';
import { CreateSessionInput } from '../entities/create-session-input.entity';
import { SessionAccessRecord } from '../entities/session-access-record.entity';
import { SessionEntity } from '../entities/session.entity';
import { UpdateSessionInput } from '../entities/update-session-input.entity';

export abstract class ISessionsRepository {
  abstract findPatientProfileIdByPatientAndPsychologist(
    patientId: string,
    psychologistId: string,
  ): Promise<string | null>;
  abstract create(createSessionInput: CreateSessionInput): Promise<SessionEntity>;
  abstract findRecentAndUpcomingByPsychologistId(psychologistId: string): Promise<SessionEntity[]>;
  abstract findRecentAndUpcomingByPatientUserId(patientUserId: string): Promise<SessionEntity[]>;
  abstract findAccessibleById(id: string): Promise<SessionAccessRecord | null>;
  abstract update(id: string, updateSessionInput: UpdateSessionInput): Promise<SessionEntity>;
  abstract updateStatus(
    id: string,
    status: SessionStatus,
    notes?: string | null,
  ): Promise<SessionEntity>;
}
