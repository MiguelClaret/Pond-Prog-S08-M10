import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Role } from '../../auth/domain/enums/role.enum';
import { ICreatePatientRepository } from '../domain/interfaces/create-patient.repository.interface';
import { PatientsService } from './patients.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('PatientsService', () => {
  let patientsService: PatientsService;

  const createPatientRepositoryMock = {
    findUserByEmail: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: ICreatePatientRepository,
          useValue: createPatientRepositoryMock,
        },
      ],
    }).compile();

    patientsService = module.get<PatientsService>(PatientsService);
  });

  it('should create patient when requester is psychologist', async () => {
    createPatientRepositoryMock.findUserByEmail.mockResolvedValue(null);
    createPatientRepositoryMock.create.mockResolvedValue({
      patientProfileId: 'profile-1',
      patientId: 'patient-1',
      fullName: 'Joao Silva',
      email: 'joao@example.com',
      phone: '11999999999',
      provisionalPassword: 'abc123def456',
      role: Role.PATIENT,
      firstAccess: true,
      createdAt: new Date('2026-06-16T12:00:00.000Z'),
    });

    const hashMock = bcrypt.hash as jest.Mock;
    hashMock.mockResolvedValue('hashed-password');

    const result = await patientsService.create(
      {
        fullName: 'Joao Silva',
        email: 'joao@example.com',
        phone: '11999999999',
      },
      {
        sub: 'psychologist-1',
        email: 'psi@example.com',
        role: Role.PSYCHOLOGIST,
      },
    );

    expect(createPatientRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        psychologistId: 'psychologist-1',
        fullName: 'Joao Silva',
        email: 'joao@example.com',
        phone: '11999999999',
        passwordHash: 'hashed-password',
      }),
    );
    expect(result.role).toBe(Role.PATIENT);
    expect(result.email).toBe('joao@example.com');
  });

  it('should reject create when requester is not psychologist', async () => {
    await expect(
      patientsService.create(
        {
          fullName: 'Joao Silva',
          email: 'joao@example.com',
          phone: '11999999999',
        },
        {
          sub: 'patient-1',
          email: 'patient@example.com',
          role: Role.PATIENT,
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should reject create when email already exists', async () => {
    createPatientRepositoryMock.findUserByEmail.mockResolvedValue({
      id: 'patient-1',
    });

    await expect(
      patientsService.create(
        {
          fullName: 'Joao Silva',
          email: 'joao@example.com',
          phone: '11999999999',
        },
        {
          sub: 'psychologist-1',
          email: 'psi@example.com',
          role: Role.PSYCHOLOGIST,
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
