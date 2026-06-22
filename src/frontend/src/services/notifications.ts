import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Diary, PatientSession } from '../types/app';

type StoredSessionNotifications = Record<
  string,
  {
    notificationId: string;
    sessionDate: string;
  }
>;

const DIARY_NOTIFICATION_KEY = 'entresessoes_diary_notification_id';
const SESSION_NOTIFICATIONS_KEY = 'entresessoes_session_notifications';
const DIARY_REMINDER_HOUR = 18;
const DIARY_REMINDER_MINUTE = 0;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function notificationsSupported() {
  return Platform.OS !== 'web';
}

function isSameDay(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

async function readStoredSessionNotifications() {
  const rawValue = await AsyncStorage.getItem(SESSION_NOTIFICATIONS_KEY);

  if (!rawValue) {
    return {} as StoredSessionNotifications;
  }

  try {
    return JSON.parse(rawValue) as StoredSessionNotifications;
  } catch {
    return {} as StoredSessionNotifications;
  }
}

async function writeStoredSessionNotifications(value: StoredSessionNotifications) {
  await AsyncStorage.setItem(SESSION_NOTIFICATIONS_KEY, JSON.stringify(value));
}

async function ensureAndroidChannelAsync() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Padrao',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#C27A55',
  });
}

export async function ensureNotificationPermissionsAsync() {
  if (!notificationsSupported()) {
    return false;
  }

  await ensureAndroidChannelAsync();

  const currentPermissions = await Notifications.getPermissionsAsync();

  if (currentPermissions.granted) {
    return true;
  }

  const requestedPermissions = await Notifications.requestPermissionsAsync();
  return requestedPermissions.granted;
}

export async function clearManagedNotificationsAsync() {
  if (!notificationsSupported()) {
    return;
  }

  const diaryNotificationId = await AsyncStorage.getItem(DIARY_NOTIFICATION_KEY);
  if (diaryNotificationId) {
    await Notifications.cancelScheduledNotificationAsync(diaryNotificationId).catch(() => undefined);
    await AsyncStorage.removeItem(DIARY_NOTIFICATION_KEY);
  }

  const storedSessionNotifications = await readStoredSessionNotifications();
  await Promise.all(
    Object.values(storedSessionNotifications).map((item) =>
      Notifications.cancelScheduledNotificationAsync(item.notificationId).catch(() => undefined),
    ),
  );
  await AsyncStorage.removeItem(SESSION_NOTIFICATIONS_KEY);
}

export async function syncDiaryReminderAsync(diaries: Diary[]) {
  if (!notificationsSupported()) {
    return;
  }

  const permissionsGranted = await ensureNotificationPermissionsAsync();
  if (!permissionsGranted) {
    return;
  }

  const existingNotificationId = await AsyncStorage.getItem(DIARY_NOTIFICATION_KEY);
  if (existingNotificationId) {
    await Notifications.cancelScheduledNotificationAsync(existingNotificationId).catch(() => undefined);
    await AsyncStorage.removeItem(DIARY_NOTIFICATION_KEY);
  }

  const now = new Date();
  const hasDiaryToday = diaries.some((diary) => isSameDay(new Date(diary.createdAt), now));

  if (hasDiaryToday) {
    return;
  }

  const scheduledFor = new Date();
  scheduledFor.setHours(DIARY_REMINDER_HOUR, DIARY_REMINDER_MINUTE, 0, 0);

  if (scheduledFor.getTime() <= now.getTime()) {
    return;
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hora de registrar seu dia',
      body: 'Voce ainda nao escreveu no diario hoje. Tire alguns minutos para registrar como esta se sentindo.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: scheduledFor,
    },
  });

  await AsyncStorage.setItem(DIARY_NOTIFICATION_KEY, notificationId);
}

export async function syncSessionRemindersAsync(
  sessions: PatientSession[],
  psychologistName?: string | null,
) {
  if (!notificationsSupported()) {
    return;
  }

  const permissionsGranted = await ensureNotificationPermissionsAsync();
  if (!permissionsGranted) {
    return;
  }

  const now = new Date();
  const storedNotifications = await readStoredSessionNotifications();
  const nextStoredNotifications: StoredSessionNotifications = {};

  for (const session of sessions) {
    if (session.status !== 'SCHEDULED') {
      continue;
    }

    const sessionDate = new Date(session.date);
    const reminderDate = new Date(sessionDate.getTime() - 24 * 60 * 60 * 1000);

    if (reminderDate.getTime() <= now.getTime()) {
      continue;
    }

    const storedNotification = storedNotifications[session.id];

    if (storedNotification && storedNotification.sessionDate === session.date) {
      nextStoredNotifications[session.id] = storedNotification;
      continue;
    }

    if (storedNotification) {
      await Notifications.cancelScheduledNotificationAsync(storedNotification.notificationId).catch(() => undefined);
    }

    const formattedDate = sessionDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });
    const formattedTime = sessionDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Voce tem sessao amanha',
        body: `${formattedDate}, as ${formattedTime}${psychologistName ? ` com ${psychologistName}` : ''}.`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });

    nextStoredNotifications[session.id] = {
      notificationId,
      sessionDate: session.date,
    };
  }

  const staleSessionIds = Object.keys(storedNotifications).filter(
    (sessionId) => !nextStoredNotifications[sessionId],
  );

  await Promise.all(
    staleSessionIds.map((sessionId) =>
      Notifications.cancelScheduledNotificationAsync(storedNotifications[sessionId].notificationId).catch(
        () => undefined,
      ),
    ),
  );

  await writeStoredSessionNotifications(nextStoredNotifications);
}
