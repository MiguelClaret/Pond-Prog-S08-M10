import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infra/database/database.service';
import { Role } from '../domain/enums/role.enum';
import { AuthUserRecord } from '../domain/entities/auth-user-record.entity';
import { CreateAuthUserInput } from '../domain/entities/create-auth-user-input.entity';
import { IAuthRepository } from '../domain/interfaces/auth.repository.interface';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    const result = await this.databaseService.query<AuthUserRecord>(
      `
        SELECT
          id,
          name AS "fullName",
          email,
          password_hash AS "passwordHash",
          role,
          created_at AS "createdAt"
        FROM public.users
        WHERE email = $1
        LIMIT 1
      `,
      [email],
    );

    return result.rows[0] ?? null;
  }

  async findById(id: string): Promise<AuthUserRecord | null> {
    const result = await this.databaseService.query<AuthUserRecord>(
      `
        SELECT
          id,
          name AS "fullName",
          email,
          password_hash AS "passwordHash",
          role,
          created_at AS "createdAt"
        FROM public.users
        WHERE id = $1
        LIMIT 1
      `,
      [id],
    );

    return result.rows[0] ?? null;
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
}
