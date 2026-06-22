import { Feather } from '@expo/vector-icons';
import NativeDateTimePickerModal from 'react-native-modal-datetime-picker';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  AudioPlayerCard,
  Avi,
  Btn,
  Card,
  DividerOr,
  Field,
  NavHeader,
  PatientNav,
  PsychNav,
  SBadge,
  text,
  Toggle,
  TypeBadge,
} from '../components/entre-sessoes';
import { useAppData } from '../hooks/useAppData';
import { C, radius, S } from '../theme/tokens';
import { Flow, PatientSession, Screen } from '../types/app';
import { fmtDate, fmtDateLong, fmtTime, getMood } from '../utils/entre-sessoes';
import { MOODS } from '../utils/moods';

type DateTimePickerMode = 'date' | 'time';

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatLocalTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

function buildPickerDate(dateValue: string, timeValue = '09:00') {
  if (!dateValue) {
    const now = new Date();
    now.setSeconds(0, 0);
    return now;
  }

  const [year, month, day] = dateValue.split('-').map(Number);
  const [hours, minutes] = timeValue.split(':').map(Number);
  return new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, 0, 0);
}

function getDateLabel(value: string) {
  if (!value) return '';

  return buildPickerDate(value).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
  });
}

function getTimeLabel(value: string) {
  return value;
}

function getInitials(name?: string | null) {
  if (!name) {
    return 'PS';
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function PickerField({
  label,
  value,
  placeholder,
  icon,
  onPress,
}: {
  label: string;
  value: string;
  placeholder: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
}) {
  return (
    <View style={styles.fieldWrapLike}>
      <Text style={styles.fieldCaption}>{label}</Text>
      <Pressable onPress={onPress} style={styles.pickerField}>
        <View style={styles.inlineIconText}>
          <Feather name={icon} size={15} color={C.muted} />
          <Text style={[styles.pickerFieldText, !value && styles.pickerPlaceholder]}>
            {value || placeholder}
          </Text>
        </View>
        <Feather name="chevron-down" size={16} color={C.muted} />
      </Pressable>
    </View>
  );
}

function SessionDateTimePickerModal({
  visible,
  mode,
  onClose,
  onSelect,
  value,
}: {
  visible: boolean;
  mode: DateTimePickerMode;
  onClose: () => void;
  onSelect: (value: Date) => void;
  value: Date;
}) {
  return (
    <NativeDateTimePickerModal
      isVisible={visible}
      mode={mode}
      date={value}
      locale="pt-BR"
      is24Hour
      onConfirm={(selectedDate: Date) => {
        onSelect(selectedDate);
        onClose();
      }}
      onCancel={onClose}
      confirmTextIOS="Confirmar"
      cancelTextIOS="Cancelar"
    />
  );
}

export function LoginScreen({
  go,
  onSwitchFlow,
}: {
  go: (s: Screen) => void;
  onSwitchFlow: (f: Flow) => void;
}) {
  const [isPsych, setIsPsych] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, isBusy, error, clearError } = useAppData();
  const accent = isPsych ? C.oliva : C.terracota;

  async function handleEnter() {
    try {
      clearError();
      const loggedUser = await signIn(email, password);
      onSwitchFlow(loggedUser.role === 'PSYCHOLOGIST' ? 'psychologist' : 'patient');

      if (loggedUser.firstAccess) {
        go('first-access');
        return;
      }

      go(loggedUser.role === 'PSYCHOLOGIST' ? 'psy-home' : 'p-home');
    } catch {
      // O contexto ja publica a mensagem de erro para a tela.
    }
  }

  return (
    <View style={styles.full}>
      <View style={styles.loginCenter}>
        <View style={styles.logoBlock}>
          <View style={[styles.logoBox, { backgroundColor: accent }]}>
            <Feather name="heart" size={28} color={C.branco} />
          </View>
          <Text style={styles.appName}>EntreSessoes</Text>
          <Text style={styles.loginSubtitle}>
            {isPsych ? 'Area da psicologa' : 'Acompanhamento entre sessoes'}
          </Text>
        </View>

        {isPsych ? (
          <View style={styles.rolePill}>
            <View style={styles.roleDot} />
            <Text style={styles.roleText}>Acesso profissional</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <Field
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder={isPsych ? 'dra.ana@email.com' : 'sofia@email.com'}
            value={email}
            onChangeText={setEmail}
          />
          <Field label="Senha" secureTextEntry placeholder="••••••••" value={password} onChangeText={setPassword} />
          <Pressable style={styles.forgot}>
            <Text style={[styles.forgotText, { color: accent }]}>Esqueceu a senha?</Text>
          </Pressable>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Pressable
            onPress={handleEnter}
            style={({ pressed }) => [
              styles.dynamicPrimary,
              { backgroundColor: accent },
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.dynamicPrimaryText}>{isBusy ? 'Entrando...' : 'Entrar'}</Text>
          </Pressable>
          <DividerOr />
          <Btn
            label={isPsych ? 'Sou paciente' : 'Sou psicologa'}
            variant="secondary"
            onPress={() => {
              const next = !isPsych;
              setIsPsych(next);
              onSwitchFlow(next ? 'psychologist' : 'patient');
            }}
          />
          {isPsych ? (
            <Btn label="Criar conta" variant="ghost" onPress={() => go('register')} />
          ) : null}
        </View>
      </View>
      <Text style={styles.footerText}>EntreSessoes</Text>
    </View>
  );
}

export function RegisterScreen({ go }: { go: (s: Screen) => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { registerPsychologistAccount, isBusy, error, clearError } = useAppData();

  async function handleRegister() {
    try {
      clearError();
      setLocalError(null);

      if (!fullName.trim() || !email.trim() || !password.trim()) {
        setLocalError('Preencha nome, email e senha.');
        return;
      }

      await registerPsychologistAccount(fullName.trim(), email.trim(), password.trim());
      go('psy-home');
    } catch {
      // O contexto ja publica a mensagem de erro para a tela.
    }
  }

  return (
    <View style={styles.full}>
      <NavHeader title="Criar conta" onBack={() => go('login')} />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.form}>
          <Field label="Nome completo" placeholder="Dra. Maria Silva" value={fullName} onChangeText={setFullName} />
          <Field
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="maria@email.com"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            label="Senha"
            secureTextEntry
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
          />
          {localError || error ? <Text style={styles.errorText}>{localError ?? error}</Text> : null}
        </View>
      </ScrollView>
      <View style={styles.footerAction}>
        <Btn label={isBusy ? 'Criando...' : 'Criar conta'} onPress={handleRegister} />
      </View>
    </View>
  );
}

export function FirstAccessScreen({ go }: { go: (s: Screen) => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { user, changeFirstAccessPassword, isBusy, error, clearError } = useAppData();

  async function handleSubmit() {
    try {
      clearError();
      setLocalError(null);

      if (newPassword !== confirmPassword) {
        setLocalError('As senhas nao conferem.');
        return;
      }

      const updatedUser = await changeFirstAccessPassword(newPassword);
      go(updatedUser.role === 'PSYCHOLOGIST' ? 'psy-home' : 'p-home');
    } catch {
      // O contexto ja publica a mensagem de erro para a tela.
    }
  }

  return (
    <View style={styles.full}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.lockBox}>
          <Feather name="lock" size={18} color={C.branco} />
        </View>
        <Text style={styles.screenTitle}>Bem-vinda, {user?.fullName?.split(' ')[0] ?? 'paciente'}!</Text>
        <Text style={[text.body, styles.mbXl]}>
          Este e seu primeiro acesso. Crie sua senha pessoal para continuar.
        </Text>
        <View style={styles.form}>
          <Field
            label="Nova senha"
            secureTextEntry
            placeholder="••••••••"
            hint="Minimo 8 caracteres"
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <Field
            label="Confirmar nova senha"
            secureTextEntry
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          {localError || error ? <Text style={styles.errorText}>{localError ?? error}</Text> : null}
        </View>
      </ScrollView>
      <View style={styles.footerAction}>
        <Btn label={isBusy ? 'Salvando...' : 'Criar minha senha'} onPress={handleSubmit} />
      </View>
    </View>
  );
}

export function PatientHomeScreen({ go }: { go: (s: Screen) => void }) {
  const { user, diaries, sessions, selectDiary } = useAppData();
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  const nextSession = sessions
    .filter((session) => session.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  const psychologistName = user?.psychologist?.fullName ?? null;

  return (
    <View style={styles.full}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.headerBlock}>
          <Text style={styles.dateText}>{today}</Text>
          <Text style={styles.screenTitle}>Ola, {user?.fullName?.split(' ')[0] ?? 'paciente'}</Text>
          <Text style={text.muted}>Como voce esta hoje?</Text>
        </View>

        {nextSession ? (
          <View style={styles.nextSession}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.whiteOverline}>Proxima sessao</Text>
                <Text style={styles.whiteTitle}>{fmtDate(nextSession.date)}</Text>
                <Text style={styles.whiteMeta}>
                  {fmtTime(nextSession.date)} · {nextSession.type === 'ONLINE' ? 'Online' : 'Presencial'}
                </Text>
              </View>
              <View style={styles.whiteIconBox}>
                <Feather name={nextSession.type === 'ONLINE' ? 'video' : 'map-pin'} size={18} color={C.branco} />
              </View>
            </View>
            <View style={styles.whiteDivider} />
            <View style={styles.sessionPersonRow}>
              <View style={styles.tinyInitials}>
                <Text style={styles.tinyInitialsText}>{getInitials(nextSession.psych ?? psychologistName)}</Text>
              </View>
              <Text style={styles.whiteMuted}>{nextSession.psych ?? psychologistName ?? 'Psicologa'}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.quickGrid}>
          <QuickAction
            label="Escrever no diario"
            sub="Registre como voce esta"
            icon="book-open"
            color={C.terracota}
            onPress={() => go('p-diary-create')}
          />
          <QuickAction
            label="Minhas sessoes"
            sub="Ver historico completo"
            icon="calendar"
            color={C.oliva}
            onPress={() => go('p-sessions')}
          />
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Entradas recentes</Text>
          <Pressable onPress={() => go('p-diary-list')}>
            <Text style={styles.linkText}>Ver tudo</Text>
          </Pressable>
        </View>

        <View style={styles.listGap}>
          {diaries.slice(0, 2).map((diary) => (
            <DiaryMini
              key={diary.id}
              diaryId={diary.id}
              onPress={() => {
                selectDiary(diary.id);
                go('p-diary-detail');
              }}
            />
          ))}
        </View>
      </ScrollView>
      <PatientNav active="p-home" go={go} />
    </View>
  );
}

function QuickAction({
  label,
  sub,
  icon,
  color,
  onPress,
}: {
  label: string;
  sub: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.quickAction}>
      <View style={styles.quickIcon}>
        <Feather name={icon} size={16} color={color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickSub}>{sub}</Text>
    </Pressable>
  );
}

function DiaryMini({ diaryId, onPress }: { diaryId: string; onPress: () => void }) {
  const { diaries } = useAppData();
  const diary = diaries.find((item) => item.id === diaryId);
  if (!diary) return null;

  const mood = getMood(diary.mood);

  return (
    <Pressable onPress={onPress} style={styles.diaryMini}>
      <Text style={styles.moodEmoji}>{mood.emoji}</Text>
      <View style={styles.flex}>
        <View style={styles.rowBetween}>
          <Text numberOfLines={1} style={styles.diaryMiniTitle}>{diary.title}</Text>
          {diary.isShared ? <Feather name="eye" size={10} color={C.oliva} /> : null}
        </View>
        <Text numberOfLines={1} style={styles.diaryMiniText}>{diary.text}</Text>
        <Text style={styles.diaryMiniDate}>{fmtDate(diary.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

export function DiaryCreateScreen({ go }: { go: (s: Screen) => void }) {
  const [mood, setMood] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [intensity] = useState(3);
  const [shared, setShared] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [locationLabel, setLocationLabel] = useState('Sem localizacao capturada');
  const [localError, setLocalError] = useState<string | null>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const { createDiary, isBusy, error, clearError } = useAppData();

  async function startRecording() {
    try {
      clearError();
      setLocalError(null);

      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setLocalError('Permita o uso do microfone para gravar audio.');
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordedAudio(null);
    } catch {
      setLocalError('Nao foi possivel iniciar a gravacao.');
    }
  }

  async function stopRecording() {
    try {
      await recorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
      const uri = recorder.uri ?? recorderState.url;

      if (!uri) {
        setLocalError('Nao foi possivel salvar o audio gravado.');
        return;
      }

      setRecordedAudio({
        uri,
        name: `diary-${Date.now()}.m4a`,
        type: 'audio/m4a',
      });
    } catch {
      setLocalError('Nao foi possivel finalizar a gravacao.');
    }
  }

  async function captureLocation() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationLabel('Permissao de localizacao negada');
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      setLocationLabel(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);

      return { latitude, longitude };
    } catch {
      setLocationLabel('Nao foi possivel capturar localizacao');
      return null;
    }
  }

  async function handleSave() {
    if (isSubmitting || isBusy) {
      return;
    }

    try {
      setIsSubmitting(true);
      clearError();
      setLocalError(null);

      if (!mood) {
        setLocalError('Selecione como voce esta se sentindo.');
        return;
      }

      if (!body.trim() && !recordedAudio) {
        setLocalError('Envie texto ou audio antes de salvar.');
        return;
      }

      const location = await captureLocation();

      await createDiary({
        title: title.trim() || undefined,
        text: body.trim() || undefined,
        mood,
        intensity,
        isSharedWithPsychologist: shared,
        latitude: location?.latitude,
        longitude: location?.longitude,
        audio: recordedAudio ?? undefined,
      });
      go('p-diary-list');
    } catch {
      // O contexto ja publica a mensagem de erro para a tela.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.full}>
      <NavHeader title="Nova entrada" onBack={() => go('p-diary-list')} />
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
        <TextInput
          placeholder="Titulo da entrada..."
          placeholderTextColor={C.muted}
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
        />
        <Text style={styles.fieldCaption}>Como voce esta?</Text>
        <View style={styles.moodRow}>
          {MOODS.map((item) => {
            const selected = mood === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setMood(item.id)}
                style={[
                  styles.moodButton,
                  {
                    backgroundColor: selected ? item.color : C.branco,
                    borderColor: selected ? item.color : C.bege,
                  },
                ]}
              >
                <Text style={styles.moodButtonEmoji}>{item.emoji}</Text>
                <Text style={[styles.moodButtonText, { color: selected ? C.branco : C.muted }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          placeholder="O que voce esta sentindo? Escreva livremente..."
          placeholderTextColor={C.muted}
          multiline
          textAlignVertical="top"
          style={styles.textArea}
          value={body}
          onChangeText={setBody}
        />
        <Pressable
          onPress={() => {
            if (recorderState.isRecording) {
              void stopRecording();
              return;
            }

            void startRecording();
          }}
          style={[
            styles.audioButton,
            {
              backgroundColor: recorderState.isRecording ? C.terracota : C.branco,
              borderColor: recorderState.isRecording ? C.terracota : C.bege,
            },
          ]}
        >
          <Feather name="mic" size={13} color={recorderState.isRecording ? C.branco : C.muted} />
          <Text style={[styles.audioText, { color: recorderState.isRecording ? C.branco : C.muted }]}>
            {recorderState.isRecording ? 'Gravando... toque para parar' : 'Gravar audio (opcional)'}
          </Text>
        </Pressable>
        {recorderState.isRecording ? (
          <Text style={styles.dateText}>Gravando ha {Math.floor(recorderState.durationMillis / 1000)}s</Text>
        ) : null}
        {recordedAudio ? (
          <>
            <View style={styles.audioSavedBox}>
              <Feather name="check-circle" size={13} color={C.oliva} />
              <Text style={styles.audioSavedText}>Audio gravado pronto para envio</Text>
              <Pressable onPress={() => setRecordedAudio(null)}>
                <Text style={styles.linkText}>Remover</Text>
              </Pressable>
            </View>
            <AudioPlayerCard uri={recordedAudio.uri} label="Ouvir audio gravado" />
          </>
        ) : null}
        <View style={styles.weatherBox}>
          <Feather name="map-pin" size={13} color={C.pessego} />
          <Text style={styles.weatherText}>{locationLabel}</Text>
        </View>
        <View style={styles.shareBox}>
          <View style={styles.flex}>
            <Text style={styles.shareTitle}>Compartilhar com psicologa</Text>
            <Text style={styles.shareSub}>Sua psicologa podera ler esta entrada</Text>
          </View>
          <Toggle on={shared} onChange={() => setShared(!shared)} />
        </View>
        {localError || error ? <Text style={styles.errorText}>{localError ?? error}</Text> : null}
      </ScrollView>
      <View style={styles.footerAction}>
        <Btn
          label={isSubmitting || isBusy ? 'Salvando...' : 'Salvar entrada'}
          onPress={handleSave}
          disabled={isSubmitting || isBusy || recorderState.isRecording}
        />
      </View>
    </View>
  );
}

export function DiaryListScreen({ go }: { go: (s: Screen) => void }) {
  const { diaries, selectDiary } = useAppData();

  return (
    <View style={styles.full}>
      <NavHeader
        title="Meu Diario"
        right={
          <Pressable onPress={() => go('p-diary-create')} style={styles.headerAction}>
            <Feather name="plus" size={16} color={C.branco} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.dateText}>{diaries.length} entradas registradas</Text>
        <View style={styles.listGap}>
          {diaries.map((diary) => {
            const mood = getMood(diary.mood);
            return (
              <Pressable
                key={diary.id}
                onPress={() => {
                  selectDiary(diary.id);
                  go('p-diary-detail');
                }}
                style={styles.diaryCard}
              >
                <View style={styles.diaryIcon}>
                  <Text style={styles.diaryIconText}>{mood.emoji}</Text>
                </View>
                <View style={styles.flex}>
                  <View style={styles.rowBetween}>
                    <Text numberOfLines={1} style={styles.diaryCardTitle}>{diary.title}</Text>
                    <Feather
                      name={diary.isShared ? 'eye' : 'eye-off'}
                      size={12}
                      color={diary.isShared ? C.oliva : C.bege}
                    />
                  </View>
                  <Text numberOfLines={2} style={styles.diaryCardText}>{diary.text}</Text>
                  <View style={styles.rowBetween}>
                    <Text style={styles.diaryMiniDate}>{fmtDate(diary.createdAt)}</Text>
                    <View style={styles.diaryMetaRow}>
                      <Text style={styles.moodChip}>{mood.label}</Text>
                      {diary.weather.temp !== null ? <Text style={styles.tempText}>{diary.weather.temp}°C</Text> : null}
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <PatientNav active="p-diary-list" go={go} />
    </View>
  );
}

export function DiaryDetailScreen({ go }: { go: (s: Screen) => void }) {
  const { diaries, selectedDiaryId, setDiarySharing, deleteDiary, isBusy } = useAppData();
  const diary = diaries.find((item) => item.id === selectedDiaryId) ?? null;
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (diary) setShared(diary.isShared);
  }, [diary]);

  if (!diary) {
    return (
      <View style={styles.full}>
        <NavHeader title="Entrada" onBack={() => go('p-diary-list')} />
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyText}>Entrada nao encontrada</Text>
        </View>
      </View>
    );
  }

  const activeDiary = diary;
  const mood = getMood(activeDiary.mood);

  async function handleShare() {
    const next = !shared;
    setShared(next);
    try {
      await setDiarySharing(activeDiary.id, next);
    } catch {
      setShared(!next);
    }
  }

  async function handleDelete() {
    try {
      await deleteDiary(activeDiary.id);
      go('p-diary-list');
    } catch {
      // O contexto ja publica a mensagem de erro para a tela.
    }
  }

  return (
    <View style={styles.full}>
      <NavHeader
        title="Entrada"
        onBack={() => go('p-diary-list')}
        right={
          <Pressable onPress={handleDelete} style={styles.trashButton}>
            <Feather name="trash-2" size={14} color="#C0392B" />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.detailHead}>
          <Text style={styles.detailEmoji}>{mood.emoji}</Text>
          <View style={styles.flex}>
            <Text style={styles.screenTitle}>{activeDiary.title}</Text>
            <Text style={styles.dateText}>{fmtDateLong(activeDiary.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.wrapRow}>
          <Text style={styles.moodChip}>{mood.label}</Text>
          <Text style={styles.metaText}>Intensidade {activeDiary.intensity}/5</Text>
          {activeDiary.weather.desc || activeDiary.weather.temp !== null ? (
            <View style={styles.inlineIconText}>
              <Feather name="sun" size={11} color={C.pessego} />
              <Text style={styles.metaText}>
                {activeDiary.weather.desc ?? 'Clima'} {activeDiary.weather.temp !== null ? `· ${activeDiary.weather.temp}°C` : ''}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.detailText}>{activeDiary.text}</Text>
        {activeDiary.audioUrl ? <AudioPlayerCard uri={activeDiary.audioUrl} label="Ouvir audio do diario" /> : null}
        <View style={styles.shareBox}>
          <View style={styles.inlineIconText}>
            <Feather name={shared ? 'eye' : 'eye-off'} size={15} color={shared ? C.oliva : C.muted} />
            <View>
              <Text style={styles.shareTitle}>{shared ? 'Compartilhado com psicologa' : 'Nao compartilhado'}</Text>
              <Text style={styles.shareSub}>{shared ? 'Sua psicologa pode ler esta entrada' : 'Apenas voce pode ver'}</Text>
            </View>
          </View>
          <Toggle on={shared} onChange={handleShare} />
        </View>
        {isBusy ? <Text style={styles.dateText}>Atualizando...</Text> : null}
      </ScrollView>
    </View>
  );
}

export function PatientSessionsScreen({ go }: { go: (s: Screen) => void }) {
  const [tab, setTab] = useState<'future' | 'past'>('future');
  const { sessions, selectSession } = useAppData();
  const items =
    tab === 'future'
      ? sessions.filter((session) => session.status === 'SCHEDULED')
      : sessions.filter((session) => session.status !== 'SCHEDULED');

  return (
    <View style={styles.full}>
      <NavHeader title="Minhas Sessoes" />
      <View style={styles.segmentWrap}>
        <Segmented
          active={tab}
          values={[
            { key: 'future', label: 'Proximas' },
            { key: 'past', label: 'Passadas' },
          ]}
          onChange={setTab}
        />
      </View>
      <ScrollView contentContainerStyle={styles.pageNoTop}>
        {items.length === 0 ? <Text style={styles.emptyText}>Nenhuma sessao encontrada</Text> : null}
        {items.map((session) => (
          <Pressable
            key={session.id}
            onPress={() => {
              selectSession(session.id);
              go('psy-session-detail');
            }}
          >
            <SessionListCard session={session} />
          </Pressable>
        ))}
      </ScrollView>
      <PatientNav active="p-sessions" go={go} />
    </View>
  );
}

function Segmented<T extends string>({
  active,
  values,
  onChange,
}: {
  active: T;
  values: { key: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segment}>
      {values.map((item) => {
        const selected = active === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            style={[styles.segmentItem, selected && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentActiveText]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SessionListCard({ session }: { session: PatientSession }) {
  const { user } = useAppData();
  const psychologistName = session.psych ?? user?.psychologist?.fullName ?? 'Psicologa';

  return (
    <Card style={styles.sessionCard}>
      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.sessionDate}>{fmtDate(session.date)}</Text>
          <Text style={styles.dateText}>{fmtTime(session.date)} · {psychologistName}</Text>
        </View>
        <SBadge status={session.status} />
      </View>
      <TypeBadge type={session.type} />
      {session.notes ? (
        <Text style={styles.sessionNotes}>{session.notes}</Text>
      ) : null}
    </Card>
  );
}

export function PatientProfileScreen({ go }: { go: (s: Screen) => void }) {
  const { user, signOut } = useAppData();
  const name = user?.fullName ?? 'Usuario';
  const userInitials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  async function handleLogout() {
    await signOut();
    go('login');
  }

  return (
    <View style={styles.full}>
      <NavHeader title="Perfil" />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.profileHead}>
          <Avi initials={userInitials || 'US'} size="lg" />
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.dateText}>{user?.email ?? ''}</Text>
        </View>
        <View style={styles.listGap}>
          <InfoRow icon="mail" label="Email" value={user?.email ?? ''} />
          <InfoRow icon="heart" label="Perfil" value={user?.role === 'PSYCHOLOGIST' ? 'Psicologa' : 'Paciente'} />
          {user?.role === 'PATIENT' && user.psychologist ? (
            <InfoRow icon="user" label="Psicologa" value={user.psychologist.fullName} />
          ) : null}
        </View>
        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <Feather name="log-out" size={15} color={C.muted} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </Pressable>
      </ScrollView>
      {user?.role === 'PSYCHOLOGIST' ? <PsychNav active="p-profile" go={go} /> : <PatientNav active="p-profile" go={go} />}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={15} color={C.terracota} />
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export function PsychHomeScreen({ go }: { go: (s: Screen) => void }) {
  const { user, sessions, patients, selectSession } = useAppData();
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  const now = new Date();
  const todaySessions = sessions
    .filter((session) => new Date(session.date).toDateString() === now.toDateString())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sessionsThisMonth = sessions.filter((session) => {
    const date = new Date(session.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  return (
    <View style={styles.full}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.rowBetweenTop}>
          <View>
            <Text style={styles.dateText}>{today}</Text>
            <Text style={styles.screenTitle}>Bom dia, {user?.fullName ?? 'psicologa'}</Text>
          </View>
          <View style={styles.doctorAvatar}>
            <Text style={styles.doctorAvatarText}>
              {(user?.fullName ?? 'PS')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join('')}
            </Text>
          </View>
        </View>
        <View style={styles.statsGrid}>
          <StatCard n={String(todaySessions.length)} label="Hoje" />
          <StatCard n={String(patients.length)} label="Pacientes" />
          <StatCard n={String(sessionsThisMonth.length)} label="Este mes" />
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Agenda de hoje</Text>
          <Pressable onPress={() => go('psy-session-create')} style={styles.inlineAction}>
            <Feather name="plus" size={12} color={C.terracota} />
            <Text style={styles.linkText}>Nova sessao</Text>
          </Pressable>
        </View>
        <View style={styles.listGap}>
          {todaySessions.length === 0 ? <Text style={styles.emptyText}>Nenhuma sessao para hoje</Text> : null}
          {todaySessions.map((session) => (
            <Pressable
              key={session.id}
              onPress={() => {
                selectSession(session.id);
                go('psy-session-detail');
              }}
              style={styles.todaySession}
            >
              <View style={styles.timeColumn}>
                <Text style={styles.todayTime}>{fmtTime(session.date)}</Text>
              </View>
              <View style={styles.verticalDivider} />
              <Avi initials={session.patientInitials ?? 'PA'} size="sm" />
              <View style={styles.flex}>
                <Text style={styles.todayPatient}>{session.patientName ?? 'Paciente'}</Text>
                <TypeBadge type={session.type} />
              </View>
              <Feather name="chevron-right" size={14} color={C.muted} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <PsychNav active="psy-home" go={go} />
    </View>
  );
}

function StatCard({ n, label }: { n: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{n}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function PatientListScreen({ go }: { go: (s: Screen) => void }) {
  const { patients, selectPatient } = useAppData();

  return (
    <View style={styles.full}>
      <NavHeader
        title="Meus Pacientes"
        right={
          <Pressable onPress={() => go('psy-patient-register')} style={styles.headerAction}>
            <Feather name="plus" size={16} color={C.branco} />
          </Pressable>
        }
      />
      <View style={styles.searchWrap}>
        <TextInput placeholder="Buscar paciente..." placeholderTextColor={C.muted} style={styles.searchInput} />
      </View>
      <ScrollView contentContainerStyle={styles.pageNoTop}>
        {patients.map((patient) => (
          <Pressable
            key={patient.id}
            onPress={() => {
              selectPatient(patient.patientId);
              go('psy-patient-detail');
            }}
            style={styles.patientRow}
          >
            <Avi initials={patient.initials} />
            <View style={styles.flex}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.dateText}>
                {patient.nextSession ? `Proxima: ${fmtDate(patient.nextSession)}` : 'Sem sessao agendada'}
              </Text>
            </View>
            <Feather name="chevron-right" size={14} color={C.muted} />
          </Pressable>
        ))}
      </ScrollView>
      <PsychNav active="psy-patients" go={go} />
    </View>
  );
}

export function PatientRegisterScreen({ go }: { go: (s: Screen) => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { createPatient, isBusy, error, clearError } = useAppData();

  async function handleCreate() {
    try {
      clearError();
      setLocalError(null);

      if (!fullName.trim() || !email.trim()) {
        setLocalError('Preencha nome e email do paciente.');
        return;
      }

      await createPatient({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      });
      go('psy-patient-confirm');
    } catch {
      // O contexto ja publica a mensagem de erro para a tela.
    }
  }

  return (
    <View style={styles.full}>
      <NavHeader title="Novo Paciente" onBack={() => go('psy-patients')} />
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={[text.body, styles.mbXl]}>
          Depois do cadastro, voce podera compartilhar as credenciais de acesso do paciente.
        </Text>
        <View style={styles.form}>
          <Field label="Nome completo" placeholder="Ex: Sofia Mendes" value={fullName} onChangeText={setFullName} />
          <Field
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="paciente@email.com"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            label="Telefone (opcional)"
            keyboardType="phone-pad"
            placeholder="+55 11 9 0000-0000"
            value={phone}
            onChangeText={setPhone}
          />
          {localError || error ? <Text style={styles.errorText}>{localError ?? error}</Text> : null}
        </View>
      </ScrollView>
      <View style={styles.footerAction}>
        <Btn label={isBusy ? 'Cadastrando...' : 'Cadastrar paciente'} onPress={handleCreate} />
      </View>
    </View>
  );
}

export function PatientConfirmScreen({ go }: { go: (s: Screen) => void }) {
  const [copied, setCopied] = useState(false);
  const { createdPatient } = useAppData();

  async function handleShareCredentials() {
    if (!createdPatient?.email || !createdPatient?.provisionalPassword) {
      return;
    }

    const message = [
      `Olá, ${createdPatient.name}.`,
      '',
      'Seu acesso ao app EntreSessoes foi criado.',
      `Email: ${createdPatient.email}`,
      `Senha provisoria: ${createdPatient.provisionalPassword}`,
      '',
      'No primeiro acesso, sera necessario definir uma nova senha.',
    ].join('\n');

    await Share.share({
      title: 'Credenciais de acesso do paciente',
      message,
    });
  }

  return (
    <View style={styles.confirmScreen}>
      <View style={styles.confirmIcon}>
        <Feather name="check-circle" size={26} color={C.oliva} />
      </View>
      <Text style={styles.screenTitle}>Paciente cadastrada!</Text>
      <Text style={styles.confirmText}>
        Envie as credenciais abaixo para {createdPatient?.name ?? 'o paciente'} fazer o primeiro acesso.
      </Text>
      <Card style={styles.confirmCard}>
        <View>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{createdPatient?.email ?? '-'}</Text>
        </View>
        <View style={styles.confirmDivider} />
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.infoLabel}>Senha provisoria</Text>
            <Text style={styles.tempPassword}>{createdPatient?.provisionalPassword ?? '-'}</Text>
          </View>
          <Pressable
            onPress={() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            style={[styles.copyButton, copied && styles.copyButtonDone]}
          >
            <Feather name={copied ? 'check' : 'copy'} size={11} color={copied ? C.oliva : C.muted} />
            <Text style={[styles.copyText, copied && { color: C.oliva }]}>
              {copied ? 'Copiado!' : 'Copiar'}
            </Text>
          </Pressable>
        </View>
      </Card>
      <View style={styles.confirmActions}>
        <Btn label="Compartilhar credenciais" onPress={() => void handleShareCredentials()} />
        <Btn label="Ver lista de pacientes" onPress={() => go('psy-patients')} />
        <Btn label="Cadastrar outro paciente" variant="secondary" onPress={() => go('psy-patient-register')} />
      </View>
    </View>
  );
}

export function PatientDetailScreen({ go }: { go: (s: Screen) => void }) {
  const [tab, setTab] = useState<'sessions' | 'diaries'>('sessions');
  const [daysBack, setDaysBack] = useState('7');
  const {
    patients,
    sessions,
    sharedDiaries,
    selectedPatientId,
    selectSession,
    loadSharedDiaries,
  } = useAppData();
  const patient = patients.find((item) => item.patientId === selectedPatientId) ?? null;
  const patientId = patient?.patientId;
  const loadSharedDiariesRef = useRef(loadSharedDiaries);
  const patientSessions = patient
    ? sessions.filter((session) => session.patientId === patient.patientId)
    : [];

  useEffect(() => {
    loadSharedDiariesRef.current = loadSharedDiaries;
  }, [loadSharedDiaries]);

  useEffect(() => {
    if (patientId && tab === 'diaries') {
      const parsedDaysBack = Number(daysBack);
      const safeDaysBack = Number.isFinite(parsedDaysBack) && parsedDaysBack > 0 ? parsedDaysBack : 7;
      void loadSharedDiariesRef.current(patientId, safeDaysBack);
    }
  }, [daysBack, patientId, tab]);

  return (
    <View style={styles.full}>
      {!patient ? (
        <>
          <NavHeader title="Paciente" onBack={() => go('psy-patients')} />
          <View style={styles.emptyCenter}>
            <Text style={styles.emptyText}>Selecione um paciente para ver os detalhes</Text>
          </View>
        </>
      ) : (
      <>
      <NavHeader title={patient?.name ?? 'Paciente'} onBack={() => go('psy-patients')} />
      <View style={styles.patientHeaderCard}>
        <Avi initials={patient?.initials ?? 'PA'} size="lg" />
        <View style={styles.flex}>
          <Text style={styles.patientDetailName}>{patient?.name ?? 'Paciente'}</Text>
          <Text style={styles.dateText}>{patient?.email ?? ''}</Text>
          <Text style={styles.patientDone}>
            {patientSessions.filter((session) => session.status === 'DONE').length} sessoes realizadas
          </Text>
        </View>
        <Pressable onPress={() => go('psy-session-create')} style={styles.smallPrimary}>
          <Feather name="plus" size={11} color={C.branco} />
          <Text style={styles.smallPrimaryText}>Sessao</Text>
        </Pressable>
      </View>
      <View style={styles.segmentWrap}>
        <Segmented
          active={tab}
          values={[
            { key: 'sessions', label: 'Sessoes' },
            { key: 'diaries', label: 'Diarios compartilhados' },
          ]}
          onChange={setTab}
        />
      </View>
      <ScrollView contentContainerStyle={styles.pageNoTop}>
        {tab === 'sessions' ? (
          <View style={styles.listGap}>
            {patientSessions.map((session) => (
              <Pressable
                key={session.id}
                onPress={() => {
                  selectSession(session.id);
                  go('psy-session-detail');
                }}
                style={styles.patientSessionCard}
              >
                <View style={styles.rowBetween}>
                  <Text style={styles.sessionDate}>{fmtDate(session.date)} · {fmtTime(session.date)}</Text>
                  <SBadge status={session.status} />
                </View>
                <TypeBadge type={session.type} />
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.listGap}>
            <View style={styles.sharedInfo}>
              <Feather name="eye" size={12} color={C.oliva} />
              <Text style={styles.sharedInfoText}>Exibindo diarios compartilhados</Text>
            </View>
            <Field
              label="Dias para tras"
              keyboardType="number-pad"
              placeholder="7"
              value={daysBack}
              onChangeText={setDaysBack}
            />
            {sharedDiaries.map((diary) => {
              const mood = getMood(diary.mood);
              return (
                <Card key={diary.id}>
                  <View style={styles.sharedDiaryRow}>
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    <View style={styles.flex}>
                      <Text style={styles.diaryCardTitle}>{diary.title}</Text>
                      <Text numberOfLines={2} style={styles.diaryCardText}>{diary.text}</Text>
                      <Text style={styles.diaryMiniDate}>{fmtDate(diary.createdAt)}</Text>
                      {diary.audioUrl ? <AudioPlayerCard uri={diary.audioUrl} label="Ouvir audio do paciente" /> : null}
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
      <PsychNav active="psy-patients" go={go} />
      </>
      )}
    </View>
  );
}

export function SessionCreateScreen({ go }: { go: (s: Screen) => void }) {
  const [sType, setSType] = useState<'ONLINE' | 'IN_PERSON'>('ONLINE');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [pickerMode, setPickerMode] = useState<DateTimePickerMode | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const {
    patients,
    selectedPatientId,
    createSession,
    isBusy,
    error,
    clearError,
    selectPatient,
  } = useAppData();
  const patient = patients.find((item) => item.patientId === selectedPatientId) ?? null;

  async function handleCreate() {
    try {
      clearError();
      setLocalError(null);

      if (!patient) {
        setLocalError('Selecione um paciente antes de agendar.');
        return;
      }

      if (!date.trim() || !time.trim()) {
        setLocalError('Preencha data e horario da sessao.');
        return;
      }

      const scheduledAt = new Date(`${date.trim()}T${time.trim()}:00`).toISOString();
      await createSession({
        patientId: patient.patientId,
        scheduledAt,
        durationMinutes: 50,
        type: sType,
        notes: notes.trim() || undefined,
      });
      go('psy-session-detail');
    } catch {
      setLocalError('Verifique a data e o horario informados.');
    }
  }

  return (
    <View style={styles.full}>
      <NavHeader title="Nova Sessao" onBack={() => go('psy-home')} />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.form}>
          <View style={styles.fieldWrapLike}>
            <Text style={styles.fieldCaption}>Paciente</Text>
            <Pressable onPress={() => setShowPatientModal(true)} style={styles.selectedPatient}>
              {patient ? <Avi initials={patient.initials} size="sm" /> : null}
              <Text style={styles.selectedPatientText}>
                {patient?.name ?? 'Selecionar paciente'}
              </Text>
              <Feather name="chevron-down" size={16} color={C.muted} />
            </Pressable>
          </View>
          <PickerField
            label="Data"
            value={date ? getDateLabel(date) : ''}
            placeholder="Selecionar data"
            icon="calendar"
            onPress={() => setPickerMode('date')}
          />
          <PickerField
            label="Horario"
            value={time ? getTimeLabel(time) : ''}
            placeholder="Selecionar horario"
            icon="clock"
            onPress={() => setPickerMode('time')}
          />
          <View style={styles.fieldWrapLike}>
            <Text style={styles.fieldCaption}>Modalidade</Text>
            <View style={styles.typeSelectRow}>
              {(['ONLINE', 'IN_PERSON'] as const).map((type) => {
                const selected = sType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setSType(type)}
                    style={[
                      styles.typeSelect,
                      {
                        backgroundColor: selected ? C.terracota : C.branco,
                        borderColor: selected ? C.terracota : C.bege,
                      },
                    ]}
                  >
                    <Feather name={type === 'ONLINE' ? 'video' : 'map-pin'} size={14} color={selected ? C.branco : C.muted} />
                    <Text style={[styles.typeSelectText, { color: selected ? C.branco : C.muted }]}>
                      {type === 'ONLINE' ? 'Online' : 'Presencial'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Field
            label="Observacoes (opcional)"
            placeholder="Notas sobre esta sessao..."
            multiline
            textAlignVertical="top"
            style={{ minHeight: 90 }}
            value={notes}
            onChangeText={setNotes}
          />
          {localError || error ? <Text style={styles.errorText}>{localError ?? error}</Text> : null}
        </View>
      </ScrollView>
      <View style={styles.footerAction}>
        <Btn label={isBusy ? 'Agendando...' : 'Agendar sessao'} onPress={handleCreate} />
      </View>
      <Modal
        visible={showPatientModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPatientModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>Selecionar paciente</Text>
              <Pressable onPress={() => setShowPatientModal(false)}>
                <Feather name="x" size={18} color={C.muted} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
              {patients.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum paciente encontrado</Text>
              ) : null}
              {patients.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    selectPatient(item.patientId);
                    setShowPatientModal(false);
                  }}
                  style={styles.modalPatientRow}
                >
                  <Avi initials={item.initials} size="sm" />
                  <View style={styles.flex}>
                    <Text style={styles.patientName}>{item.name}</Text>
                    <Text style={styles.dateText}>{item.email}</Text>
                  </View>
                  {selectedPatientId === item.patientId ? (
                    <Feather name="check" size={16} color={C.oliva} />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <SessionDateTimePickerModal
        visible={pickerMode !== null}
        mode={pickerMode ?? 'date'}
        value={buildPickerDate(date, time)}
        onClose={() => setPickerMode(null)}
        onSelect={(selectedDate) => {
          if (pickerMode === 'time') {
            setTime(formatLocalTime(selectedDate));
            return;
          }

          setDate(formatLocalDate(selectedDate));
        }}
      />
    </View>
  );
}

export function SessionDetailScreen({
  go,
  isPatient = false,
}: {
  go: (s: Screen) => void;
  isPatient?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editType, setEditType] = useState<'ONLINE' | 'IN_PERSON'>('ONLINE');
  const [editPickerMode, setEditPickerMode] = useState<DateTimePickerMode | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const loadSessionDetailRef = useRef<ReturnType<typeof useAppData>['loadSessionDetail'] | null>(null);
  const {
    sessions,
    selectedSessionId,
    finishSession,
    cancelSession,
    loadSessionDetail,
    updateSession,
    isBusy,
    error,
    clearError,
    user,
  } = useAppData();
  const session = sessions.find((item) => item.id === selectedSessionId) ?? null;

  useEffect(() => {
    loadSessionDetailRef.current = loadSessionDetail;
  }, [loadSessionDetail]);

  useEffect(() => {
    if (selectedSessionId) {
      void loadSessionDetailRef.current?.(selectedSessionId);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const date = new Date(session.date);
    setEditDate(date.toISOString().slice(0, 10));
    setEditTime(
      `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
    );
    setEditNotes(session.notes);
    setEditType(session.type);
  }, [session]);

  if (!session) {
    return (
      <View style={styles.full}>
        <NavHeader title="Detalhes da Sessao" onBack={() => go(isPatient ? 'p-sessions' : 'psy-home')} />
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyText}>Sessao nao encontrada</Text>
        </View>
      </View>
    );
  }

  const activeSession = session;
  const sessionPsychologistName = activeSession.psych ?? user?.psychologist?.fullName ?? 'Psicologa';

  async function handleFinish() {
    await finishSession(activeSession.id, activeSession.notes || null);
  }

  async function handleCancel() {
    await cancelSession(activeSession.id);
  }

  async function handleUpdate() {
    try {
      clearError();
      setLocalError(null);

      if (!editDate.trim() || !editTime.trim()) {
        setLocalError('Preencha data e horario.');
        return;
      }

      const scheduledAt = new Date(`${editDate.trim()}T${editTime.trim()}:00`).toISOString();
      await updateSession(activeSession.id, {
        scheduledAt,
        type: editType,
        notes: editNotes.trim() || undefined,
        durationMinutes: activeSession.durationMinutes ?? 50,
      });
      setIsEditing(false);
    } catch {
      setLocalError('Nao foi possivel atualizar a sessao.');
    }
  }

  return (
    <View style={styles.full}>
      <NavHeader title="Detalhes da Sessao" onBack={() => go(isPatient ? 'p-sessions' : 'psy-home')} />
      <ScrollView contentContainerStyle={styles.page}>
        <Card style={styles.sessionDetailCard}>
          <View style={styles.rowBetween}>
            <SBadge status={activeSession.status} />
            <TypeBadge type={activeSession.type} />
          </View>
          <Text style={styles.screenTitle}>{fmtDateLong(activeSession.date)}</Text>
          <View style={styles.inlineIconText}>
            <Feather name="clock" size={13} color={C.muted} />
            <Text style={styles.dateText}>{fmtTime(activeSession.date)}</Text>
          </View>
          <View style={styles.personSeparator} />
          <View style={styles.inlineIconText}>
            <Avi
              initials={
                isPatient
                  ? getInitials(sessionPsychologistName)
                  : (activeSession.patientInitials ?? 'PA')
              }
              size="sm"
            />
            <View>
              <Text style={styles.infoLabel}>{isPatient ? 'Psicologa' : 'Paciente'}</Text>
              <Text style={styles.infoValue}>
                {isPatient ? sessionPsychologistName : activeSession.patientName ?? 'Paciente'}
              </Text>
            </View>
          </View>
        </Card>
        {activeSession.notes ? (
          <Card>
            <Text style={styles.infoLabel}>Observacoes</Text>
            <Text style={text.body}>{activeSession.notes}</Text>
          </Card>
        ) : null}
        {isEditing ? (
          <Card>
            <View style={styles.form}>
              <PickerField
                label="Data"
                value={editDate ? getDateLabel(editDate) : ''}
                placeholder="Selecionar data"
                icon="calendar"
                onPress={() => setEditPickerMode('date')}
              />
              <PickerField
                label="Horario"
                value={editTime ? getTimeLabel(editTime) : ''}
                placeholder="Selecionar horario"
                icon="clock"
                onPress={() => setEditPickerMode('time')}
              />
              <View style={styles.typeSelectRow}>
                {(['ONLINE', 'IN_PERSON'] as const).map((type) => {
                  const selected = editType === type;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => setEditType(type)}
                      style={[
                        styles.typeSelect,
                        {
                          backgroundColor: selected ? C.terracota : C.branco,
                          borderColor: selected ? C.terracota : C.bege,
                        },
                      ]}
                    >
                      <Feather name={type === 'ONLINE' ? 'video' : 'map-pin'} size={14} color={selected ? C.branco : C.muted} />
                      <Text style={[styles.typeSelectText, { color: selected ? C.branco : C.muted }]}>
                        {type === 'ONLINE' ? 'Online' : 'Presencial'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Field
                label="Observacoes"
                placeholder="Notas da sessao..."
                multiline
                textAlignVertical="top"
                style={{ minHeight: 90 }}
                value={editNotes}
                onChangeText={setEditNotes}
              />
              {localError || error ? <Text style={styles.errorText}>{localError ?? error}</Text> : null}
              <Btn label={isBusy ? 'Salvando...' : 'Salvar alteracoes'} onPress={handleUpdate} />
              <Btn label="Cancelar edicao" variant="secondary" onPress={() => setIsEditing(false)} />
            </View>
          </Card>
        ) : null}
        {activeSession.status === 'SCHEDULED' && !isPatient ? (
          <View style={styles.form}>
            <Btn label="Concluir sessao" onPress={handleFinish} />
            <Btn label="Editar sessao" variant="secondary" onPress={() => setIsEditing(true)} />
            <Btn label="Cancelar sessao" variant="ghost" onPress={handleCancel} />
          </View>
        ) : null}
      </ScrollView>
      <SessionDateTimePickerModal
        visible={editPickerMode !== null}
        mode={editPickerMode ?? 'date'}
        value={buildPickerDate(editDate, editTime)}
        onClose={() => setEditPickerMode(null)}
        onSelect={(selectedDate) => {
          if (editPickerMode === 'time') {
            setEditTime(formatLocalTime(selectedDate));
            return;
          }

          setEditDate(formatLocalDate(selectedDate));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
    backgroundColor: C.begeLight,
  },
  page: {
    padding: S.xl,
    gap: S.lg,
  },
  pageNoTop: {
    paddingHorizontal: S.xl,
    paddingBottom: S.xl,
    gap: S.md,
  },
  loginCenter: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: S.xxxl,
  },
  logoBlock: {
    alignItems: 'center',
    gap: S.sm,
    marginBottom: 40,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    color: C.preto,
    fontSize: 24,
    fontWeight: '800',
  },
  loginSubtitle: {
    color: C.muted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  rolePill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    borderRadius: 999,
    paddingHorizontal: S.md,
    paddingVertical: 6,
    marginBottom: S.xxl,
    backgroundColor: C.successBg,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.oliva,
  },
  roleText: {
    color: C.oliva,
    fontSize: 12,
    fontWeight: '600',
  },
  form: {
    gap: S.lg,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginTop: -S.sm,
  },
  forgotText: {
    fontSize: 12,
  },
  dynamicPrimary: {
    minHeight: 50,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dynamicPrimaryText: {
    color: C.branco,
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
  footerText: {
    color: C.bege,
    fontSize: 10,
    textAlign: 'center',
    paddingBottom: 40,
  },
  lockBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.terracota,
  },
  screenTitle: {
    color: C.preto,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 25,
  },
  mbXl: {
    marginBottom: S.xl,
  },
  footerAction: {
    flexShrink: 0,
    paddingHorizontal: S.xl,
    paddingTop: S.md,
    paddingBottom: 30,
    backgroundColor: C.begeLight,
  },
  headerBlock: {
    marginBottom: S.md,
  },
  dateText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  nextSession: {
    borderRadius: radius.xl,
    padding: S.lg,
    backgroundColor: C.terracota,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: S.sm,
  },
  rowBetweenTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: S.md,
  },
  whiteOverline: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '600',
  },
  whiteTitle: {
    color: C.branco,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  whiteMeta: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 14,
    marginTop: 2,
  },
  whiteIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  whiteDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: S.md,
    marginBottom: S.md,
  },
  sessionPersonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
  },
  tinyInitials: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tinyInitialsText: {
    color: C.branco,
    fontSize: 9,
    fontWeight: '800',
  },
  whiteMuted: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: S.md,
  },
  quickAction: {
    flex: 1,
    borderRadius: radius.xl,
    padding: S.lg,
    gap: S.sm,
    backgroundColor: C.branco,
  },
  quickIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.begeLight,
  },
  quickLabel: {
    color: C.preto,
    fontSize: 12,
    fontWeight: '800',
  },
  quickSub: {
    color: C.muted,
    fontSize: 10,
  },
  sectionTitle: {
    color: C.preto,
    fontSize: 14,
    fontWeight: '800',
  },
  linkText: {
    color: C.terracota,
    fontSize: 12,
    fontWeight: '600',
  },
  listGap: {
    gap: S.md,
  },
  diaryMini: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: S.md,
    borderRadius: radius.md,
    padding: S.md,
    backgroundColor: C.branco,
  },
  moodEmoji: {
    fontSize: 19,
  },
  flex: {
    flex: 1,
  },
  diaryMiniTitle: {
    flex: 1,
    color: C.preto,
    fontSize: 12,
    fontWeight: '800',
  },
  diaryMiniText: {
    color: C.muted,
    fontSize: 11,
    marginTop: 2,
  },
  diaryMiniDate: {
    color: C.bege,
    fontSize: 10,
    marginTop: 5,
  },
  titleInput: {
    borderBottomWidth: 2,
    borderBottomColor: C.bege,
    paddingBottom: S.sm,
    color: C.preto,
    fontSize: 18,
    fontWeight: '800',
  },
  fieldCaption: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  moodRow: {
    flexDirection: 'row',
    gap: 6,
  },
  moodButton: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingVertical: 10,
  },
  moodButtonEmoji: {
    fontSize: 16,
  },
  moodButtonText: {
    fontSize: 8,
    fontWeight: '700',
  },
  textArea: {
    minHeight: 130,
    borderRadius: radius.md,
    padding: S.lg,
    backgroundColor: C.branco,
    color: C.preto,
    fontSize: 14,
    lineHeight: 23,
  },
  audioButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: S.lg,
    paddingVertical: 10,
  },
  audioText: {
    fontSize: 12,
    fontWeight: '600',
  },
  weatherBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    borderRadius: radius.md,
    paddingHorizontal: S.md,
    paddingVertical: 10,
    backgroundColor: C.branco,
  },
  weatherText: {
    color: C.muted,
    fontSize: 12,
  },
  audioSavedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    borderRadius: radius.md,
    padding: S.md,
    backgroundColor: C.successBg,
  },
  audioSavedText: {
    flex: 1,
    color: C.oliva,
    fontSize: 12,
    fontWeight: '600',
  },
  shareBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: S.md,
    borderRadius: radius.md,
    padding: S.lg,
    backgroundColor: C.branco,
  },
  shareTitle: {
    color: C.preto,
    fontSize: 14,
    fontWeight: '700',
  },
  shareSub: {
    color: C.muted,
    fontSize: 11,
    marginTop: 2,
  },
  headerAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.terracota,
  },
  diaryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: S.md,
    borderRadius: radius.xl,
    padding: S.lg,
    backgroundColor: C.branco,
  },
  diaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.begeLight,
  },
  diaryIconText: {
    fontSize: 20,
  },
  diaryCardTitle: {
    flex: 1,
    color: C.preto,
    fontSize: 14,
    fontWeight: '800',
  },
  diaryCardText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: S.sm,
  },
  diaryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
  },
  moodChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    color: C.muted,
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: C.begeLight,
  },
  tempText: {
    color: C.muted,
    fontSize: 10,
  },
  trashButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bege,
  },
  detailHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: S.md,
  },
  detailEmoji: {
    fontSize: 32,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: S.sm,
  },
  metaText: {
    color: C.muted,
    fontSize: 12,
  },
  inlineIconText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
  },
  detailText: {
    color: C.preto,
    fontSize: 14,
    lineHeight: 26,
  },
  segmentWrap: {
    paddingHorizontal: S.xl,
    paddingTop: S.lg,
    paddingBottom: S.sm,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: C.bege,
  },
  segmentItem: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: C.terracota,
  },
  segmentText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  segmentActiveText: {
    color: C.branco,
  },
  emptyText: {
    color: C.muted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: S.xxxl,
  },
  sessionCard: {
    gap: S.md,
  },
  sessionDate: {
    color: C.preto,
    fontSize: 14,
    fontWeight: '800',
  },
  sessionNotes: {
    borderTopWidth: 1,
    borderTopColor: C.bege,
    paddingTop: S.md,
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  profileHead: {
    alignItems: 'center',
    gap: S.sm,
    marginBottom: S.xl,
  },
  profileName: {
    color: C.preto,
    fontSize: 18,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    borderRadius: radius.md,
    padding: S.lg,
    backgroundColor: C.branco,
  },
  infoLabel: {
    color: C.muted,
    fontSize: 10,
  },
  infoValue: {
    color: C.preto,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    borderRadius: radius.lg,
    paddingVertical: 14,
    backgroundColor: C.bege,
  },
  logoutText: {
    color: C.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.terracota,
  },
  doctorAvatarText: {
    color: C.branco,
    fontSize: 14,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.md,
    paddingHorizontal: S.md,
    paddingVertical: S.md,
    backgroundColor: C.branco,
  },
  statNumber: {
    color: C.terracota,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: C.muted,
    fontSize: 10,
  },
  inlineAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  todaySession: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    borderRadius: radius.xl,
    padding: S.md,
    backgroundColor: C.branco,
  },
  timeColumn: {
    width: 40,
    alignItems: 'center',
  },
  todayTime: {
    color: C.terracota,
    fontSize: 14,
    fontWeight: '800',
  },
  verticalDivider: {
    width: 1,
    height: 32,
    backgroundColor: C.bege,
  },
  todayPatient: {
    color: C.preto,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  searchWrap: {
    paddingHorizontal: S.xl,
    paddingTop: S.md,
    paddingBottom: S.sm,
  },
  searchInput: {
    minHeight: 46,
    borderRadius: radius.md,
    paddingHorizontal: S.lg,
    backgroundColor: C.branco,
    color: C.preto,
    fontSize: 14,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    borderRadius: radius.xl,
    padding: S.lg,
    backgroundColor: C.branco,
  },
  patientName: {
    color: C.preto,
    fontSize: 14,
    fontWeight: '800',
  },
  confirmScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: S.xl,
    backgroundColor: C.begeLight,
  },
  confirmIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S.xl,
    backgroundColor: C.successBg,
  },
  confirmText: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: S.xxl,
  },
  confirmCard: {
    width: '100%',
    marginBottom: S.xl,
    gap: S.md,
  },
  confirmDivider: {
    height: 1,
    backgroundColor: C.bege,
  },
  tempPassword: {
    color: C.terracota,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: S.md,
    paddingVertical: 7,
    backgroundColor: C.begeLight,
  },
  copyButtonDone: {
    backgroundColor: C.successBg,
  },
  copyText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  confirmActions: {
    width: '100%',
    gap: S.md,
  },
  patientHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.lg,
    paddingHorizontal: S.xl,
    paddingVertical: S.lg,
    borderBottomWidth: 1,
    borderBottomColor: C.bege,
    backgroundColor: C.branco,
  },
  patientDetailName: {
    color: C.preto,
    fontSize: 16,
    fontWeight: '800',
  },
  patientDone: {
    color: C.oliva,
    fontSize: 12,
    marginTop: 2,
  },
  smallPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.md,
    paddingHorizontal: S.md,
    paddingVertical: 9,
    backgroundColor: C.terracota,
  },
  smallPrimaryText: {
    color: C.branco,
    fontSize: 12,
    fontWeight: '800',
  },
  patientSessionCard: {
    borderRadius: radius.xl,
    padding: S.lg,
    gap: S.sm,
    backgroundColor: C.branco,
  },
  sharedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    borderRadius: radius.md,
    padding: S.md,
    backgroundColor: C.successBg,
  },
  sharedInfoText: {
    color: C.oliva,
    fontSize: 12,
  },
  sharedDiaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: S.md,
  },
  fieldWrapLike: {
    gap: 6,
  },
  selectedPatient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    borderRadius: radius.md,
    padding: S.md,
    backgroundColor: C.branco,
  },
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: S.md,
    borderRadius: radius.md,
    padding: S.md,
    backgroundColor: C.branco,
  },
  pickerFieldText: {
    color: C.preto,
    fontSize: 14,
    fontWeight: '700',
  },
  pickerPlaceholder: {
    color: C.muted,
    fontWeight: '500',
  },
  selectedPatientText: {
    color: C.preto,
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    padding: S.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '70%',
    borderRadius: radius.xl,
    padding: S.xl,
    gap: S.md,
    backgroundColor: C.begeLight,
  },
  modalList: {
    flexGrow: 0,
  },
  modalListContent: {
    gap: S.sm,
  },
  modalPatientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    borderRadius: radius.lg,
    padding: S.md,
    backgroundColor: C.branco,
  },
  typeSelectRow: {
    flexDirection: 'row',
    gap: S.sm,
  },
  typeSelect: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingVertical: S.md,
  },
  typeSelectText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sessionDetailCard: {
    gap: S.lg,
  },
  personSeparator: {
    height: 1,
    backgroundColor: C.bege,
  },
  errorText: {
    color: '#C0392B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: S.xl,
  },
});
