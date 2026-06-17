import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../auth/domain/enums/role.enum';
import { SessionStatus } from '../domain/enums/session-status.enum';
import { SessionType } from '../domain/enums/session-type.enum';
import { ISessionsRepository } from '../domain/interfaces/sessions.repository.interface';
import { SessionsService } from './sessions.service';

describe('SessionsService', () => {
  let sessionsService: SessionsService;

  const sessionsRepositoryMock = {
    findPatientProfileIdByPatientAndPsychologist: jest.fn(),
    create: jest.fn(),
    findRecentAndUpcomingByPsychologistId: jest.fn(),
    findRecentAndUpcomingByPatientUserId: jest.fn(),
    findAccessibleById: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: ISessionsRepository,
          useValue: sessionsRepositoryMock,
        },
      ],
    }).compile();

    sessionsService = module.get<SessionsService>(SessionsService);
  });

  it('should create session for psychologist linked patient', async () => {
    sessionsRepositoryMock.findPatientProfileIdByPatientAndPsychologist.mockResolvedValue('profile-1');
    sessionsRepositoryMock.create.mockResolvedValue({ id: 'session-1' });

    await sessionsService.create(
      {
        patientId: 'patient-1',
        scheduledAt: '2026-06-18T15:00:00.000Z',
        durationMinutes: 50,
        type: SessionType.ONLINE,
      },
      {
        sub: 'psychologist-1',
        email: 'psi@example.com',
        role: Role.PSYCHOLOGIST,
      },
    );

    expect(sessionsRepositoryMock.create).toHaveBeenCalledWith({
      patientProfileId: 'profile-1',
      scheduledAt: '2026-06-18T15:00:00.000Z',
      durationMinutes: 50,
      type: SessionType.ONLINE,
      notes: null,
    });
  });

  it('should reject create when requester is not psychologist', async () => {
    await expect(
      sessionsService.create(
        {
          patientId: 'patient-1',
          scheduledAt: '2026-06-18T15:00:00.000Z',
          durationMinutes: 50,
          type: SessionType.ONLINE,
        },
        {
          sub: 'patient-1',
          email: 'patient@example.com',
          role: Role.PATIENT,
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should reject update when session is done', async () => {
    sessionsRepositoryMock.findAccessibleById.mockResolvedValue({
      id: 'session-1',
      psychologistId: 'psychologist-1',
      patientId: 'patient-1',
      status: SessionStatus.DONE,
    });

    await expect(
      sessionsService.update(
        'session-1',
        { notes: 'nova nota' },
        {
          sub: 'psychologist-1',
          email: 'psi@example.com',
          role: Role.PSYCHOLOGIST,
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should group sessions into past and future on findMine', async () => {
    sessionsRepositoryMock.findRecentAndUpcomingByPsychologistId.mockResolvedValue([
      {
        id: 'past-session',
        scheduledAt: '2026-06-16T10:00:00.000Z',
      },
      {
        id: 'future-session',
        scheduledAt: '2026-06-20T10:00:00.000Z',
      },
    ]);

    const result = await sessionsService.findMine({
      sub: 'psychologist-1',
      email: 'psi@example.com',
      role: Role.PSYCHOLOGIST,
    });

    expect(result.past).toHaveLength(1);
    expect(result.future).toHaveLength(1);
  });

  it('should reject get one when patient is not owner', async () => {
    sessionsRepositoryMock.findAccessibleById.mockResolvedValue({
      id: 'session-1',
      patientId: 'patient-2',
      psychologistId: 'psychologist-1',
    });

    await expect(
      sessionsService.findOne('session-1', {
        sub: 'patient-1',
        email: 'patient@example.com',
        role: Role.PATIENT,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should reject finish when session does not exist', async () => {
    sessionsRepositoryMock.findAccessibleById.mockResolvedValue(null);

    await expect(
      sessionsService.finish(
        'missing-session',
        {},
        {
          sub: 'psychologist-1',
          email: 'psi@example.com',
          role: Role.PSYCHOLOGIST,
        },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
