export class CreateDiaryEntryInput {
  patientId: string;
  title: string | null;
  text: string | null;
  mood: string;
  intensity: number;
  audioUrl: string | null;
  isSharedWithPsychologist: boolean;
  weatherTemperature: number | null;
  weatherDescription: string | null;
  latitude: number | null;
  longitude: number | null;
}
