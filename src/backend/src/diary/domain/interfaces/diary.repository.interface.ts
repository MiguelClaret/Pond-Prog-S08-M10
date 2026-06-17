import { CreateDiaryEntryInput } from '../entities/create-diary-entry-input.entity';
import { DiaryEntryEntity } from '../entities/diary-entry.entity';
import { DiaryEntryOwnerRecord } from '../entities/diary-entry-owner-record.entity';

export abstract class IDiaryRepository {
  abstract create(createDiaryEntryInput: CreateDiaryEntryInput): Promise<DiaryEntryEntity>;
  abstract findByPatientId(patientId: string): Promise<DiaryEntryEntity[]>;
  abstract findOwnerById(id: string): Promise<DiaryEntryOwnerRecord | null>;
  abstract updateShare(id: string, isSharedWithPsychologist: boolean): Promise<DiaryEntryEntity>;
  abstract remove(id: string): Promise<DiaryEntryEntity>;
  abstract patientBelongsToPsychologist(patientId: string, psychologistId: string): Promise<boolean>;
  abstract findSharedByPatientId(patientId: string, daysBack?: number): Promise<DiaryEntryEntity[]>;
}
