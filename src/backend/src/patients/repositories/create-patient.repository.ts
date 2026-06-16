import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infra/database/database.service';
import { Role } from '../../auth/domain/enums/role.enum';
import { CreatedPatientResponseEntity } from '../domain/entities/created-patient-response.entity';
import { CreatePatientInput } from '../domain/entities/create-patient-input.entity';
import { ExistingPatientUserRecord } from '../domain/entities/existing-patient-user-record.entity';
import { ICreatePatientRepository } from '../domain/interfaces/create-patient.repository.interface';
import { UserEntity } from 'src/auth/domain/entities/user.entity';

type CreatedUserRecord = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  firstAccess: boolean;
  createdAt: Date;
};

type CreatedPatientProfileRecord = {
  patientProfileId: string;
};

@Injectable()
export class CreatePatientRepository implements ICreatePatientRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findUserByEmail(email: string): Promise<ExistingPatientUserRecord | null> {
    const result = await this.databaseService.query<ExistingPatientUserRecord>(
      `
        SELECT id, email
        FROM users
        WHERE email = $1
        LIMIT 1
      `,
      [email],
    );

    return result.rows[0] ?? null;
  }

  async findPatientsByPsychologistEmail(psychologistEmail: string): Promise<UserEntity[]> {
    const result = await this.databaseService.query<UserEntity>(
      `
        SELECT
          u.id,
          u.name AS "fullName",
          u.email,
          u.role,
          u.created_at AS "createdAt"
        FROM users u
        JOIN patient_profiles pp ON pp.patient_user_id = u.id
        JOIN users psychologist ON psychologist.id = pp.psychologist_id
        WHERE psychologist.email = $1
      `,
      [psychologistEmail],
    );

    return result.rows;
  }

  async create(createPatientInput: CreatePatientInput): Promise<CreatedPatientResponseEntity> {
    return await this.databaseService.transaction(async (query) => {
      const createdUser = await query<CreatedUserRecord>(
        `
          INSERT INTO users (name, email, password_hash, role, first_access)
          VALUES ($1, $2, $3, $4::user_role, $5)
          RETURNING
            id,
            name AS "fullName",
            email,
            role,
            first_access AS "firstAccess",
            created_at AS "createdAt"
        `,
        [
          createPatientInput.fullName,
          createPatientInput.email,
          createPatientInput.passwordHash,
          Role.PATIENT,
          true,
        ],
      );

      const patientUser = createdUser.rows[0];

      const createdProfile = await query<CreatedPatientProfileRecord>(
        `
          INSERT INTO patient_profiles (psychologist_id, patient_user_id, phone)
          VALUES ($1, $2, $3)
          RETURNING id AS "patientProfileId"
        `,
        [createPatientInput.psychologistId, patientUser.id, createPatientInput.phone],
      );

      return {
        patientProfileId: createdProfile.rows[0].patientProfileId,
        patientId: patientUser.id,
        fullName: patientUser.fullName,
        email: patientUser.email,
        phone: createPatientInput.phone,
        provisionalPassword: createPatientInput.provisionalPassword,
        role: patientUser.role,
        firstAccess: patientUser.firstAccess,
        createdAt: patientUser.createdAt,
      };
    });
  }
}
