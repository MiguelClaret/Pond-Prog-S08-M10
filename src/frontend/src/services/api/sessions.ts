import { api } from './client';
import { Session, SessionsListResponse } from '../../types/session';

export async function createSession(payload: {
  patientId: string;
  scheduledAt: string;
  durationMinutes: number;
  type: 'ONLINE' | 'IN_PERSON';
  notes?: string;
}) {
  const response = await api.post<Session>('/sessions', payload);
  return response.data;
}

export async function getMySessions() {
  const response = await api.get<SessionsListResponse>('/sessions/me');
  return response.data;
}

export async function getSessionById(id: string) {
  const response = await api.get<Session>(`/sessions/${id}`);
  return response.data;
}

export async function updateSession(
  id: string,
  payload: Partial<{
    scheduledAt: string;
    durationMinutes: number;
    type: 'ONLINE' | 'IN_PERSON';
    notes: string | null;
  }>,
) {
  const response = await api.patch<Session>(`/sessions/${id}`, payload);
  return response.data;
}

export async function finishSession(id: string, notes?: string | null) {
  const response = await api.patch<Session>(`/sessions/${id}/finish`, {
    notes: notes ?? null,
  });
  return response.data;
}

export async function cancelSession(id: string) {
  const response = await api.patch<Session>(`/sessions/${id}/cancel`);
  return response.data;
}
