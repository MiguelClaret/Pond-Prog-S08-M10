import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedRequestUser } from '../../auth/domain/entities/authenticated-request-user.entity';
import { Role } from '../../auth/domain/enums/role.enum';
import { CreateSessionDto } from '../domain/dto/create-session.dto';
import { FinishSessionDto } from '../domain/dto/finish-session.dto';
import { UpdateSessionDto } from '../domain/dto/update-session.dto';
import { SessionStatus } from '../domain/enums/session-status.enum';
import { SessionType } from '../domain/enums/session-type.enum';
import { CreateSessionInput } from '../domain/entities/create-session-input.entity';
import { SessionAccessRecord } from '../domain/entities/session-access-record.entity';
import { SessionEntity } from '../domain/entities/session.entity';
import { SessionListResponseEntity } from '../domain/entities/session-list-response.entity';
import { UpdateSessionInput } from '../domain/entities/update-session-input.entity';
import { ISessionsRepository } from '../domain/interfaces/sessions.repository.interface';
import { ISessionsService } from '../domain/interfaces/sessions.service.interface';

@Injectable()
export class SessionsService implements ISessionsService {
  constructor(
    @Inject(ISessionsRepository)
    private readonly sessionsRepository: ISessionsRepository,
  ) {}

  async create(
    createSessionDto: CreateSessionDto,
    authenticatedUser: AuthenticatedRequestUser,
  ): Promise<SessionEntity> {
    try {
      this.ensurePsychologist(authenticatedUser, 'Apenas psicologas podem criar sessoes.');
      this.validateDuration(createSessionDto.durationMinutes);
      this.validateSessionType(createSessionDto.type);

      const patientProfileId = await this.sessionsRepository.findPatientProfileIdByPatientAndPsychologist(
        createSessionDto.patientId,
        authenticatedUser.sub,
      );

      if (!patientProfileId) {
        throw new NotFoundException('Paciente nao encontrado para esta psicologa.');
      }

      const input: CreateSessionInput = {
        patientProfileId,
        scheduledAt: createSessionDto.scheduledAt,
        durationMinutes: createSessionDto.durationMinutes,
        type: createSessionDto.type,
        notes: this.normalizeNullableString(createSessionDto.notes),
      };

      return await this.sessionsRepository.create(input);
    } catch (error) {
      this.handleError(error, 'Erro interno ao criar sessao.');
    }
  }

  async findMine(authenticatedUser: AuthenticatedRequestUser): Promise<SessionListResponseEntity> {
    try {
      let sessions: SessionEntity[];

      if (authenticatedUser.role === Role.PSYCHOLOGIST) {
        sessions = await this.sessionsRepository.findRecentAndUpcomingByPsychologistId(
          authenticatedUser.sub,
        );
        return this.groupSessionsByTime(sessions);
      }

      if (authenticatedUser.role === Role.PATIENT) {
        sessions = await this.sessionsRepository.findRecentAndUpcomingByPatientUserId(
          authenticatedUser.sub,
        );
        return this.groupSessionsByTime(sessions);
      }

      throw new ForbiddenException('Usuario nao autorizado para acessar sessoes.');
    } catch (error) {
      this.handleError(error, 'Erro interno ao buscar sessoes.');
    }
  }

  async findOne(id: string, authenticatedUser: AuthenticatedRequestUser): Promise<SessionEntity> {
    try {
      const session = await this.sessionsRepository.findAccessibleById(id);
      if (!session) {
        throw new NotFoundException('Sessao nao encontrada.');
      }

      this.ensureSessionAccess(session, authenticatedUser);
      return this.toSessionEntity(session);
    } catch (error) {
      this.handleError(error, 'Erro interno ao buscar sessao.');
    }
  }

  async update(
    id: string,
    updateSessionDto: UpdateSessionDto,
    authenticatedUser: AuthenticatedRequestUser,
  ): Promise<SessionEntity> {
    try {
      this.ensurePsychologist(authenticatedUser, 'Apenas psicologas podem editar sessoes ativas.');
      const session = await this.getManagedPsychologistSession(id, authenticatedUser.sub);
      this.ensureActiveSession(session);

      const updateInput: UpdateSessionInput = {
        scheduledAt: updateSessionDto.scheduledAt,
        durationMinutes: updateSessionDto.durationMinutes,
        type: updateSessionDto.type,
        notes: updateSessionDto.notes === undefined ? undefined : this.normalizeNullableString(updateSessionDto.notes),
      };

      this.validateUpdatePayload(updateInput);

      if (updateInput.durationMinutes !== undefined) {
        this.validateDuration(updateInput.durationMinutes);
      }

      if (updateInput.type !== undefined) {
        this.validateSessionType(updateInput.type);
      }

      return await this.sessionsRepository.update(session.id, updateInput);
    } catch (error) {
      this.handleError(error, 'Erro interno ao atualizar sessao.');
    }
  }

  async finish(
    id: string,
    finishSessionDto: FinishSessionDto,
    authenticatedUser: AuthenticatedRequestUser,
  ): Promise<SessionEntity> {
    try {
      this.ensurePsychologist(authenticatedUser, 'Apenas psicologas podem concluir sessoes ativas.');
      const session = await this.getManagedPsychologistSession(id, authenticatedUser.sub);
      this.ensureActiveSession(session);

      return await this.sessionsRepository.updateStatus(
        session.id,
        SessionStatus.DONE,
        finishSessionDto.notes === undefined ? undefined : this.normalizeNullableString(finishSessionDto.notes),
      );
    } catch (error) {
      this.handleError(error, 'Erro interno ao concluir sessao.');
    }
  }

  async cancel(id: string, authenticatedUser: AuthenticatedRequestUser): Promise<SessionEntity> {
    try {
      this.ensurePsychologist(authenticatedUser, 'Apenas psicologas podem cancelar sessoes ativas.');
      const session = await this.getManagedPsychologistSession(id, authenticatedUser.sub);
      this.ensureActiveSession(session);

      return await this.sessionsRepository.updateStatus(session.id, SessionStatus.CANCELED);
    } catch (error) {
      this.handleError(error, 'Erro interno ao cancelar sessao.');
    }
  }

  private async getManagedPsychologistSession(
    id: string,
    psychologistId: string,
  ): Promise<SessionAccessRecord> {
    const session = await this.sessionsRepository.findAccessibleById(id);
    if (!session) {
      throw new NotFoundException('Sessao nao encontrada.');
    }

    if (session.psychologistId !== psychologistId) {
      throw new ForbiddenException('Apenas psicologas podem gerenciar sessoes dos seus pacientes.');
    }

    return session;
  }

  private ensureSessionAccess(
    session: SessionAccessRecord,
    authenticatedUser: AuthenticatedRequestUser,
  ): void {
    if (
      authenticatedUser.role === Role.PSYCHOLOGIST &&
      session.psychologistId === authenticatedUser.sub
    ) {
      return;
    }

    if (authenticatedUser.role === Role.PATIENT && session.patientId === authenticatedUser.sub) {
      return;
    }

    throw new ForbiddenException('Usuario nao pode acessar esta sessao.');
  }

  private ensurePsychologist(authenticatedUser: AuthenticatedRequestUser, message: string): void {
    if (authenticatedUser.role !== Role.PSYCHOLOGIST) {
      throw new ForbiddenException(message);
    }
  }

  private ensureActiveSession(session: SessionAccessRecord): void {
    if (session.status === SessionStatus.DONE || session.status === SessionStatus.CANCELED) {
      throw new BadRequestException('Sessao concluida ou cancelada nao pode mais ser alterada.');
    }
  }

  private validateDuration(durationMinutes: number): void {
    if (durationMinutes <= 0) {
      throw new BadRequestException('A duracao da sessao deve ser maior que zero.');
    }
  }

  private validateSessionType(type: SessionType): void {
    if (!Object.values(SessionType).includes(type)) {
      throw new BadRequestException('Tipo de sessao invalido.');
    }
  }

  private validateUpdatePayload(updateInput: UpdateSessionInput): void {
    const hasUpdate =
      updateInput.scheduledAt !== undefined ||
      updateInput.durationMinutes !== undefined ||
      updateInput.type !== undefined ||
      updateInput.notes !== undefined;

    if (!hasUpdate) {
      throw new BadRequestException('Envie ao menos um campo para atualizar a sessao.');
    }
  }

  private normalizeNullableString(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private groupSessionsByTime(sessions: SessionEntity[]): SessionListResponseEntity {
    const now = new Date();

    return sessions.reduce<SessionListResponseEntity>(
      (accumulator, session) => {
        const scheduledAt = new Date(session.scheduledAt);

        if (scheduledAt.getTime() < now.getTime()) {
          accumulator.past.push(session);
        } else {
          accumulator.future.push(session);
        }

        return accumulator;
      },
      {
        past: [],
        future: [],
      },
    );
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

  private handleError(error: unknown, defaultMessage: string): never {
    if (
      error instanceof BadRequestException ||
      error instanceof ForbiddenException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }

    throw new InternalServerErrorException(defaultMessage);
  }
}
