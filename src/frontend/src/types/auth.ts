export type UserRole = 'PATIENT' | 'PSYCHOLOGIST';

export type UserPsychologist = {
  id: string;
  fullName: string;
  email: string;
};

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  firstAccess: boolean;
  createdAt: string;
  psychologist?: UserPsychologist | null;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};
