import { AuthUserRecord } from '../entities/auth-user-record.entity';
import { CreateAuthUserInput } from '../entities/create-auth-user-input.entity';

export abstract class IAuthRepository {
  abstract findByEmail(email: string): Promise<AuthUserRecord | null>;
  abstract findById(id: string): Promise<AuthUserRecord | null>;
  abstract findDetailedById(id: string): Promise<AuthUserRecord | null>;
  abstract create(createAuthUserInput: CreateAuthUserInput): Promise<AuthUserRecord>;
  abstract updateFirstAccessPassword(id: string, passwordHash: string): Promise<AuthUserRecord>;
}
