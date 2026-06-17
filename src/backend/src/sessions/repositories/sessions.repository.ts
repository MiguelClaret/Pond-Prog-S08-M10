import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infra/database/database.service';
import { SessionStatus } from '../domain/enums/session-status.enum';
import { CreateSessionInput } from '../domain/entities/create-session-input.entity';
import { SessionAccessRecord } from '../domain/entities/session-access-record.entity';
import { SessionEntity } from '../domain/entities/session.entity';
import { UpdateSessionInput } from '../domain/entities/update-session-input.entity';
import { ISessionsRepository } from '../domain/interfaces/sessions.repository.interface';

type CreatedSessionRecord = {
  id: string;
};

@Injectable()
export class SessionsRepository implements ISessionsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findPatientProfileIdByPatientAndPsychologist(
    patientId: string,
    psychologistId: string,
  ): Promise<string | null> {
    const result = await this.databaseService.query<{ patientProfileId: string }>(
      `
        SELECT id AS "patientProfileId"
        FROM public.patient_profiles
        WHERE patient_user_id = $1
          AND psychologist_id = $2
        LIMIT 1
      `,
      [patientId, psychologistId],
    );

    return result.rows[0]?.patientProfileId ?? null;
  }

  async create(createSessionInput: CreateSessionInput): Promise<SessionEntity> {
    const result = await this.databaseService.query<CreatedSessionRecord>(
      `
        INSERT INTO public.therapy_sessions (
          patient_profile_id,
          scheduled_at,
          duration_minutes,
          type,
          notes
        )
        VALUES ($1, $2, $3, $4::public.session_type, $5)
        RETURNING id
      `,
      [
        createSessionInput.patientProfileId,
        createSessionInput.scheduledAt,
        createSessionInput.durationMinutes,
        createSessionInput.type,
        createSessionInput.notes,
      ],
    );

    const created = await this.findAccessibleById(result.rows[0].id);
    return this.toSessionEntity(created!);
  }

  async findRecentAndUpcomingByPsychologistId(psychologistId: string): Promise<SessionEntity[]> {
    const result = await this.databaseService.query<SessionAccessRecord>(
      `
        SELECT
          ts.id,
          ts.patient_profile_id AS "patientProfileId",
          pp.patient_user_id AS "patientId",
          pp.psychologist_id AS "psychologistId",
          ts.scheduled_at AS "scheduledAt",
          ts.duration_minutes AS "durationMinutes",
          ts.type,
          ts.status,
          ts.notes,
          ts.created_at AS "createdAt",
          ts.updated_at AS "updatedAt"
        FROM public.therapy_sessions ts
        JOIN public.patient_profiles pp ON pp.id = ts.patient_profile_id
        WHERE pp.psychologist_id = $1
          AND ts.scheduled_at >= NOW() - INTERVAL '7 days'
        ORDER BY ts.scheduled_at ASC
      `,
      [psychologistId],
    );

    return result.rows.map((row) => this.toSessionEntity(row));
  }

  async findRecentAndUpcomingByPatientUserId(patientUserId: string): Promise<SessionEntity[]> {
    const result = await this.databaseService.query<SessionAccessRecord>(
      `
        SELECT
          ts.id,
          ts.patient_profile_id AS "patientProfileId",
          pp.patient_user_id AS "patientId",
          pp.psychologist_id AS "psychologistId",
          ts.scheduled_at AS "scheduledAt",
          ts.duration_minutes AS "durationMinutes",
          ts.type,
          ts.status,
          ts.notes,
          ts.created_at AS "createdAt",
          ts.updated_at AS "updatedAt"
        FROM public.therapy_sessions ts
        JOIN public.patient_profiles pp ON pp.id = ts.patient_profile_id
        WHERE pp.patient_user_id = $1
          AND ts.scheduled_at >= NOW() - INTERVAL '7 days'
        ORDER BY ts.scheduled_at ASC
      `,
      [patientUserId],
    );

    return result.rows.map((row) => this.toSessionEntity(row));
  }

  async findAccessibleById(id: string): Promise<SessionAccessRecord | null> {
    const result = await this.databaseService.query<SessionAccessRecord>(
      `
        SELECT
          ts.id,
          ts.patient_profile_id AS "patientProfileId",
          pp.patient_user_id AS "patientId",
          pp.psychologist_id AS "psychologistId",
          ts.scheduled_at AS "scheduledAt",
          ts.duration_minutes AS "durationMinutes",
          ts.type,
          ts.status,
          ts.notes,
          ts.created_at AS "createdAt",
          ts.updated_at AS "updatedAt"
        FROM public.therapy_sessions ts
        JOIN public.patient_profiles pp ON pp.id = ts.patient_profile_id
        WHERE ts.id = $1
        LIMIT 1
      `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  async update(id: string, updateSessionInput: UpdateSessionInput): Promise<SessionEntity> {
    const fields: string[] = [];
    const params: unknown[] = [id];

    if (updateSessionInput.scheduledAt !== undefined) {
      fields.push(`scheduled_at = $${params.length + 1}`);
      params.push(updateSessionInput.scheduledAt);
    }

    if (updateSessionInput.durationMinutes !== undefined) {
      fields.push(`duration_minutes = $${params.length + 1}`);
      params.push(updateSessionInput.durationMinutes);
    }

    if (updateSessionInput.type !== undefined) {
      fields.push(`type = $${params.length + 1}::public.session_type`);
      params.push(updateSessionInput.type);
    }

    if (updateSessionInput.notes !== undefined) {
      fields.push(`notes = $${params.length + 1}`);
      params.push(updateSessionInput.notes);
    }

    await this.databaseService.query(
      `
        UPDATE public.therapy_sessions
        SET ${fields.join(', ')}
        WHERE id = $1
      `,
      params,
    );

    const updated = await this.findAccessibleById(id);
    return this.toSessionEntity(updated!);
  }

  async updateStatus(
    id: string,
    status: SessionStatus,
    notes?: string | null,
  ): Promise<SessionEntity> {
    const params: unknown[] = [id, status];
    const notesClause =
      notes !== undefined
        ? `, notes = $${params.push(notes)}`
        : '';

    await this.databaseService.query(
      `
        UPDATE public.therapy_sessions
        SET status = $2::public.session_status
        ${notesClause}
        WHERE id = $1
      `,
      params,
    );

    const updated = await this.findAccessibleById(id);
    return this.toSessionEntity(updated!);
  }

  private toSessionEntity(session: SessionAccessRecord): SessionEntity {
    return {
      id: session.id,
      patientProfileId: session.patientProfileId,
      patientId: session.patientId,
      psychologistId: session.psychologistId,
      scheduledAt: session.scheduledAt,
      durationMinutes: session.durationMinutes,
      type: session.type,
      status: session.status,
      notes: session.notes,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }
}
