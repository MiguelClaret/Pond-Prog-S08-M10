import { api } from './client';
import { AuthResponse, User } from '../../types/auth';

export async function login(email: string, password: string) {
  const response = await api.post<AuthResponse>('/auth/login', { email, password });
  return response.data;
}

export async function registerPsychologist(fullName: string, email: string, password: string) {
  const response = await api.post<AuthResponse>('/auth/register', { fullName, email, password });
  return response.data;
}

export async function getMe() {
  const response = await api.get<User>('/auth/me');
  return response.data;
}

export async function updateFirstAccessPassword(newPassword: string) {
  const response = await api.patch<AuthResponse>('/auth/first-access/password', { newPassword });
  return response.data;
}
