export type Patient = {
  id?: string;
  patientProfileId?: string;
  patientId?: string;
  fullName: string;
  email: string;
  phone: string | null;
  provisionalPassword?: string;
  role?: 'PATIENT';
  firstAccess?: boolean;
  createdAt?: string;
};
