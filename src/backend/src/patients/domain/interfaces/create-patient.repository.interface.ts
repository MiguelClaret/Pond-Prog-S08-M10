import { UserEntity } from 'src/auth/domain/entities/user.entity';
import { CreatePatientInput } from '../entities/create-patient-input.entity';
import { CreatedPatientResponseEntity } from '../entities/created-patient-response.entity';
import { ExistingPatientUserRecord } from '../entities/existing-patient-user-record.entity';

export abstract class ICreatePatientRepository {
  abstract findUserByEmail(email: string): Promise<ExistingPatientUserRecord | null>;
  abstract findPatientsByPsychologistEmail(psychologistEmail: string): Promise<UserEntity[]>;
  abstract create(createPatientInput: CreatePatientInput): Promise<CreatedPatientResponseEntity>;
}
