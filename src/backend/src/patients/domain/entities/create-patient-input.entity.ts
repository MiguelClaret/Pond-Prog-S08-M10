export class CreatePatientInput {
  psychologistId: string;
  fullName: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  provisionalPassword: string;
}
