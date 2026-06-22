import { Feather } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { PropsWithChildren } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { C, radius, S } from '../theme/tokens';
import { Screen } from '../types/app';

export function NavHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.navHeader}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.backButton}>
          <Feather name="chevron-left" size={16} color={C.preto} />
        </Pressable>
      ) : (
        <View style={styles.headerSlot} />
      )}
      <Text style={styles.navTitle}>{title}</Text>
      {right ?? <View style={styles.headerSlot} />}
    </View>
  );
}

export function Btn({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && styles.btnPrimary,
        variant === 'secondary' && styles.btnSecondary,
        variant === 'ghost' && styles.btnGhost,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.btnText,
          variant === 'secondary' && styles.btnSecondaryText,
          variant === 'ghost' && styles.btnGhostText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  hint,
  style,
  ...props
}: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={C.muted}
        style={[styles.input, style]}
        {...props}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: PropsWithChildren<{ style?: object }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function formatAudioTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function AudioPlayerCard({
  uri,
  label = 'Ouvir audio',
}: {
  uri: string;
  label?: string;
}) {
  const player = useAudioPlayer({ uri }, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  async function handleToggle() {
    if (status.playing) {
      player.pause();
      return;
    }

    if (status.duration > 0 && status.currentTime >= status.duration) {
      await player.seekTo(0);
    }

    player.play();
  }

  return (
    <View style={styles.audioPlayerCard}>
      <Pressable onPress={() => void handleToggle()} style={styles.audioPlayButton}>
        <Feather name={status.playing ? 'pause' : 'play'} size={14} color={C.branco} />
      </Pressable>
      <View style={styles.flex}>
        <Text style={styles.audioPlayerLabel}>{label}</Text>
        <Text style={styles.audioPlayerTime}>
          {formatAudioTime(status.currentTime)} / {formatAudioTime(status.duration)}
        </Text>
      </View>
    </View>
  );
}

export function SBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; text: string; bg: string }> = {
    SCHEDULED: { label: 'Agendada', text: C.successText, bg: C.successBg },
    DONE: { label: 'Concluida', text: C.doneText, bg: C.doneBg },
    CANCELED: { label: 'Cancelada', text: C.cancelText, bg: C.cancelBg },
  };
  const item = map[status] ?? { label: status, text: C.muted, bg: C.bege };

  return (
    <View style={[styles.badge, { backgroundColor: item.bg }]}>
      <Text style={[styles.badgeText, { color: item.text }]}>{item.label}</Text>
    </View>
  );
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <View style={styles.typeBadge}>
      <Feather name={type === 'ONLINE' ? 'video' : 'map-pin'} size={9} color={C.muted} />
      <Text style={styles.typeText}>{type === 'ONLINE' ? 'Online' : 'Presencial'}</Text>
    </View>
  );
}

export function Avi({
  initials,
  size = 'md',
}: {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = {
    sm: { box: 32, text: 11 },
    md: { box: 40, text: 12 },
    lg: { box: 56, text: 16 },
  }[size];

  return (
    <View
      style={[
        styles.avatar,
        {
          width: sizes.box,
          height: sizes.box,
          borderRadius: sizes.box / 2,
        },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: sizes.text }]}>{initials}</Text>
    </View>
  );
}

export function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <Pressable
      onPress={onChange}
      style={[styles.toggle, { backgroundColor: on ? C.oliva : C.bege }]}
    >
      <View style={[styles.toggleDot, { transform: [{ translateX: on ? 20 : 0 }] }]} />
    </Pressable>
  );
}

export function DividerOr() {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.divider} />
      <Text style={styles.dividerText}>ou</Text>
      <View style={styles.divider} />
    </View>
  );
}

export function PatientNav({ active, go }: { active: string; go: (s: Screen) => void }) {
  const tabs: { id: Screen; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { id: 'p-home', label: 'Inicio', icon: 'home' },
    { id: 'p-diary-list', label: 'Diario', icon: 'book-open' },
    { id: 'p-sessions', label: 'Sessoes', icon: 'calendar' },
    { id: 'p-profile', label: 'Perfil', icon: 'user' },
  ];

  return <BottomNav tabs={tabs} active={active} go={go} />;
}

export function PsychNav({ active, go }: { active: string; go: (s: Screen) => void }) {
  const tabs: { id: Screen; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { id: 'psy-home', label: 'Agenda', icon: 'calendar' },
    { id: 'psy-patients', label: 'Pacientes', icon: 'users' },
    { id: 'p-profile', label: 'Perfil', icon: 'user' },
  ];

  return <BottomNav tabs={tabs} active={active} go={go} />;
}

function BottomNav({
  tabs,
  active,
  go,
}: {
  tabs: { id: Screen; label: string; icon: keyof typeof Feather.glyphMap }[];
  active: string;
  go: (s: Screen) => void;
}) {
  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => {
        const selected = active === tab.id;
        return (
          <Pressable key={tab.id} onPress={() => go(tab.id)} style={styles.navItem}>
            <Feather name={tab.icon} size={20} color={selected ? C.terracota : C.muted} />
            <Text style={[styles.navText, { color: selected ? C.terracota : C.muted }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const text = StyleSheet.create({
  serifTitle: {
    color: C.preto,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0,
  },
  title: {
    color: C.preto,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
  },
  subtitle: {
    color: C.preto,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0,
  },
  body: {
    color: C.preto,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0,
  },
  muted: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0,
  },
  tiny: {
    color: C.muted,
    fontSize: 10,
    letterSpacing: 0,
  },
});

const styles = StyleSheet.create({
  navHeader: {
    minHeight: 58,
    paddingHorizontal: S.xl,
    paddingVertical: 14,
    backgroundColor: C.begeLight,
    borderBottomWidth: 1,
    borderBottomColor: C.bege,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bege,
  },
  headerSlot: {
    width: 32,
  },
  navTitle: {
    color: C.preto,
    fontSize: 14,
    fontWeight: '700',
  },
  btn: {
    width: '100%',
    minHeight: 50,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: S.lg,
  },
  btnPrimary: {
    backgroundColor: C.terracota,
  },
  btnSecondary: {
    borderWidth: 1.5,
    borderColor: C.terracota,
    backgroundColor: 'transparent',
  },
  btnGhost: {
    backgroundColor: 'transparent',
  },
  btnText: {
    color: C.branco,
    fontSize: 14,
    fontWeight: '700',
  },
  btnSecondaryText: {
    color: C.terracota,
  },
  btnGhostText: {
    color: C.muted,
  },
  pressed: {
    opacity: 0.74,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    backgroundColor: C.bege,
    color: C.preto,
    fontSize: 14,
  },
  hint: {
    color: C.muted,
    fontSize: 11,
  },
  card: {
    borderRadius: radius.xl,
    padding: S.lg,
    backgroundColor: C.branco,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: C.bege,
  },
  typeText: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  avatar: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.pessego,
  },
  avatarText: {
    color: C.branco,
    fontWeight: '700',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.branco,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    marginVertical: S.xs,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: C.bege,
  },
  dividerText: {
    color: C.muted,
    fontSize: 10,
  },
  flex: {
    flex: 1,
  },
  bottomNav: {
    flexShrink: 0,
    flexDirection: 'row',
    paddingBottom: 4,
    backgroundColor: C.branco,
    borderTopWidth: 1,
    borderTopColor: C.bege,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 10,
  },
  navText: {
    fontSize: 9,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  audioPlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    borderRadius: radius.md,
    padding: S.md,
    backgroundColor: C.branco,
  },
  audioPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.terracota,
  },
  audioPlayerLabel: {
    color: C.preto,
    fontSize: 13,
    fontWeight: '700',
  },
  audioPlayerTime: {
    color: C.muted,
    fontSize: 11,
    marginTop: 2,
  },
});
