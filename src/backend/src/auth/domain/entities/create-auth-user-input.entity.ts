import { Role } from '../enums/role.enum';

export class CreateAuthUserInput {
  fullName: string;
  email: string;
  passwordHash: string;
  role: Role;
}
