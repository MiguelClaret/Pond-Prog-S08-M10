import { Role } from '../enums/role.enum';

export class AuthUserRecord {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: Role;
  firstAccess: boolean;
  createdAt: Date;
}
