import { C } from '../theme/tokens';
import { Mood } from '../types/app';

export const MOODS: Mood[] = [
  { id: 'great', label: 'Otima', emoji: '😄', color: C.olivaLight },
  { id: 'good', label: 'Bem', emoji: '😊', color: C.oliva },
  { id: 'neutral', label: 'Neutra', emoji: '😐', color: C.pessego },
  { id: 'sad', label: 'Triste', emoji: '😢', color: C.terracota },
  { id: 'anxious', label: 'Ansiosa', emoji: '😰', color: '#7A5C4E' },
];
