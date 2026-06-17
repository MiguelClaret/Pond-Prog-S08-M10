import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infra/database/database.service';
import { CreateDiaryEntryInput } from '../domain/entities/create-diary-entry-input.entity';
import { DiaryEntryEntity } from '../domain/entities/diary-entry.entity';
import { DiaryEntryOwnerRecord } from '../domain/entities/diary-entry-owner-record.entity';
import { IDiaryRepository } from '../domain/interfaces/diary.repository.interface';

@Injectable()
export class DiaryRepository implements IDiaryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createDiaryEntryInput: CreateDiaryEntryInput): Promise<DiaryEntryEntity> {
    const result = await this.databaseService.query<DiaryEntryEntity>(
      `
        INSERT INTO public.diary_entries (
          patient_id,
          title,
          text,
          mood,
          intensity,
          audio_url,
          is_shared_with_psychologist,
          weather_temperature,
          weather_description,
          latitude,
          longitude
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING
          id,
          patient_id AS "patientId",
          title,
          text,
          mood,
          intensity,
          audio_url AS "audioUrl",
          is_shared_with_psychologist AS "isSharedWithPsychologist",
          weather_temperature AS "weatherTemperature",
          weather_description AS "weatherDescription",
          latitude,
          longitude,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [
        createDiaryEntryInput.patientId,
        createDiaryEntryInput.title,
        createDiaryEntryInput.text,
        createDiaryEntryInput.mood,
        createDiaryEntryInput.intensity,
        createDiaryEntryInput.audioUrl,
        createDiaryEntryInput.isSharedWithPsychologist,
        createDiaryEntryInput.weatherTemperature,
        createDiaryEntryInput.weatherDescription,
        createDiaryEntryInput.latitude,
        createDiaryEntryInput.longitude,
      ],
    );

    return result.rows[0];
  }

  async findByPatientId(patientId: string): Promise<DiaryEntryEntity[]> {
    const result = await this.databaseService.query<DiaryEntryEntity>(
      `
        SELECT
          id,
          patient_id AS "patientId",
          title,
          text,
          mood,
          intensity,
          audio_url AS "audioUrl",
          is_shared_with_psychologist AS "isSharedWithPsychologist",
          weather_temperature AS "weatherTemperature",
          weather_description AS "weatherDescription",
          latitude,
          longitude,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM public.diary_entries
        WHERE patient_id = $1
        ORDER BY created_at DESC
      `,
      [patientId],
    );

    return result.rows;
  }

  async findOwnerById(id: string): Promise<DiaryEntryOwnerRecord | null> {
    const result = await this.databaseService.query<DiaryEntryOwnerRecord>(
      `
        SELECT
          id,
          patient_id AS "patientId"
        FROM public.diary_entries
        WHERE id = $1
        LIMIT 1
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  async updateShare(id: string, isSharedWithPsychologist: boolean): Promise<DiaryEntryEntity> {
    const result = await this.databaseService.query<DiaryEntryEntity>(
      `
        UPDATE public.diary_entries
        SET is_shared_with_psychologist = $2
        WHERE id = $1
        RETURNING
          id,
          patient_id AS "patientId",
          title,
          text,
          mood,
          intensity,
          audio_url AS "audioUrl",
          is_shared_with_psychologist AS "isSharedWithPsychologist",
          weather_temperature AS "weatherTemperature",
          weather_description AS "weatherDescription",
          latitude,
          longitude,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [id, isSharedWithPsychologist],
    );

    return result.rows[0];
  }

  async remove(id: string): Promise<DiaryEntryEntity> {
    const result = await this.databaseService.query<DiaryEntryEntity>(
      `
        DELETE FROM public.diary_entries
        WHERE id = $1
        RETURNING
          id,
          patient_id AS "patientId",
          title,
          text,
          mood,
          intensity,
          audio_url AS "audioUrl",
          is_shared_with_psychologist AS "isSharedWithPsychologist",
          weather_temperature AS "weatherTemperature",
          weather_description AS "weatherDescription",
          latitude,
          longitude,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [id],
    );

    return result.rows[0];
  }

  async patientBelongsToPsychologist(patientId: string, psychologistId: string): Promise<boolean> {
    const result = await this.databaseService.query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM public.patient_profiles
          WHERE patient_user_id = $1
            AND psychologist_id = $2
        ) AS "exists"
      `,
      [patientId, psychologistId],
    );

    return result.rows[0]?.exists ?? false;
  }

  async findSharedByPatientId(patientId: string, daysBack?: number): Promise<DiaryEntryEntity[]> {
    const params: unknown[] = [patientId];
    const dateFilter =
      daysBack !== undefined
        ? `AND created_at >= NOW() - ($2 * INTERVAL '1 day')`
        : '';

    if (daysBack !== undefined) {
      params.push(daysBack);
    }

    const result = await this.databaseService.query<DiaryEntryEntity>(
      `
        SELECT
          id,
          patient_id AS "patientId",
          title,
          text,
          mood,
          intensity,
          audio_url AS "audioUrl",
          is_shared_with_psychologist AS "isSharedWithPsychologist",
          weather_temperature AS "weatherTemperature",
          weather_description AS "weatherDescription",
          latitude,
          longitude,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM public.diary_entries
        WHERE patient_id = $1
          AND is_shared_with_psychologist = TRUE
          ${dateFilter}
        ORDER BY created_at DESC
      `,
      params,
    );

    return result.rows;
  }
}
