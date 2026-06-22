import { api } from './client';
import { DiaryEntry } from '../../types/diary';

export async function createDiary(payload: {
  title?: string;
  text?: string;
  mood: string;
  intensity: number;
  isSharedWithPsychologist?: boolean;
  latitude?: number;
  longitude?: number;
  audio?: {
    uri: string;
    name: string;
    type: string;
  };
}) {
  const formData = new FormData();

  if (payload.title) formData.append('title', payload.title);
  if (payload.text) formData.append('text', payload.text);
  formData.append('mood', payload.mood);
  formData.append('intensity', String(payload.intensity));
  formData.append(
    'isSharedWithPsychologist',
    String(Boolean(payload.isSharedWithPsychologist)),
  );
  if (payload.latitude !== undefined) formData.append('latitude', String(payload.latitude));
  if (payload.longitude !== undefined) formData.append('longitude', String(payload.longitude));
  if (payload.audio) formData.append('audio', payload.audio as unknown as Blob);

  const response = await api.post<DiaryEntry>('/diary', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export async function getMyDiary() {
  const response = await api.get<DiaryEntry[]>('/diary/me');
  return response.data;
}

export async function updateDiaryShare(id: string, isSharedWithPsychologist: boolean) {
  const response = await api.patch<DiaryEntry>(`/diary/${id}/share`, {
    isSharedWithPsychologist,
  });
  return response.data;
}

export async function deleteDiary(id: string) {
  const response = await api.delete<DiaryEntry>(`/diary/${id}`);
  return response.data;
}

export async function getSharedDiary(patientId: string, daysBack = 7) {
  const response = await api.get<DiaryEntry[]>(`/diary/shared-diary/${patientId}`, {
    params: { daysBack },
  });
  return response.data;
}
