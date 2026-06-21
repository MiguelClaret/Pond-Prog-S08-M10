import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infra/database/database.service';
import { Role } from '../domain/enums/role.enum';
import { AuthUserRecord } from '../domain/entities/auth-user-record.entity';
import { CreateAuthUserInput } from '../domain/entities/create-auth-user-input.entity';
import { IAuthRepository } from '../domain/interfaces/auth.repository.interface';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private readonly baseSelect = `
    SELECT
      u.id,
      u.name AS "fullName",
      u.email,
      u.password_hash AS "passwordHash",
      u.role,
      u.first_access AS "firstAccess",
      u.created_at AS "createdAt",
      psychologist.id AS "psychologistId",
      psychologist.name AS "psychologistFullName",
      psychologist.email AS "psychologistEmail"
    FROM public.users u
    LEFT JOIN public.patient_profiles pp ON pp.patient_user_id = u.id
    LEFT JOIN public.users psychologist ON psychologist.id = pp.psychologist_id
  `;

  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    const result = await this.databaseService.query<AuthUserRecord>(
      `
        ${this.baseSelect}
        WHERE u.email = $1
        LIMIT 1
      `,
      [email],
    );

    return result.rows[0] ?? null;
  }

  async findById(id: string): Promise<AuthUserRecord | null> {
    const result = await this.databaseService.query<AuthUserRecord>(
      `
        ${this.baseSelect}
        WHERE u.id = $1
        LIMIT 1
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  async findDetailedById(id: string): Promise<AuthUserRecord | null> {
    return await this.findById(id);
  }

  async create(createAuthUserInput: CreateAuthUserInput): Promise<AuthUserRecord> {
    const result = await this.databaseService.query<AuthUserRecord>(
      `
        INSERT INTO public.users (name, email, password_hash, role)
        VALUES ($1, $2, $3, $4::user_role)
        RETURNING
          id,
          name AS "fullName",
          email,
          password_hash AS "passwordHash",
          role,
          first_access AS "firstAccess",
          created_at AS "createdAt"
      `,
      [
        createAuthUserInput.fullName,
        createAuthUserInput.email,
        createAuthUserInput.passwordHash,
        createAuthUserInput.role,
      ],
    );

    return result.rows[0];
  }

  async updateFirstAccessPassword(id: string, passwordHash: string): Promise<AuthUserRecord> {
    await this.databaseService.query<AuthUserRecord>(
      `
        UPDATE public.users
        SET password_hash = $2,
            first_access = FALSE
        WHERE id = $1
      `,
      [id, passwordHash],
    );

    const updatedUser = await this.findById(id);

    if (!updatedUser) {
      throw new Error('Updated auth user not found.');
    }

    return updatedUser;
  }
}
