import { Role } from '../enums/role.enum';

export class AuthenticatedRequestUser {
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}
