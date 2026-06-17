import { AuthenticatedRequestUser } from '../../../auth/domain/entities/authenticated-request-user.entity';
import { CreateDiaryEntryFormDataDto } from '../dto/create-diary-entry-form-data.dto';
import { ShareDiaryEntryDto } from '../dto/share-diary-entry.dto';
import { DiaryEntryEntity } from '../entities/diary-entry.entity';
import { UploadedAudioFileEntity } from '../entities/uploaded-audio-file.entity';

export abstract class IDiaryService {
  abstract create(
    createDiaryEntryDto: CreateDiaryEntryFormDataDto,
    authenticatedUser: AuthenticatedRequestUser,
    uploadedAudioFile?: UploadedAudioFileEntity,
  ): Promise<DiaryEntryEntity>;
  abstract findMine(authenticatedUser: AuthenticatedRequestUser): Promise<DiaryEntryEntity[]>;
  abstract updateShare(
    id: string,
    shareDiaryEntryDto: ShareDiaryEntryDto,
    authenticatedUser: AuthenticatedRequestUser,
  ): Promise<DiaryEntryEntity>;
  abstract remove(id: string, authenticatedUser: AuthenticatedRequestUser): Promise<DiaryEntryEntity>;
  abstract findSharedDiaryByPatient(
    patientId: string,
    authenticatedUser: AuthenticatedRequestUser,
    daysBack?: string,
  ): Promise<DiaryEntryEntity[]>;
}
