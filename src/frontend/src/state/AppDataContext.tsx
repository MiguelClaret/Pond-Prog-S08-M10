import { createContext, PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { getMe, login, registerPsychologist, updateFirstAccessPassword } from '../services/api/auth';
import { setApiToken } from '../services/api/client';
import {
  createDiary as createDiaryRequest,
  deleteDiary as deleteDiaryRequest,
  getMyDiary,
  getSharedDiary,
  updateDiaryShare,
} from '../services/api/diary';
import { createPatient as createPatientRequest, getMyPatients } from '../services/api/patients';
import {
  cancelSession as cancelSessionRequest,
  createSession as createSessionRequest,
  finishSession as finishSessionRequest,
  getSessionById,
  getMySessions,
  updateSession as updateSessionRequest,
} from '../services/api/sessions';
import { formatErrorMessage, logError } from '../services/log-error';
import {
  clearManagedNotificationsAsync,
  ensureNotificationPermissionsAsync,
  syncDiaryReminderAsync,
  syncSessionRemindersAsync,
} from '../services/notifications';
import { clearStoredToken, getStoredToken, setStoredToken } from '../services/storage';
import { Diary, Patient, PatientSession } from '../types/app';
import { User } from '../types/auth';
import { DiaryEntry } from '../types/diary';
import { Patient as ApiPatient } from '../types/patient';
import { Session } from '../types/session';

type CreateDiaryInput = {
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
};

type CreatePatientInput = {
  fullName: string;
  email: string;
  phone?: string;
};

type CreateSessionInput = {
  patientId: string;
  scheduledAt: string;
  durationMinutes: number;
  type: 'ONLINE' | 'IN_PERSON';
  notes?: string;
};

type AppDataContextValue = {
  user: User | null;
  isBootstrapping: boolean;
  isBusy: boolean;
  error: string | null;
  diaries: Diary[];
  sessions: PatientSession[];
  patients: Patient[];
  sharedDiaries: Diary[];
  selectedDiaryId: string | null;
  selectedPatientId: string | null;
  selectedSessionId: string | null;
  createdPatient: Patient | null;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  registerPsychologistAccount: (fullName: string, email: string, password: string) => Promise<User>;
  changeFirstAccessPassword: (newPassword: string) => Promise<User>;
  createDiary: (input: CreateDiaryInput) => Promise<void>;
  setDiarySharing: (id: string, isShared: boolean) => Promise<void>;
  deleteDiary: (id: string) => Promise<void>;
  createPatient: (input: CreatePatientInput) => Promise<Patient>;
  createSession: (input: CreateSessionInput) => Promise<PatientSession>;
  loadSessionDetail: (id: string) => Promise<PatientSession>;
  updateSession: (
    id: string,
    input: Partial<CreateSessionInput>,
  ) => Promise<PatientSession>;
  loadSharedDiaries: (patientId: string, daysBack?: number) => Promise<void>;
  finishSession: (id: string, notes?: string | null) => Promise<void>;
  cancelSession: (id: string) => Promise<void>;
  selectDiary: (id: string | null) => void;
  selectPatient: (id: string | null) => void;
  selectSession: (id: string | null) => void;
  clearError: () => void;
};

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function mapDiary(entry: DiaryEntry): Diary {
  return {
    id: entry.id,
    title: entry.title || 'Entrada sem titulo',
    text: entry.text || (entry.audioUrl ? 'Entrada registrada em audio.' : ''),
    mood: entry.mood,
    intensity: entry.intensity,
    isShared: entry.isSharedWithPsychologist,
    weather: {
      temp: entry.weatherTemperature,
      desc: entry.weatherDescription,
    },
    audioUrl: entry.audioUrl,
    createdAt: entry.createdAt,
  };
}

function mapPatient(patient: ApiPatient): Patient {
  const record = patient as ApiPatient & { id?: string };
  const id = record.patientId || record.id || record.patientProfileId || record.email;
  return {
    id,
    patientId: id,
    patientProfileId: record.patientProfileId ?? '',
    name: patient.fullName,
    initials: initials(patient.fullName),
    email: patient.email,
    phone: patient.phone ?? null,
    nextSession: null,
    provisionalPassword: patient.provisionalPassword,
  };
}

function mapSession(session: Session, patients: Patient[], psychologistName?: string | null): PatientSession {
  const patient = patients.find((item) => item.patientId === session.patientId);

  return {
    id: session.id,
    patientId: session.patientId,
    patientName: patient?.name ?? 'Paciente',
    patientInitials: patient?.initials ?? 'PA',
    date: String(session.scheduledAt),
    type: session.type,
    status: session.status,
    psych: psychologistName ?? null,
    notes: session.notes ?? '',
    durationMinutes: session.durationMinutes,
  };
}

function upsertSession(current: PatientSession[], next: PatientSession) {
  const existingIndex = current.findIndex((item) => item.id === next.id);

  if (existingIndex === -1) {
    return [next, ...current];
  }

  return current.map((item) => (item.id === next.id ? next : item));
}

function attachNextSessions(patients: Patient[], sessions: PatientSession[]) {
  return patients.map((patient) => {
    const nextSession = sessions
      .filter((session) => session.patientId === patient.patientId && session.status === 'SCHEDULED')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    return {
      ...patient,
      nextSession: nextSession?.date ?? null,
    };
  });
}

function friendlyError(error: unknown) {
  return formatErrorMessage(error);
}

export function AppDataProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [sessions, setSessions] = useState<PatientSession[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sharedDiaries, setSharedDiaries] = useState<Diary[]>([]);
  const [selectedDiaryId, setSelectedDiaryId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [createdPatient, setCreatedPatient] = useState<Patient | null>(null);

  const applyToken = useCallback(async (token: string | null) => {
    setApiToken(token);
    if (token) {
      await setStoredToken(token);
      return;
    }
    await clearStoredToken();
  }, []);

  const run = useCallback(async <T,>(label: string, action: () => Promise<T>) => {
    setIsBusy(true);
    setError(null);
    try {
      return await action();
    } catch (caught) {
      logError(label, caught);
      const message = friendlyError(caught);
      setError(message);
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const loadDataForUser = useCallback(async (targetUser: User) => {
    if (!targetUser) return;

    if (targetUser.role === 'PATIENT') {
      const [diaryEntries, sessionGroups] = await Promise.all([getMyDiary(), getMySessions()]);
      setDiaries(diaryEntries.map(mapDiary));
      setSessions(
        [...sessionGroups.future, ...sessionGroups.past].map((session) =>
          mapSession(session, [], targetUser.psychologist?.fullName),
        ),
      );
      return;
    }

    const apiPatients = await getMyPatients();
    const mappedPatients = apiPatients.map(mapPatient);
    const sessionGroups = await getMySessions();
    const mappedSessions = [...sessionGroups.future, ...sessionGroups.past].map((session) =>
      mapSession(session, mappedPatients),
    );

    setSessions(mappedSessions);
    setPatients(attachNextSessions(mappedPatients, mappedSessions));
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        const token = await getStoredToken();
        if (!token) return;

        setApiToken(token);
        const currentUser = await getMe();
        setUser(currentUser);
        await loadDataForUser(currentUser);
      } catch (caught) {
        logError('design.bootstrap', caught);
        await applyToken(null);
        setUser(null);
      } finally {
        setIsBootstrapping(false);
      }
    }

    void bootstrap();
  }, [applyToken, loadDataForUser]);

  useEffect(() => {
    async function syncPatientNotifications() {
      if (!user) {
        await clearManagedNotificationsAsync();
        return;
      }

      if (user.role !== 'PATIENT') {
        await clearManagedNotificationsAsync();
        return;
      }

      const permissionsGranted = await ensureNotificationPermissionsAsync();
      if (!permissionsGranted) {
        return;
      }

      await syncDiaryReminderAsync(diaries);
      await syncSessionRemindersAsync(sessions, user.psychologist?.fullName);
    }

    void syncPatientNotifications().catch((caught) => {
      logError('design.notifications.sync', caught);
    });
  }, [diaries, sessions, user]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      user,
      isBootstrapping,
      isBusy,
      error,
      diaries,
      sessions,
      patients,
      sharedDiaries,
      selectedDiaryId,
      selectedPatientId,
      selectedSessionId,
      createdPatient,
      signIn: async (email, password) =>
        run('design.login', async () => {
          const response = await login(email, password);
          await applyToken(response.accessToken);
          setUser(response.user);
          await loadDataForUser(response.user);
          return response.user;
        }),
      signOut: async () =>
        run('design.logout', async () => {
          await clearManagedNotificationsAsync();
          await applyToken(null);
          setUser(null);
          setDiaries([]);
          setSessions([]);
          setPatients([]);
          setSharedDiaries([]);
          setSelectedDiaryId(null);
          setSelectedPatientId(null);
          setSelectedSessionId(null);
          setCreatedPatient(null);
        }),
      registerPsychologistAccount: async (fullName, email, password) =>
        run('design.registerPsychologist', async () => {
          const response = await registerPsychologist(fullName, email, password);
          await applyToken(response.accessToken);
          setUser(response.user);
          await loadDataForUser(response.user);
          return response.user;
        }),
      changeFirstAccessPassword: async (newPassword) =>
        run('design.firstAccessPassword', async () => {
          const response = await updateFirstAccessPassword(newPassword);
          await applyToken(response.accessToken);
          setUser(response.user);
          await loadDataForUser(response.user);
          return response.user;
        }),
      createDiary: async (input) =>
        run('design.createDiary', async () => {
          const created = await createDiaryRequest(input);
          setDiaries((current) => [mapDiary(created), ...current]);
        }),
      setDiarySharing: async (id, isShared) =>
        run('design.shareDiary', async () => {
          const updated = await updateDiaryShare(id, isShared);
          setDiaries((current) => current.map((diary) => (diary.id === id ? mapDiary(updated) : diary)));
        }),
      deleteDiary: async (id) =>
        run('design.deleteDiary', async () => {
          await deleteDiaryRequest(id);
          setDiaries((current) => current.filter((diary) => diary.id !== id));
          setSelectedDiaryId(null);
        }),
      createPatient: async (input) =>
        run('design.createPatient', async () => {
          const created = mapPatient(await createPatientRequest(input));
          setPatients((current) => [created, ...current]);
          setCreatedPatient(created);
          return created;
        }),
      createSession: async (input) =>
        run('design.createSession', async () => {
          const created = mapSession(await createSessionRequest(input), patients);
          setSessions((current) => upsertSession(current, created));
          setSelectedSessionId(created.id);
          return created;
        }),
      loadSessionDetail: async (id) =>
        run('design.loadSessionDetail', async () => {
          const loaded = mapSession(await getSessionById(id), patients, user?.psychologist?.fullName);
          setSessions((current) => upsertSession(current, loaded));
          setSelectedSessionId(loaded.id);
          return loaded;
        }),
      updateSession: async (id, input) =>
        run('design.updateSession', async () => {
          const payload = {
            scheduledAt: input.scheduledAt,
            durationMinutes: input.durationMinutes,
            type: input.type,
            notes: input.notes ?? null,
          };
          const updated = mapSession(await updateSessionRequest(id, payload), patients, user?.psychologist?.fullName);
          setSessions((current) => upsertSession(current, updated));
          return updated;
        }),
      loadSharedDiaries: async (patientId, daysBack = 7) =>
        run('design.sharedDiaries', async () => {
          const entries = await getSharedDiary(patientId, daysBack);
          setSharedDiaries(entries.map(mapDiary));
        }),
      finishSession: async (id, notes) =>
        run('design.finishSession', async () => {
          const updated = mapSession(await finishSessionRequest(id, notes), patients, user?.psychologist?.fullName);
          setSessions((current) => upsertSession(current, updated));
        }),
      cancelSession: async (id) =>
        run('design.cancelSession', async () => {
          const updated = mapSession(await cancelSessionRequest(id), patients, user?.psychologist?.fullName);
          setSessions((current) => upsertSession(current, updated));
        }),
      selectDiary: setSelectedDiaryId,
      selectPatient: setSelectedPatientId,
      selectSession: setSelectedSessionId,
      clearError: () => setError(null),
    }),
    [
      applyToken,
      createdPatient,
      diaries,
      error,
      isBootstrapping,
      isBusy,
      patients,
      loadDataForUser,
      run,
      selectedDiaryId,
      selectedPatientId,
      selectedSessionId,
      sessions,
      sharedDiaries,
      user,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
export { AppDataContext };
