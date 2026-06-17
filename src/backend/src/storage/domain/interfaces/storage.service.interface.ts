import { UploadedAudioFileEntity } from '../../../diary/domain/entities/uploaded-audio-file.entity';

export abstract class IStorageService {
  abstract uploadDiaryAudio(patientId: string, file: UploadedAudioFileEntity): Promise<string>;
}
