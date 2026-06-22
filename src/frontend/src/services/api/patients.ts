import { api } from './client';
import { Patient } from '../../types/patient';

export async function createPatient(payload: {
  fullName: string;
  email: string;
  phone?: string;
}) {
  const response = await api.post<Patient>('/patients', payload);
  return response.data;
}

export async function getMyPatients() {
  const response = await api.get<Patient[]>('/patients/my-patients');
  return response.data;
}
