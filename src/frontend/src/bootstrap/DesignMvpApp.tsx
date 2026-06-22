import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppData } from '../hooks/useAppData';
import { AppDataProvider } from '../state/AppDataContext';
import {
  DiaryCreateScreen,
  DiaryDetailScreen,
  DiaryListScreen,
  FirstAccessScreen,
  LoginScreen,
  RegisterScreen,
  PatientConfirmScreen,
  PatientDetailScreen,
  PatientHomeScreen,
  PatientListScreen,
  PatientProfileScreen,
  PatientRegisterScreen,
  PatientSessionsScreen,
  PsychHomeScreen,
  SessionCreateScreen,
  SessionDetailScreen,
} from '../screens/entre-sessoes';
import { C } from '../theme/tokens';
import { Flow, Screen } from '../types/app';

export function DesignMvpApp() {
  return (
    <AppDataProvider>
      <DesignMvpShell />
    </AppDataProvider>
  );
}

function DesignMvpShell() {
  const [screen, setScreen] = useState<Screen>('login');
  const { user, isBootstrapping } = useAppData();
  const previousUserRef = useRef<typeof user>(null);

  const go = (next: Screen) => setScreen(next);
  const switchFlow = (_next: Flow) => undefined;

  useEffect(() => {
    const previousUser = previousUserRef.current;

    if (!previousUser && user) {
      setScreen(
        user.firstAccess
          ? 'first-access'
          : user.role === 'PSYCHOLOGIST'
            ? 'psy-home'
            : 'p-home',
      );
    }

    if (previousUser && user && previousUser.firstAccess && !user.firstAccess) {
      setScreen(user.role === 'PSYCHOLOGIST' ? 'psy-home' : 'p-home');
    }

    if (previousUser && !user) {
      setScreen('login');
    }

    previousUserRef.current = user;
  }, [user]);

  const renderScreen = () => {
    switch (screen) {
      case 'login':
        return <LoginScreen go={go} onSwitchFlow={switchFlow} />;
      case 'register':
        return <RegisterScreen go={go} />;
      case 'first-access':
        return <FirstAccessScreen go={go} />;
      case 'p-home':
        return <PatientHomeScreen go={go} />;
      case 'p-diary-create':
        return <DiaryCreateScreen go={go} />;
      case 'p-diary-list':
        return <DiaryListScreen go={go} />;
      case 'p-diary-detail':
        return <DiaryDetailScreen go={go} />;
      case 'p-sessions':
        return <PatientSessionsScreen go={go} />;
      case 'p-profile':
        return <PatientProfileScreen go={go} />;
      case 'psy-home':
        return <PsychHomeScreen go={go} />;
      case 'psy-patients':
        return <PatientListScreen go={go} />;
      case 'psy-patient-register':
        return <PatientRegisterScreen go={go} />;
      case 'psy-patient-confirm':
        return <PatientConfirmScreen go={go} />;
      case 'psy-patient-detail':
        return <PatientDetailScreen go={go} />;
      case 'psy-session-create':
        return <SessionCreateScreen go={go} />;
      case 'psy-session-detail':
        return <SessionDetailScreen go={go} isPatient={user?.role === 'PATIENT'} />;
      default:
        return <LoginScreen go={go} onSwitchFlow={switchFlow} />;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.app}>
        {isBootstrapping ? (
          <View style={styles.loading}>
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        ) : (
          renderScreen()
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.begeLight,
  },
  app: {
    flex: 1,
    backgroundColor: C.begeLight,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: C.muted,
    fontSize: 14,
    fontWeight: '600',
  },
});
